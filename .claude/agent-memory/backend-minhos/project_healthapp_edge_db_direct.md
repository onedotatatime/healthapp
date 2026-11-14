---
name: healthapp-edge-db-direct
description: healthapp functions read/write healthapp_<env> over SUPABASE_DB_URL (postgres.js), not PostgREST; the traps hit doing it (jsonb double encoding, untyped $1, draft rows vs contract)
metadata:
  type: project
---

The document functions (doc-create, extract-exam, confirm-doc, doc-photo) and demo-login's rate limit use `npm:postgres@3.4.5` on `SUPABASE_DB_URL` (`_shared/pgstore.ts`). It works from the hosted edge runtime today and does not need `healthapp_dev` in the Data API's exposed schemas, so demo-login works while PostgREST answers 406. Runs as the DB owner: RLS does not apply, every query filters on `patient_id` (or the grant) itself. See [[healthapp-data-api-exposure]].

**Why:** the exposed-schemas click is a founder step and the critical path (digitize, handshake, assistant) cannot wait for it.

**How to apply:**
- A jsonb parameter is passed as the value, never `JSON.stringify` it: with `$3::jsonb` the driver encodes again and Postgres answers 22023 "cannot extract elements from a scalar".
- In `INSERT ... SELECT $1, $2 ...` the params are untyped text: write `$1::uuid`.
- A draft row has `kind = null` before extraction, but the contract's `DocumentRow.kind` is not nullable: server-side rows are parsed with `DocRecordSchema` (kind nullable) and only `DocumentRow.parse` at the response edge. The in-memory fake agreed with the bug for a whole run; only the live call found it (MIN-2222 again).
- Postgres errors are logged by `code`, `constraint`, `column`, `routine` only (`safely()` in `_shared/http.ts`); `query_logs` on `function_logs` with `event_message like '%exception%'` finds them, a minute late.
- Never `apply_migration` for healthapp SQL: it writes a row into conductor's `supabase_migrations`. Use `execute_sql` (I had to delete the row). Deploy: `supabase functions deploy healthapp-<name> --project-ref fnbnhvgrnkrbsrwhgcgc --use-api --no-verify-jwt`; the bundler does not type-check, run `deno check` first.
- The Write/Edit tools are blocked outside the session's own worktree; make the branch in the session worktree instead of `git worktree add`.
