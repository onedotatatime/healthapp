# Pitch numbers: wrong diagnoses, wasted tests, "Dr Google", and what we can save

Anna Lytica (marketing-minhos), 2026-11-14, MIN-4503 (parent MIN-4467). Lean pass for today's pitch.

The founder's framing: *"We need to focus not just to digitizing the paper exams. This is to help people * To get rid of their "google is my doctor" habit * Save the industry lot's of money by helping doctors make the best decisions"* and *"So we need to find numbers to add to the pitch of how much wrong diagnoses per year, how much money we can save"*.

Labels: **verified** = I read the number in the primary source myself. **secondary** = read in a report or article quoting the primary. **unverified, do not use** = not found in a primary. **our estimate** = our arithmetic on sourced inputs; every assumption is marked.

Already verified in `market-and-competitors.md` §1 and §4, and not repeated here: WHO 2023 (diagnostic errors in 5 to 20% of encounters), AHRQ 5.08% US outpatient, NAM 2015, the repeat-test evidence, and the EOPYY repeat-test limits (`treg-findings-2026-11-14.md`).

---

## Top 6 for the slides (ready to paste)

1. **Up to 15% of diagnoses are inaccurate, delayed or wrong.** [OECD, Health Working Paper No. 176, March 2025, verified]
2. **Diagnostic error eats 17.5% of health spending in a typical OECD country, about 1.8% of GDP. Halving it would free 8%.** [OECD 2025, verified]
3. **Applied to Greece: about €3.5 billion a year of the €19.9 billion we spend on health (2024).** [our estimate: OECD 17.5% × Eurostat Greek current health expenditure 2024]
4. **In the US, about 795,000 people a year die or are permanently disabled because a dangerous disease was misdiagnosed.** [Newman-Toker et al., BMJ Qual Saf, Jan 2024, verified]
5. **Half of Greeks (51%) look up their health online. Symptom checkers put the right diagnosis first only 34% of the time.** [Eurostat ICT survey 2025, verified; Semigran et al., BMJ, July 2015, verified]
6. **Even AI does not fix "Dr Google": people using ChatGPT-class models found the right condition in fewer than 34.5% of cases, no better than searching on their own. The models alone got 94.9%. What was missing was the patient's information.** [Bean et al., Nature Medicine, Feb 2026, verified]

Speaker note for 6: the study found people gave the model incomplete or wrong information. That is our point. The answer is not a smarter chatbot, it is the complete record in front of the doctor.

---

## 1. Wrong diagnoses: how many, and what they cost

| Fact | Number | Label | Source, date |
|---|---|---|---|
| Share of diagnoses inaccurate, delayed or wrong | up to 15% (depends on the setting) | verified | OECD, *The Economics of Diagnostic Safety*, Health Working Paper No. 176, DELSA/HEA/WD/HWP(2025)4, March 2025, abstract and ¶1. https://doi.org/10.1787/fc61057a-en |
| Direct cost of diagnostic error (misdiagnosis + overdiagnosis + underdiagnosis) | 17.5% of total health expenditure; about 1.8% of GDP in a typical OECD country. Breakdown: misdiagnosis about 11%, overdiagnosis and overtreatment about 5.5%, underdiagnosis about 1% | verified | same, abstract and ¶130 to ¶133 |
| Savings from halving diagnostic error | 8% of health expenditure (assumes improvement costs 0.8%); about USD 676 billion across OECD countries; 13% if the 80% considered preventable were prevented | verified | same, abstract and ¶238 |
| US cost of diagnostic error | about USD 870 billion a year | verified (OECD's own extrapolation) | same, ¶4 and ¶133 |
| Preventable share | about 80% of harm from delayed or wrong diagnosis may be preventable; most people will have at least one diagnostic error in their lifetime | verified | same, ¶3 |
| US serious harms from misdiagnosis | 795,000 a year die or are permanently disabled (plausible range 598,000 to 1,023,000; 549,000 under conservative assumptions). OECD splits it as 371,000 deaths and 424,000 permanent disabilities | verified (PubMed abstract) | Newman-Toker DE et al., *Burden of serious harms from diagnostic error in the USA*, BMJ Qual Saf 2024;33(2):109-120, published 19 Jan 2024 (online July 2023). https://doi.org/10.1136/bmjqs-2021-014130 ; PubMed 37460118 |
| Concentration | 15 diseases make about half of serious harms; stroke, sepsis, pneumonia, venous thromboembolism and lung cancer make 38.7% | verified | same |
| US diagnostic errors per year | about 2.6 million | secondary (OECD quoting) | OECD 2025, ¶4 |

**Europe and Greece.** I found no primary count of wrong diagnoses per year for the EU or for Greece. The OECD paper gives ratios for "a typical OECD country", not per-country figures. For Greece, the defensible move is to apply the OECD ratio to Greek spending (slide 3) and label it as our estimate.

## 2. Waste from repeated and unnecessary tests

| Fact | Number | Label | Source, date |
|---|---|---|---|
| Unnecessary investigations, typical OECD country | 25 to 30% of investigations unnecessary; direct cost about 2.5% of health expenditure | verified | OECD 2025, ¶131 |
| Repeat lab tests in hospital (Netherlands) | repeat testing of normal results in up to 85% of patients; 5.7 lab orders in the first week | secondary (OECD quoting Vrijsen et al. 2020) | OECD 2025, ¶113 |
| Lab results drive decisions | lab results influence 60 to 70% of downstream medical decisions | secondary (OECD quoting Shaik et al. 2024) | OECD 2025, ¶113 |
| Low-value lab tests, Canada | 16 to 56% of lab tests ordered give little or no clinical value | secondary (OECD Box 4.1, Choosing Wisely Canada) | OECD 2025, Box 4.1 |
| A shared longitudinal record cuts duplicate imaging | providers who used the record viewer ordered fewer duplicate images: odds ratio 0.44 (95% CI 0.24 to 0.78) | verified (PubMed abstract) | JMIR Med Inform 2022;10(5):e32168, 20 May 2022, US VA/DoD Joint Longitudinal Viewer. https://doi.org/10.2196/32168 ; PubMed 35594070 |
| Greek current health expenditure, 2024 | €19,869M total; €12,045M government and compulsory schemes; €6,804M out of pocket | verified (Eurostat API, dataset hlth_sha11_hf, updated 4 Nov 2026) | https://ec.europa.eu/eurostat/databrowser/view/hlth_sha11_hf/default/table |
| Greek stand-alone ancillary services (lab, imaging, other), 2024 | €810M (imaging €547M, lab €130M). This counts only tests billed on their own; tests inside hospital stays are not in it, so it is a floor | verified (Eurostat API, dataset hlth_sha11_hc, HC4) | https://ec.europa.eu/eurostat/databrowser/view/hlth_sha11_hc/default/table |
| "One fifth of health spending is wasteful" (OECD 2017) | about one fifth | secondary (commentary; already in `market-and-competitors.md`) | OECD 2025 says the same thing in its own words, verified: "close to a fifth" of health spending goes on harm from diagnostic error (¶133). Prefer the 2025 line. |

**Still no euro figure for duplicate tests specifically**, in Greece or the EU. Do not put one on a slide. Use the OECD 25 to 30% and 2.5% lines.

## 3. "Dr Google"

| Fact | Number | Label | Source, date |
|---|---|---|---|
| Greeks (16 to 74) who looked for health information online in the last 3 months | 51.1% in 2025 (59.6% in 2024, 48.7% in 2023) | verified (Eurostat API, isoc_ci_ac_i, I_IHIF, % of individuals, updated 17 Apr 2026) | https://ec.europa.eu/eurostat/databrowser/view/isoc_ci_ac_i/default/table |
| Same, EU27 | 60.3% in 2025, the highest yet (58.2% in 2024) | verified | same |
| Online symptom checkers, accuracy | right diagnosis first in 34% (95% CI 31 to 37%); in the top 20 in 58%; right triage advice in 57%, and only 33% for self-care cases. Authors: deficits in both triage and diagnosis | verified (PubMed abstract) | Semigran HL et al., BMJ 2015;351:h3480, 8 July 2015. https://doi.org/10.1136/bmj.h3480 |
| Symptom checkers, systematic review | diagnostic accuracy low and almost always below the clinician comparator; 9 of 13 studies found triage accuracy suboptimal | verified (PubMed abstract) | J Med Internet Res 2023;25:e43803, 2 June 2023. https://doi.org/10.2196/43803 |
| LLM chatbots used by the public | 1,298 UK participants, 10 scenarios: with GPT-4o, Llama 3 or Command R+ they found relevant conditions in under 34.5% of cases and the right course of action in under 44.2%, no better than control. The models alone: 94.9% and 56.3% | verified (PubMed abstract) | Bean AM et al., Nature Medicine 2026;32(2):609-615, epub 9 Feb 2026 (erratum May 2026). https://doi.org/10.1038/s41591-025-04074-y |
| Health anxiety and "cyberchondria" | meta-analysis of 20 studies, 7,373 people: health anxiety correlates with online health searching (r = 0.34) and strongly with cyberchondria (r = 0.62) | verified (PubMed abstract) | McMullan RD et al., J Affect Disord 2019;245:270-278, 15 Feb 2019. https://doi.org/10.1016/j.jad.2018.11.037 |

## 4. Savings estimate for the pitch (our estimate, not a sourced figure)

**Formula:** savings per year = cost base × share avoidable × share we prevent × adoption

**The whole prize (context, not our claim):** Greek health spend €19.87bn × OECD 17.5% = **about €3.5bn a year** is the direct cost of diagnostic error in Greece. Halving it, per OECD, frees 8% = **about €1.6bn a year**.

**Our slice: unnecessary and repeated tests.**

| Input | Conservative | Upside | Status |
|---|---|---|---|
| Cost base | €810M: Greek stand-alone lab and imaging, 2024 | €497M: OECD's 2.5% of spend on unnecessary investigations × €19.87bn | conservative verified (Eurostat); upside = OECD ratio applied to Greece |
| Share of those tests that are unnecessary | 25% (OECD low end) | already in the base | verified (OECD) |
| Share we prevent by putting the full history in front of the doctor | 20% | 50% | **assumption**. The upside is anchored to the VA/DoD finding (odds of a duplicate image 0.44 with a shared record), which is about duplicates, not all unnecessary tests |
| Adoption (share of tests where the patient brings the record) | 10% | 30% | **assumption** |
| **Savings per year** | 810 × 0.25 × 0.20 × 0.10 = **about €4M** | 497 × 0.50 × 0.30 = **about €75M** | our estimate |

Say it as: *"On tests alone, between €4M and €75M a year in Greece, depending on adoption. The bigger prize is diagnostic error itself: about €3.5bn a year."* Do not present €75M without the word "upside" and the adoption assumption.

## 5. Not found, or do not use

- A count of wrong diagnoses per year for Greece or the EU: none in a primary source.
- A euro figure for duplicate tests in Greece or the EU: none.
- The OECD 2017 "one fifth wasteful" line: only via commentary; use the OECD 2025 "close to a fifth" line instead.
- Greek-only symptom-checker or cyberchondria data: none found.
- The 11.2% vs 6.1% duplicate-imaging split in `market-and-competitors.md` is still secondary; the verified number from the same research line is the odds ratio 0.44.
- Access notes: oecd.org, bmj.com and qualitysafety.bmj.com refused automated fetches (HTTP 403). The OECD paper was read in full from a copy of the official PDF (OECD DOI and document code on the title page, OECD Publishing metadata, created 26 Mar 2025). The journal figures were read in the PubMed abstracts through NCBI's API. Eurostat figures came straight from the Eurostat API.
