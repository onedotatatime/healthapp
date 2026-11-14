# Dashboard snapshot job (MIN-4456)

`snapshot.py` builds one JSON snapshot (contract v1, shown in `fixtures/snapshot.example.json`) and writes it to a file or
pushes it to the ingest function. Stdlib Python 3.9+. A launchd job on the founder's Mac runs it every 3 minutes.

```
python3 dashboard/snapshot.py --home ~/.healthapp-dashboard --out /tmp/snap.json      # local file, no push
python3 -m unittest discover -s dashboard/tests                                        # 13 tests, about 0.5 s
deno test --allow-read supabase/functions/                                             # 23 tests (key matrix, limits, boundaries)
deno check supabase/functions/*/index.ts && deno lint supabase/functions
dashboard/install.sh [--viewer-url BASE] [--rotate]                                    # install or update the Mac job
```

## How it fits together
```
Mac (launchd, 180 s) --POST--> healthapp-dashboard-ingest --upsert--> bucket healthapp-dev, dashboard/snapshot.json
page (Pages, Access) --GET---> healthapp-dashboard-feed   <--read---- the same object
```
Both functions live in the conductor Supabase project (`supabase/functions/healthapp-dashboard-*`), deployed by name
(`supabase functions deploy <name> --project-ref fnbnhvgrnkrbsrwhgcgc --use-api`, never `--prune`). Both keep the gateway
JWT check on: the caller sends the public anon key as `Authorization: Bearer` and `apikey`, and its own dedicated key in
`x-dashboard-key` (push key to ingest, view key to feed, each at least 32 chars, constant-time compare, never the other
function's). Ingest: POST only, no CORS, at most 256 KB, JSON with `schema: 1`, refuses a body that matches a key pattern,
sets `receivedAt` from the server clock, upserts with `cacheControl: 0`. Feed: GET, `Cache-Control: no-store`, CORS only for
`https://healthapp-dashboard.pages.dev`, its previews and the origins in the secret `HEALTHAPP_DASHBOARD_ALLOWED_ORIGINS`.
An unset, short or equal key pair answers 503 to everything. Only `HEALTHAPP_DASHBOARD_*` and `SUPABASE_*` are read from the
environment; no table, no `healthapp-demo`, no `x-healthapp-env`.

The bucket `healthapp-dev` accepts only images and PDF (MIN-4452), so ingest stores the JSON under the stand-in type
`application/pdf`; the feed always answers `application/json`. To store it as JSON, add `application/json` to that bucket's
allowed types (the CTO's SQL), then change `contentType` in `healthapp-dashboard-ingest/index.ts`.

## Installer and keys (`install.sh`)
Writes `~/.healthapp-dashboard/` (mode 700): `snapshot.py`, `rates.json`, `hand-set.json` (kept if present), `push.key` and
`view.key` (mode 600, `openssl rand -hex 32`), `push.json` (mode 600: ingest URL and the public anon key). Sets the three
function secrets one by one with `--project-ref`, writes the launchd job `ai.minhos.healthapp-dashboard`, and puts
`BASE#k=<view key>&a=<anon key>` on the clipboard only. It prints no key. `--viewer-url BASE` (or
`HEALTHAPP_DASHBOARD_VIEWER_URL`) is the page address; Release passes the Pages URL when it exists, and the secret
`HEALTHAPP_DASHBOARD_ALLOWED_ORIGINS` is set to it plus `http://127.0.0.1:8765`. **Open the page** = `~/.healthapp-dashboard/open.sh`: checks the feed with this Mac's keys (HTTP 200), then opens Direction B in a new Chrome tab with the keys in the fragment; prints no key (`--check` checks only). Use it instead of the clipboard link, which any screenshot overwrites. **Rotate** = `install.sh --rotate` (new keys, new secrets, new clipboard URL).
Stop = `install.sh --uninstall`. If the Mac sleeps the job does not run; the page shows "Mac silent" from `receivedAt`.
Closed lid while it must keep running: `sudo pmset -a disablesleep 1`, and `0` afterwards.

## Blocks (each has `asOf` and `error` under `blocks.<name>`)
| Block | Source | Window / rule |
| -- | -- | -- |
| `linear` | Linear GraphQL, read-only, project id in `config.linearProjectId`; key from `LINEAR_API_KEY_BACKEND` (environment, else `~/.claude/.env.agents`). Never printed, never in the feed | canceled issues are excluded everywhere; `done` = state type completed; `blocked` = a Todo with an unresolved blocking relation |
| `usage` | `~/.claude/projects` through `scan()`/`build_run()` loaded from conductor `bin/usage` (read-only), so weights (in x1, cache write x2, cache read x0.1, out x5) and request dedupe are the same code | since `buildStart`, only project folders whose name contains `config.projectFilter` (`healthapp`). To compare with the CLI: symlink those folders into one directory and run `bin/usage --root <dir> --since <buildStart UTC>` (same total, checked 39.8M at 13:40Z) |
| `money` | tokens by model x `rates.json` x `config.eurPerUsd` | an estimate at API list price, cache writes at the 5-minute rate; models not in the table map to the nearest family (`rateCard.aliased`); a model with no family counts in `rateCard.unpricedTokens` |
| `hand` | `~/.healthapp-dashboard/hand-set.json` | only source for credits, demo steps, clean runs, build/deploy labels, milestone names and gates |

A failed block keeps its last good value (from `<home>/state.json`), gets a newer `error`, keeps its old `asOf`.
`money` fails with `usage` (it needs its events).

## hand-set.json fields (copy `hand-set.sample.json`, edit, next run picks it up)
`deadline`, `buildStart`, `freeze`, `submitBy`: ISO with offset. `current`: milestone id or null (null = first milestone not finished).
`milestones[]`: `id` (M1..M7, matched to the Linear milestone name by its first word), `name`, `start`, `end`, `gate` (text).
`credits[]`: `n`, `granted`, `used` (the founder or CTO types these; no source). `demo`: `build{state,label,at}`, `deploy{state,label}`, `url`,
`cleanRuns`, `cleanTarget`, `steps[8]{n,t,s}` with `s` = pass|warn|fail|idle, `notes{"1".."8"}`. States are free to change by hand only.
`config`: `linearProjectId`, `eurPerUsd`, `projectFilter`, caps, `agents[]` (display name, role, transcript `agentType`, Linear assignee name `linear`,
or `roleLabel` for an agent that writes under the founder's account, the CTO: matched by its Role label, never by the assignee), `founder` (his Linear account name: issues
assigned to him with no Role label count as `Founder`), `roleLabels` (Linear Role label -> role name in `tasks.byRole`). No secret belongs in this file.
