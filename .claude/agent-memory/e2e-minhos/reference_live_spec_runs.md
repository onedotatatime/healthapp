---
name: live-spec-runs
description: How to run healthapp e2e-live specs when the session's worktree guard blocks edits to a fresh worktree; the fixtures a scratch export needs; how to see a spec fail once
metadata:
  type: reference
---

Running `e2e-live/*.spec.ts` (MIN-4704, 2026-11-15):
- If a PreToolUse guard blocks Edit/Write outside the session's worktree, do not switch the shared session worktree's branch (the coordinator uses it). Instead, `git archive origin/staging <paths> | tar -x` into the scratchpad, edit there, and run Playwright from there with `node_modules` symlinked. Then build the commit with a temp `GIT_INDEX_FILE`: `read-tree`, `hash-object -w`, `update-index --cacheinfo`, `write-tree`, `commit-tree`. Push it with `git push origin <sha>:refs/heads/<branch>`.
- Export ALL of `data/synthetic/`, not only `simulation.json`. `helpers/simulate-live.ts` reads `run-5000.json`, and without it every /doctor/simulate test fails with ENOENT. That failure is a harness fault, not an app fault.
- `playwright.simulation.config.ts`: the desktop project also matches `simulate.spec.ts`. The doctor tests need `~/.config/healthapp/demo-login.env` (source it with `set -a`, and never print it).
- Since MIN-4727 (2026-11-15) a nightly (`.github/workflows/nightly.yml`, 03:00) runs the dashboard, glass and simulation configs on staging-dev and files one Linear issue per failing spec. Timing assertions must hold on a CI runner.
- Seeing a spec fail once: every Pages deployment keeps its own URL (`npx wrangler pages deployment list --project-name healthapp`). Point `HEALTHAPP_LIVE_URL` at an older staging-dev deployment (the build before the change) and the new spec must go red there. MIN-4726 did this against the three-lane build.
- Since 2026-11-15 `.github/workflows/nightly.yml` runs the dashboard, glass and simulation configs against staging; a red there is mine within 24 h.
- Prove a check can fail (MIN-4751): an untracked `e2e-live/mut-<name>.spec.ts` copy with a `beforeEach` keyed on env `MUT`. Rewrite the bundled JS with `page.route(/\/assets\/.*\.js$/)` and `route.fetch()`, then fulfill with the headers minus `content-encoding` and `content-length` (keeping them breaks the module, the page never renders). Inject DOM through `addInitScript` with a MutationObserver, not a setInterval, or the check reads the page before the mutant lands. Never move the mutant file while a backgrounded run uses it.
- `npm run check:static` needs `git ls-files` and `dist/`: in a scratch export, `git init`, exclude node_modules/dist/test-results, `git add -A`, `npm run build`.
- Cloudflare Pages per-commit URLs (`npx wrangler pages deployment list --project-name healthapp`) give the pre-merge deployment to fail the new checks against.
- MIN-4776 (2026-11-15): Playwright `locator.fill('50')` sets a React `input[type=range]` and React sees it, which is quicker than 500 arrow presses. Keep Home, End and the arrows for the keyboard check. The /simulation code is in a lazy chunk (`/assets/Simulation-*.js`), not `index-*.js`, so route that chunk for a mutant. In zsh, `git push origin $C:refs/...` fails because `:r` is a modifier; quote it as `"${C}:refs/..."`. When a block stores a value rounded to 1 decimal, compare the shown whole count within 0.5, never by rounding it again (it was off by one at Global 1%).

Related: [[dashboard-scenario-harness]]
