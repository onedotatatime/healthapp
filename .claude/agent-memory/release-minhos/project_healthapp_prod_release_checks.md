---
name: healthapp-prod-release-checks
description: How Release proves a healthapp production release without printing secrets or redeploying - switch value by digest, function source by download, staging re-joined by merge
metadata:
  type: project
---

Production release of the live boxd run (MIN-4671, PR #134, 2026-11-15):
- **Switch value without printing it:** `supabase secrets list` shows a sha256 digest per name. Compare it with `printf '%s' on | shasum -a 256` (and off, dev); print only which candidate matches.
- **Deployed function = release?** `supabase functions download <name> --project-ref …` into the scratchpad, then `cmp` every file against the release worktree. All identical means no redeploy.
- **staging no longer an ancestor of main** (after a cherry-pick release): when main's tree equals the cherry-picked staging commit's tree, cut the release branch from main and `merge --no-ff origin/staging`. Proof: `git diff main HEAD` hashes the same as `git diff <cherry-picked> <staging tip>`. It re-joins the histories.
- **staging moves during the round** (#133 landed mid-release): merge with `gh pr merge --match-head-commit <sha>` and name what stayed on staging.

**Why:** the founder's yes covers named PRs only; these give proof without extra deploys or secret exposure.
**How to apply:** every healthapp staging → main release. Related: [[healthapp-live-function-checks]], [[healthapp-local-lane-run]].
