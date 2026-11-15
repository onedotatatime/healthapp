// Appendix detail slides A1 to A9 (except A7, which has its own layout in slides.ts).
// Text copied from docs/deck/deck-content.md (v4.3) appendix; production notes (visual notes, contents lists) left out.
// Column text is a small markdown subset: **bold**, *label*, - and 1. lists, | tables |, and a lone **bold line** as a sub-heading.
import type { DetailSlide } from './types';

export const detailSlides: DetailSlide[] = [
  {
    id: "A1", counter: "A1", template: 'detail', theme: 'air', no: "Appendix A1", kicker: "Numbers and sources",
    headline: "The problem and why now, numbers and sources",
    back: [{"to": "2", "label": "Back to slide 2"}, {"to": "3", "label": "Back to slide 3"}],
    grid: "1fr 1fr",
    fs: 22,
    notes: ["Appendix slide. Shown when asked, or when a main slide's \"Details\" link is clicked. Not in the 3-minute script. The \"Back\" link returns to the main slide."],
    columns: [
      `**1. Slide 2, in full:**
- **Up to 15%** of diagnoses are inaccurate, delayed or wrong. *(OECD, 2025, S10)*
- **795,000** people a year in the US die or are permanently disabled because a dangerous disease was misdiagnosed. *(Newman-Toker et al., BMJ Qual Saf, 2024, S11)*
- **51%** of Greeks look up their health online. Symptom checkers put the right diagnosis first only **34%** of the time. *(Eurostat, 2025, S12; Semigran et al., BMJ, 2015, S13)*

**2. Cut from slide 2:** removed the four chips (Orthopaedist, Rheumatologist, Private lab, Search history) and the closing line; they stay out. EU 60.3% look up their health online (S12, verified). Removed from v1 for space: WHO 5 to 20% (S1) and the US portals line (S2), both still true and still in the sources table; EURORDIS 4.7 years stays on slide 6.

**4. Timeline (visual note):** Mar 2025 EHDS in force → Nov 2026 EOPYY repeat-test limits → 2029 patient summaries → 2031 labs and images.`,
      `**3. Slide 3, the full headline and body:**

Headline: AI already knows the medicine. What it lacks is the patient's history, and the state is now forcing doctors to find it.

- **AI is not the missing piece. The record is.** Language models alone named the right condition in **94.9%** of cases. People using the same models found it in fewer than **34.5%**, no better than searching on their own. What was missing was the patient's information. *(Bean et al., Nature Medicine, 2026, S14)*
- **Repeat tests are being cut.** Since 1 November 2026, Greece's EOPYY posts lab results to one national file (MyHealth) and caps how often key tests can be repeated. A doctor who cannot re-order a test needs the earlier result in hand. *(Greek press, Nov 2026, S16)*
- **Europe opens the record to the patient.** The EHDS is in force since March 2025: patients can add their own data, restrict access and see who looked. Patient summaries join in **2029**; lab results, images and discharge reports in **2031**. *(European Commission, S4)*
- **AI reads documents.** A phone photo of a lab report becomes dates, values, units and ranges in seconds. *(Shown live in the demo, A2.)*

**Sources:** S10 (verified), S11 (verified), S12 (verified), S13 (verified), S14 (verified), S16 (secondary: Greek press, the EOPYY decision itself not opened), S4 (verified). The US line from v1 (S5, secondary) is cut.`,
    ],
  },
  {
    id: "A2", counter: "A2a", template: 'detail', theme: 'air', no: "Appendix A2a", kicker: "Product and live demo",
    headline: "Product, live demo, privacy and possible matches, detail",
    back: [{"to": "4", "label": "Back to slide 4"}, {"to": "5", "label": "Back to slide 5"}, {"to": "5b", "label": "Back to slide 5b"}, {"to": "6", "label": "Back to slide 6"}],
    grid: "1fr 1fr",
    notes: ["Appendix slide. Shown when asked, or when a main slide's \"Details\" link is clicked. Not in the 3-minute script. The \"Back\" link returns to the main slide.", "Live demo, speaker notes (about 20 s plus the demo): \"Let me show you, live. Everything you see runs on synthetic data.\"", "Run the demo, about 60 seconds, as listed here. If a step fails, switch to the fallback screenshots and narrate them; do not retry on stage."],
    columns: [
      `**1. Product (slide 4), the full headline and step texts:**

Headline: Everything the patient has, in one history. The doctor asks, and every answer shows its source.

1. **Photograph** an old exam. Pathien reads it: date, lab, every value with its unit and range.
2. **It must be yours.** The name and ID on the exam must match the account. Someone else's exam is refused.
3. **One timeline.** Exams and the symptom diary, in date order. Patients log symptoms; the doctor gets the full picture; no self-diagnosis.
4. **The DNA handshake.** The patient shows a helix-shaped code, the doctor scans it, the patient approves. Access runs for a set time.
5. **The doctor asks.** "When was her CRP raised?" The answer lists dates and values, each linked to the exam it came from.

Under step 5, small: Possibilities to evaluate, for the doctor only. Never shown to the patient.

Under step 5, small (new in v3, built in the demo): **Over time.** Each marker as a line across her exams, the readings outside the printed range marked, and a straight-line projection. Doctor view only, for the doctor to evaluate.

Under step 3, small: Instead of searching at night, Maria logs the symptom and taps **Send to my doctor**. Her doctor sees it with her whole history. The app does not explain it. Fixed line: "If this is an emergency, call 112."

Provenance marks, exactly: "Verified by source" and "Uploaded by patient".`,
      `**2. The live demo:**

Headline: Live: Maria's folder, a doctor's question, an answer with its source.

**Body (what the room watches, in order):**
1. Photo of a blood test → structured record.
2. Her husband's exam → refused: not her name, not her ID.
3. DNA handshake → countdown starts.
4. "Has her CRP been raised before?" → dates, values, links to the exams.
5. Orthopaedics and rheumatology side by side → possibilities, each with its sources, for the doctor only.
6. Time ends → the doctor's screen closes; Maria's log shows who looked and until when.

**What is real and what is not (on the slide, small, under the checklist):**
- **Working pipeline, on synthetic data:** reading the photo into values, the name and ID match, the handshake and the time limit enforced by the database, cited answers, the signed log of who looked. *(Measured on the demo: 235 of 235 fields read correctly on our synthetic test set; docs/submission/project-details.md, S20.)*
- **Simulated tonight:** the encryption key sits on our server, not on Maria's phone; the "verified by source" lab is our own demo lab (the signature check is real); possible matches come from a seeded synthetic set; doctor-to-doctor contact is a mock-up.

Footer: Synthetic patient. Synthetic exams. No real health data.

Source: S20 (the demo's own measurements and its real and simulated list).`,
    ],
  },
  {
    id: "A2b", counter: "A2b", template: 'detail', theme: 'air', no: "Appendix A2b", kicker: "Privacy, Vault, possible matches",
    headline: "Product, live demo, privacy and possible matches, detail",
    back: [{"to": "4", "label": "Back to slide 4"}, {"to": "5", "label": "Back to slide 5"}, {"to": "5b", "label": "Back to slide 5b"}, {"to": "6", "label": "Back to slide 6"}],
    grid: "1fr 1fr",
    notes: ["Appendix slide. Shown when asked, or when a main slide's \"Details\" link is clicked. Not in the 3-minute script. The \"Back\" link returns to the main slide."],
    columns: [
      `**3. Privacy (slide 5), the four points:**
- **By design, the key is on the patient's phone.** Records are stored encrypted. Without the patient, nobody reads them, including us. *(Demo: the key sits on our server tonight; A2.)*
- **In person, for a set time.** A doctor gets in only by scanning the patient's code and getting a yes. Access ends by itself, or earlier with one tap.
- **A log nobody can edit.** Every access is written to a signed, chained log the patient can read. The log holds fingerprints of documents and access grants. No health data ever goes on a chain.
- **No diagnosis for the patient.** The patient side has no AI question box at all.

**5. Possible matches (slide 6), the full body:**
- The patient can opt in. Off until they turn it on. Name and ID are never used. They can turn it off any time.
- The doctor sees that unnamed patients elsewhere share the same pattern of markers and symptoms. No names, no exact dates, no location below country.
- The doctor can ask to talk to the doctor treating that patient, to compare cause and treatment.
- **4.7 years** average wait for a rare-disease diagnosis in Europe, longer the more doctors are involved. *(EURORDIS, S3)*

Footer: Demo: possible matches come from a seeded synthetic set; doctor-to-doctor contact is a mock-up.`,
      `**4. Pathien Vault (slide 5b):**

The full body: For patients who want maximum privacy. A small device, bought once, holds the full record and every original, encrypted, at home or on a keyring. The phone opens it.

The two points:
- **Our own encryption, on the device.** Pathien's software encrypts every record on the Vault itself. Nothing goes to the cloud unless the patient turns on an encrypted backup.
- **Same product, same rules.** It stores and shares. It never interprets, so it never diagnoses.

Footer: An option for privacy-first patients. The core business is unchanged.

**For questions: the support call.**
1. **The hospital can't confirm.** The support person verifies the situation with the hospital, not with the patient. If the hospital can't be reached or the details don't match, there is no access. The Vault never opens by default.
2. **Someone tries to talk their way in.** The support person calls the hospital to verify the situation before anything: the doctor's and the hospital's details, and the request from the doctor page, must match the call. Every call and every grant is written to the patient's signed log (slide 5), so the patient sees who asked, who approved and for how long.
3. **The support person never reads the record.** They approve or refuse a time-limited grant. The record stays encrypted on the Vault, and access ends by itself when the time runs out.
4. **A serious condition.** This is the case the Vault is for: a patient who may not be able to open the phone or the app. It is still not an emergency service. Support verifies with the hospital, not the patient, and the grant is time-limited and logged. Life-threatening emergencies follow the hospital's own procedures.
5. **Is it built?** No. It is designed, on the same rules as the working app. Say so plainly if asked (rule 8 is waived for the slide, not for the answer).

**Sources:** PRD.md sections 4, 6 and 7; S20; S3; founder's words on slide 5b.`,
    ],
  },
  {
    id: "A2c", counter: "A2c", template: 'detail', theme: 'air', no: "Appendix A2c", kicker: "Vault, behind the slide",
    headline: "Product, live demo, privacy and possible matches, detail",
    back: [{"to": "5b", "label": "Back to slide 5b"}],
    grid: "1fr 1fr",
    fs: 21,
    notes: ["Appendix slide. Shown when asked, or when a main slide's \"Details\" link is clicked. Not in the 3-minute script. The \"Back\" link returns to the main slide."],
    columns: [
      `**Behind the slide: the trade-offs.**
1. **Losing the device.** Without a backup, a lost or broken Vault means a lost record. Answer: a recovery key printed at setup, and the optional encrypted backup. Both add steps that privacy-first buyers may skip.
2. **Backup and recovery.** The backup holds only encrypted data we cannot read, so we cannot recover a record if the patient also loses the recovery key. That must be said at purchase, plainly.
3. **The doctor's access when the Vault is at home.** If the patient is at the clinic and the Vault is at home, the doctor's session needs either an encrypted copy on the phone or a connection to the Vault, which makes the Vault a small server the patient runs, with updates and security to keep. Offline, a doctor sees only what the phone carries.
4. **The doctor's questions need computing.** Cited answers ("Has her CRP been raised before?") run a language model. Either it runs on the device (slower, smaller), or the data passes through our servers for the session and is never stored. The slide says "store", not "process", for this reason. Backend and the CTO decide (Q33).
5. **Possible matches (slide 6).** A Vault user joins the network only by sending an unnamed pattern, opt-in, as today. Without it, matches are off.`,
      `6. **Cost.** Hardware means a bill of materials, stock, shipping, returns, repairs and support, and the support call in "How it's used" means a staffed desk across time zones (Q36). It ties up cash a software company does not. No price is set (founder, v3.5: "Pricing -> No").
7. **Certification.** A radio device sold in the EU needs CE marking under the Radio Equipment Directive (with EMC, electrical safety, RoHS and WEEE rules). It is not a medical device under the MDR as long as it only stores and shares; if it ever interpreted data it would become one, so it must not. GDPR still applies to any backup and to the app.
8. **Firmware and supply chain.** A device that holds health records must get signed updates for years, and its chips and factory must be trusted. A security flaw found after sale needs a recall plan.
9. **Name.** "Pathien Vault" is a descriptive name under Pathien, whose trademark clearance is still pending (Q32). No ™.
10. **How a support person can grant access without a key (Q35).** Slide 5 says nobody reads the record without the patient, including us. The grant the support person gives has to be the patient's own consent, carried through our desk, not a key we hold. Backend and the CTO decide the mechanism.`,
    ],
  },
  {
    id: "A3", counter: "A3a", template: 'detail', theme: 'air', no: "Appendix A3a", kicker: "Clinical trials, the cards",
    headline: "Clinical trials, the economics in detail",
    back: [{"to": "6b", "label": "Back to slide 6b"}, {"to": "6c", "label": "Back to slide 6c"}],
    grid: "1fr 1fr 1fr",
    notes: ["Appendix slide. Shown when asked, or when a main slide's \"Details\" link is clicked. Not in the 3-minute script. The \"Back\" link returns to the main slide."],
    columns: [
      `**1. The cards, in full:**

All three cards: one trial in one country, in euros at $1.10 to €1 *(assumption)*.

Card 1: Today, what a day of delay costs
- Big number: **about €36,000** *(our estimate)*: what one day of delay costs one trial to run.
- About $40,000 a day in direct costs to run a phase 2 or 3 trial *(Tufts CSDD, S23, verified)*. ÷ 1.10 = €36,364, rounded down to €36,000. Lost sales not counted.

Card 2: With Pathien, what one trial saves
- Big number: **about €180,000 saved per trial** *(our estimate)*: 5 days sooner to full enrolment *(assumption)* × €36,000 = €180,000.
- Below ASPE's lowest modelled saving from EHR-based recruitment, $0.46M ≈ €418,000 per phase 3 study *(S29, verified)*.
- Fewer failed screenings: today 36.3% fail *(S26, secondary)*. If a third fewer of our referrals fail, the site screens about 6 fewer people per trial *(assumption)*.`,
      `Card 3: How we charge, and what the sponsor keeps
- Big number: **about €24,000 per trial** *(our estimate)*: €5,000 set-up + €1,000 per randomised patient *(assumptions)* × about 19 randomised.
- The sponsor keeps €180,000 − €24,000 = **about €156,000** per trial *(our estimate)*.
- 10 trials a year: about €240,000 *(assumption; not in slide 10's totals)*. Never the patient.

Footer: Prices, volumes, days saved and the exchange rate are assumptions. "Our estimate" is our arithmetic on sourced inputs, not a result. Consent only. Never a data sale.

**3.** **The worked example** *(our estimate; do not read out)*: one trial, one country. 50 referrals the site accepts (assumption) × (1 − 36.3% screen failure, S26) = about 32 pass screening × 60% randomised (assumption) = about 19 randomised. Revenue: €5,000 + 19 × €1,000 = **about €24,000**. Saving: 5 days (assumption) × €36,000 a day ($40,000, S23, at $1.10 to €1, assumption, rounded down) = **€180,000**. Sponsor keeps €180,000 − €24,000 = **€156,000**. The revenue counts screen failure at today's 36.3%, so a lower screen failure among our referrals does not raise our revenue here. Screen failures avoided: 50 × (36.3% − 24.2%) ≈ 6 (a third fewer, assumption).`,
      `**4. Answers for questions, slide 6b:**
- *"What runs today?"* The extraction into a fixed schema (values, units, printed ranges, dates), the symptom diary, values as a series over time, the opt-in and the time-limited access, on synthetic data. Trial matching itself (criteria into rules, the matching engine, sharing with a trial team) is not in the demo and has no results yet. Many criteria (diagnosis codes, medications, staging) are not in our documents, so they come back "unknown". Never say "used by", "validated" or a result.
- *"Is the diary a validated outcome measure?"* No. It keeps the patient's words, the time and a 1 to 10 severity, and never says what a symptom might be.
- *"Is it a medical device?"* It must not give clinical conclusions, and an investigator decides. Whether that keeps it outside the MDR is for a regulatory adviser (PRD Q18).

**Sources:** S23 to S31. docs/business/clinical-trials-fit.md §8. Q38 (prices) open.`,
    ],
  },
  {
    id: "A3b", counter: "A3b", template: 'detail', theme: 'air', no: "Appendix A3b", kicker: "Clinical trials, answers",
    headline: "Clinical trials, the economics in detail",
    back: [{"to": "6b", "label": "Back to slide 6b"}, {"to": "6c", "label": "Back to slide 6c"}],
    grid: "1fr 1fr",
    fs: 22,
    notes: ["Appendix slide. Shown when asked, or when a main slide's \"Details\" link is clicked. Not in the 3-minute script. The \"Back\" link returns to the main slide."],
    columns: [
      `**2. How each big number is built, and answers for questions, slide 6c:**
- *"Where does $500 to $700 come from?"* ASPE's cost model (Sertkaya et al., 2014, Medidata data) puts patient recruitment at $161,140 per phase 2 study and $308,672 per phase 3 study (S29). ASPE's 2024 update counts 235 patients per phase 2 trial and 630 per phase 3 (S30). $161,140 ÷ 235 ≈ $690; $308,672 ÷ 630 ≈ $490. Two reports, different years, 2014 dollars not inflated: our estimate. It is the recruitment line only (adverts, outreach); staff time for screening sits in other lines. A recruitment vendor publishes $577 to $2,000 per randomised patient in its own campaigns (S28, vendor claim).
- *"How big is the market?"* Context, not on the slide, and not comparable with the cards: 1,497 industry phase 2 and 3 trials are recruiting in the EU, planning 776,650 participants (S31; global enrolment). Their recruitment budget: 710 × $161,140 + 787 (81 of them phase 2/3) × $308,672 ≈ $357M ≈ €325M over the life of those trials, not one year (S29, S31, our estimate). If each finished 5 days sooner: 1,497 × €180,000 ≈ €270M of running cost (our estimate). A different budget line from the recruitment budget: never set side by side.
- *"Why the cost of a day, not the recruitment budget per trial?"* $357M ÷ 1,497 ≈ $240,000 per trial is the whole trial's recruitment line, worldwide. On that line alone, ASPE's 35.9% lower cost per patient (S29) on our about 19 patients saves under €5,000 (our estimate), less than our fee. A sponsor's value is the days, so the cards use the cost of a day.
- *"Why €36,000 a day?"* The phase 2 and 3 blend (S23), rounded down. Phase 2: about €21,600 a day, 5 days ≈ €108,000. Phase 3: about €50,700, 5 days ≈ €253,000.`,
      `- *"Why 5 days?"* ASPE assumes about a year of recruitment per phase (S29), so 5 days is about 1.4% of it. ASPE also modelled EHR-based recruitment: 35.9% lower recruitment cost per patient, and $0.46M to $2.5M saved per phase 3 study (3.1% to 8.8% of its cost) (S29, verified). Our €180,000 (about $198,000) sits below ASPE's lowest phase 3 figure on purpose. An assumption, to be tested with a sponsor.
- *"Why €1,000 a randomised patient, not €1,500?"* v3.9 had €1,500. ASPE puts the recruitment line at about $500 to $700 per participant (S29, S30), and the vendor average is $1,379 (S28): €1,500 (about $1,650) would sit above both. €1,000 (about $1,100) stays under the vendor average and is paid only when the patient is randomised. The value case rests on days saved, not on the fee. Q38 is open: the founder decides.
- *"Why a set-up fee?"* Each trial's criteria are turned into rules, and a person reviews those rules before they run. €5,000 per trial and country is an assumption.
- *"Trial clinics pay?"* Sponsors and CROs fund recruitment and pay sites per patient. We bill the sponsor or CRO, or the site where the sponsor's recruitment budget runs through it. Never the patient. A recruitment service fee, never a data sale.
- *"How hard is recruitment?"* About 11% of sites in a typical trial enrol no patient and 37% under-enrol (S24, secondary, old). 19% of phase 2 and 3 trials closed in 2011 ended early for poor accrual or below 85% of target (S25, verified).`,
    ],
  },
  {
    id: "A4", counter: "A4", template: 'detail', theme: 'air', no: "Appendix A4", kicker: "Impact, the maths",
    headline: "Impact, the savings maths",
    back: [{"to": "7", "label": "Back to slide 7"}],
    grid: "1fr 1fr",
    fs: 21,
    notes: ["Appendix slide. Shown when asked, or when a main slide's \"Details\" link is clicked. Not in the 3-minute script. The \"Back\" link returns to the main slide."],
    columns: [
      `**1 and 2. The body:**
- **17.5%** of health spending in a typical OECD country goes on the harm of diagnostic error, about **1.8% of GDP**. Halving it would free **8%**, about **USD 676 billion** a year across OECD countries. *(OECD, 2025, S10)*
- **25 to 30%** of medical tests are unnecessary, about **2.5%** of health spending. *(OECD, 2025, S10)*
- **Worked example, Greece** *(our estimate)*:
  - The whole prize: about **€3.5 billion a year** of the €19.9 billion Greece spends on health is the cost of diagnostic error. *(S10 × S15)*
  - Our first slice, unnecessary and repeated tests only: **about €4M a year (conservative) to about €75M a year (upside)**, depending on how many patients bring their record. *(our estimate, S10, S15, S17)*

One line on who pays: Hospitals and clinics pay per case or per seat; the patient is free. What that could earn, and how it compares with these savings: slide 10.

Footer: "Our estimate" means our arithmetic on sourced inputs. The share we prevent and the adoption rate are assumptions to be tested in pilots. Not a forecast.`,
      `**3. The formula:**
Formula for questions (do not read out): savings a year = cost base × share avoidable × share we prevent × adoption.
- Conservative: €810M (Greek stand-alone lab and imaging spend, 2024, S15) × 25% unnecessary (OECD low end, S10) × 20% we prevent (assumption) × 10% adoption (assumption) = **about €4M**.
- Upside: €497M (OECD's 2.5% unnecessary-test share × €19.87bn Greek spend) × 50% we prevent (assumption, anchored to S17: duplicate-imaging odds 0.44 when doctors used a shared record) × 30% adoption (assumption) = **about €75M**.
- Whole prize: €19.87bn × 17.5% = about €3.5bn (our estimate). Never say €75M without "upside" and the adoption assumption.

**4. Sources:** S10 (verified), S15 (verified), S17 (verified), S6 (verified). No count of wrong diagnoses per year exists for Greece or the EU in a primary source, so none is on the slide. No euro figure for duplicate tests in Greece or the EU exists either; the €4M to €75M is ours and labelled so.`,
    ],
  },
  {
    id: "A5", counter: "A5", template: 'detail', theme: 'air', no: "Appendix A5", kicker: "Competition",
    headline: "Competition in detail",
    back: [{"to": "8", "label": "Back to slide 8"}],
    grid: "1fr",
    fs: 22,
    notes: ["Appendix slide. Shown when asked, or when a main slide's \"Details\" link is clicked. Not in the 3-minute script. The \"Back\" link returns to the main slide."],
    columns: [
      `**1. The table:**

| Where on the map | Who | What they do well | What they do not do |
|---|---|---|---|
| Institution-held, one provider | **Epic** (MyChart, Emmie, Art) | Chart summaries inside one health system | The patient's outside history, old paper, records from abroad |
| State-held, one country | **National apps** (NHS App, India's ABDM, Abu Dhabi's Malaffi, Greece's MyHealth, which holds EOPYY lab results since Nov 2026) | Scale inside their borders; public lab results | Private and out-of-pocket tests, imaging, old paper, records from abroad, a doctor-side summary across all of it. We work next to them, not against them |
| Patient side, US connected records | **ChatGPT Health**, symptom checkers | Explains records and symptoms to the patient | Answers go to the patient, from what the patient types in (slide 3: under 34.5% right); no doctor handshake; no source marking |
| Off the map: not a record | **OpenEvidence** | Evidence answers for doctors | Answers from the literature, not from this patient's history |
| **Patient-held, every provider and border** | **Pathien** | Old paper to one history; doctor-only assistant with sources; in-person handshake | Not yet certified for decision support (slide 12) |

**2. Tags:** "AI talks to: patient" (ChatGPT Health, Emmie) or "AI talks to: doctor" (Epic Art, OpenEvidence, Pathien).

**3. Sources and limits:** S8 (market-and-competitors.md §2, company pages); MyHealth and EOPYY: S16 (secondary); chatbot accuracy: S14 (verified). No competitor numbers are used: Epic's market share, ChatGPT's user count and OpenEvidence's valuation are on Sales' do-not-use list. Avoid "the only" and "the first" in speech: the research found no proof either way.`,
    ],
  },
  {
    id: "A6", counter: "A6a", template: 'detail', theme: 'air', no: "Appendix A6a", kicker: "Business model, buyers",
    headline: "Business model and revenue inputs",
    back: [{"to": "9", "label": "Back to slide 9"}, {"to": "10", "label": "Back to slide 10"}],
    grid: "1fr 1fr",
    notes: ["Appendix slide. Shown when asked, or when a main slide's \"Details\" link is clicked. Not in the 3-minute script. The \"Back\" link returns to the main slide.", "Speaker notes of the earlier buyer table: \"The patient is free. The first buyer is the hospital that treats patients from abroad: their records arrive in other languages, on paper, or not at all, and the hospital already asks for them before the trip. Clinic chains pay per doctor seat. Rare-disease networks are our free pilots. Later, national agencies. Research use, if ever, is opt-in and never a data sale.\""],
    columns: [
      `**1. Buyer groups → revenue lines:** Hospitals → line A (per case, international-patient departments first) and seats; private clinics → line B (per seat); labs → line C (integration fee, upside only); governments and national health systems → not counted (tenders, licences, year 2+); clinical-trial sponsors → not counted (priced on slide 6c, not projected).

**2. The full buyer table:**

| When | Who pays | For what | Model (to test in pilots) |
|---|---|---|---|
| Year 1 | Medical-tourism hospitals and international-patient departments | A consented, translated history that arrives before the patient does | Per-case fee |
| Year 1 | Multi-specialty clinic chains and telehealth platforms | The doctor sees the whole history at the first visit | Per-doctor seat |
| Year 1 | Rare-disease networks | A pilot where possible matches matter most | Free pilot, grant-funded |
| Year 1 | Lab networks | Results the patient carries, marked "Verified by source" | Partnership |
| Year 2+ | National health-data agencies | A patient-held layer next to the national record | Tender, sandbox |

Footer: Models are hypotheses for pilots to test. Prices and volumes on slide 10 are assumptions.`,
      `**5. The arithmetic:** **"A fraction of what they save", the arithmetic** *(our estimate, shown small on the slide)*: slide 7 says better records could save **€4M (conservative) to €75M (upside) a year on tests, in Greece alone**. Our year-3 revenue from every customer in every country is **€0.56M to €4.85M**: about **14%** of the conservative saving and about **6%** of the upside one. Savings outside Greece and the savings on diagnostic error itself are not counted, so the real ratio is smaller.

**6.** Not counted: rare-disease pilots (free, grant-funded), national agencies (tenders, year 2+), clinical-trial pre-screening (slide 6c: priced per trial and per randomised patient, not projected until a sponsor pilot sets the volume), research use (later, consent-gated, never a data sale).

Footer, required: Our estimate. Every price, customer count and volume is an assumption for the pilots to test. Not a forecast. We never earn from a diagnosis: Pathien never makes one.`,
    ],
  },
  {
    id: "A6b", counter: "A6b", template: 'detail', theme: 'air', no: "Appendix A6b", kicker: "Revenue inputs",
    headline: "Business model and revenue inputs",
    back: [{"to": "9", "label": "Back to slide 9"}, {"to": "10", "label": "Back to slide 10"}],
    grid: "1.45fr 1fr",
    notes: ["Appendix slide. Shown when asked, or when a main slide's \"Details\" link is clicked. Not in the 3-minute script. The \"Back\" link returns to the main slide."],
    columns: [
      `**3. The revenue inputs.** Headline: Hospitals pay per case and per doctor seat. The health system saves many times what they pay. bottom-up, years 1 to 3, our estimate. Year 1 starts with the first paid pilot. Every input is **cases or seats × price**.

| Revenue line | Input | Conservative | Upside | Label |
|---|---|---|---|---|
| **A. Per case**, international-patient departments | Paying hospitals, year 1 / 2 / 3 | 1 / 3 / 8 | 2 / 6 / 15 | assumption |
| | Paid cases per hospital a year (year 1 is half a year, after a free pilot) | 500 / 1,000 / 1,000 | 1,500 / 3,000 / 3,000 | assumption |
| | Price per case | €40 | €80 | assumption (no published price exists) |
| **B. Per seat**, clinic chains and telehealth | Paid doctor seats, year 1 / 2 / 3 (year 1 is half a year) | 20 / 100 / 400 | 60 / 400 / 2,000 | assumption |
| | Price per seat | €50 a month (€600 a year) | €50 a month (€600 a year) | assumption, set at 40% of Tandem Pro's published €125 a month (S18) |
| **C. Labs**, integration fee | New lab integrations, year 1 / 2 / 3 | 0 / 0 / 0 | 0 / 1 / 2 | assumption |
| | Fee per integration, one-off | n/a | €25,000 | assumption |`,
      `**4. Revenue by line and year:**

| Revenue a year | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| A. Per case, conservative | €20k | €120k | €320k |
| B. Per seat, conservative | €6k | €60k | €240k |
| C. Labs, conservative | €0 | €0 | €0 |
| **Conservative total** | **€26k** | **€180k** | **€560k** |
| A. Per case, upside | €240k | €1,440k | €3,600k |
| B. Per seat, upside | €18k | €240k | €1,200k |
| C. Labs, upside | €0 | €25k | €50k |
| **Upside total** | **€258k** | **€1,705k** | **€4,850k** |`,
    ],
  },
  {
    id: "A6c", counter: "A6c", template: 'detail', theme: 'air', no: "Appendix A6c", kicker: "Answers and sources",
    headline: "Business model and revenue inputs",
    back: [{"to": "9", "label": "Back to slide 9"}, {"to": "10", "label": "Back to slide 10"}],
    grid: "1fr 1fr",
    fs: 22,
    notes: ["Appendix slide. Shown when asked, or when a main slide's \"Details\" link is clicked. Not in the 3-minute script. The \"Back\" link returns to the main slide."],
    columns: [
      `**7. Answers for questions:**
- *Why €40 to €80 a case?* No one publishes a price for a consented, translated record packet. We ask buyers for their figure first (treg-findings-2026-11-14.md Q6, question 5: ask for a monthly figure, do not suggest one).
- *Why €50 a seat?* Below paid AI scribes (Tandem Pro lists €125 a month, S18), above the free tools (OpenEvidence and Glass are free to US clinicians, S8). Same assumption A7 used in dollars.
- *Is 45,000 cases a lot?* Turkey alone welcomed about 1.5M health tourists in 2024 (S19, secondary). 45,000 cases is about 3% of one country's year.
- *Who saves, who pays?* Not always the same desk. The payer or the patient saves on repeated tests; the international-patient department pays for a faster first visit and patients who arrive ready. The pilot measures both.`,
      `**Sources:** S10 and S15 via slide 7 (verified inputs, our estimate); S18 (company pricing page, via market-and-competitors.md §2); S19 (secondary); S8; buyers.md §1.1, §1.2, §1.4, §1.7 and §5 (models, no prices). **Sales' do-not-use list:** it names "our TAM, SAM and SOM themselves, until the $600 seat price and 1% share are validated". The 1% share is dropped. A seat price has to appear because the founder asked what we can earn; it stays at €50 a month, carries the word "assumption" at the same size, and is anchored to a published list price (S18), not to market share. Bumrungrad's international-patient count (🟡 in buyers.md) is not used.`,
    ],
  },
  {
    id: "A8", counter: "A8", template: 'detail', theme: 'air', no: "Appendix A8", kicker: "Go-to-market and regulatory",
    headline: "Go-to-market and regulatory path, detail",
    back: [{"to": "11", "label": "Back to slide 11"}, {"to": "12", "label": "Back to slide 12"}],
    grid: "1fr 1.2fr",
    fs: 21,
    notes: ["Appendix slide. Shown when asked, or when a main slide's \"Details\" link is clicked. Not in the 3-minute script. The \"Back\" link returns to the main slide."],
    columns: [
      `**1 and 2. Go-to-market, the full body:**
1. **This weekend · Athens LifeTech Park.** First clinicians' feedback, one orthopaedics and rheumatology pair as a clinical champion.
2. **Clinical validation · innovation gateways.** Mayo Clinic Platform. Run on synthetic or de-identified data first.
3. **First revenue · medical-tourism hubs.** UAE first (Cleveland Clinic Abu Dhabi), then Bangkok and Istanbul (Bumrungrad, Acıbadem).
4. **The network · rare-disease groups.** EURORDIS and a national member, where possible matches prove themselves.

Market order after the pilots: UAE and the Gulf → UK → India → US (rare disease and international-patient offices) → core EU as EHDS lands.

Footer, required: Named organisations are targets from public research. None has been contacted.`,
      `**3. Regulatory path, the full table:**

| Step | What ships | What applies |
|---|---|---|
| **1. The record** | Photo to history, identity match, handshake, cited search, symptom diary | **GDPR** (EU) and **HIPAA** (US): health data, explicit consent, impact assessment. Software that only stores, retrieves and shares is generally not a medical device. |
| **2. The network** | Opt-in possible matches, doctor-to-doctor contact | **GDPR** explicit consent. **EHDS** gives the lawful route for research use. Our rule is stricter: opt-in only. |
| **3. Decision support** | "Possibilities for the doctor to evaluate" | **EU MDR**: medical-device software, certified with a notified body. **EU AI Act**: high-risk obligations follow. **US FDA**: clinical decision-support guidance. |

**4. Sources and limits:** PRD.md section 8 (Product's summary, **not legal advice**); EHDS: S4 (verified); AI Act timing and FDA guidance: S9 (secondary). The MDR class (Rule 11, class IIa or higher) and the exact line between retrieval and decision support are **not** on the slide: they wait for Sales' check and a regulatory adviser (PRD Q18). No dates for the AI Act on the slide (sources conflict).`,
    ],
  },
  {
    id: "A9", counter: "A9a", template: 'detail', theme: 'air', no: "Appendix A9a", kicker: "Team and spend",
    headline: "Team and funding detail",
    back: [{"to": "13", "label": "Back to slide 13"}, {"to": "14", "label": "Back to slide 14"}],
    grid: "1.15fr 1fr",
    notes: ["Appendix slide. Shown when asked, or when a main slide's \"Details\" link is clicked. Not in the 3-minute script. The \"Back\" link returns to the main slide."],
    columns: [
      `From the CEO's plan v3 (docs/business/team-and-funding-plan.md §2, §2b, §3 and §5; the model reruns in docs/business/funding-model.py). Founder, 15 Nov 2026: *"Fund 1m -> do the maths"*. **Every cost and revenue figure here is an assumption, our plan.** Not on this slide, by the founder's rule: where the money comes from.

**1. The team: 6 people, plus a research partner** *(loaded monthly cost at Athens rates, with employer contributions; assumptions)*

| Who | Starts | Cost a month | 24 months |
|---|---|---|---|
| Engineer (platform and pipeline) | Month 1, full-time | €5.3k | €127k |
| Clinical and regulatory lead (half-time) | Month 1 | €3.1k | €76k |
| ML engineer | Month 2, full-time | €5.8k | €133k |
| Business development | Month 2, full-time | €5.1k | €118k |
| Marketing | Month 3 half-time, full-time from month 10 | €1.8k, then €3.7k | €68k |
| Second engineer | Month 13, full-time | €4.8k | €57k |
| **Team total** | | **€27.7k at full team** | **€578k (58%)** |
| Research partner (target, not contacted): a university hospital and an AI research centre | Month 4 | about €2.9k | €49.8k (5%) |

Build = the two engineers and the ML engineer. Sell = business development and marketing. Prove = the clinical and regulatory lead and the research partner.`,
      `**2. Where the €1M goes, by function**

| Function | What is inside | 24 months | Share |
|---|---|---|---|
| **Sell** | Business development €117.8k · marketing €67.6k · pilots and go-to-market €60.0k · public-procurement adviser €15.0k · trials sponsor pilot €25.0k | **€285k** | **29%** |
| Build | Engineer €126.6k · ML engineer €133.0k · second engineer €57.2k · infrastructure and AI €44.0k | €361k | 36% |
| Prove | Clinical and regulatory lead €75.5k · regulatory and legal €67.0k · regulatory pathway €50.0k · research partner €49.8k | €242k | 24% |
| Buffer | About 3.4 months of the steady burn | €112k | 11% |
| **Total** | | **€1,000k** | **100%** |`,
    ],
  },
  {
    id: "A9b", counter: "A9b", template: 'detail', theme: 'air', no: "Appendix A9b", kicker: "Burn, runway, gates",
    headline: "Team and funding detail",
    back: [{"to": "13", "label": "Back to slide 13"}, {"to": "14", "label": "Back to slide 14"}],
    grid: "1fr 1.2fr",
    notes: ["Appendix slide. Shown when asked, or when a main slide's \"Details\" link is clicked. Not in the 3-minute script. The \"Back\" link returns to the main slide."],
    columns: [
      `**3. Burn by quarter**

| Quarter | Months | Burn a month | What drives it |
|---|---|---|---|
| Q1 | 1 to 3 | €37.6k | First hires; regulatory opinion, DPIA, contracts, security test |
| Q2 | 4 to 6 | €31.2k | Marketing half-time; research partner starts |
| Q3 | 7 to 9 | €28.5k | Pilot running; the three numbers measured |
| Q4 | 10 to 12 | €38.0k | Tranche 2: marketing full-time; regulatory pathway, procurement adviser, trials pilot |
| Q5 | 13 to 15 | €42.8k | Second engineer; the peak |
| Q6 | 16 to 18 | €41.9k | Student project ends |
| Q7 | 19 to 21 | €39.1k | Trials pilot ends; validation contract ends |
| Q8 | 22 to 24 | €37.1k | Full team, run costs |
| After | 25 on | €32.7k | Steady team of six; certification is the next round |

Average €37.0k a month over the 24 months.

**4. Runway**

- With no revenue at all, the money lasts **27 months**.
- Months 1 to 9 cost €292k, inside tranche 1 (€300k). Months 10 to 24 cost €596k; with the buffer, tranche 2 is €700k.
- The buffer (€112k) covers about 3.4 months of the steady burn: slower sales, a longer DPIA or ethics approval, a gap before tranche 2.`,
      `**5. Tranches and gates**

| Gate | Date or month | What opens |
|---|---|---|
| **G1**, before any money | 30 Nov 2026 | 2 of 5 buyers name a cost and a budget owner, plus 1 written pilot interest; 3 of 5 doctors name the moment they would open it. No money |
| **G2**, before any money | 15 Jan 2027 | A pilot agreed in writing with a buyer; the regulatory adviser's first opinion; a committed clinician. Opens **tranche 1, €300k** (months 1 to 9; month 1 about March 2027, assumption) |
| **The three numbers**, at the end of the pilot | About month 9 | The buyer names **€40 a case or more**; **1,000 paid cases a year or more** per hospital; **€5 or less a case to run** at 98% field accuracy. Opens **tranche 2, €700k** (months 10 to 24) |
| Inner gate: regulatory pathway (€50k) | Months 10 to 24 | Released only if the regulatory opinion says the roadmap needs a device route; otherwise it returns to the buffer |
| Inner gate: trials sponsor pilot (€25k) | Months 10 to 18 | Released only when a sponsor or CRO agrees a pilot in writing; if none signs by month 12, it returns to the buffer |

Nobody is hired before G2. If G2 fails, nobody is hired.`,
    ],
  },
  {
    id: "A9c", counter: "A9c", template: 'detail', theme: 'air', no: "Appendix A9c", kicker: "Break-even, alternative, assumptions",
    headline: "Team and funding detail",
    back: [{"to": "13", "label": "Back to slide 13"}, {"to": "14", "label": "Back to slide 14"}],
    grid: "1.15fr 1fr 1fr",
    notes: ["Appendix slide. Shown when asked, or when a main slide's \"Details\" link is clicked. Not in the 3-minute script. The \"Back\" link returns to the main slide."],
    columns: [
      `**6. Break-even, on both revenue lines (slide 10)** *(gross margin 87.5%: €5 cost on a €40 case)*

| | Conservative (€26k / €180k / €560k in years 1 to 3) | Upside (€258k / €1.7M / €4.85M) |
|---|---|---|
| Revenue inside the 24 months | about €164k | about €1.57M |
| **Revenue passes costs** | **Month 29** | **Month 12** |
| Cash at month 24 | about €255k | about €1.49M |
| **Cash at its lowest** | **about €204k, month 30** | never below the start |
| Months sales can slip and still reach break-even | 6 | 18 |

Break-even at the steady team of six: about €449k of revenue a year (about 11 hospitals at €40k a year, or about 750 doctor seats). The plan is sized on the conservative line; if the upside arrives, tranche 2 can be smaller.`,
      `**7. The €885k alternative** *(if the founder wants less than €1M)*

| Lever | Saves |
|---|---|
| Second engineer from month 19, not 13 | €29k |
| Regulatory pathway left to the next round | €50k |
| Trials pilot funded by its sponsor | €25k |
| Research partner back to 15 months | €12k |
| **Together** | **about €115k: the ask becomes about €885k** |

Rerun with the same €112k buffer: break-even still month 29, and sales can still slip 6 months. What is lost is the clinician-led regulatory start, the trials test and the earlier second engineer, not the runway.`,
      `**8. Assumptions**

- Costs are loaded monthly costs for Athens employees: gross salary (14 payments a year) × 1.2179 for employer social security (21.79%, **secondary**), ÷ 12, plus about €200 a month for tools. Every salary is an **assumption**, anchored to **secondary** salary surveys (plan §2); the clinical lead's salary has no source checked.
- Revenue follows slide 10: paid revenue starts at plan month 9, after a free pilot; it climbs in a straight line inside each year and is held flat after year 3.
- Gross margin 87.5% (the third number). If a person must check every case, margin falls to about 50% to 75% and break-even rises to about €523k to €785k a year.
- Not counted: clinical-trials revenue (if the sponsor pilot converts, break-even moves to month 27), government revenue (tenders are slow), and any grant until it is signed.
- Not in the budget: the founder's own pay (€3,000 a month would cost €72k, from the buffer), equity for the hires, and certification (CTO estimate €300k to €800k, the next round).
- The research partner's names (NKUA Medical School with Attikon University General Hospital; the Athena Research Center's Archimedes unit) are **targets**; nobody has been contacted.`,
    ],
  },
];
