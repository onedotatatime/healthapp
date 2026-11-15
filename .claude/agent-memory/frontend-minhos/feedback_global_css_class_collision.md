---
name: global-css-class-collision
description: healthapp CSS is global per bundle; a generic class (.bar) from exams.css animated my new card's bars; prefix classes and pin it in a test (MIN-4774)
metadata:
  type: feedback
---

healthapp's feature CSS files are all in one bundle with unscoped selectors. `exams.css` has `.bar` and `.bar i` (a sliding animation). The loss card's `<div class="bar"><i>` inherited it and animated forever, on a page whose rule is "nothing moves". vitest (node, no layout) could not see it; a Chromium screenshot showed a half-filled bar at 100%.

**Why:** MIN-4774 (2026-11-15). **How to apply:** before naming a class in a new card, `grep -rnE "\.<name>\b" src --include='*.css'`; prefix everything (`.lc-`) and add a source test that the TSX does not use the bare name. Check a screenshot of every bar, chip and glyph, not only the numbers.

Also: when `git switch -c ... origin/staging` is blocked by other agents' dirty memory files, `git switch --merge -c` works; keep both sides of an appended-text conflict, `git reset -q -- <file>`, and never stage `.claude/agent-memory` files that are not yours.
