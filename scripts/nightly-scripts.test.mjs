// Tests for the nightly's own scripts (MIN-4718): scripts/nightly-guard.sh, scripts/nightly-to-linear.mjs and the shape of
// .github/workflows/nightly.yml. Run: node --test scripts/nightly-scripts.test.mjs
// They run as the second step of the nightly itself (no dependencies, a few seconds); they are not a PR check.
//
// The Linear stub APPLIES the writes it accepts (an issue it was asked to create is there for the next search), so a
// second run proves "comment, don't open a duplicate" against state, not against a canned answer.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const GUARD = join(here, 'nightly-guard.sh');
const REPORTER = join(here, 'nightly-to-linear.mjs');
const WORKFLOW = resolve(here, '..', '.github', 'workflows', 'nightly.yml');
const DEV = 'https://staging-dev.healthapp-8ui.pages.dev';
// The founder's real records live behind this one. Built from parts so no file in the repo carries it as a literal.
const REAL = ['https://staging', 'healthapp-8ui.pages.dev'].join('.');
const PASSCODE = 'zz-not-a-real-passcode-zz';

const run = (cmd, args, env) =>
  new Promise((res) => {
    const p = spawn(cmd, args, { env: { PATH: process.env.PATH, ...env } });
    let stdout = '';
    let stderr = '';
    p.stdout.on('data', (d) => (stdout += d));
    p.stderr.on('data', (d) => (stderr += d));
    p.on('close', (code) => res({ code, stdout, stderr }));
  });

describe('nightly-guard.sh', () => {
  const guard = (env) => run('bash', [GUARD], env);

  test('passes on the dev twin with a passcode, and never prints the passcode', async () => {
    const r = await guard({ HEALTHAPP_LIVE_URL: DEV, HEALTHAPP_DEMO_PASSCODE: PASSCODE });
    assert.equal(r.code, 0);
    assert.match(r.stdout, /staging-dev\.healthapp-8ui\.pages\.dev/);
    assert.ok(!r.stdout.includes(PASSCODE) && !r.stderr.includes(PASSCODE));
  });

  for (const [name, url] of [
    ['the real-records address', REAL],
    ['the real-records address with a path', `${REAL}/health`],
    ['the dev address with a trailing slash', `${DEV}/`],
    ['the dev address over http', DEV.replace('https', 'http')],
    ['a look-alike host', `${DEV}.evil.example`],
    ['a prefix of the dev address', 'https://staging-dev.healthapp-8ui.pages'],
    ['an empty string', ''],
    ['localhost', 'http://localhost:5173'],
  ]) {
    test(`fails on ${name}`, async () => {
      const r = await guard({ HEALTHAPP_LIVE_URL: url, HEALTHAPP_DEMO_PASSCODE: PASSCODE });
      assert.equal(r.code, 1);
      assert.match(r.stderr, /refusing to run/);
    });
  }

  test('fails when HEALTHAPP_LIVE_URL is unset', async () => {
    const r = await guard({ HEALTHAPP_DEMO_PASSCODE: PASSCODE });
    assert.equal(r.code, 1);
    assert.match(r.stderr, /not set/);
  });

  for (const [name, env] of [
    ['unset', {}],
    ['empty', { HEALTHAPP_DEMO_PASSCODE: '' }],
    ['spaces only', { HEALTHAPP_DEMO_PASSCODE: '   ' }],
  ]) {
    test(`fails when the passcode is ${name}`, async () => {
      const r = await guard({ HEALTHAPP_LIVE_URL: DEV, ...env });
      assert.equal(r.code, 1);
      assert.match(r.stderr, /PASSCODE is empty/);
    });
  }
});

describe('nightly.yml', () => {
  const yml = readFileSync(WORKFLOW, 'utf8');
  const code = yml.split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');

  test('is scheduled at 03:00 UTC plus manual, never on a pull request, never a PR check', () => {
    assert.match(code, /cron: '0 3 \* \* \*'/);
    assert.match(code, /workflow_dispatch:/);
    assert.ok(!/pull_request|pull_request_target|push:/.test(code));
  });

  test('has a 30 minute timeout and checks out staging', () => {
    assert.match(code, /timeout-minutes: 30\b/);
    assert.match(code, /ref: staging\b/);
  });

  test('writes the dev address, and no file of the nightly names the real-records address', () => {
    assert.match(code, new RegExp(`HEALTHAPP_LIVE_URL: ${DEV.replaceAll('.', '\\.')}`));
    for (const f of [WORKFLOW, GUARD, REPORTER]) assert.ok(!readFileSync(f, 'utf8').includes(REAL), `${f} names the real-records address`);
  });

  test('runs the guard first, then the three configs, and leaves out the two real-effect specs', () => {
    const at = (s) => code.indexOf(s);
    assert.ok(at('scripts/nightly-guard.sh') > 0 && at('scripts/nightly-guard.sh') < at('playwright.dashboard.config.ts'));
    assert.ok(at('playwright.dashboard.config.ts') < at('playwright.glass.config.ts') && at('playwright.glass.config.ts') < at('playwright.simulation.config.ts'));
    assert.ok(!/playwright\.live\.config|playwright\.diagnoses\.config|exam-journey|doctor-diagnoses/.test(code));
  });

  test('a spec step cannot run after a failed guard or a failed browser install', () => {
    const steps = code.split(/\n {6}- /).filter((s) => /playwright test/.test(s));
    assert.equal(steps.length, 3);
    for (const s of steps) assert.match(s, /steps\.guard\.outcome == 'success'[\s\S]*steps\.install\.outcome == 'success'/);
  });

  test('secrets are only read through secrets.*, per step, and never echoed', () => {
    assert.ok(!/echo .*secrets\./i.test(code));
    assert.ok(!/\n {4}env:[\s\S]*?secrets\.[\s\S]*?\n {4}steps:/.test(code), 'a secret sits in the job-level env');
    assert.equal((code.match(/secrets\.HEALTHAPP_DEMO_PASSCODE/g) ?? []).length, 4);
    assert.equal((code.match(/secrets\.LINEAR_API_KEY_NIGHTLY/g) ?? []).length, 1);
  });
});

// ---- A Linear stub that applies the writes it accepts -------------------------------------------------------------

function makeStub() {
  const s = { issues: [], comments: [], requests: [], mutations: 0, mode: 'ok', bodies: [], searches: [] };
  s.server = createServer((req, res) => {
    let raw = '';
    req.on('data', (d) => (raw += d));
    req.on('end', () => {
      const { query, variables: v } = JSON.parse(raw);
      s.requests.push(query);
      s.bodies.push(raw);
      const send = (status, obj) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(typeof obj === 'string' ? obj : JSON.stringify(obj)); };
      if (s.mode === 'http500') return send(500, { data: { teams: { nodes: [{ id: 'team-1', key: 'MIN' }] }, issueLabels: { nodes: [{ id: 'label-1', name: 'x', team: null }] } } });
      if (s.mode === 'graphql-errors') return send(200, { errors: [{ message: 'Entity not found' }] });
      // Errors next to a data object that looks fine: a 200 with data is still a failure when `errors` is present.
      if (s.mode === 'errors-with-data') return send(200, { errors: [{ message: 'Partial failure' }], data: { teams: { nodes: [{ id: 'team-1', key: 'MIN' }] }, projects: { nodes: [] }, issueLabels: { nodes: [{ id: 'label-1', name: 'x', team: null }] }, users: { nodes: [] }, issues: { nodes: [] } } });
      if (s.mode === 'garbage') return send(200, 'not json');
      if (query.includes('teams(')) {
        return send(200, { data: {
          teams: { nodes: [{ id: 'team-1', key: v.team }] },
          projects: { nodes: [{ id: 'proj-1', name: v.proj }] },
          issueLabels: { nodes: [{ id: 'label-other-team', name: v.label, team: { key: 'ZZZ' } }, { id: 'label-1', name: v.label, team: { key: 'MIN' } }] },
          users: { nodes: s.noUser ? [] : [{ id: 'user-e2e', name: 'E2E' }] },
        } });
      }
      if (query.includes('issueCreate')) {
        s.mutations += 1;
        if (s.mode === 'create-refused' && v.input.title.includes('simulate.spec.ts')) return send(200, { data: { issueCreate: { success: false, issue: { id: 'id-x', identifier: 'MIN-0', url: 'https://linear.test/none' } } } });
        const n = s.issues.length + 1;
        const issue = { id: `id-${n}`, identifier: `MIN-${9000 + n}`, url: `https://linear.test/MIN-${9000 + n}`, state: 'started', ...v.input };
        s.issues.push(issue);
        return send(200, { data: { issueCreate: { success: true, issue } } });
      }
      if (query.includes('commentCreate')) {
        s.mutations += 1;
        s.comments.push(v.input);
        return send(200, { data: { commentCreate: { success: true, comment: { id: `c-${s.comments.length}` } } } });
      }
      if (query.includes('issues(')) {
        s.searches.push({ query, prefix: v.prefix });
        const nodes = s.issues.filter((i) => i.teamId === v.teamId && i.title.startsWith(v.prefix) && !['completed', 'canceled'].includes(i.state));
        return send(200, { data: { issues: { nodes } } });
      }
      return send(200, { errors: [{ message: `stub: unknown query ${query.slice(0, 40)}` }] });
    });
  });
  return s;
}

const test2 = (title, status = 'unexpected', projectName = 'desktop-1280') => ({ title, status, projectName });
// Same shape as Playwright's JSON reporter (checked against a real report from the dashboard config on staging-dev).
function makeReport(files, errors = []) {
  return {
    errors,
    suites: files.map(({ file, specs }) => ({
      title: file, file, line: 0, column: 0,
      suites: [{ title: 'describe block', file, line: 3, column: 6, specs: specs.map(({ title, line, tests }) => ({ title, ok: tests.every((t) => t.status !== 'unexpected'), file, line, column: 3, tests: tests.map((t) => ({ projectName: t.projectName, status: t.status, expectedStatus: 'passed', results: [{ status: t.status === 'unexpected' ? 'failed' : 'passed', error: { message: `expected "${PASSCODE}" and the page said: private page text` } }] })) })) }],
    })),
  };
}

describe('nightly-to-linear.mjs', () => {
  let stub;
  let url;
  let dir;
  before(async () => {
    await new Promise((r) => (stub = makeStub()).server.listen(0, '127.0.0.1', r));
    url = `http://127.0.0.1:${stub.server.address().port}/graphql`;
    dir = mkdtempSync(join(tmpdir(), 'nightly-test-'));
  });
  after(() => stub.server.close());

  let n = 0;
  const writeReport = (rep) => { const p = join(dir, `r${n++}.json`); writeFileSync(p, JSON.stringify(rep)); return p; };
  const reset = (mode = 'ok') => { stub.searches = []; stub.issues = []; stub.comments = []; stub.requests = []; stub.bodies = []; stub.mutations = 0; stub.mode = mode; stub.noUser = false; };
  const cli = (args, extra = {}) => {
    const summary = join(dir, `summary${n++}.md`);
    writeFileSync(summary, '');
    return run(process.execPath, [REPORTER, ...args], { LINEAR_API_URL: url, LINEAR_API_KEY_NIGHTLY: 'lin-test-key', NIGHTLY_DATE: '2026-11-16', RUN_URL: 'https://github.test/run/1', GITHUB_STEP_SUMMARY: summary, ...extra })
      .then((r) => ({ ...r, summary: readFileSync(summary, 'utf8') }));
  };

  const red = () => makeReport([
    { file: 'doctor-dashboard.spec.ts', specs: [{ title: 'D1 opening', line: 97, tests: [test2('x', 'unexpected', 'phone-390'), test2('x', 'expected')] }, { title: 'D2 ok', line: 120, tests: [test2('x', 'expected')] }] },
    { file: 'simulate.spec.ts', specs: [{ title: 'S1 run', line: 50, tests: [test2('x', 'unexpected')] }] },
    { file: 'recruit.spec.ts', specs: [{ title: 'R1 fine', line: 12, tests: [test2('x', 'expected')] }] },
  ]);

  test('one issue per failing spec file, none for passing ones, only titles and ids in the text', async () => {
    reset();
    const r = await cli([writeReport(red())]);
    assert.equal(r.code, 0, r.stdout);
    assert.equal(stub.issues.length, 2);
    const [a, b] = stub.issues;
    assert.equal(a.title, 'Nightly red · e2e-live/doctor-dashboard.spec.ts · 2026-11-16');
    assert.equal(b.title, 'Nightly red · e2e-live/simulate.spec.ts · 2026-11-16');
    for (const i of stub.issues) {
      assert.equal(i.teamId, 'team-1');
      assert.deepEqual(i.labelIds, ['label-1']); // the label of the team, not the same-named one of another team
      assert.equal(i.projectId, 'proj-1');
      assert.equal(i.assigneeId, 'user-e2e');
      assert.match(i.description, /Lane B\. Fixed or deleted within 24 hours/);
      assert.match(i.description, /Run: https:\/\/github\.test\/run\/1/);
    }
    assert.match(a.description, /- doctor-dashboard\.spec\.ts:97 › describe block › D1 opening \[phone-390\]/);
    assert.ok(!a.description.includes('D2 ok'), 'a passing test is listed as failing');
    // The failure message of the fixture quotes the passcode and page text: none of it may reach Linear.
    for (const body of stub.bodies) assert.ok(!body.includes(PASSCODE) && !body.includes('private page text'), 'error text reached Linear');
    assert.match(r.summary, /opened MIN-9001/);
    assert.match(r.summary, /doctor-dashboard\.spec\.ts: 2 passed, 1 failed/);
  });

  test('a second red run for the same spec comments on the open issue and opens nothing', async () => {
    reset();
    const p = writeReport(red());
    await cli([p]);
    const r = await cli([p], { NIGHTLY_DATE: '2026-11-17' });
    assert.equal(r.code, 0);
    assert.equal(stub.issues.length, 2, 'a duplicate issue was opened');
    assert.equal(stub.comments.length, 2);
    assert.equal(stub.comments[0].issueId, 'id-1');
    assert.match(stub.comments[0].body, /Red again on 2026-11-17/);
    assert.match(r.summary, /commented on MIN-9001/);
  });

  test('the open-issue search asks Linear for the exact title prefix and excludes completed and canceled issues', async () => {
    reset();
    await cli([writeReport(red())]);
    const q = stub.searches[0];
    assert.match(q.query, /title:\{startsWith:\$prefix\}/);
    assert.match(q.query, /state:\{type:\{nin:\["completed","canceled"\]\}\}/);
    assert.equal(q.prefix, 'Nightly red · e2e-live/doctor-dashboard.spec.ts ·');
  });

  test('a test that flipped (flaky) counts as red, a skipped one does not', async () => {
    reset();
    const r = await cli([writeReport(makeReport([
      { file: 'recruit.spec.ts', specs: [{ title: 'flips', line: 7, tests: [test2('x', 'flaky')] }] },
      { file: 'simulations.spec.ts', specs: [{ title: 'skips', line: 9, tests: [test2('x', 'skipped'), test2('y', 'expected')] }] },
    ]))]);
    assert.equal(r.code, 0);
    assert.equal(stub.issues.length, 1);
    assert.match(stub.issues[0].title, /recruit\.spec\.ts/);
  });

  test('a closed issue does not absorb a new red: a new one is opened', async () => {
    reset();
    const p = writeReport(red());
    await cli([p]);
    stub.issues.forEach((i) => (i.state = 'completed'));
    await cli([p], { NIGHTLY_DATE: '2026-11-17' });
    assert.equal(stub.issues.length, 4);
    assert.equal(stub.comments.length, 0);
  });

  test('simulate.spec.ts does not match an open issue of simulations.spec.ts', async () => {
    reset();
    await cli([writeReport(makeReport([{ file: 'simulations.spec.ts', specs: [{ title: 'A', line: 1, tests: [test2('x')] }] }]))]);
    await cli([writeReport(makeReport([{ file: 'simulate.spec.ts', specs: [{ title: 'B', line: 1, tests: [test2('x')] }] }]))]);
    assert.equal(stub.issues.length, 2);
    assert.equal(stub.comments.length, 0);
  });

  test('a green run writes the summary, exits 0 and does not call Linear', async () => {
    reset();
    const r = await cli([writeReport(makeReport([{ file: 'recruit.spec.ts', specs: [{ title: 'ok', line: 1, tests: [test2('x', 'expected')] }] }]))]);
    assert.equal(r.code, 0);
    assert.equal(stub.requests.length, 0);
    assert.match(r.summary, /1 passed, 0 failed, 0 skipped/);
  });

  test('a run where everything was skipped, or no report exists, is red', async () => {
    reset();
    const skipped = await cli([writeReport(makeReport([{ file: 'recruit.spec.ts', specs: [{ title: 's', line: 1, tests: [test2('x', 'skipped')] }] }]))]);
    assert.equal(skipped.code, 1);
    assert.match(skipped.summary, /nothing passed either/);
    const none = await cli([join(dir, 'does-not-exist.json')]);
    assert.equal(none.code, 1);
    assert.match(none.summary, /no report at/);
  });

  for (const [mode, reason] of [['http500', /HTTP 500/], ['graphql-errors', /Entity not found/], ['errors-with-data', /Partial failure/], ['garbage', /unreadable body/]]) {
    test(`Linear failing (${mode}): the job stays red and the job summary lists the failing specs`, async () => {
      reset(mode);
      const r = await cli([writeReport(red())]);
      assert.equal(r.code, 1);
      assert.equal(stub.issues.length, 0);
      assert.match(r.summary, /No issue was opened/);
      assert.match(r.summary, reason);
      assert.match(r.summary, /e2e-live\/doctor-dashboard\.spec\.ts/);
      assert.match(r.summary, /doctor-dashboard\.spec\.ts:97 › describe block › D1 opening \[phone-390\]/);
      assert.match(r.summary, /e2e-live\/simulate\.spec\.ts/);
    });
  }

  test('Linear unreachable (connection refused) or no key: red, specs listed', async () => {
    reset();
    const dead = await cli([writeReport(red())], { LINEAR_API_URL: 'http://127.0.0.1:9/graphql' });
    assert.equal(dead.code, 1);
    assert.match(dead.summary, /e2e-live\/simulate\.spec\.ts/);
    const nokey = await cli([writeReport(red())], { LINEAR_API_KEY_NIGHTLY: '' });
    assert.equal(nokey.code, 1);
    assert.match(nokey.summary, /LINEAR_API_KEY_NIGHTLY is not set/);
    assert.match(nokey.summary, /e2e-live\/doctor-dashboard\.spec\.ts/);
  });

  test('Linear refusing one issue (success:false): that spec is listed as NOT FILED, the other is still filed, exit 1', async () => {
    reset('create-refused');
    const r = await cli([writeReport(red())]);
    assert.equal(r.code, 1);
    assert.equal(stub.issues.length, 1);
    assert.match(r.summary, /doctor-dashboard\.spec\.ts: opened MIN-9001/);
    assert.match(r.summary, /simulate\.spec\.ts: NOT FILED/);
    assert.match(r.summary, /simulate\.spec\.ts:50 › describe block › S1 run \[desktop-1280\]/);
  });

  test('an unknown assignee still files the issue, unassigned, with a warning', async () => {
    reset();
    stub.noUser = true;
    const r = await cli([writeReport(red())]);
    assert.equal(r.code, 0);
    assert.equal(stub.issues[0].assigneeId, undefined);
    assert.match(r.summary, /filed unassigned/);
  });

  test('--dry-run sends nothing, needs no key, and prints the title and body', async () => {
    reset();
    const r = await cli(['--dry-run', writeReport(red())], { LINEAR_API_KEY_NIGHTLY: '' });
    assert.equal(r.code, 0);
    assert.equal(stub.requests.length, 0);
    assert.match(r.stdout, /Title: Nightly red · e2e-live\/simulate\.spec\.ts · 2026-11-16/);
    assert.match(r.stdout, /DRY RUN \(nothing is sent\)/);
  });

  test('--check reads Linear and writes nothing', async () => {
    reset();
    const r = await cli(['--check', writeReport(red())]);
    assert.equal(r.code, 0);
    assert.equal(stub.mutations, 0);
    assert.ok(stub.requests.length >= 2);
    assert.match(r.stdout, /Linear read ok/);
    assert.match(r.stdout, /would open a new issue/);
  });

  test('bad usage exits 2', async () => {
    assert.equal((await cli([])).code, 2);
    assert.equal((await cli(['--nope', 'x.json'])).code, 2);
  });
});
