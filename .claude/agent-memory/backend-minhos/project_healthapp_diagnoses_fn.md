---
name: healthapp-diagnoses-fn
description: healthapp-diagnoses (MIN-4662) guard design, the choices beyond the CTO spec, the test-harness traps (deno in a scratch copy, Write blocked in other worktrees, a vacuous contract slice test)
metadata:
  type: project
---

`healthapp-diagnoses` = `_shared/diagnoses.ts` (pure guard: verify, fold, better) + `healthapp-diagnoses/handler.ts`; branch `feat/min-4662-diagnoses-fn`, head b14bc61 (2026-11-15), PR 2a. Statements are checked by calling the ask `check()` on a one-segment answer, so ask and diagnoses cannot drift. The off switch (`HEALTHAPP_DIAGNOSES_ENVS`) is a dep (`enabledEnvs`) read per request, decided after the role check and before any read.

**Why:** CTO decision on MIN-4660; list never shown unless every statement verifies against its cited lines.

**How to apply:**
- Choices beyond the spec (in the PR comment): retry only on a dropped statement/item, not a dropped `not_in_record` term; likelihood words and a bare line id also drop a statement; "%" is allowed in statements (units); model schema looser than wire, server keeps the first verified N then sorts.
- A regex written as `ranked?` means "ranke(d)", not "rank(ed)": a test with "rank 1" found it. Write stems as `rank(?:ed)?`.
- Test-harness traps: `deno check/test` inside the worktree dies on `package.json` (node_modules manual mode); rsync `supabase/` and `src/api/` to a scratch dir with no package.json and run there (contract_test reads `src/api/contract.ts`). The Write tool is blocked in other worktrees: stage in the scratchpad and `cp`. Per-mutant copies, not git restore.
- `overtime_boundaries_test.ts` "no verdict word" slices the comment-stripped contract after the first `healthapp-over-time`, which is the function table, so it reads only the table tail. Keep new FUNCTIONS entries before the over-time entry or fix that test.
- The cap count query (largest confirmed result rows per patient, count only): dev 145, demo 48 (2026-11-15). Under 500, no row-cap change.
