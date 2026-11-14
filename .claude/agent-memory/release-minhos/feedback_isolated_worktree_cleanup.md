---
name: isolated-worktree-cleanup
description: A worktree-isolated Release run cannot status-check or remove another worktree, nor redirect git output outside its tree; plan cleanup for a non-isolated run
metadata:
  type: feedback
---

In a worktree-isolated run (MIN-4500, 2026-11-14) the harness refused `cd <other worktree> && git status`, any command mixing git with a path outside the worktree (`git show … > /tmp/x`, `$(git rev-parse …)` inside a gh call), and so the dirty check before removing another worktree.

**Why:** the harness only lets git target the agent's own worktree; the brief said to stop and report on such a refusal.

**How to apply:** do the PR work in the isolated worktree, but report "cleanup needs a non-isolated Release run" up front. Run git commands plain and alone; write files outside the tree through a python helper; pass full SHAs literally (gh `--match-head-commit` needs the 40-char SHA). A branch checked out in another worktree cannot be checked out here: work detached and push `HEAD:refs/heads/<branch>`. Related: [[healthapp-memory-tracked-rebase]].
