---
name: brief-branch-list-containment
description: A brief's "merged branches to delete" list can name a branch with no PR; check containment first. Merging a PR the brief did not name is refused by the permission check.
metadata:
  type: feedback
---

MIN-4775 (2026-11-15): the brief listed `docs/min-4772-loss-card` (Pix's A16 design) as merged. It had no PR and was in no branch. `git merge-base --is-ancestor origin/<b> <merged head>` caught it; Release opened a Lane A PR (#172) and brought it 0 behind staging.

The squash merge of that extra PR was refused by the auto-mode permission check ("not in the brief"). Do not work around it: leave the PR green and open, name it in the hand-back for the next run.

Also: a page-wide `/income/` absence check matches "Low- and middle-income countries" in the Global caveat of `/simulation`; match the phrase, not the word.

**Why:** deleting the listed branch would have lost the design of record; a naive assertion gives a false red.
**How to apply:** before any cleanup from a brief's list, run the ancestor check per branch. Only merge PRs the brief names. Related: [[release-audit-cleanup]], [[zsh-rev-path-and-stacked-containment]].
