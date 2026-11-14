# Pitch deck content: health app (working name; see "Name")

| | |
|---|---|
| **Owner** | Anna Lytica (Marketing), MIN-4429. Deck story: CEO (MIN-4425). Design: Pix (MIN-4428), next. |
| **Version** | v1, 13 Nov 2026 |
| **Event** | Gen AI Summit Hackathon, Athens LifeTech Park, Biotech & AI track |
| **Market** | Global. Founder: "Dont focus on the greek market. we need to focus on global market" |
| **Sources** | Only `docs/research/` (Sales). Each number carries a source ID from the table at the end (S1 to S9) and its status from the research: **verified**, **secondary**, or **assumption**. Nothing from the research's "Do not put on a slide" list is used. |
| **Skills** | c-level-skills:board-deck-builder, marketing-strategy-pmm, copywriting, copy-editing, content-humanizer, competitor-alternatives |

**Rules this deck keeps (check them again after any edit):**

1. The patient side never diagnoses. The words "diagnosis" or "diagnose" never describe what the app does for a patient. Only the doctor sees possibilities, and they are labelled "for the doctor to evaluate".
2. No data is sold. Possible matches are opt-in, unnamed, and can be withdrawn. Research use is "later, consent-gated", never a revenue line called data.
3. No health data on any blockchain. We say "signed log of fingerprints and access grants".
4. Insurers: never a buyer, never a reader.
5. Pilot names are **targets. Nobody has been contacted.** The slide says so.
6. `[Name]` stands for the product name until the founder picks one (section "Name").

**Arc (13 slides):** story → problem → why now → product → live demo → privacy → possible matches → market → competition → who pays → go-to-market → **regulatory path (the closing content slide, founder: "We need to add it at a pitching deck as something at the end")** → team and ask.

---

## Slide 1: Hook (cover)

**Headline:** Maria's medical history fits in a folder. Her doctors never see all of it.

**Body:**
- `[Name]` · The patient-held record that doctors can question.
- Gen AI Summit Hackathon · Biotech & AI · Athens LifeTech Park

**Visual note for Pix:** Full-bleed photo-style illustration of a worn paper folder of exams on a waiting-room chair, a phone resting on it. Synthetic person, no real face, no real document. `[Name]` and the one-liner small, bottom-left. No numbers on this slide.

**Speaker notes (~25 s):** "This is Maria. She has knee pain and swollen joints. She has seen an orthopaedist and a rheumatologist. Her blood tests, her MRI report and two doctors' letters are in this folder, on paper. Each doctor sees the page Maria remembered to bring, and what she remembers to say. Neither sees what the other found. Maria is synthetic. Her folder is not unusual."

**Sources:** none (story slide).

---

## Slide 2: Problem

**Headline:** Every new doctor starts from what the patient remembers to bring.

**Body (three numbers, one line each):**
- **5 to 20%** of doctor-patient encounters involve a diagnostic error. *(WHO, S1)*
- **59%** of US adults have more than one patient portal. Only **7%** use an app to bring them together. *(US ONC, 2024, S2)*
- **4.7 years:** the average wait for a rare-disease diagnosis in Europe. The more doctors a patient sees, the longer it takes. *(EURORDIS, 2024, S3)*

Footer line: Even where records are digital, they are split by provider. Old paper and records from abroad sit on top.

**Visual note for Pix:** Three large numerals in a row, each with its one line and a small source tag. Behind them, faint: the folder from slide 1, now split into three piles labelled "Orthopaedist", "Rheumatologist", "Lab abroad".

**Speaker notes (~30 s):** "The WHO says about 1 in 10 patients is harmed in care, and diagnostic errors happen in 5 to 20 percent of encounters. In the most digital large market, the US, most adults already have several portals, and almost nobody combines them. For rare diseases it takes years, and seeing more doctors makes it slower, not faster. The information exists. It just never arrives at one desk."

**Sources:** S1 (verified), S2 (verified), S3 (verified). "1 in 10" in the notes: S1 (verified).

---

## Slide 3: Why now

**Headline:** The law now opens the record to the patient, and AI can finally read the paper.

**Body:**
- **AI reads documents.** A phone photo of a lab report becomes dates, values, units and ranges in seconds. *(Shown live in the demo, slide 5.)*
- **Europe:** the EHDS is in force since March 2025. Patients get the right to add their own data, restrict access and see who looked. Patient summaries join in **2029**; lab results, images and discharge reports in **2031**. *(European Commission, S4)*
- **United States:** information-blocking rules are in force and the national exchange network (TEFCA) is live. *(S5, secondary)*
- **Patients already carry the device.** The key, the camera and the handshake are all on the phone in their pocket.

**Visual note for Pix:** A horizontal timeline: 2025 EHDS in force → 2029 patient summaries → 2031 labs and images. Above it, a phone with a camera frame around a lab sheet. Mark the US line with a small "secondary source" tag in the source footer.

**Speaker notes (~25 s):** "Three things changed. Models can now read a photographed exam reliably enough to structure it. Europe's EHDS gives every patient the right to hold, add to and control their health data, with deadlines in 2029 and 2031. The US has opened records by law. The rails are coming. What is missing is the layer the patient carries across all of them."

**Sources:** S4 (verified), S5 (secondary). No number is used for the US line.

---

## Slide 4: Product

**Headline:** One photo in. One history out. The doctor asks, and every answer shows its source.

**Body (five steps, left to right):**
1. **Photograph** an old exam. `[Name]` reads it: date, lab, every value with its unit and range.
2. **It must be yours.** The name and ID on the exam must match the account. Someone else's exam is refused.
3. **One timeline.** Exams and the symptom diary, in date order. The patient side records. It does not interpret.
4. **The DNA handshake.** The patient shows a helix-shaped code, the doctor scans it, the patient approves. Access runs for a set time.
5. **The doctor asks.** "When was her CRP raised?" The answer lists dates and values, each linked to the exam it came from.

Under step 5, small: Possibilities to evaluate, for the doctor only. Never shown to the patient.

**Visual note for Pix:** Five phone and laptop frames in a row with one-word labels (Photograph · Match · Timeline · Handshake · Ask). Step 4 carries the DNA-shaped QR. Step 5 shows a cited answer with a source chip "Blood test · 12 Mar 2026 · Uploaded by patient". Use the two provenance marks exactly: "Verified by source" and "Uploaded by patient".

**Speaker notes (~30 s):** "Maria photographs her exams once. We read them and check each one is hers, so nobody builds a record out of someone else's papers. Her symptoms go in a diary as they happen; the app says nothing about what they mean. At the orthopaedist she shows a DNA-shaped code. He scans, she approves, and for fifteen minutes he can ask her history anything. Every answer points to the page it came from."

**Sources:** product spec, `PRD.md` sections 4 and 6. No numbers.

---

## Slide 5: Live demo

**Headline:** Live: Maria's folder, a doctor's question, an answer with its source.

**Body (what the room watches, in order):**
1. Photo of a blood test → structured record.
2. Her husband's exam → refused: not her name, not her ID.
3. DNA handshake → countdown starts.
4. "Has her CRP been raised before?" → dates, values, links to the exams.
5. Orthopaedics and rheumatology side by side → possibilities, each with its sources, for the doctor only.
6. Time ends → the doctor's screen closes; Maria's log shows who looked and until when.

Footer: Synthetic patient. Synthetic exams. No real health data.

**Visual note for Pix:** Minimal holding slide shown while the laptop switches to the live app: the six steps as a vertical checklist, large enough to read from the back of the room, plus the footer line. A fallback version with six screenshots, in case the network fails.

**Speaker notes (~20 s plus the demo):** "Let me show you, live. Everything you see runs on synthetic data." (Run the demo. If a step fails, switch to the screenshot version and narrate it; do not retry on stage.)

**Sources:** none.

---

## Slide 6: Privacy by design

**Headline:** The patient holds the key. The log holds only fingerprints. Insurers hold nothing.

**Body:**
- **The key is on the patient's phone.** Records are stored encrypted. Without the patient, nobody reads them, including us.
- **In person, for a set time.** A doctor gets in only by scanning the patient's code and getting a yes. Access ends by itself, or earlier with one tap.
- **A log nobody can edit.** Every access is written to a signed, chained log the patient can read. The log holds fingerprints of documents and access grants. No health data ever goes on a chain.
- **Never insurers.** No insurer account, no insurer export, no insurer as a customer.
- **No diagnosis for the patient.** The patient side has no AI question box at all.

**Visual note for Pix:** Centre: the patient's phone with a key icon. Around it, four short labels. One crossed-out icon for "Insurer". Keep it calm and plain; no padlock clip-art walls.

**Speaker notes (~30 s):** "We designed privacy in from the first line. The key lives on the patient's device. A doctor gets in only face to face, only with a yes, and only for a set time. Every access goes into a log the patient can read and nobody can edit; the log holds fingerprints, never health data. And insurers never get in. Not as readers, not as buyers. That is a product rule, not a setting."

**Sources:** `PRD.md` section 7 (principles P1 to P10). **Before stage:** Backend confirms in PRD section 10 which of these run for real in the demo and which are simulated. If the key-on-device part is simulated in the demo, say "by design" and keep the demo claim to what runs (PRD Q23).

---

## Slide 7: Possible matches

**Headline:** A rare pattern becomes findable, only when the patient says yes.

**Body:**
- The patient can opt in. Off until they turn it on. Name and ID are never used. They can turn it off any time.
- The doctor sees that unnamed patients elsewhere share the same pattern of markers and symptoms. No names, no exact dates, no location below country.
- The doctor can ask to talk to the doctor treating that patient, to compare cause and treatment.
- **4.7 years** average wait for a rare-disease diagnosis in Europe, longer the more doctors are involved. *(EURORDIS, S3)*

**Visual note for Pix:** A globe with a few soft points connected to Maria's pattern card (three markers, two symptoms). One line between two doctor icons labelled "Contact requested". An "Opt-in" switch shown in the on position, small, next to the patient's phone.

**Speaker notes (~25 s):** "The founder's question was simple: somewhere in the world, someone has Maria's pattern. If she says yes, her doctor can see that similar unnamed cases exist and ask to talk to the doctor treating one of them. Not to sell data. To shorten the years patients spend going from doctor to doctor. Opt-in only, and she can withdraw at any time."

**Sources:** S3 (verified). Founder brief, flag 4.

---

## Slide 8: Market

**Headline:** Every doctor who sees a new patient is a seat: about $1.9B a year in the US, EU and India, on our assumptions.

**Body (bottom-up, the doctor pays, the patient is free):**

| | Doctors | At an assumed price | Per year |
|---|---|---|---|
| United States | 905,452 direct-care physicians *(AAMC 2025, S6, verified)* | $600 per seat *(assumption)* | $543M |
| European Union | about 1.98M practising physicians *(Eurostat 2023, S7, secondary)* | $600 per seat *(assumption)* | $1,188M |
| India | 1,386,157 registered doctors *(NMC via Parliament, S7, secondary)* | $120 per seat *(assumption)* | $166M |
| **SAM** | | | **about $1.9B** |

- **TAM about $8.5B a year:** about 14.1M doctors worldwide at $600. *(Derived from a secondary density figure, S7; a ceiling, not a forecast.)*
- **SOM about $19M a year by year 3:** 1% of SAM seats, about 42,700 doctors. *(Assumption.)*

Footer, required: Seat price and share are assumptions to be tested in pilots. Not a forecast.

**Visual note for Pix:** Three nested circles (TAM, SAM, SOM) with the dollar figure in each and the word "assumption" visibly attached to each. The US doctor count is the one verified number: give it weight. Small table beside the circles. No analyst market-size figures.

**Speaker notes (~30 s):** "We size the paying side only: doctors. The US alone has about 905,000 physicians in direct care. At an assumed fifty dollars a seat a month, which sits under paid AI scribes and above the free tools, the US, the EU and India are about a 1.9 billion dollar a year market. One percent of those seats by year three is about 19 million a year. These are our assumptions, and the pilots exist to test the price."

**Sources:** S6 (verified), S7 (secondary; derived and assumption labels per `market-and-competitors.md` §1.2). **Note:** Sales lists "our TAM, SAM and SOM themselves, until the $600 seat price and 1% share are validated" under "Do not put on a slide". This slide shows them only because the brief asks for TAM/SAM/SOM, and every dollar figure carries its assumption label on the slide itself. If the CEO prefers, cut the dollar figures and keep the verified doctor count plus the model's formula (PRD Q24).

---

## Slide 9: Competition

**Headline:** Others hold one provider's chapter, or answer the patient. We give the doctor the whole book, and the patient keeps it.

**Body: a positioning map.**
- **Horizontal axis:** who holds the record. *Institution or state* ← → *the patient*.
- **Vertical axis:** what it covers. *One provider or one country* ↓ ↑ *every provider, every border, old paper*.

| Where on the map | Who | What they do well | What they do not do |
|---|---|---|---|
| Institution-held, one provider | **Epic** (MyChart, Emmie, Art) | Chart summaries inside one health system | The patient's outside history, old paper, records from abroad |
| State-held, one country | **National apps** (NHS App, India's ABDM, Abu Dhabi's Malaffi, Greece's myHealth) | Scale inside their borders | Old paper, other countries, a doctor-side assistant across all of it |
| Patient side, US connected records | **ChatGPT Health** | Explains records to the patient | US only; answers go to the patient; no doctor handshake; no source marking |
| Off the map: not a record | **OpenEvidence** | Evidence answers for doctors | Answers from the literature, not from this patient's history |
| **Patient-held, every provider and border** | **`[Name]`** | Old paper to one history; doctor-only assistant with sources; in-person handshake | Not yet certified for decision support (slide 12) |

**Visual note for Pix:** A 2x2 map. `[Name]` alone in the top-right, in the accent colour. Epic bottom-left, national apps left-middle, ChatGPT Health right-middle. OpenEvidence as a small callout outside the frame: "answers from literature". Add a thin tag on each logo: "AI talks to: patient" (ChatGPT Health, Emmie) or "AI talks to: doctor" (Epic Art, OpenEvidence, `[Name]`). Use names in text, not logos, unless Design has usage rights.

**Speaker notes (~30 s):** "Epic summarises what is inside one hospital. National apps hold what enters their own system, inside one country. ChatGPT Health talks to the patient, and only in the US. OpenEvidence answers doctors from the literature, not from this patient. We sit where none of them sits: the record the patient carries across every provider and border, with an assistant that answers only the doctor, and shows its source."

**Sources:** S8 (`market-and-competitors.md` §2, company pages). No competitor numbers are used: Epic's market share, ChatGPT's user count and OpenEvidence's valuation are on Sales' do-not-use list. Avoid "the only" and "the first" in speech: the research found no proof either way.

---

## Slide 10: Business model, who pays

**Headline:** The patient never pays. The insurer never sees. Hospitals pay for a better first visit.

**Body:**

| When | Who pays | For what | Model (to test in pilots) |
|---|---|---|---|
| Year 1 | Medical-tourism hospitals and international-patient departments | A consented, translated history that arrives before the patient does | Per-case fee |
| Year 1 | Multi-specialty clinic chains and telehealth platforms | The doctor sees the whole history at the first visit | Per-doctor seat |
| Year 1 | Rare-disease networks | A pilot where possible matches matter most | Free pilot, grant-funded |
| Year 1 | Lab networks | Results the patient carries, marked "Verified by source" | Partnership |
| Year 2+ | National health-data agencies | A patient-held layer next to the national record | Tender, sandbox |
| **Never** | **Insurers** | | **Excluded by design** |

Footer: Models are hypotheses for pilots to test. No prices are claimed.

**Visual note for Pix:** Simple table, the "Never: Insurers" row visually separated (a rule above it, muted colour). The first row gets the accent: it is the wedge.

**Speaker notes (~25 s):** "The patient is free. Insurers are excluded, by design. The first buyer is the hospital that treats patients from abroad: their records arrive in other languages, on paper, or not at all, and the hospital already asks for them before the trip. Clinic chains pay per doctor seat. Rare-disease networks are our free pilots. Later, national agencies. Research use, if ever, is opt-in and never a data sale."

**Sources:** `buyers.md` §1 and §5. No prices (none are sourced; seat price on slide 8 is labelled an assumption).

---

## Slide 11: Go-to-market

**Headline:** Start where the history is thickest and the buyer already asks for it.

**Body (pilot path; targets, nobody contacted yet):**
1. **This weekend · Athens LifeTech Park.** First clinicians' feedback, one orthopaedics and rheumatology pair as a clinical champion.
2. **Clinical validation · innovation gateways.** Sheba ARC, then Mayo Clinic Platform. Run on synthetic or de-identified data first.
3. **First revenue · medical-tourism hubs.** UAE first (Cleveland Clinic Abu Dhabi), then Bangkok and Istanbul (Bumrungrad, Acıbadem).
4. **The network · rare-disease groups.** EURORDIS and a national member, where possible matches prove themselves.

Market order after the pilots: UAE and the Gulf → UK → India → US (rare disease and international-patient offices) → core EU as EHDS lands.

Footer, required: Named organisations are targets from public research. None has been contacted.

**Visual note for Pix:** A left-to-right path of four stops with a small world map underneath (Athens, Tel Aviv / Rochester, Abu Dhabi, Bangkok, Istanbul, Brussels). Footer line in the same size as body text, not fine print.

**Speaker notes (~30 s):** "We start where records are thickest and the buyer already wants them. This weekend, here, we look for a clinical champion. Next, an innovation gateway like Sheba's ARC to validate with clinicians. Then the first paying use: hospitals that treat patients from abroad, starting in the UAE. And the rare-disease community, where possible matches matter most. These are targets; we have not contacted anyone yet."

**Sources:** `buyers.md` §4 (pilots); `market-and-competitors.md` §5 (market order). **Check before stage:** Sales flags that Sheba ARC was reportedly being sold to Redesign Health (buyers.md, target 35). If confirmed, say "an innovation gateway such as Mayo Clinic Platform" instead (PRD Q25).

---

## Slide 12: Regulatory path (closing content slide)

**Headline:** The record ships first. The assistant ships certified. A plan, not a risk.

**Body (three steps):**

| Step | What ships | What applies |
|---|---|---|
| **1. The record** | Photo to history, identity match, handshake, cited search, symptom diary | **GDPR** (EU) and **HIPAA** (US): health data, explicit consent, impact assessment. Software that only stores, retrieves and shares is generally not a medical device. |
| **2. The network** | Opt-in possible matches, doctor-to-doctor contact | **GDPR** explicit consent. **EHDS** gives the lawful route for research use. Our rule is stricter: opt-in only. |
| **3. Decision support** | "Possibilities for the doctor to evaluate" | **EU MDR**: medical-device software, certified with a notified body. **EU AI Act**: high-risk obligations follow. **US FDA**: clinical decision-support guidance. |

Footer: Every step keeps the same rules: no diagnosis to patients, no health data on a chain, no insurers.

**Visual note for Pix:** Three ascending steps, left to right, each with its "ships" line and its law badges (GDPR, HIPAA, EHDS, MDR, AI Act, FDA). Step 3 carries a small "certification" seal outline. Calm, confident; not a warning slide, no red.

**Speaker notes (~30 s):** "We know where the line is. Suggesting possible causes makes software a medical device in Europe, so we sequence. First the record: it stores, finds and shares, under GDPR and HIPAA. Then the opt-in network, with the EHDS as the legal route for research. Then the doctor's assistant, certified under the MDR, with the AI Act's high-risk rules. Today's demo uses only synthetic data. That is our plan, and it is the reason a hospital can say yes to step one now."

**Sources:** `PRD.md` section 8 (Product's summary, **not legal advice**); EHDS: S4 (verified); AI Act timing and FDA guidance: S9 (secondary). The MDR class (Rule 11, class IIa or higher) and the exact line between retrieval and decision support are **not** on the slide: they wait for Sales' check and a regulatory adviser (PRD Q18). No dates for the AI Act on the slide (sources conflict).

---

## Slide 13: Team and ask

**Headline:** Built at this hackathon. Next: three clinical partners to prove it.

**Body:**
- **Team:** `[founder: name, one line on background]`. `[others, if any]`. *(The founder fills this; nothing is invented here.)*
- **The ask, today:**
  1. A clinical champion pair: one orthopaedist and one rheumatologist to test the doctor view.
  2. Introductions to one international-patient department and one rare-disease patient group.
  3. A regulatory adviser for the MDR path.
  4. `[funding ask: amount and use, or remove; CEO and founder decide]`
- Contact line: `[email]` · `[Name]` site `[when it exists]`

**Visual note for Pix:** Left half: the team (photo placeholders, the founder photo used in house templates where it exists). Right half: the ask as a short numbered list. The DNA-shaped QR in a corner, linking to a contact page once one exists (no live link until the founder approves it).

**Speaker notes (~20 s):** "We built this here, this weekend. What we need now is not more code: it is two doctors who will try the doctor view, one hospital that treats patients from abroad, one rare-disease group, and an adviser for the certification path. If that is you, or someone you know, come and find us. Thank you."

**Sources:** none.

**If the deck must end on the regulatory slide** (MIN-4429's acceptance criterion says "the last slide is the regulatory path"): move the four ask lines into slide 12's footer and drop slide 13. The founder's words ("something at the end") allow either; the CEO decides (PRD Q26).

---

## Name

Three proposals. The founder chooses. Domains and trademarks have **not** been checked; Release or the founder checks before anything is registered or printed.

| # | Name | Rationale (one line) |
|---|---|---|
| 1 | **Anamna** | From *anamnesis*, the word doctors across Europe use for the patient's history, and Greek for "remembering": the history, remembered, born in Athens. |
| 2 | **Strand** | The DNA strand of the handshake and the single thread of a life's history; one syllable in every language. Risk: Strand Life Sciences, a genomics company, already uses the name in health. |
| 3 | **Histra** | A coined word, *history* + *strand*: says what it is, easy to say, more likely free as a domain and trademark. |

**My pick: Anamna.** It names the exact job (the history a doctor takes), every doctor in the room recognises the root, the Greek origin gives the Athens pitch a true story, and the DNA helix stays as the visual. Risk to test with five people tomorrow: it can be misheard as "amnesia". If two of five mishear it, fall back to Histra.

Tagline options, for the cover: (a) "The patient-held record that doctors can question." (recommended, says the category) (b) "Your history, remembered." (c) "Every page, one history, your key."

---

## Pitch script: 3 minutes (about 420 words, with the demo inside)

> Maria has knee pain and swollen joints. She has seen an orthopaedist and a rheumatologist. Her blood tests, her MRI report and two letters live in a paper folder. Each doctor sees the page she remembered to bring. Neither sees what the other found.
>
> This is normal. The WHO puts diagnostic errors at 5 to 20 percent of encounters. In the US, 59 percent of adults have several patient portals and only 7 percent combine them. For a rare disease in Europe, a diagnosis takes 4.7 years on average, and seeing more doctors makes it slower.
>
> Two things changed. AI can now read a photographed exam. And the law now gives patients their record: Europe's EHDS from 2029, US rules already in force.
>
> [Name] is the patient-held record that doctors can question. Let me show you.
>
> *(Demo, about 60 seconds.)* Maria photographs a blood test: date, lab, every value with its range. She tries to add her husband's exam: refused, not her name. At the orthopaedist she shows this DNA code, he scans, she approves, and a timer starts. He asks: "Has her CRP been raised before?" Dates, values, and each one links to the exam it came from. He asks for possibilities, and the assistant puts the orthopaedic and the rheumatology findings side by side, each with its source, for the doctor to evaluate. Time ends, his screen closes, and Maria sees who looked.
>
> Three rules hold everywhere. The patient holds the key. The patient never gets a diagnosis from us. Insurers never see a thing.
>
> If Maria says yes, her doctor can see that unnamed patients elsewhere share her pattern, and talk to their doctors. Opt-in only.
>
> The patient is free. Hospitals pay, starting with the ones that treat patients from abroad and already ask for their records before they travel. On our assumptions, doctor seats in the US, EU and India are about a 1.9 billion dollar a year market.
>
> Epic sees inside one hospital. National apps see inside one country. ChatGPT Health talks to the patient. We give the doctor the whole history, and the patient keeps the key.
>
> And we know where the line is. The record ships first, under GDPR and HIPAA. The assistant's possibilities ship after certification as a medical device under the EU MDR. That is the plan.
>
> We built this here. We need two doctors to try it, one international-patient department, one rare-disease group, and a regulatory adviser. Thank you.

---

## Pitch script: 30 seconds (about 80 words)

> Your medical history lives in a folder of paper, and every new doctor sees only the page you remembered to bring. [Name] turns that folder into one history from a few photos. You let a doctor in by a DNA-shaped handshake, for a set time. The doctor asks questions and every answer shows the exam it came from. You hold the key. You never get a diagnosis from us. Insurers never see it. Hospitals pay; patients don't.

---

## Open questions from Marketing (in PRD section 17 as Q23 to Q27; Q28 there covers the recap post)

| # | Question | Owner |
|---|---|---|
| Q23 | Which privacy claims on slide 6 run for real in the demo (key on device, signed log) and which are simulated? The slide says only what runs. | Backend (section 10), CTO |
| Q24 | Keep the TAM/SAM/SOM dollar figures on slide 8 with assumption labels, or show only the verified doctor count and the formula (Sales' do-not-use list includes them)? | CEO, with Sales |
| Q25 | Sheba ARC's reported sale: confirm before slide 11 names it. | Sales |
| Q26 | Deck ends on the regulatory slide (MIN-4429's acceptance criterion) or on team and ask after it (the coordinator's brief)? Both versions are written. | CEO |
| Q27 | Team line and funding ask on slide 13. | Founder, through the CEO |

---

## Sources

| ID | What | Status | Link |
|---|---|---|---|
| S1 | WHO patient-safety fact sheet (11 Sep 2023): about 1 in 10 patients harmed; diagnostic errors in 5 to 20% of encounters | verified | https://www.who.int/news-room/fact-sheets/detail/patient-safety |
| S2 | ASTP/ONC data brief, HINTS 7, 2024: 59% multiple portals, 7% combine with an app | verified | https://www.healthit.gov/data/data-briefs/individuals-access-and-use-patient-portals-and-smartphone-health-apps-2024 |
| S3 | EURORDIS Rare Barometer, Eur J Hum Genet 2024: 4.7 years average to diagnosis in Europe; more doctors consulted, longer delay | verified | https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11369105/ |
| S4 | European Commission EHDS page: in force 26 Mar 2025; 2029 patient summaries and ePrescriptions; 2031 images, lab results, discharge reports; patient rights to add, restrict, see access | verified | https://health.ec.europa.eu/ehealth-digital-health-and-care/european-health-data-space-regulation-ehds_en |
| S5 | US TEFCA live and information-blocking rules in force (law-firm and press summaries) | secondary | https://www.mcdermottlaw.com/insights/key-takeaways-2026-astp-annual-meeting/ |
| S6 | AAMC 2025 key findings: 905,452 direct-care physicians | verified | https://www.aamc.org/data-reports/data/2025-key-findings |
| S7 | EU physician count (Eurostat 2023), India registered doctors (NMC via Lok Sabha), world physician density; TAM/SAM/SOM model with the $600 seat price and 1% share as assumptions | secondary + assumption | `docs/research/market-and-competitors.md` §1.2 |
| S8 | Competitor teardown: Epic, national apps, ChatGPT Health, OpenEvidence | company pages, per research | `docs/research/market-and-competitors.md` §2 |
| S9 | EU AI Act high-risk timing for medical-device AI; FDA CDS guidance update (6 Jan 2026) | secondary | https://meddeviceguide.com/blog/eu-ai-act-omnibus-amendment-2026-medical-device-impact-guide ; https://www.orrick.com/en/insights/2026/01/fda-eases-oversight-for-ai-enabled-clinical-decision-support-software-and-wearables |

**Not used (Sales' do-not-use list):** any PHR or medical-tourism market size; the $42B medication-error figure; global medical-tourist head-count; OpenEvidence $15B; ChatGPT's 230M weekly health users; Epic's 42% share; Navina valuation; Heidi and Glass pricing; Eka Care, PatientsLikeMe, Clinerion and Riayati counts; Copilot Health and HealthEx; a dollar figure for duplicate tests. Also not used: every 🟡 figure from `buyers.md` (Bumrungrad's 50%, Cleveland Clinic Abu Dhabi's 35%), because none of its pages was opened.
