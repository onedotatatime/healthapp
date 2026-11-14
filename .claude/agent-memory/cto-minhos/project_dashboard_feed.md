---
name: project-dashboard-feed
description: Healthapp progress dashboard (MIN-4456/4458) lives in the conductor Supabase project, bucket healthapp-dev; decisions on E1/E2, lane and path
metadata:
  type: project
---

CTO pre-build decision 2026-11-14 on MIN-4456: the hackathon progress dashboard is a static Pages project `healthapp-dashboard` behind Cloudflare Access, fed by two session-less Edge Functions (`healthapp-dashboard-ingest`/`-feed`) writing one object `dashboard/snapshot.json` in bucket `healthapp-dev` of the conductor project. Lane C; no dashboard staging, straight to the protected live URL.

**Why:** founder said "also make it working and deploy it live" (internal tool); healthapp lives inside conductor by his choice ("Conductor too"); the dev wipe removes the dashboard on purpose, the demo wipe never touches it.

**How to apply:** at the post-build review on MIN-4458, check the E1 conditions (constant bucket, no `x-healthapp-env`, 256 KB cap, no-store, CORS to the dashboard origin, only HEALTHAPP_DASHBOARD_* and SUPABASE_* env reads), Access answers on production AND previews before real content, and the fragment is stripped. See [[min-4449-healthapp-in-conductor]].
