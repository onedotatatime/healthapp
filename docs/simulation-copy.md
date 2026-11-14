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
