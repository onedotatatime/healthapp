---
name: project-matches-rpc-review
description: Healthapp possible matches (MIN-4505): PR #25 (005-007) passed; PR #51 (013→014 coding, six markers + negation) passed with 3 required fixes; local Postgres 18 replay is the independent check
metadata:
  type: project
---

Post-build pass 2026-11-14 on PR #25 (head d487d4f, Lane C): 005 matches RPC + opt-in setter/getter, 006 cohort (400 synthetic), 007 Maria's synthetic record. Merge order #24 → #25: before #24, 002 grants select on the whole `profiles` table and `profiles_doctor_in_grant` exposes `matching_opt_in`/`matching_opt_in_at` to the doctor, which is the hint the single empty answer hides.

Decisions: 007 is applied to `healthapp_demo` (005 → 006 → 007, after 010, before the first real upload; counts only; no agent calls a matches RPC in demo). Maria receives no live upload on stage (uploads change her codes and the exact-set answer); the live-upload beat uses `patient2` or the founder's account.

PR #51 (2026-11-14, head a762958): coding round (six unkeyed markers by printed name, qualitative text, units, negation). Pass with 3 required: `glyc(at|osyl)ated` → `glyc(osyl)?ated` (else "Glycated hemoglobin" codes Hb_low); ANA word vs titre disagreeing decides nothing; rename to 014 (#49 took 013). No second CTO pass if the fix is only those lines. Demo apply after merge, before any rehearsal, catalog/counts only. Follow-up for Cron, first item: units of the 13 older markers (WBC /µL and µmol/L code wrongly, CRP mg/dL missed).

**Why:** exact-set grouping makes the answer fragile to any code change; the opt-in flag must never reach the doctor; a wrong code is worse than a missed one.

**How to apply:** independent check that works without DB access: throwaway Postgres 18 from `/opt/homebrew/opt/postgresql@18/bin` (initdb with LANG/LC_ALL=en_US.UTF-8; socket path in the scratchpad is too long, so listen on 127.0.0.1 and `-k ''`), a stub schema for profiles/grants/documents/results/findings/diary + `auth.uid()` from a GUC, then apply the rendered 005/006/0xx and run the check file plus real-world probes (EN/EL lab names, titres, comma-scope negation). Earlier: regenerate 006/007 with `scripts/synthetic/seed_sql.py write` and `cmp`. See [[healthapp-real-data-regime]].
