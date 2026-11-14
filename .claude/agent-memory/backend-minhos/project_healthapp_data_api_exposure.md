---
name: healthapp-data-api-exposure
description: healthapp_dev is exposed in the Data API since 2026-11-14 ~17:15 UTC (REST with real tokens works); earlier it answered 406
metadata:
  type: project
---

Until 2026-11-14 ~17:15 UTC every PostgREST call on schema `healthapp_dev` answered 406 PGRST106; the founder's dashboard step added it to Exposed schemas and REST reads with real tokens now work (verified by a doctor-token count on `documents`). `healthapp_demo` was not checked.

**Why:** the exposure is a dashboard setting only a human can change; agents must not set `alter role authenticator set pgrst.db_schemas` (hidden override on Conductor's own API).

**How to apply:** before claiming a REST-path check, curl `/rest/v1/_applied` with `Accept-Profile: healthapp_dev`; 406 means ask for the click. Functions that read Postgres directly (`SUPABASE_DB_URL`, `postgres` npm driver) work either way and are the pattern for MIN-4475 and MIN-4484. See [[healthapp-handshake-build-lessons]].
