---
name: project-identity-name-only
description: MIN-4630 (2026-11-15): identity decided on the name only; A passed at 58d0207 with a pre-cleared ground-truth doc 8 fixture must-fix; B (refused originals kept 14 days) pending founder yes
metadata:
  type: project
---

MIN-4630 (decision on MIN-4613, 2026-11-15 ~01:27 UTC): `matchIdentity` must never return `id_mismatch`; an equal printed ID still upgrades to `match`; extra name parts >= 2 without an equal ID stay `name_mismatch`. B: refused rows keep `storage_path`/`content_type`/`sha256_file` with `file_kept_until` (14 days), new migration 017 (not an edit to 015), re-claim of refused-with-file under MAX_READS, UI "Try again" ships together with the server part, never alone.

**Why:** the model fills `printed_id` with lab codes; Greek lab exams carry no ΑΜΚΑ/ΑΔΤ (founder: "patch only the Name", "at all scans and users"). The founder also wants the photo kept to "rerun the test". Third-party health-data risk accepted for the demo only; legal check before other real patients.

**A post-build pass (2026-11-15 01:37 UTC):** pass at 58d0207; refusal type narrowed so the compiler enforces "never id_mismatch"; sweep proven non-vacuous by a mutation only it catches. One must-fix, pre-cleared (no second CTO round if the diff is only that): `tests/synthetic/ground-truth.json` doc 8 still expected `refused/id_mismatch`, and `scripts/scan-next-live.ts` runs docs 1,2,6,7,8 by default, so the post-deploy smoke would print FAIL on correct behaviour.

**How to apply:** when a rule change flips an expected outcome, grep `tests/synthetic/ground-truth.json` and the live scripts (`scan-next-live.ts`, `m2-harness.ts`), not only the Deno tests; CI never reads that file. At B's review, check the retention, that doc-photo still serves no refused file, and that no SQL deletes `storage.objects`. Follow-up: extract prompt should fill `printed_id` only for ΑΜΚΑ/ΑΔΤ/passport. Related: [[identity-match-review]], [[healthapp-function-deploys]].

- 2026-11-15: part B (MIN-4637) passed at 6b28164 after 3 pre-cleared fixes (file_kept default false, analyse_only draft/confirmed only, scan_counts split). Lesson: pre-clearing small must-fixes with "diff only these, no second round" made the re-check 6 min; check the testkit default status (createDraft = queued) when a guard changes an old test.
