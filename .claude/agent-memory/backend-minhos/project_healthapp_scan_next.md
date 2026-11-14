---
name: healthapp-scan-next
description: MIN-4556 (PR #58) background reading: claim + 202 + waitUntil, status values, what was measured and the traps (fresh-worktree deno flags, test-named deploys, unrunnable RLS check)
metadata:
  type: project
---

`healthapp-extract-exam` now claims the upload (one atomic update, `queued|failed|draft-with-null-kind -> reading`), answers 202 `{outcome:"queued"}` and reads in `EdgeRuntime.waitUntil` (model 60 s with maxAttempts 2, identity, save, file analysis on what is left of 120 s). `documents.status` has six values (014); `healthapp-my-exams` lists and sweeps (reading > 3 min, queued > 10 min), `healthapp-exam-delete` deletes file then row. Measured on dev: reading 8-11 s, analysis +6-7 s, about 18 s end to end; the 150 s platform limit itself was not stress-tested.

**Why:** direction 1/2, the founder scans exams in a row (CTO decision on MIN-4555).

**How to apply:**
- Deploy a copy under another name to test without touching the live function: `cp -R functions/<fn> functions/<fn>-t`, delete its handler_test.ts, add `[functions.<fn>-t] verify_jwt=false` to config.toml, `supabase functions deploy <fn>-t --project-ref fnbnhvgrnkrbsrwhgcgc --use-api --no-verify-jwt`, then remove the dir and the config lines before committing. The index.ts keeps the real `safely(..., "<fn>")` name in logs.
- A new worktree needs `npm ci`; deno tests there run as `deno test -A --node-modules-dir=none supabase/functions` (without `-A` the boundary tests fail on file reads; without the flag `npm:postgres` is not found). Deno lint/fmt are not the repo's gate (89 files unformatted).
- `file_analysis_rls_check.sql` needs a confirmed document with a file_analysis row; dev had none (22004 on grants insert), so it cannot run until one exists. A real-claims count over all statuses in a rolled-back DO block (raise exception at the end) is the substitute.
- The in-memory fake store cannot catch a wrong WHERE: run the exact statement in a rolled-back DO block on dev, and pin its rule text in a boundary test. Mutation sweeps run each mutant in a copy of `supabase/` (no restore step, no git).
- Linear: `~/.claude/bin/linear-as BACKEND` works from any cwd; a comment from a file needs `jq --rawfile`. Repo has no lane labels; the lane is in the PR title.
