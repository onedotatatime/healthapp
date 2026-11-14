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

Demo sign-in passcodes (MIN-4541), one per deployment: `HEALTHAPP_DEMO_PASSCODE` opens dev only, `HEALTHAPP_DEMO_PASSCODE_DEMO` opens demo only (patient, doctor, and the `founder` persona, demo only). Values live in `~/.config/healthapp/demo-login.env` and `demo-login.demo.env` (mode 600), never in chat, Linear or git.

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

## 10. Project dashboard (internal tool, MIN-4445; MIN-4456, MIN-4457, MIN-4459)

Not the demo app. A separate static page plus two Edge Functions. CTO decisions on MIN-4456 (comment "CTO · Pre-build review").

| Thing | Value |
| --- | --- |
| Data home | Supabase project `conductor` (`fnbnhvgrnkrbsrwhgcgc`), private bucket `healthapp-dev`, one object `dashboard/snapshot.json`. No table, no DDL |
| Functions | `healthapp-dashboard-ingest` (the Mac pushes, push key) and `healthapp-dashboard-feed` (the page reads, view key). Both `verify_jwt = true` in `supabase/config.toml`; deploy each by name, never `--prune` (section 6) |
| Function secrets | `HEALTHAPP_DASHBOARD_PUSH_KEY`, `HEALTHAPP_DASHBOARD_VIEW_KEY`, `HEALTHAPP_DASHBOARD_ALLOWED_ORIGINS` (names only) |
| Mac job | launchd `ai.minhos.healthapp-dashboard`, every 180 s, runs from `~/.healthapp-dashboard/` (outside every worktree, so cleanup cannot remove it). Code: `dashboard/snapshot.py`, installer `dashboard/install.sh` |
| Page | Cloudflare Pages project `healthapp-dashboard` (not the `healthapp` project), static upload with `wrangler pages deploy`, not Git-connected. Upload set = `dashboard/pages-bundle.sh <out-dir>` (Direction A, `shared/`, `fonts/`, `_headers`, `robots.txt`; never `drafts/dev/`, `dev-snapshot.json`, any `*.json`, Directions B and C). Direction A replaced B as the base on 14 Nov 2026 (MIN-4530, PR #35); `/direction-B/` is gone from Pages and `open.sh` opens `/direction-A/` |
| Access | Cloudflare Access (Zero Trust free plan, One-time PIN, the founder's email only) on the production host **and** the preview subdomains. The founder turns it on; `wrangler` cannot |

**Wipe.** `wipe-demo --env dev` removes the dashboard with the rest (every `healthapp-*` function, every `HEALTHAPP_*` secret, the `healthapp-dev` bucket). That is intended: it runs only when the founder says the demo is no longer needed. `wipe-demo --env demo`, its dry run, and `demo-reset` never touch it; `dashboard/snapshot.json` is the one named exception to "object path = `<patient uuid>/<document uuid>`", and resets stay scoped to patient-UUID prefixes.

**Key rotation.** `dashboard/install.sh --rotate`: new push and view keys (mode 600 in `~/.healthapp-dashboard/`), secrets set one by one with `--project-ref`, nothing printed, the new viewer URL with `#k=…&a=…` to the clipboard. The old link stops working. The URL with the fragment never goes into Linear, chat, a commit or a screenshot.

**Anon key.** The fragment also carries conductor's public anon key (`&a=…`), so no JWT is ever tracked in the repo (CTO decision 2, MIN-4458). If conductor's legacy anon key is rotated or disabled, rerun `dashboard/install.sh` (no `--rotate`) and reopen the new link.

**Which state applies (CTO decision on MIN-4458, 14 Nov 2026, after the founder's "Yes, go live now").** Two states; the bundle and the open order follow the state.

| | Access off (now) | Access proven on |
| --- | --- | --- |
| Gate | The view key alone. The page shell is public; the data stays behind the feed (401 without the view key and the anon JWT) | Access, then the view key |
| Upload set | **Stripped.** `pages-bundle.sh` writes same-shape stubs for `shared/content.js` (no workshop or deck text) and `sample-data.js` (only the four build times and the two cap pairs), and removes from the bundled `shared/common.js` the local deck path, the sample event log, the facilitator, ticket and Linear link. The source files are unchanged. The bundle fails on `/Users/` or `file://` anywhere, a stub over 2 KB, or an issue id in a stub or outside a comment in `common.js` | The full bundle (workshops and decks) may be uploaded, only after the Access curls below and `install.sh --rotate` (CTO change 6; a separate script change) |
| Open order | The founder opens the clipboard link **directly**. The "bare URL and PIN first" order is suspended: with no Access redirect, the fragment never leaves our origin | First the bare `https://healthapp-dashboard.pages.dev/` and the Access PIN, **then** the clipboard link (step 6 below) |

**Never, while Access is off:** a full bundle on any branch. Every Pages deployment stays reachable at its hash URL, so a wrong upload is deleted at once (`npx wrangler pages deployment delete <id> --project-name healthapp-dashboard`), with no question to anyone (CTO change 4). After each upload, curl `shared/content.js`, `sample-data.js` and `shared/common.js` on the production host and on the new hash URL: the sizes match the local stub bundle, and neither stub contains `/Users/` or an issue id. The link is never pasted into Linear, Slack, a chat or a screenshot; if it is, `install.sh --rotate` the same hour (CTO change 7).

**Pages order with Access (no real content before Access answers, CTO decision 3; steps 2, 3, 6 and the Access curl in step 4 are suspended while Access is off):**
1. Release creates the Pages project `healthapp-dashboard` and deploys a placeholder page (no dashboard content). Run the create **from an empty folder, with `--force`**: from wrangler 4.162, `wrangler pages project create` is delegated to Workers by default, writes a `wrangler.jsonc` in the current folder, picks up any static folder it finds there and publishes it on `*.workers.dev` without creating a Pages project (MIN-4459, 14 Nov 2026: the bundle was public for about 2 minutes before it was caught and the Worker deleted). Pass every upload folder as an **absolute path**. After any create or deploy, curl the printed URL and check `npx wrangler pages project list` before the next step.
2. The founder turns on Access for the production host and the previews (steps on MIN-4456, "The minimum from the founder").
3. Release proves the redirect without credentials, on production and on a preview: `curl -sI https://healthapp-dashboard.pages.dev/` and `curl -sI https://<preview>.healthapp-dashboard.pages.dev/` answer a redirect to `*.cloudflareaccess.com` or 403, never 200. Pasted on MIN-4459.
4. Real deploy from the merged commit, run from an empty folder, upload folder by absolute path: `dashboard/pages-bundle.sh "$TMPDIR/dashboard-pages" && npx wrangler pages deploy "$TMPDIR/dashboard-pages" --project-name healthapp-dashboard --branch main`. Curl the printed URL right after: it must answer the Access redirect or 403, like step 3.
5. `dashboard/install.sh --viewer-url https://healthapp-dashboard.pages.dev/direction-A/index.html`, so the clipboard link points at Pages.
6. **The founder opens it in this order (CTO change 1, MIN-4458):** first the bare `https://healthapp-dashboard.pages.dev/`, and he logs in to Access with the PIN; **only then** the clipboard link. Opened the other way round, Access's login redirect carries the `#k=…&a=…` fragment onto the `cloudflareaccess.com` page (where the page cannot strip it from his history) and the PIN form drops it, so the page says the key is missing. Release does not call it "live with real data" until he has opened it and the header says "Live, updated N min ago".

**Open check (CTO change 4):** when PR #4 lands, confirm the Git-connected `healthapp` Pages project publishes only `dist`, so `docs/dashboard/` and the dev fixtures are never published there.

**Rollback.** Pages: promote the previous deployment in the dashboard, or redeploy the placeholder. Feed: `launchctl bootout gui/$(id -u)/ai.minhos.healthapp-dashboard` stops the pushes; `dashboard/install.sh --rotate` kills every link already handed out.

**Checks (Lane C `static`, `.github/workflows/dashboard.yml`):** `python3 -m unittest discover -s dashboard/tests`; `deno check`, `deno lint` and `deno test --allow-read supabase/functions/`; the key-pattern grep over tracked files; `dashboard/pages-bundle.sh` must build a clean upload set. No `smoke` (no Playwright for this tool), no funnel, no migration job.

## 11. Landing page (MIN-4462, MIN-4539)

The public one-page showcase. Not the app and not the dashboard: its own Pages project, so nothing here touches `healthapp`.

| Thing | Value |
| --- | --- |
| Source | `landing/` (Vite + React + TS, its own `package.json`; not in the app's `tsconfig` or build). Copy and design specs: `docs/landing/` |
| Pages project | `healthapp-landing`, **direct upload**, not Git-connected. Production branch `main` |
| Production URL | `https://healthapp-landing.pages.dev` |
| Data, env, secrets | none. Static files only (fonts from Google Fonts) |

**Redeploy** (Lane A: merge the change to `staging` first, then deploy from that commit):

```sh
cd landing && npm ci && npm run build          # in a clean worktree, no .env
cd "$(mktemp -d)"                               # empty folder: wrangler must not pick up a stray static folder
npx wrangler pages deploy "<absolute path>/landing/dist" --project-name healthapp-landing --branch main
```

Then `curl -s -o /dev/null -w '%{http_code}' https://healthapp-landing.pages.dev/` (200) and the same for `/img/hero.webp` and the `/assets/index-*.js` named in the built `index.html`. Never pass `--force` again: it was needed once, to create the project as Pages instead of a Worker (section 10, step 1). **Rollback:** promote the previous deployment in the dashboard (Pages → healthapp-landing → Deployments).
