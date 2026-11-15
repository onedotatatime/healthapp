---
name: healthapp-sim-timeline
description: MIN-4701 simulate.py timeline block: round 2 done (e061350), how the committed JSON ties to the default invocation, shared-worktree traps
metadata:
  type: project
---

`scripts/synthetic/simulate.py` writes a `timeline` block (plan months 1-24) from `docs/business/funding_plan.py` and the real matching loop. Round 1 = 57dd768, round 2 = e061350 (per_case_only default, `drop_eur`, `diagnoses` yearly at that month's network size, new `income_run_rate_eur`, JSON committed, SKIP removed). Month 24: 2,806 patients, 1,137 matches, EUR 88,043 a year, 9.8 fewer diagnoses, income EUR 228,923 a year.

**Why:** test_simulate check 6 reruns `simulate.py` with no flags and compares bytes, so a decision (the ramp) must be a constant (`TIMELINE_RAMP`), never only a flag. The CEO seat's rule: modelled money is never a running total on screen; `income_eur` stays a running total only for the plan check.

**How to apply:** another agent (Ren) shares the worktree and rewrote `data/synthetic/simulation.json` with a fixture while I worked: regenerate into a scratch dir, copy over, commit only your own files by name. Dashboard unittest suite takes ~140 s (run in background). Prove the mutants against the JSON copy in a scratch dir (the byte check 6 also fires, so look for the intended check's name). On macOS `sed -i` needs a suffix; use python for edits.
