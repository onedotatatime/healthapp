---
name: healthapp-glass-tabbar-and-harness
description: healthapp iOS glass redesign: patient tab bar holds three tabs only (four clip at 390), and where the mocked-backend phone harness lives
metadata:
  type: project
---

The patient glass tab bar fits three tabs at 390 (87 px each with four; "Who had access" is 108 px at 14px/600). Extra destinations go in the title row as a 44 px round photo link (patient `PatientProfileLink`, doctor `/doctor` row), never a 4th tab and never a smaller label style.

**Why:** measured on MIN-4595 (2026-11-14); Pix's spec already says three tabs for that reason.
**How to apply:** before adding a tab, measure label widths in the built app; the harness for phone renders is a Playwright script with a fully mocked `https://smoke.invalid` backend (copy the `mockBackend` in `e2e/smoke.spec.ts`), served by `VITE_SUPABASE_URL=https://smoke.invalid VITE_SUPABASE_ANON_KEY=x VITE_HEALTHAPP_ENV=dev npx vite --host 127.0.0.1 --port 5199`; `/preview/doctor-analysis` shows the doctor panels on synthetic data, `/doctor/connect` shows the real timer shell when `healthapp-grant-status` returns an active grant. Scratch scripts are in the session scratchpad, not the repo.
