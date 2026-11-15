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
