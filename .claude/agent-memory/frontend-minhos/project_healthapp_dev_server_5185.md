---
name: healthapp-dev-server-5185
description: healthapp redesign worktree (healthapp-wt-min4585): founder's local dev server on 5185 can disappear; patient screens need a mocked backend to render
metadata:
  type: project
---

The founder watches the redesign at `http://localhost:5185/` (Vite from `~/AppDevelopment/healthapp-wt-min4585`, `.env.local` → dev). On 2026-11-14 it was gone mid-run (not stopped by Ren, cause unknown). Ren started a new `npx vite --port 5185 --strictPort` (localhost only). The auto-mode classifier blocked a restart with `--host`, so the phone-on-LAN command is left to the coordinator.

**Why:** the issue asks for laptop and phone on the same network; plain `vite` binds localhost only.

**How to apply:** before verifying, `lsof -iTCP:5185 -sTCP:LISTEN`; never kill it by pattern. Patient screens need the demo passcode, which agents do not have: render them with a Playwright script that routes `https://smoke.invalid/**` (see `e2e/smoke.spec.ts` for the pattern) on another port, never 5185.
