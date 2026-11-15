---
name: quoted-heredoc
description: Never build a PR body or comment with an unquoted heredoc; backticks in markdown run as commands in the shell's cwd, which in a dispatched run is the coordinator's worktree
metadata:
  type: feedback
---

Write markdown bodies (PR bodies, Linear comments, commit messages) with the Write tool or a quoted heredoc (`<<'EOF'`), never `<<EOF`. In an unquoted heredoc every `` `npm ci` `` or `` `deno check …` `` in the text is command substitution.

**Why:** MIN-4671, 2026-11-15: a results table in a `python3 - <<EOF` block ran `npm ci`, `npm run build`, `npm run test:smoke`, `deno check` and `deno test` in the shell's start directory, the coordinator's worktree. It rewrote that worktree's tracked `deno.lock`, rebuilt `node_modules`, `dist/` and `test-results/`, and put 500 lines of tool output into the PR body. The auto-mode classifier then refused `git checkout -- deno.lock` there, so the coordinator had to restore it.

**How to apply:** every Bash call that carries markdown. Pass text to tools through files written by Write, and keep every Bash call's first command a `cd` into your own worktree or scratchpad. In a run isolated to the coordinator's worktree, the Write hook also refuses files in any other worktree, so memory waits for a non-isolated run. Related: [[release-audit-cleanup]] (never write in the coordinator's worktree).
