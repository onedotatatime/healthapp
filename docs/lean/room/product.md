# Health app lean workshops: Product's paper (Back Logakis)

**RECOMMENDED, NOT DECIDED.** Everything below is Product's view. No decision is taken here. The post-hackathon product is not decided: the default is park, and the gates are G0 (15 Nov 2026), G1 (30 Nov 2026) and G2 (15 Jan 2027).

| | |
|---|---|
| **Issue** | MIN-4439 (parent MIN-4435, project "Health app: hackathon prototype") |
| **Seat** | Product (product-minhos, Back Logakis) |
| **Written** | 14 Nov 2026. Run early on the founder's word that day: "Just do the exercise now to have the outcome" (the issue had said to wait for 15 Nov) |
| **Order** | Personas, empathy maps, competitor analysis, value proposition, Business Model Canvas, market fit scorecard (the founder's list, verbatim in MIN-4439) |
| **Read before writing** | `docs/00-founder-brief.md`, `docs/PRD.md`, `docs/research/market-and-competitors.md`, `docs/research/buyers.md`, `docs/reviews/ceo-review.md`, `docs/reviews/cto-review.md`, `docs/deck/deck-content.md` |
| **Not read** | The other seats' papers in `docs/lean/room/`. Each seat records its own view first; Pix compares afterwards |
| **Data** | Strategy only. Every person below is synthetic and invented to make a hypothesis concrete. No real health data, none of the founder's exams, nothing from the `demo` project. Nobody was contacted |

**How to read it.** Each section gives: *position*, *confidence* (low, medium, high) with the reason, *evidence* (the input file and section), and *what would change my mind*. Tags follow the research files: **verified** (a primary source was opened), **secondary**, **assumption**, **inference** (my conclusion). Sample size for patient and doctor evidence is 0 (PRD section 1): no interview has happened. Treat every statement about what people want as a hypothesis.

**The insurer rule.** The data rule is the founder's and it is absolute: "These data should not be accessible to insurance companies as proofs. they should be totally disclosed between the patient and the doctor" (brief; PRD N3a as split in the CEO review, comment 5). I neither extend nor narrow it. The five commercial edges (public payers, hybrid bodies, self-funded employers, a pharma and CRO research line, insurer-owned hospitals) stay open questions for the founder (`buyers.md` section 2). Where one of them touches a point below, I flag it and do not answer it.

---

## 0. Product's scope view in four lines

1. **Jobs the PRD serves well:** digitise once (A1, A2, B1), let a doctor in on the patient's terms (D1, D2, D3), give the doctor a checkable answer (E1, E2).
2. **Jobs the PRD serves thinly or not at all:** the hospital that wants the record before the patient arrives (no organisation account, no coordinator-assisted upload, no translation story); the second specialist who sees the first one's notes (E4 is P1 and cut early; the "see each other's notes" criterion is Scope B); finding similar patients (F is seeded and simulated).
3. **Promise against delivery:** the pitch promises "you hold the key", "closes the gap between doctors" and "rare patterns findable". The demo delivers the first only as a simulation (PRD 10.2, P2), the second partly (E4, P1) and the third from a seeded table. The product can deliver none of the three without work the PRD marks Scope B.
4. **Weakest point of the market fit scorecard:** willingness to pay and distribution. There is no evidence that any buyer pays, and the model that sizes the market (a $600 per-doctor seat) is not the model of the first buyer (a per-case fee). See section 6.

---

## 1. Personas

All synthetic. The first three are the ones I would test first; the last two are there to mark who the product is not for.

| # | Persona (synthetic) | Who | Job they are hiring for | What stops them |
|---|---|---|---|---|
| **P-A** | **Maria**, 52 (the PRD's own demo patient) | Two chronic conditions, sees an orthopaedist and a rheumatologist, 20 years of exams in a folder | "When I see a new doctor, let them see my history without my carrying paper or remembering it" | Photographing dozens of exams for no payback on her side (N1: the patient gets no interpretation); trust in a new app |
| **P-B** | **Karim**, 44, travelling for treatment | Flies abroad for a procedure; his records are in another language, partly on paper | "Make sure the foreign hospital has my history before I land" | The hospital must be willing to read it; translation and format risk (`buyers.md` 1.7) |
| **P-C** | **Eleni**, 38, parent of a child with a rare condition | Holds the thickest archive, has seen the most specialists, waits years for a diagnosis | "Help the doctors compare notes and find someone who has seen this" | Rare cases hide under a group-size threshold (Q6, Q34); consent for the other patient |
| **D-A** | **Dr Costa**, orthopaedist, 10 minutes with a new patient | Reads what came in a bag | "Show me the relevant past and let me check it fast" | Will not install or learn a new tool inside a visit; will not trust an uncited answer |
| **D-B** | **Dina**, head of international patients at a private hospital | The first buyer and also a user | "Get consented records before the patient arrives, in a form my doctors can read" | Her doctors work in the hospital's own EHR; the app must not replace it (N7); records arrive in many languages |
| **Anti-persona** | The patient who wants the app to tell them what is wrong | Not our user | N1 rules it out, by the founder's words: "we dont want them to be their doctor" | n/a |

**Position.**
- **First user: the patient with a thick paper history who is about to see a new specialist (P-A and P-B), reached through a coordinator and not alone.** The patient is the only one who owns the paper, so the product starts with them. But the PRD's patient has no reason to digitise 5 exams in a week unless someone asks them to. The first user who is *asked* is Karim: his hospital's international-patient office tells him to send his records before travel (Cleveland Clinic Abu Dhabi already does, `buyers.md` 1.1).
- **First buyer: the head of international patients at a private or medical-tourism hospital (D-B).** She has a clear revenue reason (foreign patients are about half of Bumrungrad's outpatients on its own FAQ, `buyers.md` 1.7, secondary), a records problem she already feels, and no need to integrate with an EHR to start. This agrees with Marketing (PRD 13.2), the CEO review (section 2, comment 14) and `buyers.md` section 4.
- **The doctor is a user who decides, not a buyer** (PRD 13.2). The doctor in D-B's hospital is the one who must open the record, so the pilot has to be set up so the doctor is already inside it (CEO review, pre-mortem 2).

**Gap I am naming.** The PRD has no story for D-B. Every story A to F is a patient or a doctor story. "An organisation asks a patient for records, helps upload, and sees which arrived" does not exist, and it is the first buyer's whole job. That is a Product miss in my own PRD, and it is Scope B work, not hackathon work.

**Confidence: medium on who the first buyer is, low on who the first user is.** The buyer logic rests on `buyers.md` (all figures secondary or unverified, and the file says no page was opened) plus inference. The user logic rests on the founder's own experience and nothing else (PRD section 1: sample 0).

**Evidence.** PRD sections 1, 2, 6 (A, D, E); PRD 13.2; `buyers.md` 1.1, 1.7, 4; `market-and-competitors.md` 1.1 (59% of US adults have several portals, only 7% combine them, verified ONC 2024; 2+ chronic conditions in 51.4% of US adults, secondary).

**What would change my mind.**
- If the first five patients we ask say the paper is not the pain (their doctors already get the records electronically), the first user is a doctor with a real inflow of outside paper, not the patient.
- If international-patient offices say they already get records through a coordinator and a scanner and are content, the first buyer moves to a rare-disease network or a clinic chain.
- If one doctor says they would open a patient-held record only if their own EHR showed it, the product is an import layer and not an app.

**Cheapest test.** Ten questions to ten people at the event (CEO review comment 17 already asks for the five-and-five written questions): "How many exams do you hold on paper? Where? When did you last carry them to a doctor?" **Metric:** share who hold 5 or more exams as paper or phone photos. **Threshold:** 6 of 10. Below 4 of 10, the "paper" job is too small for a first wedge.

---

## 2. Empathy maps

Hypotheses, not findings. I did not interview anyone. Each cell is written from the founder's brief (his own experience), the PRD, and the research. Where a cell rests only on inference I say so.

### 2.1 Patient (Maria / Karim)

| | |
|---|---|
| **Says** | "I forgot to bring the MRI." "I don't remember when that blood test was." "Do I really have to go through all of this again?" (the founder's own: "I need to tell him my history and dont forget to take my exams with me") |
| **Thinks** | "If a doctor saw everything, they would find it." "Who else will see this?" (privacy is a first-order worry: the founder asked for no insurer access before anything else) |
| **Does** | Keeps a folder, photographs exams on the phone, messages them to the doctor, repeats the history aloud at each visit (inference; no data) |
| **Feels** | Anxious before a new specialist, tired of repeating, wary of handing a record to an app |
| **Pains** | Paper is lost; each doctor asks again; no one sees the whole picture |
| **Gains** | One timeline she can show; control over who looks and for how long; a symptom diary that reaches the doctor in time |
| **The tension** | Her cost is up front (photograph dozens of exams). Her payoff is deferred and goes to someone else (the doctor reads it). N1 removes the one thing a patient app usually gives back, which is an explanation. This is the biggest risk to activation: the Scope B target of 40% digitising 5 exams in week one has no basis (PRD 9, "hypotheses to test"). |

### 2.2 Doctor (Dr Costa)

| | |
|---|---|
| **Says** | "Did you bring the results?" "What did the other specialist say?" "I have ten minutes." |
| **Thinks** | "I cannot read twenty years in a visit." "If this answer is wrong, it is my name on it." "My patients already show me what ChatGPT told them" (the CEO review's early-warning line for failure; inference) |
| **Does** | Works in the hospital EHR; asks the patient; guesses where information is missing (the founder's own phrase: "he make some guesses or missing some info") |
| **Feels** | Time pressure; liability; sceptical of AI that does not show its source |
| **Pains** | Missing history; no view across specialties; one more app to open |
| **Gains** | A one-screen overview; answers that cite the exam; the original document one tap away |
| **The tension** | Every promise to the doctor depends on trust, and the trust marks (identity match, "Verified by source" versus "Uploaded by patient", citations) are the product's best idea. But a doctor who must scan a code and open a second system inside a ten-minute visit may simply not (CEO review, pre-mortem 2). Evidence on doctors: none. |

### 2.3 First buyer (Dina, international-patient department)

| | |
|---|---|
| **Says** | "Please send your last six months of records before you travel." "The files arrive late, in another language, or not at all." |
| **Thinks** | "A missing record costs me a repeat test and an unhappy patient." "I cannot add another system for my doctors." "Where does the data go, and who owns the group?" (the last one touches the insurer-owned hospital edge, left open) |
| **Does** | Chases records by email, translates, forwards to the department |
| **Feels** | Under pressure to convert foreign enquiries into booked patients |
| **Pains** | Late, partial, illegible foreign records; duplicated work-ups |
| **Gains** | A packet that arrives before the patient, consented and readable, with a mark of where each record came from |
| **The tension** | She feels the pain, but has she a budget line for it? `buyers.md` says every budget owner, price and cycle is an assumption. |

**Position.** The three maps agree on one thing and disagree on another. They agree on the *job* (the history should reach the doctor with its source). They disagree on who bears the cost: the patient pays in effort and the doctor in attention, while the one who gains clearest is the buyer. So the product should reduce the patient's effort first (a coordinator helps) and the doctor's attention second (the doctor is already inside the hospital's visit). The empathy map I would put first is the buyer's, because that is where the money would come from if there is any.

**Confidence: low.** All three are built from one person's experience (the founder) and public statistics, not from conversations.

**Evidence.** Brief (the problem in his words); PRD 1, 2, 6, 9; CEO review section 1 (pre-mortem 2 and 4); `buyers.md` 1.1, 1.7.

**What would change my mind.** The first ten interviews (G1). If doctors name a pain other than missing history (for example, trust in the data's origin, or time in the EHR), the doctor map moves to that and the product's centre moves with it. If patients say they would not photograph their exams even with help, the digitise-once promise is weaker than the deck says.

**Cheapest test.** Ask each G1 interviewee the same two behaviour questions, never "would you use it": "Tell me about the last time you had to bring or send records. What happened?" **Metric:** share of interviewees who describe a specific recent failure without being prompted. **Threshold:** 3 of 5 per side. Fewer means the pain is real in statistics and not in a person's week.

---

## 3. Competitor analysis

**Position.** The real competitor is not another app. It is the **substitute**: a folder, phone photos, the portal of each provider, and, for the patient, a chat assistant. The apps that matter are the ones that could add the missing piece in a sprint, not the ones listed side by side. My ranking of danger differs from Sales' only in emphasis:

1. **Doctolib** (EU): same promise (patients centralise documents, `buyers.md` section 0), far larger reach, already holds doctors. The nearest threat in Europe.
2. **Epic (MyChart, Emmie, Art), OpenAI ChatGPT Health, OpenEvidence** (US): the platforms (`market-and-competitors.md` 3).
3. **State rails going patient-facing** (NHS App single record 2028, EHDS 2029 and 2031, ABDM, Malaffi): they make "records in one place" free on a known clock.
4. **PicnicHealth and Eka Care**: the nearest on "digitise old records", in the US and India.

**Where each covers the jobs** (Product's lens: jobs, not features). A full circle means a shipped capability reported in the research; a half circle means partial; blank means not found. This is gap-based, as in Sales' file, and it is not a numeric score.

| Job | Substitute (folder, photos) | Provider and state apps | Doctolib | Epic / Art / Emmie | ChatGPT Health and similar | OpenEvidence | PicnicHealth / Eka | **Us (demo)** | **Us (product, after work)** |
|---|---|---|---|---|---|---|---|---|---|
| Old paper into a timeline | half | blank | planned | blank | blank | blank | half | **full (synthetic)** | needs real accuracy |
| Doctor-side answer from this patient's record | blank | half (one system) | planned | half (one system) | blank (patient-side) | blank (literature, not the patient) | blank | **full** | needs MDR review for anything that ranks |
| In-person handshake, patient decides | n/a | blank | blank | blank | blank | blank | blank | **full** | needs doctor identity (Q5) |
| Source mark per record | blank | n/a (they are the source) | blank | n/a | blank | blank | blank | simulated | needs real lab or rail source (Q4) |
| Works across borders and providers | half | blank | blank | blank | blank | n/a | half | demo only | EHDS and rails import |
| Specialist-to-specialist view | blank | blank | blank | half | blank | blank | blank | half (E4) | Scope B |
| Opt-in matches for care | blank | blank | blank | blank | blank | blank | blank (PLM-type nets exist) | seeded | Scope B, ethics review |

**What the table says.** The empty cells are real gaps in what Sales reported, and the column "Us (demo)" is the only one that is full. But two warnings. (1) *Absence of a pure-play is a weak signal.* `market-and-competitors.md` 2.4 says paper digitisation is "a feature inside others, not a funded category". An empty category can mean a missed market or a market too small to fund. We cannot tell which. (2) *Do not say "only" or "first".* Sales' own method note says the research found no proof either way; the deck already follows that rule.

**Confidence: medium.** The competitor facts are well sourced for the large players (verified where noted) and weak for pricing and user counts (conflicting across sources, in Sales' "do not use" list). The reading of the gap is mine and rests on public pages, not on a buyer or doctor telling us what they use.

**Evidence.** `market-and-competitors.md` sections 2, 3, 5; `buyers.md` section 0; deck slide 9; CEO review section 2 (steelman B and C).

**What would change my mind.**
- A doctor says "the Epic summary plus my patient's own chatbot printout is enough". Then the doctor-side value is small and the wedge is only the international and paper cases.
- A funded entrant ships paper capture together with a doctor handshake (the nearest today are PicnicHealth and Eka Care, who have one of the two).
- Doctolib ships its document vault in the EU with a doctor-side assistant. Our EU entry then depends on privacy and cross-border, not on "a vault".

**Cheapest test.** In each doctor interview ask: "What did the last patient who brought paper do, and what did you use?" and "What do your patients show you from a chatbot?" **Metric:** share of doctors who say a current tool or a patient's chatbot answer already gives them enough. **Threshold:** if 3 of 5 do, lower the differentiation score in section 6 by one point and treat the doctor assistant as a feature for someone else's tool (the CEO review's steelman B).

---

## 4. Value proposition

**Position.** The strongest and most defensible promise is narrower than the deck's. I recommend leading with this order, as a hypothesis:

1. **For the hospital buyer:** "The patient's history arrives before the patient does, consented, readable, and marked with where each record came from."
2. **For the doctor:** "Ask the history a question. Every answer shows the exam it came from." (PRD 13.3 pillar 2).
3. **For the patient:** "Photograph your exams once. Only the doctor you let in sees them, and only for as long as you say." (Marketing's wording; the true version for the demo, per the CEO review comment 6.)

I would hold back, in year-one copy, the lines that are not delivered today: "you hold the key" (simulated in the demo, partly true in the product, Q30), "close the gap between specialists" (E4 is P1) and "rare patterns become findable" (seeded).

**Value proposition canvas, in short.**

| | Patient | Doctor | Hospital buyer |
|---|---|---|---|
| **Jobs** | Bring my history; decide who sees it | See the relevant past fast; check it | Get records before arrival; fewer repeat tests |
| **Pains** | Carrying paper; repeating; privacy | No history; time; liability | Late, partial, foreign records |
| **Gains sought** | One timeline; a diary the doctor sees; control | Overview; cited answers; the original | A readable packet; faster first visit |
| **Pain relievers (PRD)** | A1, A2, A3, C1, D1, D2, D3 | E1, E2, B2 (provenance marks) | **none as a story** |
| **Gain creators (PRD)** | Time-limited access, access log | Citations; "not in this record" instead of a guess | **none as a story** |

**Promise against delivery.** Product's honest table. "Demo" means the hackathon build on synthetic data; "product" means after Scope B work.

| Promise (source) | Demo delivers | Product needs |
|---|---|---|
| "One photo in, one history out" (13.3) | Yes, synthetic, 3 exam types (A1, M2) | Accuracy bar on real documents, PDFs, handwriting, multi-page (A1 Product, M2 at 98%) |
| "The doctor asks, every answer shows its source" | Yes (E2, M5 at 100% on the story) | Doctors who open the citation (70% target, hypothesis) |
| "Nobody claims someone else's exam" | Stops a careless claim, not a forger (Backend, CEO comment 12) | Proven account identity (Q3) |
| "Verified by source" | One seeded record, issuer simulated (Q4) | A lab signature, QR, or national system; no lab or rail partner exists yet |
| "You hold the key" | **No: simulated** (10.2 P2) | Key on the device and a model that still must read the data (Q1, Q29 key recovery) |
| "Close the gap between doctors" | Partly (E4, P1, cut early) | Notes seen by both doctors only if the patient allows (Scope B) |
| "Possible matches" | Seeded set | k-anonymity, blind introduction, ethics review, counsel (Q6, Q34) |
| "Possible causes" | Yes, doctor only (E3) | **A medical device** (EU MDR, with AI Act duties): certification, cost and time unknown (Q18) |

**What the table shows.** The demo is honest where it is real: capture, identity match, handshake, cited answer. The three promises that carry the *emotional* weight of the founder's idea (the key, the cross-specialty bridge, and finding someone with the same pattern) are the three least delivered. The one promise that is most impressive on stage, possible causes, is the one that becomes a regulated device. Product therefore recommends, as the CEO review and the CTO already lean, that the record, the handshake and the provenance marks are the product, and the assistant is a part that can be swapped for the doctor's own tool (CEO review comment 18).

**Confidence: medium.** The delivery table is firm; it is built from the PRD's own real/simulated sections (10.2) and I have not changed its content. The ordering of the promises is a judgement with no user evidence.

**Evidence.** PRD 4, 6, 7, 8, 10.2, 13.1 to 13.3; CTO review section 6 (allowed, product-only and forbidden privacy claims); CEO review sections 2 and 5 (comments 6, 7, 12, 18); deck slides 4, 6, 12.

**What would change my mind.** If the first doctors say that possible causes is the reason they would open the app and cites alone is not, the value proposition is a device value proposition and the cost of certification (Q18) becomes the main business question, not a closing slide. If patients value the access log and the time limit more than the timeline, the privacy layer is the lead, not the digitising.

**Cheapest test.** Present three one-line value propositions (buyer, doctor, patient version) to the G1 interviewees and ask each to rank them and say what they would do next. **Metric:** share who, unprompted, ask a next step (a pilot, an introduction, a trial) after the line meant for them. **Threshold:** 3 of 5 doctors; 1 buyer-side written expression of interest (the G1 bar).

---

## 5. Business Model Canvas

Every revenue and cost entry is a hypothesis. No price is sourced (`buyers.md` status line). The insurer data rule holds in every block. The five commercial edges are open and I touch none of them; the one place where one of them matters is flagged in "Customer segments".

| Block | Product's position |
|---|---|
| **Customer segments** | **First:** hospital international-patient departments (per case). **Next:** multi-specialty clinic chains and telehealth platforms (per seat); lab networks (partnership; also the "verified by source" supplier); rare-disease networks (free pilot, grant-funded). **Not year one:** national agencies (tender cycles of 12 to 30 months, `buyers.md` 1.5). *Flag, not a decision:* some hospital groups are insurer-owned or insurer-adjacent (`buyers.md` 1.1). Whether such a group may be a first customer is one of the five open founder questions. |
| **Value propositions** | Section 4: history arrives before the patient; answers with source for the doctor; patient decides access. |
| **Channels** | Hospital international-patient offices (direct, with a clinical champion); innovation gateways as validation doors (Sheba ARC and Mayo Platform Accelerate, `buyers.md` section 4, with the unconfirmed sale of ARC flagged); patient associations. Nothing has been contacted. |
| **Customer relationships** | Concierge onboarding for the patient through the buyer's coordinator; the doctor is already in the visit; pilot-first, 2 to 4 months (a department, not the hospital). |
| **Revenue streams** | Per-case fee (hospital); per-doctor seat (chains, telehealth); partnership or integration fee (labs); grants for the privacy-first pilot (not revenue). **Patient free** (the brief and `buyers.md` section 5). **Mismatch to flag:** the deck sizes the market as a $600 per-doctor seat (TAM $8.5B, SAM $1.9B, SOM $19M, all assumptions, deck slide 8), but the first buyer pays per case. The pool for the actual wedge (foreign patients per hospital times a per-case fee) has not been sized at all. The seat model is anchored against free tools (OpenEvidence is free to doctors, Glass is free for US verified clinicians, `market-and-competitors.md` 1.2), which makes a seat the *hardest* thing to sell. |
| **Key resources** | Extraction accuracy on real documents; the trust marks (identity match, provenance, citations); regional hosting (EU first, Q33); a clinician co-founder or lead (the CEO review's G1 and G2 condition); a regulatory adviser. |
| **Key activities** | Digitising and verifying; running a coordinator-assisted intake for one hospital; building one lab or rail import for "verified by source"; the DPIA before any third person's data (CEO review kill criteria). |
| **Key partners** | A hospital pilot partner; one lab or national rail for source verification; a patient association; a clinical lead; counsel. |
| **Cost structure** | Model inference (credits cover the weekend only); regional hosting and security review; a DPIA and counsel; a regulatory adviser; certification cost and time for any ranking or possible-causes function: **unknown, Q18 is open**. Founder time: about 4 hours a week through G1 (CEO review gates). |
| **Unfair advantage / moat** | Not records: state rails will make "we hold your records" free (`market-and-competitors.md` 1.3). The candidate moats are patient control, old paper and foreign records, and the trust marks. None is proven. |

**Position.** The business model is a pilot-first, buyer-funded model with a free patient side, and the honest word for it today is *unvalidated*. The most important change I recommend to the story, not to the demo: size the wedge buyer's pool before showing a dollar figure again, or drop the dollar figures and keep the verified physician count and the formula (the choice is Q24, already open).

**Confidence: low.** There is no price evidence, no budget-owner evidence, and sample size 0. Even the segment order is built from public pages Sales did not open.

**Evidence.** `buyers.md` sections 1, 4, 5; `market-and-competitors.md` 1.2 and 5; deck slides 8 to 11; PRD 9 (Scope B metrics), 17 (Q17, Q18, Q24, Q33); CEO review comments 14, 20 and the gates.

**What would change my mind.**
- A buyer names a budget line and an owner for records chasing, and a per-case figure. The revenue block firms up.
- Every international-patient office we ask says the records are the doctor's problem, not theirs. The first buyer moves to a clinic chain and a seat price against free tools has to be proven.
- Counsel says even retrieval and cited summaries need device status. The cost structure and the timeline change completely, and the Business Model Canvas becomes a regulatory financing question.

**Cheapest test.** In each of the first five buyer-side conversations (to be run after the hackathon and outside this run, when the founder decides), ask: "What does one foreign patient's late or missing record cost you today, and which budget does it come from?" **Metric:** number of buyers who give a figure and name an owner. **Threshold:** 2 of 5. Below that, the revenue block is a story.

---

## 6. Market fit scorecard

**Position.** My scorecard puts the idea at **49 out of 100**, which is below the line where I would say "build". That agrees with the park-by-default recommendation, and I want to be exact about what it means: it is a *prior*, and every score except problem severity is a judgement with no evidence behind it. It is meant to show where to look, not to forecast.

**Scoring.** Each dimension is scored 1 (no evidence, or against) to 5 (strong, evidence in hand). The score is weighted and converted to 100. Weights are mine and sum to 100.

| # | Dimension | Weight | Score (1-5) | Weighted | Confidence in the score | Reason (and the input) |
|---|---|---|---|---|---|---|
| 1 | Problem severity | 15 | **4** | 12.0 | medium | WHO (about 1 in 10 patients harmed; diagnostic error in 5 to 20% of encounters, verified), 59% of US adults with several portals and 7% combining them (verified ONC 2024). General problem verified; this specific job (paper history reaching the doctor) not measured |
| 2 | Reach of the problem | 10 | **3** | 6.0 | low | Chronic multi-condition adults and cross-border patients are large (secondary), but the paper-first share is unknown (open item 2 in the research) |
| 3 | Willingness to pay (first buyer) | 20 | **2** | 8.0 | low | No price, no budget owner, no buyer conversation. Free tools set the anchor for seats (OpenEvidence, Glass). Per-case demand for the wedge is unsized |
| 4 | Solution fit (demo today, product after) | 15 | **3** | 9.0 | medium | Strong demo on the real parts (capture, match, handshake, cite). Patient gets nothing back (N1). Doctor adoption untested. Real-document accuracy unmeasured (M2 is synthetic; M2b is new) |
| 5 | Differentiation and defensibility | 10 | **2** | 4.0 | medium | Platforms and rails come on a known clock. Gap is real in the table of section 3; the moat is unproven; the nearest competitors have half the idea |
| 6 | Distribution and activation (two-sided cold start) | 15 | **2** | 6.0 | medium | No channel is open; no doctor on the team; no coordinator model in the PRD (section 1, gap) |
| 7 | Regulatory burden and timing | 5 | **2** | 2.0 | medium | Possible causes is an MDR device; where retrieval ends is open (Q18); EHDS 2029 and 2031 is a tailwind for ingestion and a threat to the moat |
| 8 | Team and capacity | 10 | **1** | 2.0 | high | Solo founder, no clinician, no health money; his time is committed to two other products (CEO review section 3) |
| | **Total (weighted score out of 5, times 20)** | **100** | | **49.0** | | 245 divided by 5 = 49 |

**Decision bands (Product's, proposed).** 70 or more: pursue. 50 to 69: test one assumption at a time before spending. Below 50: park and watch. **The scorecard reads park, one point under "test", and the gap is within the noise of my own guessing.** I would not defend the 49; I would defend the ranking of what is weakest.

**Where it is weakest, in order.**

1. **Team and capacity (1).** Not a market fact, but it decides whether a good market matters. This is the CEO review's pre-mortem 1 and the reason for the gates.
2. **Willingness to pay (2, weighted highest).** Nothing in the file shows a buyer paying for this. It is the single most expensive thing to be wrong about.
3. **Distribution and activation (2).** Two-sided cold start with no doctor, and a patient whose payoff goes to someone else.
4. **Differentiation (2).** Real gap, short clock.

**The riskiest assumptions and the cheapest way to test each.** Ranked by how much a wrong answer costs against how little we know. Every experiment here is for the gates, costs hours, not money, and is run after the hackathon at the founder's call. None needs real health data, and none contacts anyone in this run.

| # | Assumption | Cheapest test | Metric | Threshold to proceed | Gate |
|---|---|---|---|---|---|
| R1 | A hospital pays for records that arrive before the patient | Five buyer-side conversations (founder-led, after G0) | Buyers who give a cost figure and name a budget owner | 2 of 5; plus 1 written pilot interest (the G1 bar) | G1 |
| R2 | A doctor opens a patient-held record in a real first visit | Walk five doctors through the synthetic demo; ask when they would open it and who pays | Doctors who name a moment in a first visit and a payer | 3 of 5 (the G1 bar) | G1 |
| R3 | Patients with paper will digitise 5 or more exams | Ask ten people at the event about their paper; later a concierge test only after a DPIA | Share holding 5 or more exams on paper or photo; later, activation in week one | 6 of 10 now; 40% activation after launch (PRD target, placeholder) | G1, then product |
| R4 | The reader is accurate enough on real documents | The founder's own M2b result at the event, reported as measured; no agent reads the real exams | Field accuracy after patient correction, on name, ID, date, values | 98% (the PRD's Scope B bar) before any launch | G0 |
| R5 | Doctors trust and check the cited answers | In the role-play, count whether the doctor opens citations and what he says | Sessions in which a citation was opened; the doctor's words | At least 1 doctor, verdict recorded; 70% of sessions as a hypothesis after launch | G0 |
| R6 | Cited retrieval stays outside the device rules; only ranking and possible causes are inside | A regulatory adviser's first opinion | A written opinion with a cost range and time | Received by G2, with a cost the founder accepts | G2 |
| R7 | The platforms and the rails do not close the gap within the pilot horizon | Count how many doctors say a chatbot printout or a vendor summary is enough | Share who say it is enough | Fewer than 3 of 5 | G1 |
| R8 | A seat price survives free tools | Not tested; a per-case fee for the wedge is tested instead (R1) | n/a | Drop the dollar figures from slides until R1 passes (Q24) | before G2 |

**Confidence: medium on the ranking of the weak spots, low on the absolute score.** The weak spots are the same ones the CEO review (pre-mortem, gates), the CTO review (real data, device line) and Sales' own "do not put on a slide" list point to, so three independent inputs agree. The absolute 49 is my judgement.

**Evidence.** `market-and-competitors.md` sections 0, 1, 3, 7; PRD 1, 9, 17; CEO review sections 1, 3, 5; CTO review sections 1, 6; deck slides 8, 10.

**What would change my mind (about the score and the verdict).**
- Raise it: a clinician joins as lead; one buyer writes down a pilot and a figure; an adviser says retrieval with citations is outside the device rules. Any two of those move the verdict to "test".
- Lower it: the role-play doctor says the same answer is already in his EHR summary; interviewed buyers say records are not their problem; or the work after the weekend slips a minhOS or TravelHood commitment (the CEO review's kill criterion).

---

## 7. What I recommend, and what I do not decide

Recommended, not decided:

1. **Keep the CEO's gate structure** (G0 15 Nov, G1 30 Nov, G2 15 Jan) as the way to test the eight assumptions above, in the order R4 and R5 at G0, R1, R2, R3, R7 at G1, R6 at G2.
2. **Name the first buyer as hospital international-patient departments and write the missing story for them as a Scope B epic** (an organisation account, a coordinator-assisted intake, per-language handling). Do not build it before G1 passes.
3. **Re-order the value proposition** as in section 4, and hold the three under-delivered lines (the key, the specialist bridge, findable rare patterns) out of year-one copy until built.
4. **Size the wedge buyer's pool or drop the dollar figures** from slides until a buyer has given a figure.

Not mine to decide, and left open: the post-hackathon product, the insurer commercial edges, the AI-endpoint and cost questions (CTO and CEO sections), the name, and the ask.

### Open questions for the founder

1. **Activation payoff.** N1 gives the patient no interpretation. Would you allow one patient-side benefit that interprets nothing, for example a printable visit pack of the patient's own exams and diary, to be shown to a doctor who does not use the app? It would raise activation (R3) and also reduce the need for the handshake, which is the product's signature move. This is your rule to bend or keep.
2. **The first buyer and the insurer edges.** Hospital groups can be insurer-owned. I have not answered that edge; it is one of your five open questions, and it now sits on the path to the first buyer, so its answer changes who we may pilot with.
3. **Seat or case.** The deck sizes a seat market; the wedge is per case. Do you want the dollar figures on slides before one buyer gives a number (Q24)?
4. **A clinician.** The scorecard's lowest line is not a market fact. Is a clinical co-founder or lead a condition for continuing, as the CEO review proposes at G2?
