---
name: healthapp-identity-name-only-a
description: MIN-4630 part A shipped as branch fix/min-4630-identity-name-only; local-run traps (deno --allow-read, deno.lock, check:static needs git)
metadata:
  type: project
---

matchIdentity (supabase/functions/_shared/identity.ts) no longer returns id_mismatch: equal printed ID upgrades to match, else extra<=1 name_only, extra>=2 name_mismatch. Commit 58d0207, pushed; Release opens the PR and deploys (founder's yes).

**How to apply:** local PR-lane run for healthapp edge changes is `deno test --node-modules-dir=none --allow-read supabase/functions/` (without --allow-read 32 source-scan tests fail on permissions only). Deno rewrites `deno.lock` on a run: `git checkout -- deno.lock` before committing. `npm run check:static` needs git (run it in the worktree, not in a `git archive` copy); typecheck/test/build/smoke run fine in an archive copy with no .env.local.
