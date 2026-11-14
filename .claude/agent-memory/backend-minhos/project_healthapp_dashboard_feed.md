---
name: project-healthapp-dashboard-feed
description: How the healthapp dashboard feed is wired (two edge functions, bucket object, launchd job) and the traps hit while building it
metadata:
  type: project
---

Dashboard feed (MIN-4456): Mac launchd job `ai.minhos.healthapp-dashboard` runs `~/.healthapp-dashboard/snapshot.py --push` every 180 s, POSTs to `healthapp-dashboard-ingest`; the page reads `healthapp-dashboard-feed`. Both live in the conductor Supabase project (ref `fnbnhvgrnkrbsrwhgcgc`), object `dashboard/snapshot.json` in bucket `healthapp-dev`. Keys: push and view in `~/.healthapp-dashboard/*.key`, sent in `x-dashboard-key`; the gateway JWT (public anon key) goes in `Authorization`, so a function-level key can never use that header.

**Why:** founder asked for a live, deployed dashboard by Sun 15 Nov 18:00 Athens. CTO decision on MIN-4456 fixed the architecture; the keys never appear in Linear, chat or the repo.

**How to apply:**
- `healthapp-dev` allows only images and PDF (MIN-4452 SQL), so the JSON is uploaded with the stand-in type `application/pdf`. If someone adds `application/json` to the bucket, change `contentType` in the ingest `index.ts`.
- Deploy by name only: `supabase functions deploy <name> --project-ref fnbnhvgrnkrbsrwhgcgc --use-api`; never `--prune`. `supabase projects api-keys -o json 2>/dev/null` gives the legacy anon key (stderr has an update notice that breaks JSON parsing if merged).
- Re-running `dashboard/install.sh` is idempotent (keys kept, secrets re-set, job re-bootstrapped, clipboard refilled); `--rotate` makes new keys.
- A mutation sweep run against a red baseline "kills" everything for the wrong reason: check the baseline is green first.
