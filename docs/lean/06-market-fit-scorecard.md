# Workshop 6 · Market fit scorecard

**Status: recommended, not decided.** The founder decides on MIN-4442. The score is a baseline to re-score at G0, G1 and G2, not a forecast.

Facilitator: Pix Elidis (Design), MIN-4441 · 14 Nov 2026. Sources: the five seat papers. Written before any G0 (15 Nov) evidence.

---

## 1. One scale for five seats

The seats scored on four different scales, and two of them start at 1, not 0. A raw percentage would make the 1-based seats look about 10 to 20 points kinder than they are, because their floor ("no evidence") already earns points. So each seat is converted with the same rule: **the seat's own "no evidence" anchor → 0, its top anchor → 100.**

| Seat | Scale as written | Raw result | Raw % | Conversion | **Normalised, 0–100** |
|---|---|---|---|---|---|
| **CEO** | 9 weighted rows, 0–5, weights sum 100 | 30 / 100 | 30 | already 0-based | **30** |
| **Sales** | 10 equal rows, 1–5 | 21 / 50 (mean 2.10) | 42 | (2.10 − 1) ÷ 4 | **28** |
| **Product** | 8 weighted rows, 1–5, "× 20" | 49 / 100 (weighted mean 2.45) | 49 | (2.45 − 1) ÷ 4 | **36** |
| **Marketing** | 10 equal rows, 0–3 | 11 / 30 | 37 | already 0-based | **37** |
| **CTO** | No score. Nine assumptions ranked by how much of the plan falls if wrong, plus feasibility by slice | — | — | — | **not scored** (used in §4) |

**Spread: 28 to 37. Mean of the four scores: 33.** The seats disagree by less than their own stated noise (Product: "the gap is within the noise of my own guessing"; CEO: "low on the absolute number").

Product's decision bands, converted with the same rule: **park below 37.5**, test 37.5 to 62, pursue above 62 (its own 50 and 70). Converted, Product's "test" line lands next to the CEO's G1 bar of about 40. The two seats set the same bar without reading each other.

## 2. The room's scorecard

Common rows, 0–5 per row, weights sum to 100. **The room applies the CEO's evidence rule to every row: a demand-side score above 2 needs evidence from a person outside the team, and none exists yet.** Half points are used where the seats split. "Seats" shows each seat's score for the matching row, converted to 0–5 (0 = no evidence).

| # | Row | Weight | Seats (0–5) | **Room** | Weighted | Why |
|---|---|---|---|---|---|---|
| 1 | The problem is real and measured | 10 | CEO 4 · Sales 3.75 · Product 3.75 · Mkt 3.3 | **4** | 8.0 | WHO 1 in 10 harmed; ONC 59% several portals, 7% combine; EURORDIS 4.7 years (all verified) |
| 2 | The pain is felt by the target, in their words | 12 | CEO 1 · Sales 0 · Mkt 1.7 / 0 | **1** | 2.4 | One person, the founder |
| 3 | A doctor opens it in a first visit | 10 | Product 2.5 (demo fit) · Mkt 0 | **1** | 2.0 | The demo works on its real parts; no doctor has used it yet |
| 4 | A reachable first buyer with a reason | 10 | CEO 2 · Sales 1.25 · Mkt 1.7 | **2** | 4.0 | Segment named; hospitals ask for records ahead (secondary); none contacted |
| 5 | Willingness to pay, shown | 15 | CEO 0 · Sales 0 · Product 1.25 | **0** | 0.0 | No price tested, no letter of interest |
| 6 | Distribution: someone asks, cold start solved | 8 | Sales 1.25 · Product 1.25 · Mkt 1.7 | **1** | 1.6 | "The asker" is an inference; no coordinator model in the PRD |
| 7 | Differentiation and defensibility | 8 | CEO 2 / 1 · Sales 1.25 · Product 1.25 · Mkt 1.7 | **1.5** | 2.4 | Narrow real gap; copyable; clock to 2028–2031 |
| 8 | Regulatory path manageable | 8 | CEO 2 · Sales 1.25 · Product 1.25 · Mkt 1.7 | **1.5** | 2.4 | Record-only likely outside device rules; where cited answers fall is open (CTO assumption 1) |
| 9 | Team and capacity | 8 | CEO 1 · Sales 0 · Product 0 | **0.5** | 0.8 | Solo founder, no clinician, two other products |
| 10 | Timing | 3 | Mkt 3.3 | **2** | 1.2 | EHDS dates verified; the same rails commoditise "records in one place" |
| 11 | We can back what we say | 3 | Mkt 3.3 | **3** | 1.8 | Allowed and forbidden claims written (CTO §6); four deck lines still over-claim |
| 12 | Fit with the company's direction | 5 | CEO 1 | **1** | 1.0 | Orphan next to minhOS and TravelHood (CEO's row; Marketing declines to score it) |
| | **Total** | **100** | | | **27.6** | |

### Room score: **28 of 100. Stage: before fit, before the first problem interview.**

It sits with the CEO's and Sales' scores because the room applies the CEO's evidence cap everywhere; Product and Marketing rate solution fit and claims higher. As every seat says: the number is "unproven", not "bad", and the ranking of weak rows matters more than the total.

**Strongest row:** the problem (1). **Weakest rows that a test can move:** willingness to pay (5), the pain in a person's words (2), the doctor opening it (3). **Weakest row a test cannot move:** team (9).

## 3. What the score must read at each gate (recommended)

| Gate | Rows that must move | Room score if they do | Pass rule |
|---|---|---|---|
| **G0 · 15 Nov** | No row needs to move. Record the role-play doctor's verdict and the measured accuracy (R1, R2 below) | 28 | Evidence recorded in the doctor's words; at least one follow-up request (CEO) |
| **G1 · 30 Nov** | Row 2 → 3, row 3 → 3, row 4 → 3, row 9 → 2 | **about 41** | All four rows, not the total. Below about 40: park (CEO's bar; Product's converted "test" line is 37.5) |
| **G2 · 15 Jan** | Also row 5 → 3 (a pilot agreed in writing with a non-insurer buyer), row 8 → 3 (the adviser's first opinion), row 9 → 3 (a clinical co-founder committed) | **about 54** | All three, and no row below 1. The CEO's bar is about 55 |

The rule is the rows, because a total can rise on rows that do not matter (Sales: "a single strong signal on willingness to pay moves the whole picture more than every other row together").

## 4. The riskiest assumptions, merged and ranked

Ranked by how much of the plan falls if wrong, against how cheap the test is. Every test costs hours, not money, except R8 (an adviser's fee). **No test in this list needs real health data, and nothing is contacted until the founder opens the gate.** The founder's exams are measured only by the founder (R1); no agent reads them.

| # | Assumption | Seats that rank it | Test | Metric | Threshold | Gate |
|---|---|---|---|---|---|---|
| **R1** | Extraction is accurate enough on real paper | CTO 2, Product R4 | The founder's own M2b result at the role-play, reported as a number with no content | Edits needed per exam; field accuracy after correction on name, ID, date, values | Report the measured number at G0; **98%** before any launch (PRD Scope B bar) | **G0** |
| **R2** | Doctors open and trust the cited answers | Product R5, Marketing 2 | Count, in the role-play, whether the doctor opens a citation; record his first question (source or speed) | Citations opened; the doctor's verdict in his words | At least 1 doctor, verdict recorded | **G0** |
| **R3** | A hospital pays for records that arrive with, or before, the patient | CEO row 4, Sales row 5, Product R1, Marketing 3 | Five founder-led buyer conversations after G0 | Buyers who give a cost figure and name a budget owner | **2 of 5, plus 1 written pilot interest** from a non-insurer department | **G1** |
| **R4** | A doctor opens a patient-held record in a real first visit | CEO row 2, Product R2, Marketing 2, Sales | Walk five doctors through the synthetic demo | Doctors who name a moment in a first visit and who pays | **3 of 5** | **G1** |
| **R5** | The buyer's value survives the in-person rule | CTO 6, Marketing 3 | Ask buyers when the file must be in hand; show "ready at the desk" and "before arrival" | Buyers for whom "ready at the desk" is enough | **3 of 5** keeps in-person; fewer makes the founder's remote-grant decision blocking | **G1** |
| **R6** | Patients digitise when someone asks, not otherwise | Marketing 1, CEO §2, Product R3 | Ten people: "How many exams do you hold on paper? Has anyone asked you to send them ahead?" | Share holding 5+ exams on paper or photo; share who name a person who asks | **6 of 10** hold 5+ (below 4 of 10, the paper wedge is too small); **3 of 5** name an asker | **G1** |
| **R7** | The pain is felt in a person's week | Product (empathy test), Marketing row 3 | Behaviour questions only, never "would you use it" | Interviewees who describe a recent failure unprompted | **3 of 5** per side | **G1** |
| **R8** | Cited retrieval stays outside the device rules; only ranking and possible causes are inside | CTO 1 (top), Product R6 | One regulatory adviser's written opinion (CTO path A: about €3k to €10k, 2 to 6 weeks) | A written opinion with a cost and time range | Received, at a cost the founder accepts. "Retrieval needs device status" is a kill signal for the assistant-led story (CTO) | **G1 or G2 — disputed, see §6** |
| **R9** | The platforms and rails do not close the gap within the pilot horizon | Product R7, CEO, Sales | "What did the last patient with paper do, and what did you use?" | Doctors who say a tool or a chatbot printout is enough | **Fewer than 3 of 5** | **G1** |
| **R10** | A clinician commits | CEO row 8, Product, Sales row 10, CTO resource 1 | Founder's search, if he accepts it | A named clinician willing (G1); committed as lead or co-founder (G2) | 1 named | **G1 → G2** |
| **R11** | A doctor seat survives free tools | Product R8, Sales, Marketing 6 | Not tested now; the per-case fee is tested instead (R3) | — | Keep dollar figures off slides until R3 passes | before **G2** |

**Not testable cheaply (CTO 9):** operating real health data without an incident. It is a precondition: a security programme before any pilot, not a test.

**CTO's feasibility by slice (technical / regulatory):** record and timeline high / high · handshake, grant and log high / high · cited retrieval high / medium · key on the device medium / high · verified by source low in year 1 / high · possible matches low at small scale / medium · possible causes high / **low**. His summary: "Nothing in this product is technically hard to build. What is uncertain is whether we are allowed to ship the part that makes it valuable, whether the data is accurate enough to be trusted, and whether anyone exists to carry the duties."

## 5. Where the seats agree

1. **The stage is before fit.** All five. High confidence on the stage, low on every single score.
2. **The problem row is the only strong one,** and it rests on verified public data, not on our people.
3. **The weak rows are willingness to pay, demand evidence, distribution and team,** and they are exactly what G1 and G2 test. CEO, Sales, Product, Marketing; the CTO reaches the same three gaps from the other side (regulation, accuracy, people).
4. **Park by default; the gates stand.** CEO's recommendation; Sales, Product and Marketing's scores support it; the CTO's sizing says the 4-hour cap fits evidence, not a build.

## 6. Where the seats disagree

| Question | Side A | Side B |
|---|---|---|
| **When to buy the regulatory opinion (R8)** | **Move it to G1.** Cheapest test, decides the most; needs the founder's yes on a few thousand euros (CTO) | **G2** (Product R6; CEO's G2 row 7). The CEO's cap until G1 is "about 4 hours a week, **no money**, no build" |
| **Which assumption to test first** | Regulation, because it decides whether the valuable part may ship (CTO) | Willingness to pay, weighted highest and "the most expensive thing to be wrong about" (Product); a written commitment to pay moves the picture more than all other rows (Sales) |
| | A patient will photograph years of paper and get no explanation back (Marketing's #1) | The demand rows 2, 3, 4 together (CEO) |
| **How generous to be without outside evidence** | Cap demand rows at 2 until a person outside the team speaks (CEO; the room adopts it) | Product scores solution fit 3 and reach 3; Marketing scores claims and timing 2 of 3 |
| **What belongs on the scorecard** | Fit with the company's direction is a row (CEO, weight 10) | Not Marketing's row to score; Sales and Product leave it out |

## 7. The room's recommendation

1. **Score 28 of 100: park by default and test.** Spend the next hours only on R1 and R2 (G0), then R3 to R7, R9 and R10 (G1).
2. **Judge each gate on its rows, not on the total** (§3).
3. **Re-score on 16 Nov with the G0 evidence,** in this file, by the same rule (the CEO asks the same for his paper).
4. **The regulatory opinion is the one test that costs money.** The room recommends commissioning it on a G1 pass so it lands by G2 at the latest; if the founder wants the answer sooner, the CTO's case for G1 stands. The founder decides the spend.

## 8. Open questions for the founder

1. **Regulatory opinion at G1 (CTO) or at G2 (Product, CEO)?** About €3k to €10k by the CTO's estimate.
2. **Do you accept the gate rule as rows (§3)** rather than a total?
3. **Do you accept a clinical co-founder search** before 30 Nov? It is the weakest row that no interview can move. (CEO Q4)
