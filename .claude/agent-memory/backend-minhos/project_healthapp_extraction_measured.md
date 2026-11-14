---
name: healthapp-extraction-measured
description: Measured behaviour of Gemini extraction on the synthetic set (2026-11-14): Greek lookalike ID letters, finding granularity, timings; harness is scripts/m2-harness.ts
metadata:
  type: project
---

`gemini-3.8-flash` with the forced schema in `_shared/extract.ts`: 8 drafts and 2 refusals correct on the synthetic set, 7 to 15 s per call from the dev network (event network not measured). Run `scripts/m2-harness.ts` (needs SUPABASE_ANON_KEY + HEALTHAPP_PERSONA_PASSWORD, dev only); each run leaves synthetic rows in `healthapp_dev` and objects in the bucket.

**Why:** these are the surprises that would otherwise cost an hour at the M2 gate.

**How to apply:**
- A Greek page printing `AK123456` came back as `ΑΚ123456` (Greek capitals that look Latin). Identity match (B1) must compare `normalizeId()` (`_shared/extract.ts`), never raw strings.
- Left alone the model emits a finding per heading line ("Παραπομπή: …") and per sentence of a conclusion; the prompt now says one entry per paragraph or labelled section and none for headings.
- Blur 7 px on a 1000 px render is enough for `readable=false`; the crisp footer line did not stop it.
- Edge logs lag the call by about a minute.
