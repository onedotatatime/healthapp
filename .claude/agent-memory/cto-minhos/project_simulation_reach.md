---
name: project-simulation-reach
description: MIN-4769 (2026-11-15): /simulation share-of-residents slider, Greece / EU-27 / Global, additive `reach` block; held match rate = straight line; 46.0% not 41.4%
metadata:
  type: project
---

MIN-4769 part 1 (comment 1178f99e): GO. The founder dropped the 10-year plan-month view, which was flat at true size: €2,186M fell to €2,184M. He asked for "the money lost first" and for "3 In greece, in europe, Global".

The decisions:
- An additive `reach` block. `loss(s) = L0 − s·D100`, with L0 = 11% × spend_total and D100 = 1.01% × spend_total.
- One base per geography. Every € comes from spend_total. Population is used only for share-to-people and for the plan marker.
- The axis must start at €0. Each geography has its own fixed scale.
- Slider: 0.1% steps.
- € everywhere. Global is converted at the ECB annual average.
- The 11% applies to Global only with an "applied, not a world measurement" line.

Check numbers: Greece L0 €2,185,630,700, D100 €200,680,637 (−9.18%). EU-27 D100 €18,523,130,532.

**Why:** the match rate is held at the 5,000-record plateau, so the line is straight because of the assumptions, and the page must say so. Two traps:
- The money uses series 1's 46.0% of opted-in records (11 × 0.2 × 0.46 = 1.01), not 2071/5000 = 41.4%.
- Europe at 100% is exactly the €18.5bn the founder rejected twice. That is the CEO seat's overturn to log (MIN-4771).

**How to apply:** in the post-build pass, check these:
- `del(.reach)` is byte-identical.
- vitest reproduces the check_points to ±€1.
- No 41.4% appears next to €.
- No cropped axis.
- "Europe (EU-27)" is labelled as such.
- Global has its caveat line and the fx source.
- If the plan card was removed, the SimDiagram, tenYears and month-slider specs were deleted in the same PR.

Related: [[project-simulation-timeline]], [[simulation-euro-contract]].

**Part 2 (2026-11-15, comment fc5302c1): PASS at f15f275** (Ren d8e91a9 + memory commit, Cron 84f237b merged in, on staging 7de35c7). All guards were green, and the merge was equal to the head tree. Rulings:
- DEFAULT_SHARE 0 (CEO).
- The plan card is deleted; the restore point is 7de35c7/e7c364c.
- The round axis top is kept over Pix's top-at-L0.
- The rMoneyWording constant is OK.
- The "pending Anna" strings are OK for staging, not for production. `rState.full` "today's match rate" is a claim and must be reworded.
- A memory commit can ride in a Lane B PR.
- Not blocking, for Anna and Pix: "Lower by −€X" is a double negative. Pix's A16 specifies the minus.

Lesson: the lead line's "never rises" holds by construction when the parser rejects D100 ≤ 0. Check the parser, not only the tests.
