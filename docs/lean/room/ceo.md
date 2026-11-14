# Health app: CEO seat paper on the six lean workshops

**Recommended, not decided.** Nothing in this paper decides anything for the founder. It is the CEO seat's own view, written before reading any other seat's paper, so that Pix can compare the seats afterwards.

| | |
|---|---|
| **By** | CEO seat (ceo-minhos), MIN-4436, parent MIN-4435 |
| **Date** | 14 Nov 2026, during the hackathon. **Written before gate G0 has any result**, so it has no weekend evidence in it |
| **Founder's words** | "So do all together: Personas, Empathy map, Competitor analysis, Value proposition, Business Model Canvas, Market fit scorecard" (14 Nov). Start-now override: "Just do the exercise now to have the outcome" |
| **Inputs read** | `docs/00-founder-brief.md`, `docs/PRD.md` (sections 1 to 4, 9, 13, 14), `docs/research/market-and-competitors.md`, `docs/research/buyers.md`, `docs/reviews/ceo-review.md`, `docs/reviews/cto-review.md` (verdict and real-data sections), `docs/deck/deck-content.md` (headings and the who-pays and market slides). No other seat's paper. |
| **Data** | Synthetic personas only. No real exam, nothing from the `demo` project. Nothing sent, published or contacted. |
| **Insurer rule** | The data rule is the founder's and absolute: "These data should not be accessible to insurance companies as proofs." This paper neither extends nor narrows it. The five commercial edges stay open questions for him (`ceo-review.md` section 5, "the insurer rule"). Where a canvas block touches them, it says "open". |

Tags: **verified** = a primary source opened by the research seats; **secondary** = seen through a summary; **assumed** = no source; **inferred** = my reasoning. Confidence is low, medium or high.

---

## 0. Bottom line, and the one thing all six workshops share

**Position.** My position from the 13 Nov review stands: **park by default, continue only through gates G0 (15 Nov), G1 (30 Nov), G2 (15 Jan 2027).** The six workshops did not give me evidence to change it. They organised the same desk research in six ways, and every one of them ends at the same wall: **sample size 0**. No patient, doctor or buyer has been interviewed (`PRD.md` section 1; `PRD.md` section 13.2 says the same of its own segments). Six workshops on an untested idea produce six confident-looking documents. I treat them as a way to write down hypotheses and name the cheapest test for each, never as evidence of fit.

**Alignment line.** Does this get us closer to the company's goal? Indirectly. The company's logged direction is two products under one name, a solo founder, and "8-10 Founding Operators by end of 2026" kept on 2026-11-10 (`ceo-review.md` section 3). Health is an orphan next to them. This paper does not close that gap; it prepares the evidence the G1 and G2 gates need, at no build cost. It is a named, deliberate detour.

**What moved, and what did not.**

| | Before the workshops | After |
|---|---|---|
| Park by default, three gates | Recommended | Unchanged |
| First buyer | International-patient department of a hospital (Q17 answer) | Unchanged, now with a reason from the empathy map: it is the one entry where someone other than the patient does the digitising |
| "Possible causes" and the assistant | The weekend's magic, the product's liability | Unchanged. Keep out of the proposition if the idea continues |
| Dollar market size on a slide | No (Q24) | Unchanged. The business-model workshop shows why: the 1% share and the seat price are both my team's guesses |

**Founder time cap until G1:** about 4 hours a week, no money, no build (`ceo-review.md` section 3). Unchanged.

---

## 1. Personas

All synthetic composites. None is a real person. "Maria" is the PRD's synthetic patient.

### P1. Maria, the multi-specialist patient (the free user)
- **Who.** Adult, 55, two chronic conditions, sees an orthopaedist and a rheumatologist and a GP, in two portals plus a folder of paper and phone photos.
- **Job.** Walk into a new specialist with the whole history, without remembering everything and without carrying the folder.
- **Pain today.** Retells the history at every first visit; some exams are on paper or on a disc; no one sees both specialists' results.
- **What she will not do.** Spend an evening photographing twenty years of paper for a product that gives her no diagnosis back. This is a design choice (non-goal N1) that is right on safety and costly on activation.
- **Would pay?** No. The model makes the patient free.

### P2. Dr. Nikos, the first-visit specialist (the user who decides it is worth it)
- **Who.** Orthopaedist or rheumatologist, ten-minute first visit, new patient with an outside history in a bag.
- **Job.** Read years of history in seconds, ask a question, see the source.
- **Pain today.** Chart review is about a third of EHR time per visit (5 min 22 s of 16 min, US, vendor-authored, secondary).
- **What he will not do.** Install a new app and scan a code inside a ten-minute visit. He already has Epic Art, a scribe, OpenEvidence, or a patient who shows him what ChatGPT said.
- **Would pay?** Rarely himself. A clinic or hospital pays for seats.

### P3. Eleni, head of international patients at a medical-tourism hospital (the first buyer, hypothesis)
- **Who.** Runs the department that gets foreign patients' records before arrival, by email, in many languages, on paper.
- **Job.** A complete, consented, readable record packet before the patient lands.
- **Pain today.** Foreign records arrive late, partial or not at all (qualitative, Cleveland Clinic J Med review, secondary). Bumrungrad says foreign patients are about half its outpatients (its own FAQ, per `buyers.md` section 4).
- **Why she matters most.** She has a revenue reason and a coordinator team that can do the digitising, so the two-sided cold start does not bite.
- **Objection.** "Many formats and languages" (`buyers.md` 1.7). A real product risk.

### P4. Sofia, caregiver in a rare-disease family (the pull persona, not a payer)
- **Who.** Parent or adult child holding the thickest archive, seen by many specialists; diagnosis took years (4.7 years on average in Europe, verified, EURORDIS Rare Barometer 2024).
- **Job.** Let each new doctor see everything; find others with the same pattern.
- **Why she matters.** She is the strongest fit for "possible matches" and the founder's cure-and-cause vision. Her organisation has no budget (`buyers.md` 1.8).

### Anti-persona: the coverage decider
Anyone who decides what is covered, paid or priced. Under the founder's data rule, no insurer sees a record, a fingerprint or a verification. This is not a customer segment in this paper.

### Position, confidence, evidence, what would change my mind
- **Position.** The patient has the pain but not the motive to do the work; the doctor has the motive but not the minutes; the person with both motive and labour is the international-patient coordinator (P3). Test P3 first, P2 second, and treat P1 as a consequence rather than a launch audience.
- **Confidence.** Medium that the pain is real for P1 and P3 (WHO: 1 in 10 patients harmed, verified; ONC 2024: 59% of US adults have several portals, only 7% combine them, verified). **Low** that P2 would open it in a first visit. **Low** that P3 would pay: no buyer has been asked.
- **Evidence.** `PRD.md` sections 1, 2, 13.2; `market-and-competitors.md` 1.1 and 1.4; `buyers.md` 1.7, 1.8, section 4; `ceo-review.md` section 1 (pre-mortem reasons 1 and 2).
- **Caveat on user zero.** The founder is the only user so far, and he is also the person who wants it built. One person who loves an idea is the weakest kind of evidence.
- **Would change my mind.** Three of five doctors can say when in a first visit they would open it (G1). One coordinator at a named hospital says she would trial a consented packet. Anything that shows doctors will not scan anything inside a visit moves me against.

---

## 2. Empathy maps

### Patient (Maria)
| | |
|---|---|
| **Says** | "I never remember the dates." "Which exam did I bring last time?" |
| **Thinks** | "Another form, another retelling." "Who will see this?" "Will it be used against me?" |
| **Does** | Photographs a few exams, keeps the rest in a drawer, forwards a PDF to the doctor's secretary |
| **Feels** | Tired and anxious before a first visit; protective of her data; wary of anything that sounds like an insurer |
| **Pains** | Effort up front, no payoff she can see herself (by design), fear of exposure |
| **Gains** | A doctor who already knows her history; control over who sees it and for how long |

### Doctor (Dr. Nikos)
| | |
|---|---|
| **Says** | "Did you bring your results?" "Nice." (and cannot say when he would open it) |
| **Thinks** | "Is this answer right? Where did it come from?" "Who is liable if it is wrong?" |
| **Does** | Skims what is in the bag, guesses, orders a repeat test |
| **Feels** | Time-poor; sceptical of AI that does not show its source; protective of his own judgement |
| **Pains** | Another tool in a ten-minute visit; liability for AI output |
| **Gains** | The full history in seconds, each answer opening the original paper |

### Buyer (Eleni)
| | |
|---|---|
| **Says** | "We have our own EHR and app." |
| **Thinks** | "Will this reduce my team's chasing? Will legal and IT block it? Is it a medical device?" |
| **Does** | Emails the patient for records weeks before travel; her coordinators translate and re-key |
| **Feels** | Pressure to convert foreign enquiries; caution about data duties |
| **Pains** | Late, partial, multilingual records |
| **Gains** | A complete consented packet before arrival; faster first visits |

### Position, confidence, evidence, what would change my mind
- **Position.** The maps show one structural asymmetry: **the patient does the work, the doctor gets the value, and the product by design gives the patient nothing back.** That is the pre-mortem's reason 2 in plain form. The privacy and safety choices are right; they are also what makes activation hard. A one-sided entry, where a hospital coordinator helps the patient digitise, is the only route I can see that avoids it.
- **Confidence.** Medium on the asymmetry (it follows from the PRD's own non-goals). Low on the content of each cell: these are inferred, not interviewed.
- **Evidence.** `PRD.md` N1, G1 to G4, section 9 Scope B (activation target 40%, labelled a hypothesis); `ceo-review.md` section 1 reason 2; `market-and-competitors.md` 1.1 (ONC 7%).
- **Reading the 7% two ways.** Only 7% of US adults combine their portals. Either the job is unserved, or people do not care enough to do the work even when the data is already digital. The research reads it the first way. I do not know which, and the maps cannot tell.
- **Would change my mind.** Patients in interviews who say they would photograph ten exams for a doctor's benefit, unprompted. Or the opposite: patients who say "my doctor has it".

---

## 3. Competitor analysis

### The map, from the CEO seat
| Group | Who | What they own | The gap we can claim (inferred) |
|---|---|---|---|
| Patient-side AI | OpenAI ChatGPT Health, Anthropic Claude for Healthcare, Google, Apple Health Records, Epic MyChart Emmie | Users and US record pipes; ChatGPT Health not in EEA or UK (secondary) | Answers go to the patient; no doctor handshake; no source marks; no old paper |
| Doctor-side AI | Epic Art, Navina, Metriport, OpenEvidence, Glass, scribes (Abridge, Heidi, Tandem) | The doctor's workflow and money (OpenEvidence $12B, Heidi $900M, secondary) | Summarise one institution's chart or notes going forward; none digitises a patient's own old paper |
| Aggregators and PHRs | PicnicHealth, Citizen Health, Patients Know Best, Eka Care | Retrieval and records for a niche or one country | Closest on "digitise once"; US retrieval or provider-paid or India-only |
| State rails | NHS App (Single Patient Record, Dec 2028), EHDS (2029, 2031), TEFCA, ABDM, Malaffi, Sehhaty | Legal basis, distribution, real "verified by source" | Central custody; no foreign or old paper; low active use (Germany ePA about 4%, secondary) |
| Patient matching | Matchmaker Exchange, PatientsLikeMe (UnitedHealth bought it in 2019), Clinerion | Clinician networks and research | Ours would be a lighter, patient-opt-in layer |
| Substitutes | A folder, phone photos, each provider's portal | Most patients today | The real competitor is doing nothing |

### Position, confidence, evidence, what would change my mind
- **Position.** **Do not compete on "AI reads your exam".** Anyone with a phone and ChatGPT already can, and Epic, OpenEvidence or OpenAI can add patient context in a sprint (steelman B, `ceo-review.md` section 2). What the incumbents do not do is narrower: old paper, cross-border, doctor-side trust marks (identity match, "verified by source"), no insurer. That wedge is real but small and has a clock: rails commoditise "records in one place" in the US now, the UK by Dec 2028, the EU in 2029 and 2031.
- **The sharp CEO point.** "No pure-play funded category for photo-of-old-paper to structured history" (`market-and-competitors.md` 2.4) reads two ways. Either it is white space, or nobody found a business there. The research marks first-mover claims as open but unproven; I agree and would not put "first" on a slide.
- **Confidence.** Medium on the map (the research is broad and mostly sourced, but several figures are secondary or unverified and `buyers.md` has no green figure). **Low** on the size and length of the window.
- **Evidence.** `market-and-competitors.md` sections 2 and 3 (three biggest threats: Epic, OpenAI, OpenEvidence); `ceo-review.md` section 1 reason 4 and section 2 (options A, B, C).
- **If it continues, the shape that survives** (same as the 13 Nov review): the patient-held on-ramp for old paper and foreign records, source-marked, shared in person, first buyer an international-patient department. Import from the rails, never fight them.
- **Pending.** The treg pass the founder approved ("Yes, tomorrow") is meant to test the market ranking and competitor funding. I have no result from it; this section does not depend on it.
- **Would change my mind.** For: a hospital international office saying no tool handles its paper and multilingual packets today. Against: a doctor saying "my patients already show me what ChatGPT said and it is enough", or an incumbent shipping photo-to-history with provenance.

---

## 4. Value proposition

### The canvas, per segment
| | Patient | Doctor | Buyer (international-patient department) |
|---|---|---|---|
| **Jobs** | Arrive with the full history | Read history fast; ask a question; trust the answer | Complete, consented record before arrival |
| **Pains** | Retelling; effort; exposure | Minutes; liability; another app | Late, partial, multilingual records |
| **Gains** | Control of who sees it, and for how long | Cited answers that open the original | Faster first visits; fewer repeat tests |
| **Pain relievers** | Photo to record; doctor sees it only when she lets him in; time-limited grant | Citations; identity match; "verified by source" vs "uploaded by patient" | A packet in the patient's language, with provenance marks |
| **Does not do** | Diagnose the patient (N1) | Replace his record system (N7) | Integrate with the hospital EHR (N6, demo) |

### The proposition I would carry forward
> **The patient-held record for old paper and foreign history, shared in person, with every record marked for who vouches for it. The doctor asks; every answer opens the source. The insurer never sees it.**

What I would leave out of the proposition: "possible causes" (E3), and the cross-specialty and summary features that interpret (E4, part of E1). The PRD's own review found the line between "record" and "assistant" is drawn too generously (comment 7). "Possible matches" stays as consented care between doctors; it is not a data-sale line.

### Position, confidence, evidence, what would change my mind
- **Position.** The proposition earns its place only if it is true on a thinner scope than the weekend demo. The weekend's magic (a doctor asks a plain question about a long history and the answer opens the paper) is a good proof of the first half and says nothing about the second half, who pays. The privacy claim must be only what runs: "you decide who sees it and for how long" is true in the demo; "you hold the key" is product design and not the demo (`ceo-review.md` comment 6).
- **Confidence.** **Medium** that the proposition is coherent and differentiated on paper. **Low** that it is wanted: no one has paid or agreed to pay.
- **Evidence.** `PRD.md` 13.1 and 13.2 (positioning, ideal customer); `ceo-review.md` section 2 (what the three alternatives share), comments 6 and 7; `cto-review.md` section 1 (the architecture, deterministic E1, images never read by the AI).
- **Would change my mind.** A doctor in the role-play who says the cited answer saved real minutes, in his own words and with a number. A coordinator who says the packet changes what she does. A regulator's adviser who says the record-only scope sits outside the device rules, which would make the thin version cheaper to ship than I assume.

---

## 5. Business Model Canvas

| Block | Content | Status |
|---|---|---|
| **Customer segments** | Hospital international-patient departments (first); multi-specialty clinic chains and telehealth platforms (next); rare-disease networks (free pilot, grant-funded); lab networks. Patients are free users. **Insurers: excluded by the founder's data rule.** Public payers, hybrid bodies, employers, pharma line, insurer-owned hospitals: **open, founder decides** | Hypotheses (`buyers.md` section 5) |
| **Value propositions** | Section 4 | Untested |
| **Channels** | Hospital departments through innovation gateways (Sheba ARC, Mayo Platform Accelerate), direct to international-patient offices, patient associations (EURORDIS). No public launch without the founder's written go | Hypotheses |
| **Customer relationships** | Pilot with a named clinical lead; support during onboarding; per-case or seat contract | Hypothesis |
| **Revenue streams** | Per-case fee or per-doctor seat; white-label licence; grants as funding, not revenue. Patients pay nothing. "Later, consent-gated" research line is **not now** in my recommendation and the founder decides | All prices are assumptions |
| **Key resources** | A clinical lead (missing); a regulatory adviser (missing); the EU data cell and the encrypted store; the extraction pipeline; the founder's attention (capped) | Two of the four missing |
| **Key activities** | Digitise and verify; consented sharing; doctor-side retrieval with citations; a DPIA before any third person's data; pilots | Mostly built as a demo only |
| **Key partners** | A clinician; a hospital pilot; a lab network for "verified by source"; national rails for import (digital arms only); an ethics reviewer before any matching | None signed |
| **Cost structure** | AI inference, EU hosting, DPIA and legal, a regulatory adviser, clinical lead time, the founder's time. Hackathon spend is capped (CTO: up to EUR 30 on the founder's billing if credits do not fit) | No product cost data |

### A sizing test, labelled as one
The research puts a seat at $600 a year [ASSUMPTION] and the year-3 SOM at 1% of the serviceable seats, about 42,700 seats and $19M [ASSUMPTION, 1% is a placeholder]. Both numbers are my colleagues' guesses and Sales itself lists them under "do not put on a slide". As a test of the model, not a forecast: if a clinical lead, a regulatory adviser, hosting and legal cost about EUR 150,000 a year [ASSUMPTION, not sourced], that is about 250 seats at $600, or one mid-sized hospital group on seats. That is a plausible first pilot target and a modest ambition. It also shows that **continuing is a fund-the-team question long before it is a market-size question**: G2 needs an outside funding route for exactly this reason.

### Position, confidence, evidence, what would change my mind
- **Position.** The canvas is mostly hypotheses, and its biggest gaps are not revenue numbers but missing resources: no clinician, no regulatory opinion, no signed pilot. Revenue follows only if a first buyer pays. The pragmatic reading: **this is a pilot-and-grant business before it is a software business**, and the studio is not set up to carry that alone (solo founder, "No team - Looking for possible co-founders, Only Advisors", 2026-11-10).
- **Confidence.** **Low.** Every price, budget owner and sales-cycle figure in `buyers.md` is marked as an assumption; no figure there is verified green.
- **Evidence.** `buyers.md` sections 1, 4, 5; `market-and-competitors.md` 1.2; `ceo-review.md` section 3 (the gates, G2 conditions); `cto-review.md` (spend cap).
- **Would change my mind.** A written pilot interest from a hospital department (G1). A named price a buyer accepts. A grant or accelerator route with a date (G2).

---

## 6. Market fit scorecard

Scored from the desk evidence only, 0 to 5. **A score above 2 needs evidence from a person outside our team; none exists, so the cap is 2 for demand-side rows.** Weights add to 100.

| # | Criterion | Weight | Score | Why | Evidence tag |
|---|---|---|---|---|---|
| 1 | The problem is real and measured | 10 | 4 | WHO 1 in 10 harmed; ONC 59% multiple portals; EURORDIS 4.7 years | verified |
| 2 | The pain is felt by the target segment, in their words | 15 | 1 | No interview yet; founder is user zero | assumed |
| 3 | A reachable first buyer with budget | 15 | 2 | International-patient departments are plausible; none contacted | inferred |
| 4 | Willingness to pay, named | 15 | 0 | No price has been tested | assumed |
| 5 | Differentiation against platforms and rails | 10 | 2 | Narrow wedge, with a clock to 2028 to 2031 | inferred |
| 6 | Defensibility | 5 | 1 | Patient trust and provenance could matter; no data moat | inferred |
| 7 | Regulatory path is manageable | 10 | 2 | Record-only scope likely outside device rules; assistant is not; no adviser yet | inferred |
| 8 | Team and capacity to carry it | 10 | 1 | Solo founder, no clinician, two other products | verified (decisions log) |
| 9 | Fit with the company's direction | 10 | 1 | Orphan next to minhOS and TravelHood | verified (decisions log) |

**Weighted score: 30 out of 100** (weight times score over 5, row by row: 8 + 3 + 6 + 0 + 4 + 1 + 4 + 2 + 2).

**Reading.** Thirty out of 100 is not "bad"; it is "unproven". The score is made of one strong row (the problem), one clear weak row (nobody has agreed to pay) and a lot of unknowns. It tells you where the cheapest tests are, not whether to stop.

### What the scorecard would need to read at each gate
| Gate | Rows that must move | To roughly |
|---|---|---|
| G1 (30 Nov) | Row 2 to 3 (doctors say when they would open it); row 3 to 3 (one written pilot interest); row 8 to 2 (a named clinician willing) | about 40 |
| G2 (15 Jan) | Row 4 to 3 (a pilot agreed in writing with a non-insurer buyer); row 7 to 3 (adviser's first opinion); row 8 to 3 (clinical co-founder committed) | about 55 |

If G1 reads below about 40, park. The numbers are my thresholds, recommended, not decided.

### Position, confidence, evidence, what would change my mind
- **Position.** Park by default. The scorecard does not argue to stop; it argues that the next euro or hour should buy evidence on rows 2, 3 and 4, and nothing else.
- **Confidence.** **Medium** on the ranking of weak rows, **low** on the absolute number (the weights are mine, and a different seat may weigh the problem row higher).
- **Evidence.** All five other sections; `ceo-review.md` gates table; `PRD.md` section 9 (targets labelled placeholders until interviews).
- **Would change my mind.** G0 outcomes: a doctor used the demo on real exams and his verdict is written; at least one clinician or organisation asked for a follow-up. If both happened and the doctor's words are strong, rows 2 and 3 move up and I would say so at G0.

---

## 7. Open questions for the founder

1. **Has the treg pass run** (the research your 13 Nov "Yes, tomorrow" approved)? If yes, I would revise the competitor and buyer sections with its output.
2. **After G0, may I revise this paper?** It is written before any weekend evidence. I recommend a short update on 16 Nov with the doctor's verdict and the follow-up count, scored against section 6.
3. **The five commercial edges of the insurer rule remain yours to decide** (public payers, hybrid bodies, employers, a pharma line, insurer-owned hospitals). My recommendations are in `ceo-review.md` section 5; this paper uses none of them as settled.
4. **Is a clinical co-founder search something you accept for 30 Nov?** The scorecard's weakest controllable row is the team, and no workshop moves it without that.
