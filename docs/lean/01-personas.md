# Workshop 1 · Personas

**Status: recommended, not decided.** The founder decides on MIN-4442. The post-hackathon product is not decided either (park by default; gates G0 15 Nov, G1 30 Nov, G2 15 Jan).

| | |
|---|---|
| **Facilitator** | Pix Elidis (Design), MIN-4441, parent MIN-4435 · 14 Nov 2026 |
| **Room** | CEO (`room/ceo.md`), Marketing (`room/marketing.md`), Sales (`room/sales.md`), Product (`room/product.md`), CTO (`room/cto.md`). All five papers exist; no seat's view is written for it |
| **Data** | Every person below is **synthetic**. No interview has happened (PRD §1: sample size 0). Nothing from the founder's exams or the `demo` project. Each card is a hypothesis to test at G1 |
| **Names** | The seats used different names for the same role. The room uses one name per card and lists the seats' names so each paper stays traceable |

---

## 1. The cards

Seven cards and two anti-personas. Ordered by the room's test order, not by importance on stage.

### B1 · Layla, head of international patients at a private or medical-tourism hospital · **first buyer to test**

| | |
|---|---|
| **Seats' names** | CEO "Eleni" (P3) · Sales "Layla" (P5) · Product "Dina" (D-B) · Marketing B1 · CTO "the wedge buyer" |
| **Situation** | Runs the department that receives foreign patients. Records arrive late, partial, on paper, in other languages. Bumrungrad says about half its outpatients are international (own FAQ, secondary); Cleveland Clinic Abu Dhabi asks for six months of records before travel (secondary, page not opened) |
| **Job** | "A complete, consented, readable file before the patient lands, so my doctor can judge the case" |
| **Pains** | Chasing by email and messenger; translation; repeat work-ups; one more system for her doctors |
| **Gains** | Faster intake and quote; fewer lost enquiries; a privacy-first story |
| **Today uses** | An inbox, a messenger, translators, the hospital's own app and EHR |
| **What stops her** | "We have our own EHR and app" (`buyers.md` 1.1); many formats and languages (1.7); legal ("is it a medical device?"); **the product opens a record only in person** (PRD P6, story D1) |
| **Role in money** | Economic buyer, per-case fee (hypothesis). Around her: the chief medical officer, IT, legal |
| **Constraint (CTO)** | She wants the history *before* arrival. That needs a remote grant, which removes the in-person control and is not written (CTO §1.3) |
| **Confidence** | Medium that she is the right first buyer (four seats reach her independently). Low that she pays: no buyer has been asked |

### D2 · Rania, the coordinator in that department · **daily user on the hospital side**

| | |
|---|---|
| **Seats** | Marketing (new card D2) · CEO (the coordinator team that "can do the digitising") · CTO (the helper who is not a clinician) · Product (coordinator-assisted intake, named as a missing story) |
| **Job** | "Get the file complete without chasing" |
| **Does** | Asks the patient for records, chases, arranges translation, passes the case to a clinician |
| **Why she matters** | She is the one person who can do the digitising work the patient will not do alone. That is the route around the two-sided cold start (CEO §2) |
| **Constraint (CTO)** | The access model gives keys only to verified clinicians (PRD 10.B.6, control 3). A non-clinician helper has no designed role. Safe default: she helps on the patient's own device with no access of her own |
| **Confidence** | Low. Rests on what hospitals publish, not on anyone's working day |

### P2 · Karim, the travelling patient · **first user who is asked**

| | |
|---|---|
| **Seats' names** | Sales "Karim" (P2) · Product "Karim" (P-B) · Marketing P2 "the travelling patient" · CEO (implicit in the buyer card) |
| **Situation** | Goes abroad for a procedure. Records from home, partly on paper, often in another language |
| **Job** | "Make sure the foreign hospital has my history before I land" |
| **Pains** | Does not know what the hospital needs; pays for translation; unsure it is safe to send |
| **Gains** | A packet the receiving doctor can read; no retelling on arrival |
| **What stops him** | Same as B1: "ahead of the visit" and translation are not built |
| **Confidence** | Low. The only card with an asker, a deadline and a possible payer (Marketing §1.3) |

### D1 · Dr Nikos, the first-visit specialist · **the user who decides it is worth opening**

| | |
|---|---|
| **Seats' names** | CEO "Dr. Nikos" · Sales "Dr. Neri" (P4) · Product "Dr Costa" (D-A) · Marketing D1 |
| **Situation** | Orthopaedics, rheumatology, internal medicine. Ten-minute first visit, a new patient with an outside history in a bag. Chart review is about a third of record time per visit (5 min 22 s of 16, US, vendor-authored, secondary) |
| **Job** | "Tell me what I'm missing, and show me the page" |
| **Pains** | Missing history; no view of what the other specialty found; liability for an AI answer; another login inside a ten-minute visit |
| **Gains** | The history in seconds; each answer opens the original |
| **Today uses** | What the patient brings; his own EHR; OpenEvidence, Glass (free to clinicians), a scribe, a patient's chatbot printout |
| **Constraint (CTO)** | Works on a machine we do not control: often no camera, no install rights, a locked browser. The doctor side stays a web app with three ways in (webcam, phone, typed code) |
| **Role in money** | User, rarely payer. His employer pays (Sales, Product, CEO agree) |
| **Confidence** | Low that he opens it in a first visit. No G0 result in any paper |

### P1 · Maria, the courier · **the story persona, free user**

| | |
|---|---|
| **Seats** | All five ("Maria" is the PRD's synthetic demo patient) |
| **Situation** | 50s, two chronic conditions, an orthopaedist, a rheumatologist and a GP, two portals, a folder. 51.4% of US adults have 2+ chronic conditions (secondary); 59% have several portals, 7% combine them (ONC 2024, verified) |
| **Job** | "Get the new doctor up to speed without me being the courier and the memory" |
| **Pains** | Retelling at every first visit; lost papers; two specialists who never meet |
| **Gains** | A doctor who already knows her history; a say over who looks and for how long |
| **What stops her** | Photographing years of paper for no payback on her side (non-goal N1: no explanation back). Nobody asks her to do it |
| **Constraint (CTO)** | The patient with the most paper is often the least able to digitise it. She needs a helper (P3's caregiver or D2) |
| **Role in money** | Never pays |
| **Confidence** | Medium that the pain is real (verified statistics). Low that she does the work unasked |

### P3 · Sofia, the family archivist (caregiver) · **the most motivated card, refused by the product today**

| | |
|---|---|
| **Seats' names** | CEO "Sofia" (P4) · Sales "Ioanna" (P3) · Product "Eleni" (P-C) · Marketing P3 "the family archivist" |
| **Situation** | Parent of a child with a rare disease, or adult child of an elderly parent. Holds the thickest archive. Rare-disease diagnosis takes 4.7 years on average in Europe (EURORDIS 2024, verified) |
| **Job** | "Let each new doctor see everything; find others with the same pattern" |
| **What stops her** | **The app refuses an exam that is not the account holder's** (PRD B1, the founder's own must-have). Dependants are scope B (PRD Q3). Rare cases also hide under the group-size threshold for matches (Q6, Q34) |
| **Role in money** | Not a payer. A patient group may sponsor a pilot (Sales); her organisation has no budget (CEO) |
| **Confidence** | Medium on the pain, which is verified. The fit is blocked by a product rule, not by the market |

### B2 · Omar, medical director of a 10-clinic chain · **second payer, hypothesis**

| | |
|---|---|
| **Seats** | Sales (P6). CEO, Product and Marketing name clinic chains as the next or fallback segment without a card |
| **Job** | "Cut repeat tests and first-visit time across sites, with no IT project" |
| **What stops him** | A per-doctor seat sold next to free clinician tools; decides in 2 to 6 months (`buyers.md` 1.2, a red guess) |
| **Confidence** | Low |

### Anti-personas (no card)

| | Why | Seats |
|---|---|---|
| **The answer-seeker** | Wants an app to explain results or say what is wrong. Ruled out by N1 ("we dont want them to be their doctor"). Our copy must not attract this person; a patient chatbot serves them | Product, Marketing |
| **An insurer** | The founder's data rule: "These data should not be accessible to insurance companies as proofs." No insurer is an audience or a reader. The five commercial edges (public payers, hybrid bodies, self-funded employers, a pharma and CRO line, insurer-owned hospitals) stay **open**; no card is written for any of them | CEO, Marketing, Sales, Product (CTO takes no position) |

---

## 2. Where the seats agree

1. **The first buyer is the head of a hospital's international-patient department.** CEO, Sales, Product and Marketing reach it independently; the CTO accepts it and names what it costs technically. It is the one card with a revenue reason and someone who can do the digitising.
2. **The doctor is a user who decides, not a payer.** All five.
3. **Maria is the face of the story and not the first market.** Marketing says so outright and corrects its own PRD §13.2 table; CEO calls P1 "a consequence rather than a launch audience"; Sales keeps her "as the face of the demo"; Product starts with her but "reached through a coordinator and not alone".
4. **There is a missing card: the coordinator or helper.** Marketing adds it, the CEO builds his wedge on her, Product names the missing story (an organisation account and coordinator-assisted intake), the CTO says the access model has no role for her.
5. **Synthetic only, sample size 0.** Every seat marks its personas as hypotheses with low confidence.

## 3. Where the seats disagree

| Question | Side A | Side B | Side C |
|---|---|---|---|
| **Who is the first user?** | **The coordinator** is the first to test: CEO ("test P3 first, P2 second, treat P1 as a consequence"); Marketing (D2 is the daily user and champion) | **The patient with a thick paper history, reached through a coordinator**, and the first one *asked* is Karim: Product | **The doctor**, because his adoption "decides everything": Sales (leads the story with the payer and Karim, but rates the doctor as the deciding user) |
| **What happens to the first persona if "in person" stays absolute?** | Marketing: the honest first persona becomes **"Maria, invited by a clinic"**, which the product serves as built | CTO: the wedge needs a remote grant; Product must choose | CEO, Sales, Product: carry Karim and the buyer without changing the persona |
| **The caregiver** | Marketing: the most motivated card, and the product refuses her; **write no rare-disease message until dependants exist**. CTO: dependants and a helper role are open (Q3) | CEO, Sales, Product: carry the caregiver card (and a rare-disease pilot) without noting that story B1 refuses her exams | — |
| **Second payer** | Clinic chains and telehealth: Sales (with a card), CEO, Product | Marketing: a multi-specialty clinic, chosen because it needs **no product change** | Product also names a rare-disease network as a fallback buyer |

## 4. The room's recommendation

1. **Test three cards first, in this order: B1 Layla (buyer), D1 Dr Nikos (the user who decides), D2 Rania (the coordinator).** This joins the CEO's order (buyer, then doctor) with Marketing's and the CTO's point that the person who does the work is neither the patient nor the doctor.
2. **Keep Maria as the stage persona.** Do not size or message a market around her until a patient says she would photograph her folder unasked.
3. **Hold the first-user question open until the founder answers "in person or ahead".** If "in person" stays absolute, the honest first user is Marketing's "Maria, invited by a clinic" and the fallback buyer is a multi-specialty clinic. If a time-limited remote grant is allowed, Karim through Layla's department leads.
4. **Write no message to rare-disease families until dependants are decided.** Keep Sofia as the card with the strongest pain, marked "blocked by PRD B1".
5. **Product writes the missing coordinator story only after G1 passes** (Product's own recommendation, Scope B).

**Riskiest assumption:** a patient will digitise years of paper when someone she trusts asks her to, and not otherwise (Marketing's "asker", CEO's coordinator route). **Test:** in the G1 interviews, ask patients what would make them photograph the folder. **Metric:** patients who name a person who asks, not a feature. **Threshold:** 3 of 5. **Gate:** G1. Full test list in `06-market-fit-scorecard.md`.

## 5. Open questions for the founder

1. In person only, or a time-limited remote grant to a named department before the visit? It decides the first user. (Marketing, CTO, Product)
2. Are dependants part of a first product? It decides whether the caregiver card can be served. (Marketing, CTO)
3. The insurer-owned hospital edge sits on the path to the first buyer, because some hospital groups are insurer-owned (Product). It stays **open**; the room does not answer it.
