---
name: recruit-50000
description: /doctor/simulate trial-recruitment search (2026-11-15) - committed 50,000 file from the one Python generator, deterministic parser, must+some criteria, k=5 on the eligible set, 5,000 flow untouched
metadata:
  type: project
---

CTO decision 2026-11-15 (pre-development, handed to the coordinator before Back's issue existed): the recruitment search box on `/doctor/simulate` reads a committed `data/synthetic/recruit-50000.json`, built by `generate.py --n 50000 --sarcoid 6` plus two NEW scripts (`recruit.py`, `build_recruit.py`). No live boxd run at 50,000, no TypeScript generator, no Gemini. Lane B, Cron (data + reference search) then Ren (parser, search, section).

Measured facts worth keeping:
- 50,000 locally: generate 3.4 s + build 1.2 s (5,000: 0.33 + 0.1 s). On boxd the 5,000 run took 1.4 s of script inside 5.8 s total, so 50,000 is an estimated 15-19 s against the function's 20 s limit: no margin. The cost is the 70 MB indented `cohort.json` dump.
- The browser file is 1.25-1.37 MB raw, ~180-230 KB compressed; JSON.parse 8 ms, one criteria search over 50,000 rows 1 ms in Node. No Web Worker needed.
- "At least N of the group's codes" is a bad rule for 3-code groups: gout at >=2 of 3 gives 4,042 hits with 1,266 seeded (CRP + joint pain is everywhere). A required defining code plus supporting codes gives precision >= 0.989 and recall >= 0.875 on all ten common groups.
- At 50,000 the rare groups stay 6 / 4 / 2, so sarcoid is shown and myopathy and copper give the empty answer: two free k = 5 demo cases.
- "type 2 diabetes" carries a digit: the parser must remove the condition span before it reads the number.

**Why:** editing `generate.py`, `match.py` or `build_run.py` changes the hashes embedded in `healthapp-simulate-live` and recorded in `run-5000.json`, which forces a function redeploy; new files avoid it. The 50,000 set is not a superset of the 5,000 set (different rng stream), so the two sections never share a count.

**How to apply:** at the post-build review check: the three old scripts are byte-identical to main; `recruit.ts` equals the file's `expected` block for all 13 conditions; no count below 5 is returned or rendered; the recruit file has no seeded-group column; the 50,000 JSON is its own chunk; no new Playwright spec; the two fixed labels are word for word. Related: [[project-doctor-simulate]], [[simulation-5000]].

Post-build review 2026-11-15 (MIN-4707): PASS at `921aef0`. A faint headline in a builder's screenshot was the 400 ms `.sm-enter` fade caught partway (opacity 0 just after the line appears, 1 a second later); measure computed opacity before calling it a contrast bug. Age bands stay off screen (country only), a ruling Back must reflect in the Scope.
