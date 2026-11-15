---
name: project-doctor-simulate
description: Healthapp /doctor/simulate. MIN-4504 (2026-11-14) chose a recorded boxd run; the founder overrode it on 2026-11-15 (MIN-4670): a live boxd machine at the click through an Edge Function and the SDK's fetch-only entry, recorded run as the labelled fallback
metadata:
  type: project
---

**2026-11-15, MIN-4670 (parent MIN-4669): the founder overrode "no live VM on click".** His words: "the live runs should make an agent call to run to showcase" and, on the CTO opening a boxd machine to generate the 5,000, "you must do it". Decision comment "CTO · decision · live boxd run on /doctor/simulate":

- Function `healthapp-simulate-live` creates a machine (`shared: true`, `deleteAfter: 120`), uploads `generate.py`, `match.py`, `build_run.py` (embedded, SHA-256 tested against the recorded run's `script_sha256`), runs them, downloads `run-5000.json`, deletes the machine. It streams NDJSON (`start`, four `phase` lines, `end`) and the page lights the existing `MachineCard` states with real times. The in-browser matcher runs on the records the machine returned.
- Guards: doctor only; switch `HEALTHAPP_SIMULATE_LIVE` = `on` | `dev` | off (default); lock and a cap of 100 runs per 24 h in `healthapp_dev.rate_events` through the `allowTry` pattern (no migration; rows carry `kind = 'demo_login'`, noted as debt); 20 s server limit, 25 s on the page; any failure replays the recorded run with one sentence saying why. Lane C, no SQL.
- boxd facts checked that day: public gRPC at `boxd.sh:9443` also speaks grpc-web over plain `fetch`; `@boxd-sh/sdk/web` (0.3.2) loads under Deno and has no Node import (the default entry needs Node `http2`); a key is exchanged at `app.boxd.sh/api/v1/auth/token` for a one-hour bearer token; docs index at `docs.boxd.sh/llms.txt`. Rates: EUR 0.039 per vCPU-hour, 0.012 per GiB-hour RAM; a 5 s run cost EUR 0.000017. The key `healthapp-simulate-live` is kind `org` (shared machines only), secret `HEALTHAPP_BOXD_API_KEY`.
- Not verified at decision time: a call with the real key from Supabase's runtime, and that an `org`-kind key may create a machine. Cron's tracer (create, echo, delete) was the first build step, checkpoint 08:30 Athens. If refused, a `member` key is needed and only the founder can make it.

**What stands from MIN-4504 (2026-11-14):**

- **Demo patient is `persona-rare`** (sarcoid-like codes), never Maria and never the founder's record. "5 matches" is a planted-pattern test declared on screen: the rare group's seeded size S is one declared constant; seed 20261114 unchanged; the count shown is computed, never typed.
- **Before consent** the doctor sees pattern, count and country per record only. Exams, age band and the other doctor appear only after a simulated consent from both patients. Nothing is written or sent.
- The six fixed labels are not reworded. `machineLabel` ("Recorded run on a boxd machine, <date>. Replayed here, not live.") shows only on the replay. New strings (waiting, live label, fallback sentence) are Anna's words on MIN-4672, approved by the CEO seat.

**Why:** the founder wants the showcase live and testable with one click. Machine creation takes 0.5 s and a whole run 5.8 s, so the stage risk I feared on 2026-11-14 is small, and the recorded run covers a failure. "Nothing is claimed that does not run", so every step says whether it is live or replayed.

**2026-11-15, MIN-4676 post-build review: sound** (1077edd + 5325914 merged on staging 38a0803, ten jobs exit 0). Lessons: (1) my MIN-4670 decision said `e2e-live/simulate.spec.ts` "mocks the POST with `page.route`"; it did not. Three e2e-live specs (simulate, simulations, glass-redesign) click Run on the real staging-dev deploy, so after the merge each click makes a real machine until E2E (MIN-4677) routes the POST. Grep a spec before writing what it does into a decision. (2) To learn which code a Supabase function runs, use `supabase functions download <name> --project-ref <ref> --use-api --workdir <scratch>` and byte-compare against the commit; the version number counts deploys, not commits. (3) Follow-ups were left open: lock TTL 30 s is shorter than the worst-case hold of about 36 s (Cron, after submission), and `docs/simulation-copy.md` was not updated (Anna).

**How to apply:** at the post-build review (MIN-4676) check: only `src/features/simulate/live.ts` imports from `src/api` and calls one URL; nothing imports `matches/real`; live and replayed states never mix in one card; no label says "live" on a replay or "not live" on a live step; the embedded scripts' SHA-256 equals `scripts/synthetic/`; nothing from the request reaches a command; the key is never logged; `delete` runs in `finally` and does not depend on the browser; no automated test creates a real machine (the POST is mocked with `page.route`); the n = 400 generator output is still byte-identical; `boxd list` is empty after the real runs. See [[project-matches-rpc-review]] and [[healthapp-real-data-regime]].
