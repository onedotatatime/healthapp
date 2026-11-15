---
name: dashboard-pages-edge-cache
description: healthapp-dashboard.pages.dev production host keeps removed files at the edge (s-maxage=604800) after a new deploy; check the hash URL too
metadata:
  type: project
---

After deploy 6b3942fd (2026-11-14, Direction A replaced B), the production host still served the old `/direction-B/` files with `cf-cache-status: HIT` and `cache-control: public, s-maxage=604800`, while the hash URL showed the Pages fallback. Our `_headers` does not set s-maxage.

**Why:** a removed or wrong file can linger on the production host for up to 7 days, even after `wrangler pages deployment delete`.
**How to apply:** after every dashboard deploy, curl both the production host and the new hash URL, and do not read a 200 on production as proof the new bundle is serving that path. Flagged to the CTO on MIN-4532.
