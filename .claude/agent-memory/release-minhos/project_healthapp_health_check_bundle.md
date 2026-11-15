---
name: healthapp-health-check-bundle
description: healthapp /health is client-rendered; read env and sha from the deployed JS chunks (curl user agent), and staging is demo while staging-dev is the dev twin since MIN-4658
metadata:
  type: project
---

`/health` on any healthapp Pages address is drawn in the browser, so `curl /health` returns only the HTML shell. The env and the 7-char sha are compiled into the chunks: fetch the page, follow every `/assets/*.js` it and its chunks reference, and grep `VITE_HEALTHAPP_ENV:` followed by the backtick-quoted env (the minifier quotes every string with backticks, so `"demo"` and `scope:"local"` never match; use `scope:` + backtick `local` backtick) and a backtick-quoted 7-hex sha. The schema name `healthapp_demo` is built at runtime, so it is not a literal in the bundle. Production (main) was checked this way at merge 30c0fb7 on 2026-11-15. Python urllib gets 403 from Cloudflare unless a `User-Agent` (for example `curl/8`) is sent. A full crawl is 14 chunks, a few seconds.

Since 2026-11-15 (MIN-4658, merge a3d8c3c): `staging` builds as `demo` (founder's real records, no agent sign-in there, MIN-4526); `staging-dev` is the `dev` twin, fast-forwarded by Release after every staging merge; any other branch preview is `dev`.

**Why:** the CTO left "does Pages set CF_PAGES_BRANCH=staging" unverified; the bundle read proved it without a browser or a sign-in.
**How to apply:** after every staging merge, push the twin and check both addresses this way; a staging merge also needs its schema files in `healthapp_demo._applied` first. Related: [[healthapp-sql-needs-connector]].
