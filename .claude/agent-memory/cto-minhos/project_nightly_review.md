---
name: nightly-review
description: MIN-4714 part 3 (2026-11-15): PR #149 nightly e2e-live review at 38f37e8, changes needed B1 (reds that never reach Linear) and B2 (self-test into pr.yml static); how to probe the reporter
metadata:
  type: project
---

PR #149 (MIN-4727, Cron) reviewed at 38f37e80, comment f31a77b7 on MIN-4714: CHANGES NEEDED.
- B1: the reporter filed nothing for a spec load error, a missing report, or no reports; a job-level timeout cancels the job so a `!cancelled()` reporter is skipped. Fix: one `Nightly red · e2e-live/run ·` issue when `problems` is non-empty, plus per-step `timeout-minutes` (about 5/5/12).
- B2: `node --test scripts/nightly-scripts.test.mjs` into `pr.yml` static, because main's workflow runs the guard and reporter from the `staging` checkout.
- Accepted all four deviations (webkit, `!cancelled()`, Cron as assignee for E2E issues, passcode per step). Linear key stays `LINEAR_API_KEY_BACKEND`.

Facts measured, worth reusing:
- Playwright 1.65.1: a spec that fails to import aborts the WHOLE config; the JSON has `suites: []` and one `errors[]` entry with location `<anonymous>`. `PLAYWRIGHT_JSON_OUTPUT_NAME` with an absolute path into a missing folder works.
- `e2e-live/` is not in tsconfig `include` (only `src`, `vite.config.ts`), so an e2e-live import break is caught only at night.
- No worktree's own `node_modules` in my session worktree; clone one with `cp -cR` from another healthapp worktree whose lockfile matches (see [[clean-replay]]).

**Why:** the nightly's whole promise is "every red is an issue within 24 h" (testing-strategy §3); a red without an issue is the failure mode that matters.
**How to apply:** on the re-review, check only B1/B2 on the new head, replay the self-test and actionlint, and probe the reporter with a pass plus a missing report and a pass plus a load-error report (both must file and exit 1). Then Release merges; `nightly.yml` reaches main only after both secrets are set.
