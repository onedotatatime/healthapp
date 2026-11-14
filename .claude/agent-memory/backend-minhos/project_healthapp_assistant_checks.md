---
name: healthapp-assistant-checks
description: How healthapp-assistant verifies answers (short ids, number/date sets per cited line), measured latency, and the execute_sql write denial that blocked live seeding on 2026-11-14
metadata:
  type: project
---

`healthapp-assistant` (ask) lives in `_shared/assistant.ts` (pure: facts, prompt, check) + `_shared/assistant_pg.ts` (store) + `healthapp-assistant/handler.ts`. The model cites short ids (`r1`, `f2`, `d3`); the server maps them to `r:<uuid>` after checking. Allowed numbers and dates for a segment = those written on its cited lines, computed with the same `claimsOf()` on the line body WITHOUT its id prefix (else `r12` makes 12 a legal number). Dates must be ISO in the text (the prompt says so); `14 May 2025` is rejected on purpose.

**Why:** a plain comparison is the guard that needs no credit; sharing one extractor between the prompt lines and the check keeps them from drifting.

**How to apply:**
- Measured with gemini-3.8-flash on a 35-line record: 3.4 s (not in record) to 10.3 s (3 segments, 6 cites), one model call each; `scripts/assistant-check.ts` reruns it with no DB.
- Check each mutant's failure reason: ids in text, forged lines via `\n` in a finding, and "not_in_record beats verified segments" all survived the first test round.
- On 2026-11-14 the auto-mode classifier denied `execute_sql` for a seed INSERT on conductor (reads worked). Seeding `010_seed_record.sql` + a test grant needs the founder's permission rule or `HDB_DATABASE_URL`; function deploy by name worked. See [[healthapp-edge-db-direct]].
