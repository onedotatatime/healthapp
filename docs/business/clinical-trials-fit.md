# Pathien and the Clinical Trials Challenge: can we fit?

| | |
|---|---|
| **Owner** | Anna Lytica (Marketing), MIN-4503 |
| **Date** | 15 Nov 2026 |
| **For** | The founder, who asked, verbatim: "Create a summary for me to explain if we can fit to find patients eligible to a clinical trial when we have their concent to process their data" |
| **Challenge** | Athens LifeHack, The Clinical Trials Challenge (Athens LifeTech Park). Text as the founder shared it: `clinical-trials-challenge.md` in the coordinator's scratchpad (Google Doc "ALTP_Clinical_Trials_Challenge_draft (3)") |
| **Status** | Draft for the founder. Nothing sent. **Nothing in this note is built.** Legal points are flagged for a lawyer or regulator; none of them is legal advice. |

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

This is direction 5's most concrete use. "Possible matches" (slide 7) connects a patient to doctors with similar cases; trial matching connects the same consenting patient to a study, and it has a buyer. The payer would be **sponsors and CROs, never the patient**: a service fee per matched study is the model in our buyer research (`buyers.md` §1.10). **No price**: it has to be validated with a sponsor. Our funding plan funds the consent design for direction 5 this round, not a matching product (`team-and-funding-plan.md`), so trials would be the reason to fund the next step, not this one.

## 7. Risks

- **Coverage.** Our records are thin on what trials ask most (diagnosis codes, medications, staging). Many criteria will come back "unknown", and that is the honest answer.
- **Stale data.** A two-year-old lab result says little about eligibility today. We pre-screen; the site re-tests.
- **Bias.** If our users are the most digitally able patients, we make enrolment less diverse, not more. Measure who opts in.
- **Consent fatigue.** A third consent (care, possible matches, trials) may be one too many. The wording and the moment it is asked need testing with patients.
- **False hope.** "You may be eligible" can read as a promise of treatment. Route it through the doctor, and say plainly that most people pre-screened are not enrolled.
- **Crowded market.** Hospital-network players already sell this to sponsors. We must show what the patient-held record adds, not claim to be first.

## Sources

Challenge text (founder's Google Doc, 15 Nov). `docs/PRD.md` §6F, §10.2 to §10.4, §10.10, §10.B.5, §8. `docs/research/buyers.md` §1.10 and target 39. `docs/research/market-and-competitors.md` §2.3. `docs/business/team-and-funding-plan.md` (directions 1 to 5). Registry and law names are from general knowledge and should be checked against their official pages before any public use.
