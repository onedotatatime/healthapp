# Workshop 4 · Value proposition

**Status: recommended, not decided.** The founder decides on MIN-4442.

Facilitator: Pix Elidis (Design), MIN-4441 · 14 Nov 2026. Sources: the five seat papers. Status of every offer comes from PRD §10.2 (what runs and what is simulated) and the CTO review §6 (allowed, product-only and forbidden claims). Rule used throughout: **claim only what runs.**

Status key: **runs** = in the hackathon demo, on synthetic data · **product** = needs Scope B work · **not built** · **device** = becomes a regulated medical device in a product.

---

## 1. The canvases, one per persona

### 1.1 Buyer and coordinator (Layla and Rania, international-patient department)

| Customer profile | | Value map | Status |
|---|---|---|---|
| **Jobs** | Collect records before arrival; hand a readable case to the clinician; convert the enquiry | **Products and services:** the patient's digitised, source-marked history, opened at the desk | runs (in person) |
| **Pains** | Late, partial, multilingual records; chasing; repeat work-ups; no IT budget | **Pain relievers:** one sourced history instead of an inbox; no EHR integration to start (N6, N7) | runs (in person) |
| | | A history that arrives **before** the patient, for a set time | **not built**; conflicts with PRD P6 (in person) |
| | | Translation beside the original | **not built**; "translation shown without the original" sits in the CTO's unclear regulatory zone |
| | | Coordinator-assisted upload | **not built**; no story exists (Product) |
| **Gains** | Faster intake and quote; fewer lost enquiries; a privacy-first story | **Gain creators:** faster first visit; a provenance mark per record | runs (marks simulated for "verified by source") |

Product's own reading: in the PRD as written, the buyer has **"none as a story"** for pain relievers and gain creators. Everything she would pay for is product work.

### 1.2 Doctor (Dr Nikos)

| Customer profile | | Value map | Status |
|---|---|---|---|
| **Jobs** | See the relevant past fast; check it; avoid repeat tests; combine specialties | **Products and services:** a timeline; questions over the history | runs |
| **Pains** | Missing history; time; liability for AI output; another login | **Pain relievers:** every answer opens the exam it came from (M5); "not in this record" instead of a guess; no data entry | runs |
| | | Identity match on each exam | runs (stops a careless claim, not a forger) |
| | | "Verified by source" vs "uploaded by patient" | simulated; in year 1 almost every record says "uploaded by patient" (CTO) |
| **Gains** | Overview; cited answers; the original one tap away | **Gain creators:** cross-specialty view (E4) | runs partly; **unclear device zone** |
| | | "Possibilities to evaluate" (E3) | runs on stage; **device** |

### 1.3 Patient (Maria; Karim)

| Customer profile | | Value map | Status |
|---|---|---|---|
| **Jobs** | Get a new doctor up to speed; decide who sees it | **Products and services:** photo becomes one history in date order (3 exam types, Greek and English); refusal of an exam that is not hers | runs |
| **Pains** | Carrying paper; retelling; privacy | **Pain relievers:** a doctor sees it only with her yes, in person, for a set time; it closes by itself | runs |
| | | Revoking stops future access (not what the doctor already saw) | runs; the copy must say only this (CTO) |
| **Gains** | One timeline; control; a diary the doctor sees in time | **Gain creators:** access log (story D3); symptom diary (C1) | runs if D3 ships |
| | | "The key on your phone" | **product only** (needs a native app, key recovery Q29) |
| | | An explanation of her results | **refused by design** (N1) |

---

## 2. Promise against delivery

Built from Product §4, the CTO §4 and Marketing §4.7. One table, so no seat's line is lost.

| Promise (where it appears) | Demo | Year-1 product, feasible? | Room's wording |
|---|---|---|---|
| "One photo in, one history out" | runs, synthetic | Yes for printed lab reports; low for handwriting, faxes, old photocopies (CTO assumption 2) | "Photograph your exams once." |
| "The doctor asks; every answer shows its source" | runs | Yes; whether answers that combine documents are a device is open (CTO §6.2) | Keep. Lead line for doctors |
| "You hold the key" (deck slide 6, PRD §13.3) | **simulated** | Only at rest, with a native app; a hosted model still sees each request | "You decide who sees it, and for how long." · "Nobody at the company can read your record at rest" only when the product does it |
| "A consented, translated history that arrives before the patient does" (**deck slide 10**) | **not built** | Buildable (link plus approval on the phone) but drops the in-person control, and needs a founder decision | A proposition to test. With "in person" as it stands: "Your foreign patients arrive with their history ready to open at the desk." |
| "Every provider, every border, old paper" (**deck slide 9** axis) | **not run** (3 exam types, 2 languages) | After a second language and country | Do not claim yet |
| "Verified by source" | simulated (one seeded record) | Low in year 1: depends on labs and rails | Show the mark; do not sell it as the trust story |
| "Close the gap between doctors" | partly (E4, P1, cut early) | Scope B, and E4 is in the unclear device zone | Hold out of year-1 copy |
| "Rare patterns become findable" / possible matches | seeded | An empty index matches nobody; needs thousands of opted-in patients (CTO) | Direction, not a promise |
| "Possible causes" | runs on stage | **Device**: EU class IIa at least, budget for IIb (CTO) | Out of every proposition |
| "Software that only stores, retrieves and shares is generally not a medical device" (deck slide 12) | n/a | Open (PRD Q18) | "Outside the device rules as we read them, to be confirmed" (Marketing) |
| "Never: Insurers… Excluded by design" (deck slide 10; PRD §13.2 "not a buyer, not a reader, not a channel") | n/a | n/a | Marketing proposes "Insurers never see it", the founder's data rule in his words. **See §4: the seats read the rule's reach differently, and the room does not settle it** |

## 3. Where the seats agree

1. **"Possible causes" is out of every proposition** until certification is funded and a clinical lead exists. All five.
2. **"You hold the key" is not claimed for the demo.** CEO, CTO, Product, Marketing; Sales: "differentiator, but only in the product".
3. **The record, the handshake and the source marks are the product; the assistant is a part that can be swapped for the doctor's own tool** (CEO steelman B). CEO, Product, Marketing, CTO (who costs it and flags one conflict, §5 below); Sales keeps the assistant "as the demo and not the headline".
4. **For the doctor, the source is the promise and AI is the mechanism.** All five.
5. **The patient side never diagnoses (N1)** and patient copy has no "AI". All five; Marketing writes the rule for copy.
6. **Two deck lines fail "claim only what runs": slide 10** (the translated history before arrival) **and slide 9** (every provider, every border, old paper). Raised by Marketing (who wrote them and withdraws them); Sales adds that slide 9 omits PKB and Doctolib; Product and the CTO list the same promises as not delivered.

## 4. Where the seats disagree

| Question | Side A | Side B |
|---|---|---|
| **Lead line** | **The moment, then the source, then control, then the refusals.** Privacy is why people trust us, not why they come (Marketing) | **The buyer line first:** "The patient's history arrives before the patient does" (Product; Sales: "sell the packet before the arrival, to the department that already asks for records") |
| **In person or before arrival** | CEO's proposition says **"shared in person"** while naming the international department as buyer | Sales' and Product's lead lines promise **"before the patient lands/arrives"**, which needs the remote grant nobody has decided. Marketing writes both honest versions; the CTO says it is buildable at a privacy cost. *Neither CEO nor Sales flags the tension in their own paper* |
| **Translation** | The cheapest high-value feature for the cross-border wedge (CTO) | Not built; no translation story in the PRD (Marketing). Sales' pain reliever includes a "translated record packet". The CTO also places translation shown without the original in the unclear device zone |
| **Cross-specialty view (E4)** | A gain creator for the doctor, with a regulatory note (Sales) | Leave out of the proposition (CEO); hold out of year-1 copy (Product); unclear device zone (CTO) |
| **Possible matches** | Keep as consented care between doctors, never a data line (CEO) | Not a year-1 value: a network that starts at zero (CTO); hold back (Product) |
| **"Verified by source" as the trust story** | Differentiator once labs sign (Sales) | Decoration in year 1; the doctor's trust rests on the identity match and the source photo (CTO) |
| **Insurer line** | Insurers are excluded as a segment or revenue line because of the data rule (CEO's canvas, Sales' "not a line", deck slide 10) | The rule is about data; whether any payer-adjacent body may pay is the founder's to decide, so the line becomes "Insurers never see it" (Marketing). **The room states both readings and resolves neither. The founder's words stand as written; the five edges stay open** |

## 5. The room's recommendation

**The proposition the room would test** (a merge of the CEO's thin version, Marketing's order and Product's buyer line, written to claim only what runs):

> **Every new doctor starts from what the patient remembered to bring.**
> For specialists meeting a patient for the first time, and the hospital teams who prepare that visit: the patient photographs her exams once, and the doctor asks the history a question. Every answer opens the exam it came from. A doctor sees it only with her yes, for a set time. She never gets a diagnosis from us, and insurers never see it.

1. **Lead with the moment and the source** (Marketing's order). Hold the buyer's "before arrival" line as **a proposition to test** until the founder answers "in person or ahead".
2. **Sell the thin version:** record, handshake, source marks. The assistant is the demo, not the headline; it can feed the doctor's own tool later (subject to the CTO's open point below).
3. **Re-label the four deck lines in §2** (slides 6, 9, 10, 12). The deck is not edited by this workshop; Marketing proposes, the founder approves public copy.
4. **Make translation the first product question for the wedge**, after the regulatory opinion places it (CTO).

**Riskiest assumption:** the buyer's value survives the in-person rule (Marketing assumption 3, CTO assumption 6). **Test:** ask each buyer-side interviewee when the file must be in hand, and show both honest lines ("ready at the desk" and "before arrival"). **Metric:** buyers for whom "ready at the desk" is enough. **Threshold:** 3 of 5 means the in-person rule costs nothing; fewer means the founder's decision on a remote grant blocks the wedge. **Gate:** G1.

## 6. Open questions for the founder

1. **In person only, or a time-limited remote grant to a named department before the visit?** (Marketing, CTO, Product)
2. **Feeding a doctor's own assistant from the record:** is that inside or outside your rule "no export built for third parties" (PRD 10.B.6, control 5)? Only you can say. (CTO; the room does not read the rule either way)
3. **The insurer line on slide 10:** keep "Excluded by design", or use your data rule's words, "Insurers never see it"? The five commercial edges stay open either way.
