---
name: healthapp-function-deploys
description: healthapp edge functions are never deployed by CI and one function serves both dev and demo; how to time and verify a function deploy
metadata:
  type: project
---

No workflow deploys healthapp edge functions (`pr.yml` builds and tests, `dashboard.yml` only checks), so a merge to `staging` changes nothing live. Each function is deployed by hand, by name (`--use-api`, never `--prune`). Its `verify_jwt` comes from `supabase/config.toml`.

One function serves both `dev` and `demo`; the `x-healthapp-env` header picks which. Deploying one therefore touches the demo too.

**Why:** found on MIN-4542, 2026-11-14. A change with no behavioural effect was held until after the Sun 15 Nov submission freeze: deploying it inside the window was all risk and no gain.

**How to apply:**
- In a deploy decision, require a diff of the deployed copy (`supabase functions download … --use-api`) against staging's import graph first, because `_shared` drifts between deploys.
- After the deploy, require one real extract on a synthetic photo.
- When replaying CI on a `git archive` export, `check:static` needs a throwaway `git init` (it calls `git ls-files`), and `deno check` needs `--node-modules-dir=none`.

Related: [[healthapp-real-data-regime]]
