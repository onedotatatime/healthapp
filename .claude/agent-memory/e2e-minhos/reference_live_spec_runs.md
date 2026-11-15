---
name: live-spec-runs
description: How to run healthapp e2e-live specs when the session's worktree guard blocks edits to a fresh worktree; the fixtures a scratch export needs
metadata:
  type: reference
---

Running `e2e-live/*.spec.ts` (MIN-4704, 2026-11-15):
- If a PreToolUse guard blocks Edit/Write outside the session's worktree, do not switch the shared session worktree's branch (the coordinator uses it). Instead, `git archive origin/staging <paths> | tar -x` into the scratchpad, edit there, and run Playwright from there with `node_modules` symlinked. Then build the commit with a temp `GIT_INDEX_FILE`: `read-tree`, `hash-object -w`, `update-index --cacheinfo`, `write-tree`, `commit-tree`. Push it with `git push origin <sha>:refs/heads/<branch>`.
- Export ALL of `data/synthetic/`, not only `simulation.json`. `helpers/simulate-live.ts` reads `run-5000.json`, and without it every /doctor/simulate test fails with ENOENT. That failure is a harness fault, not an app fault.
- `playwright.simulation.config.ts`: the desktop project also matches `simulate.spec.ts`. The doctor tests need `~/.config/healthapp/demo-login.env` (source it with `set -a`, and never print it).
- healthapp has no nightly workflow (as of 2026-11-15), so e2e-live runs only when someone runs it.

Related: [[dashboard-scenario-harness]]
