# Pitch deck content: Pathien

| | |
|---|---|
| **Owner** | Anna Lytica (Marketing), MIN-4429. Deck story: CEO (MIN-4425). Design: Pix (MIN-4428), next. |
| **Version** | **v3.4, 14 Nov 2026** (MIN-4462: every insurer mention removed from slides 6, 6b, 10, 11, 13 and both scripts; founder: "remove the never insurers -> not sure about this", then "Drop every insurer mention"; the internal data rule is unchanged). v3.3, 14 Nov 2026 (MIN-4503: slide 6b, the "Concept render" tag removed and the encryption point added; founder: "remove the concept render -> and mention that this device has our own encrypted software for the data so they are not in the cloud"; the eyebrow "Concept · not built" stays). v3.2, 14 Nov 2026 (MIN-4503: new slide 6b, Pathien Vault, a concept device for patients who want maximum privacy; founder: "what if someone that want's his privacy can buy our device that can hold his data. Anna and pix work on this and add one slide with a very super elegant image with our device that looks very premioum"; no other slide renumbered). v3.1, 14 Nov 2026 (MIN-4503: team and ask from the CEO plan v2, `docs/business/team-and-funding-plan.md` §7; slide 14 replaced, slide 15 new; founder: "put it in the deck when ready"). v3, 14 Nov 2026 (MIN-4503: name Pathien; new slide 11, revenue years 1 to 3, on the founder's ask "the numbers of how many money we can earn" and "Yes, update to v3"; Appendix A's SOM retired for the bottom-up line; demo slides say what is real and what is synthetic). v2, 14 Nov 2026 (MIN-4503: reframed on the founder's two points, "Dr Google" and better doctor decisions; numbers from `pitch-numbers-2026-11-14.md` and `treg-findings-2026-11-14.md`). v1, 13 Nov 2026. |
| **Event** | Gen AI Summit Hackathon, Athens LifeTech Park, Biotech & AI track |
| **Market** | Global. Founder: "Dont focus on the greek market. we need to focus on global market" |
| **Sources** | Only `docs/research/` (Sales). Each number carries a source ID from the table at the end (S1 to S22; S21 and S22, added in v3.2, are retail price anchors for slide 6b found by Marketing, not by Sales) and its status from the research: **verified**, **secondary**, or **assumption**. Nothing from the research's "Do not put on a slide" list is used. |
| **Skills** | c-level-skills:board-deck-builder, marketing-strategy-pmm, copywriting, copy-editing, content-humanizer, competitor-alternatives (v1); marketing-strategy-pmm, copywriting, copy-editing, content-humanizer, brand-review (v2); marketing-strategy-pmm, copywriting, copy-editing, content-humanizer (v3); marketing-strategy-pmm, copywriting, copy-editing, brand-review (v3.1); marketing-strategy-pmm, copywriting, copy-editing, content-humanizer, brand-review (v3.2); marketing-strategy-pmm, copywriting, copy-editing, brand-review, content-humanizer (v3.4) |

**Rules this deck keeps (check them again after any edit):**

1. The patient side never diagnoses. The words "diagnosis" or "diagnose" never describe what the app does for a patient. Only the doctor sees possibilities, and they are labelled "for the doctor to evaluate".
2. No data is sold. Possible matches are opt-in, unnamed, and can be withdrawn. Research use is "later, consent-gated", never a revenue line called data.
3. No health data on any blockchain. We say "signed log of fingerprints and access grants".
4. Insurers are not mentioned on any slide (founder, 14 Nov). Internal data rule unchanged: insurers never see records.
5. Pilot names are **targets. Nobody has been contacted.** The slide says so.
6. The product is **Pathien** (founder, 14 Nov 2026). Trademark clearance is pending, so no ™ or ® on any slide (section "Name").
7. **Revenue is never framed as earning from diagnoses.** Hospitals and clinics pay per case or per seat for the complete, cited history, which leads to better first decisions and fewer repeated tests. Words to avoid on slide 11 and in the scripts: "diagnosis revenue", "paid per diagnosis", "we earn from better diagnoses".
8. **Demo honesty.** Every product or demo screen says whether it is the working pipeline on synthetic data, or a mock-up.

**Story (v2, founder 14 Nov):** "help people get rid of their 'google is my doctor' habit" and "save the industry lots of money by helping doctors make the best decisions". Digitising paper is the means, never the headline. The national file (Greece's MyHealth) is a neighbour, not a rival: we carry what it does not hold.

**Brand note for Pix (v3):** The product is **Pathien**. Logo: the "p" is the symbol; its foot becomes a path that runs under the whole word and ends in one coral dot, where the dotless "i"'s dot would be. The path leads to the patient. Use `docs/brand/logo/pathien-lockup.svg` on light slides and `pathien-lockup-white.svg` on teal-night; never retype the wordmark (it is outlined Plus Jakarta Sans; slide type is Manrope). Colours and tokens: `docs/brand/brand-guidelines.md` and `docs/brand/tokens.css`. Coral is fill only. No red anywhere, including the revenue slide. No ™ or ® until the trademark check clears.

**Arc (16 slides + 1 backup):** story → problem → why now → product → live demo → privacy → **the Vault, a concept for maximum privacy (slide 6b, new in v3.2)** → possible matches → impact → competition → who pays → **what we can earn (new in v3)** → go-to-market → **regulatory path (the closing content slide, founder: "We need to add it at a pitching deck as something at the end")** → **team today and what I ask** → **why: four people and a research partner (new in v3.1)**. Backup: Appendix A, market sizing.

---

## Slide 1: Hook (cover)

**Headline:** Maria asks Google what her pain means. Her doctors each see one page of her history.

**Body:**
- **Pathien** · The whole history in front of the doctor, so the first decision is the right one.
- Gen AI Summit Hackathon · Biotech & AI · Athens LifeTech Park

**Visual note for Pix:** Full-bleed photo-style illustration of a worn paper folder of exams on a waiting-room chair, a phone resting on it with a search bar on screen (no real search engine logo). Synthetic person, no real face, no real document. The Pathien lockup and the one-liner small, bottom-left. No numbers on this slide.

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
1. **Photograph** an old exam. Pathien reads it: date, lab, every value with its unit and range.
2. **It must be yours.** The name and ID on the exam must match the account. Someone else's exam is refused.
3. **One timeline.** Exams and the symptom diary, in date order. Patients log symptoms; the doctor gets the full picture; no self-diagnosis.
4. **The DNA handshake.** The patient shows a helix-shaped code, the doctor scans it, the patient approves. Access runs for a set time.
5. **The doctor asks.** "When was her CRP raised?" The answer lists dates and values, each linked to the exam it came from.

Under step 5, small: Possibilities to evaluate, for the doctor only. Never shown to the patient.

Under step 5, small (new in v3, built in the demo): **Over time.** Each marker as a line across her exams, the readings outside the printed range marked, and a straight-line projection. Doctor view only, for the doctor to evaluate.

Under step 3, small: Instead of searching at night, Maria logs the symptom and taps **Send to my doctor**. Her doctor sees it with her whole history. The app does not explain it. Fixed line: "If this is an emergency, call 112."

**Visual note for Pix:** Five phone and laptop frames in a row with one-word labels (Photograph · Match · Timeline · Handshake · Ask). Step 4 carries the DNA-shaped QR. Step 5 shows a cited answer with a source chip "Blood test · 12 Mar 2026 · Uploaded by patient". Use the two provenance marks exactly: "Verified by source" and "Uploaded by patient". **Mock-up honesty:** use screenshots from the working demo (synthetic patient Maria), each with a small "Working demo · synthetic data" tag (brand `info` style). Anything drawn instead of captured carries "Mock-up" in the same tag. No frame without one of the two tags.

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

**What is real and what is not (on the slide, small, under the checklist):**
- **Working pipeline, on synthetic data:** reading the photo into values, the name and ID match, the handshake and the time limit enforced by the database, cited answers, the signed log of who looked. *(Measured on the demo: 235 of 235 fields read correctly on our synthetic test set; `docs/submission/project-details.md`, S20.)*
- **Simulated tonight:** the encryption key sits on our server, not on Maria's phone; the "verified by source" lab is our own demo lab (the signature check is real); possible matches come from a seeded synthetic set; doctor-to-doctor contact is a mock-up.

Footer: Synthetic patient. Synthetic exams. No real health data.

**Visual note for Pix:** Minimal holding slide shown while the laptop switches to the live app: the six steps as a vertical checklist, large enough to read from the back of the room, plus the footer line. A fallback version with six screenshots, in case the network fails; each screenshot tagged "Working demo · synthetic data". The real-and-simulated lines in body size, not fine print.

**Speaker notes (~20 s plus the demo):** "Let me show you, live. Everything you see runs on synthetic data." (Run the demo. If a step fails, switch to the screenshot version and narrate it; do not retry on stage.)

**Sources:** S20 (the demo's own measurements and its real and simulated list).

---

## Slide 6: Privacy by design

**Headline:** The patient holds the key. The log holds only fingerprints.

**Body:**
- **By design, the key is on the patient's phone.** Records are stored encrypted. Without the patient, nobody reads them, including us. *(Demo: the key sits on our server tonight; slide 5.)*
- **In person, for a set time.** A doctor gets in only by scanning the patient's code and getting a yes. Access ends by itself, or earlier with one tap.
- **A log nobody can edit.** Every access is written to a signed, chained log the patient can read. The log holds fingerprints of documents and access grants. No health data ever goes on a chain.
- **No diagnosis for the patient.** The patient side has no AI question box at all.

**Visual note for Pix:** Centre: the patient's phone with a key icon. Around it, four short labels. Keep it calm and plain; no padlock clip-art walls.

**Speaker notes (~30 s):** "We designed privacy in from the first line. The key lives on the patient's device. A doctor gets in only face to face, only with a yes, and only for a set time. Every access goes into a log the patient can read and nobody can edit; the log holds fingerprints, never health data. Those are product rules, not settings."

**Sources:** `PRD.md` section 7 (principles P1 to P10). Q23 answered by `docs/submission/project-details.md` (S20): the signed log, the time-limited access and the patient-side refusal run for real; the key on the phone is the design and sits on our server in the demo, so that line says "by design".

---

## Slide 6b: Pathien Vault (concept, new in v3.2)

The founder asked for it (14 Nov 2026, verbatim): *"what if someone that want's his privacy can buy our device that can hold his data. Anna and pix work on this and add one slide with a very super elegant image with our device that looks very premioum"*. It sits right after slide 6 because it is the furthest point of the same promise: the patient holds the key, and here the patient holds the record too.

**Label (eyebrow, same size as the headline eyebrow on every slide):** Concept · not built

**Headline:** Pathien Vault. The whole record, on a device the patient owns.

**Body (39 words):** For patients who want maximum privacy. A small device, bought once, holds the full record and every original, encrypted, at home or on a keyring. The phone opens it. A doctor gets in by the same code, for a set time.

**Three points:**
- **Our own encryption, on the device.** Pathien's software encrypts every record on the Vault itself. Nothing goes to the cloud unless the patient turns on an encrypted backup.
- **Same product, same rules.** It stores and shares. It never interprets, so it never diagnoses.
- **Bought once, backup optional.** About €249 for the device *(assumption)*, plus an optional encrypted-backup subscription.

**Footer, required:** Concept, not built. Price is our assumption, anchored to hardware wallets (about €100 to €150) and personal storage boxes (about €300 to €400). An option for privacy-first patients; the core business is unchanged.

**Visual note for Pix:** One object, alone, as a premium product shot. The exact form is yours; this note is about mood and composition only.
- **Mood:** quiet, expensive, calm. Think of the way a good watch or a pair of earbuds is shot, not a gadget ad. Nothing medical, nothing "cyber".
- **Composition:** the device slightly off-centre on a single natural surface (stone, linen or warm wood), soft daylight from one side, one long gentle shadow, plenty of empty space. Headline and points on the empty side.
- **Colour:** teal-night background or the brand's warm light neutral (`docs/brand/tokens.css`). Coral appears once, if at all, as a small detail that echoes the dot at the end of the logo's path (a status light, a pull tab), never as a large fill.
- **Optional second, smaller frame:** the same device on a keyring next to a phone, to show the size. Only if it does not crowd the hero.
- **Never:** padlocks, shields, circuit boards, glowing blue data streams, floating holograms, hands in gloves, real people's faces, any medical cross. No ™ or ®.
- **Honesty (rule 8):** no "Concept render" tag on the image (founder, v3.3). The eyebrow "Concept · not built" and the footer carry the label.
- The Pathien lockup top-left as on every slide; "Vault" is set in Manrope next to it, never drawn into the wordmark.

**Speaker notes (~20 s):** "Some people will not want their record on anyone's server, ours included. For them we are designing Pathien Vault: a small device they buy once, holding the whole record at home. The doctor still gets in by the code, for a set time. Pathien's own encryption runs on the device, so nothing sits in the cloud. It is a concept, not built yet, and an option, not the business."

**Behind the slide (for questions, not on the slide): the trade-offs.**
1. **Losing the device.** Without a backup, a lost or broken Vault means a lost record. Answer: a recovery key printed at setup, and the optional encrypted backup. Both add steps that privacy-first buyers may skip.
2. **Backup and recovery.** The backup holds only encrypted data we cannot read, so we cannot recover a record if the patient also loses the recovery key. That must be said at purchase, plainly.
3. **The doctor's access when the Vault is at home.** If the patient is at the clinic and the Vault is at home, the doctor's session needs either an encrypted copy on the phone or a connection to the Vault, which makes the Vault a small server the patient runs, with updates and security to keep. Offline, a doctor sees only what the phone carries.
4. **The doctor's questions need computing.** Cited answers ("Has her CRP been raised before?") run a language model. Either it runs on the device (slower, smaller), or the data passes through our servers for the session and is never stored. The slide says "store", not "process", for this reason. Backend and the CTO decide (Q33).
5. **Possible matches (slide 7).** A Vault user joins the network only by sending an unnamed pattern, opt-in, as today. Without it, matches are off.
6. **Cost.** Hardware means a bill of materials, stock, shipping, returns, repairs and support. It ties up cash a software company does not. At €249 the margin is unknown until a manufacturer quotes.
7. **Certification.** A radio device sold in the EU needs CE marking under the Radio Equipment Directive (with EMC, electrical safety, RoHS and WEEE rules). It is not a medical device under the MDR as long as it only stores and shares; if it ever interpreted data it would become one, so it must not. GDPR still applies to any backup and to the app.
8. **Firmware and supply chain.** A device that holds health records must get signed updates for years, and its chips and factory must be trusted. A security flaw found after sale needs a recall plan.
9. **Name.** "Pathien Vault" is a descriptive name under Pathien, whose trademark clearance is still pending (Q32). No ™.

**Price, as an assumption.** About **€249 once** for the device, plus an optional encrypted-backup subscription at a price we have not set. Anchors (secondary, retail listings, Nov 2026): a hardware wallet that holds only keys sells for about $99 to $149 (Ledger Nano X); a two-bay personal storage box sells for about €300 to €415 without disks (Synology DS224+). The Vault holds more than a key and less than a home server, so it sits between them. No revenue line: this is an option for a privacy-first segment, not part of slide 11.

**Sources:** S21 (Ledger Nano X retail prices, secondary); S22 (Synology DS224+ retail prices, secondary). Founder's words above. Rules 1, 3 and 8 kept: no diagnosis, nothing on a chain, the concept labelled.

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

Footer, small: Demo: possible matches come from a seeded synthetic set; doctor-to-doctor contact is a mock-up.

**Sources:** S3 (verified). Founder brief, flag 4. Demo status: S20.

---

## Slide 8: Impact, what better decisions save

**Headline:** Wrong diagnoses cost 17.5% of health spending. Better first decisions are the biggest saving in healthcare.

**Body:**
- **17.5%** of health spending in a typical OECD country goes on the harm of diagnostic error, about **1.8% of GDP**. Halving it would free **8%**, about **USD 676 billion** a year across OECD countries. *(OECD, 2025, S10)*
- **25 to 30%** of medical tests are unnecessary, about **2.5%** of health spending. *(OECD, 2025, S10)*
- **Worked example, Greece** *(our estimate)*:
  - The whole prize: about **€3.5 billion a year** of the €19.9 billion Greece spends on health is the cost of diagnostic error. *(S10 × S15)*
  - Our first slice, unnecessary and repeated tests only: **about €4M a year (conservative) to about €75M a year (upside)**, depending on how many patients bring their record. *(our estimate, S10, S15, S17)*

**One line on who pays:** Hospitals and clinics pay per case or per seat; the patient is free. What that could earn, and how it compares with these savings: slide 11.

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
| **Patient-held, every provider and border** | **Pathien** | Old paper to one history; doctor-only assistant with sources; in-person handshake | Not yet certified for decision support (slide 13) |

**Visual note for Pix:** A 2x2 map. Pathien alone in the top-right, in the accent colour. Epic bottom-left, national apps left-middle, ChatGPT Health right-middle. OpenEvidence as a small callout outside the frame: "answers from literature". Add a thin tag on each logo: "AI talks to: patient" (ChatGPT Health, Emmie) or "AI talks to: doctor" (Epic Art, OpenEvidence, Pathien). Use names in text, not logos, unless Design has usage rights.

**Speaker notes (~30 s):** "Epic summarises what is inside one hospital. National apps like MyHealth hold public lab results inside one country, and we complement them. ChatGPT Health and symptom checkers talk to the patient, from whatever the patient types in. OpenEvidence answers doctors from the literature, not from this patient. We sit where none of them sits: the record the patient carries across every provider and border, with an assistant that answers only the doctor, and shows its source."

**Sources:** S8 (`market-and-competitors.md` §2, company pages); MyHealth and EOPYY: S16 (secondary); chatbot accuracy: S14 (verified). No competitor numbers are used: Epic's market share, ChatGPT's user count and OpenEvidence's valuation are on Sales' do-not-use list. Avoid "the only" and "the first" in speech: the research found no proof either way.

---

## Slide 10: Business model, who pays

**Headline:** The patient never pays. Hospitals pay for a better first decision and fewer repeated tests.

**Body:**

| When | Who pays | For what | Model (to test in pilots) |
|---|---|---|---|
| Year 1 | Medical-tourism hospitals and international-patient departments | A consented, translated history that arrives before the patient does | Per-case fee |
| Year 1 | Multi-specialty clinic chains and telehealth platforms | The doctor sees the whole history at the first visit | Per-doctor seat |
| Year 1 | Rare-disease networks | A pilot where possible matches matter most | Free pilot, grant-funded |
| Year 1 | Lab networks | Results the patient carries, marked "Verified by source" | Partnership |
| Year 2+ | National health-data agencies | A patient-held layer next to the national record | Tender, sandbox |

Footer: Models are hypotheses for pilots to test. Prices and volumes on slide 11 are assumptions.

**Visual note for Pix:** Simple table. The first row gets the accent: it is the wedge.

**Speaker notes (~25 s):** "The patient is free. The first buyer is the hospital that treats patients from abroad: their records arrive in other languages, on paper, or not at all, and the hospital already asks for them before the trip. Clinic chains pay per doctor seat. Rare-disease networks are our free pilots. Later, national agencies. Research use, if ever, is opt-in and never a data sale."

**Sources:** `buyers.md` §1 and §5. Grants for rare-disease pilots and tenders with national agencies are not counted as revenue on slide 11.

---

## Slide 11: What we can earn (new in v3)

The founder asked for it on the main deck (14 Nov 2026): *"let's see the pitching decks. Are they up to date with the new results from Annas research and the numbers of how many money we can earn based on good diagnoses?"*, then *"Yes, update to v3"*. That settles Q24 for revenue: the revenue line goes on the main deck.

**Headline:** Hospitals pay per case and per doctor seat. The health system saves many times what they pay.

**Body: bottom-up, years 1 to 3, our estimate.** Year 1 starts with the first paid pilot. Every input is **cases or seats × price**. Labels sit next to the number, same size.

| Revenue line | Input | Conservative | Upside | Label |
|---|---|---|---|---|
| **A. Per case**, international-patient departments | Paying hospitals, year 1 / 2 / 3 | 1 / 3 / 8 | 2 / 6 / 15 | assumption |
| | Paid cases per hospital a year (year 1 is half a year, after a free pilot) | 500 / 1,000 / 1,000 | 1,500 / 3,000 / 3,000 | assumption |
| | Price per case | €40 | €80 | assumption (no published price exists) |
| **B. Per seat**, clinic chains and telehealth | Paid doctor seats, year 1 / 2 / 3 (year 1 is half a year) | 20 / 100 / 400 | 60 / 400 / 2,000 | assumption |
| | Price per seat | €50 a month (€600 a year) | €50 a month (€600 a year) | assumption, set at 40% of Tandem Pro's published €125 a month (S18) |
| **C. Labs**, integration fee | New lab integrations, year 1 / 2 / 3 | 0 / 0 / 0 | 0 / 1 / 2 | assumption |
| | Fee per integration, one-off | n/a | €25,000 | assumption |

| Revenue a year | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| A. Per case, conservative | €20k | €120k | €320k |
| B. Per seat, conservative | €6k | €60k | €240k |
| C. Labs, conservative | €0 | €0 | €0 |
| **Conservative total** | **€26k** | **€180k** | **€560k** |
| A. Per case, upside | €240k | €1,440k | €3,600k |
| B. Per seat, upside | €18k | €240k | €1,200k |
| C. Labs, upside | €0 | €25k | €50k |
| **Upside total** | **€258k** | **€1,705k** | **€4,850k** |

**"A fraction of what they save", the arithmetic** *(our estimate, shown small on the slide)*: slide 8 says better records could save **€4M (conservative) to €75M (upside) a year on tests, in Greece alone**. Our year-3 revenue from every customer in every country is **€0.56M to €4.85M**: about **14%** of the conservative saving and about **6%** of the upside one. Savings outside Greece and the savings on diagnostic error itself are not counted, so the real ratio is smaller.

Not counted: rare-disease pilots (free, grant-funded), national agencies (tenders, year 2+), research use (later, consent-gated, never a data sale).

Footer, required: Our estimate. Every price, customer count and volume is an assumption for the pilots to test. Not a forecast. We never earn from a diagnosis: Pathien never makes one.

**Visual note for Pix:** Two grouped bars per year (conservative, upside), each stacked by line A, B and C; the year-3 totals (€0.56M and €4.85M) as the only big numbers. Line A carries the accent: it is the wedge from slide 10. The words "our estimate" and "assumption" on the chart in the same size as the numbers. Bottom strip: the slide 8 funnel's last step ("tests, Greece: €4M to €75M a year") next to "our year-3 revenue: €0.56M to €4.85M", with "about 6 to 14%" between them. No market circles, no red, no currency other than euros. The input table goes in the speaker's backup, not on the slide face.

**Speaker notes (~30 s):** "How do we earn? Not from diagnoses: we never make one. Hospitals pay for the complete history in front of their doctors. An international-patient department pays per case; a clinic chain pays per doctor seat. On our assumptions, year three is between about half a million and five million euros. Compare that with slide 8: better records could save four to seventy-five million a year on tests, in Greece alone. Our customers pay a small share of what the system saves. Every price here is an assumption, and the pilots exist to test it."

For questions (do not read out):
- *Why €40 to €80 a case?* No one publishes a price for a consented, translated record packet. We ask buyers for their figure first (`treg-findings-2026-11-14.md` Q6, question 5: ask for a monthly figure, do not suggest one).
- *Why €50 a seat?* Below paid AI scribes (Tandem Pro lists €125 a month, S18), above the free tools (OpenEvidence and Glass are free to US clinicians, S8). Same assumption Appendix A used in dollars.
- *Is 45,000 cases a lot?* Turkey alone welcomed about 1.5M health tourists in 2024 (S19, secondary). 45,000 cases is about 3% of one country's year.
- *Who saves, who pays?* Not always the same desk. The payer or the patient saves on repeated tests; the international-patient department pays for a faster first visit and patients who arrive ready. The pilot measures both.

**Sources:** S10 and S15 via slide 8 (verified inputs, our estimate); S18 (company pricing page, via `market-and-competitors.md` §2); S19 (secondary); S8; `buyers.md` §1.1, §1.2, §1.4, §1.7 and §5 (models, no prices). **Sales' do-not-use list:** it names "our TAM, SAM and SOM themselves, until the $600 seat price and 1% share are validated". The 1% share is dropped. A seat price has to appear because the founder asked what we can earn; it stays at €50 a month, carries the word "assumption" at the same size, and is anchored to a published list price (S18), not to market share. Bumrungrad's international-patient count (🟡 in `buyers.md`) is not used.

---

## Slide 12: Go-to-market

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

## Slide 13: Regulatory path (closing content slide)

**Headline:** The record ships first. The assistant ships certified. A plan, not a risk.

**Body (three steps):**

| Step | What ships | What applies |
|---|---|---|
| **1. The record** | Photo to history, identity match, handshake, cited search, symptom diary | **GDPR** (EU) and **HIPAA** (US): health data, explicit consent, impact assessment. Software that only stores, retrieves and shares is generally not a medical device. |
| **2. The network** | Opt-in possible matches, doctor-to-doctor contact | **GDPR** explicit consent. **EHDS** gives the lawful route for research use. Our rule is stricter: opt-in only. |
| **3. Decision support** | "Possibilities for the doctor to evaluate" | **EU MDR**: medical-device software, certified with a notified body. **EU AI Act**: high-risk obligations follow. **US FDA**: clinical decision-support guidance. |

Footer: Every step keeps the same rules: no diagnosis to patients, no health data on a chain.

**Visual note for Pix:** Three ascending steps, left to right, each with its "ships" line and its law badges (GDPR, HIPAA, EHDS, MDR, AI Act, FDA). Step 3 carries a small "certification" seal outline. Calm, confident; not a warning slide, no red.

**Speaker notes (~30 s):** "We know where the line is. Suggesting possible causes makes software a medical device in Europe, so we sequence. First the record: it stores, finds and shares, under GDPR and HIPAA. Then the opt-in network, with the EHDS as the legal route for research. Then the doctor's assistant, certified under the MDR, with the AI Act's high-risk rules. Today's demo uses only synthetic data. That is our plan, and it is the reason a hospital can say yes to step one now."

**Sources:** `PRD.md` section 8 (Product's summary, **not legal advice**); EHDS: S4 (verified); AI Act timing and FDA guidance: S9 (secondary). The MDR class (Rule 11, class IIa or higher) and the exact line between retrieval and decision support are **not** on the slide: they wait for Sales' check and a regulatory adviser (PRD Q18). No dates for the AI Act on the slide (sources conflict).

---

## Slide 14: Team today, and what I ask (new in v3.1)

From the CEO plan v2 (`docs/business/team-and-funding-plan.md` §7), on the founder's words (14 Nov 2026): *"Just me Lefteris Georgaras (founder of onedotatatime.design studio)"*; *"Team today / What I ask -> the result of the exercise / Why -> say about the team and the marketing / sales spends / Where the money comes from -> no / We need to add at the team one ML engineer and a colab with a UNI / research center"*; then *"put it in the deck when ready"*. No slide says where the money comes from. These are recommended words: the founder approves public copy and the amount.

**Headline:** Built by one founder and AI agents. Next: €600k, released by a hospital pilot.

**Body (59 words):**
**Team today.** Lefteris Georgaras, founder, onedotatatime.design, working with AI agents. Research partner: a Greek university hospital and an AI research centre (targets, not yet contacted).
**What I ask.** €600k over 18 months (our plan), in two tranches, each released by a gate below. It buys a real pipeline on consented records, a hospital pilot, and the first paying hospital.

**Table, the gates:**

| Gate, before any money | Tranche | What it buys |
|---|---|---|
| A hospital agrees a pilot in writing | €200k | Months 1 to 6: consent and data-protection review, the real pipeline, the pilot running |
| The pilot proves three numbers: the buyer names €40 a case or more; 1,000 cases a year or more; €5 cost per case or less | €400k | Months 7 to 18: the first paying hospital, a second hospital, the certification proposal |

**Footer, required:** Our plan, not a raise in progress. Nothing is raised and nobody is hired before a hospital agrees a pilot in writing. EU MDR certification is the next round.

**Visual note for Pix:** Left: the founder, plus a small "AI agents" mark, plus one outlined "research partner" tile marked "target, not contacted". Right: the two gates as two steps, the money on each step. No stock faces. No red. The Pathien lockup top-left, as on every slide; the founder photo used in house templates where it exists.

**Speaker notes (~20 s):** "Today it is me, and a team of AI agents that built this with me this weekend. What I ask is six hundred thousand euros over eighteen months, in two parts. The first two hundred thousand comes only when a hospital signs a pilot. The other four hundred only when that pilot proves the price, the volume and the cost of each case."

**Sources:** `docs/business/team-and-funding-plan.md` §3 (the ask, tranches, milestones) and §5 (the three numbers). All amounts are our plan; the three numbers match slide 11's assumptions (€40 a case) and the plan's €5 cost-per-case target (§5).

---

## Slide 15: Why: four people and a research partner (new in v3.1)

**Headline:** Why €600k: four people, a research partner, and 28% for selling.

**Body (37 words):**
Four hires and one research partner. Two build, two sell, and the partner checks the work with clinicians. Selling gets 28% of the money: business development, marketing, pilots and travel. Nobody is hired before a hospital signs.

**Table 1, the team:**

| Who | Why | Cost a month* |
|---|---|---|
| Engineer | Builds the real pipeline: scan, store, keep the originals, with consent | €5.3k |
| ML engineer | Makes the reading accurate (target: 98%) and cheap (target: €5 a case); cited answers for doctors | €5.8k |
| Business development | Turns one pilot into the first paying hospital | €5.1k |
| Marketing | Brings patients in through the hospital; part-time first | €1.8k, then €3.7k |
| Research partner (target, not contacted) | Clinical validation and an ethics-approved test set | €2.9k |

**Table 2, where the €600k goes:**

| Sell: marketing and sales | Build: product and AI | Prove: clinical, regulatory, legal | Buffer |
|---|---|---|---|
| **28% · €168k** | 38% · €226k | 20% · €120k | 14% · €86k |

**Footer, required:** \* Our plan. Every cost is an assumption at Athens rates, with employer contributions. Sell = business development €86.7k + marketing €45.7k + pilots and go-to-market €36.0k. Research partner: months 4 to 15.

**Contact line** (bottom of the slide, unchanged from v3): `hello@onedotatatime.design` · **healthapp-landing.pages.dev** (live). The brand domain pathien.health is chosen but not registered (brand check, 14 Nov); it goes on the slide only once it resolves.

**Visual note for Pix:** Table 2 as one horizontal bar in four parts; "Sell" carries the one accent. "Assumption" and "our plan" at the same size as the numbers. No red. The DNA-shaped QR in a corner, pointing to https://healthapp-landing.pages.dev (live; the founder approves the link before print), as in v3.

**Speaker notes (~20 s):** "Why this amount. Four people: an engineer and an ML engineer to build it and make the reading accurate and cheap, business development and marketing to sell it. Twenty-eight percent goes to selling. A university hospital, a target we have not contacted yet, would check the work with clinicians. And today: if you know a hospital that treats patients from abroad, or a doctor who would try the doctor view, come and find me. Thank you."

**Sources:** `docs/business/team-and-funding-plan.md` §2 (the team, monthly costs), §2b (the research partner: NKUA Medical School with Attikon University General Hospital, and the Athena Research Center, named in the plan as targets only, not on the slide), §3 (use of funds by function). Not on any slide: funding sources (plan §4, founder: "Where the money comes from -> no"); v1's non-money asks (a clinical champion pair, introductions, a regulatory adviser), now one sentence in slide 15's speaker notes.

---

## Appendix A: Market sizing (backup slide, shown only if asked)

Moved here from slide 8 in v2. **v3:** the founder asked for the revenue line on the main deck (slide 11), which settles Q24 for revenue. This appendix keeps only the ceiling (TAM, SAM) for questions; the SOM is retired.

**Headline:** Every doctor who sees a new patient is a seat: about $1.9B a year in the US, EU and India, on our assumptions.

**Body (bottom-up, the doctor pays, the patient is free):**

| | Doctors | At an assumed price | Per year |
|---|---|---|---|
| United States | 905,452 direct-care physicians *(AAMC 2025, S6, verified)* | $600 per seat *(assumption)* | $543M |
| European Union | about 1.98M practising physicians *(Eurostat 2023, S7, secondary)* | $600 per seat *(assumption)* | $1,188M |
| India | 1,386,157 registered doctors *(NMC via Parliament, S7, secondary)* | $120 per seat *(assumption)* | $166M |
| **SAM** | | | **about $1.9B** |

- **TAM about $8.5B a year:** about 14.1M doctors worldwide at $600. *(Derived from a secondary density figure, S7; a ceiling, not a forecast.)*
- **SOM retired in v3.** The old line (about $19M a year by year 3, 1% of SAM seats, about 42,700 paying doctors, assumption) is replaced by slide 11's bottom-up line: **€0.56M to €4.85M in year 3** (our estimate), with 400 to 2,000 paying seats plus 8,000 to 45,000 paid cases. One revenue story: slide 11. This slide only says how big the ceiling is.

Footer, required: The seat price is an assumption to be tested in pilots. A ceiling, not a forecast.

**Visual note for Pix:** Two nested circles (TAM, SAM; no SOM circle in v3) with the dollar figure in each and the word "assumption" visibly attached to each. The US doctor count is the one verified number: give it weight. Small table beside the circles. No analyst market-size figures.

**Speaker notes (~30 s):** "We size the paying side only: doctors. The US alone has about 905,000 physicians in direct care. At an assumed fifty dollars a seat a month, which sits under paid AI scribes and above the free tools, the US, the EU and India are about a 1.9 billion dollar a year market. That is the ceiling, not our plan. Our plan is on slide 11: two thousand seats at most by year three, plus per-case fees. These are our assumptions, and the pilots exist to test the price."

**Sources:** S6 (verified), S7 (secondary; derived and assumption labels per `market-and-competitors.md` §1.2). **Note:** Sales lists "our TAM, SAM and SOM themselves, until the $600 seat price and 1% share are validated" under "Do not put on a slide". This slide shows them only because the brief asks for TAM/SAM/SOM, and every dollar figure carries its assumption label on the slide itself. If the CEO prefers, cut the dollar figures and keep the verified doctor count plus the model's formula (PRD Q24).

---

## Name

**Pathien**, chosen by the founder on 14 Nov 2026 ("Yes, Pathien"). Brand domain pathien.health, chosen, not registered yet. Live page today: https://healthapp-landing.pages.dev.

- **Trademark: clearance pending.** TMview shows no "PATHIEN" mark in EUIPO, USPTO, UK or Greece, but TMview is not an official register; an attorney clears it before launch. Close US names exist (PATHIZE pending in classes 9 and 42; PATHIAN; PATHEN MEDICAL). No ™ or ® on any slide. *(`docs/brand/brand-check-pathien.md`)*
- **Say it clearly on stage:** the word is one letter from "patient", and people will type "patient". Spell it once in the close: "P-A-T-H-I-E-N".
- **India note:** "Pathien" is the word for God in Hmar (Northeast India). Not offensive, but sacred. India is market 3 on slide 12; check before any India launch.
- **Logo:** the p's path leads to the dot (brand note at the top; `docs/brand/brand-guidelines.md` §9).

The v2 name proposals (Anamna, Strand, Histra) are retired; their reasoning stays in `docs/brand/naming.md`.

---

## Pitch script: 3 minutes (about 470 words, with the demo inside)

> Maria has knee pain and swollen joints. At night she types her symptoms into a search bar. By day she sees an orthopaedist and a rheumatologist. Her blood tests, her MRI report and two letters are scattered: paper, an app, a private lab. Each doctor sees the page she remembered to bring.
>
> This is normal. The OECD says up to 15 percent of diagnoses are inaccurate, delayed or wrong. In the US, 795,000 people a year die or are disabled by a missed dangerous disease. And half of Greeks look up their health online, where symptom checkers get it right first time about a third of the time.
>
> AI is not the missing piece. In a Nature Medicine study this year, the models alone named the right condition 95 percent of the time. People using them: under 35. What was missing was the patient's history.
>
> Pathien puts the whole history in front of the doctor. Let me show you. Everything you see is the working demo, on a synthetic patient.
>
> *(Demo, about 60 seconds.)* Maria photographs a blood test: date, lab, every value with its range. She tries to add her husband's exam: refused, not her name. At the orthopaedist she shows this DNA code, he scans, she approves, and a timer starts. He asks: "Has her CRP been raised before?" Dates, values, and each one links to the exam it came from. He asks for possibilities, and the assistant puts the orthopaedic and the rheumatology findings side by side, each with its source, for the doctor to evaluate. Time ends, his screen closes, and Maria sees who looked.
>
> Two rules hold everywhere. The patient holds the key. The patient never gets a diagnosis from us.
>
> Why it matters: the OECD puts the cost of diagnostic error at 17.5 percent of health spending. In Greece that is about three and a half billion euros a year. We start with the smallest slice, repeated and unnecessary tests: on our estimate, 4 to 75 million euros a year in Greece alone, depending on adoption.
>
> Since this month, Greece puts public lab results in MyHealth and limits repeat tests. We carry what it does not hold: private tests, imaging, old paper, records from abroad.
>
> The patient is free. Hospitals pay per case, starting with the ones that treat patients from abroad, and clinic chains pay per doctor seat. On our assumptions, that is half a million to five million euros a year by year three, a small share of what better records save. We never earn from a diagnosis; we never make one. The record ships first, under GDPR and HIPAA; the assistant's possibilities ship after certification under the EU MDR.
>
> I am Lefteris Georgaras, founder of onedotatatime.design. I built this here with AI agents. I ask for six hundred thousand euros over eighteen months, released only when a hospital signs a pilot. Pathien: P-A-T-H-I-E-N. Thank you.

---

## Pitch script: 30 seconds (about 90 words)

> Up to 15 percent of diagnoses are wrong or late, and half of us ask Google before a doctor. Both happen because the history never reaches one desk. Pathien puts it there: the patient adds every exam once, and lets a doctor in by a DNA-shaped handshake. The doctor asks, and every answer shows its source. Patients never get a diagnosis from us. Hospitals pay per case or per seat, a small share of what better first decisions save: in Greece, diagnostic error costs about €3.5bn a year.

---

## Open questions from Marketing (in PRD section 17 as Q23 to Q27; Q28 there covers the recap post; Q31 and Q32 new in v3; Q33 and Q34 new in v3.2)

| # | Question | Owner |
|---|---|---|
| Q23 | **Answered** by `docs/submission/project-details.md` (S20): signed log and time-limited access run for real; the key sits on our server in the demo. Slides 5 and 6 updated. | Backend, CTO |
| Q24 | **Answered for revenue** (founder, 14 Nov, verbatim: "the numbers of how many money we can earn based on good diagnoses?", then "Yes, update to v3"). The revenue line is on the main deck (slide 11), framed per case and per seat, never per diagnosis. SOM retired; TAM and SAM stay in Appendix A as a ceiling, for questions only. Open: whether Appendix A is shown at all. | Founder (revenue); CEO, with Sales (Appendix A) |
| Q25 | Sheba ARC's reported sale: confirm before slide 12 names it. | Sales |
| Q26 | **Answered in v3.1** by the CEO plan v2 and the founder's "put it in the deck when ready": slide 13 stays the closing content slide; team and ask follow as slides 14 and 15. | CEO, founder |
| Q27 | **Answered in v3.1** (founder, 14 Nov: "Just me Lefteris Georgaras (founder of onedotatatime.design studio)"; CEO plan v2: €600k over 18 months, two tranches). Open: the founder approves the amount and the public wording before the pitch. | Founder, through the CEO |
| Q29 | **Answered** (founder, 14 Nov, verbatim: "Route to the doctor"). Patient-side offer: log the symptom, send it to the doctor, who sees it with the full history. No interpretation, urgency score or causes; fixed 112 line only. Slide 4 updated. | Founder |
| Q30 | Greek copy: say "ιατρικές εξετάσεις" or "αποτελέσματα εξετάσεων", never "εξετάσεις" alone (Google reads it as school exams; treg Q2). | Marketing, for any Greek version |
| Q31 | Slide 11's prices (€40 to €80 a case, €50 a seat a month) and volumes are assumptions. Ask the first buyers for their own figure (treg Q6, question 5) and replace them. | Sales, Founder at LifeTech Park |
| Q32 | Trademark clearance for Pathien before any printed or public use beyond the hackathon; the Hmar meaning before any India launch. | Founder, attorney |
| Q33 | Pathien Vault (slide 6b): where the doctor's cited questions run when the record lives on the Vault (on the device, or passed through our servers for the session and never stored), and how a doctor reaches a Vault left at home. The slide says "store", not "process", until this is decided. | Backend, CTO |
| Q34 | Pathien Vault price: €249 is an assumption between a hardware wallet and a personal storage box. Founder approves it, and whether the slide is shown at all, before the pitch. | Founder |

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
| S18 | Tandem Health pricing page: Tandem Pro €125 per user a month (a rival page says €109). A scribe, so a ceiling for a seat price, not a like-for-like price | company page, via `market-and-competitors.md` §2 | https://tandemhealth.ai/pricing |
| S19 | Turkey health tourists, 2024: about 1.5M and about $3B (official USHAS figures, via a city health-tourism page) | secondary | https://health.istanbul.com/medical-tourism-stats ; `market-and-competitors.md` §1.4 |
| S20 | The working demo's own record: what is real and what is simulated; measured results (235 of 235 fields read on the synthetic set) | internal, measured on staging | `docs/submission/project-details.md` |
| S21 | Ledger Nano X retail prices, a hardware wallet that holds keys only: about $99 to $149 (official-site figure via a Finder review; Best Buy list $99; a ryder.id review "what 149 dollars buys") | secondary (retail, prices vary by region and promotion) | https://www.finder.com.au/cryptocurrency/wallets/ledger-nano-x ; https://www.bestbuy.com/site/6550420.p ; https://ryder.id/blogs/post/ledger-nano-x-review-what-149-dollars-buys-and-what-it-asks-you-to-trust |
| S22 | Synology DS224+ retail prices, a two-bay personal storage box without disks: about $300 at launch (2023), £299 UK, €309 to €415 in EU shops | secondary (retail, dated 2023 to 2026) | https://pricespy.co.uk/computers-accessories/storage-media/nas-servers/synology-ds224+--p11777573 ; https://aio.lv/en/product--synology-ds224--10598969.md ; https://www.storagereview.com/de/review/synology-ds224-review |

**Not used in v2 (pitch-numbers §5):** a count of wrong diagnoses per year for Greece or the EU (none in a primary); a euro figure for duplicate tests in Greece or the EU (none); the OECD 2017 "one fifth wasteful" line (commentary only); the Dutch 56% repeat-test figure (primary not opened); MyHealth's "1.5 million users" (vendor claim).

**Research since v2:** `git log origin/staging -- docs/research` shows no change after the v2 commit (7b2cb41, 14 Nov 18:13). No new verified number to add; nothing in v2 found wrong. v3 adds three sources (S18 to S20) already in the research or the submission docs.

**Not used in v3:** any published per-case price for a record packet (none exists); Bumrungrad's about 550,000 international outpatients (🟡, page not opened); Heidi and Glass pricing; the 1% share behind the old SOM.

**Not used (Sales' do-not-use list):** any PHR or medical-tourism market size; the $42B medication-error figure; global medical-tourist head-count; OpenEvidence $15B; ChatGPT's 230M weekly health users; Epic's 42% share; Navina valuation; Heidi and Glass pricing; Eka Care, PatientsLikeMe, Clinerion and Riayati counts; Copilot Health and HealthEx; a dollar figure for duplicate tests. Also not used: every 🟡 figure from `buyers.md` (Bumrungrad's 50%, Cleveland Clinic Abu Dhabi's 35%), because none of its pages was opened.
