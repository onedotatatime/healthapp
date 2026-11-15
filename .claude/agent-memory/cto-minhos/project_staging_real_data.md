---
name: staging-real-data
description: MIN-4658 (2026-11-15): founder required staging = healthapp_demo; decision is branch `staging` builds as demo, tests move to twin `staging-dev`; real exams split 20 on patient.demo (+10 synthetic), 3 on founder.demo; cleanup direction on hold
metadata:
  type: project
---

On 2026-11-15 the founder saw the synthetic persona on staging. My part 1 proposed a separate `staging-real` address and put a yes/no to him. He rejected being asked: "this is your decision not mine. My ask is very clear. staging to load the data from the database and not show dummy data. So if i loged in as patient to load the same patient as production with the same data".

Amended decision (comment "CTO · MIN-4658 part 1, amended"): a build of the branch named exactly `staging` is a `demo` build (pure `buildEnv(branch, variable)` in the build, keyed on `CF_PAGES_BRANCH`); every other preview stays `dev`; no Pages variable changes. Automated tests, the nightly and every agent browser session use the twin branch `staging-dev` (same commit, built `dev`), which Release fast-forwards after each staging merge. No merge to staging until its schema files are in `healthapp_demo._applied`; SQL ahead of production is additive.

**Why:** Cloudflare Pages has only Production and Preview variables, so a Preview-wide `demo` would open every agent branch on his records. A copy into `dev` is a second copy of real health data. The functions are already one set for both envs (header picks the schema) and CORS allows every preview origin, so only the frontend build needed a switch.

**How to apply:**
- A stated requirement from him about where his own data shows is decided by me and executed; do not send him a yes/no on the mechanism.
- Any request to "show real data" somewhere: never the Preview variable, never a copy into `dev`.
- No agent signs in on `staging` (MIN-4526): counts, HTTP codes and the `/health` text only. Live specs abort unless `/health` says `dev` before the passcode is typed (seen in `exam-journey`; confirm in the others).
- Before relying on any of this, check it actually merged: at decision time nothing was built.

Part 2, Cron's counts (comment 8f7a186b): `patient.demo` = 30 confirmed (10 seeded persona + 20 from his files), `founder.demo` = 3 real, both opted in, both profiles carry his name.

Part 2 cleanup spec (move the real rows to `founder.demo`, files stay, persona restored by 003, delete the persona account's `assistant_turns`) is **on hold in its direction**: he uses the patient button as himself, so Back settles which button is his account after the submission, then I re-issue the spec. The delete stays his yes.

- Functions read files by the row's `storage_path`, so an ownership change is a row update, not a file move. Re-check with a grep before relying on it.
- Applying `003_seed_personas.sql` to demo writes the persona's name back on `patient.demo` and his scans there are then refused. Nobody applies it to demo outside the cleanup.
- Possible matches takes the latest value per analyte across all confirmed rows of the account, so seeded 2026 values override older real ones. Until the cleanup, any result from `patient.demo` is reported as "includes 10 synthetic documents".

Post-build pass 2026-11-15 (comment 5893091d): #2 E2E 9225a28 and #3 Ren f0441b4 both pass. `env.ts` passes the WHOLE `import.meta.env` object to `parseEnv`; a Vite 8 `define` of `import.meta.env.VITE_X` is merged into that object (proven by grepping `VITE_HEALTHAPP_ENV:\`demo\`` in dist). On macOS, `dist-staging` and `dist-Staging` are the same folder: name build copies case-distinct. 019 is not a precondition for the switch; my "no seed to demo" rule means persona seeds (003/007/011) only. `test/min-4650-session` must get the `/health`=dev guard before it merges.

Related: [[healthapp-real-data-regime]], [[confirmed-without-file]], [[token-refresh-401]], [[oneoff-real-row-delete]].
