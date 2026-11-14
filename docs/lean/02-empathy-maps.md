# Workshop 2 · Empathy maps

**Status: recommended, not decided.** The founder decides on MIN-4442.

Facilitator: Pix Elidis (Design), MIN-4441 · 14 Nov 2026. Sources: the five seat papers in `docs/lean/room/`. The CTO wrote no map, by choice, and gave two technical lines that are used below.

**Read this first.** Nobody has been interviewed (PRD §1). Only two lines in these maps are real quotes, both the founder's, marked **[brief]**. Every other "says" line is the wording the seats expect, marked *expected*. The maps are hypotheses for the G1 interviews, and every cell can be overturned by five conversations.

---

## 1. Map A · The patient who carries the folder (Maria; sharper for Karim)

| Quadrant | Content | Seats |
|---|---|---|
| **Says** | "I need to tell him my history and dont forget to take my exams with me" **[brief]** · "he cannot read all my previous exams so as to get my diagnosis. So he make some guesses or missing some info" **[brief]** · *expected:* "I forgot the MRI report again." "I already told the other doctor all of this." · Karim, *expected:* "The hospital asked for six months of records and I do not know what they need." | Marketing, Product (brief quotes); CEO, Sales (expected lines) |
| **Thinks** | "Nobody has the whole picture." "If I photograph twenty years of paper, what do I get back?" "Who else will see this? Will it be used against me?" "If I forget something and they get it wrong, is that on me?" | Sales, CEO, Marketing, Product |
| **Does** | Keeps a folder or a drawer; photographs a few pages and sends them by messenger (inference, no data); has several portals and does not combine them (US: 59% several, 7% combine, verified); repeats a test when a result cannot be found (secondary) | All four seats |
| **Feels** | Tired of retelling; anxious before a new specialist; responsible for a job nobody gave her; protective of her data, wary of anything that sounds like an insurer; relieved on the rare day a doctor has read everything | All four |
| **Pains** | Courier and memory at once; effort up front with no payoff she sees (N1, by design); abroad, the papers are in the wrong language | All four |
| **Gains** | "I walked in and she already knew." One history in date order; a say over who looks and for how long; a list of who looked (if story D3 ships) | All four |

**CTO's line for this map.** "Can I take it back?" The honest answer: revoking stops future access; it cannot remove what the doctor already saw (PRD 10.B.1). **The map must not promise more.**

## 2. Map B · The first-visit specialist (Dr Nikos)

| Quadrant | Content | Seats |
|---|---|---|
| **Says** | *expected:* "Did you bring your results?" "What did the other specialist find?" "Do you have the report itself?" "I have ten minutes." | CEO, Sales, Product, Marketing |
| **Thinks** | "I cannot read twenty years in a visit." "Is this answer right, and where did it come from?" "If it is wrong, it is my name on it." "One more login." "My patients already show me what ChatGPT told them." | All four |
| **Does** | Skims the bag; asks the patient to recount; orders a repeat test when unsure (half of surveyed Australian GPs in two weeks, self-reported, secondary); spends about a third of record time on chart review (US, vendor-authored, secondary); may open a free evidence tool | All four |
| **Feels** | Short of time; liability; sceptical of AI that does not show its source; protective of his own judgement | All four |
| **Pains** | Incomplete history; no view of the other specialty; another tool inside a ten-minute visit; scanning a code in the room | All four |
| **Gains** | The history in seconds; each answer opens the original; no data entry for him | All four |

**CTO's line for this map.** His fear is relying on a value the AI misread. The answer we can build is the source viewer: every value opens the original photo (PRD M5). It is real, not a claim.

## 3. Map C · The coordinator and her head of department (Rania and Layla)

| Quadrant | Content | Seats |
|---|---|---|
| **Says** | The documented ask: "Send us your records before you travel" (secondary) · *expected:* "Half of them arrive incomplete." "It came as phone photos, in a language our doctor does not read." "We have our own EHR and app." | CEO, Sales, Product, Marketing |
| **Thinks** | "Can our doctor judge this case before the patient flies?" "Each missing record delays the quote." "What does this cost per patient, and who signs it?" "Will legal and IT block it? Is it a medical device?" "Where does the data go, and who owns the group?" | All four |
| **Does** | Chases records by email and messenger; arranges translation; sets up a remote assessment call (one hospital group describes it, secondary); passes cases to clinicians | All four |
| **Feels** | Measured on conversions and turnaround; dread of the patient who arrives and must repeat everything; tired of pilots that need IT; cautious about foreign-data duties | All four |
| **Pains** | Late, partial, multilingual records; coordinator time; no IT budget for an integration | All four |
| **Gains** | A complete, consented, readable packet before arrival; faster first visits; fewer lost enquiries | All four |

---

## 4. Where the seats agree

1. **One structural asymmetry runs through the three maps.** The patient pays in effort, the doctor pays in attention, and the clearest gain lands with the buyer. CEO: "the patient does the work, the doctor gets the value, and the product by design gives the patient nothing back." Product: "the one who gains clearest is the buyer." Sales: "the effort is front-loaded and the reward is paid out to someone else." Marketing: "someone has to ask her to do the work."
2. **The patient's no-explanation rule (N1) is right on safety and costly on activation.** All four seats with maps say so; none asks to drop it.
3. **The doctor will not trust an answer without its source.** All five, the CTO included.
4. **Every cell is inferred.** All seats rate their maps low confidence.

## 5. Where the seats disagree

| Question | One side | Other side |
|---|---|---|
| **Which map comes first?** | **The buyer's**, because that is where money would come from: Sales ("start G1 interviews with the payer"), Product ("the empathy map I would put first is the buyer's") | **The patient's**, because her job sets the message: Marketing ("emotional before administrative"). CEO: the asymmetry itself is the finding, and it points to a one-sided entry through the coordinator |
| **Is the patient's job emotional or administrative?** | **Emotional:** "to be known by the doctor without performing her history"; copy about tidiness will miss (Marketing) | **Administrative / effort:** lost papers, another form, retelling (CEO, Sales). Marketing names the test that would prove her wrong: patients who say "I can't find my papers" |
| **The doctor's first need: source or speed?** | **Source first:** "show me the paper" (Marketing; CTO's source viewer) | **Speed first:** "a two-minute overview" (Sales), "read years of history in seconds" (CEO). Marketing: if the G0 role-play doctor's first question is about speed, the message order changes |
| **What the 7% means** (US adults who combine their portals) | The job is unserved (the research's reading) | People do not care enough to do the work even when data is digital. CEO holds both open: "I do not know which, and the maps cannot tell" |

**Points only one seat raised, kept because they are testable:**
- The handshake asks the less powerful person in the room to start a ritual; it works best when the clinic asked for the history (Marketing).
- The closing door may read to the doctor as "the tool takes my evidence away"; doctor copy needs an answer to "what do I keep" (PRD Q8) before it celebrates the door (Marketing).
- "Uploaded by patient" is honest and may read as "unverified" (Marketing).
- "DNA" may read as "genetic data" to a privacy-minded patient; test the word before it reaches a patient screen (Marketing).

## 6. The room's recommendation

1. **Interview order at G1: buyer and coordinator first, then doctors, then patients.** Money and labour sit on the hospital side; the patient map is the one most likely to change once a coordinator does the work.
2. **Treat the asymmetry as the design brief, not as a defect to fix with features.** The route is a one-sided entry: someone asks, a coordinator helps, the doctor is already inside the visit.
3. **Keep two disagreements open as G0 and G1 tests rather than choose now:** source or speed for the doctor (G0 role-play, his first question), emotional or administrative for the patient (G1, unprompted description).
4. **Adopt the CTO's honesty line in every patient-facing map and copy:** revoking stops future access only.

**Riskiest assumption:** the pain is felt in a person's week, not only in statistics. **Test:** two behaviour questions per interview ("Tell me about the last time you had to bring or send records. What happened?"). **Metric:** interviewees who describe a specific recent failure without prompting. **Threshold:** 3 of 5 per side (Product). **Gate:** G1.

## 7. Open questions for the founder

1. **Activation payoff (Product's Q1).** N1 gives the patient no interpretation. Would you allow one patient-side benefit that interprets nothing, such as a printable visit pack of her own exams and diary? It would raise activation and weaken the need for the handshake. Your rule to keep or bend.
2. **May the room revise the maps after G0?** All five papers predate the role-play (CEO's Q2 asks the same for his paper).
