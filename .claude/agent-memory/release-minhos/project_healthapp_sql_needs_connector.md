---
name: healthapp-sql-needs-connector
description: healthapp SQL (migrations, hdb checks) on dev/demo only goes through the Supabase connector's execute_sql; a Release run without it must stop before the migration
metadata:
  type: project
---

healthapp has no psql URL for conductor, CLI 2.75 has no `supabase db query`, and `apply_migration` / `db push` are banned (they write conductor's migration table). So `scripts/hdb render|kept|scan` output is pasted into the Supabase connector's `execute_sql`. On 2026-11-15 (MIN-4640, part B) the Release run had no Supabase tools loaded: PR #109 merged to staging (`8624839`), then the run stopped before `017`, and no function was deployed (functions before 017 on both schemas break the exams list).

**Why:** the release order puts a migration before the function deploys; without the connector the order cannot start.
**How to apply:** at the start of any healthapp round that includes SQL, check that `execute_sql` is in the tool list; if not, say it in the Plan, do the PR/merge part only, and record the live function versions (`supabase functions list --project-ref fnbnhvgrnkrbsrwhgcgc`, read only) as rollback targets. Related: [[healthapp-function-smoke-creds]].
