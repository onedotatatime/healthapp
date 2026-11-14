---
name: healthapp-assistant-checks
description: How healthapp-assistant verifies answers (short ids, number/date sets per cited line), measured latency, the seed 011 and how its live checks were run
metadata:
  type: project
---

`healthapp-assistant` (ask) lives in `_shared/assistant.ts` (pure: facts, prompt, check) + `_shared/assistant_pg.ts` (store) + `healthapp-assistant/handler.ts`. The model cites short ids (`r1`, `f2`, `d3`); the server maps them to `r:<uuid>` after checking. Allowed numbers and dates for a segment = those written on its cited lines, computed with the same `claimsOf()` on the line body WITHOUT its id prefix (else `r12` makes 12 a legal number). Dates must be ISO in the text (the prompt says so); `14 May 2025` is rejected on purpose.

**Why:** a plain comparison is the guard that needs no credit; sharing one extractor between the prompt lines and the check keeps them from drifting.

**How to apply:**
- Measured with gemini-3.8-flash on a 35-line record: 3.4 s (not in record) to 10.3 s (3 segments, 6 cites), one model call each; `scripts/assistant-check.ts` reruns it with no DB.
- Check each mutant's failure reason: ids in text, forged lines via `\n` in a finding, and "not_in_record beats verified segments" all survived the first test round.
- The seed is `011_seed_record.sql` (applied 2026-11-14 ~17:30 UTC after the founder's "Yes, do both"; a first try was denied by the permission layer). It raises on any schema but healthapp_dev.
- For a live assistant check, insert a short grant (20 min) for doctor.dev -> Maria, then revoke it right after: an open grant blocks the handshake's unique (patient, doctor) index. An ended grant answers 403 before any model call, so it needs no Gemini. See [[healthapp-edge-db-direct]], [[healthapp-demo-passcode]].
