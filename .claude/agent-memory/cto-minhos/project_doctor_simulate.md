---
name: project-doctor-simulate
description: Healthapp /doctor/simulate (MIN-4504, 2026-11-14): no live boxd VM on click; a recorded boxd run replayed, matching computed in the browser on 5,000 synthetic records, contact simulated after two-sided consent
metadata:
  type: project
---

CTO decision 2026-11-14 on MIN-4504 (comment "CTO · decision · `/doctor/simulate`"). The founder asked for a page like How it works at `/doctor/simulate` where a doctor's click creates a boxd VM, simulates 5,000 people, finds 5 matches, shows their data and contacts their doctor.

- **No live VM on click.** The click replays one real boxd run made ahead of time through the CLI signed in on the founder's Mac, labelled "Recorded run on a boxd machine, <date>. Replayed here, not live." The matching runs at the click, in the browser, over 5,000 coded synthetic records. No key, Edge Function, table, migration or secret; the page touches neither `healthapp_dev` nor `healthapp_demo`. Lane B, Cron (data) and Ren (page).
- **Demo patient is `persona-rare`** (sarcoid-like codes), never Maria (about 280 records in 10 groups at 5,000) and never the founder's record. "5 matches" is a planted-pattern test declared on screen: the rare group's seeded size S is one declared constant, starting at 6, +1 until one group of 5 to 9; seed 20261114 unchanged; the count shown is computed, never typed.
- **Before consent** the doctor sees pattern, count and country per record only. Exams (values, ranges, months), age band and the other doctor (specialty and country, no invented name) appear only after a simulated consent from both patients (CEO review comment 11). Nothing is written or sent.
- A live VM would need a boxd API key that only the founder can create, kept in the Conductor production project, plus a lock, a cap and a kill switch (Lane C). Not verified: boxd's API from an Edge Function and machine start time.

**Why:** the compute is tiny (0.09 s to generate, 0.02 s to match 5,000 locally), so a live run is almost all waiting for a machine on the venue's network; a failure on stage is silence; submission was Sunday 15 Nov 17:00. "Nothing is claimed that does not run", so every step carries a label saying what it is.

**How to apply:** at the post-build review check: the n = 400 generator output is still byte-identical (`run_all.sh`, 006/007 `cmp`); the TypeScript matcher's result equals the `result` recorded in `run-5000.json`; the simulate module imports nothing from `src/api` or `matches/real`; the four fixed labels are word for word; no record-level value is rendered before the consent step; the `vm` block holds real timestamps and no hostname; `boxd list` was empty after the run; no new Playwright spec. See [[project-matches-rpc-review]] and [[healthapp-real-data-regime]].
