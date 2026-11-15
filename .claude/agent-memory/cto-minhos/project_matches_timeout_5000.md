---
name: project-matches-timeout-5000
description: MIN-4649 (2026-11-15): possible-matches RPC timed out at 8 s (inlined `me` CTE re-ran match_patient_codes per cohort row); 018 live; 019 failed at 450 KB, passed at 117cc88 as a 49 KB self-checking DO block + one-call rollback
metadata:
  type: project
---

CTO decision on MIN-4649. `healthapp_possible_matches` (005) referenced CTE `me` once, so Postgres inlined it and evaluated `match_patient_codes` (not inlinable: `set search_path = ''`) inside per-row subplans: ~415 calls per RPC. Fix = codes into a plpgsql variable (018); 019 seeds the same 5,000 as `/doctor/simulate` (run-5000.json, seed 20261114), guarded on 018; never re-run 006 after 019.

Post-build pass 2026-11-15 (b5d42ab): 018 passed and went to dev/demo on the emergency call (independent replay: 13.8 s -> 44 ms, 423 -> 1 call, same JSON md5). 019's rows were right (cohort_md5 81b63f09..., equals an independent matcher and persona-rare's recorded result) but it failed the pass: 450 KB is ~150k output tokens through `execute_sql`, over a run's budget, with no self-check. Must-fix: one compact statement (~44 KB, base-62 payload, spike measured) that raises unless the cohort fingerprint matches; rollback as a file; rebase (scripts/hdb conflict with staging's `kept`); memory commit split out.

**Why:** there is no DB URL on this Mac and Release runs may lack the SQL connector, so anything applied to dev/demo is transcribed by an agent; size and a self-check decide whether a seed can ship. Re-applying the whole 005 file reverts 014's `match_patient_codes` (measured) while 018's `_applied` row survives.

**How to apply:** for any generated seed bound for conductor, ask at the pre-build review: bytes per call, who has `execute_sql`, and a fingerprint check inside the statement. Rollbacks are files that restore one function body, never a whole earlier migration. A timeout on a matching RPC proves the patient is opted in (no read needed). See [[project-matches-rpc-review]], [[project-doctor-simulate]].

Re-pass 2026-11-15 (117cc88, comment cf7394e8): pass. 019 = one DO block (49 KB, base-62 words, cohort + labs fingerprint raise, live-body guard); rollback/019_018_down.sql via `hdb down`, 006 rows from a compact payload pinned to the live-read fingerprint 0d8c7e2a (accepted: stronger than 006's row count). Replay recipe: `scratchpad/pg4649/` scripts, `send.sh` sends a render as ONE `psql -c` string (= one execute_sql call); corruptions via sed on copies (`create database tN template hdb`). zsh gotcha: no word-split of `$S` command vars, write a .sh with functions. LIKE has no `[..]` classes, use `~`. Open: 49 KB through one execute_sql call is unproven; fallback 019a/019b via an RLS-on staging table, generated, short re-pass.

