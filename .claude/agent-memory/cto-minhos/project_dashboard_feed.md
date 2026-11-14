---
name: project-dashboard-feed
description: Healthapp progress dashboard (MIN-4456/4458) lives in the conductor Supabase project, bucket healthapp-dev; decisions on E1/E2, lane and path; post-build pass and the Access-first order
metadata:
  type: project
---

CTO pre-build decision 2026-11-14 on MIN-4456: the hackathon progress dashboard is a static Pages project `healthapp-dashboard` behind Cloudflare Access, fed by two session-less Edge Functions (`healthapp-dashboard-ingest`/`-feed`) writing one object `dashboard/snapshot.json` in bucket `healthapp-dev` of the conductor project. Lane C; no dashboard staging, straight to the protected live URL.

Post-build pass 2026-11-14 (MIN-4458, PR #6 head 5fa5af0): sound. Accepted Cron's deviations (JSON stored under the bucket's `application/pdf` stand-in; public anon key travels in the fragment `&a=` so no JWT is ever tracked; bare `service_role` dropped from key patterns, `dashboard.yml` list is the repo's one list). Path question on MIN-4460: no local path in the snapshot, `hasWorktree` boolean only; the job never runs `git fetch` or anything that takes a lock.

**Why:** founder said "also make it working and deploy it live" and "We need to have it with real data"; healthapp lives inside conductor by his choice ("Conductor too"); the dev wipe removes the dashboard on purpose, the demo wipe never touches it.

**How to apply:** a key in a URL fragment behind Cloudflare Access must be opened only after an Access login on the bare URL, otherwise the login redirect carries the fragment onto the cloudflareaccess.com page and the PIN form drops it. Verify deployed Edge Functions with `supabase functions download <name> --project-ref … --use-api` in a scratch dir (one function per dir) and diff against the PR head. See [[healthapp-real-data-regime]].
