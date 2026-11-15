---
name: healthapp-function-smoke-creds
description: healthapp post-deploy dev smoke (scan-next-live.ts) needs SUPABASE_ANON_KEY + HEALTHAPP_DEMO_PASSCODE, which a Release run does not have
metadata:
  type: project
---

`scripts/scan-next-live.ts` (the post-deploy synthetic smoke for `healthapp-extract-exam`) needs `SUPABASE_ANON_KEY` and `HEALTHAPP_DEMO_PASSCODE` in the env. A Release run on 2026-11-15 (MIN-4636, v23) had neither, and auto mode refused searching for the passcode, so v23 was deployed with only a boot check (OPTIONS 204, POST without env header = handler's 400) and the smoke was handed back as owed. No Supabase logs tool was available either.

**Why:** the deploy brief assumed the smoke could run; it could not, and searching for the secret is refused.
**How to apply:** at the start of a function-deploy round, check both env vars (test -n, never print) before deploying; if missing, say so in the Plan and in the hand-back so the coordinator passes them or another role runs the smoke. The boot check plus the download-diff (deployed copy vs the git commit, file by file) is what can be done without credentials. Related: [[healthapp-local-lane-run]].
