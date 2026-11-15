---
name: assigned-worktree-blocked-commit-plumbing
description: when the brief names another worktree the edit hook blocks, build in the session worktree and commit onto the named branch's tip with a temp index (MIN-4724); plus the perf/shots harness that worked
metadata:
  type: feedback
---

The Write/Edit hook refuses any file outside the session's own worktree, even when the brief names another worktree as mine. Do not write there through Bash to get around it. Build in the session worktree (copy any file the session's HEAD lacks with `git show <branch>:path`), then commit onto the named branch's tip without switching: `GIT_INDEX_FILE=<scratch>/idx git read-tree <tip>; git add <my files>; git write-tree; git commit-tree <tree> -p <tip> -m ...; git branch <new> <commit>`. Hand back the one-line `merge --ff-only`. Verify the commit in a scratch `git worktree add --detach` + `npm ci`, then remove it. Restore the session worktree's files afterwards so nobody commits them by accident.

**Why:** MIN-4724 (2026-11-15). **How to apply:** check `git worktree list` and the hook's message first; a stray Bash edit in the other worktree must be reverted at once.

Evidence harness that worked (scratchpad `.mjs`, playwright-core from node_modules, never a repo spec): vite build `--minify false --outDir <scratch>` with the smoke.invalid env, `vite preview --outDir`; CDP `Emulation.setCPUThrottlingRate`, `Performance.getMetrics` ScriptDuration deltas over a counted-rAF window; wrap `requestAnimationFrame` to time the card's own tick; a React DevTools hook stub counting PerformedWork on the component's fiber for render counts; override `performance.now` (offset and freeze) to land a timed animation mid-month for screenshots; a sticky label bar covers an element screenshot, so clip a fullPage screenshot from scroll 0. zsh does not word-split `$cfg` in a loop.
