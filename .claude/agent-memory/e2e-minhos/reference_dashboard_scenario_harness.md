---
name: dashboard-scenario-harness
description: How to drive the healthapp dashboard (docs/dashboard/drafts) in a browser without keys or a backend — feed routing, poll speed-up, Playwright location
metadata:
  type: reference
---

The healthapp dashboard is static HTML in `docs/dashboard/drafts` (no build). To test it:
- Export `git archive origin/staging docs/dashboard dashboard` to a scratch folder and serve it with `python3 -m http.server` on 127.0.0.1. No worktree is needed, so Release has nothing to clean up.
- Direction B reads `?feed=<same-origin path>`. Route that path in Playwright and serve edited copies of `dev/fresh.json` or `dev/nodata.json`, or a 404/500. Abort every non-local request so no request reaches the Supabase feed and no key is involved.
- `?now=2026-11-14T22:30` moves the clock. Milestone `late-*` flags depend on it.
- A refresh while the page stays open: route `shared/feed-config.js` and replace `pollMs: 60000` with about 1200. This changes no source file.
- Playwright lives at `.claude/worktrees/e2e-min-4449/node_modules/playwright`, version 1.65.1 on 2026-11-14. There is no package at the repo root.
- `dashboard/pages-bundle.sh <out-dir outside repo>` builds the public stub bundle for the "public site" checks.
- Measure the size of a dialog only after `getAnimations()` finish, because the entrance scales it to 0.96.
- To see an assertion fail once, mutate the shipped JS through `page.route` (env `MUT=...`) instead of editing files.

First used on MIN-4533 (off-track alert). See [[dashboard-feed]] in the CTO's and backend's memory for the feed contract.
