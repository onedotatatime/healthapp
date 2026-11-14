---
name: healthapp-scan-next
description: MIN-4556 (PR #58) background reading: claim + 202 + waitUntil, status values, what was measured and the traps (fresh-worktree deno flags, test-named deploys, unrunnable RLS check)
metadata:
  type: project
---

`healthapp-extract-exam` now claims the upload (one atomic update, `queued|failed|draft-with-null-kind -> reading`), answers 202 `{outcome:"queued"}` and reads in `EdgeRuntime.waitUntil` (model 60 s with maxAttempts 2, identity, save, file analysis on what is left of 120 s). `documents.status` has six values (015, renumbered from 014 when #51 took 014_match_coding); `healthapp-my-exams` lists and sweeps (reading > 3 min, queued > 10 min), `healthapp-exam-delete` deletes file then row. Measured on dev: reading 8-11 s, analysis +6-7 s, about 18 s end to end; the 150 s platform limit itself was not stress-tested.

**Why:** direction 1/2, the founder scans exams in a row (CTO decision on MIN-4555).

**How to apply:**
- Deploy a copy under another name to test without touching the live function: `cp -R functions/<fn> functions/<fn>-t`, delete its handler_test.ts, add `[functions.<fn>-t] verify_jwt=false` to config.toml, `supabase functions deploy <fn>-t --project-ref fnbnhvgrnkrbsrwhgcgc --use-api --no-verify-jwt`, then remove the dir and the config lines before committing. The index.ts keeps the real `safely(..., "<fn>")` name in logs.
- A new worktree needs `npm ci`; deno tests there run as `deno test -A --node-modules-dir=none supabase/functions` (without `-A` the boundary tests fail on file reads; without the flag `npm:postgres` is not found). Deno lint/fmt are not the repo's gate (89 files unformatted).
- `file_analysis_rls_check.sql` needs a confirmed document with a file_analysis row; with the addendum's automatic save dev has them, and it passes 19/19 (paste the rendered file into execute_sql).
- The in-memory fake store cannot catch a wrong WHERE: run the exact statement in a rolled-back DO block on dev, and pin its rule text in a boundary test. Mutation sweeps run each mutant in a copy of `supabase/` (no restore step, no git).
- Linear: `~/.claude/bin/linear-as BACKEND` works from any cwd; a comment from a file needs `jq --rawfile`. Repo has no lane labels; the lane is in the PR title.

**Addendum (MIN-4555, founder: scan in a row, check and unconfirm after):** a reading that passes identity is saved as `confirmed` + `documents.unchecked` (016) with no tap; `healthapp-unconfirm-doc` takes it back to `draft`; `my-exams {doc_id}` opens a saved exam and clears its mark.
- Save and confirm must be ONE transaction. First version saved a `draft` then confirmed in a second call; a live poll caught the row in between (poll stops on "not queued or reading", so the screen would stay on draft). `saveExtraction(..., auto)` now runs the patient's confirm plan inside its own transaction through `writeConfirm`, the store's only writer of `confirmed`. A fake-store test cannot see this; the live 5-in-a-row run did.
- A migration number clash is settled by renumbering the file that is applied elsewhere (git mv, references) and renaming its `_applied` row on every env that has it (`update healthapp_<env>._applied set file = ...`); never touch the other PR's file or row. Next number after the highest on staging AND every open PR.
- A pull_request workflow does not start when the PR conflicts with its base (no `static`/`smoke` runs appear, only Pages): `gh pr view --json mergeable`. Merge staging in and resolve (here only the memory index).
- The live script needs the passcode: `set -a; . ~/.config/healthapp/demo-login.env; set +a` works inline; listing the directory is refused by the harness. The publishable key is public (Supabase MCP get_publishable_keys). deno needs `--node-modules-dir=none` once `npm ci` has run.
- `-t` copies for evidence: deploy from a scratch dir with `_shared` and renamed function dirs (no repo edits), delete by name with `supabase functions delete <name>-t --project-ref ... --yes`.
