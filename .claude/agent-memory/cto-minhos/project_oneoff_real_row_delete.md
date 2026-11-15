---
name: oneoff-real-row-delete
description: MIN-4629 (2026-11-15): how a scoped delete of the founder's real rows in healthapp_demo was run — gate on the target window only, counts from hdb scan are schema-wide, founder scans live
metadata:
  type: project
---

On 2026-11-15, 18 pre-fix refused rows (17 name_mismatch + 1 incomplete) were deleted from `healthapp_demo` after the founder said "Yes, delete them". Cron ran the CTO's SQL. Production was on `demo`, not `dev`, by then. Round 1 stopped and round 2 stopped; round 3 deleted.

**Why:** the coordinator's "13 confirmed" was a schema-wide count from `hdb scan` (his account held 10). Then his live re-scans added a post-fix row between rounds. Both made whole-account gates fail.

**How to apply:**
- Next time, gate only the rows in the delete window: by created_at relative to the fix deploy.
- Report every other row as counts by window, status and reason.
- Identify the account by its refusals, not by identity data. A schema-wide by-window query gives the "after" view once the identifying rows are gone.
- Facts found during the run: his 10 confirmed rows have no storage_path (direction 3 gap). The first post-fix refusal was `id_mismatch`. `normalizeId` already folds Greek lookalike letters, so suspect the AMKA or another number landing in printed_id.

Related: [[healthapp-real-data-regime]].
