---
name: healthapp-handshake-build-lessons
description: Traps and techniques from the MIN-4484/4481 handshake and RLS-check build (PR #24): policy subqueries obey RLS, RETURNING hides a missing insert policy, temp-name mutant functions, SQL check harness
metadata:
  type: project
---

- An `exists (select ... from grants ...)` inside another table's policy runs under the caller's RLS on `grants`, so `grants_parties` already hides a grant from a second doctor; the `g.doctor_id = auth.uid()` clause in the doctor policies is redundant. A control that removes only one layer stays green; remove both.
- A PostgREST insert with `Prefer: return=representation` for someone else's row fails on the read-back (select policy), which hides a missing insert policy. Refusal checks use `return=minimal`.
- Postgres does not order function arguments: `jsonb_build_object(f(insert...), (select ... the inserted row))` read the row before the insert. Separate statements.
- Live control for a function: copy the tree to a scratch dir, mutate one line, deploy as `healthapp-zzN` (`supabase functions deploy ... --use-api --no-verify-jwt`), call it, `supabase functions delete` it. Real functions never touched. SQL controls: DDL inside a plpgsql block that raises `undo` rolls back with the fixtures (no psql needed, one execute_sql call; pg_temp functions live for that call).
- Real tokens without the persona password: insert throwaway users into `auth.users` (+ identities) with a bcrypt hash made by `htpasswd -bnBC 10`, profiles by SQL, delete afterwards (profiles cascade).
- On the Supabase gateway a caller-supplied `x-forwarded-for` did not change the demo-login per-address key (spoofed addresses still hit the 5-a-minute limit). A global ceiling still needs its own test with an injected address.
- Realtime `postgres_changes` on `healthapp_dev.grants` works under RLS (second doctor heard 0 events); expiry only produces an event when something writes the row (lazy write in grant-status).
- First call of each edge function is about 2 s cold, warm 300 to 600 ms.
