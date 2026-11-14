# Lean room: the CTO's seat paper (feasibility and regulation)

**Status: recommended, not decided.** Nothing here is a decision, a commitment to build, or legal advice. The post-hackathon product is not decided (park by default; gates G0 15 Nov, G1 30 Nov, G2 15 Jan).

**CTO · MIN-4440 · 14 Nov 2026.** Written before reading any other seat's paper. The issue asked for this after the hackathon; the founder moved it forward today: "Just do the exercise now to have the outcome".

**Inputs read:** `docs/00-founder-brief.md`, `docs/PRD.md` (sections 1 to 9, 10 Part B, 17), `docs/reviews/cto-review.md`, `docs/reviews/ceo-review.md`, `docs/research/market-and-competitors.md`, `docs/research/buyers.md` (headings and the insurer section only), `docs/deck/deck-content.md` (slides 10 and 12).

**Three limits on everything below.**
1. No real health data was read. The founder's exams and the `demo` project are outside this paper. I do not know the result of the role-play with a doctor.
2. Interviews with patients or doctors: 0 (PRD section 1). Every adoption claim is a hypothesis.
3. The cost and time figures for certification are **my own estimates from general industry knowledge**. No file in the repo sources them (PRD Q18 is still open). They show the order of magnitude and must be replaced by a regulatory adviser's quote (gate G2 already asks for that opinion).

**The insurer DATA rule** is the founder's and is absolute. This paper neither extends nor narrows it, and takes no position on the five open commercial edges.

---

## 1. Personas

**Position.** Three technical facts should shape the personas. Without them the personas describe people the product cannot serve as designed.

1. **The doctor works on a machine we do not control.** A hospital PC often has no camera, no install rights and a locked browser. The doctor side must stay a web app with three ways in (webcam, a phone, a typed code), as at the event (`cto-review.md` section 5, Q11 and F-Q6).
2. **The patient with the most paper is the one least able to digitise it.** Twenty years of exams belong to older and chronic patients. They will need a helper: a relative, or the hospital coordinator in the CEO's wedge (`ceo-review.md` section 2). Neither helper exists in the access model. PRD 10.B.6 control 3 gives keys only to verified clinicians, and dependants are an open question (Q3). A coordinator who is not a clinician needs a designed role: helping on the patient's own device with no access of their own is the safe default.
3. **The wedge is not in person.** The international-patient department wants the history "before the patient does" (deck slide 10). The handshake is an in-person scan (PRD story D, principle P6). So the first buyer needs a remote grant. That is buildable (a link plus the patient's approval on their phone), but it removes the "you were in the same room" control, and Product has not written it.

**Confidence:** medium. The technical facts are certain; how much they matter depends on who the first buyer really is.
**Evidence:** PRD sections 2, 6-D, 10.B.6, Q3, Q5; `ceo-review.md` sections 1 and 2; deck slide 10.
**What would change my mind:** interviews showing the first users are younger patients with their own phones and doctors in private practice with their own devices. Then points 2 and 3 fall away.

---

## 2. Empathy maps

**No technical view**, except one line for the doctor's map and one for the patient's.

- **Doctor, "fears":** relying on a value the AI misread. The answer we can actually build is the source viewer: every value opens the original photo (PRD M5). It is real, not a claim.
- **Patient, "fears":** "can I take it back?" Honest answer: revoking stops all future access; it cannot remove what the doctor already saw (PRD 10.B.1). The map should not promise more.

**Confidence:** high on both facts. **Evidence:** PRD 10.B.1, section 9 M5. **What would change my mind:** nothing technical; these are properties of any system.

---

## 3. Competitor analysis

**Position.** We have no technical moat, and the paper should not claim one.

- **Photo to structured data is a commodity.** A general model does it. We built it in hours with Gemini and a forced schema (PRD 10.4). ChatGPT Health, Claude, Google and Epic can each ship it in a sprint (`market-and-competitors.md` 2.1, 2.4).
- **The trust features are cheap to copy too.** Identity match, the provenance mark, the grant with a clock and the signed log are weeks of engineering, not years.
- **What is hard to copy is position, not code:** patient-held custody with no insurer principal (a business choice the large players will not make), old paper, cross-border, and being allowed to operate where others are held back.
- **Regulation is a shield for now, and it cuts both ways.** ChatGPT Health is not in the EEA, the UK or Switzerland (`market-and-competitors.md` 2.1). The same rules that hold them back hold our assistant back. The shield lasts only until a large player decides to do the compliance work, which it can fund and we cannot.
- **Certification is doable for a funded company.** Ada Health sells a CE-marked symptom checker (`market-and-competitors.md` 2.1; its exact class is to verify). So "possible causes" is not impossible. It is a funded company's feature.

**Confidence:** high on "no technical moat"; medium on how long the regulatory shield lasts.
**Evidence:** `market-and-competitors.md` 2.1, 2.2, 2.4, section 3 (threats 1 and 3); PRD 10.4.
**What would change my mind:** measured evidence that reading old, messy, multi-language paper to the 98% bar (PRD section 9, scope B) needs a tuned pipeline that general models cannot match. That would be a real, if narrow, technical edge. We have no such measurement.

---

## 4. Value proposition

**Position.** Five promises in the current story are weaker in the product than they read. The value proposition should be built on what can run in year 1.

| Promise | What is feasible in year 1 | Consequence |
|---|---|---|
| "You hold the key" (P2) | True at rest only. At launch a hosted model sees the facts of each request, in region, without the name (PRD 10.B.2, option 3). It also needs a native app for secure hardware (F-Q4) and a recovery flow where losing the code loses the record (Q29) | Say "nobody at the company can read your record at rest". Never "only you can read it". The allowed and forbidden wording is in `cto-review.md` section 6 |
| "Verified by source" | Depends on labs and national systems we do not control (PRD 10.B.4). In year 1 almost every record will say "Uploaded by patient" | The doctor-side trust story rests on the identity match and the source photo, not on verification. The identity match stops a careless claim, not a forger (PRD 10.B.8 item 2) |
| "Possible matches" | An empty index matches nobody. With k of 5 to 10 (PRD 10.B.5) and coarse codes mapped from photos ("unverified mapping", 10.B.4), useful matches need thousands of opted-in patients with similar conditions | Not a year-1 value. It is a network effect that starts at zero. Keep it as direction, not as a promise |
| "Possible causes" | Technically easy, legally a medical device (section 6 below) | Out of the product's value proposition until certification is funded |
| "In-person handshake" | Works. But the wedge buyer needs remote access (section 1) | Product must choose: in person only, or a remote grant with weaker assurance |

**What is strong and feasible now:** one cited timeline from old paper in any language; the doctor asks and every answer opens its source; access the patient grants, with a clock and a log. Translation next to the original is the cheapest high-value feature for the cross-border wedge.

**Confidence:** high on rows 1, 2 and 4; medium on rows 3 and 5.
**Evidence:** PRD section 7 ("one tension, stated plainly"), 10.B.1, 10.B.2, 10.B.4, 10.B.5, 10.B.8; `cto-review.md` section 6.
**What would change my mind:** a lab network or a national system agreeing to signed results (row 2); a rare-disease network bringing a ready cohort (row 3); a confidential-computing or on-device model reaching hosted quality on Greek and messy photos (row 1).

---

## 5. Business Model Canvas: key resources and key activities

**Position.** The canvas must separate what the weekend proved from what a real product needs. The weekend proved that a small team builds the flow fast. It proved nothing about operating with real health data. The scarce resources are not engineers.

### Key resources (in order of scarcity)

1. **A named clinical lead.** Not optional. Someone must judge extraction errors, define what the doctor view may show, and sign clinical-safety decisions. The team has none ("No team", `ceo-review.md` section 3). G1 and G2 already require one.
2. **Regulatory and data-protection competence, under contract.** A DPIA before one real record from a third person (PRD section 8, GDPR), a regulatory adviser for the device line (Q18), and an accountable person for data protection. Agents cannot hold these duties.
3. **Model access under zero-retention terms, per region.** A launch prerequisite (`cto-review.md` section 5, Q1). The weekend's terms (abuse-monitoring retention we cannot wipe, `cto-review.md` 2.3) are acceptable for one consenting founder and not for patients.
4. **A consented evaluation set of real documents.** The 98% bar on name, ID, date and values (PRD section 9) cannot be measured on synthetic exams. Today we have synthetic data and one person's exams that are being deleted.
5. **The engineering already designed:** the grant model with RLS, the signed log, the typed contract, the stateless model gateway design, the cell-per-region design (PRD 10, Part B). Valuable, and replaceable.
6. **Trust itself.** One breach or one untrue claim ends a privacy-first health brand (`ceo-review.md` pre-mortem 5). It is a resource that is spent once.

### Key activities

| Activity | Why it is key | Rough weight (my estimate) |
|---|---|---|
| Measuring and holding extraction accuracy on real documents | A wrong value in a doctor's hands is the main safety risk, device or not | Continuous; the largest ongoing engineering cost |
| Security and privacy operations: key management, audit log, incident response, access reviews, a yearly external test | The product is the promise | A part-time security owner from day one; an external penetration test before any pilot |
| Building the key-on-device model: native shells, device enrolment, recovery | It is what makes "we cannot read it" true | The largest one-off build; months, not weeks |
| Import connectors (FHIR patient-access, national systems, signed lab results) | The only route to "verified by source", and the answer to state rails | One connector per source; each needs an agreement, so the calendar is the partner's |
| Proving who the patient and the doctor are, per region | Without it the handshake and the insurer firewall (PRD 10.B.6) are only words | A paid identity service and a registry check per country |
| Running one region well before opening a second | Each cell is a full stack and a legal review (PRD 10.B.3, 10.B.8 item 6) | EU cell only until a named buyer pays for another |
| Keeping the product on the safe side of the device line | A copy change or a feature can move it (section 6) | A review step on every assistant change and every claim |

**Build versus buy.** Buy: hosting, identity proofing, model inference, time-stamping. Build: the grant and key model, the log, extraction checks, the gateway. Reason: the bought parts are commodities; the built parts are the promise.

**Order-of-magnitude size for a record-only pilot in one EU cell (my estimate, low confidence):** two to three engineers, a part-time security owner and a clinical lead for four to six months, plus legal and audit costs in the low tens of thousands of euros, before the first third-person record. Inference cost per document is small next to these. This is not a studio side project at "about 4 hours a week" (`ceo-review.md` G1 cap); the cap is right for gathering evidence and wrong for building.

**Confidence:** high on the list and its order; low on the sizes.
**Evidence:** PRD 10 Part B, section 9 scope B; `cto-review.md` sections 2.3, 5, 6; `ceo-review.md` sections 1 and 3.
**What would change my mind:** a hospital partner that brings clinical governance, a DPO and a security review under its own roof. Then resources 1 and 2 are borrowed, and the pilot is far cheaper.

---

## 6. The regulated feature: "possible causes"

**Position.** Keep "possible causes" (story E3) out of any product until certification is funded and a clinical lead exists. The larger risk is not E3, which everyone has already flagged. It is that the line may fall earlier, across parts of the assistant the plan treats as free to ship.

### 6.1 What makes it a medical device

- **EU.** Software intended to give information used for diagnostic or therapeutic decisions is medical device software, class IIa at least under Rule 11 (PRD section 8; to verify, Q18). Rule 11 goes higher when a wrong decision could cause serious harm: IIb for serious deterioration or surgery, III for death or irreversible harm. A general "possible causes" list across all specialties covers conditions where a miss is serious. **I would plan for IIa and budget for the risk of IIb.** The EU AI Act's high-risk duties follow from the device status; the date is disputed between August 2027 and August 2028 (`market-and-competitors.md` 1.3).
- **Intended purpose decides, and copy is evidence of it.** The founder's own problem statement says the assistant should "help him to find the right diagnose" (`00-founder-brief.md`). On a hackathon stage that is fine. In product copy, a deck sent to a buyer or a website, that one sentence can qualify the whole assistant as a device, whatever the code does.
- **US.** Clinician-facing decision support can sit outside device regulation when the clinician can independently review the basis of the recommendation and it does not analyse images or signals. Citations to the source exam are exactly that basis. The FDA widened this in January 2026 (`market-and-competitors.md` 1.3, a secondary source). So the US path for a cited, clinician-only assistant is plausibly lighter than the EU's. Low confidence until counsel reads it.

### 6.2 What keeps the product out of scope

| Zone | Functions | Status |
|---|---|---|
| **Safe** | Store, show and share documents. Extracted fields shown beside the source photo. The lab's own printed ranges and flags, verbatim. A chronological timeline. Search that returns passages from the record with citations. Filter, sort, a plot of raw values. The symptom diary as written. The deterministic overview I set in the review (`cto-review.md` section 3, row 4) | Generally not a device: storage, communication, simple search |
| **Unclear, adviser decides** | Model-written answers that combine several documents (E2). Any model-written summary. The cross-specialty summary (E4). Flags we compute ourselves. Anything that picks "what matters" for the doctor. A match surfaced for one named patient to help find a cause (F2). Translation shown without the original | This is where "simple search" may end. The CEO's review already treats E1's summary, E4 and E3 as "the assistant" (`ceo-review.md` pre-mortem 3) |
| **Over the line** | Possible causes (E3). Ranking a differential. Suggesting a test or a treatment. Risk scores and alerts. Reading an image. Anything interpretive on the patient side (also non-goal N1) | A medical device in the EU |

**Engineering controls that hold the line (all cheap, most exist):**
1. The assistant is a separate module that can be switched off per region and per customer. The record works in full without it.
2. The server enforces block kinds (`record_fact`, `general_knowledge`, `not_in_record`, `possibilities[]`; `cto-review.md` section 3). In a product, `possibilities[]` is disabled in code, not hidden in the interface.
3. Every factual block carries a citation that opens the source, or it is not shown.
4. One written intended-purpose statement ("stores, retrieves, shares and cites a patient-held record") and a copy rule that nothing published says more. Marketing's forbidden list (`cto-review.md` section 6) gains "helps diagnose".
5. No image ever reaches a model (`cto-review.md` 2.5).

### 6.3 Cost and time of a regulatory path (my estimates; replace with an adviser's quote)

| Path | What it involves | Time | Cost |
|---|---|---|---|
| **A. Stay out of scope** | One regulatory opinion on where the line falls; the five controls above | 2 to 6 weeks | About €3k to €10k |
| **B. EU, class IIa** | A quality system (ISO 13485), software lifecycle (IEC 62304), risk management (ISO 14971), clinical evaluation, a notified body, post-market follow-up, a person responsible for regulatory compliance | 18 to 30 months for a first-time manufacturer | About €300k to €800k to the first certificate, then about €80k to €200k a year |
| **C. EU, class IIb** | As B, with a likely clinical investigation | Add about 12 months | Add about €0.5M to €1.5M |
| **D. US, non-device decision support** | A counsel memo and design constraints (clinician-only, reviewable basis, no images) | 1 to 2 months | About $15k to $40k |
| **E. US, as a device** | A 510(k) or De Novo submission | 12 to 24 months | About $200k to over $1M |

**One technical obstacle the plan has not named.** A certified device needs a fixed, validated version. A hosted general model changes and is retired on the provider's schedule, and its output is not deterministic. Certifying "possible causes" on top of a hosted Gemini-class model means either a pinned model under a contract that guarantees the version, or a model we host ourselves, plus revalidation at every change. This pushes path B toward the upper end of the range and is the main reason I would not start it before a funded team exists.

**The alternative worth costing.** The CEO's steelman B (`ceo-review.md` section 2): ship the cited record and let it feed whatever assistant the doctor already uses. The device question then sits with that assistant's maker. One open point for the founder and Product, which I do not resolve: handing a record to a doctor's third-party tool inside a grant must be reconciled with "no export built for third parties" (PRD 10.B.6 control 5). I leave the rule exactly as it is.

**Confidence:** high that E3 is a device in the EU; medium on IIa versus IIb; medium that the safe zone is safe; **low on where the unclear zone lands**; low to medium on every figure.
**Evidence:** PRD section 8, 10.B.8 item 4, Q18; `cto-review.md` sections 2.5, 3, 6; `ceo-review.md` pre-mortem 3 and steelman B; `market-and-competitors.md` 1.3 and threat 3; deck slide 12.
**What would change my mind:** a written adviser's opinion that model-written cited answers (E2) and the cross-specialty summary (E4) are outside the regulation, which would make the "record first" step much richer; or the opposite opinion, which would reduce step 1 to a viewer with search and should be treated as a kill signal for the assistant-led story. A notified body with certified generative-model devices and a known timeline would firm up path B.

---

## 7. Market fit scorecard: the riskiest technical and regulatory assumptions

**Position.** Ranked by how much of the plan falls if the assumption is wrong. Assumption 1 should be tested first because it is the cheapest to test and decides the most.

| # | Assumption the plan makes | If it is wrong | My confidence it holds | Cheapest test |
|---|---|---|---|---|
| 1 | **A cited question-and-answer assistant over the record is not a medical device** (deck slide 12, step 1) | Step 1 becomes a viewer with search. The "record first, no certification" story loses the feature doctors would pay for | Low to medium | One adviser opinion, path A in 6.3. Already in G2; I would move it to G1 |
| 2 | **Extraction reaches 98% on name, ID, date and values on real, messy paper, and patients will check the rest** (PRD section 9) | Wrong values reach doctors; a 60-row blood panel is not something a patient reviews line by line (`cto-review.md` 2.4) | Medium for printed lab reports; low for handwriting, faxes and old photocopies | The edit-count measure from the founder's role-play (`cto-review.md` 2.4): a number, no content. Then a consented set |
| 3 | **"We cannot read your record" can be true while a hosted model reads it** (P2) | A privacy claim the system does not keep, which is the CEO's pre-mortem 5 | High that the reworded claim holds; the original wording does not | Already settled in wording (`cto-review.md` section 6). Cost of the native build is the open part |
| 4 | **Sources will sign or expose results, so "verified by source" becomes real** | Every record stays "uploaded by patient"; the trust mark is decoration | Low in year 1 | Ask one lab network and check whether MyHealth allows sharing (`market-and-competitors.md` section 7, item 1) |
| 5 | **A doctor is verifiable in every launch country, and a payer-affiliated account can be kept out technically** (PRD 10.B.6, Q5) | The handshake admits anyone who claims to be a doctor; the firewall is policy only | Medium in the US and the UK (public registers); unknown elsewhere | Sales names the registry per country (Q5) |
| 6 | **The handshake fits the first buyer's workflow** | The wedge needs remote access (section 1); the in-person control is lost or the wedge changes | Medium | Ask one international-patient office how records arrive today |
| 7 | **Possible matches produce matches** | Empty for years at small scale; k-anonymity hides the rare cases it is meant for (Q34) | Low before a partner cohort | A rare-disease network willing to bring a cohort |
| 8 | **One region is enough to start, and a US-owned model in an EU region is acceptable to EU public buyers** (PRD 10.B.2, 10.B.3) | A second tier (confidential computing or a European model) is needed at launch, at lower quality and higher cost | Medium for private buyers; low for public ones | Ask the first buyer's data-protection officer |
| 9 | **We can operate real health data without an incident** | One trust event ends it | Unknown: no security programme exists yet | None cheap. It is a precondition, not a test |

**Feasibility by slice (technical / regulatory):** the record and timeline: high / high. The handshake, grant and log: high / high. Cited retrieval: high / medium. Key on the device: medium / high. Verified by source: low in year 1 / high. Possible matches: low at small scale / medium. Possible causes: high / low.

**The summary for the scorecard.** Nothing in this product is technically hard to build. What is uncertain is whether we are allowed to ship the part that makes it valuable, whether the data is accurate enough to be trusted, and whether anyone exists to carry the duties. Those are a regulation question, a measurement question and a team question.

**Confidence:** medium overall. The ranking is a judgment; the facts under each row are cited.
**Evidence:** as cited per row; PRD sections 7, 8, 9, 10 Part B, 17; `cto-review.md`; `ceo-review.md` section 1.
**What would change my mind:** the role-play's edit count (assumption 2), an adviser's opinion (assumption 1), and a first buyer's answers on workflow and hosting (assumptions 6 and 8). Each is cheap and each moves the ranking.

---

## Open questions this paper raises (for the founder, through Product and the CEO seat)

1. **Move the regulatory adviser's first opinion from G2 to G1?** It costs a few thousand euros (my estimate), so it needs the founder's yes on spend. It decides assumption 1.
2. **In person only, or a remote grant for the international-patient wedge?** A product choice with a privacy cost. Product frames it; the founder decides.
3. **Feeding a doctor's own assistant from the record:** is that inside or outside the founder's rule as he means it (PRD 10.B.6 control 5)? Only the founder can say. I do not read the rule either way.
4. **The helper role** (a relative or a hospital coordinator who is not a clinician): Product, with Q3.
