---
name: simulation-euro-contract
description: MIN-4610 (2026-11-15): simulation.json euro/matches contract; part 1 non-additive diff accepted; part 2 passed at 291fedf after the founder's 1,200-record change
metadata:
  type: project
---

Part 1 (comment 04f2ff86) fixed the contract for `data/synthetic/simulation.json`: top-level `matches.count` and `euro.*` (`_mio_eur`, `_eur_per_inhabitant` in key names), `assumption.start/ceiling/effect`, euro from the 2-decimal cost. Part 2 (comment e0db8e36) passed the head 291fedf with no must-fix.

The founder's "lets go to 1200" (2026-11-15) superseded my byte-identical list: `cohort_size`, `x`, series 1 and the last values of series 2/3 changed. Cron builds the 1,200 cohort in memory in `simulate.py`; `cohort.json` stays 400. Last frame: 473 matches, 0.96 pts, €17.6 billion, €39.

**Why:** a founder decision after my contract changes the "byte-identical" premise, and the generated dashboard bundle (`docs/dashboard/drafts/shared/sim-data.js`) then must change in the same PR, or `build_sims.py --check` turns red.

**How to apply:**
- Condition 6 must hold for every 2-decimal drop the clock can show, not only at the 12 steps. Check it with a loop over 0.00 to 2.00.
- `check:static` needs git, so run it in the worktree, not a `git archive` export. The other jobs run fine in the export with `node_modules` symlinked.
- For browser evidence, serve the export's smoke build (fake env) on a spare port and reuse the smoke spec's mocked demo login. Never touch the dev server's real URL.
- A 1,200-cell field at 390 px is 538 px tall. A cohort-size change is a layout change too.
- Open, after merge: Anna's §6 still holds the 400-record fills. The normalised versus fixed-count curve is the CEO seat's call (MIN-4605), and a data-only change.

Related: [[doctor-simulate]], [[frontend-contract-drift]], [[reference_dashboard_browser_checks]]
