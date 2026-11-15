---
name: healthapp-live-function-checks
description: How Release calls a deployed healthapp edge function for real as the dev doctor, proves a boxd machine is gone, and proves which commit a Pages host serves
metadata:
  type: project
---

Post-merge checks of `healthapp-simulate-live` (MIN-4671, 2026-11-15):
- **Dev doctor session:** the panel passcode is `HEALTHAPP_DEMO_PASSCODE` in `~/.config/healthapp/demo-login.env` (not `~/.claude/.env.agents`, whose entry was removed 2026-11-14). POST `healthapp-demo-login` with `{"persona":"doctor","passcode":…}`, `x-healthapp-env: dev`, origin `https://staging-dev.healthapp-8ui.pages.dev`; the answer carries `access_token`. Read the file in a script; never print it.
- **Calling the function:** `Authorization: Bearer <token>`, `x-healthapp-env: dev`, the same origin, body `{}`. Python `http.client` lets you close the socket after a given NDJSON line to simulate a tab leaving.
- **boxd:** `boxd list --json --region all` sees the org's shared machines (it showed the run's machine mid-run), so "empty after" is real proof.
- **Switch:** `supabase secrets set HEALTHAPP_SIMULATE_LIVE=dev|off|on --project-ref fnbnhvgrnkrbsrwhgcgc` takes effect on the next call, no redeploy. List secrets by name only (`awk -F'|' '{print $1}'`).
- **Which commit a host serves:** the build stamps `__COMMIT_SHA__` (7 chars of `CF_PAGES_COMMIT_SHA`) into a `client-*.js` chunk. Crawl index.html's chunks and grep the short SHA plus a new string.
- **deno check:** after `npm ci`, run it with `--node-modules-dir=none` (the flag `dashboard.yml` uses), or it looks for `npm:` packages in `node_modules` and fails.
- **No nightly:** healthapp has only the `PR` and `Dashboard` workflows (both `pull_request`); no scheduled browser suite exists as of 2026-11-15.

**Why:** the coordinator asked for real proof on staging-dev before the founder's click; each of these took a detour to find.
**How to apply:** any healthapp release whose function makes a paid external call. Related: [[healthapp-local-lane-run]].
