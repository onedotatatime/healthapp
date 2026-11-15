---
name: one-diagram-means-one-plot
description: When the founder says "one diagram with all the numbers", he means one plot with every line on it, moving; stacked lanes on a shared axis were rejected (MIN-4696, 2026-11-15)
metadata:
  type: feedback
---

"One diagram" from the founder means one plot with all the lines on the same plot, and on `/simulation` it is animated. Three stacked lanes on one month axis, static, shipped as MIN-4696 and he rejected it: "no no no. We said one diagram with all the lines on the same showing how while the users are growing so as the matches how the other numbers are growing", then "animated".

**Why:** Product's reading table said "one diagram, several measures, one shared time axis", and the CTO's honesty bans (no second y axis, no indexed axis) plus the CEO seat's "motion: not today" turned that into lanes. Nobody checked the changed form against his words before the build.

**How to apply:** when a technical or honesty rule changes the form the founder described, write the changed form in one line on the parent and have the CEO seat confirm it against his verbatim words before design starts. Put the form in the acceptance ("one plot, one card, no lanes"), not only the measures. Rework scoped as MIN-4720 to MIN-4726. See [[simulation-scaled-money-finding]].
