---
name: simulation-5000
description: MIN-4684 (2026-11-15): /simulation at 5,000 - STEPS 12 kept, cohort aligned to run-5000.json (S read from seeded.rare_sarcoid_like), own canvas field, no DotCanvas import
metadata:
  type: project
---

Part 1 GO (comment e976f813 on MIN-4684). The surprising facts:
- `make_cohort(Random(SEED), 5000)` is NOT run-5000.json's cohort: run-5000 used sarcoid S=6, which shifts the rng stream. I required simulate.py to pass S read from run-5000.json so both screens and the 019 seed share one 5,000 set.
- At 12 linear steps (417 per step) the first frame already has ~107 matches (28.5%) and the rate is flat at 45-46% with a dip at the last step. The 1,200 run started at 0. This broke MIN-4610 contract checks 1 and 2 (first values = baseline, count first 0); I superseded them.
- The chart spaces points by index, so a non-linear x schedule would distort the axis; that is why STEPS stays linear.
- simulate.py at 5,000 takes ~18 s locally; no CI job runs it.

**Why:** a cohort-size change silently changes the story shape and the contract's "first frame" assumptions, not only the last row.
**How to apply:** at part 2 check: S comes from run-5000.json (not typed), test compares cohort to run-5000 records, field is a canvas in src/features/matches with no import from src/features/simulate, long task < 50 ms at 390 px, last row matches the regenerated file (scratch: 2,071 / 4.54 / 9.99 / 1.01 / €18.5 billion / €41).

Related: [[simulation-euro-contract]], [[project-doctor-simulate]]

Part 2 (comment f7c415ac, 2026-11-15, head 7738c5c): PASS on code. Lessons:
- `test_simulate.py` / `test_seed_sql.py` are scripts (`python3 <file>`), not unittest modules; `python3 -m unittest <path>` fails at import.
- The 64-69 ms load long task at 4x is app boot (same on `/`), not the field: compare against a route without the feature before blaming it.
- Pix's A12 said "reuse DotCanvas" while the CTO decision said "no import": check a spec's wording against the decision, not only the code.
- Browser measurement without background servers: node script with createRequire(project)/playwright + node:http serving dist.
