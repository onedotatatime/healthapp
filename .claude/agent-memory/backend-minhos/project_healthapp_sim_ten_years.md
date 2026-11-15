---
name: healthapp-sim-ten-years
description: MIN-4748 ten_years block in simulation.json (Greece, months 1-120), commit 78f5517, how it ties to timeline, plateau rule, scratch-tree commit recipe
metadata:
  type: project
---

`simulate.py` writes an additive `ten_years` block (last key of the file) from `funding_plan.revenue(..., h=120)`: patients 91,205 and income EUR 816,487 a year at month 120; real matching to month 29 (`measured_until_month`, computed as the last month patients <= cohort size), then the 5,000-record values held (2,071 matched, 1.01 points, 0.46 per 100). Greek base EUR 1,915.30 (Eurostat EUR_HAB, EL, 2024). Both bases, `yearly` and `total`, for diagnoses, saved_eur, income_eur. Check = section 4 of `test_timeline_plan.py` (17 checks, plan side).

**Why:** founder 2026-11-15 asked for one non-animated slider diagram over ten years for Greece; CTO contract MIN-4744 comment fee57739. The `total` bases use integer arithmetic `(2*acc+12*scale)//(24*scale)` so a .5 never depends on float division.

**How to apply:** months 1-24 reuse the timeline's own matching runs (same arrays), so a change to the timeline method changes both; the Greek EUR figure is typed in the check on purpose (independent anchor). `simulate.py` takes about 38 s (13 s of it is months 25-29). Saved passes income from month 70 (yearly) and 111 (running total) on the real base.

Recipe when the session worktree is stale and shared: `git archive origin/staging | tar -x` into the scratchpad, `git init` there with `refs/remotes/origin/staging` set so `test_simulate.py` check 1 can `git show` the base, edit and test there, then commit with `GIT_INDEX_FILE=<scratch>/idx git read-tree <tip>` + `hash-object -w` + `update-index --cacheinfo` + `commit-tree` + `git branch`, run as one `bash` script file. `git switch` in the shared worktree was refused by untracked files other agents hold.
