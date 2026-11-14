# Health app: CEO review of the PRD (C-level round)

| | |
|---|---|
| **By** | CEO seat (ceo-minhos), MIN-4425, parent MIN-4422 |
| **Date** | 13 Nov 2026, evening |
| **Reviewed** | `00-founder-brief.md` (all "Later founder decisions"); `PRD.md` v1.4 (sections 1 to 9, 13, 15 to 19 in full; 10, 11, 12 for scope, hours, cut order, stage plan and data handling); `research/market-and-competitors.md`; `research/buyers.md`; `conductor/docs/founder-decisions.md`; the event pages (hackathon.polymath42.com and /prep, fetched tonight) |
| **Not reviewed** | Anna's `deck/deck-content.md` beyond its slide titles (by instruction: I comment on the arc, not her file). Section 14 (empty). The CTO's review (`cto-review.md`) landed while this one was being written; section 5a says where the two meet and where they differ. |
| **Status of everything below** | Recommendations. Nothing here is decided on the founder's behalf. His decisions are listed at the end. |

Tags: **verified** = read on the source tonight; **inferred** = my conclusion from sourced facts; **assumed** = no evidence yet.

**Bottom line.** The hackathon is a good, bounded bet and the PRD is strong enough to build from tomorrow, after five changes. The product after the hackathon is not yet a bet worth making: it is off the company's stated direction, it needs a clinician and money the studio does not have, and its differentiating feature is a regulated medical device. So: play the weekend to win, then park by default and continue only if evidence pulls, through three dated gates.

---

## 0. New facts from the event site (answers part of Q9)

Fetched tonight; the PRD does not have them yet.

| Fact (verified on the page) | What it changes |
|---|---|
| Judged on "usefulness, craft, and aura points", and not on "polish alone". No weights published. | The win plan (section 4). |
| "Come with ideas, tooling, and boilerplate ready, but the build itself starts at 12:00 (noon) on Saturday." Judges weigh what was made in the build window: "a project that was substantially finished beforehand will not fare well". | No code and no repo before Saturday 12:00. The PRD, research and deck text are preparation and are allowed. Say in the pitch what was prepared and what was built. |
| Build starts Saturday 12:00. Finalists are announced Sunday around 20:00 to 20:30. **Finalists pitch on Monday 16 Nov on the GenAI Summit stage at SNFCC.** | The PRD timeline ends on Sunday. There may be a Monday, on a large public stage. This matters for the founder's real exams (section 5, comment 2). |
| Teams are 1 to 5 people; teams form on Saturday after doors open at 12:00. Mentors come from the Summit speaker list. | The founder can add a clinician or a life-science teammate on site. |
| "Hardware gets extra points" is written under the Open Track only. | Not relevant to us. |
| The venue is a research facility with rules to respect. | Ask at kickoff what applies to cameras and recording. |
| **Not stated anywhere:** the Biotech & AI track's own criteria, the demo length, the submission time and format, the judges. | Still open. Ask at kickoff, first thing. |

---

## 1. Pre-mortem: it is November 2027 and this failed

| # | Why it failed | Early sign | Counter-move now |
|---|---|---|---|
| 1 | **The founder was split three ways.** Health took the hours that the Founding Operators target and TravelHood's growth needed; all three stalled. A solo founder, no health team, no health money. | Health work appears in weeks where minhOS sales calls are skipped. | Gates with a time cap (section 3). Park by default. No build after the weekend until a clinician is committed. |
| 2 | **Nobody did the work on either side.** Patients did not photograph twenty years of paper, because the app gives the patient nothing back (no diagnosis, by design). Doctors did not install an app and scan a code inside a ten-minute visit. Two-sided cold start, and no doctor on the team to say so early. | In interviews, doctors say "nice" and cannot say when they would open it. | Start one-sided: the hospital's international-patient office asks for the record before arrival, a coordinator helps the patient digitise, the doctor is already inside. Find the clinician first (gate 1). |
| 3 | **Regulation and liability.** "Possible causes" is a medical device (EU MDR, at least class IIa as the PRD reads it; the AI Act's high-risk duties follow). Certification was never funded, or the summary and cross-specialty features drifted over the line without anyone deciding it. | A pilot partner's lawyer asks for the CE mark. | Ship order: the record first. Treat E1's summary, E4 and E3 as "the assistant" until a regulatory adviser draws the line. Build the assistant as a part that can be swapped or left out. |
| 4 | **The platforms and the state rails closed the gap.** A patient can already photograph an exam and ask ChatGPT about it. Epic or OpenEvidence added patient context. EHDS (2029, 2031), the NHS single record (2028) and national apps made "records in one place" free. | A doctor in an interview says "my patients already show me what ChatGPT said". | Do not compete on "AI reads your exam". Compete on what they will not do: old paper, cross-border, the doctor-side trust marks (identity match, provenance, citations), no insurer. Import from the rails; never fight them. |
| 5 | **One trust event.** A privacy claim that was not true ("you hold the key" while a model provider read the data), a breach, an insurer-linked buyer, or the founder's own exams leaking from the demo. A privacy-first health brand does not survive one. | Copy says more than the system does. | The Q30 rule: say only what runs. The real/simulated table on stage. The wipe, verified. No insurer-owned buyer. A DPIA before any third person's data. |

---

## 2. Steelman of the alternatives

**A. Do nothing after the hackathon.** The strongest case: the scarce resource is the founder's attention, and he has just kept a hard year-end target for minhOS. The weekend already pays for itself: a finished demo, a possible stage at SNFCC, contacts at the Park, and a case study for the studio (idea to working demo in one weekend with an AI team, which is what the studio sells). The idea's durable parts (old paper, cross-border, patient-held) are real and narrow; the broad parts are owned by Epic, OpenAI and OpenEvidence or will be made free by state rails on a known clock. *Where it is weak:* it throws away the option if a clinician or a hospital pulls at the event, and the founder has a personal reason to care (his own folder).

**B. Sell it to Epic or OpenEvidence as a feature.** The strongest case: it is a feature. OpenEvidence answers from the literature and lacks this patient's history; Epic Art summarises one institution's chart and lacks the outside paper. Patient context is exactly their gap, and they hold the doctors (OpenEvidence: about 760,000 registered US physicians, secondary). *Where it is weak:* a weekend prototype has nothing to sell: no users, no data, no team to acquire, and either company can build photo-to-history in a sprint. *What survives:* the product shape. Do not build the doctor's assistant as the core. Build the patient-held, source-marked record and the handshake, and let it feed whatever assistant the doctor already uses. That also takes the medical-device question off our side.

**C. Partner with a national record (myHealth, Malaffi, NHS App) and do not compete.** The strongest case: they have distribution, a legal basis, proven identity and real "verified by source"; they lack old paper, foreign records and private-lab results. We would be the on-ramp that brings a person's paper and foreign history in, which solves Q3, Q4 and Q5 at once. *Where it is weak:* 12 to 30 month cycles and tenders that a solo founder cannot carry; central custody is the opposite of "the patient lets people in"; many of these bodies are also payers (EOPYY, the NHS as commissioner, India's NHA with PM-JAY), which runs into the insurer rule; in Greece the state already presented its own doctor assistant (myHealthDoc, Oct 2025, secondary). *What survives:* the stance in `buyers.md`: import from the rails, never compete with them, sell elsewhere.

**What the three have in common (inferred).** If this continues, the version that holds is: *the patient-held on-ramp for old paper and foreign records, shared in person, with every record marked for where it came from; first buyer, the international-patient department of a hospital.* The assistant with "possible causes" is the weekend's magic and the product's liability. One more point in its favour: patients who travel for care are the only wedge with a line back to a travel-tech studio.

---

## 3. The bet: gates, not a yes or a no

### Fit with the company's direction (strategic alignment)

The company's direction, in the founder's logged words: "for sure we need to have a main name with the two products below. We are going to pitch with this" (2026-11-05: one name over minhOS and TravelHood). The team: "No team - Looking for possible co-founders, Only Advisors" (2026-11-10). The year-end target for minhOS, "8–10 Founding Operators by end of 2026": "keep" (2026-11-10, against the CEO seat's suggestion to soften it, with about seven weeks left). His weekly growth time for the two products until early Feb 2027: "Yes, 8 h" (2026-11-09). The weekend itself: "Just friday. Suturday and sunday we have to go to the hackathon" (2026-11-09), and on 13 Nov he chose this idea over "make TravelHood viral in one day" (the brief).

Read together: the weekend is a decided, bounded detour. A third product is not decided, and it is an orphan next to every logged priority: no entry in the log gives health a place in the company, and each hour it takes after Sunday comes from a target he chose to keep. It is named here as a deliberate detour so that it does not become a drift.

### The hard-call checks

- **Reversible?** Parking is fully reversible: the PRD, research and demo keep. Continuing is partly irreversible: outreach to hospitals and a public "health product" story create expectations, and health data creates duties.
- **10 minutes / 10 months / 10 years.** Ten minutes after a good demo, continuing feels obvious. Ten months on, without a clinician and a paying pilot, it is a third unfinished product. Ten years on, the question is whether the studio shipped one thing that worked.
- **A new CEO arriving on Monday** would look at two pre-revenue products, a solo founder and a year-end target, and would not open a third front without a co-founder for it.

### Options

| Option | Upside | Downside | Verdict |
|---|---|---|---|
| Stop on Monday | Full focus | Loses the option if someone pulls | Too early to choose |
| **Park by default, continue only through gates** | Keeps the option at a capped cost | Needs discipline at each gate | **Recommended** |
| Commit now as a third product | Momentum | The pre-mortem's reason 1 | No |

### The gates (recommended; the founder decides)

| Gate | By | Evidence needed to pass | If it fails | Cap until then |
|---|---|---|---|---|
| **G0: the weekend** | Sun 15 Nov, when finalists are announced | (a) The role-play happened: at least one doctor used the demo on the founder's real exams, and his verdict is written down in his words. (b) At least 3 conversations with possible buyers or partners (M8). (c) At least 1 clinician or organisation asks for a follow-up. | Write it up as a studio case study. Stop. | The weekend, as decided |
| **G1: is the pull real** | Mon 30 Nov 2026 | 10 interviews (5 doctors, 5 patients, Anna's plan in 13.7). Pass: 3 of 5 doctors say when in a first visit they would open it and who would pay; 1 named clinician willing to join as clinical lead or co-founder; 1 written expression of interest in a pilot from a hospital department or clinic. | Park. Keep the files. Case study. | About 4 hours a week of the founder's time, no money, no build, nothing published beyond the recap post |
| **G2: can it stand on its own** | Fri 15 Jan 2027 | A clinical co-founder or lead committed; one pilot agreed in writing with a non-insurer buyer; a funding route outside the studio's money (grant, accelerator, health angel) identified with a date; a regulatory adviser's first opinion on where the device line falls. | Park, or hand the idea to a clinician-led team. | Same cap. Still no real data from any third person |
| **Review** | Mid Feb 2027, with the podcast's 90-day gate | If G2 passed: decide the structure (a separate venture with its own team; the studio builds). | n/a | n/a |

**Kill criteria at any time:** a minhOS or TravelHood commitment slips because of health work; any third person's health data is processed before a DPIA; a claim is made in public that the system does not keep.

**Dissent, kept on purpose.** The case against this recommendation is alternative A: even a capped option costs attention, and the founder's best use of the two weeks after the event may be Founding Operators only. If G0 is thin, A is the right call and G1 should not start.

---

## 4. Hackathon win plan

### What the jury will weigh

| Criterion (their words) | What it means for us (inferred) | How we score |
|---|---|---|
| **Usefulness** | A real person with the problem, and a real user in the room. | The founder's own folder on the table. A doctor, found at the Park on Saturday, who used it on real exams and said what he thought. Measured numbers, not adjectives. |
| **Craft** | It works live; the hard parts are real; nothing is claimed that does not run. | Access that the database refuses after the grant ends; answers whose citations are checked on the server; the identity match in code. The real/simulated table (10.2) said out loud. What was built in the window, said out loud. |
| **Aura** | One moment people repeat afterwards. | See "the demo moment". |
| **The host, Athens LifeTech Park** (a biotech and clinical-research campus) | They think in research value: longitudinal real-world histories, rare patterns, trials. | "Possible matches" is the beat closest to their world. Frame it as care between doctors, opened by the patient's consent, never a data sale. Keep a small, seeded version in the demo (comment 9). |

### The demo moment

A doctor asks a plain question about a long history, and the answer opens the original paper. Then the patient ends the access and the doctor's screen closes. One question, one source, one closing door. Everything else in the demo sets that up.

The strongest version of the claim is not on screen at all: "This is my folder, twenty years of it. On Saturday night a doctor I had never met asked it questions. Here is what he said, and here is how many fields we read correctly." That is usefulness and aura in one, and it does not need his records on a projector.

### Demo story v2 (the CEO owns it; replaces the 8 steps of PRD section 4 for the stage)

About 2 minutes inside a 3-minute pitch. Five beats, in this order:

1. **Photo to record** (15 s, warmed): a paper exam becomes dates, values and ranges, next to the photo.
2. **Not yours** (5 s): an exam with another name is refused.
3. **The handshake** (15 s): the DNA-shaped code, the scan, "Let in", the doctor's screen opens.
4. **Question, source, original** (40 s): the question, the cited answer, the tap that opens the paper. Then "possible causes", where the orthopaedic imaging report and the blood markers meet (the founder's own example, shown inside this beat and not as a separate view). One glance at the matches panel for this jury.
5. **The door closes** (10 s): the patient taps "end access"; the doctor's screen closes.

Said, not performed: the symptom diary (its entries are already on the timeline), the access log, the matches consent.

### What to cut, and what not to

- **Cut first:** F3 (the contact request; one button at most), A3's series view, E4 as a separate view, the chain-verification badge of D3 (keep the plain list), both optional credits (Oumi, Firecrawl), the second language of the synthetic set.
- **Keep although they look optional:** replay mode and the typed code (stage safety), the reset, a minimal F1 and F2 on seeded data (for this jury), presentation mode and the wipe (the founder's decision).
- **Never cut:** photo to record, the identity match, the handshake, the cited answer.
- The CTO sets the final cut order. This is the CEO's cut line for him.

### The founder's own hours are part of the plan

He is the presenter, the patient, the owner of the test data, the one who finds the doctor and the one who talks to buyers. Saturday afternoon: kickoff questions, find the clinician, upload his exams himself. Saturday night: the role-play. Sunday: three rehearsals, then judging. No founder time on the name or on slide polish. Sleep is on the plan.

---

## 5. PRD comments

Severity: **must** = before the build starts or before the claim is made; **should** = this weekend; **nice** = scope B. "Status" is "open" until the section's owner accepts it in section 15 of the PRD; items inside the deck story are the CEO seat's own and are marked so.

| # | Section | Comment | Proposed change | Severity | Owner | Status |
|---|---|---|---|---|---|---|
| 1 | N4 (§3), the Data row of §4, §8 GDPR last bullet, §9 M2 and M4, 10.11, 12.8, Q12, Q32 | **The PRD still says "synthetic only". The founder decided otherwise:** his own exams, on a deployed demo, deleted after the test. The brief wins, and seven places contradict it, including a guard that would refuse and delete his exams. | Rewrite N4: "No third person's real data. The founder's own exams are the only real data, under the handling rules of the brief." Two data sets: the synthetic set (Maria) for every public screen, recording, screenshot, slide and the repo; the founder's set for the private role-play, only in the deployed private project. How the two sets are kept apart is the CTO's decision, now taken in his review: two projects, `dev` (synthetic, agents work freely) and `demo` (the founder's exams, agents deploy and never read), the marker guard dropped, sign-up closed. §8: say plainly that the demo processes one consenting adult's health data and no one else's. M2 gets a second line: accuracy on his real exams, reported as measured. | **must** | Product (N4, §4, §9), Backend (guard, wipe), CTO (handling rules, endpoint, wipe check) | open |
| 2 | Brief's handling rules; 12.8; §18 | **His records and a public stage.** Presentation mode hides the name and ID, but the medical content is the sensitive part, and a photo taken by the audience cannot be deleted. Finals are at SNFCC on Monday. **Agents are a second leak path:** an agent that debugs extraction on his exams has their content in its session. | (a) Recommendation to the founder: his exams appear only in the private role-play; any projector, video, screenshot or post shows the synthetic patient; the pitch carries the numbers and the doctor's words. (b) Rule for the CTO to confirm: agents build and debug on synthetic data only; the founder uploads his exams himself through the deployed app; a failure on a real document is described in words or reproduced with a synthetic look-alike; server logs must not keep extracted text. (c) The wipe has a date: after the last use, checked by the CTO, and it covers storage, database, model-side files, logs, the phone's camera roll and any recording. (d) The fallback video is recorded on synthetic data. | **must** | Founder (a); CTO (b, c); Frontend (d) | open |
| 3 | A1, 10.15 risk 1, 10.11 | **His real exams change what A1 must read.** They are Greek (assumed), multi-page, some are PDFs, and the imaging comes with image files. The PRD's demo criteria exclude PDFs and multi-page documents, and the fallback for weak Greek is "cut to English", which would cut his data out. | A1 [Demo]: add PDF upload and documents of a few pages; add image attachments (DICOM or JPEG) that are stored and shown and **never read by the AI**; the AI reads the radiologist's written report only, and the assistant never describes an image (a testable criterion next to C2). Fallback order: cut exam kinds first, keep Greek. The CTO re-fits the hours; something else leaves (the cut line of section 4). | **must** | Product (A1), Backend, CTO | open |
| 4 | §18, Q9, 10.14 | The timeline and the "about 20 hours" predate the event page (section 0 above). | Add: build starts Sat 12:00; no code or repo before it; finalists Sun about 20:00; a possible final on Mon 16 Nov at SNFCC. T0 = Sat 12:00. Ask at kickoff: track criteria, demo length, submission time. One line in the pitch on what was prepared before and what was built in the window. | **must** | Product (§18), CTO and Release (no build before noon) | open |
| 5 | §2 "Never a user or a buyer", N3, 13.2 "Never: insurers, in any form" | **The insurer rule is written wider than the founder's words.** He said the data must not reach "insurance companies as proofs" and stays "between the patient and the doctor". That is a data rule, and it is absolute. "No insurer as a customer, not a channel" is Product's and Marketing's extension, and it has five undecided edges (below). | Split N3: **N3a, data (the founder's words): no insurer or payer ever sees a record, a fingerprint or a verification.** **N3b, commercial (proposal): who may pay us**, decided by the founder with the five answers. Until he answers, slides say "insurers never see it" and nothing about channels. | **must** | Product; founder decides N3b | open |
| 6 | P2 (§7), Q30, 13.3 pillar 3, the "three rules" in 13.3 | **The first of the three rules said in every pitch, "you hold the key", is not true in the demo and only partly true in the product** (Backend, 10.2 and 10.B.2). | The CEO seat agrees with Q30 as a rule for all copy: claim only what runs, and say "simulated in the prototype" where it is. For the weekend the first rule reads "you decide who sees it, and for how long" (true tonight: consent, time limit, log). "The key on your phone" is shown as the product's design, not as the demo. Reword P2 as Backend proposes: "we cannot read it at rest". | **must** | Marketing (wording), Product (P2), Backend (the accurate sentences) | open; becomes a rule with the founder's sign-off |
| 7 | §8 table, E1, E4, E3 | **The line between "record" and "assistant" is drawn too generously for a slide.** E3 is a device, as written. But E4 ("points out findings from one that bear on the other") and E1's summary also interpret. "Needs no certification" must not be said about them. The slide is also EU-only, and the market is now global. | Step 1 of the slide = digitise, store, share, timeline, retrieval with citations. Summaries, the cross-specialty view and possible causes sit in step 3 until a regulatory adviser says otherwise. Wording: "outside the device rules as we read them, to be confirmed", never "needs no certification". Add one line each for the US (FDA's clinical decision support guidance, updated Jan 2026, secondary) and the UK, all behind Q18. Use the AI Act date only once Sales has it from a primary source (the research shows two dates). | **must** for the slide | Product (§8), Sales (Q18), Marketing | open |
| 8 | §8 title, Q26 | Where the regulatory slide sits. The founder: "We need to add it at a pitching deck as something at the end". | Deck story: the regulatory path is the last content slide, told as the roadmap ("what ships when"), and the ask is its last line. No separate slide after it on Sunday. This answers Q26. | should | CEO seat (deck story) | decided within the deck story; the founder can overturn |
| 9 | §5 cut order, 10.15, 12.11; CTO review section 4 | The cut order drops "possible matches" early (in the CTO's final order: helix animation → F3 → F1 and F2 → A3 series → D3 screen → E4 → …). For a Biotech & AI jury hosted by a research campus, a seeded count and pattern is the cheapest strong beat we have. | One swap for the CTO to consider: a minimal F1 and F2 screen (the switch and one seeded panel) moves below the A3 series and the D3 screen. The rest of his order stands, and the order is his to set. | should | CTO | open |
| 10 | §4 demo story | Eight live steps do not fit a 3-minute pitch. | Replace with demo story v2 (section 4 above): five beats; the diary, the log and the consent are said, not performed. The 8 steps stay as the M1 run checklist. | should | CEO seat (deck story); Product updates §4 | decided within the deck story |
| 11 | F1 to F3, P8, Q34: the ethics of "possible matches" | Sound in outline (opt-in, off by default, doctor-only, no hint for a patient who said no). Five gaps. (a) "Anonymous" is the wrong word: coded health patterns are pseudonymous in law, and Marketing's own list bans "fully anonymous". (b) A contact request concerns the *other* patient too. (c) The patient cannot see that he was matched or that his doctor was contacted. (d) The rare cases the founder most wants to help are the ones a minimum group size hides. (e) Matching for care and research use are different purposes and must not share one consent. | (a) Title and copy: "opt-in, without name or ID". (b) and (d): accept Backend's "blind introduction" with fresh consent from both patients at the moment of contact, and no counts below the threshold (Q34), subject to an ethics review before any launch. (c) Every match query and contact request goes into the patient's log (P7). (e) One consent per purpose; "possible matches" is care between treating doctors; research is separate, later, and off this switch. In the demo the panel says "seeded data". | should (demo wording); **must** before any product use | Product, Backend, Marketing | open |
| 12 | G2 (§3), B1 | "Nobody can add someone else's exam" promises more than the control gives. Backend says it plainly: the match stops a careless claim, not a forger. The founder's own bar is lower and honest: "just to secure that I will not take other's exam as mine". | G2: "An exam that carries someone else's name or ID is refused." The mismatch test on stage uses a synthetic document of another person, never a real one. | should | Product | open |
| 13 | §9 M8 and scope B | M8 measures a prize we do not control. Nothing in §9 feeds the decision after the weekend. Scope B's targets (40%, 70%, 30%) have no basis yet. | Add learning metrics that are gate G0: the role-play happened and the doctor's verdict is recorded; accuracy on the real exams (M2b); follow-ups asked for. Mark the scope B targets as placeholders until the interviews. | should | Product; CEO seat for M8 | open |
| 14 | §2 Buyer row, Q17, §14 (empty), Q24 | The buyer is "hospitals, clinics, governments" and the deck needs one first payer. Section 14 is empty and Sales has not signed. | Q17, the CEO seat's answer for the deck: the patient never pays; the first payer is the international-patient department of a hospital (per case or per seat, a hypothesis); governments are an import partner, not a year-one buyer. Q24: no dollar TAM, SAM or SOM on Sunday's deck (Sales itself lists them under "do not put on a slide"); show the verified problem numbers and, at most, the seat formula as an assumption. | should | Sales (§14), CEO seat (deck) | Q17 and Q24 decided within the deck story |
| 15 | Q32 | Judges' own documents. | No judge uploads. A judge's exam is a third person's health data with no legal basis, and the founder's consent covers his own records only. The CTO reaches the same result by closing sign-up and dropping the marker guard; agreed. | **must** | Product, Backend | settled by the CTO's review; the CEO seat agrees |
| 16 | D2, Q7 | 15 minutes is right as a default and wrong for a stage: nobody waits for it. | Keep 15 minutes. On stage the patient ends the access with one tap (D2 already has it). No new work. | nice | Frontend | open |
| 17 | §1 Evidence | "Sample size: 0" is honest. The Park conversations will not be comparable unless the questions are fixed first. | Five written questions for doctors and five for patients, on one page, before Saturday noon. | should | Marketing with Sales | open |
| 18 | N7, E5, scope B | The steelman's lesson (section 2, B). | Scope B note: the record, the handshake and the provenance marks are the product; the assistant is a part that can be swapped for the doctor's own tools; plan a standard export (the CTO names the format). | nice | Product, CTO | open |
| 19 | §16 | Two rows are unsigned at the time of this review (Product, Sales) and section 14 is empty. The CTO signed with conditions tonight. | The CEO row is signed with conditions that name them. | process | Product | n/a |
| 20 | Q33 (launch regions) | Two different questions are answered as one. Backend and the CTO say where the data lives first (the EU). Sales says who buys first (international-patient departments, many of them outside the EU). | Keep them apart. One data cell first, in the EU (the CTO's call). First buyer: an international-patient department that serves EU residents, so the EU cell fits. No second region before a named buyer pays for it. The deck's roadmap says "EU-hosted pilot first" and names no country order. Not decided before gate G2. | should (scope B) | CEO seat with Sales | open |

### 5a. Where this review and the CTO's meet

The founder asked the C level to approve together, so the two reviews must not pull apart. They agree on the substance.

| Topic | CTO's review | This review | Result |
|---|---|---|---|
| The founder's exams and agents | Two projects; agents never read `demo` | Comment 2b | Same. The CTO's design is the rule. |
| Judges' documents (Q32) | No uploads; guard dropped | Comment 15 | Same. |
| Greek, PDFs, multi-page, images | Handled; "cut to English" removed; images never reach the model | Comment 3 | Same. |
| Privacy claims (Q30) | Allowed / product-only / forbidden list (his section 6) | Comment 6 | Same. His list is the reference for Marketing. |
| The founder's exams on stage | Recommends the synthetic patient on stage, with an optional 20-second "this is my own record" moment | Comment 2a: the synthetic patient on every public screen; the folder, the numbers and the doctor's words carry the point | One small difference: I would not take the optional moment on a recorded public stage. The founder decides. |
| Rare cases and group size (Q34) | Blind introduction accepted in principle, with conditions | Comment 11 | Same. |
| The cut order | His final order (his section 4) | Comment 9 | One swap requested, for this jury. His call. |
| AI endpoint, retention, the €30 cap | Decided and asked of the founder (his section 9) | Section 8, item 4 | The CEO seat supports both of his recommendations. |
| Demo story: which steps use which data | Asks the CEO and Product to record it | Demo story v2 | All five stage beats run on the synthetic patient. The founder's exams are used in the role-play only. |

### The insurer rule: a recommendation for each of the five open buyer questions

The founder decides all five. One test runs through my answers: *does this body decide what is covered, what is paid or what a person costs? Then it never sees a record, and for now it does not pay us either.* The reason for the second half is the stage we are at: trust is the whole product, and PatientsLikeMe after its sale to UnitedHealth (research, 2.3) shows what one insurer link does.

| # | Question | Recommendation | Why |
|---|---|---|---|
| 1 | **Public payers** (statutory funds, Medicare, EOPYY and the like) | **Excluded**, the same as private insurers: no data ever, and no sale for now. Revisit only for a named case in which a ministry pays for citizens' accounts with no data flowing back. | A public payer makes the same coverage decisions. "As proofs" is about the decision, not about who owns the insurer. |
| 2 | **Hybrid bodies** (India's NHA: ABDM plus PM-JAY; the NHS as commissioner and provider) | **Accept the split, as a partner only:** talk to the digital-record arm about import and standards; they are not a customer; no data moves to the scheme or commissioning side, by the technical controls of 10.B.6 and in writing. | They own the rails we must import from. Refusing to talk to them shuts whole countries. |
| 3 | **Employers with self-funded benefits** | **Excluded.** | A self-funded employer is the insurer in function and also holds the person's job. It is the case the rule exists for. |
| 4 | **A pharma research line** | **Not now, and not on the "who pays" slide.** At most one grey line: "later, only by a separate consent, through the legal research routes, never a data sale". Revisit after a first clinical pilot, with an ethics board. For this weekend's jury, speak about research as a door only the patient can open. | The founder's answer to flag 4 was about doctors finding cause and cure together. It was not about selling research access. The host will ask; the answer above is a strength, not an apology. |
| 5 | **Insurer-owned hospitals** | **Excluded as pilots and first customers.** Later, a founder decision case by case: only as care providers, with clinician-level access under the technical firewall and no group-level reporting. | The revenue is small next to the reputational risk at this stage. `buyers.md` already avoids Euroclinic for this reason. |

### The founder's own exams: my read

It is his data and his call, and it is the best thing in this plan: it turns a demo into a test. Four things make it safe: (1) real data never touches a public screen or a recording (comment 2a); (2) no agent reads it (comment 2b); (3) the AI endpoint is paid, with no training and no retention, and a credit whose terms are unclear stays out of the path, as he already said; if the event credit cannot give that, a paid key is a small spend that needs his yes; (4) the wipe has a date and the CTO checks it, and what is kept afterwards is only numbers and the doctor's words. The doctor in the role-play should be told beforehand that it is a product test on real records and not a consultation.

---

## 6. Deck story check

I comment on the arc. Anna's file is hers.

**The three claims the deck must prove, and with what:**

1. **The problem is real and nobody has closed it where we aim.** The history is scattered, and almost nobody reassembles it: 59% of US adults have several portals and 7% combine them (verified, ONC 2024); about 1 in 10 patients is harmed in care (verified, WHO). Old paper and cross-border history sit on no rail. Proof on stage: the folder.
2. **It works, and a doctor can check it.** Photo to record; the answer with its source; the identity and provenance marks. Proof: the live demo, plus the measured numbers and the doctor's words from the role-play.
3. **It can ship safely, and someone pays.** Three rules (the patient decides who sees it and for how long; the patient never gets a diagnosis from us; insurers never see it). The regulatory path as the roadmap. One first payer. Proof: the real/simulated table, the closing slide, a named wedge marked as a hypothesis.

**Comments on the arc (13 slides: hook, problem, why now, product, demo, privacy, matches, market, competition, business model, go-to-market, regulatory path, team and ask):**

- Thirteen slides is the investor version. Sunday needs a cut of six or seven with the demo inside the first minute: hook (the folder) → problem (one number) → live demo → how it is safe (three rules, and what is real tonight) → who pays first → regulatory path as the roadmap, with the ask as its last line. The rest is an appendix for questions and for Monday.
- Show, then explain: the product slide folds into the demo.
- One sentence against the platforms is enough: they answer the patient; we answer the doctor, with the source, across borders.
- For this host, "possible matches" gets one beat in the demo and one sentence, framed as care by consent.
- No dollar market size (comment 14). No "you hold the key" for the demo (comment 6). No "needs no certification" (comment 7).
- The end: the regulatory path closes the deck (comment 8). If a team line is needed, it goes before it. The log's precedent for pitch material is a solo founder with advisors only and one open ask (2026-11-10, written for the studio deck); for this deck the team line and the ask are the founder's (Q27). My recommendation is below.
- Say once, plainly, what was prepared before Saturday noon and what was built in the window. It is the rule of the event and it is craft.

**Name.** I add no name. Anna's test (five people; drop "Anamna" if two hear "amnesia") is right. The demo wins or loses without a name; a working name on the cover is fine.

---

## 7. Sign-off

**CEO row of PRD section 16: signed with conditions, 13 Nov 2026.** My part (section 15, the deck story) is complete. Nothing in the others' parts blocks design starting tomorrow. The conditions, all before the first build story starts or before the claim is made:

1. Comment 1: the PRD follows the founder's test-data decision, and the CTO confirms the handling rules, the endpoint and the wipe before any real exam is uploaded.
2. Comments 2b and 3: agents work on synthetic data only; images are stored and never read by the AI; the CTO's review re-fits the hours with these additions.
3. Comment 4: no code before Saturday 12:00; the timeline carries Monday.
4. Comments 6 and 7: copy claims only what runs; the regulatory slide uses the scoped wording; Sales verifies the facts (Q18) before they go on a slide.
5. Comment 5: the insurer rule is split, and no slide says more than "insurers never see it" until the founder answers the five questions.
6. The Product and Sales rows are signed, section 14 is written, and the CTO's own conditions are met (his review, section 10).

The founder's row is his.

---

## 8. Founder decides (six, each with my recommendation)

1. **After the weekend.** Recommendation: park by default and continue only through gates G0 (15 Nov), G1 (30 Nov) and G2 (15 Jan 2027), with about 4 hours a week of your time and no money until G1. No third product is opened by the hackathon itself.
2. **Your exams and public screens** (the same question as the CTO's number 3). Recommendation, with the CTO: option (a). Your real exams are used only in the private role-play with a doctor; every projector, video and post shows the synthetic patient; the pitch carries the numbers and the doctor's words. I would also skip the optional 20-second "my own record" moment on a recorded stage. Wipe on Sunday night after judging; a Monday final runs on synthetic data.
3. **The insurer rule's five edges.** Recommendation: public payers excluded; hybrid bodies as import partners only, digital arm only; employers excluded; no pharma line now and none on the "who pays" slide; insurer-owned hospitals excluded as pilots. The data rule itself stays absolute in your words.
4. **The AI path for your exams** (the CTO's numbers 1 and 2). Recommendation: yes to both, as the CTO proposes. Accept that Google may keep requests for a limited time to detect abuse (no training; EU region; caching off), and allow up to €30 on your own billing if the credits do not fit. Until you answer, your real exams wait and the build runs on synthetic data.
5. **Team and ask (Q27).** Recommendation: use Saturday's team formation to bring in one clinician, as a teammate or as the role-play doctor. The last slide asks for two things and no money: doctors who will test it, and a clinical co-founder.
6. **Four small confirmations at sign-off.** Recommendation: model training stays out of both scopes (Q15); access lasts 15 minutes by default (Q7); the recap post goes from your personal LinkedIn only, in English, with no minhOS or TravelHood tags and no image of a real exam (Q28); the cover uses a working name unless "Anamna" passes the five-person test (Q14).
