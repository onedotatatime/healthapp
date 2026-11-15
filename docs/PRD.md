# Health app (working name "healthapp"): PRD

| | |
|---|---|
| **Version** | v1, 13 Nov 2026. Round 1: Product's part is written; the other roles' sections are empty and carry their owner's name. |
| **Owner** | Back Logakis (Product). Every role writes its own section. |
| **Status** | Draft. Not approved. No build story starts before the Sign-off table (section 16) is complete, the founder's row included. |
| **Source of record** | [`00-founder-brief.md`](00-founder-brief.md): the founder's words, verbatim. If this PRD and the brief disagree, the brief wins. |
| **Linear** | Project "Health app — hackathon prototype" (team minhOS). Parent MIN-4422. PRD: MIN-4423. Sales MIN-4424 · CEO MIN-4425 · CTO MIN-4426 · Backend MIN-4427 · Design MIN-4428 · Marketing MIN-4429 · Frontend MIN-4430. |
| **Event** | Gen AI Summit Hackathon, Athens LifeTech Park, Sat 14 – Sun 15 Nov 2026, Biotech & AI track. |

**How to read this document.** A line in a quote block is the founder's own words, copied from the brief. Anything marked ***proposal*** is Product's (or the coordinator's) inference. A proposal is not scope until the founder signs section 16. Questions between roles go on MIN-4422, and the open ones are numbered in section 17.

---

## 1. Problem

> * Until now all people have their exams and theis medical history in papers photocopies etc
> * If I want to go to a doctor I need to tell him my history and dont forget to take my exams with me plus he cannot read all my previous exams so as to get my diagnosis. So he make some guesses or missing some info
> * Why not digitizing once our past exams so as the doctor has overview and ask AI for info about the past, like an assistant for the doctor to ask specific questios and the assistant help him to find the right diagnose and also close the gap between doctors eg the orthopedic to combine results with reumatologist

In one sentence: a patient's medical history lives on paper in a drawer, so every doctor works from what the patient remembers to bring and to say, and two specialists treating the same person rarely see each other's results.

**Who has the problem.** The patient, at every visit to a new doctor. The doctor, who has minutes to read years of history. Two doctors of different specialties, who have no shared view.

**Cost of not solving it.** Guesses, missed information and repeated exams (the founder's words: "he make some guesses or missing some info"). Numbers for how often and how costly are Sales' part: [`research/market-and-competitors.md`](research/market-and-competitors.md). This PRD does not state market numbers of its own.

**Evidence today.** The founder's own experience. No interviews with patients or doctors yet (sample size: 0). The first evidence comes from the event: "We can find stuff from the Athens LifeTech Park tomorrow".

---

## 2. Users

| User | Who | What they need | In the hackathon demo |
|---|---|---|---|
| **Patient** | An adult with exams on paper, seeing more than one doctor | Digitize once; note symptoms as they happen; decide who sees the record and for how long | Yes |
| **Doctor** | A specialist seeing the patient, often for the first time | An overview of the full history; answers to specific questions with the source in view; a combined view across specialties | Yes |
| **Second doctor** | A doctor treating another patient with a similar pattern | To be contacted, with consent, by a colleague looking for cause and cure | Simulated |
| **Buyer** (later) | Hospitals, clinics, governments (founder: "hospitals, clinics etc or even governments") | Sales' part: [`research/buyers.md`](research/buyers.md) | No. Deck only |

**Never a user or a buyer: insurers.**

> * These data should not be accessible to insurance companies as proofs. they should be totally disclosed between the patient and the doctor.

Product's reading (***proposal***): "totally disclosed between" means the record is private to the patient and the doctors the patient lets in. No insurer access, no export built for insurers, no insurer as a customer.

---

## 3. Goals and non-goals

### Goals

| # | Goal | For whom | How we know (details in section 9) |
|---|---|---|---|
| G1 | A patient digitizes a paper exam from a photo, and the record holds its dates, values and conditions | Patient | Field accuracy on the test set; time from photo to record |
| G2 | Nobody can add someone else's exam to their own record | Patient, doctor | Every mismatched test document is refused |
| G3 | A doctor gets the patient's full history only after the patient lets them in, in person, and only for a set time | Both | Zero access outside a grant; expiry verified |
| G4 | A doctor asks questions over the full history and every answer shows the exam it came from | Doctor | Share of answers with a citation that opens the right source |
| G5 | The demo runs end to end on stage, and the deck tells the story through to the regulatory path | Founder, judges | Three clean runs before judging; the deck's last slide |

### Non-goals

| # | Non-goal | Why |
|---|---|---|
| N1 | **No diagnosis for patients. Ever.** The patient has no AI that explains, interprets or suggests causes. | Founder: "The patient cannot ask his AI for diagnosis we dont want them to be their doctor" |
| N2 | **No health data on any blockchain**, named or unnamed. | Flag 1, founder: "Agree, that was my point" |
| N3 | **No insurer access**, in the demo or the product. | Founder, quoted in section 2 |
| N4 | **No real patient data in the demo.** Synthetic exams and synthetic people only. | A hackathon prototype has no legal basis, no DPIA and no security review for real health data |
| N5 | **No model training on patient data.** | Founder: "needs discussion"; his answer to flag 4 turned it into opt-in "possible matches". Parked until he reopens it (Q15) |
| N6 | No certification work, no hospital-system integration, no appointments, telemedicine or payments in the demo. | They do not fit about 20 hours and do not change what the judges see |
| N7 | The app does not replace the doctor's own medical record system. | It is the patient's record, shared with a doctor. A different product otherwise |

---

## 4. Two scopes, kept apart

There are two scopes. Every story in section 6 says which one each of its criteria belongs to.

- **Scope A: the hackathon demo.** What can be built in about 20 hours at the event with the event credits, on synthetic data, to be shown live to the judges.
- **Scope B: the product after the event.** What a real product needs. Nothing in scope B is built at the event.

| Capability | Scope A: demo (about 20 hours) | Scope B: product |
|---|---|---|
| Photo → digitized exam | Gemini reads a photo of a synthetic exam into structured data. Three exam types. Greek and English documents. | More exam types, multi-page documents, PDFs, handwriting, a measured accuracy bar on real documents |
| Identity match | Name and ID on the document are compared with the account profile. Mismatch is refused. | The account holder's identity is proven once (Q3). Dependants (a parent holding a child's exams). |
| Verified by source | Every upload is marked "uploaded by patient". One seeded record shows "verified by source" (simulated; Q4). | Real verification: a lab's digital signature or QR code, or the Greek national systems (e-prescription, myHealth), per flag 2 |
| Symptom diary | Entries with time, text and severity. The doctor sees them on the timeline. | Reminders, attachments, structured symptoms |
| DNA-shaped QR handshake | The patient shows the QR, the doctor scans it, the patient approves, access runs for a set time. | Doctor identity checked against a registry (Q5). Patient-chosen durations. |
| Doctor's AI assistant | Timeline, questions with cited answers, "possible causes" for the doctor only, a cross-specialty summary. Gemini only. | Specialised medical and research models (founder: "connections with other LLMs that specialised to research and medical data"). This part is a medical device (section 8). |
| Possible matches | Opt-in switch for the patient. Matches come from a seeded synthetic set. Doctor-to-doctor contact is simulated. | A real opt-in network across patients and countries, with a re-identification guard (Q6) |
| Privacy | Principles of section 7 shown in the demo; some are simulated and say so (Backend maps each one in section 10). | Principles of section 7 in full, reviewed |
| Data | Synthetic only | Real, under GDPR |

**Event credits (*proposal*; Backend confirms in section 10 and Q13).** Gemini reads the exam photos and answers the doctor's questions. Possible uses for the others, none decided: fal for the DNA-shaped QR visual or deck images; Firecrawl to fetch public medical reference pages the assistant can cite next to the patient's own exams; Oumi to score extraction quality on the test set. What boxd and treg offer is confirmed at kickoff. Wonderful credits are for selected teams only and are not assumed.

### The demo story (*proposal*, about 3 minutes; the CEO owns the final version in the deck)

1. Maria (synthetic) has a folder of paper exams. She photographs a blood test. Seconds later the record shows the date, the lab, each value with its unit and range, and what is out of range.
2. She tries to add her husband's exam. The app refuses: the name and ID on the document are not hers.
3. Over three weeks she notes joint pain in the diary as it happens. The app records it and says nothing about what it might be.
4. At the orthopaedist, her phone shows the DNA-shaped QR. The doctor scans it, she approves, a countdown starts.
5. The doctor asks: "Has her CRP been raised before, and when?" The answer lists the dates and values, each one linked to the exam it came from. He opens one and sees the original photo.
6. The doctor asks for possible causes. The assistant combines the orthopaedic imaging with the blood markers a rheumatologist would look at, and lists possibilities to evaluate, each with its sources.
7. Maria opted in to "possible matches". The doctor sees there are unnamed patients elsewhere with a similar pattern and asks to contact one treating doctor.
8. The access time ends. The doctor's screen closes. Maria's access log shows who looked, when, and until when.

---

## 5. Priorities for scope A

| Priority | Stories | Rule |
|---|---|---|
| **P0** (the demo fails without it) | A1, A2, B1, B2, C1, C2, D1, D2, E1, E2, E3 | Built first, in the order of the demo story |
| **P1** (strong on stage, built if P0 is done) | E4, F1, F2, F3, D3, A3 | Built in this order |
| **Scope B only** | E5, and every criterion marked "Product" | Not built at the event |

**Cut order if time runs out (*proposal*; the CTO sets the final one in his review):** F3 → F2 and F1 → A3 → D3 → E4. E3 (possible causes) is the last P0 to cut: without it the demo is still a working record with a cited assistant.

**Freeze (*proposal*):** no new feature in the last 2 hours before submission. That time is for three full runs of the demo story.

**Decisions Product has taken for scope A** (reversible; say so on MIN-4422 if you disagree):

- The demo's interface is in **English**. The exams it reads are in **Greek and English**. Bilingual interface: n/a for the demo, it is a prototype for one event.
- Analytics events: n/a for the demo. The access log (D3) is the only record of use it needs. The product's event list is written with the product's build stories.
- The patient side has **no free-text AI box at all**. It is the simplest way to guarantee N1.

---

## 6. User stories and acceptance criteria

Each criterion is tagged **[Demo]** (scope A) or **[Product]** (scope B).

### A. Photo → digitized exam

> * The user can take photo and we digitize and read the exam data dates conditions etc

**A1. Photograph an exam and get a structured record** (P0)
As a patient, I want to photograph a paper exam and have the app read it, so that I digitize my history once and stop carrying paper.

- [Demo] Given I am signed in, when I photograph (or upload a photo of) an exam, then within 60 seconds (target 30) I see a record with: exam type, exam date, the lab or doctor who issued it, the patient name and ID printed on it, and every result with its value, unit and reference range.
- [Demo] Values outside their printed reference range are marked as out of range. The app shows the range from the document; it does not explain what the value means (N1).
- [Demo] Findings and conditions written in the document (for example a radiology conclusion) are stored as the document's own words, with the date.
- [Demo] It works for three exam types, in Greek and in English: a blood test, an imaging report, a doctor's letter or discharge note.
- [Demo] If the photo cannot be read (blurred, cut off, not a medical document), the app says so and asks for a new photo. It never saves a half-read record silently.
- [Demo] The original photo is kept with the record and can be opened from it.
- [Product] Multi-page documents, PDFs and handwriting. A measured accuracy bar on real documents before launch (section 9).

**A2. Check and correct what the app read** (P0)
As a patient, I want to see what was read next to my photo and fix mistakes, so that my doctor does not work from a wrong number.

- [Demo] Before the record is saved, I see the extracted fields next to the photo and confirm them.
- [Demo] I can correct a field. A corrected field is marked "edited by patient", and the doctor sees that mark.
- [Demo] The patient name and ID fields cannot be edited (they feed the identity match, B1).
- [Product] A field the model is unsure about is highlighted for the patient to check.

**A3. See my history in date order** (P1)
As a patient, I want all my exams and diary entries on one timeline, so that I can see my history is complete.

- [Demo] Exams and diary entries appear in date order, by the exam's own date, not the upload date.
- [Demo] A value that appears in several exams (for example CRP) can be seen as a series over time.
- [Demo] The timeline shows the patient's data only. It carries no interpretation (N1).

### B. Identity match: nobody claims someone else's exam

> * The named data should be abled to be confirmed by the original document with the patients name and ID so as not to fake documents and diagnoses. We need to make sure that the person and the data is totally clear

Flag 2 and the founder's answer: "thats true, somehow just to secure that I will not take other's exam as mine"

**B1. The exam must be mine** (P0)
As a patient and as a doctor, I want the app to accept an exam only when the name and ID on the document match the account holder, so that nobody builds a record out of another person's exams.

- [Demo] Given an exam whose printed name and ID match my profile, when I save it, then it is added to my record.
- [Demo] Given an exam whose printed name or ID does not match my profile, when I try to save it, then it is refused, with a plain message naming what did not match. It is not stored in my record.
- [Demo] The name comparison treats Greek and Latin spellings of the same name as equal (ΠΑΠΑΔΟΠΟΥΛΟΥ / PAPADOPOULOU). The ID comparison is exact.
- [Demo] Given an exam with a name but no ID printed on it, when the name matches, then it is accepted and marked "name match only", and the doctor sees that mark. (***proposal***: Product's rule for the demo.)
- [Demo] Given an exam with no readable name, then it is refused.
- [Product] The account holder's own identity is proven once at sign-up, so the profile cannot be set to anyone's name (Q3). Which ID is used in Greece is part of Q3.
- [Product] Dependants: a parent holding a child's exams. Out of the demo.

**B2. Every record says where it came from** (P0)
As a doctor, I want each record to say whether its source confirmed it or the patient uploaded it, so that I know how much weight to give it.

- [Demo] Every record carries exactly one of two marks: **"Verified by source"** or **"Uploaded by patient"**. The mark shows wherever the record or a citation to it appears.
- [Demo] A photo upload is always "Uploaded by patient". A photo alone never earns "Verified by source" (flag 2: a photo cannot prove a document is authentic).
- [Demo] One seeded record shows "Verified by source", so the difference is visible on stage. How it is simulated is Q4.
- [Product] "Verified by source" is given only when the source confirms the document: a lab's digital signature or QR code, or the Greek national systems (e-prescription, myHealth).

### C. Symptom diary: the patient records, the app does not diagnose

> * The patient cannot ask his AI for diagnosis we dont want them to be their doctor but they can enter their symptoms while they are happening so as the doctor has clear view about his patient

**C1. Note a symptom while it is happening** (P0)
As a patient, I want to note a symptom the moment I have it, so that my doctor sees what happened and when, not what I remember weeks later.

- [Demo] I can add an entry with free text and a severity from 1 to 10. The time is set automatically and can be changed for an entry added later; a changed time is marked.
- [Demo] An entry can be added in under 30 seconds from opening the app.
- [Demo] Entries appear on the doctor's timeline, in date order, between the exams.
- [Product] Reminders during an episode, photos, structured symptom lists.

**C2. No diagnosis on the patient side** (P0; this is N1 as a testable story)
As the founder, I want the patient side to give no diagnosis of any kind, so that the app never acts as the patient's doctor.

- [Demo] The patient side has no AI question box.
- [Demo] After a diary entry is saved, the app confirms it was saved. It shows no cause, no condition name, no advice and no urgency rating.
- [Demo] "Possible causes" (E3) and every assistant answer are visible only in a doctor session. They are never shown, sent or exported to the patient side.
- [Demo] One fixed line may appear on the diary screen: in an emergency call 112. (***proposal***; Marketing owns the wording.)
- [Product] The same rules hold for every future patient feature. A change to this rule is the founder's decision only.

### D. The DNA-shaped QR handshake

> * The doctor can request access to the patients data by scanning his device with a QR that looks like a DNA (DNA just for the fun)

**D1. Let a doctor in, in person** (P0)
As a patient, I want to let a doctor into my record by showing a code on my phone that the doctor scans, so that access is given only when we are in the same room and I agree.

- [Demo] When I tap "Share with a doctor", my phone shows a QR code styled as a DNA helix. The code is valid for a short time and for one use.
- [Demo] When a signed-in doctor scans it, my phone shows who is asking (the doctor's name and specialty) and I approve or refuse.
- [Demo] Only after I approve does the doctor's screen open my record. Target: 15 seconds from scan to open record.
- [Demo] A refused, expired or already-used code opens nothing and says why.
- [Demo] The code itself contains no health data and no name. It only starts the request.
- [Product] The doctor's identity and licence are checked before a doctor account can scan (Q5).

**D2. Access ends** (P0)
As a patient, I want the doctor's access to end by itself and to be able to end it early, so that no doctor keeps a door into my record.

"Time-limited" is not in the founder's words. It comes from flag 1 ("access grants") and the coordinator's brief, so it is a ***proposal*** until the founder signs. (Q7)

- [Demo] A grant has an end time. Demo default: 15 minutes, with a visible countdown on both screens. (***proposal***)
- [Demo] When the time ends, the doctor's session closes and a new request returns "no access".
- [Demo] I can end the access early with one tap, and it takes effect at once.
- [Product] I choose the duration when I approve (for example: this visit, 24 hours, 7 days). What the doctor may keep after access ends is Q8.

**D3. See who looked** (P1)
As a patient, I want a list of every access to my record, so that I know who saw it, when, and until when.

- [Demo] The log lists each grant: doctor, time given, end time, ended early or expired.
- [Demo] Entries cannot be edited or deleted from the app. Each entry is chained to the one before it (the signed log of section 7), and the screen can show that the chain is intact.
- [Product] The log also records each record the doctor opened and each question asked.

### E. The doctor's AI assistant

> * The AI can analyze the data and try to find possible causes of the problem that only the doctor can evaluate better or connections with other LLMs that specialised to research and medical data

**E1. An overview before the first question** (P0)
As a doctor, I want a one-screen overview of the patient's history when access opens, so that I do not start from zero.

- [Demo] The overview shows: the timeline of exams and diary entries, the values that were out of range and when, and the conditions written in the documents.
- [Demo] Every item carries its provenance mark (B2), plus "edited by patient" or "name match only" where it applies.
- [Demo] Every statement in the overview links to the exam it came from.

**E2. Ask a question, get an answer with its source** (P0)
As a doctor, I want to ask specific questions about the patient's past and see which exam each answer comes from, so that I can check it in seconds and trust it.

Citing the source exam is not in the founder's words. It is a ***proposal*** from the coordinator and Product, and it is the reason a doctor can check an answer instead of trusting it blindly.

- [Demo] Given an open session, when I ask a question about the history (for example "When was her CRP raised?"), then the answer states the facts with their dates, and each fact carries a citation.
- [Demo] Tapping a citation opens the source record: the extracted values and the original photo, with its provenance mark.
- [Demo] When the record does not hold the answer, the assistant says "not in this record". It does not fill the gap from general knowledge.
- [Demo] A statement that comes from general medical knowledge and not from the record is visibly marked as such and kept apart from the cited facts.
- [Demo] The assistant answers only inside a valid grant. When the grant ends, the conversation closes.
- [Product] Every question and answer is written to the access log (D3).

**E3. Possible causes, for the doctor only** (P0, last P0 to cut)
As a doctor, I want the assistant to list possible causes that fit the whole history, so that I have candidates to evaluate that I might not have thought of.

- [Demo] On request, the assistant lists possible causes. Each one names the records and diary entries it rests on, with citations.
- [Demo] The list is headed, in plain words, as possibilities for the doctor to evaluate and not a diagnosis. The wording is Marketing's (section 13).
- [Demo] It is available only in a doctor session and never reaches the patient side (C2).
- [Product] This function makes the product a medical device under EU MDR (section 8). It ships only after certification.

**E4. A view across specialties** (P1)

> close the gap between doctors eg the orthopedic to combine results with reumatologist

As a doctor, I want the assistant to bring together results from other specialties, so that I see what a colleague in another field would notice.

- [Demo] On request, the assistant groups the history by specialty (for example orthopaedic imaging, rheumatology blood markers) and points out findings from one that bear on the other, each with citations.
- [Demo] It works on the demo patient's orthopaedics and rheumatology case.
- [Product] Two doctors who both hold a valid grant for the same patient can see each other's notes, if the patient allows it.

**E5. Specialised models** (scope B only)
As a doctor, I want the assistant to consult models specialised in medical and research data, so that the possibilities reflect current research.

- [Product] Which models, on what terms, and what data may be sent to them is decided with Backend and the CTO (Q16). No patient identity is ever sent.

### F. Possible matches (opt-in, anonymous)

> * Explore the possibility to use the data anonymous or training other models??? needs discussion

Flag 4 and the founder's answer: "True -> we need something like "possible matches". Somehow to ask the user if we can use his data anonymous so as to find matches about his condition with someone else acrross the globe and give doctor the possibility yo communicate for finding cure and cause"

**F1. The patient is asked, and can say no** (P1)
As a patient, I want to be asked whether my data may be used anonymously to find people with a similar condition, so that I decide.

- [Demo] The switch is off until I turn it on. The text says what is used, that my name and ID are never used, and that I can turn it off again.
- [Demo] Turning it off removes me from matching from that moment.
- [Demo] The app works in full without it.
- [Product] The consent is recorded with its date and wording. Withdrawal removes the patient's matching data.

**F2. The doctor sees that similar cases exist** (P1)
As a doctor, I want to see whether other patients, anywhere, show a similar pattern, so that I can look for cause and cure with the doctors treating them.

- [Demo] In a session with a patient who opted in, the doctor sees the number of possible matches and, for each, the shared pattern only (for example the same markers and symptoms). No name, no ID, no exact dates, no location below country.
- [Demo] Matches come from a seeded synthetic set.
- [Demo] For a patient who did not opt in, the doctor sees no matches and no hint that matching exists for that patient.
- [Product] A match is shown only when enough patients share the pattern that none can be singled out. The threshold is Q6.

**F3. Doctor-to-doctor contact** (P1)
As a doctor, I want to ask to be put in touch with the doctor treating a matched patient, so that we can compare notes.

- [Demo] The doctor sends a contact request for a match. The other doctor's identity is not shown until that doctor accepts. In the demo the other side is simulated.
- [Demo] The patients' identities are never shown to the other doctor, before or after acceptance.
- [Product] Both doctors are verified. Each patient's opt-in is checked again at the moment of contact.

---

## 7. Privacy principles

> * We care about his privacy so we need to find a way to secure his data maybe at blockchain

Flag 1: "No health data on a blockchain, not even unnamed data (GDPR right to erasure; re-identification). Encrypted storage with the key on the patient's phone; the chain (or a signed log) holds only document fingerprints and access grants." Founder: "Agree, that was my point"

| # | Principle | What it means | Scope |
|---|---|---|---|
| P1 | **Encrypted storage** | Exams, extracted data and diary entries are stored encrypted. | Demo and product |
| P2 | **The key is on the patient's device** | Without the patient's device nobody can read the record: not us, not a doctor outside a grant. | Product in full. In the demo, Backend states in section 10 how far this is real and how far simulated |
| P3 | **Fingerprints and grants only** | The chain, or a signed log, holds only document fingerprints (hashes) and access grants. | Demo and product. Chain or signed log: Q2 |
| P4 | **No health data on any chain** | Not named, not unnamed, not encrypted. A chain cannot forget, and the patient has the right to be forgotten. | Demo and product |
| P5 | **No insurer access** | No account type, export or interface for insurers. | Demo and product |
| P6 | **The patient lets people in** | A doctor sees the record only after the in-person handshake and the patient's approval, and only until the grant ends. | Demo and product |
| P7 | **Everything is logged, and the patient can read the log** | Every grant is in a log the patient can see and nobody can edit. | Demo (grants). Product (also each record opened) |
| P8 | **Named and unnamed data are kept apart** | Matching (F) uses data without name or ID. The link between a person and their data is made only inside a handshake. | Product. Simulated in the demo |
| P9 | **Opt-in for anything beyond care** | Any use beyond the patient's own care needs the patient's explicit yes, and it can be withdrawn. | Demo and product |
| P10 | **No diagnosis for patients** | Section 6, C2. | Demo and product |

**About the founder's ninth requirement.** He wrote: "To complete create anonymity we need to find a way to have the NONAMED data in one place at blockchain and only can be confirmed with the patients data only the doctor and the patient handshake their phones with the DNA scan". After flag 1 ("Agree, that was my point") the part "at blockchain" no longer holds for health data. What stays, in Product's reading (***proposal***), is P8: the unnamed data lives apart from the identity, and only the handshake joins them.

**One tension, stated plainly.** P2 says only the patient's device can read the record. But a model has to read the exam photo, and the assistant has to read the history to answer the doctor. In the demo this is harmless, because the data is synthetic. In the product it is the hardest privacy question in this document: where the model runs and what its provider can see. It is Q1, and Backend and the CTO own it.

---

## 8. Regulatory path (pitch deck closing slide)

Flag 3: "Suggesting possible causes makes it a medical device under EU MDR (certification). Fine for the hackathon; costly for a product." Founder: "We need to add it at a pitching deck as something at the end"

This section is the source for the deck's last slide. Marketing writes the slide, Design lays it out, the CEO owns the story.

**Status of the facts below.** They are Product's summary from general knowledge and are not legal advice. Sales verifies each one against its source before it goes on a slide (Q18). A regulatory adviser reviews them before any product decision.

### The idea of the slide (*proposal*)

The record comes first and needs no certification. The decision support comes second, certified.

| Step | What ships | Rule that applies |
|---|---|---|
| **1. The record** | Digitize, store, share by handshake, search and retrieve with citations, symptom diary | GDPR. Software that only stores, archives, communicates or searches data is generally not a medical device under EU MDR. |
| **2. The network** | Opt-in "possible matches" and doctor-to-doctor contact | GDPR explicit consent. EHDS is the later legal route for research use. |
| **3. The assistant's "possible causes"** | Decision support for doctors | EU MDR medical device software, with certification. EU AI Act high-risk obligations follow from that. |

### EU MDR (Regulation (EU) 2017/745)

- Software meant to help diagnose is medical device software. "Possible causes" (E3) is that.
- Under classification Rule 11, software that gives information used for diagnostic or therapeutic decisions is class IIa at least, and higher when a wrong decision could cause serious harm. To verify (Q18).
- Class IIa and above needs a notified body, a quality system, clinical evaluation and post-market follow-up. It takes long and costs real money. Figures: Sales (Q18).
- At the hackathon nothing is placed on the market and no patient is involved, so the demo is not affected.
- Where the line between step 1 and step 3 falls is the open point: an assistant that only retrieves and cites is on the safe side; one that summarises and ranks may not be. This decides how much of E1 and E2 can ship before certification (Q18).

### GDPR (Regulation (EU) 2016/679)

- Health data is a special category (Article 9). The basis for the patient's own record is the patient's explicit consent.
- A data protection impact assessment is needed before real data is processed.
- The patient's rights shape the design: access, portability, and erasure. Erasure is why no health data goes on a chain (P4).
- Data stays in the EU. Every processor, model providers included, is under contract (Q1).
- The demo uses synthetic data only (N4), so it processes no personal data.

### EHDS (European Health Data Space, Regulation (EU) 2025/327)

- In force since March 2025, applying in stages over the following years. Dates to verify (Q18).
- Primary use: patients get the right to access their electronic health data and share it across the EU. That is this product's direction, and it means national systems will have to open up the data this app reads from paper today.
- Secondary use: research on health data through national health data access bodies, under a permit, in a secure environment.
- Our rule is stricter than the law's default: matching is opt-in (P9, founder's answer to flag 4).

### Also relevant (*proposal*: not in the founder's list; Product adds it for the CEO to keep or drop)

- EU AI Act (Regulation (EU) 2024/1689): an AI system that is a medical device needing a notified body is high-risk. To verify (Q18).
- Greece: the national e-prescription and myHealth systems are where "verified by source" would come from. Sales names the bodies in [`research/buyers.md`](research/buyers.md).

---

## 9. Success metrics

No baseline exists for any of these (no users, no interviews). The product targets are hypotheses to test, not forecasts.

### Scope A: the demo

| # | Metric | Target | How it is measured | Owner |
|---|---|---|---|---|
| M1 | The demo story runs end to end | 3 clean runs in a row before judging | Run the 8 steps of section 4; a run is clean when no step needs a retry | CTO |
| M2 | Extraction accuracy | At least 90% of all fields correct. 100% correct on patient name, ID and exam date | 10 synthetic exams (Greek and English, 3 types), checked by hand against the known content | Backend |
| M3 | Time from photo to record | 30 seconds target, 60 seconds limit | Stopwatch, 5 exams, on the event's network | Backend |
| M4 | Identity match | 3 of 3 mismatched documents refused; 0 matching documents refused | The test set includes 3 documents of another synthetic person | Backend |
| M5 | Answers with a source | 100% of the factual answers in the demo story carry a citation that opens the right exam | Check each answer in the story | Frontend |
| M6 | No diagnosis on the patient side | 0 screens on the patient side show a cause, condition or advice | Walk through every patient screen | Product |
| M7 | Handshake | Scan to open record in 15 seconds. Access is closed after the end time | Stopwatch; one expiry test | Frontend |
| M8 | Result at the event | A place in the Biotech & AI track. At least 3 conversations with possible buyers or partners at the Athens LifeTech Park | Count, noted by the founder | CEO |

### Scope B: the product (*proposal*)

**Number to watch above the others:** doctor visits per month in which a doctor opened a shared record through the handshake. It counts only when both sides got value.

| Stage | Metric | First target (hypothesis) | If it is missed |
|---|---|---|---|
| Activation | New patients who digitize 5 or more exams in their first week | 40% | Digitizing is too slow or too tiring: look at A1 and A2 first |
| Time to first value | Sign-up to first digitized exam | Under 3 minutes | Shorten sign-up and capture |
| Use, patient | Diary entries per active patient per week during an episode | 3 | The diary is not at hand when the symptom happens |
| Use, doctor | Sessions in which the doctor opened at least one citation | 70% | Doctors do not check, or do not trust, the answers: interview them |
| Retention, doctor | Doctors with a session in 4 weeks of 8 | 30% | The assistant is not saving time in a real visit |
| Quality | Field accuracy on real documents, after the patient's check | 98% on name, ID, date, values | No launch below the bar |
| Safety | Exams accepted that belong to another person | 0 on the test set | No launch |
| Privacy | Accesses outside a valid grant, from the log | 0 | Incident; stop and fix |
| Matches | Patients who opt in | 25% | The consent text is unclear or the benefit is not understood |

Compare by sign-up cohort, not one blended number. Patients and doctors are separate cohorts.

---

## 10. Technical solution (Backend)

**Owner: Cron Jobbidis (Backend), MIN-4427. Reviewed once by the CTO, MIN-4426.**

**Status:** written 13 Nov 2026 for the global-market decision (founder: "Dont focus on the greek market. we need to focus on global market"). Part A is the hackathon demo. Part B is the product. Nothing in Part B is built at the event. Facts about laws and regional systems are from general knowledge, are not legal advice, and carry "verify" where Sales or counsel must check them (Q18).

### 10.0 In brief

- **Demo (Part A):** Supabase (Postgres, Auth, Storage, Realtime, Edge Functions) behind one React web app on Cloudflare Pages. Gemini reads the photo into a fixed schema and answers the doctor's questions. Every access rule is enforced in the database (row-level security with an expiry time in the policy), not in the browser. The audit trail is a hash-chained, signed log in Postgres. No blockchain.
- **Honest limits of the demo:** the key is **not** on the patient's device (P2 is simulated), the model provider sees the synthetic data, the "verified by source" check is real but its issuer is our own simulated lab, and the matching network is a seeded table. Section 10.2 says this line by line so nobody on stage claims more.
- **Fit:** Backend P0 is about 12 hours and P0 plus P1 about 15 hours, against an 18-hour build window (20 hours less the 2-hour freeze). That fits only with the cut order of 10.15 and a go/no-go check at hour 8. It is tight, not comfortable.
- **Product (Part B):** the server holds ciphertext only, keys live in the patient's device, each region is its own data cell, imports from sources arrive as signed FHIR, and "no insurer access" is a set of technical controls (including that we cannot read the data), not a promise.
- **The hardest honest point (Q1):** a model that reads a record has to see it. The product can promise "we cannot read your record at rest; the model provider sees one request's facts, in region, with no retention, without your name", and it cannot promise "nobody can read it". Marketing must not write the second sentence (Q30).

---

## Part A. The hackathon demo (about 20 hours, Ren and Backend, event credits)

### 10.1 Stack

| Layer | Choice | Why |
|---|---|---|
| Web app | One React + Vite web app (PWA), patient view and doctor view by account role. Hosted on Cloudflare Pages. Frontend confirms in section 12. | We already run it. One deploy, one URL on stage. No backend constraint on phone vs laptop (Q11). |
| Database, auth, files | Supabase: Postgres with row-level security (RLS), Auth, Storage (private bucket), Realtime, `pg_cron`. A new project made at the event, in an EU region. | We already run it. RLS lets the database refuse a doctor outside a grant, whatever the client does. |
| Server logic | Supabase Edge Functions (Deno, TypeScript). Functions read patient data **with the caller's own token**, so RLS applies to them too. The service role is used only to write the log and to run the simulated lab. | One place for secrets and for all model calls. Model calls are I/O wait, well inside the 60 s budget. |
| AI | Google Gemini on the event credits: a fast multimodal model for extraction, a stronger one for "possible causes". Model ids are fixed at kickoff after a 15-minute bake-off on three synthetic exams. All calls go through one wrapper (retry with backoff, a fallback model, a cache). | Greek and English documents, vision and structured output in one API. |
| Signatures | ES256 (P-256) through the `jose` library, for the lab's signature and the log checkpoints. | One library, one algorithm. Same format family as SMART Health Cards, which is what a real lab QR would use (10.B.4). |
| Something else clearly better? | **No.** Cloudflare Workers would add a second server runtime for no gain in 20 hours. A vector database and a blockchain are both explicitly not used (10.9, 10.8). | |

### 10.2 What is real and what is simulated, per privacy principle (section 7)

| # | Principle | In the demo | Plain words for the stage |
|---|---|---|---|
| P1 | Encrypted storage | **Real, platform level.** The database and the files are encrypted at rest by the platform and files are private (signed links of 60 seconds). We add no encryption layer of our own. | "Encrypted at rest." Do not say "end-to-end encrypted." |
| P2 | Key on the patient's device | **Simulated.** The server holds the keys, because the server calls the model. | Say: "In the product the key lives on the patient's phone (see the architecture slide). Tonight's prototype keeps it on our server." |
| P3 | Fingerprints and grants only in the log | **Real.** The log holds document fingerprints (SHA-256) and grant events, and nothing else. | |
| P4 | No health data on any chain | **Real, trivially:** there is no chain. | |
| P5 | No insurer access | **Real.** There is no insurer account type, no export endpoint and no public verify link. A test proves an unknown role gets nothing (10.6). | |
| P6 | The patient lets people in | **Real.** In-person scan, patient approval, time limit, all enforced by RLS. | |
| P7 | Everything logged, patient can read it | **Real for grants and fingerprints.** Records opened and questions asked are Product scope (one cheap P1 extra: "document opened" events). | |
| P8 | Named and unnamed data apart | **Simulated.** The match set is a separate table with no link to people, but the same server holds both. | "Matching uses a seeded synthetic set." |
| P9 | Opt-in beyond care | **Real.** The switch is off by default, the choice and its wording version are logged, and the match function refuses when it is off. | |
| P10 | No diagnosis for patients | **Real and enforced on the server** (10.6). | |

### 10.3 Data model (Postgres, demo)

All tables have RLS on. "Patient reads own" means `patient_id = auth.uid()`. "Doctor in grant" means the policy in 10.7. A table with a select policy and **no** insert/update/delete policy for a role means that role cannot write it. The absence is the rule, and the test suite asserts it.

| Table | Holds | Who reads | Who writes |
|---|---|---|---|
| `profiles` | `id` (= auth user), `role` (`patient` or `doctor`), `full_name`, `full_name_norm`, `national_id_norm`, `specialty`, `org_type` (`provider`), `matching_opt_in`. | Own row. A doctor in a grant sees the patient's name and specialty fields they need. | Seed script only. **No client can change `role`, name or ID** (this feeds the identity match). |
| `documents` | `id`, `patient_id`, `kind` (`blood_test`, `imaging_report`, `doctor_letter`), `language`, `exam_date`, `issuer`, `printed_name`, `printed_id`, `identity_status` (`match`, `name_only`), `provenance` (`uploaded_by_patient` or `verified_by_source`), `source_proof_id`, `status` (`draft`, `confirmed`), `stage` (`uploaded`, `reading`, `checking_identity`, `done`, for the progress label), `storage_path`, `sha256_file`, `sha256_record`, `extract_confidence` (json), `created_at`. | Patient reads own. Doctor in grant. | Edge functions only. Provenance has its own write path (10.5). |
| `results` | One row per value: `document_id`, `analyte` (as printed), `analyte_key` (normalised, for series), `value_num`, `value_text`, `unit`, `ref_low`, `ref_high`, `ref_text`, `flag` (`low`, `high`, `normal`, `unknown`: computed by the server), `edited_by_patient`. | Same as `documents`. | Edge functions. The patient's edit goes through `confirm-doc`. |
| `findings` | The document's own words: `document_id`, `kind` (`conclusion`, `written_diagnosis`, `medication`, `note`), `text_original`, `text_lang`, `finding_date`, `specialty`, `edited_by_patient`. | Same. | Same. |
| `diary_entries` | `patient_id`, `occurred_at`, `recorded_at`, `time_edited`, `text`, `severity` (1 to 10). | Patient reads and inserts own. Doctor in grant reads. | Patient inserts only (no update, no delete in the demo). |
| `handshake_tokens` | `jti` (128-bit random), `short_code` (8 characters), `patient_id`, `expires_at`, `used_at`, `used_by`. | Nobody from a client. | Edge functions. |
| `grants` | `patient_id`, `doctor_id`, `status` (`pending`, `active`, `refused`, `expired`, `revoked`), `requested_at`, `approved_at`, `expires_at`, `revoked_at`. | Patient reads own. Doctor reads own. | Edge functions only. |
| `access_log`, `log_heads`, `log_checkpoints` | The hash-chained log (10.8). | Patient reads own chain. | Only the `append_log()` function. UPDATE and DELETE are revoked and a trigger rejects them. |
| `assistant_turns` | The doctor's questions and the structured answers, with `grant_id`. | **Doctor of that grant only.** There is no patient policy, on purpose. | Edge function `assistant`. |
| `match_cohort` | Seeded synthetic patterns: coded features, age band, country. No person link. | Read only through the match function. | Seed script. |
| `lab_issuers`, `source_proofs` | The simulated lab's public key and the verified signatures. | Edge functions. | Seed script; `verify-source`. |
| `reference_docs` (stretch) | Public medical reference pages fetched with Firecrawl **at build time**. | Assistant only. | Build script. |

### 10.4 Photo to structured data (stories A1, A2)

1. **Capture.** The client shrinks the photo (long side 2000 px, JPEG about 85%) and uploads it to the private bucket at `docs/{patient_id}/{doc_id}.jpg`. A `documents` row is created with status `draft`.
2. **Extract.** `extract-exam` fetches the image and makes **one** Gemini call: temperature 0, JSON output forced by a response schema, one retry if the output fails validation. The call is cached by the SHA-256 of the image and the schema version (the repeat runs of the stage rehearsal are instant; the first run, and every measurement run for M2 and M3, is uncached).
3. **What the model returns** (names, not final code):

   | Field | Rule |
   |---|---|
   | `readable` (bool), `unreadable_reason` | The model says if it can read the page. |
   | `document_kind`, `language` | `blood_test`, `imaging_report`, `doctor_letter`, or `other` (refused). |
   | `issuer`, `exam_date` (ISO), `printed_name`, `printed_id` (verbatim, nothing inferred) | Exactly as printed. |
   | `results[]` | `analyte`, `value` (number or text), `unit`, `ref_text` (as printed), `ref_low`, `ref_high`, `confidence`. |
   | `findings[]` | `kind`, `text` (the document's own words, in the document's language), `date`, `specialty`, `confidence`. |
   | `synthetic_marker_present` (bool) | Demo guard, see 10.11. |

   The model gets no field in which to put an opinion. It cannot write a cause, an advice or a "this is abnormal".
4. **The server does the rest, in code, not in the model:** validate with a schema (zod); parse dates and numbers; look up `analyte_key` in a hand-made synonym map of about 25 analytes (CRP, ESR/ΤΚΕ, rheumatoid factor, anti-CCP, haemoglobin, white cells, and so on, Greek and English) so that one value forms a series over time (A3); **compute the out-of-range flag from the printed range** (if the range cannot be parsed the flag is `unknown`, never a guess); run the identity match (10.5).
5. **Never half-read.** Required: `readable`, a kind other than `other`, an exam date, a printed name, and at least one result or finding. If any is missing the function answers "could not read: <reason>" with no record, deletes the upload, and writes a log line with a reason code only. A field below 0.6 confidence is allowed but is shown highlighted for the patient to check.
6. **Review and confirm (A2).** The client shows the draft beside the photo. `confirm-doc` accepts the patient's edits to values, units and dates, marks each changed field `edited_by_patient`, **ignores any edit to name or ID**, sets status `confirmed`, computes `sha256_record` over the canonical JSON, and appends `doc_added` to the log with both fingerprints.
7. **Timing.** One Gemini call on a 2000 px image is expected at 5 to 15 seconds. M3 (30 s target, 60 s limit) is measured on the event's network at hour 5 and again at hour 17 (10.14).

### 10.5 Identity match and the provenance mark (stories B1, B2)

**The rule is code, never the model's judgement.** The model only copies `printed_name` and `printed_id`. A function compares them to the profile.

| Step | Rule |
|---|---|
| Normalise names | Uppercase, strip accents, transliterate Greek to Latin (ELOT 743 style), then reduce to a "loose" key so spelling variants agree (for example η, ι, υ, ει, οι all to I; ο, ω to O; ου to OU). Split into tokens, ignore order. Greek female surnames on documents are often in the genitive (ΠΑΠΑΔΟΠΟΥΛΟΥ for the surname ΠΑΠΑΔΟΠΟΥΛΟΣ): a surname token also matches when it differs only in its ending. |
| Name rule | **Every given name and surname token of the profile must be found** in the printed name. A given name never matches by the ending rule. This is what refuses a husband's exam: same surname family, different given name. |
| ID rule | Exact match after removing spaces and dashes and uppercasing. If an ID is printed and differs from the profile's: **refuse, whatever the name says.** |
| Outcomes | ID present and equal and name matches: `match`. No ID printed and name matches: `name_only` (the doctor sees the mark). No readable name: refuse. Any name mismatch: refuse. |
| A refusal | The message names what did not match ("the name on the document is different", "the ID is different"). Nothing is stored: the upload is deleted, the log gets `doc_refused` with a reason code only. |

**Test (M4):** a table of about 20 cases written before the code: the 3 documents of the other synthetic person, spelling variants (Greek and Latin, genitive, order swapped, a missing accent), a same-surname different-given-name case, an ID typo (one digit off), and the matching documents. Target: 3 of 3 mismatches refused, 0 of the matching documents refused.

**What the match does and does not prove (stated on purpose).** It stops a person claiming someone else's exam by mistake or casually. It does **not** stop a determined forger who edits a document so it carries the right name: nothing can, from a photo. Only a signed source can. That is why every record carries the second mark below, and why the doctor sees "Uploaded by patient" as patient-reported.

**Provenance.**
- `documents.provenance` is one of two values. A photo upload is always `uploaded_by_patient`.
- Only the function `verify-source` can set `verified_by_source`, and only when it has a row in `source_proofs`. No client can write the column.
- **Answer to Q4.** Build the verifier **for real** and keep the issuer simulated. A simulated lab ("Demo Lab") owns a P-256 key. Its public key is in `lab_issuers`. The seeded record carries a genuine ES256 signature over a canonical JSON of its header and results. `verify-source` checks the signature against the issuer key, and also checks that the record's values equal the signed values. Cost: about 45 minutes. A tampered value then **loses** the mark, which is a good stage moment. *Stretch (P1+, about 1.5 hours):* the synthetic lab paper carries a QR holding a compact signed token (SMART-Health-Card style), and scanning it upgrades the uploaded photo's record. No real source is promised: the Greek national systems need accreditation we cannot get in a weekend. Ask at the Park; do not depend on it.

### 10.6 Symptom diary, and "no diagnosis for patients" enforced on the server (stories C1, C2)

The diary is a plain insert: text, severity 1 to 10, `recorded_at` set by the server, `occurred_at` editable and marked `time_edited` when it differs. It calls no model. The function answers `{id, saved: true}` and nothing else.

**N1 is enforced in six places, so one mistake in the app cannot break it:**
1. The only server functions that call a model are `extract-exam`, `assistant` and `diagnoses` (MIN-4662, CTO decision on MIN-4660). `extract-exam` has an output schema with no free-text opinion field. `assistant` and `diagnoses` require a doctor, and `diagnoses` is off unless its environment is named in the function secret `HEALTHAPP_DIAGNOSES_ENVS`.
2. `assistant` reads the caller's role **from `profiles` in the database**, not from a claim the client can send. A patient token gets 403.
3. `assistant` also requires an active grant for that doctor and that patient, checked by RLS under the doctor's own token.
4. `assistant_turns` has a select policy for the doctor of the grant and **no policy for the patient**. A patient query returns zero rows.
5. No patient endpoint returns any field that came from `assistant`. The patient app has no AI box (decision in section 5).
6. A lint test fails the build if any patient-facing function imports the model client.

Tests, each forced red once before it is trusted (remove the control, see the test fail, put it back): patient token on `assistant` is 403; patient select on `assistant_turns` is empty; a doctor without a grant, with an expired grant, and with a revoked grant each get nothing; a user with an unknown role gets nothing from any table.

### 10.7 The DNA-QR handshake and the time-limited grant (stories D1, D2)

**Token.** `hs1.<jti>` where `jti` is 16 random bytes, base64url, 22 characters. The QR text is the deep link `https://<app>/s#hs1.<jti>` (the part after `#` never reaches a server log), about 40 characters, so the code stays small and leaves room for Design's helix frame (Q10). The token holds **no name and no data**. Everything else lives server-side, so it cannot be tampered with and can be killed. **Typed one-time code** (Frontend's request, Q21: yes): the same row carries an 8-character `short_code` from an unambiguous alphabet (no 0/O, 1/I/L), shown as 4 + 4 under the QR. It resolves to the same request, has the same 90-second life and single use, and `handshake-claim` allows at most 5 failed claims per doctor per minute, so the code cannot be guessed.

**Flow.**
1. *Create.* Patient taps Share. `handshake-create` inserts `handshake_tokens` with `expires_at = now() + 90 s` and returns the token. The screen re-issues a fresh token every 60 seconds while it is open.
2. *Claim.* The doctor's app scans it and calls `handshake-claim`. One atomic statement marks the token used: `update … set used_at = now() where jti = $1 and used_at is null and expires_at > now() returning patient_id`. Zero rows returned means expired or already used, and nothing opens. On success a `grants` row is created with status `pending` (valid for 60 seconds) and the doctor id from the doctor's own token.
3. *Ask.* The patient's phone, subscribed to Realtime on `grants`, shows the doctor's name and specialty (read from `profiles` by the server). If Realtime is unreliable on the event network the phone polls every 2 seconds as a fallback.
4. *Decide.* `grant-decide` with approve sets `active`, `approved_at = now()` and `expires_at = now() + 15 minutes`. The duration is a server constant in the demo (Q7); the client cannot choose it. A refusal sets `refused`. Both are logged.
5. *Open.* The doctor's app is told by Realtime and starts reading.
6. *End early.* `grant-revoke` sets `revoked_at = now()`. Effect is immediate, because the policy reads it on every query.

**Access is enforced by the database, and expiry needs no clock job.** Every policy that lets a doctor read patient rows includes:

```
exists (select 1 from grants g
        where g.patient_id = <row>.patient_id
          and g.doctor_id  = auth.uid()
          and g.status     = 'active'
          and g.revoked_at is null
          and g.expires_at > now())
```

Storage reads use the same condition. Photo links are signed for 60 seconds and never beyond the grant's end. A `pg_cron` job every minute only writes the tidy-up (`status = 'expired'` and the log event). If the job fails, access still closes at `expires_at`. Both screens show the countdown from the server's `expires_at`, with the offset between the server's clock and the phone's, so phone clocks cannot mislead.

**Limits, stated.** A doctor who photographs the screen keeps the photo (that is Q8). A QR photographed and sent to a remote person could be claimed inside 90 seconds, so the approval shows the doctor's name and the patient must recognise who is in the room. Both are product problems; the product's answers are in 10.B.1 and 10.B.6.

### 10.8 The log: a signed hash chain, not a blockchain (story D3). Answer to Q2

**Pick: a hash-chained log in Postgres, with signed checkpoints.** Why, for the demo:
- It shows exactly the principle of flag 1 (fingerprints and grants, tamper-evident, nothing else) and the patient can see it is intact.
- A real chain adds a wallet, gas, a testnet faucet and a flaky RPC on event Wi-Fi, for no change in what the judges see. About 3 hours against 1.5.
- A public chain has a real **privacy cost** of its own (see 10.B.7), which makes it the wrong thing to show a privacy-minded judge without that answer ready.

**Design.**
- Per-patient chain. `append_log()` locks the patient's `log_heads` row, computes `entry_hash = sha256(prev_hash || seq || event || canonical(payload) || at)`, inserts, and moves the head. It is the only writer.
- Events in the demo: `doc_added`, `doc_refused` (reason code only), `doc_edited`, `grant_requested`, `grant_approved`, `grant_refused`, `grant_revoked`, `grant_expired`, `optin_changed`, and (P1 extra) `doc_opened`.
- UPDATE and DELETE are revoked from every role, and a trigger raises an error on them. The database owner could still bypass that. So, **every grant event also writes a checkpoint**: the head hash signed ES256 with a key that lives in a function secret and never in the database. Someone with database write access can rewrite the chain but cannot re-sign it.
- `GET /log-verify` recomputes the chain and checks the checkpoint signatures. The patient's log screen shows "chain intact" from it. On stage, an optional dev button edits one old row with the service role, and the verifier turns red. That is the proof.
- **Fingerprints at work:** when a doctor opens a photo, the server hashes the stored file and compares it with `sha256_file` from the log. A mismatch shows "does not match the record made at upload".
- *Optional stretch only if hour 16 is free:* anchor the **head hash** (nothing else, no patient id) to a public testnet transaction, for the deck line "anchorable to a public chain". Not promised.

### 10.9 The doctor's assistant: retrieval, citations, and who may see what (stories E1 to E4)

**Retrieval design for the demo: no vector database.** One patient's whole confirmed record is small (tens of documents, a few thousand facts at most, well under the model's context). So the function loads **all** of the patient's confirmed facts under the doctor's own token (RLS enforced) and gives every fact a stable id in a compact line:

```
[r:7f3a] 2026-03-12 | blood_test | CRP | 14.2 mg/L | ref <5 | high | uploaded_by_patient | edited:no
[f:1c20] 2026-02-02 | imaging_report | orthopaedics | "…conclusion in the document's own words…"
[d:90be] 2026-04-02 | diary | severity 6 | "…text…"
```

The product needs real retrieval later (10.B.2); the demo does not, and an embedding index would cost an hour that buys nothing visible.

**Answer format (forced by a response schema).** `segments[]`, each `{text, kind: "record_fact" | "general_knowledge", cites: [fact ids]}`, plus `not_in_record` (bool). A `record_fact` must cite at least one id. The record is sent inside a block labelled untrusted data, because a document's own text could contain instructions.

**The server checks the answer before the doctor sees it. This is the hallucination guard that does not depend on any credit:**
1. Every cited id must be in the context set that was sent.
2. Every number and date written in a `record_fact` segment must appear in one of its cited facts (a plain comparison, not a model).
3. If a check fails: one retry with the failure named. If it fails again, that segment is shown as "could not be verified against the record", never as fact.
4. The doctor's screen is drawn from the structured segments, not from raw text. A `general_knowledge` segment is visibly separate (E2).
5. If `not_in_record` is true, the answer is exactly "not in this record" (E2).

**Modes** (one function, the mode is a parameter): `overview` (E1: out-of-range history and conditions, each with its citation), `ask` (E2), `causes` (E3: `possibilities[]` each with `label`, `rationale`, `cites`; the heading text is Marketing's and is applied by the screen), `cross` (E4: groups the facts by `specialty` and lists findings that bear on each other, with citations). `causes` and `cross` use the stronger model. Each turn is stored in `assistant_turns` for that grant and closes with it.

**Second line of defence (stretch).** Oumi's open hallucination-checking work (claim verification of an answer against its cited context) can score each segment against its cited facts as an independent check. It is only used if the Oumi credit gives us a hosted model or an evaluation API at kickoff; the deterministic check above is what the demo relies on. Oumi's evaluation tooling is also what could score M2 on the 10 exams. Both uses are written from general knowledge of Oumi and are confirmed at kickoff (Q13).

**Firecrawl (stretch, P2).** At build time, fetch five or six public reference pages (for example on CRP, rheumatoid arthritis, osteoarthritis) into `reference_docs`. The assistant may cite them as `ref:` facts, marked external. Nothing is fetched during a session and no patient data goes to Firecrawl. This is the "Gemini plus public references" answer to Q16.

### 10.10 Possible matches in the demo (stories F1 to F3)

- **Opt-in (F1).** `matching_opt_in` is false by default. Turning it on goes through one function that logs `optin_changed` with the wording version. Turning it off takes effect at once.
- **Matching (F2).** `match_cohort` holds about 40 seeded synthetic patterns: coded features from a fixed vocabulary (for example `CRP_high`, `RF_positive`, `joint_pain`), an age band and a country. The demo patient's features are computed on the fly from her record, under the doctor's grant, and compared with the cohort (overlap score above a threshold). The function returns the **count and the shared pattern only**: no name, no id, no exact dates, country level at most. **A count below 5 is suppressed even in the demo**, and a test shows the suppression working with a smaller cohort. For a patient who has not opted in it returns the same empty answer as "no matches", so the doctor's screen gives no hint.
- **Contact (F3).** `contact_requests` holds an opaque match reference. The doctor presses "Ask to be put in touch", and a seeded second doctor accepts after a few seconds (a demo button on the other side). Identities of both patients are never shown.

### 10.11 Synthetic data only (N4), as a control and not a hope

- Every test document is generated from one **ground-truth JSON file** (two synthetic people, about 10 exams, three kinds, Greek and English), rendered through an HTML template to an image, with a visible "SYNTHETIC - DEMO ONLY" marker. M2 is then checked automatically against the same file.
- The names, IDs and lab names are invented and cannot be real: IDs follow an invalid pattern, labs are fictional.
- **Demo guard (P1, 15 minutes):** the extraction schema asks whether the marker is present. In demo mode a document without it is refused and deleted, so a judge cannot upload a real exam by mistake. This is a scope call for Product and the CEO because it also stops a judge trying their own paper (Q32).
- Gemini terms: whether the event credit sits on a paid, no-training account is unknown tonight (Q31). It changes nothing for synthetic data and everything for real data, which is the second reason there is none.
- 3 of the 10 exams are printed on paper and photographed with a phone, for the live step; the others are image files, so the live run does not depend on a printer.

### 10.12 Credits: what each is used for (answer to Q13)

| Credit | Use | Critical path? |
|---|---|---|
| **Google Gemini** | Extraction (A1), assistant (E1 to E4). Fixed at kickoff after the bake-off. Cache and a fallback model to absorb rate limits. | **Yes** |
| **Oumi** | Optional second check of answers against their cited facts, and a scorer for M2. Depends on what the credit provides. | No |
| **Firecrawl** | Public reference pages at build time (10.9). | No |
| **boxd** | I do not know what boxd offers and will not guess. If it provides sandboxed compute, use it off the critical path: run the M2 and M3 measurement runs and the three full demo runs against a copy of the stack, so a bad deploy cannot take the stage version down. | No |
| **fal** | Not Backend. Possible for deck art or the helix visual (Design, Frontend). Not used to alter synthetic exam images, because a model can change a digit. | No |
| **treg** | Not Backend. The research pass (Sales). | No |
| **Wonderful** | Not assumed (selected teams only). | No |

### 10.13 The interface between Frontend and Backend (typed contract, delivered at hour 0:30)

Reads go straight to Postgres through the Supabase client under RLS (timeline, results, diary, log). Everything else is an Edge Function with a typed request and response in one `contract.ts` that both sides import:

| Function | In | Out |
|---|---|---|
| `extract-exam` | `doc_id` | draft (fields and per-field confidence), or `{refused, reason}` |
| `confirm-doc` | `doc_id`, edits | the confirmed record |
| `handshake-create` | none | `{token, expires_at}` |
| `handshake-claim` | `token` | `{grant_id, status: pending}` |
| `grant-decide`, `grant-revoke` | `grant_id`, approve | grant with `expires_at` and server time |
| `assistant` | `grant_id`, `mode`, `question?` | One whole response: `segments[]` with `cites`, `not_in_record` (not streamed in the demo, see 10.16). `403 grant_expired` when the grant has ended |
| `doc-photo` | `doc_id` | a signed link (60 s) and the fingerprint check result |
| `grant-status` | `grant_id` | `{state, expires_at, server_now}` for polling and for the first read after any empty result |
| `log-verify` | none | `{intact, head, checked_at}` |
| `demo-reset` | passcode | ends every grant, clears assistant turns and live-added documents, resets opt-in, starts a new log epoch (10.16) |
| `matches-optin`, `matches`, `contact-request` | on/off; `grant_id`; match ref | consent state; `{count, patterns[]}`; request state |

### 10.14 Build time per story, and hour by hour

**Backend hours per P0 story** (these are estimates with about plus or minus 50% error; no measured baseline exists for this kind of build):

| Story | Approach (see 10.4 to 10.9) | Backend hours |
|---|---|---|
| Setup: project, schema, seed users, RLS, secrets, Gemini wrapper | one migration, one seed script | 1.5 |
| A1, A2 extraction and confirm | Gemini with response schema, server validation, cache | 2.0 |
| Synthetic data set and the M2 check | ground truth JSON, templates, 10 renders | 1.5 |
| B1 identity match | normaliser and rule, 20-case table | 0.75 |
| B2 provenance and verifier | signed seeded record, `verify-source` | 0.75 |
| C1, C2 diary and enforcement tests | insert, RLS test script | 0.5 |
| D1, D2 handshake and grants | token, claim, decide, RLS expiry, Realtime | 2.0 |
| E1, E2 assistant, citations and checks | context builder, schema, verifier | 2.5 |
| E3 possible causes | one more mode | 0.5 |
| **P0 total** | | **12.0** |
| D3 log and verifier | hash chain, checkpoint | 1.25 |
| F1, F2, F3 matches | seeded cohort, k rule, simulated contact | 1.25 |
| E4 cross-specialty | one more mode | 0.5 |
| A3 timeline data | queries, analyte series | 0.25 |
| **P0 plus P1** | | **15.25** |
| Stretch: QR-signed lab proof, Oumi check, Firecrawl pages, `doc_opened`, chain anchor | | 1 to 4 |

**Hour by hour.** T0 is the first build hour, after the kickoff and after the credits are claimed (Q9, Q13). Submission is at T+20. **Freeze at T+18.** The Frontend column is Backend's proposal for what Ren needs; Ren confirms in section 12.

| Hour | Backend | Frontend (Ren) | Gate |
|---|---|---|---|
| 0 to 1 | Supabase project, migration 1, seed users and roles, secrets, Gemini bake-off on 3 docs. Contract file at 0:30. | Scaffold, auth screens with demo-login buttons, role routing, deploy to Pages, design tokens from section 11. | Both can log in as patient and doctor. |
| 1 to 3 | `extract-exam` v1 on 3 hand-made docs, schema and validation, review contract. | Camera capture and upload, review-beside-photo screen against a stub of the contract. | One photo becomes a draft. |
| 3 to 4 | Ground truth JSON and 10 rendered docs. Identity match and its table. | Timeline shell, diary screen. | M2 harness runs. |
| 4 to 6 | Iterate extraction on the full set (Greek), `confirm-doc`, provenance and verifier. First M3 stopwatch. | Edit-field flow (A2), record views, provenance marks. | **A1 at 90% on 5 docs, else cut to English and 2 kinds** (10.15). |
| 6 to 8 | Handshake, grants, RLS expiry, Realtime, RLS test script. | DNA-QR render, doctor scanner, approval screen, countdown. 3-phone scan test with Design. | |
| **8** | **Joint check:** demo steps 1, 2, 4 run end to end. | | **Go/no-go on the cut order.** |
| 8 to 11 | Assistant: context builder, schema, answer checks, `ask` and `overview`. | Doctor workspace, chat with citation chips, source viewer. | M5 spot check. |
| 11 to 12 | `causes` mode, seed the demo history (orthopaedics plus rheumatology). | "Possible causes" list. | Steps 5 and 6 run. |
| 12 to 13.25 | Log chain, checkpoint, `log-verify`. | Access-log screen, chain badge. | |
| 13.25 to 14.5 | Matches (F1 to F3), `cross` mode. | Opt-in switch, matches panel, contact request. | Steps 7 and 8 run. |
| 14.5 to 16 | C2 test pass (all six controls forced red once), RLS matrix, M4 and M2 final. | Polish, empty and error states. | |
| 16 to 18 | Bug fixes, warm the cache, M3 final, stretch only if everything above is green. | Same. | **FREEZE at 18.** |
| 18 to 20 | Three full runs of the 8 steps. Fallback recording ready. No new features. | Same. | M1: 3 clean runs. |

### 10.15 Risks to the 20-hour fit, and the cuts

| # | Risk | Effect | Mitigation |
|---|---|---|---|
| 1 | Gemini misreads Greek documents or a layout | A1 and M2 miss; the demo's first step fails | Bake-off at hour 0, check at hour 6: if under 90% on 5 documents, cut to English documents and two kinds, and say so |
| 2 | Event Wi-Fi, or credit rate limits | Slow or failed model calls on stage | A phone hotspot as the second network; one wrapper with retry, a fallback model and a cache; the first extraction of the three live documents is warmed before judging; a recorded run as the last fallback |
| 3 | Credits are smaller than planned, or sit on a free tier | Quota ends mid-rehearsal | Check the amounts at kickoff (Q13); cache; run M2 with the small model |
| 4 | Backend P0 is 12 hours and Ren's is similar | No slack if one slips | Hour 8 joint check; cut order: F3, then F2 and F1, then A3, then D3, then E4 (section 5). The assistant, the handshake and the identity match are never cut |
| 5 | RLS subtleties (a missing policy silently returns zero rows) | A doctor sees an empty record on stage | The RLS test matrix at hour 14.5, run once red on purpose per control |
| 6 | Realtime unreliable | The approval does not reach the doctor | 2-second polling fallback in the same client code |
| 7 | The synthetic documents are late (Q12) | Nothing to test extraction on | Backend generates them from ground truth at hours 3 to 4. Product's list of what each exam must contain is needed at hour 0 |
| 8 | Prompt injection through a document's text | The assistant follows an instruction found in an exam | Record sent as untrusted data; forced output schema; server-side citation and value checks (10.9) |
| 9 | Two builders in one repo and one database | Collisions on the schema | Backend owns migrations; Ren never edits them; one migration branch |

**Cut line.** If at hour 8 the joint check fails, drop F1 to F3 and E4 first, and keep the story of steps 1, 2, 4, 5, 6, 8.

### 10.16 Answers to Frontend's requests (section 12.12), in one place

Where section 12 says "where section 10 answers otherwise, Backend wins", this is the answer. Frontend's six requests and F-Q1, F-Q2 and F-Q6:

| Frontend asked | Backend answer |
|---|---|
| 1. A typed contract by H1 | Yes. One `contract.ts` of `zod` schemas (Frontend already uses `zod`), delivered at hour 0:30 and imported by both sides. Frontend builds on mocks from the same schemas. |
| 2. Upload, job status, typed refusals | `extract-exam` is **one request that answers in 5 to 15 seconds**, not a queue. For the progress label it writes `documents.stage` (`uploaded`, `reading`, `checking_identity`, `done`) as it goes; the client reads the row by Realtime or polling. Frontend must not draw a percentage. Refusals are typed: `{refused: true, reason, detail}` with `reason` one of `unreadable`, `not_medical`, `name_mismatch`, `id_mismatch`, `no_name`, `synthetic_marker_missing`. The `detail` names what did not match (B1). |
| 3. Handshake: typed code, realtime and `GET`, `expires_at` and `server_now` | All yes (10.7, 10.13). `grant-status` is the plain `GET`. **One thing to know:** database reads after expiry return an **empty set**, not an error (that is how RLS works). Functions (`assistant`, `doc-photo`) return a typed `403 grant_expired`. So the client must treat "empty after having data" as a signal to call `grant-status` and close the session. |
| 4. The assistant streamed in typed blocks | **Not streamed in the demo (answer to F-Q2).** The server verifies every cited id and every number and date against the record before the doctor sees them (10.9), and that needs the complete segments. Showing unverified text and retracting it is worse than waiting. The response is **one JSON array of blocks** with the same kinds Frontend defined: `record_fact` is Frontend's `fact`, `general_knowledge` is `general`, plus `not_in_record`, and `possibilities[]` for E3. Frontend's block renderer works unchanged, since the blocks arrive together. Expected 4 to 10 seconds, shown with the label "Searching the record". If the bake-off at hour 0 shows more than 8 seconds, the upgrade is to stream **verified** blocks one by one as the model completes each segment (about 1 hour, P2). |
| 5. Photos by signed URL, no longer than the grant | Yes: 60 seconds, capped at the grant's end, with the fingerprint check result (10.8). |
| 6. A reset endpoint and the seeded state; a stable HTTPS host | `demo-reset` behind a passcode (10.13). The log is **never erased**: a reset starts a new *epoch* and the patient's log screen shows the current epoch, while `log-verify` still verifies the whole chain. Host: Cloudflare Pages on a stable `pages.dev` URL from hour 0:30, HTTPS, preview deploys. Supabase functions are HTTPS. |
| F-Q1 realtime | Supabase Realtime plus the 2-second polling fallback Frontend already designed. |
| F-Q6 host, and the doctor's scan | Cloudflare Pages (above). The scan is the Frontend and Design scan test; Backend has no preference. |

F-Q3 (the diagnosis printed on a patient's own document) is Product's. Technically it is simple: the patient's endpoint returns `findings` rows verbatim and labelled as the document's words, and the model is never involved. F-Q4 (key custody for the product) is the CTO's. Backend's view: a **native shell** (or a thin shell around the web app) with non-exportable keys in the secure hardware, because browser passkeys often sync through a vendor account, which weakens "the key stays on this device"; passkey-derived keys in the browser are an acceptable first step if speed matters more.

---

## Part B. The product, global

### 10.B.1 Encryption model: the key on the patient's device

**Keys.**
- Each patient device makes a key pair **inside its secure hardware** (iOS Secure Enclave, Android StrongBox, WebAuthn passkey on the web). The private key cannot be exported.
- Every document gets its own random data key (AES-256-GCM). The document and its extracted data are encrypted with it. The data key is wrapped to the patient's public key (HPKE, RFC 9180) and stored beside the ciphertext.
- **The server stores ciphertext, wrapped keys, and the grant graph, and nothing readable.** Support staff cannot read a record, and neither can a court order served on us, because we cannot.
- **A new device** is enrolled by scanning a code shown on an existing device, which wraps the data keys to the new key.
- **Sharing is a re-wrap, done on the patient's phone.** On approval the phone wraps the needed data keys to the doctor's device key (from the doctor's verified credential, 10.B.6) and uploads them with an expiry. The server serves them only inside the grant and deletes them at the end. Revocation stops all future access. **It cannot take back what the doctor's screen already decrypted.** That is true of every system and the PRD should never say otherwise (Q8).
- **Per-grant keys** (a fresh grant key wrapping the data keys for that visit) keep one visit's key from opening later uploads.

**The hard consequence: recovery.** If a patient loses every device and has no recovery material, **we cannot restore the record**. That is what "we cannot read it" costs. Options for the founder: a printed recovery code (a patient who loses it loses the record), Shamir split between the patient's own trusted people and a recovery document (we never hold enough shares), or a doctor-held copy by the patient's choice. Backend recommends the printed code plus the second device, with Shamir as the optional upgrade (Q29).

**Search, citations and the assistant** need plaintext, so they run **where plaintext exists** (a device, or a confidential environment, see below). A server-side search index over ciphertext is not possible, and a blind index leaks patterns. This is why retrieval moves to the client and the model gateway in the product (10.B.2).

### 10.B.2 Answer to Q1: where the AI runs, and what the provider sees

The founder's rule (key on the device, nobody reads the data) and the founder's need (a model that reads the photo and the history) collide. There are four honest positions.

| Option | What the provider sees | Quality and cost | Where it fits |
|---|---|---|---|
| **1. On-device** (OCR plus a small multimodal model on the phone; a small model on the doctor's laptop) | Nothing leaves the device | Lowest quality today on Greek or messy photos and on cross-record reasoning; heavy on older phones; slow | Extraction first, as models improve. A default for the privacy-first tier. Not enough for the doctor's assistant today |
| **2. Confidential computing** (an open model served in a hardware-protected environment with remote attestation; keys are released to the environment only after it proves its code; CPU and GPU confidential modes exist on the large clouds) | The operator cannot see plaintext in memory. Attestation is how a client checks that | Open-weight models are behind the best hosted ones; real engineering effort for attestation; higher cost; side-channel risk remains | The second tier, for buyers and regions that demand it (public hospitals, Gulf, some EU states) |
| **3. Regional zero-retention hosted endpoints** (a large provider's model in the patient's region, no retention, no training, no prompt logging, with a data processing agreement and, in the US, a business associate agreement) | The provider's systems see the plaintext of one request in memory. Contractually not stored | Best quality, fastest to ship. A US-owned provider remains subject to US legal demands even in an EU region (an EU sovereignty argument, to be assessed by counsel) | The **launch** tier |
| **4. Do not send the record to a model at all** | Nothing | The product becomes a viewer. No assistant | Not what the founder wants |

**Recommendation (Backend; the CTO reviews).** Launch with option 3, **built as a stateless gateway** in the patient's region, so options 2 and 1 can replace it later without redrawing anything:
- The patient's device (or the doctor's, inside a grant) decrypts and sends the minimum facts for **one request** to the gateway over a pinned TLS connection. The gateway stores no plaintext and writes no prompts to any log; it forwards to the in-region model endpoint and returns the answer.
- **Identity never goes to the model.** The request carries pseudonymous facts: no name, ID, address, phone or doctor name. Dates stay, because medical timing matters, so this is pseudonymised, **not anonymous**, and GDPR and HIPAA still apply to it. The deck must say pseudonymised.
- Per-request, minimum context only: the assistant sends the facts it needs (retrieval runs on the device, over a local index), not the whole history.
- An allow-list of model endpoints per region, each under agreement, with the provider list shown to the patient.
- A DPIA, agreements and a sub-processor list before a single real record.
- Then offer option 2 as the second tier, and move extraction to option 1 when it is good enough.

**What changes in the wording of section 7.** P2 should read: "Nobody at the company can read your record at rest. The AI sees the facts of one request, in your region, with no retention and without your name." The demo says "simulated" (10.2) (Q30).

### 10.B.3 Multi-region data residency

**Architecture: one cell per region, and nothing health-related between cells.** A cell is a complete stack: its own Postgres and object storage, its own key management, its own model gateway and its own audit log. A small **global control plane** holds only non-health data: which cell a (pseudonymous) account lives in, billing, feature flags, the doctor directory with professional verification, and releases. A patient picks or is assigned a home cell at sign-up by residency. Moving cells is an explicit export and import by the patient, never a background sync. Support staff have no plaintext access (10.B.1) and no cross-cell reach.

**A patient abroad.** The QR resolves through the control plane to the home cell. The data keys are wrapped to the visiting doctor's device by the patient's own phone, so what crosses the border is a decision of the patient, ciphertext until the doctor's device opens it. Whether this satisfies a given regime's transfer rules is a legal question for counsel per region (to verify).

**A policy pack per cell** holds what differs: consent text and legal basis, retention, breach-notice clock, identity provider (the Q3 answer in section 17), allowed model endpoints, and sub-processors. Launching a region is configuration plus legal review plus a cell deployment, not a rewrite.

| Region | Main rules (all to verify with counsel) | What the cell needs |
|---|---|---|
| **EU** (and EEA) | GDPR: health data is special category (Art. 9), explicit consent, DPIA, erasure and portability. **EHDS** (Regulation (EU) 2025/327): patients' right to access and share their electronic health data, EHR-system interoperability requirements on a phased timetable (dates to verify, Q18), and a separate secondary-use route through health data access bodies. | EU cell (for example Frankfurt), EU-only processors, FHIR plus EHDS exchange format alignment, MyHealth@EU contact points later |
| **US** | HIPAA when we serve providers (we are a business associate; BAAs with each cloud and model provider). **Direct-to-consumer:** possibly outside HIPAA but under the FTC Health Breach Notification Rule and state laws (for example Washington's My Health My Data Act, California). Interoperability: 21st Century Cures Act patient-access APIs (SMART on FHIR) and TEFCA Individual Access Services. | US cell, BAA-covered stack, SMART on FHIR client, an IAS route through a TEFCA-connected participant |
| **UK** | UK GDPR and Data Protection Act 2018; NHS expectations for suppliers (a data security and protection toolkit assessment, clinical safety standards, NHS login for identity, the NHS APIs). | UK cell (London), NHS login, DTAC-style assessment |
| **Gulf** | UAE: federal health data law restricts storing and moving health data outside the country with limited exceptions; emirate-level regulators add rules. Saudi Arabia: the PDPL and health-sector localisation requirements; national exchange platform. Identity: national schemes (for example UAE Pass, Nafath). | Cells **inside** the country (local cloud regions or approved providers), local identity, Arabic. No cross-border by default |
| **India** | DPDP Act 2023 and its rules; **ABDM** (ABHA health IDs, consent manager, FHIR-based health information exchange) already defines a consent-based record exchange. | India-hosted cell, ABHA integration as the identity and consent route, ABDM-registered PHR role |

**Order and cost.** A cell costs real money and legal work. Backend proposes **EU first** (GDPR plus the EHDS direction is the strongest fit for the record-first product and for this event), then **US via FHIR and TEFCA**, then UK. Gulf and India are built on a named buyer's demand, not in advance (Q33).

### 10.B.4 FHIR interoperability for "verified by source"

**Internal shape.** The product's store is FHIR-shaped: our `results` map to `Observation` (analytes coded with LOINC, units in UCUM), documents to `DiagnosticReport` and `DocumentReference` (the file as `Binary`), findings to `Condition` or the report's conclusion, and the provenance mark to a FHIR `Provenance` resource. A photo-extracted record gets best-effort codes marked "unverified mapping". A source-imported record arrives already coded.

**Import routes, by region, all producing the same `Provenance` with a verified signature or an authenticated source:**
1. **Patient-access APIs** (SMART on FHIR, OAuth2): US providers' EHRs under the Cures Act; the same pattern in the UK (NHS APIs) and wherever a hospital exposes one.
2. **National exchanges:** TEFCA Individual Access Services in the US; MyHealth@EU contact points (patient summary, e-prescription) and national systems in the EU (Greece: e-prescription and myHealth, via the national route; accreditation needed, Sales); ABDM in India; national platforms in the Gulf.
3. **Signed documents from labs:** a lab issues a signed bundle in a QR or link (the SMART Health Cards and SMART Health Links pattern: ES256 signature, issuer key published at a well-known address), or a signed PDF (PAdES with a qualified seal under eIDAS in the EU). This is precisely the shape of the demo's simulated lab (10.5), so the demo is a faithful miniature.

**Rule.** "Verified by source" means: a valid signature from an issuer key on our trust list, or an authenticated pull from the source system, **and** the patient identity in the source equals the verified account identity. Anything else is "Uploaded by patient". Verified imports skip the model for extraction, because they are already structured. Trust lists are per region and signed, and an issuer can be removed.

### 10.B.5 Consented anonymous "possible matches" in the product (answer to Q6)

**What leaves the device, and only with an opt-in.** Not text and not values. A small vector from a **controlled vocabulary**: coded findings and analyte direction bins (LOINC and SNOMED or ICD-10 codes, "high / normal / low", never a raw value), an age band (10 years), country, and time only to the quarter. A rotating random id per opt-in, never the account. Sent through the same gateway, no logging.

**Where matching runs: three options.**

| Option | How | Strength | Weakness |
|---|---|---|---|
| **A. Per-region central index with k-anonymity** | Opted-in vectors sit in a regional de-identified index; a match is shown only when at least *k* patients (k of 5 to 10) share the pattern; features are coarse; each doctor has a query budget | Simple, auditable, fits residency | The index is a target; rich vectors are quasi-identifiers; repeated queries can be used to narrow down |
| **B. Federated** | The index stays in each cell. A query fans out; each cell returns only a count above *k*. Across cells, a private set-intersection step or secure aggregation | Fits residency (nothing moves between regions) | Heavier to build; more moving parts |
| **C. Differentially private counts** | Noise added to counts | Good for published statistics | Wrong tool for "is there a match", which must be exact |

**Recommendation.** A inside each cell, B between cells, C only for any statistic we publish. Coarse features, *k* of 5 to 10 for any count the doctor sees, a per-doctor query budget, and logging of every query.

**The tension to settle (Q34).** *k*-anonymity suppresses exactly the rare conditions the founder most wants to help ("finding cure and cause"). Proposal: a **blind introduction** path for rare patterns. The doctor is told only "a possible match exists" and the overlap with their **own** patient's pattern (so nothing new about the other person is revealed), at country level or higher, and only if **both** patients consent again at that moment. A count is never shown below *k*. Counsel and the CTO decide.

**Doctor-to-doctor contact.** A second, explicit consent from the matched patient: "a doctor treating me may be contacted about similar cases", naming which doctor is the contact. Flow: Doctor A, who holds a grant for Patient A, asks for contact on an opaque match reference. The broker notifies Doctor B with A's **verified professional identity**, no patient identity. B accepts or declines. Both patients are told and can veto. On acceptance the broker opens a secure message channel between the two doctors. No patient identifiers cross it. Anything clinical shared after that needs the patient's own handshake. Rate limits stop fishing. Everything is logged.

### 10.B.6 No insurer access: technical controls, not only policy

1. **We cannot read the data** (10.B.1). A payer's contract, subpoena or hack of our servers yields ciphertext.
2. **No payer principal exists.** The account role type has no insurer value; the API has no payer client registration and no payer scope.
3. **Grants only to verified clinicians at care providers.** The patient's phone wraps keys only to a device key carrying a clinician credential that the global directory signed after a registry check (Q5). The credential carries the doctor's organisation type. **Payer-affiliated accounts cannot receive wrapped keys**, and the patient sees the organisation at approval. (A licensed doctor who works for an insurer is a real case, and this closes it for our system.)
4. **Purpose bound to treatment.** A grant says why it exists. There is no purpose for underwriting or claims.
5. **No export built for third parties and no bulk API.** No service account can read plaintext, including ours.
6. **No public verification oracle.** Fingerprints and "verified by source" can be checked only by an authenticated clinician inside a grant. We never become a proof service for a document an insurer is handed (the founder: "should not be accessible to insurance companies as proofs").
7. **No data sale, no de-identified data sale, no analytics to payers**, in the terms and in the architecture (no payer egress).
8. **The log shows organisation type** on every access, and an independent audit checks it.

**What it cannot stop, said plainly.** The patient can export a document and hand it to anyone, and the product cannot prevent that. Exports are marked "patient export, not a verified record" and carry no verification link.

### 10.B.7 Audit logging in the product

- **What is logged:** sign-in and device enrolment; each grant step; **each data-key release** (every time a doctor's device is given a key, the moment of access); each record opened; each assistant question (the question is health data, so its text is encrypted under the patient's key and the log keeps only a hash and metadata); exports; consent changes; match queries and contact requests; every model-gateway call (provider, region, size, no content); and every administrative action on the system.
- **Properties:** append-only, hash-chained per subject, entries signed with a key in a hardware key service, a daily Merkle root with a qualified time stamp (RFC 3161; in the EU a qualified time stamp has legal weight), stored apart from the application database.
- **Readable by the patient** (decrypted on their device), by a regulator on request, and by an independent auditor.
- **Alerts:** an access outside a valid grant is a top-severity incident; unusual handshake rates for one doctor; failed key releases; any administrative action touching a cell.
- **The log is itself personal data, and a public chain is the wrong home for it.** Even a hash of a document or a pseudonymous id can be personal data if it can be linked back to a person, and a chain cannot forget. So per-document leaves are keyed hashes (HMAC with a per-patient key). When a patient is erased we destroy their key and pseudonym map, and the chain **stays valid but unlinkable**. If we ever anchor publicly, only a Merkle root over many patients goes out, never a per-document hash. This is the real reason for answer Q2, beyond build time.
- **Retention** follows each region's pack (for example a US six-year documentation rule and the GDPR minimisation principle). Counsel confirms.

### 10.B.8 Technical issues Backend raises unprompted

1. **P2's wording is wrong for any product with a hosted model.** See 10.B.2. Needs a rewrite of P2 and a rule for Marketing (Q30).
2. **The identity match does not stop forgery.** It stops a careless claim. Only a signed source does. The two-mark design is the real control, and the doctor-facing wording must not oversell the match (10.5).
3. **Key recovery is a product decision with a privacy cost** (Q29).
4. **Where "retrieve and cite" ends and "decide" begins is partly a technical choice.** The forced `record_fact` versus `general_knowledge` split, with server-side checks, keeps E1 and E2 on the retrieval side of the line. It may help the regulatory argument in section 8 (Q18), and it is not a legal conclusion.
5. **k-anonymity versus rare conditions** (Q34).
6. **A cross-region cost.** Residency by cell means five regions is five stacks and five legal reviews. Backend recommends staging them by named buyer (Q33).

---

## 11. Design (Design)

**Owner: Pix Elidis (Design), MIN-4428. Written 13 Nov 2026, words only: no frames exist yet. The deck design is a later dispatch and is not in this round.**

Everything marked ***proposal*** is Design's call for the founder to confirm at sign-off. Copy on screen (button labels, refusal text, the heading of "possible causes", the emergency line) belongs to Marketing (section 13). Where this section quotes a phrase, it is a placeholder that shows the structure, not final wording.

### 11.1 The two surfaces and their information architecture

**One product, two surfaces. One design system.** The patient surface is a phone app. The doctor surface is a workspace for a laptop or tablet, usable down to a phone. They share tokens, the four provenance marks, the citation chip and the access timer, so a record looks the same on both sides of the handshake. Whether it ships as one web app with two roles or two is Frontend's call (Q11).

**Patient app (mobile, 390 x 844 first).** Three tabs, labelled in words, never icon-only. One primary action per screen.

| Tab | What is in it | Stories |
|---|---|---|
| **Timeline** (home) | Exams and diary entries in date order, each with its provenance mark. A value that repeats (CRP) opens as a series. A "+" for **Add exam** (camera) and **Add symptom** | A1, A2, A3, C1 |
| **Share** | "Share with a doctor": the DNA-QR, then who is asking, then the live access with its countdown and an "End access" button | D1, D2 |
| **Privacy** | **Access log** (who looked, when, until when, chain intact) and **Possible matches** (consent, off by default, with the way out on the same screen) | D3, F1 |

What the patient never finds anywhere: an AI box, a cause, a condition name that the document does not itself print, advice, an urgency rating, or a score.

**Doctor workspace (laptop or tablet landscape first, 1280 x 800, down to 768 wide).** One screen that does the whole job, so nothing needs a tour.

```
+--------------------------------------------------------------------------+
| Patient (synthetic) · name shown as in the grant      Access ends 14:32  |  <- timer bar, always visible
+-----------------------------+--------------------------------------------+
| TIMELINE (left, 40%)        | ASSISTANT (right, 60%)                     |
| exams + diary, by date      | AI assistant. Check every statement        |
| out-of-range flagged        |   against its source.        <- fixed strip|
| each item: provenance mark  | [ Ask about this patient...           ]    |
|                             | answers with citation chips [1][2]         |
| tabs under the timeline:    | quick asks: Possible causes ·              |
|  By specialty · Matches     |   Across specialties                       |
+-----------------------------+--------------------------------------------+
```

Reading order for the doctor: who and for how long (top), what happened (left), what do I want to know (right). Citation chip opens the **source viewer** as a side sheet on the right: extracted values next to the original photo, with the provenance mark. The session never leaves this screen.

### 11.2 The demo flow, screen by screen (the minimum set Ren builds)

Ten screens. A screen listed with several states is one frame with variants, not several screens. P0 and P1 follow section 5. The numbers are the steps of the 3-minute story in section 4.

| # | Screen (surface) | Story step | States Design draws | Priority |
|---|---|---|---|---|
| 1 | **Capture and check** (patient) | 1 | camera ready · reading (progress, under 30 s target) · result beside the photo, confirm · could not read, retake · saved | P0 (A1, A2) |
| 2 | **Not your exam** (patient) | 2 | name mismatch · ID mismatch · no readable name. All: nothing was saved | P0 (B1) |
| 3 | **Timeline** (patient) | 1, 3 | normal · with diary entries · a value series (CRP) · empty (first run) | P0 shell, series P1 (A3) |
| 4 | **Add symptom** (patient) | 3 | entry form (text, 1 to 10, time) · saved, with only "saved for your doctor" · the fixed emergency line | P0 (C1, C2) |
| 5 | **Share with a doctor** (patient) | 4, 8 | DNA-QR with validity countdown · "Dr. X (Orthopaedics) is asking": Approve / Decline · access running with countdown and End access · expired, used or declined code | P0 (D1, D2) |
| 6 | **Privacy** (patient) | 7, 8 | Access log (list, chain intact) · Possible matches consent (off, on, switched off) | P1 (D3, F1) |
| 7 | **Scan** (doctor) | 4 | camera view · waiting for the patient to approve · refused · expired code | P0 (D1) |
| 8 | **Workspace** (doctor) | 4 to 7 | overview on open · cited answer · "not in this record" · general-knowledge block · **Possible causes** · **Across specialties** · **Matches** with contact request · loading answer · session about to end | P0 (E1, E2, E3), P1 (E4, F2, F3) |
| 9 | **Source viewer** (doctor, side sheet) | 5 | record values + original photo · each of the four marks | P0 (E2) |
| 10 | **Access ended** (doctor) | 8 | closed, content removed, "no access" on a new request | P0 (D2) |

**Cut order for design, if hours run short** (follows section 5): drop screen 6 and the series in screen 3 first, then the By specialty and Matches tabs of screen 8. Screens 1, 2, 3, 4, 5, 7, 8, 9 and 10 are the demo.

**The story as a feeling, step by step** (guides motion and tone, not the build): 1 relief (the paper became a clean record in seconds) · 2 safety (the app stopped me, calmly) · 3 being listened to, without being judged · 4 control (I decide, and I see the clock) · 5 trust (every line has a source) · 6 respect (possibilities, not verdicts) · 7 belonging (I am not the only one, and nobody knows it is me) · 8 closure (the door shut).

### 11.3 The DNA-shaped QR, and the handshake

**The rule that decides everything (answers Q10):** the scannable code is a standard QR code and its modules are never altered. A code that is drawn as a helix cannot be promised to scan under event lighting, and a failed scan on stage costs the whole demo. The DNA lives around and before the code, never inside it.

**The concept, in two lines.** Two helix strands rise from the sides of the phone and frame a white card that holds an ordinary high-contrast QR (error correction Q or H, 4-module quiet zone, dark ink on pure white, at least 60% of the screen width). On "Share", the strands twist for about 0.8 s and resolve into the card, then stay still while the code is scannable.

**The handshake, as the signature interaction** (it is the single piece of motion the deck and the demo are built around):

1. Patient taps **Share**: strands draw in, the QR card appears, a validity ring runs around it.
2. Doctor scans. Both screens react at once: the patient's strand (teal) and the doctor's strand (a second tone) twist toward each other. Patient's phone: "Dr. X, Orthopaedics, is asking" with Approve and Decline, at least 48 px high, equal weight.
3. Patient approves. The two strands **lock into one double helix**, one rung at a time (about 1.0 s), the phone gives a short haptic, and the countdown starts on both screens. The doctor's workspace opens as the helix settles.
4. At the end time, or on "End access", the helix **unwinds** and the doctor's screen closes. Same shape, opposite direction, so the beginning and the end are read as one gesture.

Rules: no motion over the QR area while it can be scanned; no step longer than 1.2 s (the 15 s scan-to-open target, M7, is a ceiling, not a budget for animation); with "reduce motion" on, the helix is static and the steps are crossfades; all state changes are also written in text, because motion is not the only carrier of meaning.

**Fallbacks and tests.** (a) A typed one-time code beside the QR, for a camera that will not focus or a patient who cannot hold a phone steady (***proposal***; it adds scope, Q21). (b) Before the demo, scan the QR with 3 different phones at 1 m and at arm's length, in bright and in dim light, with the screen at 50% and 100% brightness; Frontend and Design do it together, 30 minutes, tomorrow. (c) A plain "no helix" QR toggle exists for the test and as an emergency fallback if the animation ever causes a failed scan. "DNA just for the fun" is respected: the helix is a brand motif, never a security claim.

### 11.4 Trust design

**The four marks.** Shape and text, never colour alone. Defined once, used everywhere a record or a citation appears (timeline row, source viewer, citation chip hover, overview).

| Mark | Look | Meaning on screen |
|---|---|---|
| **Verified by source** | Filled shield with check, solid fill, white text | The source confirmed the document. In the demo one seeded record only (B2) |
| **Uploaded by patient** | Outlined, upload-arrow icon, neutral ink, no fill | Default for every photo. Same visual weight as the first so it is honest, not a warning |
| **Edited by patient** | Small pencil tag next to the field that was changed, never on the whole record | The doctor sees exactly which value was edited |
| **Name match only** | Small tag with an "ID missing" icon, outline in the caution tone | Name matched, no ID was printed on the document |

Exactly one of the first two on every record. The other two are optional tags and may stack.

**Identity mismatch ("this exam isn't in your name").** It is built as a safety feature working, not as an error: a calm screen with a shield, in the neutral tone, not red. It says in plain words what did not match, with the two values side by side (the name as read from the document, and the account holder's name), then says that nothing was saved and the photo was discarded. Two actions: **Take another photo** and **Close**. There is no "edit my name" and no "use anyway". A third variant covers "no readable name". The name and ID fields on the review screen are locked (A2), and look locked.

**What the patient sees instead of a diagnosis.** Values outside the printed range get a neutral marker (an arrow and the words "outside the printed range", with the range from the document). No red, no green, no health score, no trend verdict. Findings written in the document appear as the document's own words, in a quote block labelled "From the document". A saved diary entry shows "Saved for your doctor", the time, and nothing else. A fixed line says that only a doctor can interpret results, and the emergency line (in an emergency call 112, Marketing owns the wording) sits on the diary screen. The patient surface contains no assistant, so there is nothing to disclaim there.

**The AI, for the doctor** (E1, E2, E3). Three visibly different kinds of content, so a doctor can tell them apart at a glance:

| Kind | Look |
|---|---|
| **Cited fact** | Plain text with a numbered citation chip at the end of each claim. Chip shows the record name and its provenance mark on hover and on keyboard focus; click opens the source viewer |
| **General medical knowledge** | Inside a dashed container labelled "General medical knowledge, not from this record". Never mixed into a cited paragraph |
| **Not in the record** | A short line: "Not in this record." No filler, no guess |

A fixed strip above the chat says the answers are from an AI and must be checked against the source. **Possible causes** open in their own panel, headed "for the doctor only" and "possibilities to evaluate, not a diagnosis" (Marketing's wording), a different surface tone from the chat, each item with its citation chips. They carry **no percentages, no ranking numbers and no order of likelihood**: invented precision is the part of this feature that could mislead. The panel never exists on the patient surface (C2).

**Consent for possible matches.** A full screen, not a pop-up and not a toast. Off by default. Three plain blocks: what is used, what is never used (name, ID, exact dates), and how to leave. A single primary button to agree, and "Not now" with equal size and weight; no pre-ticked box, no guilt copy. The switch to turn it off again lives on the same screen, always. For a patient who did not opt in, the doctor's workspace shows no Matches tab and no hint that one exists (F2). When the doctor asks for contact, the other doctor's side shows no patient identity (F3).

**The access log, visible and honest.** A list of grants, newest first: doctor, specialty, time given, end time, "ended early" or "expired". No edit, no delete, no swipe-to-remove. A line at the top says "Log chain intact" with a check, and a tap shows the fingerprint of the last entry (D3, P7). It is the patient's proof that nobody looked outside a grant.

**The access timer.** A bar at the top of both surfaces, always on. It shows the time left as minutes and seconds, with a progress track. Under 2 minutes it changes to the caution tone and adds the words "ending soon". The patient's side has the **End access** button in the same bar. At zero the doctor's content is removed from the screen, not hidden behind a blur.

### 11.5 States that must exist (not left to the builder)

| Feature | Loading | Empty | Error | Success |
|---|---|---|---|---|
| Photo to record | "Reading your exam" with progress, never a bare spinner | First run: "Photograph your first exam" with the camera button | Blurred, cut off, not a medical document: say which, offer retake. Never save a half-read record | Fields beside the photo, confirm |
| Identity check | included in the above | n/a | The "not your exam" screen (three variants) | Added to the timeline |
| DNA-QR | strands drawing in | n/a | Expired, used or declined code: says why, offers a new code | Access running, timer on |
| Assistant answer | "Reading the record" with the question echoed | "Ask about this patient". Three quick asks | "Not in this record" · connection problem with retry, the question kept | Cited answer |
| Matches | "Looking for similar patterns" | "No matches yet" (only for an opted-in patient) | Retry | Count + shared pattern chips |

### 11.6 Visual direction (global, clinical but human)

No brand name is set (Q14); the three directions are in words, with the neutral label "healthapp".

| | **A. Clinical Calm** | **B. Warm Notebook** | **C. Night Lab** |
|---|---|---|---|
| Palette | Off-white paper (#F7F8F6), deep ink (#12303A), one teal for actions and "verified" (about #0E7C86, deeper step for small text), a quiet second tone for the doctor's strand, one amber for caution. Cool greys | Cream, warm grey, terracotta and sage. Soft shadows | Deep navy, off-white text, luminous cyan-green accent. The helix glows |
| Type | A humanist sans with Latin, Greek and Cyrillic in one family (IBM Plex Sans), a mono for lab values (IBM Plex Mono) | A friendly serif for headings, a sans for body | A geometric sans, mono for values |
| Tone | Precise, quiet, reassuring. Looks like a record you can trust | Personal, human, a notebook. Less "hospital" | Biotech, high-tech. Memorable on stage |
| Risks | Can feel plain. The helix and the countdown have to carry the personality | Reads consumer; a hospital buyer may not trust it as a clinical tool | Low legibility for older patients and for photographed documents; QR needs a light card anyway |

**Recommendation: A, Clinical Calm, for the app and the doctor workspace.** The buyers in `research/buyers.md` are hospitals, clinics and medical-tourism hubs, and the patients include older people with paper folders: both need a record that looks like it can be believed and read. **Use C's dark navy only for the handshake scene and the deck cover**, where the helix glows and the audience is a room, not a patient. This keeps the demo memorable without making the product hard to read. B is the fallback if the CEO wants a warmer consumer story.

Other rules for every direction: no gradients on the QR card, no stock illustration, no purple, no icon-in-circle grids, no decorative cards (cards only where a card is a real object, such as an exam or a grant); sentence case; numbers in tabular figures; a restrained 4 or 8 px radius.

### 11.7 Accessibility, and multilingual from day one

Target: **WCAG 2.2 AA** on both surfaces.

- **Contrast:** 4.5:1 for text, 3:1 for icons, borders and the timer track, measured on the real tokens before they go to Frontend, including text on the teal and caution fills.
- **Size:** patient body text 18 px minimum, values 20 px, scales to 200% without loss of content or function; touch targets at least 48 px on the patient surface (AA asks 24 px; older patients and shaking hands need more) and 44 px on the doctor workspace. No text baked into images.
- **Colour is never the only carrier:** every state has an icon and a word (the four marks, out-of-range, the timer, the opt-in).
- **Keyboard and screen reader (doctor workspace especially):** full keyboard path through ask, citation, source viewer and end; visible focus that is not hidden under the sticky timer bar (2.4.11); the timer announces at the start, at 2 minutes and at the end, not every second; citation chips are real buttons with the source name; the QR has a text alternative ("Code to share your record, valid for N seconds") and the typed code.
- **No gesture-only actions and no dragging** (2.5.7): everything works with a tap. Camera capture also accepts an upload from the gallery.
- **No time pressure while reading:** the QR refreshes on request; the diary form never expires; nothing on the patient side auto-dismisses before it can be read.
- **Older patients:** three labelled tabs, one primary action per screen, plain words, big confirm and cancel buttons of equal weight, generous spacing, no hidden menus.
- **Reduce motion:** the helix and every transition have a static equivalent.
- **Global:** all strings are external, none baked into frames. Layouts allow strings 40% longer than English and mirror for right-to-left (logical start and end, never left and right). Dates are written with the month as a word to avoid day-month confusion; units and reference ranges are shown exactly as printed. The type family covers Latin, Greek and Cyrillic; Arabic, Hebrew, CJK and Indic scripts fall back to the matching Noto family, checked before any country launch. The demo interface is English (decision in section 5); the layouts are drawn so a second language is a string change, not a redesign.

### 11.8 What Design produces tomorrow, and in what order

Tool: **Paper**, the design tool of record (owner's account). Figma only if Frontend needs something Paper cannot hand over; say so on MIN-4428 and Design will ask before using it. Each drop below is a link to the frames plus a short spec note per screen (layout, tokens, props, states, breakpoints, motion, accessibility), posted on MIN-4428 so Frontend (Ren) can start building before the next drop lands.

| Order | Drop | Covers | Time (***proposal***) |
|---|---|---|---|
| 0 | **Foundations**: colour, type and spacing tokens, the four marks, citation chip, access timer, the helix and QR card at real size | The base for every screen. Ren can wire CSS variables from here | 40 min |
| 1 | **Patient capture path**: screens 1, 2 and 3 | A1, A2, B1, B2, A3 | 60 min |
| 2 | **The handshake**: screen 5 (all states), screen 7 and the open of screen 8 | D1, D2, E1. The signature moment | 60 min |
| 3 | **The assistant**: screen 8 answers, general-knowledge block, Possible causes, screen 9 | E2, E3 | 60 min |
| 4 | **The rest**: screens 4, 6, 10, Across specialties and Matches in screen 8 | C1, C2, D3, F1, F2, F3, E4 | 55 min |
| 5 | **QR scan test** with Frontend, then fixes | M7 | 30 min |

**Total about 5 hours of active design (about 4.5 hours of frames, the rest the scan test and fixes); the P0 path from capture to cited answer (screens 1, 2, 3, 5, 7, 8, 9) is handed over by about hour 3.7, and screens 4 and 10 by about hour 4.6.** The deck design is a separate round, estimated separately once Marketing's deck content exists. These times are estimates anchored to nothing measured: no health-app design run has been timed.

**What Design needs from others, and when:**
- From **Marketing**: the wording of the refusal screens, the out-of-range note, "possible causes" heading, the emergency line, and the consent text, before drop 1 (about hour 0:40) and drop 4 respectively (Q22). Until then the frames carry placeholder text, marked as such.
- From **Product**: confirmation of the 15-minute access time (Q7) and of the typed-code fallback (Q21).
- From **Frontend**: the device on stage (Q11) and the stack's limits for the helix animation (SVG or Lottie), before drop 2.
- From **Backend**: the demo patient's exam list and the seeded "verified by source" record (Q4, Q12), before drop 1.

### 11.9 Self-check (design-critique and plan-design-review lenses, applied to this plan)

Verified: every P0 story in section 6 has a screen in 11.2; every state the stories name (refused, expired, used, not in record, could not read) is in the table; the patient surface has no screen that carries a diagnosis; contrast, size and keyboard rules are stated per surface. Not verified: nothing is drawn yet, so hierarchy, spacing and contrast are intentions until the frames exist and are checked by eye at 1x in both sizes, with saved screenshots; the QR scan test has not been run; reading order on the doctor workspace is untested with a doctor. Risks: (1) the doctor workspace carries a lot (timeline, assistant, causes, source viewer): if it feels crowded in drop 3, Matches and By specialty move behind a single "More" tab; (2) the helix animation is the first thing cut if the build runs late (the static framed QR still works); (3) the demo is English only, and a Greek doctor in the room will read Greek exams in an English shell: Greek exam names must be shown as printed.

**Design signs section 11 in section 16 (my part is complete; nothing in the others' parts blocks me, with the dependencies of 11.8 noted). The deck design is signed in its own round.**

---

## 12. Frontend (Frontend)

**Owner: Ren Derakis (Frontend), MIN-4430. Written 13 Nov 2026, words only: no code, no repo yet.**

**Status of the inputs.** Section 10 (Backend) was still empty when I wrote this, so every point that touches the server is written as *"Frontend assumes"* and listed in 12.12 as a question for Backend. Where Backend answers differently, Backend's answer wins and I adjust; I do not override it. No frames exist yet (section 11 is words), so sizes and tokens below are Design's numbers, taken as given. Hours are my estimates, anchored to nothing measured (no health-app build has been timed).

### 12.1 The stack (answers Q11 on the app's shape)

**One web app, two role-gated route trees, installed as a PWA. Not native, for the demo.**

| | Choice | Why |
|---|---|---|
| Shape | **One** Vite + React + TypeScript app. `/patient/*` (mobile first, 390 x 844) and `/doctor/*` (laptop and tablet, 1280 x 800 down to 768). Role comes from the signed-in account; a route guard sends the wrong role to its own tree | One deploy, one URL to put on every device, one set of tokens, marks, citation chip and timer (Design's "one product, one design system"). A second app doubles setup time for no gain |
| Why not Next.js | Not used | No SEO, no public pages (SEO row of section 16: n/a), no server rendering need. The server is Backend's. Vite starts and rebuilds fastest, which is what 20 hours reward |
| Why not native | Patient app is a PWA (manifest, full-screen, add to home screen) | No store review, no build pipeline, iPhone and Android both work from a URL. The camera (file capture, `getUserMedia`), screen wake lock and Web Crypto are all there. **Product path (scope B) is different:** the key on the patient's device (P2) is much stronger in the OS keychain or secure enclave than in browser storage, so a native shell is likely right after the event. That is the CTO's call, not the demo's (12.12, F-Q4) |
| UI | Tailwind (v4) with CSS variables from Design's tokens, **Radix UI primitives** (dialog, tabs, tooltip, toggle) styled to the tokens, shadcn only as a starting point and never in default look | Radix gives focus handling, keyboard paths and ARIA for free, which is where WCAG 2.2 AA is won or lost |
| Icons, fonts | Phosphor icons (one family). IBM Plex Sans and Plex Mono self-hosted (`@fontsource`, Latin + Greek subsets, `font-display: swap`) | Matches Design's direction A. Greek exam text must render in the same family |
| Data | TanStack Query for server state; a small reducer for the grant state machine (12.4); no global store | Fewer moving parts. Keeps doctor data out of anything that persists (12.6) |
| Contracts | `zod` schemas for every API response, types inferred from them; **MSW** mocks built from the same schemas | I build all screens against mocks from hour 1 and swap in Backend's endpoints one by one. A late endpoint never blocks a screen |
| i18n | `react-i18next`, one JSON catalogue per surface, `Intl` for dates and numbers | 12.7 |
| QR | `qrcode` to generate, `qr-scanner` to scan (12.3) | Small, maintained, no framework lock-in |
| Server link | `@supabase/supabase-js` **only if** Backend picks Supabase (assumed; Q11 and section 10); otherwise `fetch` plus EventSource-style streaming | Backend's choice. I wrap it in one `api/` module so a change touches one folder |
| PWA | `vite-plugin-pwa`: manifest and app-shell cache only. **The service worker never caches an API response, a photo or a streamed answer** | Health data must not sit in a cache (12.6) |
| Tests | Vitest + Testing Library + `vitest-axe`. **No Playwright** (team rule: E2E writes browser tests) | Section 12.10 says what is covered |
| Hosting | A stable HTTPS URL with preview deploys (Cloudflare Pages or Vercel; Backend and the CTO decide) | **Mobile Safari and Chrome give no camera over plain HTTP.** HTTPS from hour 1, not hour 15 |

### 12.2 Camera capture, upload and the "reading" state (story A1, A2, B1)

**Capture: the phone's own camera app through a file input, not a live in-page viewfinder.**
`<input type="file" accept="image/*" capture="environment">` opens the native camera on iOS and Android with full autofocus, HDR and the user's own steadiness aids, and returns a full-resolution photo. A second control, **Choose from gallery**, is the same input without `capture` (Design requires the gallery path, 2.5.7 and older patients). A live `getUserMedia` viewfinder with an edge guide is nicer but costs about 2 hours and is worse at focusing on paper; it is **not** in the plan. I use `getUserMedia` only on the doctor side, to scan (12.3).

**Before upload (in the browser, about 150 ms):**
1. Decode with `createImageBitmap(file, { imageOrientation: "from-image" })` so rotation is right on every phone.
2. Scale the long edge to 2000 px, re-encode as JPEG quality 0.85. Target under 1.5 MB, so the upload fits the 30-second budget on event Wi-Fi.
3. The re-encode **strips EXIF**, including GPS. A privacy gain at no cost. (HEIC from iPhones also becomes JPEG here, whatever Safari did.)
4. A cheap blur check on a 256 px copy (variance of a Laplacian). It is a hint ("This looks blurry, want to retake?") and never a gate. Server and Gemini decide readability (A1). Built only if time allows (P1).

**Upload and reading (Frontend assumes Backend offers: an upload that returns an exam job id; job status by Realtime or by `GET`; a final result or a typed failure. Q to Backend, 12.12):**

| State | What the patient sees (Design's screen 1) | Frontend rule |
|---|---|---|
| Ready | Camera button, gallery button | |
| Uploading | "Reading your exam" with stage **Sending** | Retry on network error with the blob kept in memory; never ask for a second photo because Wi-Fi blinked |
| Reading | Stage **Reading values**, then **Checking it is yours** (B1) | Stage names come from the job status when Backend sends it. If Backend sends none, I show one honest label and an **indeterminate** bar. **I never draw a percentage the server did not give**: an invented 70% is the same fault as an invented likelihood |
| Slow | After 40 s: "Still reading. This one is taking longer." | At 60 s (the A1 limit) stop and offer retry; the photo is kept |
| Result | Fields beside the photo, name and ID **locked** (A2), out-of-range marker with the printed range, edited fields tagged "edited by patient", confirm button | Photo shown from the local object URL, not re-downloaded |
| Cannot read | Says which problem (blurred, cut off, not a medical document) and offers retake | Never saves a half-read record; the server's typed reason picks the sentence |
| Refused (B1) | Design's calm "not your exam" screen, three variants (name, ID, no readable name), two values side by side | The two values come from the server's refusal. No edit-my-name, no use-anyway: there is no code path for either |

The upload is a plain multipart or signed-URL `PUT` (Backend's call). The review screen does not save anything: save is one call that Backend can still refuse.

### 12.3 The DNA-QR: generating, framing, scanning (story D1; answers Q10, Q21)

**Generating (patient phone).**
- `qrcode` renders an **SVG** (sharp at every size, no canvas blur), `errorCorrectionLevel: "Q"`, quiet zone 4 modules, `shape-rendering: crispEdges`. The payload is short (an HTTPS URL with a one-time opaque token, about 50 to 70 characters), so the QR stays at a low version with **large modules**, which is what a webcam needs. Raising correction to H would shrink the modules for no scan benefit here; Q is the right trade. Design's rule stands: **modules are never altered**, no gradient, no logo cut-out, dark ink on pure white, 60% of screen width or more.
- **The payload holds no name and no health data** (D1). It is `https://<app>/s/<token>`; Backend issues the token (one use, short life) and the typed code (below). A bonus of the URL form: if a doctor points the phone's native camera at it, the app opens on the doctor's scan route and asks for sign-in, so a second scanning path exists with no extra work.
- Validity ring and countdown around the card, refresh on request ("New code"), never an auto-refresh while a scan may be in progress. Design's rule: no time pressure while reading.
- **Screen wake lock** (`navigator.wakeLock`) while the QR is on screen, so the phone does not dim mid-scan. The web cannot set brightness: the stage checklist (12.8) says brightness 100% and auto-lock off.
- Text alternative on the QR: "Code to share your record, valid for N seconds", plus the typed code.

**The helix (answers Pix's question about animation limits).** Hand-built **inline SVG animated with CSS and the Web Animations API**; no Lottie, no canvas, no WebGL, no extra library.
- Two sine-shaped strand paths and about 12 rungs, in the patient's tone and the doctor's tone. If Design's drop 0 gives the geometry I use it; if not, I generate the paths from a formula, so no Frontend wait.
- **Only `transform` and `opacity` animate**, at most about 30 animated elements, target 60 fps on a mid-range phone (iPhone 12 or Pixel 6 class) and on the projected laptop. Draw-in 0.8 s, lock one rung at a time 1.0 s, unwind the reverse, none over 1.2 s (Design's rule, and M7's 15 s is a ceiling).
- Strands live in the side gutters. **Nothing moves over the scannable card.**
- `prefers-reduced-motion`: static helix, crossfades. Every state change also has text (Design: motion is not the only carrier).
- The haptic on "locked" uses `navigator.vibrate`, which exists on **Android only**; iOS Safari has no web haptic API. It is best effort and nothing depends on it.
- A `?plain=1` flag removes the helix (Design's test and emergency fallback, 11.3). **The helix is the first thing cut if time runs short** (12.11); the framed static QR already works.

**Typed one-time code (Q21: yes, in the demo).** About 1 hour in total across both sides. An 8-character code (an unambiguous alphabet, shown as 4 + 4 under the QR) that Backend issues with the token and that resolves to the same request. The doctor types it on the scan screen. It is the stage fallback if the webcam does not read the QR, and Design's accessibility alternative. It rides on the same claim endpoint as the scan.

**Scanning (doctor device).** `qr-scanner`: it uses the browser's native `BarcodeDetector` when present and a worker decoder when not, and is the quicker of the options in low light. (`BarcodeDetector` is not in Safari, so a library with a worker fallback is not optional.) Constraints: ask for about 1280 x 720, front camera on a laptop, rear on a phone, a visible square guide, and a "Type the code instead" link always on screen. Camera permission is granted in advance on the stage device and the preview checked at the venue.

**Scan risks, named (they are why the 30-minute 3-phone test of 11.3 is in the plan and not optional):**

| Risk | Why it happens | What I do |
|---|---|---|
| Screen glare and moiré | A webcam reads a phone screen: refresh banding and reflections | White card at 60%+ width, no glossy overlays, the patient tilts a little; test at 1 m and arm's length |
| Low or mixed light on stage | Stage lights, dim hall, auto-brightness | Brightness 100%, auto-lock and auto-brightness off, wake lock; scan test in bright and dim light as Design specified |
| Low-resolution laptop webcam | 720p webcam at arm's length gives few pixels per module | Large modules (short payload, level Q); distance guidance on screen; second phone as scanner if the webcam fails (Q11) |
| iOS Safari camera quirks | Permission per origin and per session; needs HTTPS and a user tap to start | Start the camera from a button; open the scan route once beforehand and keep the tab; install the doctor page as an app on the phone fallback |
| The animation causes a failed scan | A frame in motion near the code | Nothing animates over the card; `?plain=1`; scan-tested with the animation running |

### 12.4 The handshake in real time, and the countdown (D1, D2; M7)

**The patient's Approve must reach the doctor in under a second, on bad Wi-Fi, and the end must be certain.** So:

- **Transport: Realtime first, polling underneath.** One hook `useHandshake(requestId)` subscribes to Backend's realtime channel (Supabase Realtime or equivalent) **and** polls `GET /handshake/:id` every 2 s **whenever the channel is not confirmed or has been silent for 3 s**. The reducer accepts whichever arrives first and ignores out-of-order older states. Event Wi-Fi is the likeliest thing to fail on stage, and polling keeps M7's 15 seconds even if the socket never connects. Cost: about 1 hour.
- **States (one reducer, the same on both devices):** `code_shown` → `scanned` (doctor claimed; patient sees who is asking) → `approved` | `declined` → `active` (with `expires_at`) → `ended` (early) | `expired`; plus `code_expired` and `code_used` for an unscanned or reused code. Every state has its own text (Design 11.5).
- **The server owns time.** Every state carries `expires_at` and `server_now`; the client computes a clock offset once and shows `expires_at − (Date.now() + offset)`. A laptop clock that is wrong by a minute must not shorten or lengthen a grant. The countdown is a display. **The authority is the server: any doctor call after expiry returns a typed `grant_expired`/403, and on that the doctor UI closes the session**, even if the local clock says there is time left.
- **Countdown, both sides (Design 11.4):** always-visible bar, minutes and seconds, track, caution tone and "ending soon" under 2 minutes. Screen readers hear the start, 2 minutes left and the end (an `aria-live` region updated at those three moments, not every second). The patient bar carries **End access**, which calls the server and ends at once; the doctor's screen reacts through the same hook.
- **When access ends, the doctor's data is removed, not hidden:** abort any streaming answer (`AbortController`), clear the TanStack cache, revoke every photo object URL, unmount the workspace, route to "Access ended" (screen 10). A new request returns "no access".
- **Measuring M7:** the demo panel (12.8) shows `scanned_at`, `approved_at` and `doctor_open_at` from the events, so the 15-second target is read from timestamps, not a stopwatch.

### 12.5 The doctor's assistant UI (E1, E2, E3, E4; M5)

Layout is Design's (11.1): timer bar on top, timeline left (40%), assistant right (60%), source viewer as a right side sheet. Down to 768 wide the columns stack with the timeline in a tab.

**Streaming.** `fetch` with a `ReadableStream` over Server-Sent-Events framing (not `EventSource`: it must be a `POST` with auth). Frontend assumes Backend streams **typed blocks, not free text with bracket markers**:

```
block.start { id, kind: "fact" | "general" | "not_in_record" }
block.delta { id, text }
block.end   { id, cites: [recordId, ...] }
done | error { code }
```

Why blocks: Design needs three visibly different kinds of content, and parsing `[1]` markers out of a token stream is where citations break. With blocks, text streams in as it is generated and the citation chips attach when the block closes. Frontend assumes the stream is not buffered by the host (Backend confirms, 12.12). **Contingency:** if streaming does not work in time, the same block types arrive in one response after "Reading the record"; the components do not change.

| Block | Rendering |
|---|---|
| **Fact** (cited) | Plain text, numbered citation chips at the end of the claim. **A fact block with no valid citation is not rendered as a fact.** The client checks every cited id against the record index loaded with the overview (E1). An id that does not resolve is shown as "Could not confirm a source for one statement" and logged for M5. This is a client guard, not a substitute for Backend's |
| **Citation chip** | A real `<button>`; accessible name "Source 2: Blood test, 12 March 2026, uploaded by patient"; mark visible on hover **and** keyboard focus (Design); click opens the source viewer; focus returns to the chip on close |
| **Source viewer** | Right side sheet (Radix dialog, non-modal so the timeline stays usable): extracted values beside the original photo, the provenance mark, edited and name-match tags. Photo from a short-lived signed URL, released when the sheet closes or the grant ends |
| **General knowledge** | Its own dashed container, labelled by Marketing's wording, always **after** the cited facts, never inside a cited paragraph (the component takes only `kind: "general"` blocks; there is no way to put one inside a fact block) |
| **Not in this record** | One line, no filler, no suggestion. The component renders nothing else for that block kind |
| **Possible causes (E3)** | Its own panel with a different surface tone, headed "for the doctor only" and "possibilities to evaluate, not a diagnosis" (Marketing's wording). Each item: text plus citation chips. **The schema has no number, rank or probability field and the component cannot render one** (Design's rule against invented precision) |
| **Across specialties (E4)** | Same blocks, grouped by specialty from the server's grouping; P1 |
| **Failure** | Connection error shows retry **with the question kept in the box**; a stream cut halfway marks the last block "incomplete" |

Also: AI strip fixed above the chat; three quick asks as buttons; the question is echoed while "Reading the record"; the answer is plain text rendered as text (no markdown, no HTML injection); the conversation closes with the grant. **M5** is checked by the client counting fact blocks versus resolved cites in a dev overlay, plus a hand check of every answer in the story.

### 12.6 "The patient never sees a diagnosis": enforced in the client too (C2; M6)

Backend enforces it on the server. The client adds layers, so that one mistake on either side does not reach a patient's screen:

1. **Two bundles, one rule.** The patient tree imports nothing from the doctor tree: an ESLint `no-restricted-imports` rule on `patient/**` for `doctor/**`, the assistant, the causes panel and the source viewer's assistant parts. Routes are lazy, so the patient bundle does not contain assistant code. A Vitest check over the built output asserts the patient entry chunks do not include the assistant module (the same kind of test the team already runs over `dist/`).
2. **A closed schema on the patient side.** Every patient response is parsed with a `zod` schema in **strict** mode. A field the schema does not list (`assessment`, `possible_causes`, anything) makes the whole response rejected, logged to the console, and not rendered. A unit test feeds a poisoned payload and asserts nothing shows.
3. **Render allowlist.** Patient components render only the fields of the schema: exam values and the printed range, "From the document" quotes, diary entries, marks. The saved diary entry shows "Saved for your doctor", the time, and nothing else (Design 11.4).
4. **No doctor channel on the patient device.** The patient hook never subscribes to the assistant or session channel; the session token a patient holds cannot open `/doctor/*` (route guard) and Backend refuses it anyway.
5. **Nothing assistant-shaped persists.** No assistant text in `localStorage`, `sessionStorage`, IndexedDB, logs or analytics (analytics events: n/a for the demo, section 5). The service worker caches the shell only. Responses send `Cache-Control: no-store`; `Referrer-Policy: no-referrer` so the handshake URL does not leak.
6. **Walk-through (M6).** Before each of the three final runs I open every patient screen and tick "no cause, no condition name that the document does not print, no advice, no urgency". One thing for Product: a doctor's letter or discharge note may **print** a diagnosis. Design shows it as the document's own words in a "From the document" quote (11.4). That is consistent with C2 only if "no condition name" means "none the app adds". I treat it that way and ask Product to confirm (12.12, F-Q3).

### 12.7 Accessibility and i18n (11.7)

**Target: WCAG 2.2 AA on both surfaces.** What I build in, and what I will and will not claim:

- **Tokens, not values.** Design's tokens become CSS variables; contrast is measured on the real tokens (4.5:1 text, 3:1 icons, borders and timer track) before screens use them.
- **Size.** Patient root size set so body text is 18 px and values 20 px, in `rem` so 200% zoom works; touch targets 48 px minimum on the patient tree (`min-h-12`), 44 px on the doctor tree. No text in images.
- **Colour is never the only carrier:** every mark and state is icon plus word, as Design specified.
- **Keyboard and screen reader.** Radix gives focus trap, roving focus and Escape. Doctor path (ask, citation, source viewer, end) is fully keyboard-operable. `scroll-padding-top` equals the sticky timer bar's height so focus is never hidden under it (2.4.11). Timer announcements at start, 2 minutes and end (12.4). Chips are buttons with source names. The QR has the text alternative and typed code.
- **No gesture-only actions, no dragging** (2.5.7); gallery upload as the alternative to the camera.
- **Reduced motion:** one shared hook. Helix and transitions have static equivalents.
- **Checks I run:** axe on every screen in the demo flow (`vitest-axe` in component tests and axe in the browser at 390 and 1280), a keyboard-only pass on the doctor path, 200% zoom, a manual screen-reader pass on the patient capture screen. **Not claimed:** a formal conformance audit. 20 hours does not hold one; I report what was checked and what was not.

**i18n-ready, English in the demo (the section 5 decision).**
- Every string comes from a catalogue; none is written in a component. A lint rule flags literal strings in JSX. Marketing's wording (Q22) is a JSON edit, so late wording costs minutes, not a rebuild.
- Logical properties only (`ms-`, `me-`, `ps-`, `start`, `end`): no left or right. `lang` and `dir` are set on the root from the locale.
- Dates written with the month as a word (`Intl.DateTimeFormat`); units and reference ranges shown **exactly as printed** on the document; exam names in the original language (Greek stays Greek).
- Plural and gender forms through ICU messages, so a second language needs no code change.
- A **pseudo-locale** (every string about 40% longer, plus a mirrored right-to-left run) for one 20-minute layout check at hour 12. Cut if time is short; the logical-properties rule already does most of the work.

### 12.8 The demo on stage: devices, backup, seed, reset

**Devices (Frontend's proposal; the founder and the CTO confirm).**

| | Device | Role |
|---|---|---|
| D1 | Laptop on the projector | **Doctor workspace**, full screen, signed in as the seeded doctor. The audience sees it (Design's recommendation, Q11) |
| D2 | The founder's phone | **Patient** app, installed as a PWA, signed in as the seeded patient Maria |
| D3 | A second phone, same build | **Backup scanner** (opens the doctor scan route and loads the session on D1) and backup patient |
| D4 | A second laptop | Holds the **recorded video** of the full 3-minute demo, last resort |
| N | Phone hotspot + a second SIM or data plan | Network backup if the venue Wi-Fi fails |
| P | Power: two power banks, chargers, the right HDMI or USB-C adapter | |

**How the audience sees the patient's phone** is open (F-Q5): a cable mirror (QuickTime on a Mac for an iPhone, `scrcpy` for Android) in a corner window of the projected screen, or a second small display, or the presenter holds it to a camera. It needs one rehearsal at the venue, not a code change.

**Pre-flight on every device (20 minutes before, also before each of the three runs):** open the URL once and grant camera permission; auto-lock off, auto-brightness off, brightness 100%, Do Not Disturb on; app installed to the home screen; fonts and the shell loaded; run the plain-QR toggle check; confirm both devices reach the backend; note the hotspot name.

**Offline and backup, stated honestly.** The app **cannot work offline**: extraction, the assistant and the handshake all need the server. What I build and what I do not:
- **Replay mode (`?demo=replay`)** replaces only the Gemini-dependent parts, the exam extraction and the assistant's answers, with recorded results for the demo's three exams and its questions, through the same UI and block types. A Gemini outage or a slow answer does not stop the story. It does **not** replace the handshake, which still needs the network. (Cost: about 1 hour, built from the mocks that already exist.)
- If the **network** is down: switch to the hotspot; if that fails, D4's video.
- A one-line label in the demo panel shows when replay is on, so the founder never forgets it is.

**Seeded data.** The demo patient (Maria) arrives with her history already in place: about 10 synthetic exams in Greek and English, three weeks of diary entries, one "verified by source" record (Q4), the opt-in set for matches (Q12). The three exams for the live photo step are printed and ready, plus one exam of another person for the refusal step (B1). Backend seeds the server side; I need the same list for my mocks.

**The reset button (one tap, from a hidden demo panel).** The panel is its own route `/demo` (not linked from any patient or doctor screen, so it cannot affect M6) behind a passcode. It: calls Backend's reset (restores the seeded state, ends every grant, clears the access log back to its seeded entries, removes any exams added during the run); clears the local state (query cache, local and session storage, object URLs, the shell cache); signs both devices back to the start screen; and shows the toggles for `plain QR`, `replay mode` and the M7 timestamps. Reset must finish in about 10 seconds so three full runs fit in the last two hours. Frontend assumes Backend provides the reset endpoint (12.12).

### 12.9 Components I build, in order of need

Shared (hour 0 to 1.5): provenance marks (four), citation chip, access timer bar, helix SVG, QR card, API module with zod schemas, MSW mocks, i18n catalogue, token CSS, route guards, `useHandshake` and the grant reducer, error and loading primitives. Then per screen exactly as Design's table 11.2. The shared set is built **before** the screens so that two surfaces look like one product.

### 12.10 Tests (what ships with the build, and what does not)

Per the team's rule that related tests ship with the work, and that Frontend writes no Playwright:

- **Vitest unit tests on the logic that can silently break the demo:** the stream parser (partial chunks, a cut stream, a block without cites, an unknown id), the grant reducer (every transition, out-of-order and duplicate events), the clock-offset countdown, the strict patient schema with a poisoned payload, the citation validator, and a catalogue check (no literal strings in JSX, no missing keys).
- **Component tests (Testing Library + `vitest-axe`):** the four marks, the citation chip's accessible name, the not-in-record and general-knowledge blocks, the three refusal variants.
- **Build-output test:** the patient entry chunks do not contain the assistant module (12.6).
- **Not covered, and said so:** layout and spacing (jsdom measures none; they are checked in a browser at 390 and 1280), real camera, real QR scan and real Wi-Fi (the 3-phone scan test and the three final runs), and the end-to-end story (E2E's, after the build). The M7 and M1 results come from those runs, not from unit tests.
- A green result I produced myself is not a result: before I report a pass I check that the test can fail (the poisoned payload really is rejected; the reducer test really fails on a wrong transition).

### 12.11 Build plan: hour by hour, with Pix's drops and Cron's endpoints, and the cut order

**H0 is the start of the build at the event.** The kickoff time and the submission time are Q9, so the hours are relative; the freeze (2 hours before submission, section 5) is the last two of the 20.

**Rough build time per P0 story (estimates, nothing measured):**

| Story | Frontend hours | Notes |
|---|---|---|
| Foundation: scaffold, tokens, shared components, mocks, deploy | 1.5 | Includes HTTPS preview URL and a camera test on a real phone |
| A1 + A2 capture, reading, review | 2.0 | |
| B1 + B2 refusal screens, marks | 0.75 | Marks are shared |
| A3 timeline (list; series is P1, +0.7) | 0.75 | |
| C1 + C2 diary | 0.75 | |
| D1 QR, helix, typed code, patient side | 1.75 | Helix about 1 of this |
| D1 + D2 doctor scan, handshake hook, countdown, end | 2.5 | The hook with polling fallback is the hard part |
| E1 overview | 1.0 | |
| E2 assistant, chips, source viewer, general and not-in-record blocks | 3.0 | |
| E3 possible causes panel | 0.5 | |
| **P0 subtotal** | **about 14.5** | |
| Integration against real endpoints, fixes | 2.0 | Always larger than planned |
| Demo mode: reset panel, replay, device rehearsal | 1.5 | |
| **P0 + integration + demo mode** | **about 18** | Fills the 18 hours before the freeze almost exactly |

**Reading this honestly:** all of P0 fits with about 0 to 1 hour spare, and **none of P1 fits unless Pix's drops and Cron's endpoints land on time.** P1 is attempted only after the first full run of the 8 steps.

| Hours | Frontend | Design drop (11.8) | Backend (what I need, 12.12) |
|---|---|---|---|
| 0 to 1.5 | Foundation (above). Wire tokens as they arrive. Deploy to HTTPS. Test the camera on a real phone at the venue | Drop 0 foundations at about 0:40 | API contract (types or OpenAPI) by H1; seeded demo patient list (Q12) |
| 1.5 to 3.5 | Patient capture path: screens 1, 2, 3 against mocks, then real extraction | Drop 1 at about 1:40 | Exam upload + job status + refusal reasons by about H3 |
| 3.5 to 5.0 | Handshake: QR card, typed code, patient side, doctor scan screen, realtime + polling hook. **QR must scan by H5** | Drop 2 at about 2:40 (and drop 3 at 3:40) | Handshake endpoints (create code, claim by scan or typed code, approve, end) by about H4.5, before the scan test |
| 5.0 to 5.5 | **3-phone scan test with Design**, animation running and `plain=1`; fix | Drop 5, scan test (H5.1) | |
| 5.5 to 6.5 | Diary (screen 4), Access ended (screen 10), helix draw/lock/unwind | Drop 4 at about 4:35 | Diary endpoint |
| 6.5 to 10 | Doctor workspace: overview, assistant streaming, chips, source viewer, general and not-in-record blocks, causes panel | Drop 3 in hand by 3:40 | Overview + record index by about H6.5; assistant stream by about H7.5 |
| 10 to 12 | **First full run of the 8 steps on real endpoints** (the walking skeleton; M1 starts counting). Fix what breaks | | Reset endpoint by H12 |
| 12 to 13.5 | States and errors (Design 11.5), expiry and end-early tests, a11y pass (axe, keyboard, 200% zoom), reduced motion, pseudo-locale if time | | |
| 13.5 to 15 | P1 in this order only if the first full run was clean: access log, consent and matches, then specialty view | Design for P1 screens already handed (drop 4) | Matches seed |
| 15 to 16.5 | Demo mode: reset panel, replay mode, device rehearsal at the venue | | |
| 16.5 to 18 | Bug fixing; M5 and M6 walk-throughs | | |
| 18 to 20 | **Freeze.** No new feature. Three full runs; reset between each; notes of anything that needed a retry | | |

**Cut order for Frontend if time runs short** (follows section 5; the CTO sets the final one):

1. The **helix animation** goes first of all: it is not a story, and Design agrees (11.9). Keep the static framed QR and the strands as still artwork.
2. **F3** (doctor-to-doctor contact UI), then **F1 + F2** (consent and matches screens), as in section 5.
3. **A3 series** (the CRP chart); keep the date-ordered list.
4. **D3** (access log screen); the log still exists on the server.
5. **E4** (by specialty).
6. The blur check, the pseudo-locale run, replay mode polish.
7. **Never cut:** capture and review, the refusal screens, the handshake with countdown and end, the cited assistant with the source viewer. E3 is the last P0 to go, and only before those.

### 12.12 What I need, my answers, and the questions I raise

**Needed from Design:** token drop at about 0:40 and the helix geometry (or I use my own formula); the demo patient's exam list for the mocks. **Needed from Marketing (Q22):** wording by about H1:30; until then the catalogue holds marked placeholders. **Needed from Product:** Q7 (15 minutes) and Q21 (typed code: I say yes, 1 hour). **Needed from Backend** (listed with the hour I need each; where section 10 answers otherwise, Backend wins):

1. A typed contract for every endpoint by H1; I build against mocks until each real one lands.
2. Exam upload, job status (stages if possible) and typed refusal and failure reasons.
3. Handshake: create code and typed code (one use, short life), claim by scan or typed code, approve, decline, end; a realtime channel **and** a plain `GET` for polling; `expires_at` and `server_now` on every state; typed `grant_expired`.
4. The assistant: a streamed response in typed blocks (12.5), unbuffered by the host, or one whole response as the fallback; every fact block carries cite ids that exist in the record index.
5. Photos by short-lived signed URLs no longer than the grant.
6. A reset endpoint and the seeded state; the stable HTTPS host.

**Questions raised by Frontend** (Back: please move them into section 17):

- **F-Q1 (Backend):** realtime is Supabase Realtime or something else, and does the host stream responses unbuffered? This decides 12.4 and 12.5. **CTO:** Supabase Realtime `postgres_changes` on `grants`, plus 2 s polling when the channel is silent for 3 s. Unbuffered streaming no longer matters, because the assistant is not streamed.
- **F-Q2 (Backend, CTO):** the assistant's block protocol (12.5), accepted or changed? **CTO:** Not streamed. One JSON of verified blocks with Cron's kind names (`record_fact`, `general_knowledge`, `not_in_record`, `possibilities`) and full cite ids (`reviews/cto-review.md` section 3).
- **F-Q3 (Product):** may a diagnosis that is printed on a patient's own document (a doctor's letter) appear in the patient's screen as the document's own words? (12.6, point 6)
- **F-Q4 (CTO):** for scope B, key custody on the device (P2): native shell, or Web Crypto and passkeys in the browser? Not the demo. **CTO:** For the product, a native shell with non-exportable keys in the Secure Enclave or StrongBox for patients. Doctors use the web with a device-bound WebAuthn credential. Synced passkeys are never the record key.
- **F-Q5 (Founder, via Product):** how does the audience see the patient's phone (mirror in a window, second display, or camera)? 12.8.
- **F-Q6 (CTO):** host and URL for the app (HTTPS from hour 1) and whether the doctor on stage is a laptop webcam scan or a second phone (Q11). **CTO:** Cloudflare Pages: production goes to `demo`, previews go to `dev`, HTTPS from H0:30. Webcam scan first, then the second phone, then the typed code.

### 12.13 Self-check (code-reviewer lens applied to this plan)

Verified by reading: every P0 story has a screen (section 11.2), a component here, an hour estimate and a place in the hour table; the patient tree has no path to an assistant string; the handshake does not depend on the client clock; every state of Design's table 11.5 has an owner. **Not verified:** nothing is built; the hour estimates are guesses (no timed precedent); the scan reliability on webcams is unproven until the scan test; Backend's contract is assumed; no frame exists to measure contrast against. **Top risks to the build:** (1) time: P0 alone fills the 18 hours, so any late drop or endpoint costs P1 entirely; (2) the QR scan on stage (webcam, moiré, light, iOS camera), mitigated by the scan test, typed code and second-phone scanner; (3) the unwritten server contract (streaming, realtime, reset), mitigated by mocks and polling. **Frontend signs section 12 in section 16, with conditions** (see there).

---

## 13. Marketing and positioning (Marketing)

**Owner: Anna Lytica (Marketing), MIN-4429.** Skills: marketing-strategy-pmm, copywriting, copy-editing, content-humanizer, ux-copy. Market: global (founder: "Dont focus on the greek market. we need to focus on global market"). Every number used comes from `docs/research/`; the deck content with sources is [`deck/deck-content.md`](deck/deck-content.md).

### 13.1 Positioning

**In one line:** the patient-held record that doctors can question.

**Positioning statement** (April Dunford / Moore form):
For **people who see more than one doctor**, and **the doctors who see them for the first time**,
who carry their history on paper, in photocopies and in separate portals,
**`[Name]`** is a **patient-held medical record with an assistant that answers only the doctor**,
that turns a folder of old exams into one history a doctor can question in seconds, every answer traced to the exam it came from.
Unlike provider portals (one hospital's chapter), national apps (one country's chapter) and patient chatbots (answers to the patient),
it travels with the patient across providers and borders, opens only when the patient lets a doctor in, in person, and never gives the patient a diagnosis or an insurer a view.

**Category choice:** we do not compete as "an AI doctor" or "a health app". We name the category we own: the patient-held record, made useful to the doctor. It keeps us out of the diagnosis claim on the patient side and out of a head-on fight with EHR vendors on the doctor side.

### 13.2 Ideal customer, per segment

| Segment | Who, exactly | The moment they feel it | What they hear first |
|---|---|---|---|
| **Patient** (free) | An adult with two or more chronic conditions, or seeing two or more specialists; a family living with a rare disease; a patient travelling for treatment | Before a first visit to a new specialist, folder in hand | "Photograph your exams once. Let your doctor see all of them, only when you say so." |
| **Doctor** (the user who decides it is worth it) | A specialist seeing new patients with an outside history: orthopaedics, rheumatology, internal medicine; doctors in international-patient and rare-disease clinics | The first 10 minutes with a new patient, reading what came in a bag | "Ask the history a question. Every answer shows the exam it came from." |
| **Buyer, first** | The head of international patients at a medical-tourism hospital | Foreign records arrive late, on paper, in another language, or not at all | "The patient's whole history arrives before the patient does, consented and readable." |
| **Buyer, next** | Medical director of a multi-specialty clinic chain or telehealth platform; a rare-disease network (pilot, grant-funded) | Repeat tests, slow first visits, specialists who never see each other's results | "Your doctors start every first visit with the whole history." |
| **Judge and investor** | Biotech & AI track jury, health-tech investors | Asking "why you, why now, is it safe" | "The record ships first. The assistant ships certified. Patients hold the key." |
| **Never** | Insurers, in any form | | Not a buyer, not a reader, not a channel |

These are hypotheses: no patient or doctor has been interviewed yet (section 1, "sample size: 0"). The first test is at the Athens LifeTech Park.

### 13.3 Messaging pillars

| Pillar | The line | Proof we can show today | Proof we still need |
|---|---|---|---|
| 1. **Digitise once** | "One photo in. One history out." | The live demo (A1, A2) | Field accuracy on real documents (M2 is synthetic) |
| 2. **The doctor asks, the record answers, with its source** | "Every answer shows the exam it came from." | The live demo (E2); citation share (M5) | Doctors who open the citations (section 9, product) |
| 3. **The patient holds the key** | "Only with your yes. Only for as long as you say." | Handshake, countdown, log (D1 to D3) | Which privacy parts are real in the demo (section 10; deck MQ1) |
| 4. **Close the gap between specialists, and across borders** | "One history for the orthopaedist and the rheumatologist." | Cross-specialty view in the demo (E4) | A pilot with a real specialist pair |
| 5. **Rare patterns become findable, by consent** | "Opt in, and your doctor can find doctors who have seen your pattern." | Seeded matches in the demo (F1 to F3) | The re-identification threshold (Q6) |

The three rules said in every pitch, in this order: **you hold the key; you never get a diagnosis from us; insurers never see it.**

### 13.4 On-screen wording (answers Q22 for Design's frames)

Interface language: English (section 5). Curly braces are filled by the app. No exclamation marks anywhere.

| Where | Wording |
|---|---|
| Refusal: not your exam (B1) | **This exam isn't yours.** The {name / ID} on it doesn't match your profile. We didn't save it. |
| Refusal: no readable name (B1) | **We can't find your name on this exam.** An exam is saved only when it shows your name. Nothing was saved. |
| Could not read the photo (A1) | **We couldn't read this photo.** Fit the whole page in the frame, flat and in good light, then try again. Nothing was saved. |
| Out-of-range marker, patient side (A1) | Outside the printed range ({low}–{high} {unit}) |
| Fixed line on the patient's results | Only a doctor can tell you what your results mean. |
| Diary saved (C2) | Saved for your doctor. {time} |
| Emergency line on the diary (C2) | In an emergency, call 112 or your local emergency number. |
| Provenance marks (B2) | Verified by source · Uploaded by patient |
| Other marks | Edited by the patient · Name match only: no ID on this exam |
| Share button (D1) | Share with a doctor |
| Approval on the patient's phone (D1) | **Dr {name}, {specialty}, wants to see your record.** Access ends after {15 minutes}. Buttons: **Let in** · **Don't let in** |
| Access ended (D2) | Access ended. Dr {name} can no longer see your record. |
| AI strip above the doctor's chat (E2) | Answers are written by AI from this patient's record. Check each one against its source. |
| Not in the record (E2) | This isn't in the record. |
| General-knowledge mark (E2) | General medical knowledge, not from this record. |
| **"Possible causes" panel heading (E3)** | **For the doctor only. Possibilities to evaluate, not a diagnosis.** Sub-line: Each item rests on the records cited under it. |
| Possible matches, consent switch (F1) | **Find people with a pattern like yours.** Off until you turn it on. If you turn it on, the pattern in your record (markers, symptoms, conditions) is compared with people anywhere in the world who also said yes. Your name and ID are never used or shown. If there is a match, your doctor can ask to talk to their doctor. You can turn this off at any time, and from then on you are no longer matched. |
| Matches, doctor side (F2) | {n} possible matches: unnamed patients with a similar pattern. |

### 13.5 Words we never use

| Never | Why | Use instead |
|---|---|---|
| "diagnosis", "diagnose", "what's wrong with you", "your condition might be" (patient side) | N1, C2: "we dont want them to be their doctor" | "for your doctor", "only a doctor can tell you what your results mean" |
| "AI doctor", "symptom checker", "health assistant" for the patient | Implies diagnosis to patients | "your record", "your diary" |
| "sell", "monetise" or "share" data with third parties; "data marketplace" | Founder's privacy rule; flag 4 | "opt-in possible matches"; research is "later, consent-gated, never a data sale" |
| "on the blockchain", "stored on-chain" for health data | Flag 1, P4 | "a signed log of fingerprints and access grants" |
| "unhackable", "100% secure", "fully anonymous", "HIPAA/GDPR certified" | Unprovable; no certification exists for those | "encrypted", "the key is on your phone", "your name and ID are never used" |
| "CE-marked", "FDA-cleared", "clinically validated", "medical-grade" | Not true today (section 8) | "certified before it ships" (for E3 only) |
| "cure", "finds the cause" | Overpromises the matches feature | "compare notes on cause and treatment" |
| "insurance-ready", any insurer use case | N3 | "insurers never see it" |
| "the only", "the first", "replaces your doctor's system" | Not proven (research §2.4); N7 | "where we differ"; "works next to your doctor's system" |
| "verified" on a patient upload | B2: a photo proves nothing | "Uploaded by patient" |

### 13.6 Name (Q14: Marketing's proposal; the founder decides)

1. **Anamna**: from *anamnesis*, the doctor's word for the patient's history, and Greek for "remembering". **Marketing's pick.** Risk: misheard as "amnesia"; test with five people tomorrow, fall back to Histra if two mishear it.
2. **Strand**: the DNA strand and the thread of a life's history. Risk: Strand Life Sciences already uses it in genomics.
3. **Histra**: coined from *history* + *strand*; likelier free as a domain and trademark.

Domains and trademarks are not checked. Until the founder picks, the deck uses `[Name]`.

### 13.7 Launch story after the hackathon (proposal; nothing is published without the founder's written go on the issue)

| When | What | Owner |
|---|---|---|
| Sun 15 Nov, after judging | One recap post on the founder's LinkedIn, English only, no hashtags, no emoji, with a Pix image from the deck template: the problem, the demo, the three rules, the ask for doctors. Drafted by Marketing, posted by the founder by hand | Marketing drafts, Pix image, founder posts |
| Week 1 | Ten 20-minute interviews: five doctors (orthopaedics, rheumatology, international patients), five patients with a folder. The questions test pillars 1 to 3 and the "Anamna" name | Marketing with Sales |
| Week 1 | A one-page site with a doctor waitlist ("Try the doctor view"); no patient sign-up until real data is legal (N4) | Marketing copy, Pix design, SEO Search comment, founder approves |
| Weeks 2 to 4 | Pilot conversations in the order of the deck's slide 11 (innovation gateway → medical-tourism hospital → rare-disease group) | Sales |
| Week 4 | Positioning reviewed against the interviews: keep, change or drop each pillar; seat price hypothesis checked | Marketing, CEO |

The story we tell at every step is the same: Maria's folder, the doctor's question, the answer with its source, and the three rules.

### 13.8 Deck

Content: [`deck/deck-content.md`](deck/deck-content.md): 13 slides, from Maria's folder to the regulatory path (the closing content slide) and the ask; a 3-minute and a 30-second script; the name proposals. Marketing's open points on the deck are Q23 to Q27.

---

## 14. Market and buyers (Sales)

**Owner: Spast Arxidas (Sales), MIN-4424.**

*Empty. To be written by Sales as a short summary, with the detail in the two research files.*

- Market data and competitor teardown: [`research/market-and-competitors.md`](research/market-and-competitors.md)
- Possible buyers (hospitals, clinics, governments): [`research/buyers.md`](research/buyers.md)

To cover here: the size of the problem in numbers, with sources; the three or four closest competitors and where this idea differs; the buyer types in order, who decides and who pays; the regulatory facts of section 8, verified (Q18).

---

## 15. C-level review (CEO, CTO)

**Owners: the CEO seat, MIN-4425, and the CTO, MIN-4426.** Full reviews go in `docs/reviews/`; the summary and the accepted changes go here.

> * Talk and brainstorm at C level based on the PRD make comments changes and approve ALL together the PRD. We will continue to designs and development tomorrow

### CEO review

**CEO seat, 13 Nov 2026, MIN-4425. Verdict: BUILD TOMORROW, WITH CONDITIONS.** Full review: [`reviews/ceo-review.md`](reviews/ceo-review.md) (pre-mortem, alternatives, the bet with gates, win plan, 20 numbered comments, deck story). Everything below is a recommendation until the founder signs.

1. **The weekend is a good, bounded bet, and the PRD is strong enough to build from.** The product after the weekend is not yet a bet: park by default and continue only through three gates (G0 15 Nov, G1 30 Nov, G2 15 Jan 2027). Next to the logged priorities (two travel products, a solo founder, the year-end Founding Operators target he kept) it is a deliberate detour, named as one.
2. **New facts from the event site (part of Q9):** judged on "usefulness, craft, and aura points"; the build starts Sat 12:00 and work finished beforehand "will not fare well", so no code or repo before noon; finalists Sun about 20:00; finalists pitch on **Mon 16 Nov at SNFCC**. The track's own criteria, demo length and submission time are not published: ask at kickoff.
3. **Must: the PRD follows the founder's test-data decision** (N4, section 4, section 8, M2, 10.11, 12.8, Q32 still say "synthetic only"). How: the CTO's two projects. His exams never appear on a public screen or recording and never in an agent's session (comments 1, 2).
4. **Must: A1 reads what his exams are:** Greek first, PDFs, a few pages; images are stored and never read by the AI (comment 3). Section 18 gets the event's rules and Monday (comment 4).
5. **Must: split the insurer rule.** N3a, data, in the founder's words and absolute. N3b, who may pay us, a proposal with five open edges for him (public payers, hybrid bodies, employers, a pharma line, insurer-owned hospitals); a recommendation for each is in the review (comment 5).
6. **Must: claims.** Q30 accepted: say only what runs. For the demo the first rule reads "you decide who sees it, and for how long", not "you hold the key". The regulatory slide says "outside the device rules as we read them, to be confirmed", keeps summaries and the cross-specialty view with the assistant, and adds one line each for the US and the UK (comments 6, 7).
7. **Deck story (the CEO seat's part):** demo story v2, five beats, all on the synthetic patient, with the founder's exams in the role-play only; the regulatory path is the last content slide, told as the roadmap, with the ask as its last line (Q26); no dollar TAM on Sunday (Q24); first payer, the international-patient department of a hospital, as a hypothesis (Q17).
8. **For this jury:** keep a small seeded "possible matches" beat; one swap asked of the CTO's cut order (comment 9). The strongest proof is off screen: the founder's folder, a doctor's words after the role-play, and measured accuracy on real exams (new gate metrics, comment 13).
9. **"Possible matches" ethics:** "without name or ID", never "anonymous"; fresh consent from both patients at contact; match events in the patient's log; care and research under separate consents (comment 11).
10. **Founder decides (6, each with a recommendation, review section 8):** the gates after the weekend; his exams and public screens (same as the CTO's question 3); the insurer rule's five edges; the AI path for his exams (the CTO's questions 1 and 2, supported); team and ask (Q27); four small confirmations (Q15, Q7, Q28, Q14).

### CTO review

**CTO, 13 Nov 2026, MIN-4426. Verdict: GO WITH CHANGES.** Full review: [`reviews/cto-review.md`](reviews/cto-review.md).

1. **The solution is sound.** Keep it: the React/Vite PWA on Cloudflare Pages, Supabase with RLS as the access authority, Gemini with forced schemas and server-side verification, and the signed hash-chain log with no blockchain (Q2 confirmed).
2. **Real data changes the privacy design.** It now runs on two Supabase projects in the EU: `dev`, synthetic, where agents work freely, and `demo`, the founder's exams, where agents deploy but never read content. Sign-up is off, and there is no demo-login on his account. The SYNTHETIC-marker guard is dropped, and judges do not upload (Q32).
3. **AI endpoint (decided): Gemini on Vertex AI, EU regional endpoint, on the credit's paid billing.** Caching is off. Requests are inline only (no Files API, no context cache, no batch, no request logging). The assistant's context carries no name or ID, and radiology images never reach the model. Fallbacks: a paid Gemini API key, then a €30 cap on the founder's own billing, then synthetic only.
4. **The wipe** deletes the whole `demo` project, revokes the keys and cleans the devices. Release builds it and runs a dry run before any real upload; the CTO verifies with counts and HTTP codes. `demo-reset` never touches the founder's account.
5. **A real-data gate at H6–H8:** endpoint checks, the RLS matrix on `demo`, the wipe dry run, and presentation mode. No real exam goes in before it passes.
6. **Contract settled in 14 lines** (review, section 3): not streamed, one JSON of verified blocks with Cron's kind names; full cite ids; a deterministic overview (E1 needs no model); `doc-create` then a synchronous extraction, with PDF and multi-page input; the QR token in the fragment; codes of 120 s with no auto-refresh; reset by epoch.
7. **Real Greek documents:** comma decimals, dd/mm dates and PDFs are handled. The "cut to English" fallback is removed. M2 on real data = fields the founder edited ÷ fields extracted.
8. **Fit:** Backend P0 is about 13.4 h and Frontend P0 about 16.75 h. P0 fits with Ren on the critical path; P1 screens are best effort. Cut now: the helix animation goes to P1, F3 becomes a single button, and every stretch goes. Checkpoints at H8 (joint check), H12 (walking skeleton) and H18 (freeze). The final cut order is in review section 4; E3 is the last cut, and the never-cut list is unchanged.
9. **Privacy claims for the deck:** an allowed, product-only and forbidden list is in review section 6. "Key on your phone" is product only. "Nobody can read it", "end-to-end" and "zero retention" are forbidden.
10. **Founder decides (3):** accept Google's abuse-monitoring retention for his exams (CTO: yes); a €30 spend cap if the credits don't fit (CTO: yes); his exams on stage, or synthetic Maria on stage with his exams in the role-play only (CTO: Maria).

### Changes accepted after review

| # | Change | Asked by | Section changed | Date |
|---|---|---|---|---|
| | | | | |

---

## 16. Sign-off

Each signature means: "my part is complete, and nothing in the others' parts blocks me." No build story starts before every row is signed, the founder's last.

| Role | Who | Part | Signed (date, link to the comment) |
|---|---|---|---|
| Product | Back Logakis | Sections 1 to 9, 17, 18 | |
| Sales | Spast Arxidas | Section 14, `research/` | |
| Marketing | Anna Lytica | Section 13, deck content | Section 13 and deck content v1 signed 13 Nov 2026 (MIN-4429). Nothing in the others' parts blocks me; Q23 to Q28 shape the final deck, not the build |
| Design | Pix Elidis | Section 11, deck design | Section 11 signed 13 Nov 2026 (MIN-4428). Deck design: not yet, later round |
| Backend | Cron Jobbidis | Section 10 | **Signed with conditions**, 13 Nov 2026, [MIN-4427](https://linear.app/minhos/issue/MIN-4427). Conditions: (1) the CTO's review of section 10 comes before this counts as final; (2) the cut order of 10.15 and the hour-8 joint check are accepted (Backend P0 about 12 h, P0 plus P1 about 15 h, against an 18-hour window); (3) Product's list of what each synthetic exam must contain is on MIN-4422 by hour 0 (Q12); (4) the deck and section 13 do not say "key on the patient's device" for the demo or "nobody can read it" for the product (Q30); (5) credit amounts and Gemini terms are confirmed at kickoff (Q13, Q31) |
| Frontend | Ren Derakis | Section 12 | **Signed with conditions**, 13 Nov 2026 (MIN-4430). My part is complete. Conditions: (1) Backend's section 10 matches the assumptions of 12.12 (streamed block protocol, realtime plus polling, handshake and reset endpoints, HTTPS host), or Backend and I agree the difference before the build; (2) Design drops land near the times of 11.8, and Marketing's wording by about H1:30; (3) the founder and the CTO accept that P0 alone fills about 18 of the 20 hours, so P1 is best effort, in the cut order of 12.11. |
| CTO | CTO | Section 15, review of section 10 | **Signed with conditions**, 13 Nov 2026 ([MIN-4426](https://linear.app/minhos/issue/MIN-4426), [`reviews/cto-review.md`](reviews/cto-review.md)). Conditions: (1) Back applies the 5 must-change items (review section 8) in PRD v2 before H0; (2) no real exam is uploaded before the real-data gate passes (review section 2.9); (3) the founder answers the 3 questions in review section 9, and the stated defaults apply if he does not. Development may start at H0 on synthetic data |
| CEO | CEO seat | Section 15, deck story | **Signed with conditions**, 13 Nov 2026 ([MIN-4425](https://linear.app/minhos/issue/MIN-4425), [`reviews/ceo-review.md`](reviews/ceo-review.md)). My part is complete, and nothing in the others' parts blocks design starting tomorrow. Conditions, each before the first build story or before the claim is made: (1) the PRD follows the founder's test-data decision and the CTO's handling rules hold before any real exam is uploaded; (2) agents work on synthetic data only, images are never read by the AI, and the hours are re-fitted as in the CTO's review; (3) no code before Sat 12:00, and section 18 carries Monday; (4) copy claims only what runs, the regulatory slide uses the scoped wording, and Sales verifies its facts (Q18); (5) the insurer rule is split and no slide says more than "insurers never see it" until the founder answers the five questions; (6) the Product and Sales rows are signed and section 14 is written. |
| E2E | E2E | Not a gate before the build (team rule, 2 Nov 2026). The demo run check is Q19. | n/a |
| SEO | SEO | n/a: no public surface | n/a |
| **Founder** | **Lefteris** | **The whole PRD, and every *proposal* in it** | |

---

## 17. Open questions

"Blocks" says what cannot start before the answer.

| # | Question | Owner | Blocks |
|---|---|---|---|
| Q1 | **Where does the AI run, and what can the model provider see?** P2 puts the key on the patient's device, but a model must read the photo and the history. Synthetic data makes the demo safe. What is the product's answer (provider terms with no retention and EU processing, a model we host, or on-device)?<br>**Backend:** Launch with a stateless gateway in the patient's region that calls a zero-retention hosted model, with identity stripped and nothing stored in plaintext. Offer confidential-compute hosting as the second tier, and on-device extraction as the third when quality allows. So P2 must be reworded: "we cannot read it at rest", not "nobody can read it". Options and trade-offs: section 10.B.2.<br>**CTO:** Agreed with Backend: the launch tier is the regional zero-retention gateway with identity stripped, and zero-retention contracts with every model provider are a launch prerequisite. Confidential compute is tier 2. The demo uses Gemini on Vertex AI in an EU region (`reviews/cto-review.md` 2.3). | Backend; CTO reviews | Section 10. Not the demo build |
| Q2 | **A chain or a signed log for the demo?** Flag 1 allows both. A signed, hash-chained log is quicker to build and shows the same principle. Does the track reward a real chain?<br>**Backend:** A hash-chained log in Postgres with signed checkpoints, no blockchain, for the demo and as the product's base. It shows the same principle, takes about half the time, and avoids the privacy cost of a public chain (a hash can still be personal data). If we ever anchor publicly, only a Merkle root goes out. Sections 10.8 and 10.B.7.<br>**CTO:** Confirmed: a signed, hash-chained log in Postgres for the demo and the product. No public-chain anchor at the event (stretch cut). | CTO | The build of D3 and P3 |
| Q3 | **Identity match: which ID, and how is the account holder's own identity proven?** In the demo the profile is typed in. In the product, which number is used in Greece, how is the profile proven once, and what about exams with no ID printed, changed surnames and dependants?<br>**Backend:** Demo: the rule of B1 as written, done in code and never by the model (ID exact, name by tokens with Greek/Latin transliteration), section 10.5. Product: prove the account holder once through the regional route (national eID or EU wallet, NHS login, a US identity-proofing provider, ABHA, UAE Pass or Nafath; to verify), keep an alias list for changed surnames, use date of birth as a second factor when no ID is printed, and treat dependants as a guardian relationship with its own legal basis. The match stops a careless claim, not a forger (10.5). Which ID Greek labs print: Sales. | Product (the rule), Backend (the matching), Sales (what Greek labs print) | Product scope. The demo uses the rule in B1 |
| Q4 | **"Verified by source" in the demo:** one seeded record with a simulated lab signature, or a working check of a QR printed on a synthetic lab document? And can anyone at the Athens LifeTech Park (a lab, a hospital) give us a real source to verify against?<br>**Backend:** Build the check for real and keep the issuer simulated: a "Demo Lab" signs the seeded record with ES256 and `verify-source` verifies it, so a tampered value loses the mark (about 45 min). Scanning a QR on the printed synthetic lab paper is a stretch (about 1.5 h). No real source is promised; ask at the Park but do not depend on it. Section 10.5.<br>**CTO:** Agreed: a real verifier with a simulated issuer (45 min). The QR-signed lab paper stretch is cut for the event. | Backend, CTO; Sales for the Park | The build of B2 |
| Q5 | **How does the handshake know the person scanning is a doctor?** Demo: a seeded doctor account. Product: which registry, and who checks?<br>**Backend:** Demo: seeded doctor accounts, role read from the database. Product: a registry check per region (for example public registers such as the US NPI registry, the UK GMC register, India's NMC register; the Greek body is Sales'; to verify) plus an institution vouching, then a device-bound credential signed by our directory that also carries the organisation type. That same credential is how a payer-affiliated account is kept out (10.B.6). | Backend; Sales names the registry | Product scope |
| Q6 | **Possible matches with the key on the device:** what leaves the device, in what form, and how many patients must share a pattern before a match is shown, so that a rare condition does not identify a person?<br>**Backend:** Only a coarse coded vector (codes and high/normal/low bins, age band, country, quarter) leaves the device, only after opt-in, through the gateway with a rotating random id. Per-region index with k of 5 to 10 for any count shown; federated queries across regions; a per-doctor query budget. Rare patterns: a "blind introduction" proposal in Q34. Demo: seeded set, with the k=5 suppression actually enforced and tested. Section 10.B.5. | Backend, CTO | Product scope. The demo uses a seeded set |
| Q7 | **Access time:** "time-limited" is a proposal. Is 15 minutes right for the demo, and which durations does the patient choose from in the product?<br>**Backend:** 15 minutes is fine technically: it is a server constant in the demo, and expiry is enforced inside the database policy, so it needs no clock job. Product choices (this visit, 24 hours, 7 days, a maximum of 30 days, renewal only by a new approval) are just a different value in the grant row. Section 10.7. | Product proposes; the founder confirms at sign-off | The build of D2 uses 15 minutes unless he says otherwise |
| Q8 | **What may the doctor keep after access ends?** His own notes, the assistant's answers, copies of exams? A doctor has duties to keep records of his own.<br>**Backend:** Technical recommendation: the doctor's own notes live in the doctor's own system. A doctor-authored visit summary enters the patient's record only if the patient agrees. Assistant answers are not kept after the grant ends (the demo keeps them only until the demo is reset). A screen the doctor already saw cannot be taken back. The legal duty to keep records is for the founder and counsel. | Product, with the CEO; legal fact for the founder | Product scope |
| Q9 | **Judging criteria, demo length and submission time** for the Biotech & AI track. Does hardware earn extra points in this track too, or only in the Open Track? | CEO | The demo story and the deck length |
| Q10 | **The DNA-shaped QR:** a standard QR with a helix around it, or a code whose own pattern is drawn as a helix and still scans reliably under event lighting?<br>**Design:** a standard QR, modules never altered, framed by a double helix that animates before and after the scan but never over the code (section 11.3). A code drawn as a helix is not promised to scan under event lighting. A plain no-helix toggle is the fallback. Frontend and Design run a 3-phone scan test tomorrow, 30 min.<br>**Frontend:** agreed. I generate a standard QR (`qrcode`, SVG, level Q, 4-module quiet zone, modules untouched) and animate a separate SVG helix in the side gutters, never over the card. Scan test with Design at about H5, animation running and with `?plain=1` (12.3). | Design, Frontend | The build of D1 |
| Q11 | **The shape of the app:** one web app with a patient view and a doctor view, or two? Is the doctor on a phone or a laptop on stage?<br>**Design:** not dependent on the answer. The doctor workspace is drawn for a laptop (1280 wide) and works down to 768; the Scan screen works with a laptop webcam or a phone camera. Recommendation: doctor on the projected laptop so the audience sees the workspace; scan with that webcam if it holds in event light, else with a second phone that opens the session on the laptop. Both tested in the scan test.<br>**Frontend:** one Vite + React web app, two role-gated route trees (`/patient`, `/doctor`), installed as a PWA; not native for the demo (12.1). Doctor on the projected laptop; scan with its webcam, and a second phone as scanner if the webcam fails; the typed code is the third way. Native shell is a scope B question for the CTO (F-Q4).<br>**Backend:** No backend constraint. One app with two roles is fine, and the typed contract of 10.13 serves any shape. Reads go straight to the database under RLS.<br>**CTO:** Agreed: one app with two role trees. The doctor uses the projected laptop and scans with the webcam; a second phone is the backup and the typed code the third way in. Production URL points to the `demo` project, previews to `dev`. | Frontend, Backend | The build |
| Q12 | **The synthetic data set:** who makes the 10 exams (printed, in Greek and English, 3 types, 2 synthetic people) and the seeded history for the demo patient, and by when?<br>**Backend:** I generate the 10 exams from one ground-truth JSON file and a template at hours 3 to 4 (section 10.11); M2 is then checked automatically against the same file. I need Product's list of what each exam must contain by hour 0. Three exams are printed on paper for the live step. The CTO confirms.<br>**CTO:** Decided. Cron generates the synthetic set (development, tests, the stage persona Maria and the "other person"). The founder's real exams are the role-play set. Only he uploads them, only on the `demo` project, and only after the real-data gate (review 2.9). They never become fixtures. | CTO decides; Product writes the list of what each exam must contain | The build of A1 and metric M2 |
| Q13 | **Credits:** which credit is used for what, the amounts at kickoff, and what boxd and treg offer.<br>**Backend:** Gemini is the only credit on the critical path. Oumi (answer checking and an M2 scorer) and Firecrawl (reference pages at build time) are optional. boxd: I do not know what it offers; if it is sandboxed compute it runs the measurement and rehearsal copies. fal and treg are not Backend's. Table in section 10.12.<br>**CTO:** Gemini on Vertex AI (EU) is the only credit on the critical path and the only service that ever touches his real exams. fal, boxd, Firecrawl, Oumi, treg and Wonderful never do. Firecrawl and Oumi are cut at the event (review section 7). | Backend | Section 10 |
| Q14 | **A name.** The working name is "healthapp".<br>**Marketing:** Anamna (pick), Strand, Histra; rationale in section 13.6. Domains not checked. | Marketing and the CEO propose; the founder decides | The deck cover |
| Q15 | **Model training is parked (N5).** The founder wrote "needs discussion" and answered flag 4 with "possible matches". Confirm that training other models on patient data is out of both scopes for now. | Founder, through the CEO | Nothing tonight |
| Q16 | **"Other LLMs that specialised to research and medical data":** which ones, and is any of it in the demo? Proposal: Gemini only in the demo, with public reference pages as a stretch.<br>**Backend:** Gemini only in the demo, plus public reference pages fetched with Firecrawl at build time as a stretch (10.9). Product: specialised models are consulted only through the gateway, with minimum pseudonymised context, from a per-region allow-list under agreement (10.B.2).<br>**CTO:** Gemini only at the event. The Firecrawl reference pages are cut. | Backend; CTO reviews | Section 10 |
| Q17 | **Who pays?** Insurers are excluded (N3). Is the patient side free, and is the buyer the clinic, the hospital or the state? | Sales, CEO | The deck's business slide |
| Q18 | **Verify the regulatory facts of section 8 against their sources** (MDR Rule 11 and the class; where retrieval ends and decision support begins; EHDS dates; the AI Act) and add rough cost and time for certification. | Sales verifies; the CEO owns the slide | The deck's closing slide |
| Q19 | **The demo run check:** who runs the 8 steps three times before judging and records the result (M1)? Proposal: E2E writes the checklist tomorrow, the CTO decides.<br>**CTO:** E2E writes the 8-step checklist on synthetic data. Ren and Cron run it three times with the founder between H18 and H20. The CTO logs M1 pass or fail on MIN-4422. | CTO | Nothing tonight |
| Q20 | **Emergency access** when the patient cannot approve (unconscious). Out of the demo. Does the product need it at launch? | Product; parked | Nothing tonight |
| Q21 | **A typed one-time code beside the DNA-QR** for a camera that will not focus or a patient who cannot hold a phone steady (accessibility and a stage fallback). Adds a small screen state and a code field. In scope for the demo?<br>**Frontend:** yes, in the demo. About 1 hour across both sides: an 8-character code Backend issues with the token, resolved by the same claim endpoint (12.3). | Product decides; Frontend sizes it. Design proposes yes (section 11.3) | Drop 2 of design |
| Q22 | **Wording needed from Marketing for the design frames:** refusal screens (not your exam, could not read), out-of-range note, "possible causes" heading, the emergency line, consent text for matches. Frames carry marked placeholders until then <br>**Marketing:** answered, section 13.4.<br>**Frontend:** all strings live in a catalogue, so wording arriving late is a JSON edit. I need it by about H1:30; until then marked placeholders (12.7). | Marketing | Design drops 1 and 4 (section 11.8) |
| Q23 | **Deck slide 6 (privacy):** which privacy claims run for real in the demo (key on the device, signed log) and which are simulated? The slide claims only what runs. | Backend (section 10), CTO | The final deck |
| Q24 | **Deck slide 8 (market):** keep the TAM/SAM/SOM dollar figures with their assumption labels, or show only the verified US doctor count and the formula? Sales lists our own TAM/SAM/SOM under "do not put on a slide" until price and share are validated. | CEO, with Sales | The final deck |
| Q25 | **Deck slide 11:** Sheba ARC was reportedly being sold to Redesign Health (buyers.md, target 35). Confirm before the slide names it. | Sales | The final deck |
| Q26 | **Deck order:** end on the regulatory slide (MIN-4429's acceptance criterion) or on team and ask after it (coordinator's brief)? Both versions are written in `deck/deck-content.md`. | CEO | The final deck |
| Q27 | **Deck slide 13:** the team line and the funding ask (amount and use, or none). Nothing is invented in the draft. | Founder, through the CEO | The final deck |
| Q28 | **The hackathon recap post (section 13.7):** posted from the founder's personal LinkedIn alone, or also as an onedotatatime.design / minhOS / TravelHood post? The house rule pairs TravelHood and minhOS on event posts; this product is neither. | CEO; founder confirms | The recap post only |
| Q29 | **Key recovery.** If a patient loses every device, who can restore the record? Options: a printed recovery code (lose it, lose the record), Shamir shares held by people the patient trusts, a copy held by a doctor the patient chooses. "We cannot read it" means "we cannot restore it". Backend recommends the printed code plus a second device, with Shamir as an upgrade (section 10.B.1).<br>**CTO:** Not for the event. CTO recommends a printed recovery code plus a second device by default, with Shamir as an opt-in. The founder decides after the event. | Founder decides (privacy against recoverability), through the CEO; Backend prepares | Product scope |
| Q30 | **Wording of the privacy claim.** The demo simulates P2, and a product with a hosted model cannot promise "nobody can read it". The deck and section 13 should say "we cannot read it at rest", and "simulated in the prototype" where that is true (sections 10.2 and 10.B.2). Does the CEO accept this as a rule for all copy?<br>**CTO:** Yes, as a rule for all copy. The allowed, product-only and forbidden claims are in `reviews/cto-review.md` section 6. | Marketing and the CEO; Backend supplies the accurate statements | The deck's privacy slide, section 13 |
| Q31 | **Gemini terms at the event.** Is the credit a paid account with no training on our data? Check at kickoff. It changes nothing for synthetic data and everything for real data.<br>**CTO:** Decided: Vertex AI Gemini, EU regional endpoint, on the credit's paid billing account, data caching off, inline requests only (no Files API, context cache, batch or request logging). Checked at kickoff, before any real exam. Fallbacks: a paid Gemini API key, then the founder's own billing (€30 cap, founder decides), then synthetic only. | Backend | Nothing tonight |
| Q32 | **Judges' own documents.** With the SYNTHETIC-marker guard (section 10.11) a real exam is refused and deleted. Keep the guard (Backend recommends it, it enforces N4) or allow free upload?<br>**CTO:** No judge uploads: it would be another person's real health data, and the model would read it before B1 refused it. Sign-up is closed; judges try Maria with the printed synthetic exams. The SYNTHETIC-marker guard is dropped, because it would also refuse the founder's own exams. | Product, CEO | The 15-minute guard in the build |
| Q33 | **Launch regions and order for the product.** Backend proposes EU first, then US (FHIR, TEFCA), then UK; Gulf and India only on a named buyer. Each region is a full stack plus a legal review (section 10.B.3).<br>**CTO:** Agreed: EU first, then the US through FHIR and TEFCA, then the UK. The Gulf and India only for a named buyer. The deck says "EU-hosted pilot first". | CEO, Sales; Backend proposes | The product roadmap slide |
| Q34 | **Rare conditions against k-anonymity.** A count below k is hidden, which hides exactly the rare cases the founder wants to help. Allow a "blind introduction": no count shown, the doctor learns only the overlap with his own patient, both patients consent again at that moment (section 10.B.5)?<br>**CTO:** Blind introduction accepted in principle, on these conditions: both patients consent again at that moment; only the overlap with the doctor's own patient is shown; no count below k is ever shown; a per-doctor query budget; every query logged; counsel signs off. The demo is unchanged (k=5 enforced). | CTO and counsel; Backend proposes; Product for the consent wording | Product scope; the matches slide |

---

## 18. Timeline

| When | What | Who |
|---|---|---|
| **Fri 13 Nov, tonight** | PRD v1 (this file). Research and buyers in parallel. | Product; Sales |
| Tonight | Sections 10 to 14 written. Questions on MIN-4422. | Backend, Design, Frontend, Marketing, Sales |
| Tonight | CTO review, CEO review. Changes accepted into the PRD. | CTO, CEO, Product |
| Tonight | Sign-off by every role, then the founder. Deck content, then deck design. | All |
| **Sat 14 Nov, at the event** | Kickoff: credit amounts, judging criteria (Q9, Q13). Product creates the build stories from the signed PRD, each with its lane. Design and development start. | Product; Design, Frontend, Backend |
| Sat 14 – Sun 15 Nov | Build in the order of section 5. Freeze 2 hours before submission. Three clean runs. | Frontend, Backend; CTO |
| **Sun 15 Nov** | Demo and pitch. | Founder |

**Dependencies.** The build needs the signed PRD and section 10. The deck needs Sales' numbers and section 8 verified. The demo needs the synthetic data set (Q12) before the first extraction test.

---

## 19. Change log

| Version | Date | Who | What |
|---|---|---|---|
| v1 | 13 Nov 2026 | Back Logakis | First version: sections 1 to 9 and 17 to 18 written; sections 10 to 15 empty with owners; sign-off table open |
| v1.1 | 13 Nov 2026 | Pix Elidis | Section 11 (Design) written: IA, demo screens, DNA-QR, trust, visual direction, accessibility, plan for tomorrow. Design answers added to Q10, Q11; Q21, Q22 added; Design row of section 16 signed for section 11 |
| v1.2 | 13 Nov 2026 | Anna Lytica | Section 13 (Marketing) written: positioning, ICP per segment, messaging pillars, on-screen wording (answers Q22), never-use words, name proposal (Q14), launch story; deck content in `deck/deck-content.md`; Q23 to Q28 added; Marketing row of section 16 signed |
| v1.3 | 13 Nov 2026 | Ren Derakis | Section 12 (Frontend) written: stack, camera capture, DNA-QR and scan, realtime handshake, assistant UI, client-side no-diagnosis rules, accessibility and i18n, stage setup, hour-by-hour plan and cut order. Frontend answers added to Q10, Q11, Q21, Q22; Frontend questions F-Q1 to F-Q6 listed in 12.12 for Product to move into section 17; Frontend row of section 16 signed with conditions |
| v1.4 | 13 Nov 2026 | Cron Jobbidis | Section 10 (Backend) written: demo architecture (part A) and global product (part B). Backend answers added to Q1 to Q8, Q11 to Q13, Q16; Q29 to Q34 added; Backend row of section 16 signed with conditions |
| v1.5 | 13 Nov 2026 | CTO (MIN-4426) | CTO review written: `reviews/cto-review.md`. Section 15 CTO summary (GO WITH CHANGES); CTO row of section 16 signed with conditions; CTO answers added to Q1, Q2, Q4, Q11 to Q13, Q16, Q19, Q29 to Q34 and to F-Q1, F-Q2, F-Q4, F-Q6 in 12.12. Required changes for PRD v2 are listed in review section 8 for Back to apply |
| v1.6 | 13 Nov 2026 | CEO seat (MIN-4425) | CEO review written: `reviews/ceo-review.md`. Section 15 CEO summary; CEO row of section 16 signed with conditions. The review answers Q9 in part (event rules and dates), Q17, Q24 and Q26 within the deck story, and gives the CEO seat's position on Q30, Q32 and Q33; its numbered comments and its six questions for the founder are for Product to apply in PRD v2. No other section edited |
