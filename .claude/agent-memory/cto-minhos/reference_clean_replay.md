---
name: clean-replay
description: How to replay healthapp's Lane B jobs on an unpushed head without touching the founder's worktree or .env.local
metadata:
  type: reference
---

A clean replay of a local head works like this. It takes about 1 minute (MIN-4589, 2026-11-15):
1. `git archive <sha> | tar -x -C <scratchpad>/replay`
2. `cp -cR node_modules` from the worktree (an APFS clone, so it is instant). Check that the lockfile matches first.
3. Run typecheck, test, build and test:smoke there. Smoke builds with fake env and serves on :4173 with `--strictPort`, so it never touches :5185.

`npm run check:static` calls git and fails with "not a git repository" in an archive copy. Run that one job in the worktree itself, at the same head, with a clean tree.

**Why:** the brief requires no `.env.local` and the founder's dev server must stay up.
**How to apply:** every post-build review where the head is local or unpushed. See also [[project_stacked_pr_merge_sim]].
