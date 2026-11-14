---
name: project-matches-rpc-review
description: Healthapp possible-matches DB part (MIN-4505, PR #25) passed 2026-11-14; merge after #24 because staging's 002 lets a doctor in a grant read profiles.matching_opt_in; 007 goes into demo as the stage fallback
metadata:
  type: project
---

Post-build pass 2026-11-14 on PR #25 (head d487d4f, Lane C): 005 matches RPC + opt-in setter/getter, 006 cohort (400 synthetic), 007 Maria's synthetic record. Merge order #24 → #25: before #24, 002 grants select on the whole `profiles` table and `profiles_doctor_in_grant` exposes `matching_opt_in`/`matching_opt_in_at` to the doctor, which is the hint the single empty answer hides.

Decisions: 007 is applied to `healthapp_demo` (005 → 006 → 007, after 010, before the first real upload; counts only; no agent calls a matches RPC in demo). Maria receives no live upload on stage (uploads change her codes and the exact-set answer); the live-upload beat uses `patient2` or the founder's account. Uncoded markers and negation: backlog after the hackathon.

**Why:** exact-set grouping makes the answer fragile to any code change; the opt-in flag must never reach the doctor.

**How to apply:** at M5 (MIN-4518) check the demo apply evidence is counts-only and that Ren's F1 reads `healthapp_get_matches_opt_in()`, not the column. Independent check that worked: regenerate 006/007 with `scripts/synthetic/seed_sql.py write` and `cmp`, then replay the exact-set rule in Python over 006. See [[healthapp-real-data-regime]].
