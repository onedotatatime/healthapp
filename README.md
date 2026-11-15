# healthapp

A patient scans a paper medical exam with a phone, an AI reads it into structured values, and the patient keeps the record and decides which doctor may open it. A doctor sees the record with each value tied to its source file, and can search many records to find patients for a trial. This is a hackathon prototype: Vite + React PWA on Cloudflare Pages, Supabase (schemas `healthapp_dev` and `healthapp_demo`) behind it.

This repo is private. Rules for agents and contributors: [`CLAUDE.md`](CLAUDE.md).

## The project goal: five directions

Founder, 2026-11-14: "We need to move in parallel in 4 directions" (he then listed five). Whatever you do, ask: "How close am I to this goal with what I am doing?" Status below is from the merged PRs and files named; it is a snapshot and `docs/` and `git log` are the record.

1. **Scan, then the AI reads it.** Working: the patient photographs an exam, the reading runs in the background with a status, and the patient can list and delete (PRs #57, #58, `supabase/functions/healthapp-extract-exam`). A refused scan keeps its original for 14 days and can be read again (#109).
2. **Store the extracted data in the same database.** Working: values land in the same Supabase database as the record, tables in `supabase/sql/` (`002_core.sql` and later); lab values carry a LOINC code (#139, `020_lab_loinc.sql`).
3. **Store and analyse the original files, from both staging and main.** Partly: originals are stored, and `file_analysis` runs a second pass over each stored file (#49, `013_file_analysis.sql`, `scripts/analyse-files.ts`). Run on the synthetic `dev` patients; nothing beyond value extraction yet.
4. **Real analysis and projection for the patient.** Early: a straight-line projection and out-of-range history (#46, `healthapp-over-time`), and a "Related diagnoses" view with a server-side guard (#119, #120, `healthapp-diagnoses`). The `/simulation` loss card (Greece / Europe (EU-27) / Global, share slider; #171) is a model on synthetic cohorts, not a patient's own projection.
5. **Real matching analysis, based on the data.** Early: LOINC-coded matching (#51, #139) and the trial recruitment search that runs the 50,000-record simulation (#141, #156). The 50,000 records are synthetic (`data/synthetic/`); matching on the founder's real records is not done.

"Real" means it runs on real records through the real pipeline. Anything marked synthetic here is test data and says so.

## Repo map

| Folder | What |
| --- | --- |
| `src/` | The app: React 19, React Router, Supabase client. Patient, doctor and `/simulation` screens. |
| `supabase/` | `functions/` (Deno edge functions, one folder each, `healthapp-*`) and `sql/` (numbered schema files, `checks/`, `rollback/`). |
| `dashboard/` | The local build dashboard: snapshot job, chat bridge, Python. See [`dashboard/README.md`](dashboard/README.md). |
| `landing/` | The landing page, pitch deck (`/deck`) and story. Its own Vite app. See [`landing/README.md`](landing/README.md) and [`landing/src/deck/README.md`](landing/src/deck/README.md). |
| `e2e/` | Smoke spec, the PR gate. |
| `e2e-live/` | Specs against a deployed URL (default: the synthetic `staging-dev` twin). |
| `scripts/` | Static checks, nightly guard and reporter, live function checks, seeds. |
| `docs/` | PRD, deploy (`docs/deploy.md`), nightly (`docs/nightly.md`), design, deck, lean room, submission. |
| `data/` | Synthetic cohorts and simulation outputs. Synthetic only. |
| `visuals/` | Standalone HTML visual studies. |
| `tests/` | Synthetic-data tests. |

## Run locally

Node 20 or newer.

```
npm install
npm run dev            # Vite dev server
npm run build          # tsc --noEmit && vite build
npm run typecheck
npm test               # vitest
npm run check:static   # static checks (PR gate, job `static`)
npm run test:smoke     # builds, serves on 127.0.0.1:4173, runs e2e/ (PR gate, job `smoke`)
```

Environment variable names (values live in Cloudflare Pages and a local `.env.local`, never committed; see `.env.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_HEALTHAPP_ENV` (`dev` or `demo`). The live specs and scripts also read `HEALTHAPP_LIVE_URL`, `HEALTHAPP_DEMO_PASSCODE`, `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

## Tests

| Config | Covers | Run |
| --- | --- | --- |
| `playwright.config.ts` | Smoke spec in `e2e/` against a local build. | `npm run test:smoke` |
| `playwright.dashboard.config.ts` | Doctor dashboard (`doctor-dashboard`), phone and desktop, on `staging-dev`. | `npx playwright test -c playwright.dashboard.config.ts` |
| `playwright.diagnoses.config.ts` | Related diagnoses (`doctor-diagnoses`). | `npx playwright test -c playwright.diagnoses.config.ts` |
| `playwright.glass.config.ts` | The glass redesign (`glass-redesign`). | `npx playwright test -c playwright.glass.config.ts` |
| `playwright.live.config.ts` | The exam journey (`exam-journey`). | `npx playwright test -c playwright.live.config.ts` |
| `playwright.simulation.config.ts` | `simulate`, `simulations`, `recruit`. | `npx playwright test -c playwright.simulation.config.ts` |

The live configs need `HEALTHAPP_DEMO_PASSCODE` and point at `HEALTHAPP_LIVE_URL`. Vitest unit tests: `npm test`. The nightly run of the live specs is described in [`docs/nightly.md`](docs/nightly.md).

## Environments and flow

| Branch | URL | Data |
| --- | --- | --- |
| `main` | `https://healthapp-8ui.pages.dev` | production |
| `staging` | `https://staging.healthapp-8ui.pages.dev` | reads `healthapp_demo`, the founder's real records |
| `staging-dev` | `https://staging-dev.healthapp-8ui.pages.dev` | the synthetic `dev` twin, same commit as `staging`; every automated test and agent check uses only this one |

Work goes on a branch (`feat/`, `fix/`, `docs/`, `chore/`), into a PR to `staging`, then `staging` to `main` in a release that needs the owner's yes. Each PR carries a lane label: A (copy, links, styling, docs) merges when `static` and `smoke` are green; B adds the post-build review and mapped specs; C (auth, RLS, migrations, data deletion) adds the funnel and migration jobs. Details: `docs/engineering/testing-strategy.md` in the conductor repo (`onedotatatime/conductor`). Deploy and URLs: [`docs/deploy.md`](docs/deploy.md).

No agent signs in or reads row content on `staging` (MIN-4526).
