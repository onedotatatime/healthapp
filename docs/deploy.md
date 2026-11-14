# Deploy

How healthapp gets from a branch to a URL. Owner: Release (`release-minhos`). Issue: MIN-4450 (parent MIN-4449).
Decisions are quoted from the CTO's three "CTO · Decision" comments on MIN-4449 (14 Nov 2026), which supersede `docs/reviews/cto-review.md` sections 2.1, 2.7 and 2.9.

**Cloudflare is hosting only.** One Cloudflare Pages project serves the built React + Vite PWA. No Workers, R2, D1 or KV: every extra store is one more thing to wipe.

## 1. Where it runs

| Thing | Value |
| --- | --- |
| Cloudflare account | "Lefteris.georgaras@gmail.com's Account" (`e5f64a453111271fc64f577452c93737`) |
| Pages project | `healthapp`, Git-connected to `onedotatatime/healthapp` (Cloudflare's GitHub app) |
| Production URL | `https://healthapp-8ui.pages.dev` (`healthapp.pages.dev` was taken) |
| Staging URL (stable preview) | `https://staging.healthapp-8ui.pages.dev` |
| Other branches | `https://<branch>.healthapp-8ui.pages.dev`, plus one URL per commit |
| Build | framework preset None · `npm run build` · output `dist` · root `/` |
| Backend | Supabase project `conductor` (`fnbnhvgrnkrbsrwhgcgc`, eu-west-1, Ireland), schemas `healthapp_dev` and `healthapp_demo`. No healthapp project of its own (founder, 14 Nov: "Conductor too") |

Created 14 Nov 2026 by the coordinator in the founder's Chrome, after the founder answered MIN-4454 with "Dashboard + wrangler" and "open chrome and do it". wrangler 4 is logged in on the founder's Mac with OAuth to the same account.

## 2. Branch → environment (CTO decision 3 §1, confirmed)

| Git | Pages | URL | `VITE_HEALTHAPP_ENV` |
| --- | --- | --- | --- |
| `main` | Production | `https://healthapp-8ui.pages.dev` | `demo` after the real-data gate; `dev` before |
| `staging` | Preview | `https://staging.healthapp-8ui.pages.dev`, the stable `dev` URL for the H8 joint check | `dev` |
| any other branch | Preview | its own preview URL | `dev` |

> "Both environments use the same Supabase URL and the same anon key. Only the env name differs. Promotions `staging` → `main` are batched at the checkpoints (the gate, H12, the H18 freeze), not per change." — CTO, MIN-4449, Decision 3 of 3

Checked against the live project on 14 Nov 2026 (Cloudflare API, `GET /accounts/<id>/pages/projects/healthapp`): `production_branch = main`, `preview_deployment_setting = all`, `preview_branch_includes = ["*"]`, no excludes, production and preview deployments on. It matches the table; nothing to click.

**Before the real-data gate** production also runs on `dev`:

> "Production carries `VITE_HEALTHAPP_ENV=dev` until the real-data gate passes. Release then changes that one Production variable to `demo` and redeploys." — CTO, Decision 3 §2

After the wipe, Release sets it back to `dev` and redeploys (Decision 2, row 6). The health page shows the env name, so the two cannot be mistaken.

## 3. Gates

| Step | Needs |
| --- | --- |
| Branch → `staging` | A PR (direct push is blocked). The lane's checks green on the head: `static` now, `smoke` once it exists. Lane B adds the CTO's post-build review; Lane C (MIN-4452 and any schema work) adds `hdb check <env>` all zeros, pasted in the PR body. E2E is not a gate. Release merges with `gh pr merge --squash`, never `--admin`. |
| `staging` → `main` | A PR, at a checkpoint (gate, H12, H18). **E2E's Test result on the issue and the founder's explicit yes.** Silence is not a yes. |

Nothing on a PR runs against the deployed project.

## 4. Branch protection (GitHub)

Set on 14 Nov 2026 on `main` and `staging` with `gh api -X PUT repos/onedotatatime/healthapp/branches/<branch>/protection`:

- a pull request is required, with 0 approvals (no agent approves a PR; the gate is the checks and the reviews written on the issue);
- it applies to admins too (`enforce_admins`), so nobody pushes past it, the founder's account included;
- no force push, no branch deletion.

**Required status checks: none yet, on purpose.** `static` does not exist until Ren's scaffold PR (MIN-4451, branch `feat/min-4451-pwa-shell`) adds the workflow, and a required check that has never run blocks every PR, Ren's first one included. Release adds `static` as a required check on both branches straight after that PR merges, and `smoke` the moment it exists (CTO Decision 3 §3). Never a required check other than `static` or `smoke`.

Check it: `gh api repos/onedotatatime/healthapp/branches/main/protection` (and `staging`).

## 5. Environment variables (names only, never values)

| Name | Set where | Value |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Pages → Settings → Variables and secrets, Production and Preview; `.env.example` (name only) | the conductor project URL |
| `VITE_SUPABASE_ANON_KEY` | same | the conductor anon (publishable) key |
| `VITE_HEALTHAPP_ENV` | same | `dev` or `demo` (table in §2) |
| `CF_PAGES_COMMIT_SHA` | provided by Pages at build time | read in `vite.config`, shown on the health page; nothing to set |
| `HEALTHAPP_*` | Supabase function secrets only (`supabase secrets set HEALTHAPP_… --project-ref fnbnhvgrnkrbsrwhgcgc`, one at a time) | never in Pages, never prefixed `VITE_` |

Status on 14 Nov 2026: none of the three Pages variables is set yet (Production and Preview both empty).

`src/lib/env.ts` derives the schema (`healthapp_<env>`), the bucket and the function prefix from `VITE_HEALTHAPP_ENV`, and the app shows an error for any value other than `dev` or `demo`.

**Never in Pages or the repo:** the service-role key, the database URL or password, a Supabase access token, the Vertex key. Local values go in `.env.local`, which `.gitignore` excludes (only `.env.example` is tracked).

## 6. Never run against conductor from this repo (CTO Decision 1 §2)

Conductor is our production system. These would break or erase it:

- `supabase link`, `supabase db push | pull | reset | diff --linked`, `supabase migration repair`, the connector's `apply_migration` (conductor owns the migration history; `db reset` would erase it);
- `supabase config push` (overwrites conductor's Auth and API settings);
- `supabase functions deploy --prune` (deletes conductor's 28 functions);
- `supabase projects delete` (deletes Conductor);
- any unqualified DDL; any `drop` whose target does not start with `healthapp`; any `drop extension`; `create extension` only as `if not exists … with schema extensions`;
- any trigger on `auth.users`, any Auth hook, any change to Auth settings.

Allowed: `supabase functions deploy healthapp-<name> --project-ref fnbnhvgrnkrbsrwhgcgc` with the function named; `supabase secrets set HEALTHAPP_… --project-ref …` one by one (never `--env-file`); `supabase gen types`; the local stack. SQL lives in `supabase/sql/NNN_<name>.sql`, never in `supabase/migrations/`.

## 7. Headers

`_headers` (CTO Decision 3 §4) is Ren's file in MIN-4451. Acceptance after the first deploy: `curl -sI` shows `cache-control: no-cache` on `/` and on the service worker, and `immutable` on one hashed asset under `/assets/`.

## 8. Agent memory in this repo

One location: `.claude/agent-memory/<role>/`, the folder the agents read at runtime. The earlier copy under `docs/.claude/agent-memory/` was moved there on 14 Nov 2026 (MIN-4450); nothing was deleted.

## 9. Not here yet

- `scripts/wipe-demo` and the temporary agent rule in `conductor/CLAUDE.md`, both before the real-data gate (a new issue for Release, written by Back).
- A custom domain: out of scope.
