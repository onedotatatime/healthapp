---
name: doctor-dashboard-decision
description: MIN-4660 (2026-11-15) decision for the live doctor dashboard MIN-4659 — what to check at the post-build review MIN-4666, and two limits found in the live code (500-row cap oldest-first, one empty answer for matches)
metadata:
  type: project
---

Decision on MIN-4660 (comment "CTO · decision · MIN-4660", 2026-11-15 03:34 UTC) for the live doctor dashboard (parent MIN-4659, two slices, freeze 13:00 EET).

- **Slice 1 (Lane B, Ren, MIN-4664): no backend change.** `healthapp-over-time` already carries everything a chart card needs. Reuse `buildChart` / `ChartSvg`; no chart library; one over-time call per workspace open. "Run the matching" = the RPC `healthapp_possible_matches`, button, no call on open, no pool number in the UI. Slice 1 ships two nav items only (no Possible diagnoses entry).
- **Slice 2 (Lane C): a new function `healthapp-diagnoses`**, not the `causes` mode of `healthapp-assistant` (the chat function is never redeployed). Strict wire schema, server check of every statement, server sort by name, nothing stored, log has counts only. Off by default per env through the secret `HEALTHAPP_DIAGNOSES_ENVS`; `dev` at first deploy.
- **`demo` for diagnoses waits for the CEO seat** (memo request is the second comment on MIN-4660). Flag 3 (2026-11-13) covers synthetic data in the hackathon demo; a real person's record on staging/production is beyond what it says. Not after 11:30 EET.
- MIN-4663 (Anna) cancelled: no new safety wording.

**Why:** the builds had to start without a second question, and slice 2 had to be cuttable without touching the live chat.

**How to apply (MIN-4666 post-build pass):** check each PR against the numbered rules in that comment. Slice 1: no file under `supabase/`, no new Playwright, card count equals `values_with_series` after "Show all", the fixed matches label in every state, the 500-row notice. Slice 2: `_shared/assistant.ts`, `assistant_pg.ts` and `healthapp-assistant/` untouched, `scan_boundaries_test.ts` lists three model callers, forced-red tests named in the PR body, the function deployed by name before the view merges.

Two limits found while reading, both still true on staging `c5f625a`:
- `ROW_CAP = 500` in `_shared/assistant_pg.ts` reads results oldest first, so a record over 500 result rows silently loses its newest results in over-time, ask and diagnoses. Cron was asked for one count per env; the fix, if needed, is an optional cap on `record()` used by over-time only.
- The matches RPC gives one identical empty answer for not opted in, no match and under k = 5 (privacy rule of MIN-4505). An acceptance line asking for a separate "not opted in" state cannot be met; the founder's own account must have the patient switch on to see groups.

Pass 1 (slice 1, head 3b6f398) on MIN-4666, 2026-11-15: approved with follow-ups, no must-fix. A clean `git clone` (not git archive) lets check:static run in the same replay. Open follow-up: the matches `ended` state has no button back. The live dev checks were left to E2E (MIN-4668).

Pass 2 (slice 2a, `healthapp-diagnoses`, head b14bc61) on MIN-4666, 2026-11-15 ~05:55 EET: changes required, two cleared fixes (M1: a statement with more than 6 cites passed the guard and broke `DiagnosesResponse` cites.max(6); M2: the bare-id rule dropped "vitamin D3"). Release may merge without a second pass if the change touches only `_shared/diagnoses.ts` + `_shared/diagnoses_test.ts`. Founder's yes for `demo` (four conditions) is posted on MIN-4660; `demo` waits for the dev live call and F5 (no advice wording), before 11:30 EET.

Pass 3 (slice 2b, the view, head d3289c0) on MIN-4666, 2026-11-15 ~06:03 EET: approve with follow-ups, no must-fix. Merge conditions: rebase `--onto origin/staging 3b6f398` after #119 (slice 1's squash 211866a has the same tree as 3b6f398), remove `PENDING_FROM_CRON` from the drift test (cleared, drift test only), merge after the deploy and the `dev` call. 12 of 13 mutants red; "no call on open" survives because tests use renderToStaticMarkup (no effects, no DOM runner) — E2E F1 on staging-dev.

**Review lesson (2b):** to check a stacked branch before its base merges, fetch the base PR branch into the scratch clone, cherry-pick the head on it, and run the drift test with the pending skip removed plus one changed maximum. That proves the copy is compared live, not skipped.

**Review lesson:** when a server builds wire objects by hand from a looser model schema, compare every model-schema maximum against the wire maximum. A shared helper (here `check()`) can dedupe without capping. A strict client parse then rejects the whole answer.

Related: [[healthapp-real-data-regime]], [[healthapp-function-deploys]].

"Same-diagnosis matches" (comment "CTO · same-diagnosis matches" on MIN-4659, 2026-11-15 ~06:00 EET): it waits, nothing built before the freeze. `match_cohort` has only coded features, no condition; the generator's 13 pattern names are kept out of the pool on purpose (`cohort-truth.json`, test only); the diagnosis name is free model text, never stored. A count of synthetic rows per diagnosis is rejected: it reads as evidence and breaks the no-number rule on diagnosis cards. A later story needs a doctor-confirmed coded diagnosis and real opted-in patients (or a labelled synthetic pattern name).

Pass 2b (2026-11-15 ~06:05 EET): Cron's `576aac0` departed from my cleared M1/M2 wording; accepted as is on MIN-4666/MIN-4662. M1 slices to 6 *before* `check()`, so numbers are re-verified on kept lines (better than my "drop", no wasted retry). M2 counts only lowercase record ids not after "vitamin ". Follow-ups F6 (dedupe before slice), F7 (cited-line condition only if the dev call shows a false drop). **Lesson:** a cleared fix should state the property to hold (wire never sees >6; no number unverified), not the mechanism, so a better mechanism does not need a second CTO round.
