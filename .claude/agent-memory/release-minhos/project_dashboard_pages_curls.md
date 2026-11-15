---
name: dashboard-pages-curls
description: healthapp-dashboard Pages curl checks need -L on index.html (308 to the folder URL); local 8765 page is a staging checkout pulled with ff-only
metadata:
  type: project
---

Cloudflare Pages answers `/direction-A/index.html` with a 308 to `/direction-A/`, so a CTO curl line without `-L` counts 0 on an empty body. Re-run with `-L` and compare with the bundle file before calling a fail (MIN-4601, 2026-11-15).

The local page at 127.0.0.1:8765 serves `~/AppDevelopment/healthapp-dashboard-live/docs/dashboard/drafts` straight from a clean staging checkout: `git pull --ff-only` is the sync. A reinstall (`chat_service.sh install`) is only needed when `chat_bridge.py`, `chat_guard.py`, `snapshot.py` or `hand-set.sample.json` changed in the pulled range.

**Why:** a false fail would have triggered the CTO's delete-and-redeploy rule for nothing.
**How to apply:** every dashboard Pages release; rollback target is the previous production id from `wrangler pages deployment list --environment production`. See [[landing-release-lessons]].
