# Simulation and matches panel: figures and on-screen wording (MIN-4506)

Owner: Marketing (Anna). Checked Sat 14 Nov 2026. Interface in English. Nothing here uses or refers to the founder's real exams.

## 1. Baseline figures (each link opened; quoted line shown)

| Series | Figure | Unit / population / year | Source | Quoted line (checked 14 Nov) |
|---|---|---|---|---|
| 2. Wrong or missed diagnoses | **5** per 100 visits (low end of the range) | Share of physician-patient encounters with a diagnostic error; global framing; WHO fact sheet of 11 Sep 2023 | WHO, Patient safety fact sheet: https://www.who.int/news-room/fact-sheets/detail/patient-safety | "These occur in 5–20% of physician–patient encounters." |
| 2. Cross-check for the 5 | about 5% of US adults a year, more than 12 million people | US adults, outpatient care, three observational studies, BMJ Qual Saf 2014;23(9):727-731 | AHRQ PSNet: https://psnet.ahrq.gov/issue/frequency-diagnostic-errors-outpatient-care-estimations-three-large-observational-studies | "approximately 5% of adults in the US, or more than 12 million individuals" "experience a diagnostic error in the outpatient setting every year." |
| 3. Cost | **11%** of health spending | Direct cost of misdiagnosis, "typical OECD country", OECD authors' model estimate, working paper published 2025 | OECD Health Working Paper No. 176, The economics of diagnostic safety (Slawomirski et al.): https://www.oecd.org/content/dam/oecd/en/publications/reports/2025/03/the-economics-of-diagnostic-safety_6e0ed50b/fc61057a-en.pdf | "The direct costs of misdiagnosis therefore amount to approximately 11% of healthcare expenditure." (section on direct costs, para 130) |

Notes for the team (not for the screen):
- Why 5 and not 20: the range is wide; the low end is the conservative choice and is backed by the US outpatient study. If Cron prefers a single cited point, use the AHRQ one (about 5%).
- The 11% is a modelled estimate by the OECD authors, not a measurement. The screen already says "A model, not a measurement"; the source line says "OECD model estimate".
- Not used: OECD's wider 17.5% (adds over- and underdiagnosis, which this simulation does not model); the US "USD 100 billion" figure (second-hand in the OECD paper, original AHRQ brief not opened); the circulating "$42B medication error" figure (no source found).
- Series 1 (matches) needs no figure from Marketing; Cron computes it.

**Status: series 2 found. Series 3 found. Nothing dropped.**

## 2. The assumption (one sentence, one number)

> We assume that a match lowers the chance of a wrong or missed diagnosis by 20%.

Status: **approved as written by the CEO seat, on the founder's delegation, 14 Nov 2026** (the `CEO ·` comment on MIN-4506, with three conditions). There is no source for it, and none is claimed. The 20% is a stated choice, not a finding.

How Cron uses it (so the screen and the JSON agree):
- wrong_or_missed_per_100 = 5 × (1 − 0.20 × match_rate), where match_rate is series 1 as a fraction from 0 to 1.
- cost_share_of_health_spend = 11 × (1 − 0.20 × match_rate), in % of health spending.
- At a match rate of 100% the baseline falls from 5.0 to 4.0 per 100 visits and from 11% to 8.8% of health spending. The drop is small because the assumption is modest. Do not rescale to make the curve steeper.

## 3. On-screen wording: simulation screen

| Element | Text |
|---|---|
| Permanent label (fixed by the CTO, never rewritten) | Simulation on synthetic data. A model, not a measurement |
| Title | What matching could change |
| Caption | 30 seconds on seeded synthetic records. Watch matches grow as the network grows, and what a stated assumption would mean for wrong or missed diagnoses and what they cost. |
| X axis | Synthetic records in the network |
| Series 1 label | Records that find a match |
| Series 1 unit | % of records |
| Series 2 label | Wrong or missed diagnoses |
| Series 2 unit | per 100 visits |
| Series 3 label | Cost of wrong or missed diagnoses |
| Series 3 unit | % of health spending |
| Assumption line | Assumption, not a finding: a match lowers the chance of a wrong or missed diagnosis by 20%. |
| Source line | Baselines: wrong or missed diagnoses, WHO patient safety fact sheet, 2023 (5–20% of visits; we start from 5%). Cost, OECD working paper No. 176, 2025 (about 11% of health spending; an OECD model estimate). |
| Series dropped (only if a figure fails) | Series not shown: no solid source. |
| Replay button | Play again |

Wording rules applied: no "anonymous", no diagnosis language toward a patient (diagnoses appear only as a population rate), no "result", "proves" or "saves lives", no exclamation marks, no emoji.

## 4. On-screen wording: matches panel (F2)

| Element | Text |
|---|---|
| Permanent label (fixed by the CTO, kept as is) | Seeded synthetic data. Not real patients. |
| Match line | {N} seeded synthetic records share this pattern. |
| Match line helper (small text) | A match is a shared pattern in the seeded data. It is not a person and not a diagnosis. |
| Empty state (no match, and also any count below 5; identical text for both) | No matches in the seeded data. |
| Opt-in wording, if the panel needs one | Opt-in, without name or ID. |

Empty state must never show a count, "fewer than 5", or "too few": it has to read the same as "no matches".

## 5. Skipped (lean)

Second language, alternative headlines, a USD figure for the US, per-condition baselines, the AHRQ "USD 100 billion" brief, chart colour and layout (Ren/Pix), deck slides, F3 contact copy, analytics wording.

## 5b. The record field (spec A12, MIN-4680; words by Anna, MIN-4683)

The caption rule changes from "a cell is not a record" to: a dot counts as one record, but where a dot sits and which dots turn teal are not identity. Wording: no "anonymous", no "person" claim, no exclamation mark.

| Element | Text | `copy.ts` key |
|---|---|---|
| Canvas `aria-label`, built from the data | Match field: {matched} of {visible} synthetic records have a match (thousands comma, e.g. "Match field: 2,071 of 5,000 synthetic records have a match") | `simFieldLabel({ matched, visible })` |
| Caption under the field, static from frame 0 | One dot, one synthetic record. Teal is a match; position says nothing about who it is. | `simFieldCaption` |

## 6. The euro outcome and the match-by-match wording (MIN-4604, decided on MIN-4605)

Owner: Marketing (Anna). Candidates checked 15 Nov 2026. Status: **approved by the CEO seat on the founder's behalf, 15 Nov 2026 (MIN-4605), with conditions 1 to 8**.

Source of this section: Anna's MIN-4604 comment 61ae9259 (her sections 1, 4 and 5, as written) and the CEO seat's fills in MIN-4605 comment de26aa96 (section 3). Her comment names the block under "Paste-ready"; that heading is not in the posted text, so Ren assembled this section from those sections (MIN-4608). Anna checked it against her comment on 15 Nov: it matches what she meant. The filled last-frame figures were refreshed from the 5,000-record file on 15 Nov (MIN-4683). History: the 1,200-record file gave €17.6 billion, 0.96 points, €39 (473 records with a match); the 400-record file gave €13.6 billion, 0.74 points, €30. Neither applies now.

### 6.1 The total the euro figure uses (CEO seat: option A, with C as the second line; Eurostat dataset hlth_sha11_hf, total, updated 4 Nov 2026)

| | Figure | Unit / geography / year | Value as returned | Checked |
|---|---|---|---|---|
| A (used) | **€1,833,973.32 million = €1,834 billion** | current health expenditure, EU-27, 2024 | `1833973.32` | 15 Nov |
| C (used, second line) | **€4,074.88 per inhabitant** | current health expenditure per inhabitant, EU-27, 2024 | `4074.88` | 15 Nov |
| B (not used) | €19,869.37 million = €19.9 billion | Greece (EL), 2024 | `19869.37` | 15 Nov |
| D | not found | OECD Working Paper 176 gives no absolute money figure for the 11% | n/a | 15 Nov |

Source URL (A): https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/hlth_sha11_hf?format=JSON&unit=MIO_EUR&icha11_hf=TOT_HF&geo=EU27_2020&time=2024 . The Eurostat data browser table for the same dataset: https://ec.europa.eu/eurostat/databrowser/view/hlth_sha11_hf/default/table .

### 6.2 On-screen wording for `/simulation`

| Element | Text |
|---|---|
| Euro outcome line | In this model, the cost of wrong or missed diagnoses is {amount} a year lower for {geography}, on {year} spending. |
| Formula line | {drop} points of health spending × {total} ({geography}, {year}) = {amount} a year |
| Source line for the total | Health spending total: Eurostat, current health expenditure, {geography}, {year}. |
| Unit label for the figure | a year, {geography}, {year} |
| Counter label (cumulative) | Modelled drop so far |
| Counter value | {amount} a year |
| Second line (CEO seat) | {per_inhabitant} per inhabitant a year |

Amount writing: billions with one decimal ("€18.5 billion"), millions with none ("€147 million"), per inhabitant with none ("€41"); the total in the formula with a thousands comma ("€1,834 billion"); "EU-27" as geography; year as four digits; "a year" always present. The word "saved" is deliberately not used: the counter says "drop", not "saved".

Filled for the last frame, on the 5,000-record file `data/synthetic/simulation.json` (founder, 15 Nov: "can we increase the https://healthapp-8ui.pages.dev/simulation to 5000?"; the values are read from its `euro` block, last row): "In this model, the cost of wrong or missed diagnoses is €18.5 billion a year lower for EU-27, on 2024 spending." Formula: "1.01 points of health spending × €1,834 billion (EU-27, 2024) = €18.5 billion a year" (check: 1.01 / 100 × 1,834 = 18.52). Second line: "€41 per inhabitant a year" (check: 1.01 / 100 × 4,074.88 = 41.16). Last row of the file: 5,000 records, 2,071 with a match (46.0%), 4.54 wrong or missed diagnoses per 100 visits, 9.99% of health spending. Source line: "Health spending total: Eurostat, current health expenditure, EU-27, 2024." with Anna's link.

### 6.3 Match by match

| Element | Text |
|---|---|
| Learning-curve assumption line (replaces the line in section 3; approved as written) | Assumption, not a finding: each match lowers the chance of a wrong or missed diagnosis by {start}, rising to {ceiling} as matches accumulate. |
| Matches counter | Matches so far: {n} |
| Assumed effect counter | Assumed effect of a match: {pct} |
| Step caption, early | First matches: each one lowers the chance only a little. |
| Step caption, middle | More matches: in the model, each new match is better than the last. |
| Step caption, late | Most matches so far: the assumed effect is at its ceiling. |
| Step caption, cost | ~~In the model, each step lowers the cost more than the one before.~~ **Not shown** (CEO seat, condition 8: false on the data). Replacement unless Anna writes another: In the model, the cost falls further as matches accumulate. |

The four step captions are not built in this story (CTO, MIN-4610). They stay here as approved wording.

Shape of the run at 5,000 (checked against `simulation.json`, MIN-4683): the first step (417 records) already has 107 matches (28.5%), so the run does not start at zero. The match rate rises from 28.5% to 40.9% in the second step, then flattens: from the third step (43.6%) it stays between 43.6% and 46.2%, never rising more than 0.7 points in a step, holds once (45.2% to 45.2%, steps 7 to 8) and dips once at the last step (46.2% to 46.0%). Series 2 and 3 start at 4.85 and 10.67, not at their baselines (5 and 11). What does still hold at every step: the match count rises (107 to 2,071), the assumed effect rises (10.5% to 20%), and the cost falls. No on-screen sentence claims more than that: the caption says "Watch matches grow as the network grows" (the count of matches does grow at every step), and the cost caption says "the cost falls further as matches accumulate" (true at every step). No sentence says the rate climbs on every step or that the run opens empty. The late step caption ("the assumed effect is at its ceiling") is true only at the last step, as before; it is not built, so nothing to change now.

Notes (Anna): the "Modelled drop so far" counter shows the drop at the current network size as a yearly figure, so it grows as matches accumulate; it is not money adding up over several years, and the screen must not suggest so ("a year" stays next to it). The assumption line contains "assumption"; the permanent label stays visible, and the 20% appears as the ceiling, always with "assumption" in the same sentence. No study is attached to the start or the ceiling. Never "anonymous"; none of the strings uses it. No exclamation mark.

### 6.4 Conditions (CEO seat; 1 to 3 are the MIN-4506 ones)

4. The euro figure is on screen only together with series 3's chart (axis from zero), the formula line, the source line and the permanent label.
5. The euro sentence has "model" or "assumption" in it. Never "saved", "saves", "savings" or "will". The 10% follows the same rule as the 20%: never without "assume", "assumed" or "assumption" in the same sentence, and no study attached.
6. The arithmetic on screen checks out at the precision shown: the euro values come from the published two-decimal cost (1.01 × €1,834 billion = €18.5 billion).
7. Nothing says the matching software learns today. Asked "does it learn?": "Not in this prototype. The curve is our assumption of what a learning matcher would do. A pilot with doctors would measure it."
8. The cost caption "In the model, each step lowers the cost more than the one before." is false on the data and is not shown.

## 7. The timeline diagram under the hero (MIN-4697 part 2; decided on MIN-4698; spec A13 on MIN-4700; build MIN-4702)

Everything here is synthetic data or a plan, in English only. Words by Anna. The CEO seat's decision (MIN-4698, on the founder's behalf) is applied: per-case ramp, both money lines in "€ a year" on one euro axis, "saved" stays banned, income is the plan's conservative line marked as a plan.

> **Superseded in part by section 8 (MIN-4723, 15 Nov 2026).** The founder rejected the three-lane card ("no no no. We said one diagram with all the lines on the same...", then "animated"). Struck rows in 7.1 (title, caption, the three lane titles, the unit lines, the euro note, the aria lead) are replaced by section 8. Everything else in section 7 still applies: line names, kind tags, band, first-paid marker, ramp and income assumption lines, formula, tie, the values table, aria lines per measure, and 7.3 to 7.6.

### 7.1 Final strings (keys are for `src/features/matches/copy.ts`; Ren owns that file)

No number, month or price is typed in a string: every `{...}` comes from the data file. Placeholders are in braces.

| Key | Final string |
|---|---|
| `tlTitle` | ~~What a growing network could change, month by month~~ superseded by section 8 |
| `tlCaption` | ~~Plan months {first} to {last}, on synthetic records. As more patients join, more records find a match; the model then shows fewer wrong or missed diagnoses, a lower cost for those patients, and our planned income.~~ superseded by section 8 |
| `tlXAxis` | Plan month |
| `tlBand` | Free pilot: no patients counted |
| `tlFirstPaid` | First paid cases |
| `tlName.patients` | Patients in the network |
| `tlName.matches` | Records with a match |
| `tlName.dx` | Fewer wrong or missed diagnoses |
| `tlName.drop` | Modelled drop in cost |
| `tlName.income` | Our income |
| `tlTag.plan` | Plan |
| `tlTag.model` | Model |
| `tlTag.computed` | Computed on synthetic records |
| `tlLaneTitle.people` | ~~People~~ superseded by section 8 |
| `tlLaneTitle.euro` | ~~Euros~~ superseded by section 8 |
| `tlLaneTitle.dx` | ~~Diagnoses~~ superseded by section 8 |
| `tlUnitPeople` | ~~Patients and records, running total~~ superseded by section 8 |
| `tlUnitEuro` (one string, both lines) | ~~€ a year, one scale for both lines~~ superseded by section 8 |
| `tlUnitDrop` (key end value, if a unit shows with it) | ~~€ a year, for these patients, in the model~~ superseded by section 8 |
| `tlUnitIncome` (key end value) | ~~€ a year, plan~~ superseded by section 8 |
| `tlUnitDx` | ~~A year, across these patients, in the model~~ superseded by section 8 |
| `tlAssumeDx` (under lane 3) | Assumption: one visit per patient a year. |
| `tlRampPerCase` | Assumption: each paid case is one new patient in the network, at {price} a case. Months {from} to {to} are a free pilot with no patients counted. Doctor-seat fees are income, not patients. |
| `tlIncomePlan` | Income: our plan, not a measurement. Every price and volume is an assumption. |
| `tlEuroNote` (the new sentence, under lane 2) | ~~Each case is paid once, at {price}. The modelled drop is a yearly figure for the patients in the network ({perPatient} per patient a year at month {last}). In this model it counts only the direct cost of wrong or missed diagnoses, on the EU-27 average spending per inhabitant.~~ superseded by section 8 |
| `tlFormula` (under lane 2, for month {last}) | {points} points × {perInhabitant} × {patients} patients = {amount} a year |
| `tlTie` | The {amount} a year above applies this same model to all {geography} health spending. This chart counts only the patients in the network, so its figures are far smaller. |
| `tlShowValues` (the `<details>` summary) | Show the values |
| `tlColMeasure` | Measure |
| `tlColMonth` | Month {n} |
| `tlTableCaption` | Plan months {a} and {b}, the same figures as the chart. |
| `tlDescLead` | ~~Chart, plan months {first} to {last}, synthetic model.~~ superseded by section 8 |
| `tlDescPatients` | Patients in the network: none until month {paid}, {n} at month {last}. |
| `tlDescMatches` | Records with a match: {n} at month {last}. |
| `tlDescDx` | Modelled fewer wrong or missed diagnoses: {n} a year. |
| `tlDescDrop` | Modelled drop in cost: {amount} a year. |
| `tlDescIncome` | Planned income: {amount} a year, plan. |
| `tlDescClose` | A model and a plan, not a measurement. |

Notes for Ren:
- **Keep** `tlTitle`, `tlCaption`, `tlTie`, `tlXAxis`, `tlBand`, `tlFirstPaid`, `tlName`, `tlRampPerCase`, `tlIncomePlan`, `tlShowValues`, `tlColMeasure`, `tlColMonth`, `tlDescLead`, `tlDescPatients`, `tlDescMatches`, `tlDescClose` as already in the file; only `tlCaption` and `tlDescMatches` are unchanged from the draft apart from "at month {last}" on the second.
- **Replace** `tlUnitEuro` (the three-way `running`/`yearly`/`other`) with the one string above, and the same for `tlUnitDx`; **delete** the `running` forms and `tlDescBasis`: every money and diagnoses figure is "a year" (condition 10; no "so far" for either money line, on screen or in the `aria-label`). `tlDescDrop`, `tlDescIncome` and `tlDescDx` carry " a year" in the string itself.
- **Delete** `tlRampGeneral`: the per-case ramp is decided, so one assumption line only.
- **Add** `tlUnitDrop`, `tlUnitIncome`, `tlAssumeDx`, `tlEuroNote`, `tlFormula`, `tlTableCaption`.
- `{points}` is the file's published two-decimal drop (points of spending) for that month, `{patients}` the month's patients, `{perInhabitant}` the file's €4,074.88, `{perPatient}` the file's per-patient figure at month {last}. The formula must use the points and the patients, never the rounded per-patient figure (condition 13).
- If the drop line is cut for time, `tlTie`, `tlEuroNote`, `tlFormula`, `tlUnitDrop` and `tlDescDrop` leave with it (CEO seat, point 6). If the diagnoses lane is cut, `tlAssumeDx`, `tlUnitDx`, `tlDescDx` and the lane title leave with it.

### 7.2 Answers to Pix's open question 1 (MIN-4700, A13 section 10)

Lane titles: People, Euros, Diagnoses. Unit lines: as the table (`tlUnitPeople`, `tlUnitEuro`, `tlUnitDx`). The kind tags are exactly "Plan", "Model" and "Computed on synthetic records". Plan covers Patients in the network and Our income; Model covers the drop and the diagnoses; Computed on synthetic records covers Records with a match. The values table: summary "Show the values", column heads "Measure" and "Month {n}" (months 12 and 24), caption `tlTableCaption`. No matches-only note is needed for lane 1 (patients stay). Pix's mock placeholders for these are replaced by the table above.

Two words to watch in the design: the euro lane's unit line says "one scale for both lines", so no second axis is implied; and the end value of Our income carries "plan" next to it, and of the drop carries "in the model", so neither money figure is read as collected or kept.

### 7.3 Sources, with the quoted lines

- **Price and ramp, the plan.** `docs/business/funding_plan.py`: `PRICE_EUR_PER_CASE = 40  # slide 10's conservative price per paid case, in euros`; `CONSERVATIVE = (26, 180, 560)  # slide 10's conservative yearly totals, EUR thousands`; `CONSERVATIVE_PER_CASE = (20, 120, 320)` (deck A6 line A; the rest is doctor seats, line B). Deck `docs/deck/deck-content.md` A6: "Paid cases per hospital a year (year 1 is half a year, after a free pilot) | 500 / 1,000 / 1,000 | 1,500 / 3,000 / 3,000 | assumption".
- **Free pilot, months 3 to 8.** `docs/business/team-and-funding-plan.md` section 9: "Free pilot in one hospital department (2 to 4 months, BMC)"; method note: "its first half is the free pilot, so paid revenue starts at plan month 9". No patient count in the plan, so none is drawn: the band says "no patients counted".
- **Plan, not a raise.** Deck footer: "Our plan, not a raise in progress; costs are assumptions."
- **Spending base.** Eurostat `hlth_sha11_hf`, EU-27, 2024: `4074.88` euro per inhabitant (section 6.1, value as returned, checked 15 Nov). The derived hospital figure of part 1 (about €9,557 a discharge) is not used; the CEO seat rejected it.
- **The drop at a month** = points (published, two decimals, for that month's matches) ÷ 100 × €4,074.88 × patients that month. Same model and same unit as the hero, counted only for the network's patients.

### 7.4 Figures: filled values, and what still has to be checked

Cron's regenerated `data/synthetic/simulation.json` (MIN-4701) does not yet hold the final yearly series: the committed generator still writes the money measures as running totals, and `timeline` is not in the committed file. The figures below are the CEO seat's scratch run (MIN-4698), synthetic, and **are not yet read from the file**. Before this section is final, each row must equal the file's value; the sentences on screen never type any of them.

| Plan month | Patients | Records with a match | Drop, € a year | Per patient a year | Income, € a year (plan) | Diagnoses a year |
|---|---|---|---|---|---|---|
| 9 | 24 | 0 | 0 | €0 | 14,857 | 0.0 |
| 12 | 238 | 28 | 1,358 | €5.70 | 59,429 | 0.2 |
| 18 | 1,189 | 460 | 28,101 | €23.63 | 145,055 | 3.1 |
| 24 | 2,806 | 1,137 | 88,043 | €31.38 | 228,923 | 9.8 |

Arithmetic shown at month 24, as in 6.2: points 0.77 ÷ 100 × €4,074.88 = €31.38 per patient (check: 31.38 ÷ 4,074.88 = 0.770%); × 2,806 patients = €88,043 (check: 0.0077 × 4,074.88 × 2,806 = 88,042.7). So the formula line reads "0.77 points × €4,074.88 × 2,806 patients = €88k a year". Income: the plan's revenue × 12 = €228,923 a year, about €229k (19.1k a month). Diagnoses: 2,806 × 0.35 ÷ 100 = 9.8 (check: 9.82). The drop at month 24 is €88k against €229k of income: the gap is the picture, not an error, and nothing rescales it.

Sentences checked against what the data shows: counts of patients, matches, drop and income do not fall in any month; the match **rate** falls once (44.3% to 44.2%, month 19 to 20). So `tlCaption` says "more records find a match" (true of the count) and no string says the rate rises every month. First matches are in month 11 (4 records, 143 patients); the string for that marker, if Ren builds it, is a value from the file, not typed. Not claimed anywhere: that the software learns, any payback, any sum over months, any study behind the 10% or 20%.

### 7.5 Conditions 9 to 15 (CEO seat), and how these strings meet them

9. Per-case ramp only; its assumption line is visible with the diagram; months 3 to 8 are "free pilot", no patient invented. `tlRampPerCase`, `tlBand`.
10. Modelled money only as a yearly figure at that month's network size; no running total or sum, on screen or in the `aria-label`. Every money string above ends "a year".
11. Drop and income share one euro axis from zero, at true size. `tlUnitEuro` says "one scale for both lines".
12. Income is the conservative line, months 1 to 24, marked as a plan in the same block. `tlIncomePlan`, `tlUnitIncome`, `tlTag.plan`.
13. The formula gives the figure at the precision shown. `tlFormula`.
14. No sentence claims a shape the file does not show (7.4).
15. The diagnoses lane carries "Assumption: one visit per patient a year." `tlAssumeDx`.

Conditions 4 to 8 hold unchanged: the euro figure appears only with the formula, the source line, the permanent label and series 3's chart; `tlEuroNote` and `tlDescDrop` contain "model" or "modelled"; the 10% and 20% are not restated in this block, and wherever they appear (the learning-curve line, section 6.3) "assumption" stays in the same sentence.

### 7.6 Wording check (run on the strings in 7.1)

No "saved", "saves", "savings", "will", "result", "proves", "anonymous" and no exclamation mark in the table of 7.1 (a regex over its 38 string rows found none). Diagnoses appear only as a yearly count for the network, never toward a patient. English only; Greek n/a.

## 8. One plot, five lines, animated (MIN-4723, parent MIN-4696; MIN-4716 folded in; meaning fixed by the CTO on MIN-4720, comment 6fba2571)

Everything here is synthetic data or a plan, in English only. Words by Anna. Founder, 15 Nov 2026: "no no no. We said one diagram with all the lines on the same showing how while the users are growing so as the matches how the other numbers are growing", then "animated". The scale rule is the CTO's: one scale per unit (people against patients, euros against income, diagnoses on their own), linear from zero, no unit tick values, fixed from the first frame. No number is typed in a string: every `{...}` comes from `simulation.json` (`timeline` block, `euro.geography`).

### 8.1 Final strings (keys for `src/features/matches/copy.ts`; Ren owns that file)

| Key | Final string |
|---|---|
| `tlTitle` | As patients join, the other numbers grow with them |
| `tlCaption` | Plan months {first} to {last}, on synthetic records. In this model, as patients join, the records with a match, the modelled drop in cost, the fewer wrong or missed diagnoses and our planned income grow along with them. |
| `tlScale` (axis caption, always visible, next to the plot) | Each unit has its own scale: people, euros, diagnoses. Compare heights only inside a unit. Across units, compare how the lines grow. |
| `tlScaleMore` (small print under `tlScale`) | Patients and records with a match share one scale. Income and the modelled drop share another. Diagnoses have their own. Every scale starts at zero. |
| `tlScaleTop` (label of the top gridline, once per unit group) | Top: the largest value in the unit |
| `tlScaleBase` (bottom gridline) | 0 |
| `tlMonth` (readout) | Month {n} of {last} |
| `tlReplay` | Replay |
| `tlReplayAria` | Replay the chart from month {first} |
| `tlHead.patients` (short label at the line head) | Patients |
| `tlHead.matches` | With a match |
| `tlHead.income` | Income, plan |
| `tlHead.drop` | Cost drop, model |
| `tlHead.dx` | Diagnoses, model |
| `tlName.patients` (full, legend and table; unchanged) | Patients in the network |
| `tlName.matches` | Records with a match |
| `tlName.income` | Our income |
| `tlName.drop` | Modelled drop in cost |
| `tlName.dx` | Fewer wrong or missed diagnoses |
| `tlUnit.patients` | patients, running total |
| `tlUnit.matches` | records, running total |
| `tlUnit.income` | € a year, plan |
| `tlUnit.drop` | € a year, model |
| `tlUnit.dx` | a year, model |
| `tlTag.computed` (patients and matches; unchanged wording) | Computed on synthetic records |
| `tlTag.plan` (income) | Plan |
| `tlTag.model` (drop and diagnoses) | Model |
| `tlVal.count` (value at a head, patients and matches) | {n} |
| `tlVal.eur` (income and drop) | {amount} a year |
| `tlVal.dx` | {n} a year |
| `tlReadoutRow` (phone, five rows under the plot, one per line: `tlHead` + value) | {head}: {value} |
| `tlBand`, `tlFirstPaid`, `tlXAxis` | unchanged from 7.1 |
| `tlRampPerCase` | unchanged from 7.1 |
| `tlIncomePlan` | unchanged from 7.1: Income: our plan, not a measurement. Every price and volume is an assumption. |
| `tlAssumeDx` | unchanged from 7.1: Assumption: one visit per patient a year. |
| `tlEuroNote` (replaces 7.1; MIN-4716) | Each case is paid once, at {price}. The modelled drop is a yearly figure for the patients in the network ({perPatient} per patient a year at month {last}). In this model it counts only the direct cost of wrong or missed diagnoses, on the average spending per inhabitant for {geography}. |
| `tlFormula` | unchanged from 7.1: {points} points × {perInhabitant} × {patients} patients = {amount} a year |
| `tlTie` | unchanged from 7.1 |
| `tlShowValues`, `tlColMeasure`, `tlColMonth`, `tlTableCaption` | unchanged from 7.1 (the values table stays, and is the accessible version) |
| `tlDescLead` (card aria, first sentence; replaces 7.1) | One chart with five lines, plan months {first} to {last}, synthetic model. Each unit has its own scale, so heights are compared only inside a unit. |
| `tlDescPatients`, `tlDescMatches`, `tlDescDx`, `tlDescDrop`, `tlDescIncome`, `tlDescClose` | unchanged from 7.1 |

Notes for Ren:
- `{geography}` is `euro.geography` (today "EU-27"); the string no longer types it. `{price}` is `plan.price_eur_per_case`, `{perPatient}` the file's per-patient figure at month {last}, as before. `{first}` and `{last}` come from `x.values`.
- **Delete** the lane keys: `tlLaneTitle.people`, `.euro`, `.dx`, `tlUnitPeople`, `tlUnitEuro`, `tlUnitDrop`, `tlUnitIncome`, `tlUnitDx` (replaced by `tlUnit.*` and `tlScale`).
- `tlMonth` changes only at month edges, with the values (CTO MIN-4720 section 2). No `aria-live` during the run; the values table is the accessible version. With reduced motion the finished chart shows at once, so the readout reads "Month {last} of {last}" and there is no `tlReplay`.
- The scale strings say nothing about month {last}: the top of each unit is its largest value in the file, which the code takes as a maximum, so the sentence stays true if a series ever stops rising.

### 8.2 Sentences checked against `data/synthetic/simulation.json` (`timeline`), 15 Nov 2026

| Sentence | Check |
|---|---|
| `tlCaption`: records with a match, the modelled drop, fewer diagnoses and planned income grow with the patients | The counts and the money do not fall in any month: patients 0 to 2,806; matches 0 to 1,137 (4 at month 11); drop €175 (month 11) to €88,043; diagnoses 0.2 (month 12) to 9.8; income run rate €14,857 (month 9) to €228,923. "Grow along with them" is about direction, as a model, and does not say the match **rate** rises: it dips once, 39.9% of patients in month 19 (563 of 1,410) to 39.8% in month 20 (657 of 1,651). Months 1 to 8 are flat (the free pilot, no patients counted), which `tlBand` shows; the caption says "as patients join", which starts at month 9, and does not say every month adds patients. |
| `tlScale`, `tlScaleMore`: three scales | People: patients and matches against the patients' maximum (2,806). Euros: income run rate and drop against income's maximum (€228,923). Diagnoses: its own maximum (9.8). That is the CTO's rule; no sentence says the lines share one scale. |
| Real ratios that survive inside a unit (for the readout, not typed) | Matches end at 1,137 / 2,806 = 40.5% of the patients' height; the drop ends at 88,043 / 228,923 = 38.5% of income's height. |
| `tlEuroNote`: "Each case is paid once" | Plan: one paid case is one new patient (file `patients.formula`, per-case only). |
| `tlEuroNote`: "average spending per inhabitant for {geography}" | `euro.total_eur_per_inhabitant` = 4,074.88; `euro.geography` = "EU-27"; `drop_eur.per_inhabitant_eur` = 4,074.88. Filled: "…on the average spending per inhabitant for EU-27." |
| `tlFormula` at month 24 | 0.77 points ÷ 100 × €4,074.88 × 2,806 patients = €88,043 (0.0077 × 4,074.88 × 2,806 = 88,042.7; file 88,043). |
| `tlDescPatients`, `tlDescDx`, `tlDescDrop`, `tlDescIncome` at month 24 | 2,806 patients; 9.8 a year; €88,043 a year; €228,923 a year (plan). |

### 8.3 Wording check

No "saved", "saves", "savings", "will", "result", "proves", "anonymous" and no exclamation mark in the table of 8.1 (checked by regex). "Assume" or "assumption" is in `tlIncomePlan`, `tlRampPerCase`, `tlAssumeDx`; the 10% and the 20% are not restated in this block, and where they appear (section 6.3) "assumption" stays in the same sentence. "Income: our plan, not a measurement" and the two assumption lines stay on the card. The label "Plan months on synthetic records. A plan and a model, not a measurement" (`label` in the file) stays. Money appears only as a yearly figure ("a year"), never a running total (condition 10); the € line is `income_run_rate_eur`, never `income_eur`.

## 9. `/simulation` as one diagram with a plan-month slider (MIN-4749; spec A15)

Source: Anna, MIN-4723 comment 9e14b7f0 (the `g*` table, column M unless marked), Pix's A15 for the four band and state keys, the CTO's one line on MIN-4744. The page reads every figure from `ten_years` in `data/synthetic/simulation.json`; the strings below take them as arguments. Section 8 (`tl*`) is retired with the animated card. Code: `src/features/matches/copy.ts` (`g*`), the diagram `SimDiagram.tsx`. Not yet confirmed by Anna: every row marked **Ren, confirm**.

| Key | String | Status |
|---|---|---|
| `gTitle.drop` / `.saved` | What matching could change in Greece, year by year / What matching could save Greece, year by year | Anna. The CEO seat picks (MIN-4746); the code switch is `DIAGRAM.money` |
| `gCaption.drop` | Plan years {first} to {last}, on synthetic records and a plan. Move the slider to see, at any month, how many patients have joined, how many records find a match, how many diagnoses go right instead of wrong or missed, what that is worth in Greek health spending in the model, and our planned income. | Anna's text; "for one year" became "at any month" because the slider moves by month. **Ren, confirm** |
| `gCaption.saved` | the same, ending "…how much money it could have saved in Greek health spending, in the model, and our planned income." | as above |
| `gSliderLabel` | Plan year | Anna |
| `gSliderValue` | Year {year}, month {month} | CTO (aria-valuetext) and Pix; also the `<output>` text |
| `gSliderAria` | Plan year, from {first} to {last}. The numbers below show that point in the plan. | Anna's text, "that year" became "that point in the plan". **Ren, confirm** |
| `gHead.patients`, `.matches`, `.dx`, `.income` | Patients in the network, Records with a match, Correct diagnoses gained, Our income | Anna |
| `gHead.money.drop` / `.saved` | Modelled drop in cost in Greece / Money that could be saved in Greece, in the model | Anna; CEO seat picks. The `saved` head and column carry "in the model" (CTO fix C, ruling 3: "saved" is never bare) |
| `gTag.*` | Plan, Model, Computed on synthetic records | Anna. Records with a match reads "Computed on synthetic records" up to `measured_until_month` and "Model" after it (CTO MIN-4744 section 1) |
| `gSuffix.yearly.*` | a year, plan (income), a year, in the model (diagnoses), a year (money) | Anna |
| `gSuffix.total.*`, `gHelp.dx.total`, `gCol*.total` | in total since the start, plan / in the model | **Ren, confirm**; used only if the CEO seat picks the running total (`DIAGRAM.basis = 'total'`) |
| `gHelp.dx.yearly`, `gHelp.money` | Fewer wrong or missed diagnoses a year, in the model. / Cost of wrong or missed diagnoses that the model removes, on {year} spending. | Anna |
| `gBandPlan` | Plan: years 1 to {planYears} | Pix (NEW key) |
| `gBandAssumed` | After plan year {planYears}: income held flat, not in the plan | **Ren, confirm.** Pix's text was "Assumed growth, not in the plan: 40% a year"; the CTO's rule on MIN-4744 holds revenue flat, so there is no growth rate to print |
| `gStatePlan` | In the plan | Pix (NEW key) |
| `gStateAssumed` | After the plan: income held flat | **Ren, confirm** (same reason) |
| `gScale`, `gScaleMore`, `gScaleTop` | the three sentences of 8.1 (`tlScale`, `tlScaleMore`, `tlScaleTop`), unchanged | Anna |
| `gScaleEuro` | The plot shows euros only, on one scale that starts at zero. Patients, records with a match and diagnoses are in the list. | **Ren, confirm**; used only if the CTO picks the euro-only plot (`DIAGRAM.plot = 'euro'`) |
| `gFact` | For scale: {geography} spent {total} on health in {year}, {perInhabitant} for each inhabitant. | Anna's recommended A; it replaces the EU-27 figure |
| `gAssumeVisits`, `simAssumption` | the existing lines (6.3, `tlAssumeDx`) | unchanged |
| `gIncomePlan` | Income: our plan to year {planYears}, then held flat. Not a forecast. | CEO seat, MIN-4746 comment 88b0c07c (condition 12); replaces "Income: our plan, not a measurement. Every price and volume is an assumption." Anna confirms after staging (MIN-4745) |
| `gAssumeStay` (NEW) | Assumption: no patient leaves the network, and the effect applies every year. | CEO seat, same comment (condition 15); sits next to `gAssumeVisits`, visible without a tap |
| `gTotal.money` / `.dx` | {value} added up since month {first}, in the model | CEO ruling 4, CTO fix A. Under the money, diagnoses figures; read from `ten_years.*.total.values`. Money keeps this wording when `DIAGRAM.money = 'saved'` ("saved" is never put on a total). Not shown when `DIAGRAM.basis = 'total'` |
| `gTotal.income` | {value} added up since month {first}, plan | as above |
| `gColDxTotal`, `gColMoneyTotal`, `gColIncomeTotal` | Diagnoses added up, Modelled drop added up, Income added up | CTO fix A: the three total columns of the values table |
| `gColMoney.saved` | Could be saved a year, in the model / Modelled drop in total | CTO fix C; the bare "Saved a year" / "Saved in total" are gone |
| `gAssumeShare` | The cost share is an OECD model estimate for a typical OECD country, about {share} of health spending. It is not a Greek measurement. | Anna. `{share}` is read from the file's formula for series 3 |
| `gPlateau` | Past {records} records (month {month}) the matches and their effect are held at the {records}-record values; past year {planYears} the plan's revenue is held flat. | CTO, MIN-4744 section 1, word for word |
| `gBase`, `gFormula` | Spending base: {geography}, {year}, {perInhabitant} per inhabitant, {total} a year in all. / {points} points × {perInhabitant} × {patients} patients = {amount} a year | Anna. The formula is always the yearly figure at the slider's month |
| `gSourceLead`, `gBaselines` | Health spending: {link}. Baselines applied: {links}. | **Ren, confirm.** Anna's single `gSource` sentence is split so each source is a link read from the file |
| `gShowValues`, `gTableCaption`, `gCol*` | Show the values; Every plan year, at its last month, the same figures as the diagram.; column heads | **Ren, confirm** (table of ten rows) |
| `gDesc` | One diagram, plan year {year}, month {month}, synthetic model. Patients: {n}. … A model and a plan, not a measurement. | Anna's text with the month added |
| `simLabel` | Simulation on synthetic data. A model, not a measurement | fixed by the CTO, never rewritten |
