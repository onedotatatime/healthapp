---
name: release-audit-cleanup
description: How a full healthapp release audit cleans branches and worktrees safely; what the auto-mode classifier refuses; never write memory into the coordinator's worktree
metadata:
  type: feedback
---

Audit of every PR, branch and worktree (MIN-4618, 2026-11-15, founder: "release needs to see NOW what is going on with all the releases and the prs and fix them to continue").

- **Merged means on `origin/main` and deployed.** A squash-merged branch is never an ancestor of main. Test the PR's merge commit with `git merge-base --is-ancestor <mergeCommit> origin/main`, and check that the branch tip still equals the PR's `headRefOid` (nothing pushed after the merge). Production deploy = the `Cloudflare Pages` check run on main's head.
- **Remote deletes:** one `git push --atomic --force-with-lease=refs/heads/<b>:<sha> origin :refs/heads/<b> ...` with the SHAs recorded first. Leave branches on `staging` only (not yet on main) until the release PR merges.
- **Live worktree check:** `lsof -a -d cwd -Fn` lists every process cwd. `paper mcp` processes sit in the main checkout and are not sessions. `claude/<name>-<hash>` worktrees are the founder's chat sessions: leave them.
- **Worktree removal:** plain `git worktree remove` refuses dirty trees, so it doubles as the dirty check. Use `--force` only when `status --porcelain` is exactly `?? node_modules/`.
- **Refused:** the auto-mode classifier denied one batch `git branch -D` of about 70 local branches. Local branches cost nothing. List them in the report and leave them for a run with that permission. Do not split the batch to get around the denial.
- **Temporary refs:** `git fetch origin '+refs/pull/*/head:refs/remotes/pr/*'` is useful for containment checks. It makes `pr/<n>` ambiguous with local branches and adds refs that `git branch -a` lists. Delete them before handing back.
- **The coordinator's worktree changes branch while you work.** Never write memory or files there. Memory goes in on a Lane A branch from `origin/staging`.

**Why:** 63 merged remote branches and 48 worktrees were removed without touching live work. Two role-memory indexes on staging pointed at files that had never been committed.
**How to apply:** every release audit or cleanup round. Related: [[isolated-worktree-cleanup]], [[healthapp-memory-tracked-rebase]].
