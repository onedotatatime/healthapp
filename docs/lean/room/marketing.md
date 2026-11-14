# Marketing · views on all six workshops

**Seat:** Anna Lytica (Marketing) · **Date:** 2026-11-14 · **Issue:** [MIN-4437](https://linear.app/minhos/issue/MIN-4437) (parent MIN-4435)

**Status: recommended, not decided.** This is one seat's view. Pix compares the seats and the founder decides through the Q issue. Whether the health app continues after the hackathon is not decided either (CEO review §3: park by default; gates G0 15 Nov, G1 30 Nov, G2 15 Jan). Nothing here commits to a build. Nothing was sent, published or shown to anyone.

Start date: the issue said seat runs wait until 15 Nov. The founder overruled that on 14 Nov: "Just do the exercise now to have the outcome".

## Read this first

- **Written alone.** I did not read the other seats' papers.
- **Sources.** Only the seven input files in `docs/`. No new research. I did not read the founder's exams or the `demo` project. "Maria" is the synthetic patient from the PRD and the deck.
- **Nobody has been interviewed.** PRD §1: "sample size: 0". The only first-hand voice in the inputs is the founder's, in the brief. Every other line "in the person's own words" is the wording I expect, marked *expected*. It is a guess until real people replace it.
- **Tags.** [brief] the founder's words · [verified] and [secondary] as Sales' research marks them · [hypothesis] my own inference.
- **Three rules I keep.**
  1. The founder's insurer rule is a data rule, and it is absolute: "These data should not be accessible to insurance companies as proofs. they should be totally disclosed between the patient and the doctor." I do not extend it and I do not narrow it. The five commercial edges (public payers, hybrid bodies, employers, a pharma line, insurer-owned hospitals) stay open questions for him (CEO review §5, comment 5).
  2. Copy claims only what runs (CEO review comment 6; CTO review §6). Every example line below says whether it runs in the demo, is product-only, or is not built.
  3. The patient side never diagnoses (brief; PRD N1).
- **Skills used:** marketing-strategy-pmm, synthesize-research, competitor-alternatives, copywriting.

## My six positions in one table

| # | Workshop | My position | Confidence |
|---|---|---|---|
| 1 | Personas | The story persona and the market persona are different people. Three patient cards, ranked by who asks them for the folder. Add the coordinator. No card for an insurer. | Low |
| 2 | Empathy maps | The patient wants to be known without performing her history. The doctor wants the page behind any answer. The patient gets no explanation back, so someone has to ask her to do the work. | Low |
| 3 | Competitor analysis | The competitor in the person's head is a folder, a photo sent to a chatbot, and an inbox. We cannot own "understand your results" or "all your records in one place". The open ground is the doctor's side of the first visit. | Medium |
| 4 | Value proposition | Lead with the moment, then the source, then control, then the two refusals. Privacy is why people trust us, not why they come. One line in my own deck promises what does not run. | Medium on the order, low on whether it lands |
| 5 | Business Model Canvas | People reach us through whoever asks for the folder. The three refusals are the brand and they remove three usual revenue sources, so providers must pay. The five insurer edges stay off the canvas. | Low |
| 6 | Market fit scorecard | Before fit. 11 of 30 on my scale, and 3 of 15 on the rows that measure people. | High on the stage, low on each score |

---

## 1. Personas

**Position.**

These are proto-personas. They are built from the founder's story and outside statistics, not from interviews.

**1. One job, three patient cards.** The job is the same for all three: *get a new doctor up to speed without being the courier and the memory.* One question ranks them: **who asks this person for the folder, and by when?** My reading of the inputs is that a patient digitises when someone she trusts asks for it, not because an app exists.

| Card | Who, by behaviour | The moment | Who asks for the folder | What stands in the way today |
|---|---|---|---|---|
| **P1 · Maria, the courier** (synthetic) | An adult who sees two or more specialists and carries her own exams between them | The evening before a first visit to a new specialist | Nobody | No trigger and no payer. The product serves her as built |
| **P2 · The travelling patient** | An adult going abroad for treatment, with records from home, often in another language | The hospital's request for records before the trip | The hospital's international-patient office | The record opens only in person (PRD P6, D1). Sending it ahead and translating it are not built |
| **P3 · The family archivist** | A parent or an adult child who keeps the folder for someone else: a child with a rare disease, an elderly parent | Every new specialist, for years | Herself; a patient group | The app refuses an exam that is not the account holder's (PRD B1). Dependants are scope B |

**2. The story persona and the market persona are different people.** Maria is right for the stage, because everyone recognises the folder. She is the weakest first market: nobody asks her and nobody pays for her. I would keep her as the hero of the story and stop treating her as the ideal customer. This corrects my own table in PRD §13.2, which put her first.

**3. The first market persona to test is P2, on one condition.** She is the only card with an asker, a deadline and a possible payer. But the hospital wants the history *before* the trip, and the product opens it only face to face. If the founder keeps "in person" absolute, the honest first persona is **"Maria, invited by a clinic"**: P1 with an asker, a multi-specialty clinic that tells new patients to bring their history digitised. The product serves that case as built.

**4. P3 is the most motivated card, and the product refuses her.** Until dependants exist I would write no message for rare-disease families. It would invite them in and turn them away at the first upload.

**5. Add a card the PRD does not have: the coordinator.**

| Card | Who | What they want | Part in a purchase |
|---|---|---|---|
| **D1 · The first-visit specialist** | Orthopaedics, rheumatology, internal medicine. Meets a new patient who has an outside history | To know what is missing, and to see the page behind any answer | User. Decides whether it is worth opening |
| **D2 · The coordinator** (new) | A non-clinical person in an international-patient office who collects records before arrival | A complete, readable file without chasing | Daily user on the hospital side, and the internal champion [hypothesis] |
| **B1 · The head of international patients** | Runs the department. A public role named in `buyers.md` | More accepted cases, fewer bad arrivals [hypothesis] | Economic buyer. Around her: the chief medical officer (clinical value), the IT lead ("we have our own EHR and app"), legal ("is it a medical device?") |
| **D3 · The second doctor** | Treats another patient with a similar pattern and receives a contact request | Parked. Simulated in the demo | None yet |

**Who gets no card.**

- *The answer-seeker*, who wants an app to explain results. We refuse that by design (PRD N1). Our copy must not attract this person. A patient chatbot already serves them.
- *An insurer.* The founder's data rule means none ever sees a record, so none is an audience. Whether any payer-adjacent body may ever pay is among his five open edges. I write no card for them until he answers.

**Confidence: low.** There is one first-hand voice, the founder's, and no interview. The ranking logic ("who asks") is my inference from the CEO's pre-mortem. The coordinator card rests on what hospitals publish about their process, not on anyone's working day.

**Evidence.**

- The job, in the founder's words: "I need to tell him my history and dont forget to take my exams with me" (`00-founder-brief.md`).
- "Sample size: 0" (`PRD.md` §1). The users table (`PRD.md` §2).
- Why patients may not do the work: "the app gives the patient nothing back (no diagnosis, by design)". The counter-move: "the hospital's international-patient office asks for the record before arrival, a coordinator helps the patient digitise" (`reviews/ceo-review.md` §1, reason 2).
- P2's asker: Cleveland Clinic Abu Dhabi asks overseas patients for the last six months of records before travel [secondary; Sales did not open the page] (`research/buyers.md` §1.1). Medical tourism as "our best wedge" (`research/buyers.md` §1.7).
- P1's size: 51.4% of US adults have two or more chronic conditions [secondary]. 59% of US adults have several portals and 7% combine them [verified] (`research/market-and-competitors.md` §1.1).
- P3: 4.7 years on average to a rare-disease diagnosis in Europe, and more doctors consulted means a longer wait [verified] (same file, §1.1). The refusal of another person's exam is the founder's own must-have: "just to secure that I will not take other's exam as mine" (`00-founder-brief.md`). Dependants out of the demo: `PRD.md` story B1.
- Buyer roles and objections: `research/buyers.md` §1 and §1.1. By Sales' own note, no figure in that file is verified.

**What would change my mind.**

- Patients with a folder who say they would photograph it without being asked. Then Maria is a market and not only a story.
- Travelling patients who say the hospital's staff collect everything and they carry nothing. Then P2 has no job for us.
- International-patient offices that need the file only at arrival. Then the in-person rule is no obstacle and P2 goes first with no condition.
- The founder putting dependants in the first product. Then P3 moves to the top, because she already does the work.

---

## 2. Empathy maps

**Position.** Three maps, then what I take from them.

**Map A · The patient who carries the folder** (P1; sharper for P2)

| | |
|---|---|
| **Says** | "I need to tell him my history and dont forget to take my exams with me." [brief] · "he cannot read all my previous exams so as to get my diagnosis. So he make some guesses or missing some info" [brief] · *Expected:* "I already told the other doctor all of this." "I left the MRI report at home." |
| **Thinks** | *Expected:* "If I forget something and they get it wrong, is that on me?" "Does this doctor take me seriously?" "Who else ends up seeing this?" |
| **Does** | Keeps a folder or a drawer. Photographs pages and sends them by messenger [hypothesis; Sales marks it "no data"]. Has several portals and does not combine them [verified, US]. Repeats a test when the result cannot be found [secondary]. |
| **Feels** | Responsible for a job nobody gave her. Tired of retelling. Uneasy about where her papers go. Relieved on the rare day a doctor has already read everything. |
| **Pain** | She is the courier and the memory. The visit goes on recounting. Abroad, the papers are in the wrong language. |
| **Gain** | *Expected:* "I walked in and she already knew." Empty hands. A say over who looks. |

**Map B · The first-visit specialist** (D1)

| | |
|---|---|
| **Says** | *Expected:* "What did the other doctor find?" "Do you have the report itself?" "When was that test done?" "I don't have time to read all this." |
| **Thinks** | *Expected:* "What am I not seeing?" "Can I rely on this, and who answers for it if it is wrong?" "One more login." |
| **Does** | Skims what came in the bag. Asks the patient to recount. Orders a test again when the result is out of reach [secondary: half of surveyed Australian GPs in two weeks, self-reported]. Spends about a third of his record time per visit reviewing the chart [secondary, vendor-authored, US]. In the US, may already open a free evidence tool [secondary]. |
| **Feels** | Short of time. Uneasy about gaps. Wary of an AI answer he cannot check. Protective of his own judgement. |
| **Pain** | An incomplete history, and no view of what the other specialty found. |
| **Gain** | *Expected:* "I asked one question and it showed me the lab sheet." The original in view. No extra work. |

**Map C · The coordinator and her head of department** (D2, B1)

| | |
|---|---|
| **Says** | The documented ask: send your recent records before you travel [secondary]. *Expected:* "It came as phone photos, half the pages missing, in a language our doctor does not read." |
| **Thinks** | *Expected:* "Can our doctor judge this case before the patient flies?" "Are we allowed to receive this?" "We already have an app." |
| **Does** | Chases records by email and messenger [hypothesis]. Arranges translation [hypothesis]. Sets up a remote assessment call [secondary: one hospital group describes it]. |
| **Feels** | Pressure on turnaround. Dread of the patient who arrives and has to repeat everything. Tired of pilots that need IT. |
| **Pain** | Late, partial, unreadable files. |
| **Gain** | *Expected:* "The file was complete before we confirmed the case." |

**What I take from the maps** (all hypotheses):

1. **The patient's job is emotional before it is administrative.** She does not want to "organise her records". She wants to be known by the doctor without performing her history. Copy about tidiness will miss. Copy about the first five minutes of the visit has a chance.
2. **She gets no explanation back, by design.** After photographing years of paper, the patient side tells her nothing about what it means. The rule is right. The feeling may be "this app keeps things from me". So the copy has to name what she does get: one history in date order, no retelling, a say over who looks, a list of who looked (if story D3 ships). And someone has to ask her to do it.
3. **The handshake asks the less powerful person in the room to start a ritual.** A patient who asks a busy specialist to scan her phone takes a social risk. When the clinic or the hospital has asked for the history, the doctor expects it. This is the second reason the asker matters.
4. **The doctor's reflex to an AI answer is "show me the paper".** So the first thing he hears from us is the source, not the assistant. "Possible causes" touches his judgement and comes last, if at all.
5. **The closing door may win the room and worry the doctor.** He has a duty to keep his own records (PRD Q8). A screen that shuts after the visit can read as "the tool takes my evidence away". Copy for doctors needs an answer to "what do I keep" before it celebrates the door.
6. **"Uploaded by patient" is honest, and a doctor may read it as "unverified".** Today he trusts the paper a patient hands him about as much. Worth asking, not assuming.
7. **"DNA" may say "genetic data" to a privacy-minded patient.** The founder chose it "just for the fun" [brief]. I would test the word before it goes on a patient screen in a real product.

**Confidence: low.** Two lines in these maps are real quotes, both from one person, who is also the founder. The "Does" rows lean on US and Australian statistics. The "Thinks" and "Feels" rows are mine.

**Evidence.**

- The founder's words on the problem (`00-founder-brief.md`).
- Several portals, 7% combine; repeat tests; chart-review time; substitutes ("a folder of paper and PDFs; phone photos and messenger threads", marked inference with no data) (`research/market-and-competitors.md` §1.1, §2.5).
- OpenEvidence free to doctors, US-led (`research/market-and-competitors.md` §2.2).
- Records requested in advance; a remote assessment call; "records arrive in many languages and formats" (`research/buyers.md` §1.1, §1.7, target 25).
- What the doctor may keep after access ends is open: `PRD.md` Q8. The 15-minute default and the closing screen: `PRD.md` story D2.
- "Uploaded by patient" as the mark on every photo: `PRD.md` story B2.
- Patients' unease about insurers: PatientsLikeMe users objected after its sale to an insurer [secondary] (`research/market-and-competitors.md` §2.3).

**What would change my mind.**

- Patients who describe the problem as "I can't find my papers" and not as "the doctor doesn't know me". Then insight 1 is wrong and tidiness is the message.
- Patients who say they would do the work for the timeline alone. Then insight 2 is weaker than I think.
- Doctors who say a patient offering a code would be welcome. Then insight 3 falls.
- The role-play doctor's verdict at G0. If his first question is about speed and not about the source, insight 4 changes the message order in section 4.

---

## 3. Competitor analysis

Spast owns the teardown. My part is how it looks from inside the person's head, and which messages are already taken.

**Position.**

**1. The competitor the person compares us to is mostly not a company.**

| Person | What they do today | What it gives them that we do not | What we give that it does not |
|---|---|---|---|
| Patient | The folder. Phone photos sent to the doctor. Several portals. And now: photograph a result and ask a chatbot | The chatbot explains. We refuse to | A history a doctor can use, a say over who looks, no insurer view |
| Doctor | Asks the patient. Skims the bag. Uses his own system, and a free tool for the literature | No new tool and no new login. The evidence tool costs him nothing | This patient's outside history, with the page behind each answer |
| Coordinator and buyer | An inbox, a messenger, a translator, the hospital's own app | It works well enough and costs nothing new | A sourced history the patient controls (whether it can arrive ahead is open; see section 4) |

"Good enough" is the competitor to beat in the wedge.

**2. Most messages are taken.** Two of them we should not fight for at all: "understand your results" and "all your records in one place".

| Message | Who owns it | Our stance |
|---|---|---|
| "Understand your results" | ChatGPT Health, Claude for Healthcare, Epic's Emmie | We cannot say it and will not (PRD N1). We lose the answer-seeker by design |
| "All your records in one place" | Apple Health Records, Patients Know Best, the national apps. Doctolib's boss has said it will add it [secondary] | Do not lead with it. It becomes free on a known clock (EHDS 2029 and 2031; the NHS single record planned for 2028) |
| "Answers for doctors" | OpenEvidence (from the literature), Epic Art (from one institution's chart) | Ours is narrower: answers from this patient's outside history |
| "Less time on notes" | The ambient scribes | Not our job |
| "You are in control" | Apple (on device); state records with access logs and restrictions | Say ours in specifics: in person, for a set time, and insurers never see it |
| **Open** | Nobody in the research | Old paper as the starting point · the doctor's side of the first visit · each record marked with who vouches for it · no insurer view |

**3. Where they are stronger, said plainly.**

- **Reach.** ChatGPT, Epic and Doctolib already hold the users.
- **Data from the source.** Apple Health Records and Epic receive records from the provider. Ours start as "Uploaded by patient".
- **Price for doctors.** OpenEvidence is free to verified clinicians.
- **Regulatory cover.** Ada's symptom checker is CE-marked. Our assistant is not certified.

**4. Who each is best for.** Saying this costs us nothing and makes the rest believable.

- Someone who wants results explained: a patient chatbot.
- A doctor inside one large health system: that system's own summary.
- A doctor who wants the literature: OpenEvidence.
- A person whose care sits inside one country's state system: the state app.
- A person whose history is on paper, with several doctors or across a border, and a doctor meeting them for the first time: us [hypothesis].

**5. By message, my ranking differs from Sales'.** Sales names Epic, ChatGPT Health and OpenEvidence as most dangerous. From this seat: for the patient, the habit of photographing a result and asking a chatbot. For the doctor, a free tool he already opens. For the buyer, the inbox. In Europe, Doctolib, which Sales describes as "same promise, far larger reach".

**6. Copy rule.** Never "the only" or "the first". Sales found no pure-play company doing photo-to-history at scale, and calls the first-mover claim "open but unproven".

**Confidence: medium** on the map of who owns which message. The competitors' public positioning is sourced by Sales, though nobody tried the products or read user reviews. **Low** on what people really compare us to. That is my inference.

**Evidence.**

- Teardown and gaps (`research/market-and-competitors.md` §2.1 to §2.5); positioning lines and threats (§3).
- "What a buyer will compare us to" and Doctolib as "the closest threat in Europe" (`research/buyers.md` §0).
- "A patient can already photograph an exam and ask ChatGPT about it" and "Do not compete on 'AI reads your exam'" (`reviews/ceo-review.md` §1, reason 4).
- State records give access without use: Germany's record has about 73M accounts and about 4% active use [secondary] (`research/market-and-competitors.md` §1.3).

**What would change my mind.**

- A doctor who says "I would paste the patient's PDFs into the tool I already use". Then the chatbot is the competitor on the doctor's side too.
- A company found doing photo-to-history with a doctor-side share. Then the "open" row closes.
- Doctolib shipping document centralisation with questions for the doctor.
- Patient voice from Sales' treg pass showing people are content with the chatbot route.

---

## 4. Value proposition

**Position.**

**1. One sentence states the problem for all three people.** "Every new doctor starts from what the patient remembered to bring." It is recognition, not a claim. I would open every piece with it.

**2. The order of messages: the moment, the source, control, the two refusals.**

| Order | Message | Lands first with | Status |
|---|---|---|---|
| 1 | The moment: "Every new doctor starts from what you remembered to bring." | Everyone | A problem statement |
| 2 | The source: "Ask the history a question. Every answer opens the exam it came from." | The doctor. It is also what a room sees | Runs in the demo |
| 3 | Control: "A doctor sees it only with your yes. It closes by itself, or sooner when you say so." | The patient | Runs in the demo |
| 4 | The refusals: "You never get a diagnosis from us. Insurers never see it." | The patient, a judge, the buyer's lawyer | Runs in the demo |

Privacy sits at 3 and 4 on purpose. It is the reason to trust us, not the reason to come. People do not start using a health tool because it is private. They refuse one that is not [hypothesis]. Rights and access alone do not create use: Germany's state record has about 4% active use [secondary], and 7% of US adults use an app to combine their portals [verified].

**3. The value map, per person, with what runs.**

| Person | The job, in their words (*expected*) | What we offer | Status |
|---|---|---|---|
| Patient | "Get the new doctor up to speed without me having to remember everything" | A photo becomes one history in date order. An exam that is not hers is refused. She lets a doctor in, in person, for a set time. She can read who looked (if story D3 ships) | Runs in the demo, on synthetic data, for three exam types, in Greek and English |
| | | The key on her phone. Records marked "Verified by source" by labs or national systems | Product only |
| Doctor | "Tell me what I'm missing, and show me the page" | Questions over the history, each answer with a citation that opens the original. One timeline across specialties | Runs in the demo |
| | | "Possibilities to evaluate", for the doctor only | Runs in the demo. A medical device in a product (PRD §8). Not for early copy |
| Buyer | "Let our doctor see the case before the patient arrives" | A patient who arrives with a digitised, sourced history and opens it at the desk | Runs in the demo, in person |
| | | A history that arrives ahead of the patient, translated | **Not built.** "Ahead" also conflicts with the in-person rule |

**4. One line in my own deck promises what does not run.** Slide 10 says: "A consented, translated history that arrives before the patient does." There is no sharing at a distance and no translation in the inputs. Under the CEO's rule I re-label it a proposition to test. It also rests on a decision nobody has taken, because PRD P6 says a doctor sees the record only after the in-person handshake. Two honest versions:

- With the rule as it stands: "Your foreign patients arrive with their history ready to open at the desk."
- If the founder allows a time-limited grant to a named department before the visit: "The history arrives before the patient does."

The second is the one I expect a buyer to pay for [hypothesis].

**5. Words.**

- For the patient: "your exams" and "your history". They are the founder's own words: "exams", "medical history", "papers photocopies". "Record" sounds like something the hospital owns [hypothesis]. Keep "patient-held record" for buyers and investors.
- No "AI" in patient copy. The patient side has no AI box.
- For the doctor, AI is the mechanism. The promise is the source.
- "Possible causes" leads nowhere outside the stage. It is the regulated part, and it is the part a doctor is most likely to resent.

**6. The positioning statement, revised** (recommended):

> For adults who see more than one doctor, and the specialists who meet them for the first time,
> who carry a history between doctors on paper, in photos and in separate portals,
> `[Name]` is a patient-held medical history
> that a doctor can question at the first visit, with every answer opening the exam it came from.
> Unlike a provider portal or a national app (one institution's or one country's part), and unlike a patient chatbot (which answers the patient),
> it starts from the patient's own paper, opens only on the patient's yes and for a set time, and never gives the patient a diagnosis or an insurer a view.

What changed from PRD §13.1: "travels across providers and borders" is out until a second language and a second country are shown. "An assistant that answers only the doctor" is no longer the category, because the CEO's review argues the assistant should be a part that can be swapped (§2, alternative B).

**7. Lines I wrote earlier that I withdraw or re-label.**

| Line | Where | What it becomes | Why |
|---|---|---|---|
| "The patient holds the key", "you hold the key" | Deck slide 6; PRD §13.3 | "You decide who sees it, and for how long." "The key on your phone" only when labelled "in the product" | The demo keeps the key on the server (PRD §10.2; CEO comment 6; CTO §6) |
| "A consented, translated history that arrives before the patient does" | Deck slide 10 | A proposition to test | Not built; needs a founder decision |
| "Never: Insurers, in any form. Not a buyer, not a reader, not a channel" | PRD §13.2 | "Insurers never see it." | The founder's rule is about data. Who may pay is his to decide (CEO comment 5) |
| "Software that only stores, retrieves and shares is generally not a medical device" | Deck slide 12 | "Outside the device rules as we read them, to be confirmed" | CEO comment 7; PRD Q18 is open |
| "every provider, every border, old paper" | Deck slide 9 | Not claimed yet | The demo reads three exam types in Greek and English |

**Confidence: medium** on the order and on what we must not say, because both follow from what runs and from the two reviews. **Low** on whether any line lands. None has been shown to a patient or a doctor.

**Evidence.**

- What runs and what is simulated (`PRD.md` §10.2); the allowed, product-only and forbidden claims (`reviews/cto-review.md` §6); "claim only what runs" and the first rule reworded (`reviews/ceo-review.md` §5, comment 6).
- In person: `PRD.md` goal G3, story D1, principle P6. No translation story exists in `PRD.md` §6.
- The wedge as "a consented, translated record packet" (`research/buyers.md` §4, pilot 2) and my slide 10 (`deck/deck-content.md`).
- "Our edge has to be the doctor-side AI bridge and the privacy model, not 'a vault'" (`research/buyers.md` §0).
- The founder's vocabulary (`00-founder-brief.md`).
- The assistant as a swappable part (`reviews/ceo-review.md` §2, alternative B; comment 18).

**What would change my mind.**

- Doctors who pick "saves me time" over "shows me the source" when they hear both. Then time goes second, once we can measure it.
- Patients who say privacy is the reason they would start. Then control moves up to first.
- Buyers who react to "ready to open at the desk" as enough. Then the in-person rule costs nothing and the question to the founder goes away.
- Patients who call it "my record" unprompted. Then the word is fine.

---

## 5. Business Model Canvas

**Position.** The nine blocks from this seat. The first four are mine. The rest I mark and leave to Sales, Product and the CEO seat.

| Block | My view | Status |
|---|---|---|
| **Customer segments** | Users: the patient (free) and the doctor. First payer to test: the international-patient department of a hospital. The fallback that needs no product change: a multi-specialty clinic. A pilot without revenue: a rare-disease patient group, in my view only once dependants exist | Hypothesis. The first payer is the CEO seat's answer for the deck (Q17) and Sales' wedge |
| **Value propositions** | Section 4. For the payer the value is the first visit, not the patient's privacy | Hypothesis |
| **Channels** | The asker. A hospital department or a clinic asks its patients for the history, and the patient comes in through that request. A patient group asks its members. Doctors hear it from a colleague who used it. No consumer acquisition: no app-store growth plan, no paid ads, no patient-pays plan | Hypothesis. Nothing is running |
| **Customer relationships** | Consent at every step. A log the patient can read. Help with digitising in a pilot (the coordinator). Copy that says only what runs. One trust event ends a privacy-first health brand | Follows the CEO's pre-mortem, reason 5 |
| **Revenue streams** | No price is sourced. Per case, for a department with a revenue reason. Per doctor seat, for a clinic. Free tools set a doctor's price anchor at zero, so I would talk per case before per seat | Sales owns it. The $600 seat is Sales' assumption, and the market sizes built on it are on Sales' own do-not-use list |
| **Key resources** | Trust. Reading quality on real documents. A clinician on the team, which is missing. The founder's own story | CEO gates G1 and G2 name the clinician |
| **Key activities** | Digitise accurately. Run the consented share. Collect proof: interviews, a doctor's verdict, measured accuracy. Keep the claims and the system in step | Hypothesis |
| **Key partners** | A clinician champion. One hospital department or clinic (an insurer-owned one is open edge 5). A patient group. Labs, for "Verified by source". National records as sources to import from. A regulatory adviser | Where a national record's operator is also a payer or a commissioner, that is open edge 2 |
| **Cost structure** | AI reading and answering. Hosting per region. The privacy and regulatory work. A clinical lead. No figures exist in the inputs | PRD Q18 asks for certification cost and time; unanswered |
| **Open, not placed on the canvas** | Public payers. Hybrid bodies. Employers with self-funded benefits. A pharma research line. Insurer-owned hospitals | The founder's five edges. I place none of them as a segment, a partner or an exclusion |

Four points from this seat:

1. **We reach people through whoever asks for the folder.** That makes the model business-to-business-to-patient. A consumer launch has no asker and no payer, and it meets the platforms head-on.
2. **The three refusals are the brand, and each removes a usual revenue source.** No diagnosis for the patient: no paid "explain my results". No insurer view: no insurer money for data. No data sale: no data revenue. What is left is providers paying for a better first visit. So the message to the payer is about the visit.
3. **The canvas that holds together is the narrow one.** The history, the handshake and the source marks are the product. The assistant with "possible causes" is the stage's best moment and the model's most expensive block.
4. **The canvas has a hole where the clinician should be.** Trust, proof and the first pilot all depend on one, and Marketing cannot write around that.

**Confidence: low.** No price, no buyer conversation, and every buyer fact in the inputs is unverified.

**Evidence.**

- Segments, models, cycles and objections (`research/buyers.md` §1, §4, §5). The "who pays" slide and its speaker line, marked as an assumption by Sales (§5).
- The seat price as an assumption, and the do-not-use list (`research/market-and-competitors.md` §1.2, §4).
- The first payer as a hypothesis (`reviews/ceo-review.md` §5, comment 14) and the narrow version (§2, "What the three have in common").
- The five edges and a recommendation for each, which the founder has not answered in the inputs (`reviews/ceo-review.md` §5; `research/buyers.md` §2).
- One trust event (`reviews/ceo-review.md` §1, reason 5).
- Free clinician tools (`research/market-and-competitors.md` §2.2).

**What would change my mind.**

- A hospital department that says it would pay per case, or one that says "our coordinators do this fine".
- Doctors who would pay for a seat although free tools exist.
- Patients who say they would pay. Then a consumer channel is worth a look.
- The founder's answers to the five edges. They decide which blocks may grow.

---

## 6. Market fit scorecard

**Position.**

**Stage: before fit, and before the first problem interview.** There are no users, so no fit survey can be asked. What we know is mostly about the outside world, not about our people.

**The scorecard.** My scale: 0 = no evidence · 1 = desk inference, a secondary source, or the founder's own experience · 2 = verified outside data, or a rule we have written down and checked · 3 = repeated first-hand evidence from the people themselves.

| # | Criterion | Score | Why |
|---|---|---|---|
| 1 | The problem exists in the world | 2 | WHO, the US portal study and the EURORDIS survey are verified. Nothing first-hand beyond the founder |
| 2 | Our person feels it enough to do the work (photograph the folder) | 1 | One person, and he is the founder |
| 3 | The person recognises herself in our first sentence | 0 | Never shown to anyone outside the team |
| 4 | A doctor opens it inside a first visit | 0 | No result from the G0 role-play in the inputs I read |
| 5 | A buyer has a budget and a reason | 1 | Hospitals ask for records in advance [secondary]. Every price and budget owner is Sales' assumption |
| 6 | A channel reaches the person | 1 | The asker is my inference |
| 7 | A difference the person can repeat | 1 | Sales found nobody doing photo-to-history; unproven, and the platforms can close it |
| 8 | We can back what we say | 2 | The allowed and forbidden claims are written. One headline claim is product-only |
| 9 | Timing | 2 | EHDS dates are verified. The same rails also make "records in one place" free |
| 10 | We may legally ship what the first message promises | 1 | The history-first path is "outside the device rules as we read them, to be confirmed" |
| | **Total** | **11 of 30** | Rows 2 to 6 are the ones that measure people. They hold **3 of 15** |

Fit with the company's direction is the CEO seat's criterion. I do not score it.

**The riskiest assumptions, ranked from this seat.**

| # | Assumption | If it is false |
|---|---|---|
| 1 | A patient will photograph years of paper and get no explanation back | There is nothing for a doctor to open |
| 2 | A doctor will open it inside a ten-minute first visit | The history exists and nobody reads it |
| 3 | The first payer's value survives the in-person rule | The wedge's promise ("before the patient arrives") cannot be made |
| 4 | "Insurers never see it" is a reason to choose us, and not only a comfort | The strongest difference is one nobody pays for or acts on |
| 5 | Patients do not settle into "photograph and ask a chatbot" before we reach them | Our refusal to explain reads as a missing feature |
| 6 | A doctor seat can carry a price next to free tools | The model needs the per-case payer or nothing |

**What would move the scores.** These are the tests the CEO's gates already name. I add no new work and contact nobody.

- G0 (15 Nov): the role-play doctor's verdict, in his words. It moves row 4.
- G1 (30 Nov), if the founder opens it: ten interviews. The CEO's pass line stands: 3 of 5 doctors say when in a first visit they would open it, and who would pay.
- Message checks I would add to the same ten interviews (recommended, not decided). Five people are enough to kill a guess, not to prove one.
  - At least 3 of 5 patients describe the courier problem before we show anything. It moves row 3.
  - After hearing the first line once, at least 3 of 5 patients say back something about the doctor, and not "an app that explains my tests". It tests whether we attract the answer-seeker.
  - Asked what would make them photograph the folder, at least 3 of 5 name a person who asks, not a feature. If they would do it unasked, my asker idea is wrong.
  - Doctors hear three lines (the source, the time, the other specialty) and say which they would repeat to a colleague.

**Draft questions** (my half of CEO comment 17; not yet agreed with Sales; about what people did, not what they would do):

- Patients: (1) Tell me about the last time you saw a new doctor. What did you bring, and how did you choose it? (2) What happened in the room with what you brought? (3) Where are your exams right now? (4) Has anyone asked you to send your exams ahead? What did you do? (5) Have you photographed a result and asked someone or something what it means?
- Doctors: (1) Think of your last new patient with a long history. What was in front of you in the first minutes? (2) What did you do about what was missing? (3) When a patient hands you a paper from another doctor, what do you check first? (4) Have you used an AI answer in a visit? What made you trust it, or not? (5) If a patient's history closed on your screen after the visit, what would you need to have kept?

**Confidence: high** that the stage is "before fit": it follows from having no users and no interviews. **Low** on each score. The scale is mine and a different seat could move any row by one.

**Evidence.**

- "Sample size: 0" and "no baseline exists for any of these" (`PRD.md` §1, §9).
- Gates, pass lines and kill criteria (`reviews/ceo-review.md` §3). The fixed questions asked for (comment 17).
- Verified problem numbers and the do-not-use list (`research/market-and-competitors.md` §1.1, §4).
- Sales' status line: no figure in the buyers file is verified (`research/buyers.md`, header).
- Claims we can back (`reviews/cto-review.md` §6; `PRD.md` §10.2). The device line as an open question (`PRD.md` Q18; `reviews/ceo-review.md` comment 7).

**What would change my mind.**

- A G0 verdict in which the doctor says when he would open it. Row 4 goes to 2 on one first-hand signal.
- A written request for a follow-up from a clinician or an organisation. Rows 5 and 6 move.
- A G0 that is thin. Then the CEO's dissent applies, G1 should not start, and this scorecard is the record of why.

---

## Open questions for the founder, from this seat

1. **In person, or also ahead of the visit?** May a patient open her history to a named hospital department before she arrives, for a set time? If "in person" stays absolute, the first persona is "Maria, invited by a clinic", and the line "arrives before the patient does" is never used.
2. **Dependants.** Is a parent holding a child's exams, or an adult child holding a parent's, part of a first product? It decides whether rare-disease families can be a first audience. Today the app refuses them.
3. **The five insurer edges** are already with you (CEO review §5). Until you answer, Marketing writes "Insurers never see it" and nothing about who may pay.

## Where I may differ from the room

These are guesses. I have not read the other papers.

- I put a condition on the travelling patient as the first persona. I expect others to put her first without one.
- I rank privacy third and fourth in the message order. I expect a seat to want it first, because it is the founder's strongest conviction.
- I withdraw rare-disease families as an early audience until dependants exist. The deck and the buyers file both name them as an early pilot for "possible matches".
