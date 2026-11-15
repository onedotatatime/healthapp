---
name: playwright-evidence-scripts
description: How to get browser evidence on a healthapp page without a new spec: a throwaway script outside the repo, fake smoke.invalid backend, service worker blocked, CDP CPU throttle
metadata:
  type: feedback
---

For browser evidence (timings, 4x CPU, 390 px, forced load states) write a throwaway `.mjs` in the scratchpad that imports `node_modules/playwright-core/index.mjs`, never a spec in the repo (Ren writes no Playwright, MIN-4257).

**Why:** the CTO wants numbers in words on the issue, and the Claude_Browser pane has no CPU throttle. The repo's own smoke mock (`e2e/smoke.spec.ts`: `smoke.invalid`, passcode `letmein`, doctor id `...b1`) signs a doctor in with no real credentials, if the preview is built with `VITE_SUPABASE_URL=https://smoke.invalid VITE_SUPABASE_ANON_KEY=smoke-anon-key VITE_HEALTHAPP_ENV=dev`.

**How to apply:**
- `browser.newContext({ serviceWorkers: 'block' })` whenever you use `page.route` on assets: the app's `sw.js` serves cached chunks and `route` silently never fires (a blocked chunk still loaded, which looked like a bug in the component).
- CPU throttle: `ctx.newCDPSession(page)` then `Emulation.setCPUThrottlingRate`. Measure click to DOM committed with a MutationObserver plus a microtask check (React commits a discrete click synchronously), and click to second rAF for "painted".
- After `npm run build` with other env values the dist no longer has the fake values: rebuild with them before running the script.
- `npm ci` is needed first in a fresh worktree (no node_modules; `tsc: command not found` is that).
- Look at a screenshot once before calling a layout done: a `ch`-based grid column wrapped "50,000" onto two lines and no DOM assertion would have said so.
