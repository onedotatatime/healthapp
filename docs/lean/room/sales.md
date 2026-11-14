# Health app lean workshops: the Sales seat paper

**Status: RECOMMENDED, NOT DECIDED.** Every position below is Sales' recommendation. The founder decides.

| | |
|---|---|
| **Seat** | Sales (Spast Arxidas, `sales-minhos`) |
| **Issue** | MIN-4438, parent MIN-4435, project "Health app, hackathon prototype" |
| **Date** | 14 Nov 2026. Started now, not after 15 Nov: the founder overruled the "wait" in the issue ("Just do the exercise now to have the outcome") |
| **Task type** | Competitor teardown |
| **Written without reading** | any other seat's paper in `docs/lean/room/`. This is Sales' own view, recorded alone, for Pix to compare afterwards |
| **Inputs read** | `docs/00-founder-brief.md`, `docs/PRD.md` (sections 1 to 9, 14), `docs/research/market-and-competitors.md` (MC), `docs/research/buyers.md` (BY), `docs/reviews/ceo-review.md`, `docs/reviews/cto-review.md`, `docs/deck/deck-content.md` |
| **Not done** | No outreach, no contact, no new search, no new reader or scraper. Strategy only. Synthetic personas only; no exam of the founder's and nothing from the `demo` project is used or described |

**Guardrails held.** The post-hackathon product is not decided (park by default; gates G0 15 Nov, G1 30 Nov, G2 15 Jan). The insurer DATA rule is absolute and I neither widen nor narrow it. The five commercial edges around it stay open questions (last section).

**How to read the evidence.** Sample size of real interviews is **0** (PRD section 1). Almost every buyer fact in BY is yellow or red: BY states that no source page was opened that night and that every price, budget owner and cycle length is an assumption. The seat price ($600) and the 1% share are assumptions (MC 1.2). I say so wherever it matters. Confidence is low, medium or high, with the reason.

**Sales' position in one paragraph.** The problem is real and well evidenced. The gap versus competitors is real in three narrow places (old paper, cross-border, the doctor-side trust marks) and unproven everywhere else. The first payer is a hospital's international-patient department, paying per case, not a doctor paying a seat. Nothing yet shows that anyone will pay. The product after the hackathon is a pre-fit idea with a good wedge, and the honest next step is ten interviews and one written interest, not a build.

---

## 1. Personas

Six synthetic archetypes, built from the research files and the PRD, **not from interviews**. They are hypotheses to test at G1. Names are invented. "Maria" is the PRD's synthetic patient.

| # | Persona | Role in the money | Situation (source) | Job to be done | Today they use |
|---|---|---|---|---|---|
| P1 | **Maria**, synthetic, 50s, chronic joint pain, sees an orthopaedist and a rheumatologist | User, never pays | 51.4% of US adults have 2+ chronic conditions (MC 1.1, secondary); 59% have several portals, 7% combine them (MC 1.1, ONC, verified) | "Make each new doctor see everything without me carrying it" | A folder, phone photos, each provider's portal (MC 2.5) |
| P2 | **Karim**, synthetic, travels abroad for a surgery | User; his hospital is the payer | Foreign records are often incomplete, illegible or in another language (MC 1.4, secondary); Cleveland Clinic Abu Dhabi asks overseas patients for records before arrival (BY 1.1, yellow) | "Arrive with a history the foreign doctor can read" | Email, PDFs, a translated copy, a courier |
| P3 | **Ioanna**, synthetic caregiver of a child with a rare disease | User; a patient group may sponsor | Rare-disease diagnosis takes 4.7 years in Europe; more doctors seen means a longer wait (MC 1.1, verified) | "Stop retelling the story to every specialist, and find others like us" | Binders, associations, own research |
| P4 | **Dr. Neri**, synthetic orthopaedist, first visit with a new patient | User; seat holder at a clinic chain | Chart review is about a third of EHR time per visit, 5 min 22 s of 16 min (MC 1.1, secondary, vendor-authored) | "Know the history in two minutes and trust where each fact came from" | What the patient brings; OpenEvidence, ChatGPT, a scribe (MC 2.2) |
| P5 | **Layla**, synthetic head of international patients at a hospital | **First payer (hypothesis)** | Medical-tourism volumes: Bumrungrad about 50% international outpatients (own FAQ), Acibadem 90+ countries (BY 1.7, yellow) | "Get the right records before the patient lands, and convert more inquiries" | Email requests, coordinators, translators |
| P6 | **Omar**, synthetic medical director of a 10-clinic chain | Second payer (hypothesis) | Chains decide in 2 to 6 months (BY 1.2, red guess) | "Cut repeat tests and first-visit time across sites, with no IT project" | Their EHR, a patient app, paper scans |

**Position.** Lead the story with P5 (who pays) and P2 (whose pain is sharpest), keep P1 as the face of the demo, and treat P4 as the user whose adoption decides everything. The PRD's persona set is patient-and-doctor only. It has no payer persona, and that is the gap Sales fills.

**Confidence: low.** The facts attached to each persona are sourced, but the personas themselves are inferences, there is no interview behind any of them, and BY's buyer data was never opened at the page level.

**Evidence.** PRD section 2 (users), MC 1.1 and 1.4, BY 1.1 to 1.7 and section 4, CEO review pre-mortem row 2 (nobody did the work on either side).

**What would change my mind.** If the first five patient and five doctor interviews at G1 describe a different top pain (for example, doctors say time is not the problem, trust in patient-supplied data is), P4 and P1 get rewritten. If no international-patient department confirms it asks for records before arrival, P5 drops from first payer to hypothesis-only and P6 or P3's patient group moves up.

---

## 2. Empathy maps

Four maps, for the four people whose behaviour decides adoption and payment. All are **hypotheses**, written from the research and the founder's own words. Nothing here is a quote from a real person.

### E1. Maria, the patient (P1)

| | |
|---|---|
| **Says** | "I forgot the MRI report again." "Let me tell you what the other doctor said." |
| **Thinks** | "Nobody has the whole picture." "If I photograph twenty years of paper, what do I get back?" (PRD gives the patient no diagnosis, by design: N1) |
| **Does** | Carries a folder, photographs pages on her phone, retells the story at each visit |
| **Feels** | Anxious she will miss something; tired of repeating; wary of who sees her data |
| **Pains** | Retelling; lost papers; two specialists who never meet (founder brief, problem) |
| **Gains** | One history that follows her; control over who sees it and for how long |

Sales read: the effort is front-loaded (photograph everything) and the reward is paid out to someone else (the doctor). That is the cold-start risk in CEO review row 2. It is why I do not want a patient-first launch.

### E2. Karim, the cross-border patient (P2)

| | |
|---|---|
| **Says** | "The hospital asked for six months of records and I do not know what they need." |
| **Thinks** | "Will they understand my reports from home?" "Is it safe to send them?" |
| **Does** | Gathers PDFs, asks his doctor for copies, pays for translation |
| **Feels** | Unsure and short of time; depends on the hospital's coordinator |
| **Pains** | Records in another language and format; foreign centres that cannot copy films (MC 1.4, secondary) |
| **Gains** | A consented packet the receiving doctor can read before arrival |

### E3. Dr. Neri, the specialist (P4)

| | |
|---|---|
| **Says** | "I have ten minutes. What did the rheumatologist find?" |
| **Thinks** | "Can I trust a number the patient photographed?" "Another app to open in the visit?" |
| **Does** | Reads what the patient brought, asks questions, orders repeat tests when unsure (repeat imaging is common: MC 1.1, secondary, with counter-evidence that access can raise ordering) |
| **Feels** | Time pressure; liability; sceptical of tools that add steps |
| **Pains** | Missing history; unverifiable documents; scanning a code inside a ten-minute visit (CEO review row 2) |
| **Gains** | A two-minute overview; each fact linked to its source; the "verified by source" mark |

Sales read: the doctor will not pay out of pocket when OpenEvidence and Glass are free to clinicians (MC 1.2). Doctors are users; employers of doctors pay.

### E4. Layla, the international-patient head (P5)

| | |
|---|---|
| **Says** | "Send us your records two weeks before." "Half of them arrive incomplete." |
| **Thinks** | "Each missing record delays the quote and the booking." "What does this cost per patient, and who signs it off?" |
| **Does** | Chases records by email, coordinates translators, passes cases to clinicians |
| **Feels** | Measured on conversions and speed; cautious about privacy rules for foreign data |
| **Pains** | Many languages and formats (BY 1.7 objection); no IT budget for a new integration |
| **Gains** | Faster, cleaner intake; fewer lost inquiries; a story for the hospital's own marketing |

**Position.** The map that matters for revenue is E4, and it is the weakest evidenced. I recommend G1 interviews start with the payer, not the patient.

**Confidence: low.** Every cell is inferred.

**Evidence.** Founder brief (problem statement), PRD sections 1, 2 and 6 (A to E), MC 1.1 and 1.4, BY 1.1, 1.2 and 1.7, CEO review row 2.

**What would change my mind.** Interview answers that contradict a "Says" or "Pains" cell. In particular: if five doctors say they would open a code in a visit, E3's adoption worry is wrong. If an international-patient head says records are not a bottleneck, E4 is wrong.

---

## 3. Competitor analysis (the competitor teardown input)

Gap-based, as in MC (no numeric 12-dimension score: no app-store reviews, job posts or SEO data were gathered). Three lenses: feature, pricing, positioning. The detail and every source link are in MC section 2 and BY section 0. I add the synthesis and my own risk ratings.

### 3.1 Feature gaps

| Capability | Who has it | Who lacks it | Sales read |
|---|---|---|---|
| Patient connects records from provider networks, AI explains | ChatGPT Health, Claude (US beta), Google, Apple Health Records, Epic Emmie, HealthEx/b.well (MC 2.1) | us (we start from paper and photos) | Table stakes in the US. Not our fight |
| Old paper photographed into one history | PicnicHealth (retrieval plus digitising, US), Eka Care (India standards) (MC 2.1, 2.4) | Almost everyone else. No funded pure-play found | A **candidate** gap. "No one does it" is unproven (MC 2.4 says so) |
| Doctor-side assistant over the patient's own history | Epic Art (inside one chart), Navina and Metriport (connected EHR and claims) (MC 2.2) | OpenEvidence and Glass (answer from literature or a one-liner), ChatGPT Health (patient-facing) | Real gap for **outside paper and cross-provider**, not for in-system charts |
| In-person, time-limited, patient-approved access | None found | n/a | A **candidate** gap, copyable in weeks by anyone with a patient app |
| "Verified by source" versus "uploaded by patient" on every record | State rails (source-verified), none patient-held that I found | most consumer apps | Differentiating, but real verification needs labs and national systems (PRD B2, simulated in the demo) |
| Opt-in matching across patients, doctor-to-doctor | Matchmaker Exchange (clinician-only), Clinerion (pharma), PatientsLikeMe (ended in an insurer sale) (MC 2.3) | consumer apps | Differentiating in intent. The most ethics-exposed and least built feature |
| Booking plus patient document vault | **Doctolib**, which says it will let patients centralise documents (BY 0, yellow) | us | Biggest distribution threat in Europe |

### 3.2 Pricing gaps

| Observation | Source | Meaning |
|---|---|---|
| Patient side is free almost everywhere (Apple, state apps, PicnicHealth patients free, Fasten open source) | MC 2.1 | Charging the patient is not a model. Agrees with the PRD |
| Doctor tools: OpenEvidence free (ad-supported), Glass free for US verified clinicians; paid scribes Tandem EUR125 per user per month (a rival page says EUR109), Heidi USD55 to 150 depending on source | MC 1.2, 2.2 | A doctor-paid seat sits between free tools and scribes. The $50 a seat ($600 a year) is my own **assumption** and is the weakest number in the file |
| Revenue elsewhere comes from enterprise, provider subscriptions, or de-identified research data (PicnicHealth, Patients Know Best) | MC 2.1 | The only model that fits our rule set is provider-paid. Research data is parked |
| No published price for any international-patient or per-case product | BY 5 | Per-case price is unknown. BY lists no prices because none are sourced |

### 3.3 Positioning gaps

- The crowded positions: "AI explains your records to you" (ChatGPT Health, Claude, Epic Emmie), "ambient scribe" (Abridge, Dragon Copilot, Heidi, Tandem), "evidence answers for doctors" (OpenEvidence).
- The open or thin positions: patient-carried across borders, old paper to one history, one timeline across specialties, a privacy promise that excludes insurers (PatientsLikeMe's sale to UnitedHealth shows what an insurer link does to trust: MC 2.3).
- Where the deck's map (slide 9) is incomplete from a sales view: it omits **Patients Know Best** (UK, patient-held record, provider-paid, claims 7.8M registered users, MC 2.1) and **Doctolib** (BY's closest European threat). A buyer who knows either will ask. Add both to the answer sheet before a pilot conversation.

### 3.4 Threat ranking (Sales' view)

| Rank | Competitor | Why | Counter that holds only if tested |
|---|---|---|---|
| 1 | **Epic (Emmie plus Art)** | 42% of US acute hospitals (STAT via search, not slide-grade) and patient and doctor surfaces both exist | They cannot see outside paper or foreign records |
| 2 | **OpenAI ChatGPT Health** and the other big AI platforms | Reach and record pipes in the US; EU and UK blocked by regulation only (MC 3) | No doctor handshake, no source marking, no old paper |
| 3 | **Doctolib** | Europe distribution (company claims 80 to 90M patients, BY 0), plans a document vault, bought into the UK | Doctor-side AI bridge and cross-border neutrality. Weak: it is also the likeliest partner |
| 4 | **OpenEvidence** | 20M consultations a month (MC 2.2, company claim), free to doctors, could add patient context | Our edge is the patient's own history with provenance |
| 5 | **State rails** (NHS App, ABDM, Malaffi, ePA) | Free, mandated, growing; shrink "records in one place" on a known clock (MC 1.3) | They hold only what enters their system. Germany's ePA is about 4% active (MC 1.3, secondary), so access does not mean use |

My changes to MC's ranking: I move Doctolib up, because BY (which I wrote the same night) calls it the closest threat in Europe and MC's table treats it as a distribution note. The two files should say the same thing.

**Position.** The gap is real but narrow, and it is made of old paper, cross-border and the trust marks. It is not made of "AI that reads your records". A competitor with a large user base can copy the demo's headline features inside a sprint (the CEO review says either Epic or OpenEvidence can build photo-to-history that fast). The durable edge is not in the code. It is in neutrality (no insurer), in the labs and sources we get "verified by source" from, and in being already inside the international-patient workflow.

**Confidence: medium on the map, low on durability.** Medium because the competitor facts come from MC, which marks verified and secondary figures and has a list of what not to use. Low on durability because "no one does X" is an absence of evidence, and BY's buyer evidence is unopened.

**Evidence.** MC sections 1.2, 1.3, 2.1 to 2.5, 3; BY section 0; deck slide 9; CEO review section 2 (steelman B).

**What would change my mind.** Evidence that Epic or OpenEvidence ships patient-uploaded paper intake, that Doctolib ships a doctor-side assistant over its document vault, or that PicnicHealth moves into non-US markets would collapse the gap. In the other direction: three or more doctors saying a competitor does not cover their outside-paper case would raise my confidence to medium on durability.

---

## 4. Value proposition

Built per the Value Proposition Canvas, for the two sides that matter: the doctor (user) and the hospital international-patient department (payer). The patient proposition is in the PRD and the deck and I do not repeat it.

### The test I apply to every claim

A claim only counts as a selling point if the booking, records and AI tools buyers already know do not do it. A feature every competitor has is table stakes. The founder set this rule for pitches on 2026-11-11 (MIN-4372). Applying it here:

| Candidate point | Table stakes or differentiator? | Evidence that it is real (not asserted) |
|---|---|---|
| Photo reads an exam into structured data | **Table stakes within a year.** Gemini or any vision model does it | The demo's own method |
| Patient-held, cross-provider, with the key on the patient's side | Differentiator, **but only in the product**. The demo's key lives on our server (CTO review 2.2, P2 simulated) | MC 3 position 1; CTO review section 6 limits the claim |
| Old paper and foreign records to one history | Differentiator, narrow (PicnicHealth and Eka Care come close) | MC 2.4 |
| Identity match on every exam | Useful, not a moat. It stops a careless claim, not a forger (CEO review row 12) | PRD B1 |
| "Verified by source" versus "uploaded by patient" on each record | Differentiator once real labs sign. Simulated in the demo | PRD B2 |
| Time-limited, in-person, patient-approved access with a log | Differentiator in the privacy promise, easy to copy | PRD D1 to D3 |
| Doctor-only assistant with a cited answer | Table stakes for evidence tools (OpenEvidence cites literature). New only for the patient's own outside history | MC 2.2 |
| No insurer, ever | A real positioning line, and a restriction on who may pay | Founder brief, PRD N3 |

### Doctor (user)

- **Jobs:** know the history fast; trust the source; avoid repeat tests; combine specialties.
- **Pains:** missing outside paper; unverifiable photos; extra steps in a ten-minute visit.
- **Gains:** a two-minute overview with links to the original.
- **Pain relievers:** the cited answer; the provenance mark; no data entry for the doctor.
- **Gain creators:** the cross-specialty view (but see the regulatory note: E1 summary, E4 and E3 sit on the assistant side of the device line, CEO review row 7).

### Hospital international-patient department (payer, hypothesis)

- **Jobs:** collect records before arrival; clean them; hand them to the clinician; convert the inquiry.
- **Pains:** many formats and languages; incomplete records; coordinator time.
- **Gains:** faster quote and intake; fewer lost patients; a privacy-first story.
- **Pain relievers:** a consented, translated record packet sent before arrival; no EHR integration to start (BY 1.7).
- **Gain creators:** a faster first visit; a measurable conversion lift (unmeasured: no number exists).

### The statement (recommended)

"For hospitals that treat patients from abroad, [Name] turns the patient's old paper into one consented, source-marked record the receiving doctor can question, before the patient lands. Unlike hospital portals and national apps, it follows the patient across providers and borders. Unlike AI health assistants, it answers the doctor, not the patient, and no insurer ever sees it."

**Position.** Sell the packet before the arrival, to the department that already asks for records. Keep the "AI assistant" as the demo and not the headline: it is the part competitors will match and the part that triggers the device rules.

**Confidence: low to medium.** The pain is plausible and the buyer behaviour (asking for records in advance) is stated by one named hospital (BY 1.1, yellow). The willingness to pay is untested, and the conversion lift is unquantified.

**Evidence.** BY 1.1, 1.7, 3.6, 4 (pilot 2); MC 3 (positioning lines); PRD A, B, D, E; CEO review rows 7 and 12; CTO review section 6 (claim limits); the founder's 2026-11-11 USP rule.

**What would change my mind.** If two international-patient heads say records are not their bottleneck, the payer story fails and the proposition falls back to doctors and chains. If a hospital says it would rather build this on its own EHR (the main objection in BY 1.1), I move the wedge to labs or telehealth, where BY itself names Doctolib as the competing builder.

---

## 5. Business Model Canvas

All nine blocks, written as a **hypothesis for pilots to test**. No price is sourced, so none is claimed as fact.

| Block | Sales position |
|---|---|
| **Customer segments** | Payers, in order: (1) hospital international-patient departments; (2) multi-specialty clinic chains and telehealth platforms; (3) lab networks as partner and buyer; later (4) national health-data agencies (tender or sandbox). Users who never pay: patients; doctors. Funders, not buyers: EU programmes, WHO network, development banks (BY 1.6) |
| **Value propositions** | Section 4 above. For the payer: a consented record packet before the patient arrives. For the doctor: a cited overview of the full history. For the patient: one record they hold and control |
| **Channels** | Direct, founder-led, to named departments (no outreach started). Innovation gateways (Sheba ARC, Mayo Platform Connect; ARC's reported sale to be checked, BY 3.6). Patient groups for the rare-disease pilot. Labs for source verification |
| **Customer relationships** | Pilot, then annual contract with a named clinical lead. High touch in year 1: the doctor's adoption decides renewal |
| **Revenue streams** | (a) Per-case fee from international-patient departments. (b) Per-doctor seat for clinic chains and telehealth (my $50 per month figure is an assumption set between free tools and EUR109 to 125 scribes, MC 1.2). (c) Partnership or integration fee from labs. (d) Grants for pilots (not revenue). (e) Public agencies via tender, year 2 or later. **Not a line: patient fees; any data sale; insurers (data rule)** |
| **Key resources** | A clinical lead or co-founder (the CEO review's G1 and G2 both require one). The extraction and handshake build. The "verified by source" lab connections. A regulatory adviser |
| **Key activities** | Digitise and match; run the handshake and the log; keep the privacy claims true (CTO review section 6 list); run pilots and collect measured results |
| **Key partners** | Labs (for signed results), innovation gateways, patient groups, a regulatory adviser, import partners among national rails (Malaffi, ABDM, NHS App; BY 1.5). Doctolib as partner or competitor, undecided |
| **Cost structure** | Model calls (Gemini on Vertex EU; no cost figure at scale is sourced), hosting, the deletion and security duties, certification if the assistant ships (MDR notified body, quality system; cost not sourced, PRD Q18), sales and clinical-lead time. CEO review: no health money exists and the studio's capacity is the binding cost |

**Pricing hypothesis I recommend testing** (assumptions, not findings):

1. Test the per-case fee first, on one international-patient department, with no list price: ask what a lost or delayed inquiry costs them today.
2. Test the doctor seat second, anchored against the free tools, in three or more doctors' answers: "would your clinic pay, and at what point does it become too expensive". A formal price survey needs about 30 respondents (the pricing method the skill sets) and is out of reach at G1. Five answers only give direction.
3. Do not put the TAM, SAM or SOM dollar figures on any slide until step 2 has an answer. The deck's slide 8 labels them as assumptions, but MC's own "do not put on a slide" list names them. I recommend following MC and cutting the dollar figures.

**Position.** The business is a provider-paid B2B model with a free patient side. The weak block is revenue: the first payer is plausible but unproven, and the doctor-seat model competes against free tools. The strong block is the cost side only in that it is small until certification.

**Confidence: low.** This is a canvas of hypotheses. BY states that every price, budget owner and sales cycle is a red assumption.

**Evidence.** BY sections 1, 4, 5; MC 1.2 (price benchmarks), 2.1 (competitor revenue models); deck slides 8 and 10; CEO review gates; CTO review sections 2 and 6.

**What would change my mind.** A written expression of interest from an international-patient department with a stated budget owner would raise revenue-stream confidence to medium. A flat "no budget, we build this ourselves" from two of three would shift the model to grants and partnerships and make the venture a funding question, not a sales one.

---

## 6. Market fit scorecard

A rating of where the idea stands today, from 1 (no evidence) to 5 (strong evidence), by Sales. The scale is mine and the numbers are judgements. It is a conversation tool and a baseline to rescore at G1 and G2. It is not a measurement.

| # | Dimension | Score | Why | Source |
|---|---|---|---|---|
| 1 | Problem is real and severe | **4** | WHO and ONC figures are verified. The founder lives it | MC 1.1 |
| 2 | Problem is frequent and widespread | **4** | Multi-portal and multi-condition prevalence verified or CDC secondary | MC 1.1 |
| 3 | Evidence from real users and buyers | **1** | Sample size 0. Not one interview | PRD section 1 |
| 4 | Payer identified and reachable | **2** | Segment named; BY's contacts are public roles only and all yellow or red | BY 1, 3 |
| 5 | Willingness to pay shown | **1** | No price, no letter of interest, no benchmark for this product | BY status line |
| 6 | Differentiation that lasts | **2** | Narrow gaps, copyable features | MC 2, 3 |
| 7 | Competitive pressure manageable | **2** | Epic, OpenAI, Doctolib, OpenEvidence, state rails | MC 3 |
| 8 | Regulatory load manageable | **2** | The assistant's "possible causes" is a device; the line for E1 and E4 is unsettled | PRD 8, CEO review row 7 |
| 9 | Distribution works (two-sided cold start solved) | **2** | A one-sided wedge through the hospital exists on paper; unproven | CEO review pre-mortem 2, BY 4 |
| 10 | Capacity to serve the wedge (clinical lead, money) | **1** | None committed | CEO review section 3 |

**Total: 21 of 50.** Read it as: strong problem, weak evidence of demand. The two 4s are the problem. The three 1s are exactly what G1 and G2 test.

**Position.** The idea has problem-solution plausibility and no market fit yet. That is normal for the day of the hackathon, and it is what the CEO's gates are designed to move. From Sales' side, the evidence that moves the score at G1 (30 Nov) is:

- Row 3: ten interviews (five doctors, five patients), with the same questions every time.
- Row 4: one named international-patient or clinic contact who agrees to a conversation (no outreach is started by this paper).
- Row 5: one written interest from a non-insurer department, ideally with a budget owner. This is the CEO's G1 pass condition.
- Row 10: one clinician willing to be clinical lead or co-founder.

A target for G2 (15 Jan): rows 3, 4, 5 and 10 each at 3 or higher, without any row falling below 2.

**Confidence: medium on the scorecard's shape, low on any single score.** The two high scores rest on verified public facts. The low ones rest on the absence of evidence, which is solid as a statement and thin as a prediction.

**Evidence.** All sections above; PRD sections 1, 8, 9; CEO review sections 1 and 3.

**What would change my mind.** A single strong signal on row 5 (a written commitment to pay for a pilot) moves the whole picture more than every other row together. A failed G1 (fewer than 3 of 5 doctors can say when in a visit they would open it) lowers rows 3, 6 and 9 and supports parking.

---

## Open questions for the founder

These are the questions only the founder can answer. Sales offers no answer to the first five: they are the insurer rule's commercial edges, which stay open, and I neither extend nor narrow the rule. For each I say only what it **costs commercially** to answer either way.

1. **Public payers and national health insurers** (statutory funds, Medicare, EOPYY and similar): does "insurance companies" include them? Commercial effect: removes the year-2 national-agency path only where the agency is a payer (BY section 2, item 1).
2. **Hybrid public bodies** (India's NHA with ABDM and PM-JAY; the NHS as commissioner and provider): may Sales talk to their digital arm only? Commercial effect: they own the rails we would import from (BY section 2, item 2).
3. **Employers with self-funded benefits**: do they count as insurers? Commercial effect: BY 1.9; they are not in my pilot order either way.
4. **A pharma and CRO research line**: allowed at all, and with what deck wording? Commercial effect: none in year 1 (BY 1.10).
5. **Insurer-owned hospital groups**: allowed as providers with a written firewall, or excluded? Commercial effect: a few named targets are affected (BY 1.1; BY 6 already steers around one Greek group).

Separate from the insurer rule:

6. **Seat price.** Do you want the $50 per month assumption kept on any slide, or replaced by the formula only? Sales recommends the formula only, until a doctor or chain gives a view.
7. **The wedge.** Is the international-patient department the right first payer to test, even though many of them sit outside the EU data cell (the CEO review's comment 20 raises this)? A one-line answer from you unblocks the G1 interview plan.
8. **Facts Sales has not verified** and a deck must not use yet: BY's buyer figures (none of its pages was opened that night); the Sheba ARC sale; the AI Act date; the Doctolib document-vault plan. Should the treg pass the brief promised be used to verify the top ten, or is it deferred?
