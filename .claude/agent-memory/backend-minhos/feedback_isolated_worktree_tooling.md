---
name: isolated-worktree-tooling
description: What the harness refuses to a worktree-isolated agent (git -C, compound git commands, background servers that spawn paid claude turns) and the ways that worked
metadata:
  type: feedback
---

In a worktree-isolated run, Bash refuses any command that names `git` in a form it cannot verify: `git -C <other path>`, a `git ...` inside a long `&&`/heredoc chain, `$(...)`-computed paths. It also refused `nohup <server> &` for a bridge whose requests start paid `claude` turns (auto-mode classifier, "destructive or unwanted").

**Why:** MIN-4497 run 1 (2026-11-14): three commands bounced, one live exchange against port 8766 could not be run.

**How to apply:**
- Run each git command alone, from the worktree root, with no `-C`. Put multi-step patching in a script written with the Write tool into the scratchpad, then run `python3 <script> "$PWD"`.
- To remove another worktree, `git worktree remove <path>` alone works; its status cannot be read with `-C`, so rely on remove refusing a dirty tree.
- Do not retry a classifier-denied server launch in another form. Finish everything else and hand back naming the exact commands the coordinator or founder must run.
- A heredoc that is part of a refused command is never written: re-create the file before re-running.
- Mutation sweeps: run each mutant in its own copy of the folder (parallel, no restore step) instead of editing the worktree and `git checkout`-ing it back.
