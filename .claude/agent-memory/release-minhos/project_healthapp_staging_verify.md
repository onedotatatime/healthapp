---
name: healthapp-staging-verify
description: How to prove which commit healthapp staging and staging-dev serve (SPA /health needs a render), and that the twin fast-forward push can be refused
metadata:
  type: project
---

`/health` on `staging.healthapp-8ui.pages.dev` and `staging-dev.…` is an SPA route: curl returns only the shell, and the sha is not a findable literal in the bundle. Render it signed out with the worktree's Playwright (`chromium`, read `[data-testid=sha|env|schema]`) and pair that with curl HTTP codes. No sign-in (MIN-4526).

The twin fast-forward (`git push origin origin/staging:refs/heads/staging-dev`) was refused by the auto-mode permission check on 2026-11-15 (MIN-4667, PR #118). There is no workflow that does it.

On 2026-11-15 (slice 2, PR #120) the same push went through after the founder's "Let Release do it". `git fetch` again after `gh pr merge` before pushing the twin: a ref fetched before the merge sends staging-dev to the old head (it happened once; pushed again by sha).

**Why:** E2E must run on staging-dev at the staging commit; a stale twin means tests run on old code.
**How to apply:** after a staging merge, try the push; if refused, say so on the issue and on the E2E issue, make the E2E go conditional on the twin's sha, and name it in the hand-back.
