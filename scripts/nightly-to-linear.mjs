#!/usr/bin/env node
// Nightly red-run reporter (MIN-4718, CTO decision 5 on MIN-4714; conductor testing-strategy §3).
//
//   node scripts/nightly-to-linear.mjs [--dry-run | --check] <playwright-report.json>...
//
// Reads Playwright JSON reporter output (one file per config) and, for every spec file with a failing test, opens ONE
// Linear issue "Nightly red · e2e-live/<file> · <date>" (team minhOS, project "Health app — hackathon prototype", label
// Quality Engineer, Lane B, fixed or deleted within 24 hours). Assignee: E2E has no Linear user, so E2E issues carry the
// Quality Engineer label and are assigned to Cron Jobbidis (hello+backend@minhos.ai), as every other E2E issue of this project.
// If an OPEN issue already carries the same
// "Nightly red · e2e-live/<file> ·" title prefix, it comments on that issue instead, so a spec that stays red is one issue.
//
// What goes into Linear: spec file, line, test titles, project name, the run URL. Never an error message, page text or a
// value: failure messages can quote what a spec typed (the demo passcode), so they stay in the masked Actions log.
//
// Failure semantics, so a red run is never lost silently:
//   - A Linear failure (no response, HTTP error, GraphQL errors on a 200, success:false) is reported per spec, the
//     process exits 1 and the failing specs are written to the job summary ($GITHUB_STEP_SUMMARY) and stdout.
//   - A run where nothing failed but nothing passed either (everything skipped, or no report) also exits 1.
//
// Environment: LINEAR_API_KEY_NIGHTLY (not needed for --dry-run), GITHUB_STEP_SUMMARY, RUN_URL or
// GITHUB_SERVER_URL + GITHUB_REPOSITORY + GITHUB_RUN_ID, NIGHTLY_DATE (default: today, UTC),
// LINEAR_API_URL (default https://api.linear.app/graphql; the tests point it at a local stub),
// LINEAR_TEAM_KEY, LINEAR_PROJECT_NAME, LINEAR_LABEL_NAME, LINEAR_ASSIGNEE_EMAIL.
//
// --dry-run : no network. Prints the title and body that would be filed for each failing spec.
// --check   : read-only. Resolves team, project, label and assignee and searches for open issues; writes nothing.
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const TITLE_PREFIX = 'Nightly red';
export const specPrefix = (file) => `${TITLE_PREFIX} · e2e-live/${file} ·`;
export const issueTitle = (file, date) => `${specPrefix(file)} ${date}`;

const DEFAULTS = {
  teamKey: 'MIN',
  projectName: 'Health app — hackathon prototype',
  labelName: 'Quality Engineer',
  assigneeEmail: 'hello+backend@minhos.ai',
};

// ---- Reading Playwright's JSON report ---------------------------------------------------------------------------

const specFile = (f) => String(f ?? 'unknown').replace(/^.*e2e-live\//, '');

/** Adds one Playwright JSON report to `bySpec` (Map file -> {passed, failed, skipped, failures[]}). Returns run-level error count. */
export function summariseReport(report, bySpec = new Map()) {
  const entry = (file) => {
    if (!bySpec.has(file)) bySpec.set(file, { passed: 0, failed: 0, skipped: 0, failures: [] });
    return bySpec.get(file);
  };
  const walk = (suite, path) => {
    const here = suite.title && suite.title !== suite.file ? [...path, suite.title] : path;
    for (const spec of suite.specs ?? []) {
      const file = specFile(spec.file ?? suite.file);
      for (const t of spec.tests ?? []) {
        const e = entry(file);
        // 'expected' = passed, 'unexpected' = failed or timed out, 'flaky' = passed on retry (a flip is a failure, §3), 'skipped'.
        if (t.status === 'expected') e.passed += 1;
        else if (t.status === 'skipped') e.skipped += 1;
        else {
          e.failed += 1;
          const where = spec.line ? `${file}:${spec.line}` : file;
          const chain = [...here, spec.title].join(' › ');
          e.failures.push(`${where} › ${chain}${t.projectName ? ` [${t.projectName}]` : ''}`);
        }
      }
    }
    for (const child of suite.suites ?? []) walk(child, here);
  };
  for (const s of report.suites ?? []) walk(s, []);
  return Array.isArray(report.errors) ? report.errors.length : 0;
}

export function readReports(paths) {
  const bySpec = new Map();
  const problems = [];
  for (const p of paths) {
    if (!existsSync(p)) { problems.push(`no report at ${p}`); continue; }
    let report;
    try { report = JSON.parse(readFileSync(p, 'utf8')); } catch { problems.push(`unreadable report at ${p}`); continue; }
    const runErrors = summariseReport(report, bySpec);
    if (runErrors) problems.push(`${runErrors} run-level error(s) in ${p} (see the job log)`);
  }
  return { bySpec, problems };
}

// ---- Linear ----------------------------------------------------------------------------------------------------

export function linearClient({ key, url = 'https://api.linear.app/graphql', fetchImpl = fetch }) {
  return async (query, variables = {}) => {
    let res;
    try {
      res = await fetchImpl(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: key },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(30_000),
      });
    } catch (e) {
      throw new Error(`no response from Linear (${e?.cause?.code ?? e?.name ?? 'network error'}); nothing was written`);
    }
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { throw new Error(`Linear answered HTTP ${res.status} with an unreadable body`); }
    if (!res.ok) throw new Error(`Linear answered HTTP ${res.status}`);
    // Linear reports GraphQL errors with HTTP 200 and an `errors` array (MIN-2031): a 200 alone is not success.
    if (Array.isArray(body.errors) && body.errors.length) throw new Error(`Linear GraphQL errors: ${body.errors.map((e) => e.message).join('; ')}`);
    if (!body.data) throw new Error('Linear answered with no data');
    return body.data;
  };
}

export async function resolveTargets(call, cfg) {
  const d = await call(
    `query($team:String!,$proj:String!,$label:String!,$email:String!){
      teams(filter:{key:{eq:$team}}){nodes{id key}}
      projects(filter:{name:{eq:$proj}}){nodes{id name}}
      issueLabels(filter:{name:{eq:$label}}){nodes{id name team{key}}}
      users(filter:{email:{eq:$email}}){nodes{id name}}
    }`,
    { team: cfg.teamKey, proj: cfg.projectName, label: cfg.labelName, email: cfg.assigneeEmail },
  );
  const team = d.teams?.nodes?.[0];
  if (!team) throw new Error(`Linear team ${cfg.teamKey} not found`);
  const labels = d.issueLabels?.nodes ?? [];
  const label = labels.find((l) => l.team?.key === cfg.teamKey) ?? labels.find((l) => !l.team) ?? labels[0];
  if (!label) throw new Error(`Linear label "${cfg.labelName}" not found`);
  return {
    teamId: team.id,
    labelId: label.id,
    // The project and the assignee are best effort: an issue filed without them is still a red run that was not lost.
    projectId: d.projects?.nodes?.[0]?.id ?? null,
    assigneeId: d.users?.nodes?.[0]?.id ?? null,
    warnings: [
      ...(d.projects?.nodes?.[0] ? [] : [`project "${cfg.projectName}" not found: issues are filed without a project`]),
      ...(d.users?.nodes?.[0] ? [] : [`user ${cfg.assigneeEmail} not found: issues are filed unassigned`]),
    ],
  };
}

export async function findOpenIssue(call, teamId, file) {
  const d = await call(
    `query($teamId:ID!,$prefix:String!){
      issues(first:5, filter:{team:{id:{eq:$teamId}}, title:{startsWith:$prefix}, state:{type:{nin:["completed","canceled"]}}}){
        nodes{id identifier url title}
      }
    }`,
    { teamId, prefix: specPrefix(file) },
  );
  return d.issues?.nodes?.[0] ?? null;
}

export const issueBody = ({ file, date, failures, runUrl }) =>
  [
    `The nightly e2e-live run was red on ${date} (UTC) for \`e2e-live/${file}\`.`,
    '',
    'Failing tests:',
    ...failures.map((f) => `- ${f}`),
    '',
    `Run: ${runUrl}`,
    '',
    'Lane B. Fixed or deleted within 24 hours (testing-strategy §3). Target: staging-dev, synthetic records only. No page text or values are copied here; the error is in the run log.',
  ].join('\n');

export const commentBody = ({ date, failures, runUrl }) =>
  [`Red again on ${date} (UTC).`, '', 'Failing tests:', ...failures.map((f) => `- ${f}`), '', `Run: ${runUrl}`].join('\n');

/** Files one spec's red run. Returns a one-line outcome for the summary; throws on a Linear failure. */
export async function fileSpec(call, targets, { file, failures, date, runUrl }) {
  const open = await findOpenIssue(call, targets.teamId, file);
  if (open) {
    const r = await call(
      'mutation($input:CommentCreateInput!){commentCreate(input:$input){success comment{id}}}',
      { input: { issueId: open.id, body: commentBody({ date, failures, runUrl }) } },
    );
    if (r.commentCreate?.success !== true) throw new Error(`Linear did not accept the comment on ${open.identifier}`);
    return `commented on ${open.identifier} ${open.url}`;
  }
  const input = {
    teamId: targets.teamId,
    title: issueTitle(file, date),
    description: issueBody({ file, date, failures, runUrl }),
    labelIds: [targets.labelId],
    ...(targets.projectId ? { projectId: targets.projectId } : {}),
    ...(targets.assigneeId ? { assigneeId: targets.assigneeId } : {}),
  };
  const r = await call('mutation($input:IssueCreateInput!){issueCreate(input:$input){success issue{id identifier url}}}', { input });
  if (r.issueCreate?.success !== true || !r.issueCreate?.issue) throw new Error('Linear did not accept the new issue');
  return `opened ${r.issueCreate.issue.identifier} ${r.issueCreate.issue.url}`;
}

// ---- CLI -------------------------------------------------------------------------------------------------------

export async function main(argv, env, out = (s) => process.stdout.write(`${s}\n`)) {
  const flags = argv.filter((a) => a.startsWith('--'));
  const paths = argv.filter((a) => !a.startsWith('--'));
  const dryRun = flags.includes('--dry-run');
  const check = flags.includes('--check');
  if (flags.some((f) => f !== '--dry-run' && f !== '--check') || (dryRun && check) || (!check && paths.length === 0)) {
    out('usage: nightly-to-linear.mjs [--dry-run | --check] <playwright-report.json>...');
    return 2;
  }
  const date = env.NIGHTLY_DATE || new Date().toISOString().slice(0, 10);
  const runUrl = env.RUN_URL || (env.GITHUB_RUN_ID ? `${env.GITHUB_SERVER_URL ?? 'https://github.com'}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}` : '(local run, no run URL)');
  const cfg = {
    teamKey: env.LINEAR_TEAM_KEY || DEFAULTS.teamKey,
    projectName: env.LINEAR_PROJECT_NAME || DEFAULTS.projectName,
    labelName: env.LINEAR_LABEL_NAME || DEFAULTS.labelName,
    assigneeEmail: env.LINEAR_ASSIGNEE_EMAIL || DEFAULTS.assigneeEmail,
  };

  const lines = [];
  const say = (s = '') => { lines.push(s); out(s); };
  const finish = (code) => {
    if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
    return code;
  };

  const { bySpec, problems } = readReports(paths);
  const failing = [...bySpec].filter(([, v]) => v.failed > 0).sort(([a], [b]) => a.localeCompare(b));
  const totals = [...bySpec.values()].reduce((t, v) => ({ passed: t.passed + v.passed, failed: t.failed + v.failed, skipped: t.skipped + v.skipped }), { passed: 0, failed: 0, skipped: 0 });

  say(`### Nightly e2e-live, ${date} (UTC)`);
  say(`Target: staging-dev. ${totals.passed} passed, ${totals.failed} failed, ${totals.skipped} skipped across ${bySpec.size} spec file(s).`);
  for (const p of problems) say(`- ${p}`);
  for (const [file, v] of [...bySpec].sort(([a], [b]) => a.localeCompare(b))) say(`- e2e-live/${file}: ${v.passed} passed, ${v.failed} failed, ${v.skipped} skipped`);

  if (check || dryRun) {
    // Neither mode writes. --check reads Linear to prove the key and the names resolve; --dry-run touches no network.
    if (check) {
      try {
        if (!env.LINEAR_API_KEY_NIGHTLY) throw new Error('LINEAR_API_KEY_NIGHTLY is not set');
        const call = linearClient({ key: env.LINEAR_API_KEY_NIGHTLY, url: env.LINEAR_API_URL });
        const t = await resolveTargets(call, cfg);
        say(`Linear read ok: team, label${t.projectId ? ', project' : ''}${t.assigneeId ? ', assignee' : ''} resolved.`);
        for (const w of t.warnings) say(`- warning: ${w}`);
        for (const [file] of failing) {
          const open = await findOpenIssue(call, t.teamId, file);
          say(`- e2e-live/${file}: ${open ? `would comment on ${open.identifier}` : 'would open a new issue'}`);
        }
      } catch (e) {
        say(`Linear check FAILED: ${e.message}`);
        return finish(1);
      }
      return finish(0);
    }
    for (const [file, v] of failing) {
      say('');
      say(`DRY RUN (nothing is sent): if no open issue starts with "${specPrefix(file)}", this issue is opened; otherwise the second text is posted as a comment on it.`);
      say(`Title: ${issueTitle(file, date)}`);
      say(`Team ${cfg.teamKey}, project "${cfg.projectName}", label ${cfg.labelName}, assignee ${cfg.assigneeEmail}`);
      say(issueBody({ file, date, failures: v.failures, runUrl }));
      say('--- comment form ---');
      say(commentBody({ date, failures: v.failures, runUrl }));
    }
    return finish(0);
  }

  if (failing.length === 0) {
    if (totals.passed === 0) {
      say('Nothing failed, but nothing passed either: every test was skipped or no report was written. Treated as red so an empty run is never green.');
      return finish(1);
    }
    return finish(0);
  }

  const failedSpecs = () => failing.map(([file, v]) => `- e2e-live/${file}\n${v.failures.map((f) => `  - ${f}`).join('\n')}`);
  let targets;
  let call;
  try {
    if (!env.LINEAR_API_KEY_NIGHTLY) throw new Error('LINEAR_API_KEY_NIGHTLY is not set');
    call = linearClient({ key: env.LINEAR_API_KEY_NIGHTLY, url: env.LINEAR_API_URL });
    targets = await resolveTargets(call, cfg);
  } catch (e) {
    say('');
    say(`Linear is not reachable (${e.message}). No issue was opened. Failing specs:`);
    for (const l of failedSpecs()) say(l);
    return finish(1);
  }
  for (const w of targets.warnings) say(`- warning: ${w}`);

  let linearFailed = false;
  say('');
  say('Linear:');
  for (const [file, v] of failing) {
    try {
      say(`- e2e-live/${file}: ${await fileSpec(call, targets, { file, failures: v.failures, date, runUrl })}`);
    } catch (e) {
      linearFailed = true;
      say(`- e2e-live/${file}: NOT FILED (${e.message}). Failing tests:`);
      for (const f of v.failures) say(`  - ${f}`);
    }
  }
  return finish(linearFailed ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2), process.env).then((code) => process.exit(code), (e) => { console.error(`nightly-to-linear: ${e?.message ?? e}`); process.exit(1); });
}
