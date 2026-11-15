---
name: healthapp-squash-release-conflicts
description: healthapp staging→main PRs conflict after a squash release; check main's tree equals a staging commit, then release branch + merge -s ours
metadata:
  type: project
---

Release PRs to `main` are squash-merged (e.g. #101), so the next `staging` → `main` PR conflicts even though `main` holds nothing new. On 2026-11-15 (PR #117) `main` 862abfe's tree was byte-identical to `staging` f701601: `git diff --stat origin/main <staging commit>` empty.

**Why:** a squash leaves `main`'s commits off `staging`'s ancestry; `git merge-tree --write-tree origin/main origin/staging` shows the conflicts before any PR.
**How to apply:** find the staging commit whose tree equals `main` (proves no main-only content), then branch `release/<date>-<name>` from staging, `git merge -s ours origin/main`, check `git diff <staging> HEAD` is empty, PR that branch to `main`. Precedent 1cb675f (MIN-4592). GitHub still lists the already-shipped commits; the PR body must say which are real content. Related: [[landing-release-lessons]].
