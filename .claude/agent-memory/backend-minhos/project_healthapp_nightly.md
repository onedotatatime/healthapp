---
name: healthapp-nightly
description: MIN-4718 nightly e2e-live workflow: facts measured while building it (webkit, JSON report, Linear filters, E2E assignee convention) and the worktree write-guard that stopped the commit
metadata:
  type: project
---

MIN-4718 (2026-11-15): nightly.yml + `scripts/nightly-guard.sh` + `scripts/nightly-to-linear.mjs` + `scripts/nightly-scripts.test.mjs` + `docs/nightly.md`. Committed on `ci/min-4727-nightly` (PR #149).

- **A PreToolUse hook refuses the Write tool for files in any worktree other than the session's own** ("belongs to a different worktree"), even when the brief says to create and use an own worktree. Bash heredocs into it are not blocked, but the hook text is a policy, so I did not route around it after the first Write bounced. If a brief asks for a separate worktree, check at once whether this session's cwd can write there; if not, build in the scratchpad and hand back with the copy commands, or ask for a session whose cwd is that worktree.
- Playwright 1.65 aborts a whole config when a spec fails to load: the JSON report has `suites: []` and one entry in `errors`, and the exit is non-zero. A step that hits `timeout-minutes` is a failed step, not a cancelled job, so a later `if: !cancelled()` step still runs; the job-level timeout cancels the job and skips it. Hence the per-step timeouts (5, 5, 12) and the `Nightly red · e2e-live/run ·` issue for a missing report or a run-level error.
- Dashboard and glass configs run an iPhone project on **webkit**: `playwright install --with-deps chromium webkit`, not chromium alone (the CTO's wording said chromium).
- Playwright JSON: `PLAYWRIGHT_JSON_OUTPUT_NAME=<path>` with `--reporter=list,json`; top-level suite title equals the file, describes nest as suites, `spec.line`, `tests[].status` is expected/unexpected/flaky/skipped. Local timings on staging-dev: dashboard 70 s, glass 58 s, simulation 314 s (about 7.5 min; 6 designed per-project skips, none passcode related).
- Linear: E2E has no Linear user. E2E issues carry the label Quality Engineer and are assigned to Cron Jobbidis (hello+backend@minhos.ai). Filter shapes that resolve on the real API (verified with a read-only `--check`): `teams(filter:{key:{eq}})`, `issueLabels(filter:{name:{eq}})`, `projects(filter:{name:{eq}})`, `users(filter:{email:{eq}})`, `issues(filter:{team:{id:{eq}}, title:{startsWith}, state:{type:{nin:["completed","canceled"]}}})`.
- The stub Linear server in the tests applies writes, and 3 of 33 mutants first survived because a second guard made the first redundant (errors with no data; success:false with no issue; HTTP 500 with no data). Give the stub a response that is valid except for the one thing under test.
