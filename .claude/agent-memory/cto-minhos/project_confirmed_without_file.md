---
name: confirmed-without-file
description: MIN-4644 (2026-11-15): a confirmed healthapp document with no storage_path cannot come from an upload; suspect the 10-document persona seed before suspecting file loss
metadata:
  type: project
---

On 2026-11-15 Back asked whether confirmed exams lose their originals (10 confirmed rows with no `storage_path` on the account the founder scanned from, 3 of 13 schema-wide with one). The code has no delete-after-confirm: the path is cleared only by a refusal, and a file is removed only by a refusal or the patient's delete of an unconfirmed row. The persona seed `007_seed_match_persona.sql` inserts exactly 10 confirmed documents with no file.

**Why:** the MIN-4629 finding "his 10 confirmed rows lack files" read as a direction 3 defect and nearly became a pre-freeze fix. It was a count I reported without saying what kind of rows they were.

**How to apply:**
- When a count looks like data loss, first split it by "was read from a file" (`sha256_file is not null`) and by the fixed seed ids. `read_attempts > 0` only marks rows made after `015_scan_next`.
- Report a count of real rows together with how the rows were made; a bare count gets read as a defect.
- At the time of writing the query had not been run (no Supabase tool in the run); Cron runs CTO-written SQL. Check MIN-4644 for the result before repeating the seed explanation as fact.

Related: [[oneoff-real-row-delete]], [[healthapp-real-data-regime]].
