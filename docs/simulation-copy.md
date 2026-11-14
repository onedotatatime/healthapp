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

## 6. The euro outcome and the match-by-match wording (MIN-4604, decided on MIN-4605)

Owner: Marketing (Anna). Candidates checked 15 Nov 2026. Status: **approved by the CEO seat on the founder's behalf, 15 Nov 2026 (MIN-4605), with conditions 1 to 8**.

Source of this section: Anna's MIN-4604 comment 61ae9259 (her sections 1, 4 and 5, as written) and the CEO seat's fills in MIN-4605 comment de26aa96 (section 3). Her comment names the block under "Paste-ready"; that heading is not in the posted text, so this section is assembled from those sections. Anna checks it against her comment.

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

Amount writing: billions with one decimal ("€13.6 billion"), millions with none ("€147 million"), per inhabitant with none ("€30"); the total in the formula with a thousands comma ("€1,834 billion"); "EU-27" as geography; year as four digits; "a year" always present. The word "saved" is deliberately not used: the counter says "drop", not "saved".

Filled for the last frame (CEO seat): "In this model, the cost of wrong or missed diagnoses is €13.6 billion a year lower for EU-27, on 2024 spending." Formula: "0.74 points of health spending × €1,834 billion (EU-27, 2024) = €13.6 billion a year". Second line: "€30 per inhabitant a year". Source line: "Health spending total: Eurostat, current health expenditure, EU-27, 2024." with Anna's link.

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

Notes (Anna): the "Modelled drop so far" counter shows the drop at the current network size as a yearly figure, so it grows as matches accumulate; it is not money adding up over several years, and the screen must not suggest so ("a year" stays next to it). The assumption line contains "assumption"; the permanent label stays visible, and the 20% appears as the ceiling, always with "assumption" in the same sentence. No study is attached to the start or the ceiling. Never "anonymous"; none of the strings uses it. No exclamation mark.

### 6.4 Conditions (CEO seat; 1 to 3 are the MIN-4506 ones)

4. The euro figure is on screen only together with series 3's chart (axis from zero), the formula line, the source line and the permanent label.
5. The euro sentence has "model" or "assumption" in it. Never "saved", "saves", "savings" or "will". The 10% follows the same rule as the 20%: never without "assume", "assumed" or "assumption" in the same sentence, and no study attached.
6. The arithmetic on screen checks out at the precision shown: the euro values come from the published two-decimal cost (0.74 × €1,834 billion = €13.6 billion).
7. Nothing says the matching software learns today. Asked "does it learn?": "Not in this prototype. The curve is our assumption of what a learning matcher would do. A pilot with doctors would measure it."
8. The cost caption "In the model, each step lowers the cost more than the one before." is false on the data and is not shown.
