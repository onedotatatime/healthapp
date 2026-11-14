---
name: healthapp-memory-tracked-rebase
description: healthapp tracks .claude/agent-memory on staging; a worktree branched from main shows it untracked and the rebase onto staging refuses until it is set aside and merged
metadata:
  type: project
---

healthapp `main` (3725e2b) has no agent memory, but `staging` tracks `.claude/agent-memory/<role>/`. A session worktree branched from `main` writes memory as untracked files, and `git rebase origin/staging` aborts ("untracked working tree files would be overwritten").

**Why:** MIN-4527, 2026-11-14: the CEO seat's new lesson and an edited `ceo-minhos/MEMORY.md` sat untracked in the possible-matches worktree.

**How to apply:** copy the untracked memory to the scratchpad, remove the clashing index file, rebase, then append the saved index lines to the staging version and commit the new memory files on the branch. Also: the `Cloudflare Pages` check fails on most healthapp PRs (#12, #13, #16, #18) and is not required; only `static` is a check today until PR #4 brings `pr.yml`.
