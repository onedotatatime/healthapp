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
// Failure semantics, so a red run is never lost silently (MIN-4727, CTO review on MIN-4714 part 3, B1):
//   - Every red run reaches Linear. When any expected report is missing or unreadable, a report carries a run-level error
//     (a spec or config failed to load, so Playwright aborted it), or nothing passed at all, ONE issue is filed for the
//     run: "Nightly red · e2e-live/run · <date>" (or a comment on the open one). It names the report files (base names)
//     and counts only, never error text, which can quote what a spec typed. It is filed next to the per-spec issues.
//   - A Linear failure (no response, HTTP error, GraphQL errors on a 200, success:false) is reported per issue, the
//     process exits 1 and everything that was not filed is written to the job summary ($GITHUB_STEP_SUMMARY) and stdout.
//   - Any red run exits 1: a failing spec, a run problem, or a run where nothing failed but nothing passed either.
//
// Environment: LINEAR_API_KEY_NIGHTLY (not needed for --dry-run), GITHUB_STEP_SUMMARY, RUN_URL or
// GITHUB_SERVER_URL + GITHUB_REPOSITORY + GITHUB_RUN_ID, NIGHTLY_DATE (default: today, UTC),
// LINEAR_API_URL (default https://api.linear.app/graphql; the tests point it at a local stub),
// LINEAR_TEAM_KEY, LINEAR_PROJECT_NAME, LINEAR_LABEL_NAME, LINEAR_ASSIGNEE_EMAIL.
//
// --dry-run : no network. Prints the title and body that would be filed for each failing spec.
// --check   : read-only. Resolves team, project, label and assignee and searches for open issues; writes nothing.
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { pathToFileURL } from 'node:url';

export const TITLE_PREFIX = 'Nightly red';
export const specPrefix = (file) => `${TITLE_PREFIX} · e2e-live/${file} ·`;
export const issueTitle = (file, date) => `${specPrefix(file)} ${date}`;
// The whole-run issue. "run" cannot collide with a spec file: those end in .spec.ts.
export const RUN_KEY = 'run';
export const runPrefix = () => specPrefix(RUN_KEY);
export const runTitle = (date) => issueTitle(RUN_KEY, date);

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

/**
 * Reads every report. `problems` are whole-run problems: {name, kind, count}, with `name` the report's BASE name (not the
 * runner path) and `kind` one of 'missing', 'unreadable', 'run-error'. `reports` is how many reports were expected.
 */
export function readReports(paths) {
  const bySpec = new Map();
  const problems = [];
  for (const p of paths) {
    const name = basename(p);
    if (!existsSync(p)) { problems.push({ name, kind: 'missing', count: 0 }); continue; }
    let report;
    try { report = JSON.parse(readFileSync(p, 'utf8')); } catch { problems.push({ name, kind: 'unreadable', count: 0 }); continue; }
    const runErrors = summariseReport(report, bySpec);
    if (runErrors) problems.push({ name, kind: 'run-error', count: runErrors });
  }
  return { bySpec, problems, reports: paths.length };
}

export const problemLine = ({ name, kind, count }) =>
  kind === 'missing' ? `no report at ${name}`
    : kind === 'unreadable' ? `unreadable report at ${name}`
      : `${count} run-level error(s) in ${name} (see the job log)`;

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

export const findOpenIssue = (call, teamId, file) => findOpenIssueByPrefix(call, teamId, specPrefix(file));

export async function findOpenIssueByPrefix(call, teamId, prefix) {
  const d = await call(
    `query($teamId:ID!,$prefix:String!){
      issues(first:5, filter:{team:{id:{eq:$teamId}}, title:{startsWith:$prefix}, state:{type:{nin:["completed","canceled"]}}}){
        nodes{id identifier url title}
      }
    }`,
    { teamId, prefix },
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

const problemText = (p) =>
  p.kind === 'missing' ? 'missing (the step did not write one: it was red, timed out or did not run)'
    : p.kind === 'unreadable' ? 'unreadable'
      : p.kind === 'empty' ? 'nothing passed (every test was skipped, or no test ran)'
        : `${p.count} run-level error(s) (a spec or its config failed to load)`;

export const runBody = ({ date, problems, reports, runUrl }) =>
  [
    `The nightly e2e-live run was red on ${date} (UTC) before or outside any single spec: ${problems.length} of ${reports} report(s) had a problem.`,
    '',
    'Reports:',
    ...problems.map((p) => `- ${p.name}: ${problemText(p)}`),
    '',
    `Run: ${runUrl}`,
    '',
    'Lane B. Fixed or deleted within 24 hours (testing-strategy §3). Target: staging-dev, synthetic records only. No error text is copied here (it can quote what a spec typed); it is in the run log.',
  ].join('\n');

export const runCommentBody = ({ date, problems, reports, runUrl }) =>
  [`Red again on ${date} (UTC): ${problems.length} of ${reports} report(s) had a problem.`, '', ...problems.map((p) => `- ${p.name}: ${p.kind}${p.kind === 'run-error' ? ` (${p.count})` : ''}`), '', `Run: ${runUrl}`].join('\n');

/** Files one issue, or comments on the open one with the same title prefix. Returns a one-line outcome; throws on a Linear failure. */
export async function fileIssue(call, targets, { prefix, title, description, comment }) {
  const open = await findOpenIssueByPrefix(call, targets.teamId, prefix);
  if (open) {
    const r = await call(
      'mutation($input:CommentCreateInput!){commentCreate(input:$input){success comment{id}}}',
      { input: { issueId: open.id, body: comment } },
    );
    if (r.commentCreate?.success !== true) throw new Error(`Linear did not accept the comment on ${open.identifier}`);
    return `commented on ${open.identifier} ${open.url}`;
  }
  const input = {
    teamId: targets.teamId,
    title,
    description,
    labelIds: [targets.labelId],
    ...(targets.projectId ? { projectId: targets.projectId } : {}),
    ...(targets.assigneeId ? { assigneeId: targets.assigneeId } : {}),
  };
  const r = await call('mutation($input:IssueCreateInput!){issueCreate(input:$input){success issue{id identifier url}}}', { input });
  if (r.issueCreate?.success !== true || !r.issueCreate?.issue) throw new Error('Linear did not accept the new issue');
  return `opened ${r.issueCreate.issue.identifier} ${r.issueCreate.issue.url}`;
}

/** Files one spec's red run. Returns a one-line outcome for the summary; throws on a Linear failure. */
export const fileSpec = (call, targets, { file, failures, date, runUrl }) =>
  fileIssue(call, targets, { prefix: specPrefix(file), title: issueTitle(file, date), description: issueBody({ file, date, failures, runUrl }), comment: commentBody({ date, failures, runUrl }) });

/** Files the whole-run issue (one per run, or a comment on the open one). */
export const fileRun = (call, targets, { problems, reports, date, runUrl }) =>
  fileIssue(call, targets, { prefix: runPrefix(), title: runTitle(date), description: runBody({ date, problems, reports, runUrl }), comment: runCommentBody({ date, problems, reports, runUrl }) });

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

  const { bySpec, problems: runProblems, reports } = readReports(paths);
  const failing = [...bySpec].filter(([, v]) => v.failed > 0).sort(([a], [b]) => a.localeCompare(b));
  const totals = [...bySpec.values()].reduce((t, v) => ({ passed: t.passed + v.passed, failed: t.failed + v.failed, skipped: t.skipped + v.skipped }), { passed: 0, failed: 0, skipped: 0 });
  // A run where nothing failed and nothing passed (all skipped, empty reports) is red too, so an empty run is never green.
  const emptyRun = failing.length === 0 && totals.passed === 0;
  const problems = emptyRun && runProblems.length === 0 ? [{ name: 'all reports', kind: 'empty', count: 0 }] : runProblems;
  const lineOf = (p) => (p.kind === 'empty' ? 'nothing failed, but nothing passed either: every test was skipped or no test ran. Treated as red so an empty run is never green.' : problemLine(p));
  const red = failing.length > 0 || problems.length > 0;

  say(`### Nightly e2e-live, ${date} (UTC)`);
  say(`Target: staging-dev. ${totals.passed} passed, ${totals.failed} failed, ${totals.skipped} skipped across ${bySpec.size} spec file(s).`);
  for (const p of problems) say(`- ${lineOf(p)}`);
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
        if (problems.length) {
          const open = await findOpenIssueByPrefix(call, t.teamId, runPrefix());
          say(`- e2e-live/${RUN_KEY}: ${open ? `would comment on ${open.identifier}` : 'would open a new issue'}`);
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
    if (problems.length) {
      say('');
      say(`DRY RUN (nothing is sent): if no open issue starts with "${runPrefix()}", this issue is opened; otherwise the second text is posted as a comment on it.`);
      say(`Title: ${runTitle(date)}`);
      say(`Team ${cfg.teamKey}, project "${cfg.projectName}", label ${cfg.labelName}, assignee ${cfg.assigneeEmail}`);
      say(runBody({ date, problems, reports, runUrl }));
      say('--- comment form ---');
      say(runCommentBody({ date, problems, reports, runUrl }));
    }
    return finish(0);
  }

  if (!red) return finish(0);

  const notFiled = () => [
    ...failing.map(([file, v]) => `- e2e-live/${file}\n${v.failures.map((f) => `  - ${f}`).join('\n')}`),
    ...(problems.length ? [`- e2e-live/${RUN_KEY}\n${problems.map((p) => `  - ${lineOf(p)}`).join('\n')}`] : []),
  ];
  let targets;
  let call;
  try {
    if (!env.LINEAR_API_KEY_NIGHTLY) throw new Error('LINEAR_API_KEY_NIGHTLY is not set');
    call = linearClient({ key: env.LINEAR_API_KEY_NIGHTLY, url: env.LINEAR_API_URL });
    targets = await resolveTargets(call, cfg);
  } catch (e) {
    say('');
    say(`Linear is not reachable (${e.message}). No issue was opened. Red items:`);
    for (const l of notFiled()) say(l);
    return finish(1);
  }
  for (const w of targets.warnings) say(`- warning: ${w}`);

  // A failing spec that was filed exits 0 (the Playwright step is already red and the issue is the signal). A run problem,
  // or any Linear failure, exits 1: nothing else would have turned the reporter step red.
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
  if (problems.length) {
    try {
      say(`- e2e-live/${RUN_KEY}: ${await fileRun(call, targets, { problems, reports, date, runUrl })}`);
    } catch (e) {
      linearFailed = true;
      say(`- e2e-live/${RUN_KEY}: NOT FILED (${e.message}). Run problems:`);
      for (const p of problems) say(`  - ${lineOf(p)}`);
    }
  }
  return finish(linearFailed || problems.length > 0 ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2), process.env).then((code) => process.exit(code), (e) => { console.error(`nightly-to-linear: ${e?.message ?? e}`); process.exit(1); });
}
