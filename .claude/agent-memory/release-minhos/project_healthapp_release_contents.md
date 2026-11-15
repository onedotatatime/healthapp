---
name: healthapp-release-contents
description: healthapp staging→main releases are squash-merged, so `git log origin/main..origin/staging` overstates what a release ships; find main's tree on staging first
metadata:
  type: project
---

Release PRs to main (#52, #66) were squash-merged although their bodies asked for a merge commit, so staging commits are never ancestors of main and `git log origin/main..origin/staging` lists already-released work (on 2026-11-15 it listed scan-next, MIN-4505, MIN-4518, MIN-4478, all live since #66).

**Why:** a brief said "main last released at 61c7d59" while #66 had already shipped up to staging `11a5b82`.

**How to apply:** find the staging commit whose tree equals main (`git diff --name-only <c> origin/main` = 0 over `git rev-list origin/staging`), list `<c>..origin/staging` as the real contents. Reuse the open `release/*` branch (it already records main's history) by merging staging into it; tree must equal staging. Landing (`landing/`) and the dashboard never deploy from main. See [[healthapp-memory-tracked-rebase]].

Update 2026-11-15 (MIN-4667, PR #123): #117 and #123 used real merge commits, so staging is now an ancestor of main (`git merge-base` = last released staging commit) and `git log origin/main..origin/staging` is accurate again; still confirm with `git diff <merge-base> origin/main` = empty. Pin the release branch to the staging SHA by refspec (`git push origin <sha>:refs/heads/release/<name>`) so a later staging merge (e.g. an open slice-2 PR) cannot ride along; merge with `gh pr merge --merge --match-head-commit <sha>`. Production `/health` is SPA: Playwright with `waitUntil: 'load'` (networkidle never settles).

Update 2026-11-15 (slice 2, PR #127 → main `f854ccd`): bringing a PR branch up to staging with a rebase + `--force-with-lease` push was refused by the auto-mode check. `gh pr update-branch <n>` (GitHub merges staging into the head, no force) works and the squash to staging stays clean. Docs-only commits (`docs/`, `landing/`) on staging do not change production: the app Pages project publishes `dist` only and `landing/` is direct upload (`docs/deploy.md` §11), so list them in the release table as "no".

Update 2026-11-15 (MIN-4703, PR #144): when `staging` holds PRs the founder's yes does not cover, interleaved with ones it does (#141, #139, #143 landed between #140 and #142), cut the release from `main`, `git merge --no-ff <last approved staging commit>` (clean when `main`'s tree equals the merge base), then `cherry-pick -x` each later approved commit. Prove: tree equals that staging commit plus the picks, and each pick's diff is byte-identical to its original.
