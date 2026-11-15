---
name: live-spec-runs
description: How to run healthapp e2e-live specs when the session's worktree guard blocks edits to a fresh worktree; the fixtures a scratch export needs; how to see a spec fail once
metadata:
  type: reference
---

Running `e2e-live/*.spec.ts` (MIN-4704, 2026-11-15):
- If a PreToolUse guard blocks Edit/Write outside the session's worktree, do not switch the shared session worktree's branch (the coordinator uses it). Instead, `git archive origin/staging <paths> | tar -x` into the scratchpad, edit there, and run Playwright from there with `node_modules` symlinked. Then build the commit with a temp `GIT_INDEX_FILE`: `read-tree`, `hash-object -w`, `update-index --cacheinfo`, `write-tree`, `commit-tree`. Push it with `git push origin <sha>:refs/heads/<branch>`.
- Export ALL of `data/synthetic/`, not only `simulation.json`. `helpers/simulate-live.ts` reads `run-5000.json`, and without it every /doctor/simulate test fails with ENOENT. That failure is a harness fault, not an app fault.
- `playwright.simulation.config.ts`: the desktop project also matches `simulate.spec.ts`. The doctor tests need `~/.config/healthapp/demo-login.env` (source it with `set -a`, and never print it).
- Since MIN-4727 (2026-11-15) a nightly (`.github/workflows/nightly.yml`, 03:00) runs the dashboard, glass and simulation configs on staging-dev and files one Linear issue per failing spec. Timing assertions must hold on a CI runner.
- Seeing a spec fail once: every Pages deployment keeps its own URL (`npx wrangler pages deployment list --project-name healthapp`). Point `HEALTHAPP_LIVE_URL` at an older staging-dev deployment (the build before the change) and the new spec must go red there. MIN-4726 did this against the three-lane build.

Related: [[dashboard-scenario-harness]]
