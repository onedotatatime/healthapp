---
name: project-landing-release-lessons
description: Healthapp landing (Pages project healthapp-landing) release lessons - copying from an uncommitted worktree, cache behaviour, how to verify
metadata:
  type: project
---

- When shipping from the coordinator's uncommitted worktree, compare each file against `origin/staging` before copying. Agent-memory `MEMORY.md` index files there can be older than staging: merge the new line in, never overwrite (MIN-4539, 2026-11-14: a plain copy would have dropped two marketing index lines).
- "I cannot see it" on the landing was a missing deploy, not cache: live assets matched staging byte for byte. Check sha256 live vs staging first.
- Pages serves `/brand/*` with `max-age=0, must-revalidate` and the edge updates at deploy, so same-filename logo swaps need no `?v=` query. Only the browser's own favicon store may lag.
- Verify: sha256 of live `/brand/*` vs `landing/dist/brand/*`, then headless Chromium (Playwright installed in the scratchpad; browsers are in `~/Library/Caches/ms-playwright`) for console errors.
- Actuals: `extract-runs.py --actuals` needs `--transcript <subagents/agent-*.jsonl> --window FROM/TO`; Playwright is not kept between sessions, reinstall `playwright@1.56` in the scratchpad (cached Chromium builds work). Rate card is Supabase `model_pricing` (MIN-4462, 2026-11-14).
- healthapp `staging` has no "require up to date" protection, so `gh pr merge` goes through while behind. Gate on the number: `[ "$(git rev-list --count HEAD..origin/staging)" = 0 ] || rebase`, never `rev-list && gh pr merge` (prints 2, exits 0, merges anyway; MIN-4462 #61, 2026-11-14).

**Why:** these cost time the first time. **How to apply:** every landing asset release.
