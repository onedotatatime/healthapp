---
name: project-simulation-timeline
description: MIN-4699 part 1 (2026-11-15): `timeline` block contract, funding_plan.py module, python generator tests are not in CI, money below income at true size
metadata:
  type: project
---

MIN-4699 part 1 is GO (comment 8b038e47). The decisions:
- An additive `timeline` block in simulation.json, 24 plan months.
- `docs/business/funding_plan.py` is an importable module, and funding-model.py's stdout must stay byte-identical.
- The diagram is static under the hero, and the 30 s clock is untouched.
- Stacked lanes on one x axis, with no dual y axis.

**Why:** pr.yml runs npm only. test_simulate.py and build_sims --check never run in CI, so a stale JSON passes green. I added a fast `test_timeline_plan.py` step to the static job.

**How to apply:** in part 2, check that the pr.yml step exists and that the run reproduces month 24: 4,109 patients, 1,693 matches, effect 0.182, drop_pts 0.92, income €164,352. The modelled drop at month 24 is €61,825 (patient-months) or €111,218 (case-year), both below income. Block any dual axis, any scaling, or the EU-27 figure on the income axis. MIN-4687 (LOINC) lands after this; its PR must show simulate.py output byte-identical or regenerate the file. Related: [[project-simulation-euro-contract]], [[project-simulation-5000]].

**Part 2 (2026-11-15, comment 3d368406): PASS at 37bff7e.** The CEO seat (MIN-4698) replaced my month-24 figures. The ramp is per_case_only: 2,806 patients / 1,137 matches. Money is shown as a yearly figure at network size: drop €88,043 and income run rate €228,923. method `year_at_network_size`.

Lesson: staging moved during the build (CFO v5 changed the funding-model.py header). merge-tree showed a header-only conflict. The golden diff must then be taken against the **new** staging stdout, not the old base. Before giving a pass, always run `git merge-tree --write-tree origin/staging <head>`.

test_simulate.py needs git: run it in the worktree, not in an export.

**Part 3 (MIN-4720, 2026-11-15, comment 6fba2571): GO.** The founder rejected the lanes ("one diagram with all the lines on the same", "animated"). My indexed-axis ban is lifted narrowly: **one scale per unit**. The reference is the maximum over the unit's lines, so matches/patients = 0.405 and drop/income = 0.385 stay true. The scale is fixed from frame 1. Lines are straight segments and the real value is always shown. The lanes are deleted; the `sim-tl-values` table stays. The card has its own `useClock` instance: 500 ms a month (12 s), starting in view, with its own Replay. Numbers step at month edges. Hero `SIM_*` untouched. Data: no change. MIN-4717 is folded into the rework PR. The e2e-live lane assertions are deleted in the same PR (nightly MIN-4718).

**Why:** the founder asked about growth together, not size. Per-line indexing (each line to its own max) would lie inside a unit.

**How to apply:** in part 2, check the reference is computed from the file, there is no rescale mid-run, the 24 state updates, the ≤4 ms frame at 4x throttle, the lane specs are gone, and run merge-tree against the new staging.

**Part 4 (MIN-4720 part 2, 2026-11-15, comment 7bc85186): BLOCK at a30613f, three small fixes.** Guards green, merge with staging clean. Accepted: the card's own rAF loop instead of `useClock` (setT every frame breaks the §3 budget; my contract contradicted itself). Fixes for Ren: (A) leaders hidden while the run plays, because a horizontal leader in the line's colour across undrawn months reads as a flat projection; (B) patients are kind **plan** (simulate.py: plan revenue x per-case share / €40), and only matches are computed; (C) read `plan.pilot_from` (#147). Lesson: check every kind tag against the generator line that produces the series. A14 and Anna §8 had both drifted from §7, and the code followed the docs.

**Part 5 (MIN-4720 delta, 2026-11-15, comment 25f8ce6f + PR #151): PASS at f84486e.** A, B and C were done as asked. Staging had moved to 155c93c (#152, story deck only), and merge-tree was clean. pilot_from is now optional with a fallback, which supersedes MIN-4714's "absent key = no card". Lesson: the fix landed on a side branch (`feat/min-4724-cto-fixes`) while the PR head stayed at its parent. A pass must name the SHA and tell Release to fast-forward the PR branch to it. Otherwise "green on the PR" is green on the blocked head.

**Part 6 (MIN-4744, 2026-11-15, comment fee57739): GO for one diagram with a slider, 10 years, Greece.** The founder rejected the animation ("not animated but with a slider"). Decisions:
- An additive `ten_years` block covering plan months 1 to 120. Revenue is held flat after month 38, which is the plan's own rule, using `revenue(..., h=)`.
- Real matching runs up to month 29 (4,751 patients). From month 30 a plateau holds the 5,000-record values: 2,071 matched, effect 0.20, drop_pts 1.01, drop_per_100 0.46.
- Greece uses the same formula with only the per-inhabitant base changed (Eurostat hlth_sha11_hf EUR_HAB, geo=EL).
- Both bases are output: yearly and running total. The CEO seat picks one, and one basis is used for all flows.
- Native range slider, default month 120. No rAF and no timers.
- The hero, the small charts, SimTimeline and the clock are deleted from the page. The JSON blocks stay.

**Why:** 91k synthetic records cannot be matched in time, so the plateau is conservative. On the running-total basis, the money saved is about equal to income at year 10 (placeholder €1,700). The CEO seat must see that.

**How to apply:** in the post-build pass, check four things:
- Months 1 to 24 of `ten_years` equal `timeline`.
- `measured_until_month` is computed.
- funding-model.py stdout is byte-identical.
- No mixed bases on one scale.

Also flagged: deck slide 5c iframes production /simulation (`STORY_APP`), so the 17:00 deck shows the old hero unless this reaches production or the slide is repointed.

**Part 7 (MIN-4744 part 2, 2026-11-15, comment 1a8014d4): CHANGES NEEDED at ec24c8d.** The guards were green on the head and on its merge with staging 554204e, and the funding-model golden output was byte-identical. My ruling is plot 'euro': in 'five', patients, matches and diagnoses are all patients × a constant after month 30, so per-unit scaling stacks them on one curve. I lifted the tick ban for the single € axis (€0, half and max, computed). The fixes asked for:
- (A) totals beside the yearly figures in the readout and the table, CEO ruling 4
- (B) the CEO's income line and the "no patient leaves" line
- (C) no bare "saved" in the dormant variants
- (D) Cron's all-Greece limit check, €200,680,637
- (E) the flip, plus the pin at test line 269

Lesson: check the build against the CEO seat's ruling text as well as my own contract. Ren built to my contract, and the CEO's additions (totals, assumption lines) were missed. Also, a constant switch ships its other branch's strings, so check the dormant variants against the wording rules too.
