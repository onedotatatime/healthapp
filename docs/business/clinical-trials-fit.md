# Pathien and the Clinical Trials Challenge: can we fit?

| | |
|---|---|
| **Owner** | Anna Lytica (Marketing), MIN-4503 |
| **Date** | 15 Nov 2026 |
| **For** | The founder, who asked, verbatim: "Create a summary for me to explain if we can fit to find patients eligible to a clinical trial when we have their concent to process their data" |
| **Challenge** | Athens LifeHack, The Clinical Trials Challenge (Athens LifeTech Park). Text as the founder shared it: `clinical-trials-challenge.md` in the coordinator's scratchpad (Google Doc "ALTP_Clinical_Trials_Challenge_draft (3)") |
| **Status** | Draft for the founder. Nothing sent. Trial matching is not built (the record, the diary and values over time are, on synthetic data). Section 8 added 15 Nov 2026 for deck v3.9. Legal points are flagged for a lawyer or regulator; none of them is legal advice. |

## Bottom line

**Yes, partly, and only on Topic 2.** The record we already extract, on synthetic data, is lab values with units, printed reference ranges and dates, plus the document's written findings. Many trial eligibility criteria are written in exactly those terms. With a separate consent, that record could be pre-screened against a trial's published criteria, and a person (the patient's doctor or the trial's investigator) decides. What we do **not** have is the hard part: turning trial criteria into checkable rules, a matching engine, and the clinical facts our documents rarely hold. This is direction 5 ("real matching") at its most concrete, with a buyer (sponsors and CROs) who already pays for recruitment.

## 1. Can we fit? Verdict per topic

| Topic | Verdict | Why |
|---|---|---|
| **1. Protocol design** | **No** | Simulating criteria, endpoints and amendment risk needs historical trial data and protocol expertise we do not have. One later link: a consented, unnamed count of "how many of our patients would pass these criteria" is feasibility input, but that sits under Topic 2. |
| **2. Patient selection and recruitment** | **Partly today, yes as our next step** | See below. |
| **3. Patient experience** | **Partly** | The symptom diary takes the patient's own words with time and a 1 to 10 severity, and we read documents in Greek and English. It is not a validated patient-reported outcome instrument, there are no wearables, and the diary does not detect side effects. Worth one sentence in a submission, not the pitch. |
| **4. Monitoring** | **No** | Risk-based monitoring, data cleaning and safety signals happen inside the sponsor's and site's trial systems. We are not in that loop. |

**Topic 2, in depth.** The challenge lists six things in scope. Where we stand on each:

- **Automated patient-to-trial matching from structured data and notes:** our strongest fit. Lab criteria are common in eligibility text ("ALT up to 3 times the upper limit of normal", "eGFR of at least 30", "HbA1c between 7% and 10%"). We store the value, the unit and the lab's own printed range, so a criterion tied to the upper limit of normal can be checked against the range on that patient's own report. Written diagnoses and medications we hold only as the document's text, not as codes.
- **Patient-facing tools to find trials and understand eligibility:** fits the product's patient side, under the founder's rule "route to the doctor": the patient sees that a trial may be worth asking about, and the conversation happens with their doctor.
- **Privacy-preserving approaches:** fits our design. Opt-in is off by default, consent is logged with its wording, access is time-limited, and the PRD (§10.B.5) already proposes a per-region index between hospitals and federated counts across regions. None of it runs for trials yet.
- **Under-represented populations, more diverse enrolment:** plausible, unproven. A record the patient holds can reach people treated outside the large hospital networks that sponsors usually recruit from. We have no evidence of that yet.
- **Site performance prediction, recruitment forecasting:** no.

## 2. How it would work, with the patient's consent

1. **The patient opts in to trial matching.** A separate switch and a separate consent from care and from "possible matches" (slide 7). Off by default, and withdrawable at any time.
2. **Criteria come from public registries.** ClinicalTrials.gov (US National Library of Medicine, which has a public API) and the EU's Clinical Trials Information System (CTIS), whose public search is "Clinical Trials in the EU" under the Clinical Trials Regulation (EU) No 536/2014. Eligibility there is mostly free text, so each trial's criteria are turned into rules and **a person reviews those rules** before they run.
3. **The patient's structured record is checked against them:** labs, values against ranges, dates, document kinds, and the written findings. Each criterion comes back as **met, not met or unknown**, with the source document cited. "Unknown" is the honest default for anything our documents do not say.
4. **The result goes to the patient's doctor, or to the trial site, as "possibly eligible, to be confirmed by the investigator".** Never a diagnosis, never an automatic enrolment. Until the patient agrees to be contacted, a site sees at most an unnamed count.
5. **The patient decides whether to be contacted.** Only then does the site get a named referral. The investigator screens as usual, with fresh tests.

## 3. What we have today, and what is missing

**Have (real, on synthetic data only):** photo to a fixed schema (document kind, issuer, exam date, values, units, printed ranges, out-of-range flag computed by our code, written findings in the document's own words); identity match; opt-in that is off by default and logged; time-limited doctor access by QR; a signed, hash-chained log of fingerprints and grants; cited answers for the doctor.

**Missing:**
1. **Criteria into rules.** Natural-language processing of eligibility text into checkable logic, with human review. This is a research field of its own.
2. **A matching engine** that handles units, time windows ("within 28 days of screening") and the met / not met / unknown result per criterion.
3. **The facts our documents rarely hold:** coded diagnoses (ICD-10, SNOMED), a current medication list, cancer staging, performance status (ECOG), prior lines of therapy, genetic markers, pregnancy status. We see lab reports, imaging reports and doctors' letters, and old ones at that.
4. **The clinician in the loop:** a workflow for the patient's doctor or the site to review, confirm and record the outcome.
5. **Validation on real data:** how often our "possibly eligible" matches the investigator's final answer, measured in a pilot with ethics approval.

## 4. Legal and regulatory, carefully

| Point | What we can say | Needs |
|---|---|---|
| **GDPR, Article 9** | Health data is a special category. The working basis would be the patient's **explicit consent for this purpose**, separate from the consent for their own record and care (purpose limitation, Article 5(1)(b)). | Lawyer: confirm the basis, the wording and how withdrawal is handled. |
| **DPIA (GDPR Article 35)** | Large-scale processing of health data for matching calls for a data protection impact assessment before any real record. Our funding plan already puts the DPIA first. | Data-protection officer and lawyer. |
| **Automated decisions (GDPR Article 22)** | A person (doctor or investigator) decides eligibility, and the patient decides contact, which we expect keeps us outside "solely automated" decisions. | Lawyer: confirm. |
| **Is pre-screening a medical device (EU MDR)?** | The tool must not give clinical conclusions about the patient. It reports which published criteria the record meets, does not meet or cannot tell, and an investigator decides. Whether trial matching has a "medical purpose" under the MDR is not settled by us. | **Regulator or regulatory adviser** (the same check as PRD Q18). |
| **Recruitment contact** | Under the Clinical Trials Regulation, recruitment arrangements and materials are part of the application assessed by the ethics committee, and sponsors set their own rules on who may contact patients. Our referral has to fit each trial's approved route. | Sponsor, ethics committee, lawyer. |
| **EHDS** | The European Health Data Space names research as a secondary use through health-data access bodies. Our route is stricter: individual opt-in. | Lawyer: whether EHDS applies to us at all. |

## 5. The five submission questions, first draft

1. **The problem, and why it is unsolved.** Patients who could join a trial are never found, because the facts that decide eligibility sit in paper and PDF results scattered across labs and doctors, and nobody holds them in one place. Matching still depends on manual chart review inside one hospital's own records, as the challenge says, so a patient treated elsewhere is invisible to the site.
2. **How it is managed today, and where it fails.** Site staff read charts by hand against the protocol, investigators use their own networks, and sponsors buy hospital-network matching. It fails for patients whose history is outside that hospital: their old results are not in the system to be read. *Figures for chart-review hours and enrolment shortfall need sources before we use them; we have none checked.*
3. **Who else works on this** (all to **check** before submission). Companies: Clinerion (hospital-network matching for trial recruitment, already in our research, with a Greek hospital group in its network), TriNetX, Deep 6 AI, Antidote (patient-facing trial search). Research: NIH National Library of Medicine's TrialGPT (patient-to-trial matching with large language models), Columbia University's Criteria2Query (eligibility text into database queries). Our difference to state: the record comes from the patient, across providers, with the patient's consent, rather than from one hospital's system.
4. **What it does, on what data, what it has shown.** Today: it reads photographed lab reports, imaging reports and letters into a fixed schema with values, units, ranges and dates, on **synthetic data only**, with consent and time-limited access working. Trial matching is **not built and has shown nothing yet**.
5. **What success looks like.** For one trial at one site, on consenting patients, measured against the investigator's own screening: (a) the share of patients the investigator found eligible that our pre-screen had flagged; (b) chart-review hours per patient screened, against the site's current figure; (c) days from the trial opening to the first eligible consenting patient identified. Targets to be set with the site; we have no baseline.

## 6. Fit with the goal

This is direction 5's most concrete use. "Possible matches" (slide 7) connects a patient to doctors with similar cases; trial matching connects the same consenting patient to a study, and it has a buyer. The payer would be **sponsors and CROs, never the patient**: a service fee per matched study is the model in our buyer research (`buyers.md` §1.10). A price is proposed in section 8 (assumptions, to be validated with a sponsor). Our funding plan funds the consent design for direction 5 this round, not a matching product (`team-and-funding-plan.md`), so trials would be the reason to fund the next step, not this one.

## 7. Risks

- **Coverage.** Our records are thin on what trials ask most (diagnosis codes, medications, staging). Many criteria will come back "unknown", and that is the honest answer.
- **Stale data.** A two-year-old lab result says little about eligibility today. We pre-screen; the site re-tests.
- **Bias.** If our users are the most digitally able patients, we make enrolment less diverse, not more. Measure who opts in.
- **Consent fatigue.** A third consent (care, possible matches, trials) may be one too many. The wording and the moment it is asked need testing with patients.
- **False hope.** "You may be eligible" can read as a promise of treatment. Route it through the doctor, and say plainly that most people pre-screened are not enrolled.
- **Crowded market.** Hospital-network players already sell this to sponsors. We must show what the patient-held record adds, not claim to be first.

## 8. Recruitment economics and pricing (added 15 Nov 2026, deck v3.9; updated in v4.0 for slide 7c, now 6c; cards rebuilt in deck v4.5)

The founder, verbatim: *"Connect with revenue from trial clinics (find data from treg to see how difficult and expensive is recruitment and calculate how we can charge)"*. Researched with treg (three cited web answers, $0.0053 in total) and direct reads of the sources below. Labels: **verified** (primary source read), **secondary** (a reputable report of a primary source, or a trade article by the study's author), **vendor claim** (a company's own figures), **unverified, do not use**.

### How hard and how expensive recruitment is

| # | Number | Label | Source, date read 15 Nov 2026 |
|---|---|---|---|
| 1 | **About $40,000 a day** in direct costs to run a phase 2 or 3 trial (phase 2 $23,737, phase 3 $55,716, phase 1 $7,829). This is the cost of one day of delay to a sponsor, before lost sales. | verified | Tufts CSDD white paper, Aug 2024: https://csdd.tufts.edu/sites/default/files/2025-02/Aug2024%20Day%20of%20Delay%20White%20Paper%20Final.pdf |
| 2 | Lost sales of about $800,000 a day (white paper) or about $500,000 (the peer-reviewed version, Smith, DiMasi and Getz, Ther Innov Regul Sci 2024) | secondary, **not used**: the two versions disagree | https://doi.org/10.1007/s43441-024-00667-w |
| 3 | In a typical trial, **11% of sites enrol no patient**, 37% under-enrol, 39% meet target, 13% exceed (150+ studies, about 16,000 sites) | secondary, old (2013) | Tufts CSDD Impact Report Jan/Feb 2013, via FierceBiotech: https://www.fiercebiotech.com/biotech/new-research-from-tufts-center-for-study-of-drug-development-characterizes-effectiveness-0 |
| 4 | **19%** of 2,579 phase 2 and 3 trials closed in 2011 ended early for poor accrual or below 85% of expected enrolment; 48,027 patients enrolled in trials that could not answer their question | verified | Carlisle et al., Clinical Trials 2015;12(1):77-83: https://pmc.ncbi.nlm.nih.gov/articles/PMC4516407 |
| 5 | **36.3%** of screened patients fail screening in phase 2 and 3 trials (2016 to 2019; 34.7% in 2012); neuroscience 57%; dropout 19.1% | secondary | Getz (Tufts CSDD), Applied Clinical Trials, Dec 2019: https://www.appliedclinicaltrialsonline.com/view/can-recruitment-and-retention-get-any-worse |
| 6 | 53% of studies run longer than planned enrolment | secondary, old (2012); not used on a slide | Applied Clinical Trials, May 2012, via treg answer: https://www.appliedclinicaltrialsonline.com/view/enrollment-performance-weighing-facts |
| 7 | A pivotal trial spends a **median $41,117 per patient** in total (138 trials, 59 drugs approved 2015 to 2016; median trial about $19M) | secondary (peer-reviewed, read via two summaries) | Moore et al., JAMA Intern Med 2018, via RAPS: https://www.raps.org/resource/phase-3-trial-costs-estimated-at-19m-study-finds.html and AJMC: https://www.ajmc.com/view/more-than-100fold-cost-differences-found-for-pivotal-trials |
| 8 | Recruitment cost per randomised patient from **$577**, average **$1,379** across one vendor's own case studies; named cases $1,818 and $2,000 | vendor claim | ClinicalEnroll: https://clinicalenroll.com/resources/guides/digital-recruitment-for-clinical-trials |
| 9 | Pre-screened referrals at $20 to $50 each plus a subscription; ad leads $20 to $45 | **unverified, do not use** (vendor pages; the referral page returned 429 when opened) | https://www.allclinicaltrials.com/researchers ; https://www.dataally.ai/blog/best-clinical-trial-patient-recruitment-companies |
| 10 | "$1,500 to $10,000 recruitment cost per patient"; "80% of trials miss enrolment timelines" | **unverified, do not use** (widely repeated, no primary found) | none |

| 11 | Patient recruitment costs **per study**: phase 2 **$161,140**, phase 3 **$308,672** (1.7% to 2.7% of trial costs; site recruitment is a separate line). About one year of recruitment per phase. EHR-based recruitment modelled at **35.9% lower recruitment cost per patient**, 12.3% fewer patients to enrol, and **$0.46M to $2.53M saved per phase 3 study** (3.1% to 8.8% of its cost) | verified (primary PDF read; deck S29) | ASPE, Sertkaya et al., Eastern Research Group, 25 Jul 2014, Table 2, §5.1, Table 4: https://www.aspe.hhs.gov/sites/default/files/migrated_legacy_files/44516/rpt_erg.pdf |
| 12 | Weighted average patients per trial: phase 2 **235**, phase 3 **630** | verified (primary PDF read; deck S30) | ASPE, *Drug Development* final report, Sertkaya and Berger, 26 Sep 2024, Table 4: https://aspe.hhs.gov/sites/default/files/documents/ba3c3c99877862bac0b1d04460ad01b1/drug-development.pdf |
| 13 | **1,497** industry-sponsored phase 2 or 3 interventional trials recruiting with at least one EU-27 site (710 phase 2 only, 787 phase 3 or 2/3), planning **776,650** participants (global enrolment; median 240). All sponsors: 3,003 | verified (our registry query, 15 Nov 2026; changes daily; EU CTIS not queried; deck S31) | ClinicalTrials.gov API v2: https://clinicaltrials.gov/data-api/api |

**The gap is closed, with a caveat (v4.0).** Recruiting one participant costs about **$500 to $700** in the recruitment line: $161,140 ÷ 235 ≈ $690 (phase 2), $308,672 ÷ 630 ≈ $490 (phase 3). **Our estimate**: rows 11 and 12 are two ASPE reports ten years apart, and 2014 dollars are not inflated. It is the recruitment line only (adverts, outreach); staff time for screening sits in other lines, so the true cost is higher. Row 8's vendor figures ($577 to $2,000, average $1,379) are digital campaigns and sit above it.

### The three cards on slide 6c (v4.0, rebuilt in deck v4.5)

**v4.5 (15 Nov 2026).** The founder, verbatim, asked of the v4.4 cards ($360M and $200,000): *"does 360m is the whole and the 200000 is per trial?"*, then: *"You need to be clear with the numbers and compare the same thing"*. The v4.4 cards mixed a market total over the life of 1,497 trials (a recruitment budget, in dollars), a per-trial running-cost saving (in dollars) and our per-trial fee (in euros). The cards now compare one quantity, the cost of recruitment time, for one trial in one country, in euros at $1.10 to €1 (assumption), and chain: €36,000 a day → 5 × €36,000 = €180,000 saved → our €24,000 fee, the sponsor keeps €156,000.

**Why not the recruitment budget per trial.** $357M ÷ 1,497 ≈ $240,000 is the whole trial's recruitment line, worldwide. ASPE's 35.9% lower cost per patient (row 11) on about 19 patients in one country saves under €5,000 (about $690 or $490 per patient × 35.9% × 19; our estimate), less than our fee. The value to a sponsor is the days, so the cards use the cost of a day.

**Market context, not on the slide (deck A3):** 1,497 trials, 776,650 participants (row 13). Their recruitment budget: 710 × $161,140 + 787 × $308,672 ≈ $357M ≈ €325M over the life of those trials, not per year (rows 11, 13). If each finished 5 days sooner: 1,497 × €180,000 ≈ €270M of running cost, a different budget line. Our estimates.

The v4.0 cards, as first written (kept for the record; replaced in v4.5 above): card 1 about $360M, card 2 about $200,000 saved per trial, card 3 about €24,000 per trial, sponsor keeps about €158,000.

The founder, verbatim: *"Pricing -> show different in 3 cards / * The current situation, the cost of one hire, number of trials and the participants, total cost / * How cheaper could be from our patient match and selection and how many money we can save them / * How we can charge and the revenue"*. Pre-screening is not running today: every saving below is our estimate on sourced inputs, never a result.

| Card (v4.5) | Big number | Arithmetic | Label |
|---|---|---|---|
| 1. Today | **about €36,000**: what one day of delay costs one trial to run | $40,000 a day (row 1) ÷ 1.10 = €36,364, rounded down | our estimate |
| 2. With Pathien | **about €180,000 saved per trial** | 5 days sooner to full enrolment (assumption; about 1.4% of ASPE's year of recruitment) × €36,000 = €180,000. Below ASPE's lowest modelled phase 3 saving from EHR-based recruitment, $0.46M ≈ €418,000 (row 11) | our estimate |
| 2, second line | about 6 fewer failed screenings per trial | 50 referrals × (36.3% − 24.2%), if a third fewer of our referrals fail screening (assumption; row 5) | assumption |
| 3. How we charge | **about €24,000 per trial** | €5,000 + 19 × €1,000 (both assumptions). Sponsor keeps €180,000 − €24,000 = **€156,000**. 10 trials a year: about €240,000 (assumption, not in slide 11) | our estimate |

### Pricing model

**Who pays.** Sponsors and CROs fund recruitment and pay sites per patient. We bill the sponsor or CRO, or the site where the sponsor's recruitment budget runs through it (open question Q38 in the deck). **Never the patient.** The fee is for a recruitment service, never for data: rule 2 holds.

**The unit: a set-up fee per trial, plus a success fee per randomised patient.**
- *Per randomised patient* is the unit sponsors already compare vendors on (row 8), and it pays us only when the site has accepted the patient and they are randomised.
- *A set-up fee* pays for turning one trial's criteria into rules, with a person reviewing them, per trial and country.
- *Per pre-screened referral* was rejected: the public anchor is low ($20 to $50, unverified) and it rewards volume over fit.
- *A per-trial subscription* was rejected for now: it needs a volume history we do not have.

| Input | Value | Label |
|---|---|---|
| Set-up fee, per trial and country | €5,000 | assumption |
| Success fee, per randomised patient | **€1,000** (range €750 to €1,500; v3.9 had €1,500) | assumption. Lowered in v4.0: rows 11 and 12 put the recruitment line at about $500 to $700 per participant and row 8's vendor average is $1,379, so €1,500 (about $1,650) sat above both. €1,000 (about $1,100) stays under the vendor average and is about 2.7% of the median $41,117 per patient (row 7). The value case rests on days saved, not on the fee |
| Referrals the site accepts, per trial | 50 | assumption |
| Screen failure at the site | 36.3% | secondary (row 5). The revenue keeps today's rate; slide 7c's "a third fewer" is an assumption shown as people screened, not as money |
| Share of patients who pass screening and are randomised | 60% | assumption |
| Cost of one day of delay to the sponsor | about $40,000 (≈ €36,000 at $1.10 to €1, rounded down; deck v4.5) | verified (row 1); the euro figure is our estimate |
| Days sooner to full enrolment, per trial | 5 | assumption (v4.0) |
| Exchange rate | $1.10 to €1 | assumption (v4.0) |

**Worked example, one trial in one country** *(our estimate)*: 50 accepted referrals × (1 − 36.3%) = about 32 pass screening × 60% = about 19 randomised. Revenue: €5,000 + 19 × €1,000 = **about €24,000** (v3.9, at €1,500: about €33,500). For the sponsor that is less than the direct cost of one day of delay (row 1).

**Slide 11.** The trial revenue is **not** added as a line D. Slide 11 projects the hospital wedge (per case, per seat, labs); trial pre-screening has no volume history and no sponsor pilot, and the funding plan funds direction 5's consent design this round, not a matching product. Slide 11 names it under "Not counted", and slide 7c (since v4.0; 7b in v3.9) carries the unit, the price and the example. Totals unchanged: €26k / €180k / €560k (conservative) and €258k / €1,705k / €4,850k (upside).

**Topic 3, patient experience.** Deck v3.9 also puts Topic 3 on slide 7b (cut to two lines in v4.0, founder: "Reduct the content of patient selection and patient experience"): the symptom diary in the patient's words and lab values as a series over time, shared with the trial team with consent. The verdict in section 1 ("partly") stands: the diary is not a validated patient-reported outcome instrument and detects no side effects. It has no separate price; it is part of what a sponsor gets for a randomised patient.

## Sources

Challenge text (founder's Google Doc, 15 Nov). `docs/PRD.md` §6F, §10.2 to §10.4, §10.10, §10.B.5, §8. `docs/research/buyers.md` §1.10 and target 39. `docs/research/market-and-competitors.md` §2.3. `docs/business/team-and-funding-plan.md` (directions 1 to 5). Registry and law names are from general knowledge and should be checked against their official pages before any public use. Section 8: sources with URLs in its table (rows 11 to 13 added in v4.0; treg not used in v4.0, sources read directly).
