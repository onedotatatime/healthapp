---
name: project-healthapp-matches-replay
description: healthapp matches timeout (MIN-4649) — the CTE-folding cause, 018/019, and the recipe for a throwaway Postgres 18 replay on this Mac (paths, flags, what the harness refuses)
metadata:
  type: project
---

MIN-4649 (2026-11-15): the doctor's matches RPC timed out (8 s, `authenticated`) on the founder's ~33-doc record.
Cause: a CTE referenced once is folded into the outer query, so `match_patient_codes` (never inlined: it carries
`set search_path = ''`) ran once per cohort row. 018 computes it once into a plpgsql variable; 019 seeds the 5,000
records of /doctor/simulate (run-5000.json), guarded on 018. Measured: 13.6 s -> 35 ms at 400; 170 s -> 41 ms at 5,000.

**Why:** any per-patient helper used inside a set-returning or per-row query will repeat the same way; the
fix pattern is a variable, not `materialized`, so the "once" is visible.

**How to apply:**
- A throwaway Postgres exists: `/opt/homebrew/opt/postgresql@18/bin` (not on PATH). initdb needs
  `--locale=C --lc-ctype=en_US.UTF-8 --locale-provider=builtin --builtin-locale=C.UTF-8` (LANG is unset; builtin
  C.UTF-8 lowers Greek). The scratchpad path is too long for a unix socket: run TCP only
  (`listen_addresses=127.0.0.1 unix_socket_directories=''`). Stub before 001: roles anon/authenticated/service_role,
  `auth.users(id,email,raw_app_meta_data)`, `auth.uid()` from `request.jwt.claim.sub`, `storage.buckets`,
  `publication supabase_realtime`.
- "Runs once" proof: `track_functions=all` + `pg_stat_get_xact_function_calls('<fn>'::regprocedure)` inside the
  same transaction as the RPC call (406 -> 1). auto_explain with nested statements is unusable here (every
  non-inlined helper call logs a plan); EXPLAIN the inner query via PREPARE with the same params instead.
- `hdb render` refused file names with digits until 018/019 (regex widened to `[a-z0-9_]+`).
- The harness refuses `source` and any long compound command: put each step in a script file and `bash` it.
- `npm ci` is needed in a fresh worktree; `deno test` rewrites deno.lock: `git checkout -- deno.lock` before commit.
