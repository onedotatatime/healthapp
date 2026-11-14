---
name: healthapp-data-api-exposure
description: healthapp_dev in conductor is unreachable through the Data API (406 PGRST106) until a human adds it to Exposed schemas; no safe agent route
metadata:
  type: project
---

Every supabase-js / PostgREST call on schema `healthapp_dev` (browser reads, functions using the caller's token, and even the service-role `adminDb(env)` client) answers 406 PGRST106 until `healthapp_dev` is added to conductor's Data API "Exposed schemas" (dashboard → Project Settings → Data API). Measured 2026-11-14: exposed = `public, graphql_public` only; `healthapp-demo-login` fails closed (503) on its `rate_events` table because of it.

**Why:** the management API token lives in the keychain and reading it was refused; `alter role authenticator set pgrst.db_schemas` (in-database PostgREST config) is not set on conductor today and would silently override the dashboard value for Conductor's own API later — a hidden trap in a production project.

**How to apply:** before claiming any REST-path check on healthapp, curl `/rest/v1/_applied` with `Accept-Profile: healthapp_dev`; if 406, ask for the dashboard click (founder, or the coordinator in Chrome as was done for Cloudflare on MIN-4454). Verify RLS meanwhile with SQL as `authenticated` + `request.jwt.claims` inside a DO block that ends in `raise exception` (forces rollback, returns the counts). `scripts/rls-check.sh <env>` is the real-token check for after the click. See [[healthapp-gemini-model-ids]].
