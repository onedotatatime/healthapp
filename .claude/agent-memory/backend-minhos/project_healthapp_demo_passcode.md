---
name: healthapp-demo-passcode
description: Where the healthapp demo-login passcode lives (local file, mode 600), how rls-check gets real tokens with it, and the rate-limit cost of each run
metadata:
  type: project
---

`HEALTHAPP_DEMO_PASSCODE` was rotated on 2026-11-14 (MIN-4492). It is now 16 random characters and lives only in `~/.config/healthapp/demo-login.env` (mode 600) and in the Supabase secret. Nobody holds `HEALTHAPP_PERSONA_PASSWORD` locally.

**Why:** the CTO required 12+ random characters before real data. Earlier runs set both secrets without keeping the values, so nobody could get a real token.

**How to apply:**
- Real tokens come from `healthapp-demo-login` (patient, doctor). `scripts/rls-check.sh` does this when `HEALTHAPP_DEMO_PASSCODE` is set: `set -a; . ~/.config/healthapp/demo-login.env; set +a`.
- The outsider persona has no demo-login route. Check it in SQL as `authenticated` with a random `sub`.
- Each run costs 2 of the 5 tries per minute per address. Once #24 is deployed, it also costs 2 of the 30-a-minute global ceiling.
- Never print the value. Set it with `supabase secrets set "NAME=$var"`, built inside the same command.
- When another Cron run changes the same script in an open PR, merge that PR's branch into yours and resolve with a superset. This stacks the PRs; say which merges first. See [[healthapp-assistant-checks]].
