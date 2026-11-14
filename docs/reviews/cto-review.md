# CTO review of the PRD (v1.4), before the build

**CTO · MIN-4426 · 13 Nov 2026.** This review covers the PRD and the technical solution: section 10 (Cron) and section 12 (Ren). It reads them against the founder's later decisions in `00-founder-brief.md`: global market, his own real exams as test data, a deployed demo that is wiped afterwards, and the CTO's choice of AI endpoint. It is reviewed once and does not open a second round. Back applies the changes in section 8 below to PRD v2.

Skills applied: `cto-advisor` (the verdict, and the endpoint decision in ADR form), `senior-pm` (the fit, three-point estimates, the cut order), `code-reviewer` (the Cron and Ren contract, read with the universal lens: security, async, resources, failure handling).

---

## 1. Gate verdict: **GO WITH CHANGES**

The architecture is sound and I keep it: one React/Vite PWA on Cloudflare Pages, Supabase with RLS as the access authority, Gemini with a forced schema, verification on the server, a signed hash-chain log, and no blockchain. Cron's section 10 is strong work. Two parts need changing. The privacy design was written for synthetic data and now has to carry the founder's real exams on a public host. The Cron and Ren contract has eight mismatches, and each of them would cost an hour at integration.

The build starts tomorrow on these conditions:
1. Back applies the 5 must-change items (section 8) to PRD v2 before H0. Nothing here needs a new design round.
2. **No real exam is uploaded before the real-data gate passes** (section 2.9). Until then, the build runs on synthetic data exactly as Cron planned.
3. The founder answers the 3 questions in section 9. Each comes with a recommendation, and each has a safe default if he does not answer.

---

## 2. Real-data impact (sections 10 and 12)

N4 ("synthetic only") is overridden by the founder for **his own records only**. Synthetic data stays in place for development, for tests and for the stage persona. Real data is used only for the role-play with a doctor, and on stage only if he chooses (Founder decides #3).

### 2.1 Two environments, not one (decision)
| | `dev` | `demo` |
|---|---|---|
| Supabase project | EU (Frankfurt) | **A separate project**, EU (Frankfurt), created for this weekend only |
| Data | Synthetic only (Cron's ground-truth set, Maria, the "other person") | The founder's real account and exams, plus the same synthetic accounts for the stage story |
| Pages | Preview deploys | The production URL |
| Agents | Use it freely: SQL, screenshots, browser tests | **Deploy only** (migrations, functions, secrets). They never read row content, never download objects and never screenshot the app while signed in as the founder. Verification uses counts, hashes and HTTP codes only |

Why: Claude transcripts, agent memory and Linear evidence are the likeliest leak routes, and this split closes them by design rather than by discipline. Deleting the `demo` project is also the cleanest possible wipe. Cost: about 0.5 h of Backend time (migrations and functions deployed twice).

### 2.2 Storage and encryption at rest
- Platform encryption at rest (Postgres disk and Storage), TLS in transit, a **private** bucket, RLS on every table, and signed photo links of 60 s that never outlive the grant. These were already in Cron's plan and are enough for a consented two-day proof of concept.
- **No application-level encryption at the event.** The server holds the key either way, because it calls the model, so a second layer buys no protection that the project split and the wipe do not already give. It would cost about 2 h. P2 stays "simulated" and says so (section 6).
- New rules: upload with `cacheControl: "no-store"`. Every function returns `Cache-Control: no-store`. The service worker caches the shell only, as Ren wrote. Pages `_headers` set `Referrer-Policy: no-referrer` and `Permissions-Policy: camera=(self)`. **No Sentry and no analytics on `demo`**, because both capture payloads.
- **Auth on `demo`:** public sign-up is off. The founder's account uses email and a strong password, entered once by him on each device. **The "demo-login buttons" of Cron's hour 0–1 exist only for synthetic accounts.** A one-tap login to the founder's record on a public URL is not allowed.
- **The founder's profile** (name and ID number) is typed by him into the Supabase table editor of `demo`, in about 2 minutes. It never sits in a seed file, an env file in the repo, or a test table.

### 2.3 The AI endpoint (decision, ADR form)
- **Context.** A model must read his real exams. The founder wants the hackathon credits used, with no training and no retention. He said: "CTO confirms."
- **Options.** (a) Gemini on **Vertex AI** under the credit's Cloud Billing account, EU regional endpoint. (b) The Gemini API (AI Studio) with a **paid-tier** key. (c) The AI Studio free tier. (d) Another provider (Claude, Azure OpenAI): no credits, and each has the same abuse-monitoring clause unless an enterprise zero-retention contract is signed.
- **Decision: (a) Vertex AI Gemini, EU regional endpoint** (for example `europe-west3` Frankfurt, or whichever EU region serves the chosen models; **not** the `global` endpoint). The kickoff bake-off fixes a Flash-class model for extraction and a Pro-class model for `causes` and `cross`. (c) is **forbidden** for real data, because free-tier prompts may be used to improve Google's products.
- **Check at kickoff, all before the real-data gate. The CTO checks and Cron executes:**
  1. The credit lands as billing credit on a **paid Cloud Billing account**, so the Google Cloud service terms and the data processing terms apply and Google does not train on the prompts.
  2. Vertex AI **data caching is switched off** at project level. By default Vertex keeps inputs in memory for up to 24 h; to verify in the current docs.
  3. Read the current abuse-monitoring clause and write down what it keeps and for how long. "No retention" in the strict sense needs an exemption we cannot get this weekend. The founder decides whether that is acceptable (Founder decides #1).
  4. **Inline requests only.** No Files API (it stores uploads for 48 h), no explicit context caching, no batch jobs, no request-response logging to BigQuery, no Cloud Storage staging. The wrapper code enforces each of these, so they hold even if someone forgets.
- **Fallbacks, in order.** (1) If the Vertex auth from Deno (a service-account JWT through `jose`) blocks for more than 45 min, use a Gemini API **paid-tier** key with the same checks. That keeps no-training but loses the EU-region guarantee, which falls inside Founder decides #1. (2) If the credit turns out to be free tier only, or arrives late, use paid Vertex on the founder's own billing within a cap (Founder decides #2). Until then the build continues on synthetic data and nothing waits. (3) If neither is possible, his real exams are not used at the event, and the role-play runs on the synthetic set.
- **Consequences.** Google is the only third party that ever sees his exams. Our wipe cannot reach Google's abuse-monitoring logs, and the wipe report says so plainly.
- **Minimisation (new, about 10 min):** the `assistant` context **drops `printed_name` and `printed_id`**. The model answers the doctor without knowing who the patient is. Extraction has to see the name, because it is printed on the page; that call is the only exception.

### 2.4 Greek extraction on real documents (Cron's top risk, and it changes)
- Real Greek reports bring risks that synthetic renders do not: multi-column tables of 40 to 80 analytes, **comma decimals and dot thousands** ("5,2", "1.250"), ranges such as "0 - 5", "<5" and "έως 5", flag columns ("*", "H", "↑"), dates written dd/mm/yyyy (never mm/dd), names in capitals without accents with a patronymic ("ΤΟΥ ΙΩΑΝΝΗ"), several pages, and glossy paper.
- Required: the server parsers handle comma decimals and dd/mm dates. A name token that is not in the profile, such as a patronymic, does not cause a refusal; Cron's "every profile token found" rule already allows it. The 25-analyte synonym map is used for series only, and any other analyte keeps its printed name.
- **PDFs and multi-page reports move into the demo**, at about 0.5 h for Backend and 0.25 h for Frontend. Gemini reads `application/pdf` inline (about 20 MB per request, to verify) and accepts up to 4 photos as one document in one call. Ren's file input accepts PDF without the resize step.
- **Cron's cut "fall back to English and two kinds" no longer applies.** The founder's exams are Greek, and cutting Greek cuts the role-play. The fallback is the A2 review screen, where the founder corrects fields. On stage we show the 3 exams that read best.
- **M2 on real data, measured without anyone reading the data:** M2 = 1 − (fields marked `edited_by_patient` ÷ fields extracted) over his confirmed documents. It is a SQL count on `demo`, and the founder's corrections are the ground truth. On synthetic data, M2 stays Cron's automatic check against the ground-truth JSON.
- Expect larger outputs, about 60 rows for a full blood panel, and 15 to 30 s. M3 holds at 60 s as the limit and stays at 30 s as the target. Extraction runs as a single request.

### 2.5 Radiology: reports versus images, and DICOM
- **The report** (paper, photo or PDF) goes through extraction like any other exam, as `imaging_report`.
- **Images** (MRI, X-ray, DICOM) are **attachments only**. At upload the patient chooses between "Report" and "Image (attachment)". An attachment **never reaches the model**: the code checks the kind and the MIME type, and `.dcm` and `application/dicom` are blocked in the `extract-exam` path. The attachment is linked to a report and listed with its name, date and size.
- **No DICOM viewer at the event.** Cornerstone and similar viewers cost hours. To show an image, the founder exports a JPEG from the viewer on the CD and attaches it.
- DICOM headers, and often the image pixels themselves, carry his name, ID and date of birth. So **attachments are hidden in presentation mode**, and burned-in text is checked by eye before any image is shown.
- Attachments are **P1** at about 0.5 h for Backend and 0.5 h for Frontend, behind P0. Size cap: a few key images, at most 20 MB each, and never a full series.

### 2.6 Presentation mode (hides his name and ID on stage)
- **The client only, one component.** Every name, ID and date of birth goes through one `<Sensitive>` wrapper. In presentation mode the name shows as initials and the ID as "•••• ••••". Original photos and attachments are **blurred** (CSS `blur(24px)`, with no reveal) on the review screen, the source viewer and the timeline. The refusal screen masks the account holder's name.
- **On by default** on the production build. It is switched in the passcode-protected `/demo` panel, and a visible chip says "Presentation mode". It is switched off only for the private role-play with the doctor.
- Also covered: the doctor's header bar, the access-log entries and the browser tab title. The doctor seat uses a seeded name such as "Dr. Demo" unless the role-playing doctor agrees to show their own.
- Cost: about 1 h for Frontend. It is P0 if his real exams appear on stage, and P1 otherwise (Founder decides #3).
- Outside the app: the phone mirror shows only the app, Do Not Disturb is on, and notifications are hidden. **The fallback video (D4) and every deck screenshot are recorded on synthetic Maria only.**

### 2.7 The wipe (Release builds it; the CTO verifies)
**Principle: delete the container, not the rows.** The final wipe deletes the whole `demo` project. Release builds a one-command `wipe-demo` script with the steps below and runs it.

| # | Surface | Action | Verification (counts and HTTP codes only, posted on the issue) |
|---|---|---|---|
| 1 | Model side (Google) | Confirm `files.list` and cached contents are empty. Confirm there are no batch jobs, no BigQuery request logging and no Cloud Storage objects in the GCP project. Revoke the service-account key and the API key. Delete the GCP project if it is ours alone | Empty lists; the revoked key returns 401 or 403 |
| 2 | Supabase `demo`: database, storage, auth users, function secrets, logs | **Delete the project** (`supabase projects delete <ref>`, or the dashboard) | Before: the row counts per table for his account, written down. After: the project ref returns 404 and the API host fails to resolve |
| 3 | Backups | Supabase deletes backups with the project (to verify in Supabase's docs at wipe time; if unclear, open a support ticket and keep its answer). PITR is never enabled | The docs quote or the support answer, linked |
| 4 | Caches | The extraction cache lives **in Postgres** and goes with the project. Nothing goes into Cloudflare KV or the cache. Pages stores no data | n/a, by design |
| 5 | Logs | Function code never logs bodies, model output, names or IDs. PostgREST queries never filter by name or ID in the URL. The Supabase logs go with the project | A grep of the function source for `console.log` of payloads (code review) |
| 6 | Devices | On each stage device: sign out, clear the site data for the domain, uninstall the PWA, delete any screenshots and screen recordings from the test, and check the gallery for copies saved by the camera app | A checklist ticked by the founder |
| 7 | Our side | The founder runs `wipe-demo --scan`, which **asks for his ID number and name without echoing them** and counts matches in the repo and its git history, the healthapp agent-memory folder, the local Claude project transcripts and a Linear search. It prints counts only | All counts are 0 |

- **A dry run before any real upload:** Release runs the whole script on a throwaway project holding synthetic data, and the CTO checks the output. That is part of the real-data gate.
- **When:** after the final pitch on Sunday, within 24 h. The founder already said: "then delete them .its ok". **What we cannot wipe:** Google's abuse-monitoring logs, kept under its terms. The report says so in words.
- **`demo-reset` never touches the founder's account.** Cron's reset "removes live-added documents", and on `demo` every one of his documents was added live. The reset is scoped to the synthetic accounts only. Real data is deleted only by `wipe-demo`.

### 2.8 Judges uploading their own documents (Q32): **no**
That would be another person's real health data, with no consent record and no wipe plan for them. B1 would refuse it, but only after the model had already read it. Sign-up is closed. Judges can try the flow on Maria's account with the printed synthetic exams, including the "other person" refusal. This replaces Cron's SYNTHETIC-marker guard, which would also refuse the founder's real exams. **The marker guard is dropped** (saves 0.25 h). Synthetic documents keep the visible marker so they can never be mistaken for real ones.

### 2.9 The real-data gate (a new checkpoint at about H6–H8, run by the CTO)
His first real exam goes in only when **all** of these hold:
1. The endpoint checks of section 2.3 are done and written on MIN-4427.
2. `demo` is deployed: sign-up off, no demo-login for his account, RLS matrix green (run with synthetic accounts on `demo`), and no Sentry or analytics.
3. The `wipe-demo` dry run has passed.
4. Presentation mode works, if he wants real exams on stage.
5. The no-exposure rules of section 2.10 have been read out on MIN-4422.

### 2.10 No git, Linear, Slack, deck or memory exposure
- His files go from his phone or laptop straight into the `demo` app. They never go through a repo folder, a chat, a Linear attachment or an agent.
- Fixtures, test tables (including the 20-case identity table) and seeds are synthetic. His name is tested live, by uploading his exams on `demo`. A false refusal is reported as its pattern ("patronymic printed"), never as the value itself.
- Linear, Slack and STATE.md carry counts, timings, pass and fail, and hashes. They carry no values, no screenshots of his records and no names.
- The deck, the LinkedIn recap and the fallback video use synthetic Maria only.

---

## 3. Contract alignment: Cron (10) and Ren (12)

Cron owns `contract.ts` (zod), delivered at H0:30, and **adds mock fixtures generated from the synthetic ground truth**. That saves Ren about 0.5 h on MSW data. Each mismatch is settled in one line:

| # | Topic | Cron | Ren | **Settled** |
|---|---|---|---|---|
| 1 | Assistant transport | One verified JSON response | Typed blocks streamed over SSE | **One JSON, not streamed.** Unverified text shown and then retracted is worse than waiting. Ren drops the SSE parser and its tests (−1 h). The label is the catalogue's "Reading the record", not "Searching". Streaming verified blocks is P2 and not built at the event |
| 2 | Block kinds | `record_fact`, `general_knowledge`, `not_in_record`, `possibilities[]` | `fact`, `general`, `not_in_record` | **Cron's names** go in the contract, and Ren's renderer keys off them. No numeric field exists on `possibilities` |
| 3 | Cite ids | Short ids in the prompt (`r:7f3a`) | Resolved against the record index | The server maps short ids to **`r:<uuid>`, `f:<uuid>`, `d:<uuid>`** before responding. Ren resolves them against the rows read under RLS |
| 4 | E1 overview | An LLM mode | An LLM call when the session opens | **Deterministic: SQL or a view** of out-of-range results plus findings, with citations. It needs no model, costs no latency, cannot hallucinate and sits on the safe side of MDR. The workspace opens on the timeline at once, so M7 does not wait for any model |
| 5 | Extraction flow | One synchronous call, plus `documents.stage` | Upload, then a job id and status | **`doc-create`** (returns `doc_id` and a signed upload URL), then the PUT, then **`extract-exam {doc_id}`**, synchronous, 60 s timeout. **Stage labels are P2.** P0 is one honest label with an indeterminate bar (−0.25 h on each side) |
| 6 | QR payload | `https://<app>/s#hs1.<jti>` (fragment) | `https://<app>/s/<token>` (path) | **Fragment (Cron).** The token stays out of Cloudflare logs and the Referer header, and the SPA reads `location.hash` |
| 7 | Code life and refresh | 90 s, auto-refresh every 60 s | No auto-refresh; refresh on request | **120 s, no auto-refresh, a "New code" button** (Ren and Design). A QR that changes under the camera fails scans. The typed code shares the same life |
| 8 | Patient polling before a grant exists | Realtime on `grants`; `grant-status(grant_id)` | `GET /handshake/:id` every 2 s | **`grant-status` takes `grant_id` as optional.** With no id it returns the caller's newest pending or active grant. Realtime `postgres_changes` on `grants` with RLS, and 2 s polling when the channel is silent for 3 s |
| 9 | States | `pending/active/refused/expired/revoked`; claim errors | `code_shown/scanned/approved/…` | The contract uses **Cron's statuses** plus typed claim errors (`token_expired`, `token_used`, `token_invalid`, `rate_limited`). Ren's reducer maps them 1:1 |
| 10 | After expiry | Functions return `403 grant_expired`; RLS reads return an **empty set** | Expected a typed 403 everywhere | Ren treats **an empty result after data as a signal**: call `grant-status` and close. The local countdown reaching 0 closes the session too |
| 11 | Reset | New log epoch; the log is never erased | Clears the log to its seeded entries | **Epoch (Cron).** The panel shows the current epoch, and the reset is scoped to the synthetic accounts (2.7) |
| 12 | Diary | Direct insert under RLS | "Diary endpoint" | **A direct insert** through supabase-js. `recorded_at` defaults to the server's `now()`. No function |
| 13 | Grant length | A server constant of 15 min | Display only | **An env value**: 15 min for the stage and 45 min for the role-play with the doctor (Product confirms Q7). It is not code |
| 14 | Host | Cloudflare Pages | "Pages or Vercel" | **Cloudflare Pages.** The production URL points to `demo` and the previews to `dev`. HTTPS from H0:30 |

Lens findings that belong to no single side: every function sets CORS, `no-store`, and a 60 s abort on outgoing model calls. `handshake-claim` keeps its limit of 5 failures per doctor per minute. The `assistant` checks the role from `profiles` (Cron's control 2). Nobody uses the service role from the browser, ever.

---

## 4. The 20-hour fit

**Three-point estimates in hours (optimistic / most likely / pessimistic, weighted mean):**

| | P0 before changes | Changes in this review | P0 after | Weighted mean (sd) |
|---|---|---|---|---|
| Backend | 12.0 | +0.5 env split, +0.5 Vertex auth and checks, +0.5 PDF and multi-page, +0.25 reset scope, +0.1 pseudonymised context, −0.25 marker guard, −0.25 stage labels | **≈13.4** | 10 / 13.4 / 19 → **13.8 (±1.5)** |
| Frontend | 18.0 (with integration and demo mode) | −1.0 SSE, −1.0 helix animation moved to P1, −0.25 stage labels, −0.5 mocks from Cron, +1.0 presentation mode, +0.25 PDF input, +0.25 auth without demo-login for the real account | **≈16.75** | 13 / 16.75 / 23 → **17.3 (±1.7)** |

**Reading this honestly:** the plan works for **P0**, with Ren on the critical path and about a 60% chance of finishing P0 by H18. Backend has about 4 h of slack, so P1 server work (D3, F1–F2, E4, A3) gets built, while P1 screens are best effort. The wipe script and the dry run belong to Release and sit off the builders' clock.

**Cut now, before the event:**
1. **The helix animation** moves to P1, after the H12 skeleton. Build the static helix frame and the standard QR card. The DNA look survives, and "DNA just for the fun" is still respected.
2. **F3, doctor-to-doctor contact,** becomes one button and a "Request sent" state, with no simulated second doctor (Backend 0.5 h, Frontend 0.5 h).
3. **Every stretch:** the QR-signed lab proof, Oumi, Firecrawl reference pages, the chain anchor, the pseudo-locale run, the blur check, and the streaming upgrade.
4. **Stage labels during extraction** (P2).

**Checkpoints:**
- **H6–H8, the real-data gate** (section 2.9). It runs in parallel and blocks nothing on synthetic data.
- **H8, the joint check** on the deployed `dev` URL with synthetic exams: steps 1, 2 and 4 end to end, A1 at 90% or better of fields on 5 synthetic exams including Greek, and the QR scanned by the laptop webcam. **If any fails, cut now:** F1–F2, E4, D3 screens, the A3 series and the helix. Steps 1, 2, 4, 5, 6 and 8 stay.
- **H12, the walking skeleton:** all P0 steps once, on `demo`, with Maria. If it is not reached by H13, E3 becomes a question to the CTO, and nothing on the never-cut list goes.
- **H18, freeze.** H18–20: three clean runs on Maria (M1). The role-play with the doctor on the founder's real exams runs separately, before the freeze or on Sunday morning, with presentation mode off.

**Final cut order** (it replaces section 5, 10.15 and 12.11): helix animation → F3 (already reduced) → F1+F2 → A3 series → D3 screen (the log stays on the server) → E4 → attachments → presentation mode (only if real exams stay off stage) → replay polish → **E3**. **Never cut:** capture and review, the refusal, the handshake with countdown and End, the cited assistant with the source viewer, the wipe.

---

## 5. Answers to the open questions (also written as "CTO:" in the PRD)

- **Q1** Launch on Backend's regional zero-retention gateway, with identity stripped. Zero-retention contracts are a **launch prerequisite**. Confidential compute is tier 2. The demo uses Vertex EU (2.3).
- **Q2** A signed hash-chained log in Postgres, confirmed for the demo and for the product. No anchor at the event.
- **Q4** Agreed: a real verifier and a simulated issuer. The QR stretch is cut.
- **Q11** Agreed: one app with two roles. The doctor sits at the projected laptop, scans with the webcam, has a second phone as backup and the typed code as the third way in.
- **Q12** Cron generates the synthetic set (dev, tests and the stage persona). The founder's real exams are the role-play set, uploaded by him only, on `demo`, after the gate.
- **Q13** Gemini on Vertex EU is the only critical credit and the only one that touches real data. The others are in section 7.
- **Q16** Gemini only at the event. Firecrawl is cut.
- **Q19** E2E writes the 8-step checklist on synthetic data. Ren and Cron run it three times with the founder. M1 pass or fail is logged on MIN-4422 by the CTO.
- **Q29** Product scope, not for tomorrow. CTO recommends a printed recovery code plus a second device by default, with Shamir as an opt-in. The founder decides after the event.
- **Q30** Yes, as a rule for all copy. The list is in section 6.
- **Q31** Decided: Vertex AI, EU regional endpoint, paid billing credit, caching off, inline requests only. Checked at kickoff, with the fallbacks of 2.3.
- **Q32** No judge uploads. Sign-up is closed, and judges use Maria with the printed synthetic exams. The marker guard is dropped.
- **Q33** Agreed: EU first, then the US through FHIR and TEFCA, then the UK. The Gulf and India only for a named buyer. The deck says "EU-hosted pilot first".
- **Q34** Blind introduction accepted in principle, if: both patients consent again at that moment, only the overlap with the doctor's own patient is shown, no count below k is ever shown, a per-doctor budget applies, every query is logged, and counsel signs off. The demo is unaffected (k=5 enforced).
- **F-Q1** Supabase Realtime `postgres_changes` plus 2 s polling. Unbuffered streaming is moot, because responses are not streamed.
- **F-Q2** Not streamed. One JSON of verified blocks, with Cron's kind names (section 3, rows 1–3).
- **F-Q4** For the product: a native shell (iOS Secure Enclave, Android StrongBox) with non-exportable keys for patients. Doctors use the web with a device-bound WebAuthn credential. Synced passkeys are not used as the record key.
- **F-Q6** Cloudflare Pages: production goes to `demo`, previews go to `dev`. Webcam scan first, then the second phone, then the typed code.
- F-Q3 is Product's and F-Q5 is the founder's, through Product. From the CTO: F-Q3 is fine technically, because findings come back verbatim and are labelled as the document's own words.

---

## 6. Privacy claims the deck may make (rule for Anna and Pix, answers Q23 and Q30)

**Allowed for the demo (true this weekend):**
- "Encrypted at rest and in transit."
- "Hosted in the EU" (only once the Vertex region is confirmed at kickoff).
- "A doctor gets in only after an in-person scan and the patient's yes, and only until the clock runs out. The database enforces it."
- "Every access goes into a tamper-evident log the patient can read." (Only if D3 ships.)
- "No health data on any blockchain. The log holds only fingerprints and access events."
- "The doctor's assistant answers without knowing who the patient is."
- "The AI provider does not train on this data" (paid terms, confirmed at kickoff).
- "No insurer account, no export, no data sale."
- "The patient side never shows a diagnosis."
- "Tested on the founder's own exams, with his consent, and deleted after the event."

**Allowed only when labelled "in the product" (roadmap or architecture slide):**
- "The key lives on your phone." "We cannot read your record at rest." "Confidential-computing and on-device AI tiers." "Verified by source from labs and national systems." "Opt-in matches with a re-identification threshold."

**Forbidden everywhere:**
- "Nobody can read your data", "end-to-end encrypted", "zero-knowledge", "unhackable", "100% secure".
- "Fully anonymous" (say "pseudonymised" or "unnamed").
- "The AI keeps nothing" or "zero retention" (abuse monitoring applies).
- "HIPAA / GDPR compliant or certified", "CE-marked", "FDA-cleared", "clinically validated".
- "On the blockchain."
- "The identity check proves a document is genuine" (it stops casual claims, not forgers).
- "Verified" on a patient upload.
- Any screenshot of the founder's real records, in the deck or anywhere else.

---

## 7. Credits: where each fits safely

| Credit | Fits | Real exams? |
|---|---|---|
| **Google AI (Gemini on Vertex, EU)** | Extraction and the assistant, the only critical path | **Yes, only this one,** after the real-data gate |
| **fal** | Deck art, the helix visuals, the deck cover | **Never.** No screenshot of a real record goes in either |
| **boxd** | If it is sandboxed compute: the rehearsal copy and the measurement runs on `dev` | **Never** |
| **Firecrawl** | Cut at the event. Later: public reference pages from a fixed list, fetched at build time | **Never.** No query built from patient facts |
| **Oumi** | Cut at the event. Later: scoring answers on the synthetic set | **Never**, because a hosted evaluation would see health data |
| **treg** | Sales' market research | **Never** |
| **Wonderful** | Not assumed | **Never** |

---

## 8. Required changes for PRD v2 (Back applies them; owner in brackets)

**The 5 must-change items:**
1. **Real-data regime.** N4 becomes "synthetic for development, tests and the stage persona; the founder's own exams for the role-play, under section 2". 10.11 is rewritten: the marker guard is dropped and two environments are added. Q32 is closed: no judge uploads. Sign-up is off and there is no demo-login on the founder's account. Agents never read real content. Nothing real goes into git, Linear, Slack, the deck, the video or memory. [Back, Cron]
2. **AI endpoint.** 10.1 and 10.12 say: Vertex AI Gemini, EU regional endpoint, paid billing credit, caching off, inline requests only, assistant context without name or ID, radiology images never sent to the model. The real-data gate (2.9) goes into 10.14 at H6–H8. [Cron]
3. **The wipe.** `wipe-demo` (2.7) is built and dry-run before any real upload. The final wipe deletes the `demo` project, revokes the keys and cleans the devices. The CTO verifies with counts and HTTP codes. `demo-reset` is scoped to synthetic accounts. [Release builds, Cron scopes the reset, the CTO verifies]
4. **The contract.** The 14 settlements of section 3 go into 10.13, 10.16 and 12.2–12.5 (no streaming, Cron's kind names, full cite ids, a deterministic overview, `doc-create` plus synchronous extraction, PDF input, the fragment token, 120 s codes with no auto-refresh, optional `grant_id`, epochs, the diary insert, the grant length in env). [Cron and Ren together, at H0:30 in `contract.ts`]
5. **Presentation mode, radiology and real Greek documents.** 12.x adds presentation mode (2.6). Attachments are P1 and never reach the model (2.5). 10.4 adds comma decimals, dd/mm dates and multi-page and PDF input. The "cut to English" fallback is removed. M2 gains the edit-count measure on real data. [Ren, Cron, Back for M2]

**Also:** section 5's cut order is replaced by the one in section 4 [Back]. The helix animation and F3 are cut down now [Back, Pix, Ren]. Q7 is updated: grant length from env, 15 min for the stage and 45 min for the role-play [Back]. The demo story in section 4 records which steps use Maria and which use the founder's own exams, once Founder decides #3 is answered [CEO, Back].

---

## 9. Founder decides (at most 3)

1. **Retention on the AI side.** Google's paid terms rule out training, but Google may keep requests for a limited period to detect abuse, and we cannot wipe that. Do you accept this for your own exams, with Vertex in an EU region and caching off? **CTO recommends: yes.** Every hosted model has the same clause unless an enterprise contract is signed. *Default if unanswered: your real exams wait. The build runs on synthetic data.*
2. **A spend cap in case the credits don't fit.** If the Google credit turns out to be free tier only, or arrives late, may we use paid Vertex on your own Google Cloud billing, up to **€30**? The same cap covers the extra Supabase project for about 3 days, which costs a few euros. **CTO recommends: yes, €30 cap.** *Default: no spend, and the role-play uses synthetic exams.*
3. **Your exams on stage.** Option (a): the stage story runs on synthetic "Maria". The refusal, the cross-specialty case and the matches are seeded on her. Your real exams appear only in the private role-play with the doctor, and the pitch says they were used. Option (b): you also show 2 or 3 of your exams on stage, in presentation mode. **CTO recommends: (a)**, with an optional 20-second "and this is my own record" moment in presentation mode if you want it. *Default: (a).*

---

## 10. Sign-off

**CTO: signed with conditions, 13 Nov 2026.** The conditions are section 1's: the 5 changes applied to PRD v2 before H0, no real exam before the real-data gate passes, and the founder's answers to section 9, with the defaults standing if he does not answer. The technical solution in section 10 is sound once these changes are in. Development may start tomorrow at H0 on synthetic data.
