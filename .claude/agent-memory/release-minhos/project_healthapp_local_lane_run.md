---
name: healthapp-local-lane-run
description: How to run healthapp's lane jobs and Deno function tests locally without false failures (port 4173, npm: resolution)
metadata:
  type: project
---

Running healthapp's Lane B checks locally (2026-11-14, PR #30 / MIN-4542):
- `pr.yml` runs only npm jobs (typecheck, test, build, check:static, Playwright smoke). No Deno job, so function changes need a manual Deno run.
- `deno test` / `deno check` in `supabase/functions/` fail on `npm:` imports unless run with `--node-modules-dir=auto` (no `deno.json`; root `package.json` puts Deno in manual node_modules mode). That flag rewrites `deno.lock`, so run it only in a throwaway worktree.
- `deno lint` reports ~34 `no-import-prefix` findings repo-wide; that is the existing pattern, not a regression.
- `npm run test:smoke` uses port 4173 with `--strictPort`; another session's preview can hold it. Check `lsof -iTCP:4173` and retry when free.

**Why:** a first run looked red on all three counts though the change was fine.
**How to apply:** update a PR branch with `git worktree add --detach` + merge staging + fast-forward push, so the builder's worktree stays untouched.
