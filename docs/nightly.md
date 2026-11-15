# The nightly e2e-live run (MIN-4718)

Rule: `conductor/docs/engineering/testing-strategy.md` §3 (nightly, one Linear issue per red spec, fixed or deleted within 24 hours) and §5 (no real side effects). Decision: the CTO's part 1 on MIN-4714, section 5.

Goal: supports directions 4 and 5. The projection and matching screens are checked every night on the synthetic twin, so a break shows within a day and not at the next demo. Everything it checks is synthetic records.

## What runs

`.github/workflows/nightly.yml`, job `e2e-live`, 30 minute limit. Triggers: `schedule` 03:00 UTC and `workflow_dispatch`. No `pull_request` trigger and never a required check.

GitHub starts `schedule` and `workflow_dispatch` only from the default branch (`main`). On `staging` the file does nothing; it goes live with the next `staging` to `main` release.

| Step | What |
|---|---|
| checkout `ref: staging` | The specs match the code deployed on staging-dev. |
| `scripts/nightly-guard.sh` | Fails the run unless the target is exactly `https://staging-dev.healthapp-8ui.pages.dev` and the passcode is not empty. |
| `node --test scripts/nightly-scripts.test.mjs` | The guard, the reporter and the shape of the workflow tested against a Linear stub. A few seconds. |
| `npm ci`, `npx playwright install --with-deps chromium webkit` | webkit because the dashboard and glass configs run an iPhone project. |
| `playwright.dashboard.config.ts` | `doctor-dashboard` (asserts no paid call on open, ends its grant in `afterAll`). |
| `playwright.glass.config.ts` | `glass-redesign`. |
| `playwright.simulation.config.ts` | `simulate`, `simulations`, `recruit`. |
| `scripts/nightly-to-linear.mjs` | Job summary, and Linear issues for red specs. |

Each config step runs even if the one before was red, but not after a failed guard or a failed install. A cancelled run does nothing further.

### Not in the nightly

- `exam-journey` (`playwright.live.config.ts`): a real upload and a real Gemini read on dev, a row left every night.
- `doctor-diagnoses` (`playwright.diagnoses.config.ts`): three paid model calls per run.

Both break §5 as nightly runs. They stay manual: `HEALTHAPP_DEMO_PASSCODE=... npx playwright test -c <config>`.

## It can never point at the founder's real records

`HEALTHAPP_LIVE_URL` is written in the workflow as the dev twin, and `scripts/nightly-guard.sh` exits 1 for any other value (a trailing slash, `http://`, the other staging address, unset). Nothing in the workflow, the guard or the reporter names the other address; the test file checks this. The dashboard spec also checks that `/health` says `dev` before it signs in.

The guard also fails on an empty passcode, because every spec skips without it and an empty run would look green.

## Secrets (repository secrets, never printed, passed per step)

| Secret | Used by | Value |
|---|---|---|
| `HEALTHAPP_DEMO_PASSCODE` | guard and the three config steps | The DEV demo login passcode. Never the `demo` one. |
| `LINEAR_API_KEY_NIGHTLY` | the reporter step only | A Linear API key that can create issues and comments in team minhOS. |

Trace, video and screenshots are off in every config, and the JSON reports stay in `$RUNNER_TEMP` and are not uploaded: a failure message can quote what a spec typed, and only the job log masks secrets.

## A red run becomes Linear issues

`scripts/nightly-to-linear.mjs` reads the Playwright JSON reports (`--reporter=list,json`, one file per config).

- One issue per failing spec file: `Nightly red · e2e-live/<file> · <date>`. Team minhOS, project "Health app — hackathon prototype", label Quality Engineer. E2E has no Linear user, so the assignee is Cron Jobbidis, like every other E2E issue of the project.
- If an open issue (not completed, not canceled) already starts with `Nightly red · e2e-live/<file> ·`, the script comments on it instead.
- The text holds the failing test titles with `file:line` and the project name, the run URL, and "Lane B, fixed or deleted within 24 hours". No error message, no page text, no values.
- A test that passed only on retry counts as red (§3: a flip is deleted).
- If the Linear call fails, nothing is hidden: the job stays red and the failing specs and tests are written to the job summary.
- A run where nothing failed but nothing passed (everything skipped, or no report) is red too.

The owner of the red issues is E2E. Within 24 hours the test is fixed or deleted. No known-failures list, no baseline.

Modes: `--dry-run <report.json>` prints what would be filed and needs no key and no network. `--check <report.json>` reads Linear (team, project, label, assignee, open issues) and writes nothing; run it once after the secret is set.

## Running it by hand

Locally, same order as the workflow (dev passcode only):

```
set -a; . ~/.config/healthapp/demo-login.env; set +a
export HEALTHAPP_LIVE_URL=https://staging-dev.healthapp-8ui.pages.dev
scripts/nightly-guard.sh
npx playwright test -c playwright.dashboard.config.ts
npx playwright test -c playwright.glass.config.ts
npx playwright test -c playwright.simulation.config.ts
```

In GitHub: Actions, Nightly, Run workflow (after the file is on `main`). The log shows the staging-dev address and no secret.
