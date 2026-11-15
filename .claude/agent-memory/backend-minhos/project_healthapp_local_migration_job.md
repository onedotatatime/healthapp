---
name: healthapp-local-migration-job
description: how to run healthapp's Lane C migration job and the real pgstore statements locally with no docker and no psql (PGlite in the scratchpad), and its traps
metadata:
  type: project
---

MIN-4637 (2026-11-15): no psql, no postgres, OrbStack daemon off on this machine. A throwaway real Postgres that works:
`npm install @electric-sql/pglite @electric-sql/pglite-socket` in the scratchpad, apply the rendered SQL files with
`db.exec`, then serve it with `new PGLiteSocketServer({ db, port: 55432, host: "127.0.0.1", maxConnections: 4 })` and
point `SUPABASE_DB_URL=postgres://postgres@127.0.0.1:55432/postgres` at it to run the real `pgstore` methods from a Deno
script (`deno run -A --node-modules-dir=none`). Never dev or demo.

**Why:** the fake store cannot catch a wrong WHERE or a constraint the code violates; this caught nothing new this time but
proved 22 statement-level behaviours and killed two statement mutants against the real 017 constraints in about a minute.

**How to apply:**
- Stubs the healthapp files need: roles anon/authenticated/service_role, `auth.users(id)` + `auth.uid()`, `storage.buckets`,
  `storage.objects` (RLS on, for 000's policy), and `create publication supabase_realtime` (002 adds tables to it).
  003/007/011/012 seeds do not apply (they need `auth.users.email` and each other); nothing in documents needs them.
- pglite-socket defaults to ONE connection: a second postgres.js client gets ECONNRESET. Set `maxConnections`.
- A check that copies the live table with `create temporary table x (like t including constraints)` must drop the temp
  table first: in one session the copy would keep the constraints of the first call, and a force-red run would lie.
- Mutants of SQL statements: copy `supabase/functions/_shared` into the scratchpad, sed the copy, import the copy. Check the
  sed applied (`grep -c`) before trusting a "survived" (the first sed missed: the clause ended a line, not a backtick).
- The script lives only in the scratchpad (`pg/migjob.mjs`, `pgstore_run.ts` this time); rewrite it from this note.
