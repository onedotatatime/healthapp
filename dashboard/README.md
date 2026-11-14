# Dashboard snapshot job (MIN-4456)

`snapshot.py` builds one JSON snapshot (contract v1, shown in `fixtures/snapshot.example.json`) and writes it to a file or
pushes it to the ingest function. Stdlib Python 3.9+. A launchd job on the founder's Mac runs it every 3 minutes.

```
python3 dashboard/snapshot.py --home ~/.healthapp-dashboard --out /tmp/snap.json      # local file, no push
python3 -m unittest discover -s dashboard/tests                                        # 412 tests, about 145 s (the branches and repo tests build real git repositories; the chat tests stub claude)
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
| `branches` | the healthapp repo's local git (read-only: no fetch, no lock, no write) and its PRs through one `gh pr list --state all` call (MIN-4460) | see "Branches block" below. Local git alone gives the branches; `gh` adds PR state. A missing or logged-out `gh` is not a failed block |
| `repo` | the same repo, **numbers only** (MIN-4568): git read-only plus one more `gh pr list` | see "Repo block" below. Each group of fields fails on its own; a field that cannot be read is left out and the reason goes in `blocks.repo.error` |

A failed block keeps its last good value (from `<home>/state.json`), gets a newer `error`, keeps its old `asOf`.
`money` fails with `usage` (it needs its events).
`branches` can also be **partial**: when only `gh` fails (not installed, not logged in, error), the block is fresh (`asOf` now) and carries
the local-git data, with PR fields `null`, `prSource: "none"` and `blocks.branches.error` set (`gh not installed`, `gh not authenticated`,
`gh failed: ...`, a `gh` call that takes over 10 s is `gh failed: timed out after 10s`). Nothing in this block can fail the
other blocks.

## Agent leaderboard: `tokens.perAgent` (MIN-4583, additive: `schema` stays 1)

`tokens.perAgent` is the build leaderboard, one row per agent: `{ "n": "Cron", "v": 101214493, "mins": 514.7, "runs": 43 }`.

| Field | Meaning |
| -- | -- |
| `n` | agent name (as before) |
| `v` | weighted tokens since `buildStart` (as before: in x1, cache write x2, cache read x0.1, out x5) |
| `mins` | minutes worked since `buildStart`, one decimal |
| `runs` | number of runs since `buildStart` |

- **A run** is one subagent transcript file (one dispatch of that agent) with at least one request after `buildStart`. Requests are the same
  deduped events that give the tokens, so a request is never counted in two runs.
- **A run's minutes** are the gaps between its consecutive requests (first to last), **each gap capped at 300 s** (the idle rule of conductor
  `bin/usage`, `PAUSE_S`). A long CI wait or an idle gap counts 5 minutes, never more, so the figure is active time, not wall clock. A run of
  one request has no span and counts 0. The last model call of a run has no end timestamp, so it adds nothing: the figure is a little low, never high.
- **An agent's `mins`** is the sum over its runs, so two runs in parallel add up: `mins` can exceed the minutes elapsed since `buildStart`. It
  measures work done, like tokens do.
- **Zeros:** all 13 configured agents are always present (an agent with no runs is `v: 0, mins: 0, runs: 0`). Built-in agents that are not in
  `config.agents` (`general-purpose`, `web-fetch`, `Explore`) appear too, the biggest five by tokens. Sorted by `v`, biggest first, configured zeros
  last in config order.
- **Old feeds:** a feed without `mins` and `runs` (older snapshots, the Pages stub) is valid: readers treat them as absent, not as an error.
- **Public Pages bundle:** `pages-bundle.sh` writes `perAgent: []` (an empty list, not fake values), and this change leaves it so: the
  public stub carries no agent numbers, the live feed (behind the view key) does. Whether real per-agent numbers belong in the public stub is the
  CTO's call (MIN-4583).

## Forecast block (MIN-4565, additive: `schema` stays 1)

`forecast` is a top-level field of the feed, built inside the `linear` block from the same read (a failure drops the block and sets `blocks.linear.error`; the rest of the linear block stays fresh). It reads
each issue's description on the Mac only, to parse the `est. time: <n> min` line; the feed carries ids, titles and numbers, never description text. All times are Europe/Athens.

- **Must-haves:** issues of the project in milestones M2 to M7, in Todo, In Progress or In Review (Done counts for pace when it moved to Done after `buildStart`). Backlog, Canceled, Duplicate, no
  milestone and the whole subtree of MIN-4445 (followed up the parent chain) are out, on both sides: pace and work left use the same set. A parent counts 0 only when one of its sub-issues is in scope (an open must-have, or Done since `buildStart`); otherwise it counts its own estimate. An issue with no milestone takes its nearest ancestor's, on both the done and the left side.
- **Estimate:** the first number of `est. time: ~35 min` or `30-45 min`. Missing: the median of every estimated must-have (done and open), or 30 min when fewer than 5 are estimated (`default_source: "fallback"`).
- **Pace** = estimated minutes done since `buildStart` / hours since `buildStart`. **Remaining** = Todo + In Progress minutes; In Review is 0 minutes and counted. **Finish** = now + remaining / pace.
- **Two finish times** (MIN-4564): M6 and M7 cannot start before the freeze. `remaining.pre_minutes` (M2 to M5) and `remaining.post_minutes` (M6, M7). `finish_at` = now + pre / pace (build work). `ready_at` = max(`finish_at`, `freeze`) + post / pace (the full plan, also `ready_label`).
- **Verdict** (forecast only): `on` when `finish_at` <= `freeze` minus 1 h and `ready_at` <= `submitBy` minus 1 h; `risk` when `ready_at` <= `submitBy`; else `off`. Pace 0 with work left: `off`, `finish_at: null`. Fewer than 3 done issues: never `on` (`early_pace`).
- **Cut** (only when `off`): drops build (pre) issues until `finish_at` is at or before the freeze, then post issues until `ready_at` is at or before `submitBy`. Order: `config.forecast.cutOrder` (a list of issue ids, Product's ordered list), then lowest priority first (no priority first), then largest estimate.
- **Blocked:** must-haves with an unresolved blocking issue, with that issue's id and assignee.

## Branches block (MIN-4460, additive: `schema` stays 1)
`blocks.branches` is `{asOf, error}` like the others; the data is the top-level key `branches`:
```
branches: { repo: "owner/repo"|null, bases: ["main","staging"], base: "staging", staleRefs: int|null, prSource: "gh"|"none", truncated: bool,
  totals: { open, openOnRemote, merged|null, mergedToday|null, closed|null, total },
  items: [ { name, state: "open"|"merged"|"closed", onRemote, hasWorktree,
             pr: null | {number, state: "OPEN"|"MERGED"|"CLOSED", url, base, mergedAt, closedAt},
             vsMain: null|{ahead,behind}, vsStaging: null|{ahead,behind}, statsBase: "main"|"staging"|null,
             files, added, removed, lastCommitAt, lastCommitAuthor,
             issue: "MIN-n"|null, issueFrom: "branch"|"pr"|null, agent: "Cron"|null, agentFrom: "issue"|"author"|null } ] }
```
- **Universe.** Every local or `origin/` branch that is not a base (`main`, `staging`), plus the head of every PR `gh` returns (200 newest).
  A branch with no PR is `open`; with a PR it takes the PR's state (`closed` = closed without merge). `open` counts every such branch;
  `openOnRemote` counts the ones that are pushed or have a PR (this is the number that matches `git branch -r` minus merged ones, and
  `gh pr list --state open`). A fresh worktree branch with nothing on it shows as `open` with `vsMain.ahead` 0; the page can dim it.
- **Totals** `merged`, `closed`, `mergedToday` are `null` without `gh` (unknown, never a guess). `mergedToday` = merged since 00:00 in the
  time zone of `buildStart` (+02:00), not UTC.
- **List cap.** All open branches (up to 60) and the 50 newest merged/closed; `truncated` says it was cut; totals still count everything.
  Order: open first, newest commit first; then merged/closed, newest first.
- **ahead/behind** are `git rev-list --left-right --count <base>...<branch>` against `origin/staging` (`vsStaging`, the integration branch;
  the block's `base` says so) and, as an extra that costs one more `rev-list` per listed branch, `origin/main` (`vsMain`). The local branch is
  used if there is no remote. `null` when the ref is gone (deleted after merge).
- **Stale refs.** The job never fetches (CTO, MIN-4460), so `origin/*` refs are as old as the founder's last `git fetch`. Remote state comes
  from `gh`. `staleRefs` counts open PRs whose head `gh` knows at a commit the local `origin/<branch>` does not have (or has not at all);
  when it is above 0 the block carries a warning (`blocks.branches.error`) and ahead/behind/file counts for those branches may be old.
  `null` without `gh`. Run `git fetch` by hand in the repo to clear it.
- **files/added/removed** are `git diff --numstat <base>...<branch>`: the PR's base, else the nearer base (smaller `ahead`; main on a tie).
  `statsBase` names it. When the ref is gone the PR's own numbers are used. A binary file counts as a file with 0 lines.
- **Last commit** is the committer time of the newer of the local and remote tip, and the git author *name* (never an e-mail).
- **issue** is read from the branch name (`min-4450` -> `MIN-4450`), else the PR title. **agent** is the display name from the Linear issue
  (assignee, or Role label for the CTO; same rules as the `linear` block), else from an author address `hello+<role>@minhos.ai`;
  `agentFrom` says which. Unknown stays `null`, never guessed. Linear down in that run means no issue match, only the author rule.
- **Not in the snapshot:** worktree paths (a boolean `hasWorktree` only, MIN-4458), e-mail addresses, tokens. Error texts have the home folder
  and any `/Users/<name>` or `/home/<name>` replaced by `~`, and a `gh` token pattern is refused like any key (`assert_clean`).
- **Commands run** (read-only; a test pins the list, another fails on write words in the source): `git rev-parse`, `git remote get-url`,
  `git for-each-ref`, `git worktree list --porcelain`, `git rev-list`, `git diff --numstat`, all with `GIT_OPTIONAL_LOCKS=0`, and exactly one
  `gh pr list --state all --limit 200 --json ...` per run with a 10 s timeout. No fetch, pull, merge, delete, push, checkout or write of any kind.
  `gh` is looked up on PATH, then at `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, and `install.sh` also puts `gh`'s folder on the job's
  PATH (launchd's has none of them). It uses the login the founder already has on the Mac. Every run logs a line to `run.log`:
  `branches: prSource=gh, staleRefs=0, gh=/opt/homebrew/bin/gh, error=none`.
- **Config** (all optional, in `hand-set.json` under `config.branches`): `repoPath` (default `~/AppDevelopment/healthapp`), `slug`
  (default: read from `origin`), `bases` (default `["main","staging"]`).
- **Size.** About 0.5 KB per branch; 12 branches add about 6 KB to a 20 KB snapshot; the caps (60 open, 50 closed) keep it far under the ingest limit of 256 KB.

## Repo block (MIN-4568, additive: `schema` stays 1)
`blocks.repo` is `{asOf, error}` like the others; the data is the top-level key `repo`. **Numbers only: no branch name, path, title, author or
e-mail** (CTO decision 7d254d3d), so it is safe in the public stub bundle. Every value is an integer; key order is fixed.
```
repo: { branchesOpen, branchesMerged, prsOpen, prsMerged, prsTotal,
        commitsStaging, commitsStaging24h, commitsMain, commitsMain24h,
        linesAdded, linesRemoved, filesChanged, codeLines, codeFiles }
```
| Field | Source and rule |
| -- | -- |
| `branchesOpen` | remote branches that are not `main`/`staging`: `git for-each-ref refs/remotes/origin` plus the heads of open PRs from `gh`, minus every branch whose newest PR is merged or closed. A branch with no PR counts as open |
| `branchesMerged` | `gh pr list`: distinct head branches of merged PRs, `main` and `staging` excluded (the staging-to-main release PR is a PR, not a branch). Counts branches already deleted on origin |
| `prsOpen`, `prsMerged`, `prsTotal` | `gh pr list --state all --limit 1000` (one call, 10 s timeout): the PRs in each state; `prsTotal` is every PR, closed-without-merge ones included |
| `commitsStaging`, `commitsMain` | `git rev-list --count origin/<branch>` (the local branch if origin has none): every commit reachable from the branch |
| `commitsStaging24h`, `commitsMain24h` | `git rev-list --count --since=<now - 24 h> origin/<branch>`: commits whose committer time is in the last 24 hours. A total and its 24 h figure are written together or left out together |
| `linesAdded`, `linesRemoved`, `filesChanged` | `git log --first-parent -M --numstat --since=<buildStart> origin/staging`: the sum over every commit integrated into staging since the build start, with the same exclusions as `codeLines` (below) (a squash merge is one commit; a merge commit shows its diff against the first parent), so it is the size of the merged work, not of work in open branches. `filesChanged` counts distinct paths; a binary file counts as a file with no lines |
| `codeLines`, `codeFiles` | `git grep -I -c '' origin/staging`: lines (and file count) of tracked text files at that commit, not the working copy. `-I` skips binary files; left out (code only, MIN-4568, measured on the real repo: `data/` json and `docs/` had inflated 45k lines of code to 87k): lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `*.lock`, `*.lockb`), `node_modules`, `vendor`, `third_party`, `*.min.js`, `*.min.css`, `*.map`, and data and prose files (`*.json`, `*.jsonl`, `*.ndjson`, `*.md`, `*.mdx`, `*.csv`, `*.svg`) |
- **Failure.** Groups fail on their own: `prs` (gh: not installed, not authenticated, failed, not JSON), `commits staging`, `commits main`, `lines`, `code`
  (`no staging branch found`, a git error, a timeout). A failed group is left out of `repo` (never `null`, never zero) and the block is fresh with
  `blocks.repo.error` set, for example `prs: gh not authenticated`. Only when nothing at all could be read (folder gone, not a repository, every group
  failed) does the block fail like the others: the last good `repo` stays, with its old `asOf` and the new error. Nothing here can fail another block.
- **Fresh or stale.** The job never fetches (same rule as `branches`), so the git numbers are as new as the founder's last `git fetch` of that repo.
  PR numbers come from `gh` and are live. When `gh` knows an open PR head that `origin/<branch>` does not have, the block says so
  (`local remote-tracking refs are behind gh for n open PRs; commit and line numbers may be old`). Run `git fetch` by hand to clear it.
- **Commands run** (read-only; a test pins the list): `git rev-parse`, `git for-each-ref`, `git rev-list --count`, `git log --numstat`, `git grep -I -c`, all
  with `GIT_OPTIONAL_LOCKS=0`, and exactly one `gh pr list --state all`. No fetch, checkout, merge, delete or write. Paths read by `git grep` and `git log`
  are counted and dropped, never stored or published.
- **Config** (optional, `hand-set.json`): `config.repo.repoPath`, else `config.branches.repoPath`, else `~/AppDevelopment/healthapp`.

## directions.json (the project goal's five directions, MIN-4497)
`~/.healthapp-dashboard/directions.json` is a second hand-set file, read at every run (`--directions PATH` overrides). `install.sh` seeds it from
`directions.sample.json` once (all five `not_started`, the five titles) and never overwrites it. Shape: `{"directions": [{"n": 1..5, "title", "status", "note", "updatedAt"}]}`,
1 to 5 entries, `n` unique, `status` = `on_track | at_risk | off_track | not_started`, `title` at most 120 characters, `note` at most 300 (may be empty), `updatedAt` an ISO time
**with an offset**. **Summary text only: no patient data, no exam content, no keys** (a key-shaped string is refused). The snapshot gets a top-level `directions` array sorted
by `n`. A missing file omits the field (the page says "not reported yet"); a file that cannot be read or fails the check omits it too and puts the reason in
`blocks.hand.error` (the hand data itself stays fresh), so a typo is never silent. **To set a status, edit the entry's `status`, `note` and `updatedAt` and save: the next run
(within 3 minutes) carries it.**

## hand-set.json fields (copy `hand-set.sample.json`, edit, next run picks it up)
`deadline`, `buildStart`, `freeze`, `submitBy`: ISO with offset. `current`: milestone id or null (null = first milestone not finished).
`milestones[]`: `id` (M1..M7, matched to the Linear milestone name by its first word), `name`, `start`, `end`, `gate` (text).
`credits[]`: `n`, `granted`, `used` (the founder or CTO types these; no source). `demo`: `build{state,label,at}`, `deploy{state,label}`, `url`,
`cleanRuns`, `cleanTarget`, `steps[8]{n,t,s}` with `s` = pass|warn|fail|idle, `notes{"1".."8"}`. States are free to change by hand only.
`config`: `forecast.cutOrder` (optional, issue ids), `linearProjectId`, `eurPerUsd`, `projectFilter`, caps, `agents[]` (display name, role, transcript `agentType`, Linear assignee name `linear`,
or `roleLabel` for an agent that writes under the founder's account, the CTO: matched by its Role label, never by the assignee; `linear: null` for an agent with no Linear identity of its own: Release, CEO, E2E, and Scrum, SEO and JobScout, which write as Back, Anna and Spast under the same Role labels, so Linear cannot tell them apart and they show idle. One identity belongs to one agent: if two share it, the first keeps it and the block carries a warning). All 13 agents are listed in `agents[]` and `lanes[]`, `founder` (his Linear account name: issues
assigned to him with no Role label count as `Founder`), `roleLabels` (Linear Role label -> role name in `tasks.byRole`). No secret belongs in this file.

## Dashboard chat bridge (MIN-4497: run 1 the answer path, run 2 the act path)
`chat_bridge.py` (stdlib, Python 3.9+) is one small server on **127.0.0.1 only** that serves the dashboard page folder and `/chat/*` on the
same origin (no CORS, and it never sends a CORS header). Each message runs **one** headless `claude -p --agent <role>-minhos` turn,
`--resume`d for the next one, **read-only** (`--permission-mode dontAsk` plus the PreToolUse hook `chat_guard.py`). The contract is on
MIN-4495 and MIN-4497 (CTO decisions dfe40a71, 2cc7efc9 and 285bad11). **Acting is built (run 2) and ships OFF:** `config.chat.act` defaults to `false`;
with it off, or without the conductor rule at its merged commit, a Yes answers `act_off` and runs nothing. See "Act path" below.

```
dashboard/chat_service.sh install [--page-dir DIR] [--extra-dir NAME=DIR] [--port 8765]   copy files to ~/.healthapp-dashboard, make chat.key, load the launchd job
dashboard/chat_service.sh uninstall | off | on | rotate-key | status
python3 dashboard/chat_bridge.py --home ~/.healthapp-dashboard --page-dir docs/dashboard/drafts --port 8766   # by hand, from a Terminal
python3 -m unittest discover -s dashboard/tests -p 'test_chat_*.py'                                             # claude is stubbed: no model call
```
- **Start.** `chat_service.sh install` writes the launchd job `ai.minhos.healthapp-dashboard-chat` (KeepAlive) and replaces the ad-hoc
  `python3 -m http.server 8765`. It refuses while another process listens on the port; stop that one yourself first. Start it from launchd or a
  Terminal, **never from a Claude session**. The child's environment is built from nothing, but the founder's Claude login is what answers.
- **Static files (CTO S1).** The page folder is served at `/`, and each `--extra-dir NAME=DIR` at `/NAME/` (for example
  `--extra-dir how-it-works=~/.healthapp-dashboard-www/how-it-works`; repeatable). Same rules for both: **`Host` must be exactly `127.0.0.1:<port>` on every static request**
  (a rebinding page cannot read a file; 403 otherwise), every file is resolved with `realpath` and must stay inside its own folder (a symlink out gives 404), no dot file or
  dot folder is served, no directory listing (a folder answers with its `index.html` or 404; without the trailing slash it redirects). The bridge **refuses to start** when
  the page folder or an extra folder is, contains or equals `~/.healthapp-dashboard` (the keys live there), or when a name is not lower-case letters, digits and dashes
  (`chat` is reserved), or the folder does not exist.
- **Stop.** `chat_service.sh uninstall` unloads the job. On SIGTERM the bridge kills the process group of every turn it started.
  `chat_service.sh off` (file `~/.healthapp-dashboard/chat.off`) makes the bridge refuse every new turn at once; `on` removes it. The Stop button
  (`POST /chat/sessions/<id>/stop`) ends one running turn's process group (SIGTERM, then SIGKILL after 3 s).
- **Rotate the secret (MIN-4500).** `chat_service.sh rotate-key` writes a new `~/.healthapp-dashboard/chat.key` (`openssl rand -hex 32`, mode 600),
  then sends the job SIGTERM so it restarts with the new key and every running turn ends. It prints no key. The key only ever exists in that file and
  in the `#`-fragment of the local tab that `open.sh` opens: MIN-4500 teaches `open.sh` to read `chat.key` and append `&c=<key>` to the
  **local** URL only. The page keeps it in memory, not in localStorage. `pages-bundle.sh` refuses `chat_bridge.py`, `chat.key` and any `c=` key.
  Without a `chat.key` of at least 32 characters every `/chat` call answers 503 and nothing runs.

**Every `/chat` call** needs `Host: 127.0.0.1:<port>` and `x-chat-key` (constant-time compare). A POST needs `Origin: http://127.0.0.1:<port>`
(`null` and a missing header are refused) and `Content-Type: application/json`. A GET checks `Origin` when present and `Sec-Fetch-Site: same-origin`
when present. A repeated Host, Origin or key header, an `OPTIONS`, and anything else answer **403 `{}`** and start nothing.
```
GET  /chat/health                              {ok, off, running, maxRunning, spentTodayUsd, dailyUsd, act, acting}
GET  /chat/sessions?agent=Pix                  {agent, sessions:[Session]}  newest first
GET  /chat/sessions/<id>                       {session, messages:[Msg]}
GET  /chat/sessions/<id>/events?after=<n>      {state, events:[{n, at, tool, target}]}   polled; last 200 of the running turn, in memory only
POST /chat/sessions {agent, text}              202 {session} | 4xx {refused, reason}
POST /chat/sessions/<id>/messages {text}       202 {session} | 4xx {refused, reason}
POST /chat/sessions/<id>/stop                  200 {session}
POST /chat/sessions/<id>/proposals/<pid>/no    200 {session}
POST /chat/sessions/<id>/proposals/<pid>/yes   202 {session} (the act turn started) | 4xx {refused, reason}
```
`GET /chat/sessions` with no `agent` lists every agent's chats in one call (newest first, 200 at most, each Session has `agent`). `Session.state` is
`working | needs_yes | acting | waiting | finished` (`needs_yes` only while `act` is on); `Session.turnStartedAt` is when the running turn (answer or act)
began, `null` otherwise; `worktree` is a flag and `branch` a name, never a path. `Msg.role` also has `proposal` and `result`.
Refusal codes and the CTO's texts: `busy_session`, `agent_busy`, `cap_reached`, `chat_full`, `budget_reached`, `too_long`, `chat_off`, `finished`,
`unknown_agent`, `act_off`, `yes_expired` (410), `bad_row` (422), `forbidden` (422), `empty`, `bad_request` (the table `REASONS` in `chat_bridge.py`; the page
renders `reason` as sent). `budget_reached` has two texts: "This would cost more than $N for one action. Ask for a smaller step." (an `estUsd` over `perActUsd`)
and "This would pass today's chat budget. It resets at midnight." `forbidden` is for the never-allowed words only. A refused proposal carries `refused` and `reason`. **Caps:** 3 turns at once, 1 per agent, 1 per chat;
4,000 characters a message; an answer turn is 15 minutes and `--max-budget-usd 2`; a turn is admitted only when today's spend plus that cap fits
`dailyUsd` (40); a chat is full at 12 turns or 400k context tokens, and finishes after 12 h idle.
**Proposals.** The agent ends an action reply with one `<<<PROPOSAL {json} PROPOSAL>>>` block (the schema is in `ANSWER_PROMPT`). Only the agent's
final text is parsed: exactly one block, last, strict fields. Two blocks, a block that is not last, broken JSON, an extra or missing field or a wrong type
show the reply and no proposal and log `proposal_rejected` with no text. Every marker is stripped from the text either way. A valid one is checked with
conductor's own `rows_by_role` and `bin/require-agent-model` (`bad_row`), `estUsd` against `perActUsd` and the forbidden-word backstop (`forbidden`),
and today's budget (`budget_reached`), then shown with `status: open|refused`.
**Config** (`~/.healthapp-dashboard/hand-set.json`, `config.chat` and `config.agents[].chat`, no secret): see `hand-set.sample.json`. Agent file =
`agentFile`, else `agentType`. Default `chat` per agent is Sonnet at medium effort; the CTO is Fable at medium.
**The roster** is `config.agents` of `~/.healthapp-dashboard/hand-set.json`, the same list the feed reads: all 13 agents (Scrum, SEO and JobScout answer-only like the rest, no `chat` row, so Sonnet at medium). The bridge reads it once at start. `hand-set.sample.json` is the source; the installed file is the founder's copy, so `install.sh`, `chat_service.sh install` and `chat_service.sh sync-agents` run `sync_agents.py`, which only **appends** agents the sample has and the installed file lacks (matched by `n` or `agentType`; a hand edit is never overwritten; the first change keeps `hand-set.json.before-sync`, mode 600). `sync-agents` also restarts the loaded bridge (SIGTERM, KeepAlive starts it again). No list of agents is written anywhere else (the dev server reads the sample).
**Files and logs.** `~/.healthapp-dashboard/chat/<id>.json` (mode 600, folder 700) holds the messages; `chat.log` gets one line per turn (kind, agent,
short id, result, seconds, cost) and **no message text, no reply, no key**; `chat-audit.log` (from the guard) one line per tool call: tool, allow or deny,
the command's first word or a relative path. The raw `stream-json` is read line by line and never written to disk.

### Act path (run 2). Off by default
`config.chat.act: true` turns it on; the CTO flips it after MIN-4500 is merged and his post-build pass is on the PR. **The founder's Yes** on one proposal is single
use, tied to that chat and proposal, and expires after `yesMinutes` (30): a second Yes, an expired one or a declined one answers `yes_expired`. Typing a text message
declines the open proposal. Checks at the Yes, in this order: `act` on and the **rule file** (`config.chat.ruleFile`, default conductor `docs/agents/dashboard-chat.md`)
present inside conductor and at the merged commit `ruleCommit` (91b4636, an ancestor of conductor's HEAD), else `act_off`; the proposal is not refused; the chat is not
busy or full; **one turn per agent** (`agent_busy`), 3 turns at once, and today's spend plus `perActUsd` inside `dailyUsd`. A refused Yes does not consume the proposal.
- **A change** (`kind: "change"`): the bridge fetches `origin staging`, then adds a worktree `<healthapp>/.claude/worktrees/chat-<proposal id[:8]>` on a new branch
  `<feat|fix|chore>/chat-<agent>-<proposal id[:8]>` from `origin/staging` (`--no-track`). A branch or path that exists is refused (the result says `failed`, the agent
  never starts); nothing is reused, deleted or copied in (no `.env`). Every approved change is its own worktree. The agent runs there; Release opens the PR.
- **A handoff** (`kind: "handoff"`): runs in the main checkout with Linear tools only (no file tools, no shell).
- **The turn:** `claude -p --agent <role> --session-id <a NEW uuid, stored on the proposal as actSession> --output-format stream-json --verbose --model <row model> [--fallback-model <next in the row's chain>]
  --effort <row effort> --permission-mode dontAsk --allowedTools <act set> --disallowedTools <never set> --max-budget-usd <perActUsd> --settings <guard hook>
  --append-system-prompt <rule file + proposal JSON>`, in its own process group, `actMinutes` (90). **An act turn never `--resume`s the chat's answer session** (CTO M3):
  it runs in a new worktree, where Claude keeps no session of the chat's, so it starts fresh; the prompt is the whole brief. The chat's next question still resumes its own
  answer session. `actSession` is an internal id and is not in any response. `--allowedTools` carries path and command rules
  (`Edit(//<worktree>/**)`, `Bash(git push origin <branch>)`, ...) and `chat_guard.py --mode act` checks every call again. Never `bypassPermissions`, never a skip flag.
- **The guard in act mode:** Edit and Write only in the worktree and `healthapp/.claude/agent-memory/<agent file>/`, and **never** (CTO M2) inside the worktree under
  `.github/`, `.claude/`, `.husky/`, `.githooks/` (any depth, any letter case) or to a file named `.mcp.json`: a workflow edit runs in CI before anyone reads it, `.claude/`
  and `.mcp.json` change what a later agent loads, hooks run at commit time. Bash only as ONE plain command (no `$`, backtick,
  `<(`, `;`, `&`, `|`, redirect or line break; `env`, `printenv`, `set`, `export`, `declare`, `cd`, `git -C`, `curl` and every network tool denied) from: git status, diff,
  log, show, add, commit, restore, rm, mv, fetch; a push to `origin <the stored branch>` only (never a force, `--no-verify`, another branch, a bare push);
  and `python3 <conductor>/scripts/measure/extract-runs.py --actuals`. **No `npm`, no `npx`, no `pytest`, no `python3 -m`** (CTO M1: the agent could write a
  `package.json` script, a `postinstall` or a `conftest.py` and then run it past every rule; tests run in the PR's CI and in Release's lane run, after someone has read the
  code, and come back only under Claude Code's Bash sandbox with the network off, proven by a live check). **No `linear-as`** (measured: with inline values it allowed any
  mutation, deletes included). Linear: reads, `save_comment`, `save_issue` through the owner's connector, every comment starting with the agent's prefix (`Cron ·`).
  Never `Agent`, the web, `Skill`, Supabase, Cloudflare, Linear deletes, merges, reviews, shares or retires. Reads: healthapp and conductor only, never env files, keys,
  `.git`, `~/.healthapp-dashboard`, `playground`; **Grep's `glob` only as one extension pattern** from `md, py, ts, tsx, js, mjs, css, html`, because a glob overrides ripgrep's
  ignore rules (measured with a real rg: `-g '.env*'` finds a gitignored `.env.local`, and `-g '*.json'` finds an ignored `launch.json`). For json, yaml, toml, txt, sh and
  sql the agent uses Grep's `type` (`rg --type`), which filters by type and keeps the ignore rules (a canary test with a real rg proves both halves, CTO M4). Glob denies a
  pattern with a dot segment.
- **The result.** The agent ends with `<<<RESULT {"outcome": "done|failed", "issue": "MIN-n|null", "summary": "..."} RESULT>>>` under the proposal's rules (one block, last,
  strict). The bridge sends `Result {outcome: done|stopped|failed|timeout, issue, branch, commits, filesChanged, pushed, summary, costUsd, minutes}` where **branch, commits,
  filesChanged and pushed come from git** (commits ahead of `origin/staging`, files changed against it, whether `origin/<branch>` exists), never from the agent. Stop gives
  `stopped`, the timeout `timeout`; a missing or invalid block gives `failed` with the fixed summary "no result was reported".
- **Logs.** `chat.log` per Yes: `yes agent sid proposal kind issue`; per turn: `turn kind=act agent sid proposal issue branch result seconds cost commits files pushed`
  (no message text, no summary). `chat-audit.log` as before. `reply_redacted sid=` is logged once when a reply or summary had a key-shaped string (`sk-ant-`, fal,
  Linear and Supabase keys, GitHub tokens, JWTs, `*_KEY=...`) replaced by `[redacted]` before it was stored.
- **Live check** (paid turns, only with the founder's go, from a Terminal, never from a Claude session; bridge on 127.0.0.1:8766, never 8765):
  `dashboard/live_check.sh --go` is the answer path (read-only chat, a canary file, the 403 matrix, the static Host check, and **L1a**: Stop on a running answer turn gives
  "Stopped by you." and leaves no process in the group after 5 s). `dashboard/live_check.sh --go --act` (**L1b**) is the act path in a throw-away clone with a local bare
  `origin` (act is on in the throw-away home only, nothing reaches GitHub): one proposal for a one-line docs change that also probes the guard, a Yes, then the lines
  (a) worktree and branch from origin/staging with no untracked `.env*`, (b) its own Claude session and a valid result block, (c) a write inside the worktree allowed,
  (d) a write outside denied, (e) `npm test`, `cat ~/.zshrc`, `git push origin main` and a Read of `.env.canary-act` denied and origin's main unmoved, (f) the branch on the
  origin with the result's commits, files and pushed matching git, (g) `--fallback-model` accepted, (h) Stop during a second act turn gives `stopped` and no process,
  (i) canary, key and message text in no log. It costs about $1 to $3. The script is checked against a stub `claude` (`LIVE_CHECK_CLAUDE_BIN`) for its plumbing; the guard lines
  need the real thing.

## Dashboard chat, the page side (MIN-4498)
Direction A's "Who is working" card is the chat list: each agent is a row that opens `#/chat/<Agent>`, the chat drawer (480 px). Files:
`docs/dashboard/drafts/shared/chat-model.js` (pure: texts, the one-word-per-agent rule, formats), `shared/chat.js` (key, calls, polling, drawer),
`shared/chat.css`; `direction-A/a.js` only mounts it. **The key** arrives once as `#c=<key>` (MIN-4500's `open.sh` adds it to the local URL), is removed from
the address bar and lives in memory: a reload needs `open.sh` again. **Where it works:** only on `http://127.0.0.1` with a key and a bridge that answers
`/chat/health`. On the Pages bundle (another host), on a plain file server, or with no key, the rows are the old plain rows plus one sentence ("Chat works
on this Mac only. Open the dashboard with open.sh."), `#/chat/<Agent>` shows the same sentence, and no `/chat` call is made. **Polling:** every 10 s
(health, then one `GET /chat/sessions?agent=` per agent), every 2 s only while the open chat is `working` or `acting` (the thread and `events?after=`),
nothing while the tab is hidden. **States:** answered, sending, waiting for the answer (live events list: time, tool, path), no open chat, agent busy,
cap hit, chat off, bridge not reachable (Try again), error, loading, finished or full; proposal card (Yes, No, expired, declined, refused, acting off),
acting strip (Stop, branch, "See it in Branches"), result card (done, stopped, failed, timed out). `/chat/health` `act: false` shows "Answers only" in the
header and a proposal with no Yes. Typing while a proposal is open declines it (the bridge does that; the card shows Declined after the next read).
**Demo drawer:** a "How it works" link to `../how-it-works/index.html#how-it-works`, only on 127.0.0.1 and only when a HEAD request finds the file.
**Looking at it without a model:** `python3 dashboard/tests/chat_dev_server.py` runs the real bridge with the stub `claude` from the test kit;
`python3 dashboard/tests/chat_mock_server.py --act` serves every state from `dashboard/fixtures/chat.example.json`, including the act states the bridge does not
build yet (Yes, acting, result, Stop). Open `http://127.0.0.1:<port>/direction-A/index.html?feed=../dev/fresh.json#c=<the throw-away key>` once.
Tests: `dashboard/tests/test_chat_ui.py` (the model run in node, guards on the page source, the fixture, the mock).

## The five directions panel (project goal, via coordinator, founder 2026-11-14)
Direction A, under the clock: a "Project goal" card with five rows. **The page holds no title text** (CTO must-fix F2, MIN-4499): the titles come only from the key-gated
feed, so they are not in the public page or the Pages bundle. **Feed field** `directions` (hand-set, optional): an array of `{n, title, status, note, updatedAt}`, `n` 1 to 5, `title` one short line (cut at 80 characters),
`status` one of `on_track`, `at_risk`, `off_track`, `not_started` (spaces, hyphens and capitals are read too), `note` one sentence (cut at 200 characters), `updatedAt` an
ISO time. A direction the feed does not send, sends with an unknown status, or a feed with no field (the public stub bundle, no key, a missing file), an empty array or
junk, shows the neutral "Direction N" and "not reported yet" (dashed row, no title); nothing throws. Before the first snapshot the rows say "Loading the feed…", after a failed first read "The feed could not be
read yet." Files: `shared/directions.js` (pure), the paint in `direction-A/a.js`, `shared/live.js` (reads the field), `a.css`. Dev feeds: `dev/directions.json` (field, four
pills, direction 5 missing) and `dev/fresh.json` (no field). Tests: `dashboard/tests/test_directions.py`.
