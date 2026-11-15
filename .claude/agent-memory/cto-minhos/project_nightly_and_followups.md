---
name: project-nightly-and-followups
description: MIN-4714 part 1 (2026-11-15): timeline pilot_from from funding_plan.PILOT_FROM, absent key = no card; nightly is Cron's, Lane C, live only on main, 5 of 7 e2e-live specs
metadata:
  type: project
---

MIN-4714 part 1 GO (comment 0d4edd4b).
- PR 1 (Lane B): MIN-4715 + 4716 + 4717 on one branch.
  - Allowed JSON diff: `timeline.plan.name` (v5) and `timeline.plan.pilot_from` only.
  - `PILOT_FROM = 3` is a named constant in `docs/business/funding_plan.py`, citing team-and-funding-plan.md §3.
  - `test_timeline_plan.py` gets two checks.
  - Parser: an absent or invalid `pilot_from` makes `parseTimeline` return undefined, so the card is not drawn.
- Nightly (PR 2): Cron builds it, Lane C.
  - Targets staging-dev only, behind a guard script.
  - Runs the dashboard, glass and simulation configs. Excludes exam-journey (real Gemini read) and doctor-diagnoses (paid calls).
  - Red runs reach Linear through `LINEAR_API_KEY_NIGHTLY`, copied from Cron's key.

**Why:**
- The healthapp repo had zero GitHub secrets on 2026-11-15.
- No E2E or CTO Linear key exists in `~/.claude/.env.agents`.
- GitHub runs `schedule` and `workflow_dispatch` only from the default branch (main). A workflow merged to `staging` alone is inert.

**How to apply:**
- In part 2, diff the JSON against staging; only those two keys may change.
- Check that `funding-model.py` stdout is byte-identical.
- Check that the nightly has no `pull_request` trigger and no `staging.healthapp` string, and that the passcode comes from `demo-login.env` (dev), never from `demo-login.demo.env`.
- Never compare or print the two passcode files: the auto-mode classifier denies it, and that is correct.

**Part 2 (2026-11-15, comment ddb1d762): MIN-4715 PASS at 42a7b4d.**
- The founder rejected the three-lane chart. MIN-4717 became a duplicate of MIN-4724 (the rework), so PR 1 is MIN-4715 alone.
- The `matches.test.ts:635` fixture keeps "v4" until MIN-4724. That is non-blocking: it is a hand-built parser input, and `plan.name` is never rendered. Making `pilot_from` required forces the fixture edit anyway.
- Proof that the file is not stale and the guard works: regenerate to a scratch directory (22 s), `cmp` with the committed file; then set the key to the wrong value or remove it and check the guard exits 1.
- In zsh, `${PIPESTATUS[0]}` prints empty. Get exit codes with a plain `cmd; echo $?`.

Related: [[project-simulation-timeline]], [[project-staging-real-data]].
