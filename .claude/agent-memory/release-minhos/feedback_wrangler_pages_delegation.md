---
name: wrangler-pages-delegation
description: wrangler 4.16x `pages project create` silently creates a Workers project and uploads whatever static folder it finds in cwd; use --force once, from an empty folder
metadata:
  type: feedback
---

From wrangler 4.162, `wrangler pages project create <name>` is delegated to Cloudflare Workers by default: it writes a `wrangler.jsonc` in the cwd, auto-detects any static folder there (it picked a `pages/` folder holding the real dashboard bundle) and deploys it publicly on `<name>.<account>.workers.dev`. No Pages project is created.

**Why:** MIN-4459, 2026-11-14: the dashboard bundle was public on workers.dev for about 2 minutes before Access existed, against CTO decision 3. Caught by curling the printed URL, Worker deleted.

**How to apply:** create a Pages project only from an empty folder, with `--force` (the one time it is needed; later `pages deploy` on an existing Pages project goes to Pages). Always pass the upload directory as an absolute path. After any wrangler create/deploy, curl the printed URL and check `wrangler pages project list` before moving on.
