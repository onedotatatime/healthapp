# Pitch deck content: health app (working name; see "Name")

| | |
|---|---|
| **Owner** | Anna Lytica (Marketing), MIN-4429. Deck story: CEO (MIN-4425). Design: Pix (MIN-4428), next. |
| **Version** | v2, 14 Nov 2026 (MIN-4503: reframed on the founder's two points, "Dr Google" and better doctor decisions; numbers from `pitch-numbers-2026-11-14.md` and `treg-findings-2026-11-14.md`). v1, 13 Nov 2026. |
| **Event** | Gen AI Summit Hackathon, Athens LifeTech Park, Biotech & AI track |
| **Market** | Global. Founder: "Dont focus on the greek market. we need to focus on global market" |
| **Sources** | Only `docs/research/` (Sales). Each number carries a source ID from the table at the end (S1 to S17) and its status from the research: **verified**, **secondary**, or **assumption**. Nothing from the research's "Do not put on a slide" list is used. |
| **Skills** | c-level-skills:board-deck-builder, marketing-strategy-pmm, copywriting, copy-editing, content-humanizer, competitor-alternatives (v1); marketing-strategy-pmm, copywriting, copy-editing, content-humanizer, brand-review (v2) |

**Rules this deck keeps (check them again after any edit):**

1. The patient side never diagnoses. The words "diagnosis" or "diagnose" never describe what the app does for a patient. Only the doctor sees possibilities, and they are labelled "for the doctor to evaluate".
2. No data is sold. Possible matches are opt-in, unnamed, and can be withdrawn. Research use is "later, consent-gated", never a revenue line called data.
3. No health data on any blockchain. We say "signed log of fingerprints and access grants".
4. Insurers: never a buyer, never a reader.
5. Pilot names are **targets. Nobody has been contacted.** The slide says so.
6. `[Name]` stands for the product name until the founder picks one (section "Name").

**Story (v2, founder 14 Nov):** "help people get rid of their 'google is my doctor' habit" and "save the industry lots of money by helping doctors make the best decisions". Digitising paper is the means, never the headline. The national file (Greece's MyHealth) is a neighbour, not a rival: we carry what it does not hold.

**Arc (13 slides + 1 backup):** story → problem → why now → product → live demo → privacy → possible matches → impact → competition → who pays → go-to-market → **regulatory path (the closing content slide, founder: "We need to add it at a pitching deck as something at the end")** → team and ask. Backup: Appendix A, market sizing.

---

## Slide 1: Hook (cover)

**Headline:** Maria asks Google what her pain means. Her doctors each see one page of her history.

**Body:**
- `[Name]` · The whole history in front of the doctor, so the first decision is the right one.
- Gen AI Summit Hackathon · Biotech & AI · Athens LifeTech Park

**Visual note for Pix:** Full-bleed photo-style illustration of a worn paper folder of exams on a waiting-room chair, a phone resting on it with a search bar on screen (no real search engine logo). Synthetic person, no real face, no real document. `[Name]` and the one-liner small, bottom-left. No numbers on this slide.

**Speaker notes (~25 s):** "This is Maria. She has knee pain and swollen joints. At night she types her symptoms into a search bar. By day she sees an orthopaedist and a rheumatologist. Her blood tests, her MRI report and two doctors' letters sit in a folder, some on paper, some in an app, some from a private lab. Each doctor sees the page Maria remembered to bring. Neither sees what the other found. Maria is synthetic. Her story is not unusual."

**Sources:** none (story slide).

---

## Slide 2: Problem

**Headline:** Patients ask Google. Doctors decide from half a history. Both cost lives and money.

**Body (three numbers, one line each):**
- **Up to 15%** of diagnoses are inaccurate, delayed or wrong. *(OECD, 2025, S10)*
- **795,000** people a year in the US die or are permanently disabled because a dangerous disease was misdiagnosed. *(Newman-Toker et al., BMJ Qual Saf, 2024, S11)*
- **51%** of Greeks look up their health online. Symptom checkers put the right diagnosis first only **34%** of the time. *(Eurostat, 2025, S12; Semigran et al., BMJ, 2015, S13)*

Footer line: The history exists, split across providers, apps, private labs, paper and other countries. It never reaches one desk.

**Visual note for Pix:** Three large numerals in a row, each with its one line and a small source tag. Left two numerals under a small label "The doctor's side", the right one under "The patient's side". Behind them, faint: the folder from slide 1, split into piles labelled "Orthopaedist", "Rheumatologist", "Private lab", "Search history".

**Speaker notes (~30 s):** "The OECD says up to 15 percent of diagnoses are inaccurate, delayed or wrong. In the US alone, about 795,000 people a year die or are left permanently disabled by a missed dangerous disease. On the other side of the desk, half of Greeks, and 60 percent of Europeans, look up their health online, and symptom checkers get the diagnosis right first time only about a third of the time. The doctor guesses from half a history. The patient guesses from a search engine. The information exists. It just never arrives at one desk."

**Sources:** S10 (verified), S11 (verified), S12 (verified), S13 (verified). EU 60.3% in the notes: S12 (verified). Removed from v1 for space: WHO 5 to 20% (S1) and the US portals line (S2), both still true and still in the sources table; EURORDIS 4.7 years stays on slide 7.

---

## Slide 3: Why now

**Headline:** AI already knows the medicine. What it lacks is the patient's history, and the state is now forcing doctors to find it.

**Body:**
- **AI is not the missing piece. The record is.** Language models alone named the right condition in **94.9%** of cases. People using the same models found it in fewer than **34.5%**, no better than searching on their own. What was missing was the patient's information. *(Bean et al., Nature Medicine, 2026, S14)*
- **Repeat tests are being cut.** Since 1 November 2026, Greece's EOPYY posts lab results to one national file (MyHealth) and caps how often key tests can be repeated. A doctor who cannot re-order a test needs the earlier result in hand. *(Greek press, Nov 2026, S16)*
- **Europe opens the record to the patient.** The EHDS is in force since March 2025: patients can add their own data, restrict access and see who looked. Patient summaries join in **2029**; lab results, images and discharge reports in **2031**. *(European Commission, S4)*
- **AI reads documents.** A phone photo of a lab report becomes dates, values, units and ranges in seconds. *(Shown live in the demo, slide 5.)*

**Visual note for Pix:** Left: two bars from S14, "Model alone 94.9%" and "Person with the model < 34.5%", with the gap labelled "the missing history". Right: a short timeline: Mar 2025 EHDS in force → Nov 2026 EOPYY repeat-test limits → 2029 patient summaries → 2031 labs and images.

**Speaker notes (~30 s):** "Three things changed. First, a 2026 Nature Medicine study: the models alone found the right condition 95 percent of the time, but people using them got under 35 percent, because they gave the model incomplete information. A smarter chatbot is not the answer. The complete record, in front of the doctor, is. Second, this month Greece started putting lab results in MyHealth and limiting repeat tests, so doctors need the earlier result at hand. Third, Europe's EHDS gives patients the right to hold and add to their record. We are not a rival to the national file. We carry what it does not hold: private tests, imaging, old paper, records from abroad, and a summary for the doctor."

**Sources:** S14 (verified), S16 (secondary: Greek press, the EOPYY decision itself not opened), S4 (verified). The US line from v1 (S5, secondary) is cut for space.

---

## Slide 4: Product

**Headline:** Everything the patient has, in one history. The doctor asks, and every answer shows its source.

**Body (five steps, left to right):**
1. **Photograph** an old exam. `[Name]` reads it: date, lab, every value with its unit and range.
2. **It must be yours.** The name and ID on the exam must match the account. Someone else's exam is refused.
3. **One timeline.** Exams and the symptom diary, in date order. Patients log symptoms; the doctor gets the full picture; no self-diagnosis.
4. **The DNA handshake.** The patient shows a helix-shaped code, the doctor scans it, the patient approves. Access runs for a set time.
5. **The doctor asks.** "When was her CRP raised?" The answer lists dates and values, each linked to the exam it came from.

Under step 5, small: Possibilities to evaluate, for the doctor only. Never shown to the patient.

Under step 3, small: Instead of searching at night, Maria logs the symptom and taps **Send to my doctor**. Her doctor sees it with her whole history. The app does not explain it. Fixed line: "If this is an emergency, call 112."

**Visual note for Pix:** Five phone and laptop frames in a row with one-word labels (Photograph · Match · Timeline · Handshake · Ask). Step 4 carries the DNA-shaped QR. Step 5 shows a cited answer with a source chip "Blood test · 12 Mar 2026 · Uploaded by patient". Use the two provenance marks exactly: "Verified by source" and "Uploaded by patient".

**Speaker notes (~30 s):** "Maria photographs her exams once. We read them and check each one is hers, so nobody builds a record out of someone else's papers. When a symptom starts at night, she logs it instead of searching, and taps send to my doctor. The app does not tell her what it means; her doctor sees it next to her whole history. At the orthopaedist she shows a DNA-shaped code. He scans, she approves, and for fifteen minutes he can ask her history anything. Every answer points to the page it came from."

**Sources:** product spec, `PRD.md` sections 4 and 6. No numbers. Photographing paper is the way in, not the pitch: the value is the complete history at the doctor's desk. Patient-side offer: route to the doctor (founder, 14 Nov, Q29). No interpretation, no urgency score, no suggested causes for the patient (that would be triage and fall under the EU MDR; CTO to assess later). The only fixed text is the 112 emergency line.

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

## Slide 8: Impact, what better decisions save

**Headline:** Wrong diagnoses cost 17.5% of health spending. Better first decisions are the biggest saving in healthcare.

**Body:**
- **17.5%** of health spending in a typical OECD country goes on the harm of diagnostic error, about **1.8% of GDP**. Halving it would free **8%**, about **USD 676 billion** a year across OECD countries. *(OECD, 2025, S10)*
- **25 to 30%** of medical tests are unnecessary, about **2.5%** of health spending. *(OECD, 2025, S10)*
- **Worked example, Greece** *(our estimate)*:
  - The whole prize: about **€3.5 billion a year** of the €19.9 billion Greece spends on health is the cost of diagnostic error. *(S10 × S15)*
  - Our first slice, unnecessary and repeated tests only: **about €4M a year (conservative) to about €75M a year (upside)**, depending on how many patients bring their record. *(our estimate, S10, S15, S17)*

**One line on who pays:** Doctors and hospitals pay per seat or per case; the patient is free. 905,452 direct-care physicians in the US alone *(AAMC 2025, S6)*. Seat-based market sizing: Appendix A.

Footer, required: "Our estimate" means our arithmetic on sourced inputs. The share we prevent and the adoption rate are assumptions to be tested in pilots. Not a forecast.

**Visual note for Pix:** One big number left: "17.5% of health spending". Right: a funnel for Greece: €19.9bn spend → €3.5bn diagnostic-error cost → "our first slice: €4M to €75M a year, tests only". The words "our estimate" and "upside" visibly on the funnel, same size as the numbers. No market circles on this slide.

**Speaker notes (~30 s):** "The OECD put a price on it last year: diagnostic error eats 17.5 percent of health spending, almost 2 percent of GDP. Halving it would free 8 percent. Take Greece, where we are standing: that is about three and a half billion euros a year. We start with the smallest, most measurable slice, unnecessary and repeated tests. On tests alone, between 4 and 75 million euros a year in Greece, depending on adoption. The bigger prize is the diagnosis itself."

Formula for questions (do not read out): savings a year = cost base × share avoidable × share we prevent × adoption.
- Conservative: €810M (Greek stand-alone lab and imaging spend, 2024, S15) × 25% unnecessary (OECD low end, S10) × 20% we prevent (assumption) × 10% adoption (assumption) = **about €4M**.
- Upside: €497M (OECD's 2.5% unnecessary-test share × €19.87bn Greek spend) × 50% we prevent (assumption, anchored to S17: duplicate-imaging odds 0.44 when doctors used a shared record) × 30% adoption (assumption) = **about €75M**.
- Whole prize: €19.87bn × 17.5% = about €3.5bn (our estimate). Never say €75M without "upside" and the adoption assumption.

**Sources:** S10 (verified), S15 (verified), S17 (verified), S6 (verified). No count of wrong diagnoses per year exists for Greece or the EU in a primary source, so none is on the slide. No euro figure for duplicate tests in Greece or the EU exists either; the €4M to €75M is ours and labelled so.

---

## Slide 9: Competition

**Headline:** Others hold one provider's chapter, or answer the patient. We give the doctor the whole book, and the patient keeps it.

**Body: a positioning map.**
- **Horizontal axis:** who holds the record. *Institution or state* ← → *the patient*.
- **Vertical axis:** what it covers. *One provider or one country* ↓ ↑ *every provider, every border, old paper*.

| Where on the map | Who | What they do well | What they do not do |
|---|---|---|---|
| Institution-held, one provider | **Epic** (MyChart, Emmie, Art) | Chart summaries inside one health system | The patient's outside history, old paper, records from abroad |
| State-held, one country | **National apps** (NHS App, India's ABDM, Abu Dhabi's Malaffi, Greece's MyHealth, which holds EOPYY lab results since Nov 2026) | Scale inside their borders; public lab results | Private and out-of-pocket tests, imaging, old paper, records from abroad, a doctor-side summary across all of it. We work next to them, not against them |
| Patient side, US connected records | **ChatGPT Health**, symptom checkers | Explains records and symptoms to the patient | Answers go to the patient, from what the patient types in (slide 3: under 34.5% right); no doctor handshake; no source marking |
| Off the map: not a record | **OpenEvidence** | Evidence answers for doctors | Answers from the literature, not from this patient's history |
| **Patient-held, every provider and border** | **`[Name]`** | Old paper to one history; doctor-only assistant with sources; in-person handshake | Not yet certified for decision support (slide 12) |

**Visual note for Pix:** A 2x2 map. `[Name]` alone in the top-right, in the accent colour. Epic bottom-left, national apps left-middle, ChatGPT Health right-middle. OpenEvidence as a small callout outside the frame: "answers from literature". Add a thin tag on each logo: "AI talks to: patient" (ChatGPT Health, Emmie) or "AI talks to: doctor" (Epic Art, OpenEvidence, `[Name]`). Use names in text, not logos, unless Design has usage rights.

**Speaker notes (~30 s):** "Epic summarises what is inside one hospital. National apps like MyHealth hold public lab results inside one country, and we complement them. ChatGPT Health and symptom checkers talk to the patient, from whatever the patient types in. OpenEvidence answers doctors from the literature, not from this patient. We sit where none of them sits: the record the patient carries across every provider and border, with an assistant that answers only the doctor, and shows its source."

**Sources:** S8 (`market-and-competitors.md` §2, company pages); MyHealth and EOPYY: S16 (secondary); chatbot accuracy: S14 (verified). No competitor numbers are used: Epic's market share, ChatGPT's user count and OpenEvidence's valuation are on Sales' do-not-use list. Avoid "the only" and "the first" in speech: the research found no proof either way.

---

## Slide 10: Business model, who pays

**Headline:** The patient never pays. The insurer never sees. Hospitals pay for a better first decision and fewer repeated tests.

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

## Appendix A: Market sizing (backup slide, shown only if asked)

Moved here from slide 8 in v2 so the main deck carries the impact numbers the founder asked for. Q24 (keep the dollar figures at all) is still the CEO's call.

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

## Pitch script: 3 minutes (about 440 words, with the demo inside)

> Maria has knee pain and swollen joints. At night she types her symptoms into a search bar. By day she sees an orthopaedist and a rheumatologist. Her blood tests, her MRI report and two letters are scattered: paper, an app, a private lab. Each doctor sees the page she remembered to bring.
>
> This is normal. The OECD says up to 15 percent of diagnoses are inaccurate, delayed or wrong. In the US, 795,000 people a year die or are disabled by a missed dangerous disease. And half of Greeks look up their health online, where symptom checkers get it right first time about a third of the time.
>
> AI is not the missing piece. In a Nature Medicine study this year, the models alone named the right condition 95 percent of the time. People using them: under 35. What was missing was the patient's history.
>
> [Name] puts the whole history in front of the doctor. Let me show you.
>
> *(Demo, about 60 seconds.)* Maria photographs a blood test: date, lab, every value with its range. She tries to add her husband's exam: refused, not her name. At the orthopaedist she shows this DNA code, he scans, she approves, and a timer starts. He asks: "Has her CRP been raised before?" Dates, values, and each one links to the exam it came from. He asks for possibilities, and the assistant puts the orthopaedic and the rheumatology findings side by side, each with its source, for the doctor to evaluate. Time ends, his screen closes, and Maria sees who looked.
>
> Three rules hold everywhere. The patient holds the key. The patient never gets a diagnosis from us. Insurers never see a thing.
>
> Why it matters: the OECD puts the cost of diagnostic error at 17.5 percent of health spending. In Greece that is about three and a half billion euros a year. We start with the smallest slice, repeated and unnecessary tests: on our estimate, 4 to 75 million euros a year in Greece alone, depending on adoption.
>
> And the timing is right. Since this month, Greece puts public lab results in MyHealth and limits repeat tests. We do not compete with that. We carry what it does not hold: private tests, imaging, old paper, records from abroad, and a summary for the doctor.
>
> The patient is free. Hospitals pay, starting with the ones that treat patients from abroad. The record ships first, under GDPR and HIPAA; the assistant's possibilities ship after certification under the EU MDR.
>
> We built this here. We need two doctors to try it, one international-patient department, one rare-disease group, and a regulatory adviser. Thank you.

---

## Pitch script: 30 seconds (about 80 words)

> Up to 15 percent of diagnoses are wrong or late, and half of us ask Google before a doctor. Both happen because the history never reaches one desk. [Name] puts it there: the patient adds every exam once, and lets a doctor in by a DNA-shaped handshake. The doctor asks, and every answer shows its source. Patients never get a diagnosis from us. Insurers never see it. Better first decisions: in Greece, diagnostic error costs about €3.5bn a year.

---

## Open questions from Marketing (in PRD section 17 as Q23 to Q27; Q28 there covers the recap post)

| # | Question | Owner |
|---|---|---|
| Q23 | Which privacy claims on slide 6 run for real in the demo (key on device, signed log) and which are simulated? The slide says only what runs. | Backend (section 10), CTO |
| Q24 | Keep the TAM/SAM/SOM dollar figures on slide 8 with assumption labels, or show only the verified doctor count and the formula (Sales' do-not-use list includes them)? | CEO, with Sales |
| Q25 | Sheba ARC's reported sale: confirm before slide 11 names it. | Sales |
| Q26 | Deck ends on the regulatory slide (MIN-4429's acceptance criterion) or on team and ask after it (the coordinator's brief)? Both versions are written. | CEO |
| Q27 | Team line and funding ask on slide 13. | Founder, through the CEO |
| Q29 | **Answered** (founder, 14 Nov, verbatim: "Route to the doctor"). Patient-side offer: log the symptom, send it to the doctor, who sees it with the full history. No interpretation, urgency score or causes; fixed 112 line only. Slide 4 updated. | Founder |
| Q30 | Greek copy: say "ιατρικές εξετάσεις" or "αποτελέσματα εξετάσεων", never "εξετάσεις" alone (Google reads it as school exams; treg Q2). | Marketing, for any Greek version |

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
| S10 | OECD, *The Economics of Diagnostic Safety*, Health Working Paper No. 176, March 2025: up to 15% of diagnoses inaccurate, delayed or wrong; diagnostic error 17.5% of health spending, about 1.8% of GDP; halving frees 8%, about USD 676bn across the OECD; 25 to 30% of investigations unnecessary, about 2.5% of spending | verified | https://doi.org/10.1787/fc61057a-en |
| S11 | Newman-Toker DE et al., BMJ Qual Saf 2024;33(2):109-120: 795,000 US serious harms a year from misdiagnosis of dangerous diseases (range 598,000 to 1,023,000) | verified (PubMed abstract) | https://doi.org/10.1136/bmjqs-2021-014130 |
| S12 | Eurostat isoc_ci_ac_i (I_IHIF), 2025: 51.1% of Greeks and 60.3% of EU27 people (16 to 74) looked for health information online in the last 3 months | verified | https://ec.europa.eu/eurostat/databrowser/view/isoc_ci_ac_i/default/table |
| S13 | Semigran HL et al., BMJ 2015;351:h3480: online symptom checkers list the right diagnosis first in 34% of cases | verified (PubMed abstract) | https://doi.org/10.1136/bmj.h3480 |
| S14 | Bean AM et al., Nature Medicine 2026;32(2):609-615: people using GPT-4o, Llama 3 or Command R+ found relevant conditions in under 34.5% of cases, no better than control; the models alone 94.9% | verified (PubMed abstract) | https://doi.org/10.1038/s41591-025-04074-y |
| S15 | Eurostat hlth_sha11_hf and hlth_sha11_hc, 2024: Greek current health expenditure €19,869M; stand-alone lab and imaging €810M (a floor) | verified | https://ec.europa.eu/eurostat/databrowser/view/hlth_sha11_hf/default/table |
| S16 | EOPYY: lab results posted digitally to one national file from 1 Nov 2026, reachable in MyHealth; limits on repeating key tests in e-prescribing (Ta Nea 2 Nov 2026; Insider.gr; Ethnos) | secondary (Greek press; the EOPYY decision itself not opened) | https://www.tanea.gr/2026/11/02/science-technology/health/eopyy-psifiaka-pleon-i-anartisi-ton-diagnostikon-eksetaseon-poies-eksairountai-prosorina/ ; `docs/research/treg-findings-2026-11-14.md` Q5 |
| S17 | JMIR Med Inform 2022;10(5):e32168, US VA/DoD Joint Longitudinal Viewer: doctors who used the shared record ordered fewer duplicate images, odds ratio 0.44 (95% CI 0.24 to 0.78) | verified (PubMed abstract) | https://doi.org/10.2196/32168 |

**Not used in v2 (pitch-numbers §5):** a count of wrong diagnoses per year for Greece or the EU (none in a primary); a euro figure for duplicate tests in Greece or the EU (none); the OECD 2017 "one fifth wasteful" line (commentary only); the Dutch 56% repeat-test figure (primary not opened); MyHealth's "1.5 million users" (vendor claim).

**Not used (Sales' do-not-use list):** any PHR or medical-tourism market size; the $42B medication-error figure; global medical-tourist head-count; OpenEvidence $15B; ChatGPT's 230M weekly health users; Epic's 42% share; Navina valuation; Heidi and Glass pricing; Eka Care, PatientsLikeMe, Clinerion and Riayati counts; Copilot Health and HealthEx; a dollar figure for duplicate tests. Also not used: every 🟡 figure from `buyers.md` (Bumrungrad's 50%, Cleveland Clinic Abu Dhabi's 35%), because none of its pages was opened.
