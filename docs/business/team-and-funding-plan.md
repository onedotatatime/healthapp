# Pathien: team and funding plan (v2)

| | |
|---|---|
| **Owner** | CEO seat (ceo-minhos), on Linear MIN-4503 (deck). Copy polish: Anna (Marketing). Slide design: Pix (Design). |
| **Date** | 14 Nov 2026, Gen AI Summit Hackathon, Athens |
| **Version** | **v2, 14 Nov 2026 (evening).** Changes from v1: the team to hire is now **4** (an **ML engineer** added); a **research partner** (a Greek university or research centre) added, with its cost; the ask recomputed (**€600k**, was €425k; tranches €200k and €400k, were €150k and €275k); the marketing and sales spend shown on its own; the slide text rewritten into the founder's three parts (team today, what I ask, why); **the funding-sources slide dropped** (section 4 stays here as reference only). |
| **Status** | **Recommended, not decided.** The founder decides the raise, its size and structure, the hiring order, and full-time or part-time (section 6). Nothing here commits the company, contacts anyone or spends money. |
| **Method** | A short board-style working session: the CEO lens (ceo-advisor), the CFO and funding-adviser lens (cfo-advisor, financial-analyst), and the founder-load lens (founder-coach). The model is a 30-line script; its inputs are all in this file. |
| **Labels** | **verified**: read at the primary source today. **secondary**: quoted by someone else, or read only through a search summary. **assumption**: our number, with its anchor. **unverified**: named, not checked. |

**The founder's words (2026-11-14):** "Just me Lefteris Georgaras (founder of onedotatatime.design studio)"; "Also do an excersise with CEO use funding advisors CFO and add a plan for team and funding."; "Mention small team of 3, marketing, business development, engineer".

**The founder's answer to v1 (2026-11-14, verbatim):** "Team today / What I ask -> the result of the exercise (have you done that?) / Why -> say about the team and the marketing / sales spends / Where the money comes from -> no / We need to add at the team one ML engineer and a colab with a UNI / research center".

---

## Bottom line

- **The ask (recommended): €600k over 18 months**, in two tranches: **€200k after G2** (a hospital agrees a pilot in writing; covers months 1 to 6, €190k), **€400k after the pilot proves three numbers** (section 5). 18 months is kept: it is the shortest window that holds the pilot (months 3 to 8), the first paid half-year (months 9 to 14) and a second hospital (months 15 to 18).
- **The team to hire: 4.** Engineer €5.3k a month · **ML engineer €5.8k** · business development €5.1k · marketing €1.8k part-time, then €3.7k. Loaded Athens costs, all assumptions.
- **Research partner:** one Greek university hospital for clinical validation, plus a student project at an AI research centre (targets, not contacted). **€38k** over 18 months (assumption).
- **Use of funds (by function):** **selling (marketing and sales) 28%, €168k** · building (product and AI) 38%, €226k · proving (clinical research, regulatory, legal) 20%, €120k · buffer 14%, €86k.
- **Burn:** about €35k a month in the first quarter (one-off legal and security costs), then **about €25k to €28k a month**. Average €28.6k. With the buffer unspent the money lasts about **21 months**.
- **Revenue against cost:** on slide 11's **conservative** line, revenue does **not** cover costs inside the 18 months (about €55k earned in the window; monthly revenue passes the month-18 burn around **plan month 26**). On the **upside** line it covers costs from the first paid month (plan month 9). The plan is funded as if the conservative line is true.
- **Park by default still holds.** This is a plan for gated money. No money is raised and nobody is hired unless G2 passes. The gates (G0 15 Nov, G1 30 Nov, G2 15 Jan 2027) are the room's recommendation, still open for the founder on MIN-4442.

---

## 1. The team today

**Lefteris Georgaras, founder, onedotatatime.design studio. A solo founder, supported by AI agents.**

- No employees, no co-founder, no clinician on the team.
- The studio's AI agents did the research, PRD, design, build and deck of this weekend's prototype, under the founder's direction.
- The founder also runs two other products (minhOS, TravelHood). Until G1 his time on Pathien is capped at about 4 hours a week, with no money and no build (CEO cap, `docs/lean/room/ceo.md`).
- **Research partner (target, not contacted):** a Greek university hospital and an AI research centre (section 2b). Nothing is agreed.

**What this means for a funder (CEO lens):** the weekend proved a small team builds the flow fast. It did not prove operating with real health data, selling to a hospital, or the founder's capacity to run a third company. A funded plan needs the founder at least half-time on Pathien; that choice is his (decision D5).

---

## 2. The team to hire: a small team of 4

v2: the founder added "one ML engineer". The engineer now builds and runs the platform; the ML engineer owns the models and their accuracy. Roles and phasing of the other three are unchanged.

Costs are **loaded monthly costs** for a Greek employee in Athens: gross annual salary (paid as 14 monthly salaries in Greece) × 1.2179 for the employer's social security (21.79% from 1 Jan 2025, **secondary**: [PwC tax summaries](https://taxsummaries.pwc.com/greece/individual/other-taxes); other sources give 22.29% to 22.54%), ÷ 12. Every salary is an **assumption**, anchored to the salary surveys below.

| Hire | Role in one line | Profile | Time and place | Gross a year (assumption) | **Loaded a month** |
|---|---|---|---|---|---|
| **1. Engineer** (full-stack and pipeline) | Builds and runs the real pipeline: scan, extract, store, keep the originals, with consent and a DPIA first | Senior full-stack and data-pipeline engineer (Postgres with row-level security, storage and encryption, integrations, security basics); health-data experience (GDPR, FHIR) a plus. ML is no longer required: the ML engineer owns it | Full-time from month 1 · Athens (remote EU possible) | €50,000 | **€5,300** (incl. €200 tools and equipment) |
| **2. ML engineer** (new in v2) | Makes the reading accurate and cheap; owns every model | Applied ML or NLP engineer with document AI (OCR and LLM extraction), evaluation sets and model monitoring in production; Greek and English text; health data a plus | Full-time from month 2 · Athens (remote EU possible) | €55,000 | **€5,780** (incl. €200 tools; compute is in the infrastructure line) |
| **3. Business development** | Turns the first written pilot interest into a signed pilot, then into the first paying hospital | Health-tech or medtech B2B sales; international-patient departments or medical tourism a plus; English, plus Arabic or Turkish a plus | Full-time · Athens, travel to the Gulf and Istanbul | €45,000 + 15% variable on pilots and revenue | **€5,100** (base €4,560 + variable at target €560) |
| **4. Marketing** | Brings patients in through the hospital that asks for their history; owns consent and onboarding copy, the case study and the site | B2B health marketing or product marketing; bilingual English and Greek; clear writing on consent | **Part-time (50%)** until the first paid pilot, then full-time · Athens or remote | €36,000 (full-time) | **€1,830** part-time · **€3,650** full-time |

Salary anchors:
- Software engineer, Greece: about €42,300 gross a year average in 2025, entry level €27,500 to €36,000 (**secondary**, ILO-based estimate: [Life Indexed](https://lifeindexed.com/salary/europe/greece/software-engineer/2025/)); 80% earn €1,540 to €4,342 gross a month (**secondary**: [Paylab](https://www.paylab.com/gr/salaryinfo/information-technology/software-engineer)). €50k is upper-middle, for a senior who can be trusted with health data.
- Machine learning engineer, Greece: median €37,000 gross a year, range €27,000 to €66,000 (**secondary**, read only through a search summary: [Jobmentis](https://www.jobmentis.com/en/salaries/country/greece)); an Athens ML engineer posting lists €45,000 to €75,000 (**secondary**, undated in the summary: [aijobs.net](https://aijobs.net/job/machine-learning-engineer-athens-gr-15125-272052/)). €55k is the upper part of the national range, for a senior who has run document AI and evaluation in production.
- Business development manager, Greece: 80% earn €1,264 to €4,860 gross a month (**secondary**: [Paylab](https://paylab.com/gr/salaryinfo/management/business-development-manager)).
- Digital marketing manager, Greece: 80% earn €1,059 to €3,377 gross a month (**secondary**: [Paylab](https://www.paylab.com/gr/salaryinfo/marketing-advertising-pr/digital-marketing-manager?lang=en)). No Paylab range for "marketing manager" itself was found.

**Not in the team of 4, and still needed:** a clinician. Every seat in the lean room named a clinical lead as the first missing resource, and the room's G2 condition is a clinical co-founder or lead (`docs/lean/00-summary.md`, decision 9). The founder named four hires without one, so this plan keeps his four and **budgets a paid part-time clinical adviser (€1,000 a month, assumption: about two days a month)** inside the regulatory line. **The research partner partly answers the gap** if it is a university hospital: its clinician-researchers build and check the evaluation set and the doctor view (section 2b). It does not replace a clinician who is committed to Pathien, which G2 asks for. Whether the clinical lead becomes a co-founder is his call (D6).

### First 90 days of each hire

Day 1 is the day the first tranche lands, **after G2**. Nobody is hired before G2. If G2 fails, nobody is hired.

The founder's five directions: (1) scan, then the AI reads it; (2) store the extracted data; (3) store and analyse the original files; (4) real analysis and projection for the patient; (5) real matching.

| Days | Engineer (owns directions 1 to 3) | Business development | Marketing (part-time) |
|---|---|---|---|
| **1 to 30** | **Consent and a DPIA first.** DPIA with the external data-protection officer; consent flow; an EU-region model endpoint with no training and no retention; security baseline; apply the regulatory adviser's line to the code (the five engineering controls). No third person's record enters the system before the DPIA is signed off. | Turn G2's written pilot interest into a signed pilot agreement: scope, data-processing agreement, success metrics, and the price after the pilot. Ask the buyer to name the price; we do not suggest one. | Consent and onboarding copy in plain English and Greek, reviewed by the clinical adviser; the kit a hospital coordinator uses to ask patients for their history. |
| **31 to 60** | **The real pipeline on consented real records:** photo or PDF → extraction (1) → structured, cited record (2) → encrypted originals with "verified by source" or "uploaded by patient" (3). Identity match on name and ID. The ML engineer measures field accuracy on the consented evaluation set. | 15 to 20 conversations with international-patient departments and clinic chains (targets from `buyers.md`; nobody has been contacted). Prepare the EIT Health and Greek grant applications with the founder. | A doctor one-pager and the pilot case-study template; the site moves to the Pathien name only after the trademark check clears. |
| **61 to 90** | **Pilot-ready:** doctor view with cited answers, QR access grants with an expiry, the signed log, a one-command wipe. First consented real records in the pilot department. The accuracy and cost-per-case report is the ML engineer's. | Pilot running; weekly measures (cases, time to a complete history, repeated tests avoided). A second hospital in the pipeline. A named rare-disease network for a grant-funded pilot (direction 5). | Measure activation: of the patients the hospital asks, how many upload, and how many finish consent. No consumer acquisition, no paid ads (BMC). |

**ML engineer, first 90 days (starts month 2):**

| Days | ML engineer (owns the reading in direction 1, and the models in directions 4 and 5) |
|---|---|
| **1 to 30** | Evaluation sets first: a synthetic set now, and the consented, clinician-annotated set with the research partner once ethics approval lands. Baseline field accuracy and a cost-per-case meter on every run. Model choice inside the EU-region, no-retention endpoint the engineer set up. |
| **31 to 60** | Extraction to the **98% field accuracy after correction** target (PRD Scope B bar) on Greek and English lab reports and discharge letters. Confidence scores per field, so a person checks only the uncertain fields: this is what keeps **cost per case at €5 or less** (the third number in section 5). |
| **61 to 90** | Model monitoring on the pilot (accuracy drift, cost per case, correction rate). The doctor-side analysis: every answer cites its source, measured on the evaluation set. The matching design, opt-in only, with the consent model; no matching product this round. |

**Directions 4 and 5, said plainly:**
- **Direction 4 (analysis and projection for the patient)** collides with two of the founder's own rules: the patient gets no diagnosis from the AI (13 Nov) and the patient side is "route to the doctor", nothing interpreted (14 Nov). This round funds only what stays outside the device line: doctor-facing analysis with every answer citing its source, and the patient's own values over time with no interpretation. Projection and "possible causes" need a CTO assessment, the regulatory opinion and, if they ship, EU MDR certification (about €300k to €800k and 18 to 30 months, the CTO's estimate, not sourced). That is the **next** round. The founder decides how direction 4 reads against his rules.
- **Direction 5 (real matching)** is opt-in only (13 Nov). Matches are empty at small scale (CTO), so this round funds the consent design and a grant-funded rare-disease pilot, not a matching product.

---

## 2b. The research partner (new in v2)

The founder, 14 Nov: "a colab with a UNI / research center". **Recommended shape: one clinical partner and one technical partner, under one small budget.** Nobody below has been contacted. Every name is a **target**.

**What it is for:**
1. **Clinical validation:** clinicians check the extraction and the doctor view against the source records, in a study the hospital's scientific council and ethics committee approve.
2. **Evaluation datasets under ethics approval:** a consented, de-identified, clinician-annotated set of real Greek and English records, the only fair test of the 98% bar.
3. **Research credibility:** a named academic partner and, later, a joint publication on the method.
4. **The grant and consortium routes later:** Horizon Europe health calls, EIT Health and Greek research calls usually need a research partner; this one is ready when they open.
5. **Part of the clinician gap**, if the partner is clinical (section 2).

**Targets (not contacted):**

| Target | Type | Why it fits | Existence checked |
|---|---|---|---|
| **NKUA Medical School with Attikon University General Hospital** (Haidari, Athens) | Clinical, first choice | A university hospital with a research record: the clinical validation study, the annotated evaluation set and clinician time, close to the Athens team | **secondary**: listed as "Attikon University General Hospital, Medical School, National and Kapodistrian University of Athens" ([ERA-LEARN](https://era-learn.eu/network-information/networks/jpiamr-action/3rd-jpiamr-action-joint-call-2022/international-fungal-network-for-one-health-resistance-surveillance-antifungal-resistance/attikon-university-general-hospital-medical-school-national-and-kapodistrian-university-of-athens)); 383 registered trials in the EU trials register ([CTIS](https://www.ctis.eu/sites/greece/org-100030696)). Its ethics committee page was **not** found |
| **Athena Research Center, Archimedes unit** (Marousi, Athens) | Technical, first choice | AI, data science and algorithms; health care is among its application areas; Greek-language NLP work | **secondary** ([EETN](https://www.eetn.gr/en/archimedes-new-research-unit-of-athena-research-centre-on-ai-data-science-and-algorithms/), [Archimedes](https://archimedesai.gr/en/research-areas)) |
| **FORTH-ICS, Computational BioMedicine Laboratory** (Heraklion) | Technical, health-specific | A biomedical informatics lab; pairs with a Crete clinical partner if Athens does not work | **secondary** ([FORTH-ICS CBML](https://ics.forth.gr/cbml/cbml-contact-information)) |
| **NTUA, biomedical engineering** (Athens) | Technical, students | MSc and PhD students in biomedical engineering, for the student project | **secondary** ([biomed.ntua.gr](https://www.biomed.ntua.gr/people/phd-candidates/)) |
| **NCSR Demokritos, Institute of Informatics and Telecommunications** (Athens) | Technical | Software and knowledge engineering, NLP | **secondary** (named in a lab page: [EETN](https://www.eetn.gr/en/research_fields/planning-and-scheduling-en/)) |
| **BRFAA** (Biomedical Research Foundation, Academy of Athens) | Biomedical, lower fit | Biomarker and clinical research; less fit for document AI | **secondary** ([CORDIS](https://cordis.europa.eu/docs/results/245/245928/final1-transmed-presentation-2013.pdf)) |

**What it costs (all assumptions; no price was asked):**

| Item | When | Cost | Note |
|---|---|---|---|
| Ethics approval and a data-sharing agreement | Month 2 | €3,000 | The hospital's scientific council and ethics committee for a non-interventional study, plus legal review of the agreement. Approval takes about 2 to 3 months (assumption): data arrives from month 4 |
| Clinical validation contract, through the university's research account | Months 4 to 15 | €24,000 (€2,000 a month) | Clinician-researchers' time: annotate the evaluation set, run the doctor-view check. The university's overhead is included |
| One MSc or PhD student project at the technical partner | Months 4 to 15 | €10,800 (€900 a month) | Extraction benchmarks on Greek and English records. An MSc thesis can cost €0; this budget pays the student |
| **Total** | | **€37,800** (6.3% of €600k) | Grant money for the partner is not counted until signed |

**One condition (CEO view):** the agreement leaves the product IP with the company and lets the university publish the method after a short review (D12). A university contract that claims the product IP is a reason to walk away.

---

## 3. The funding ask

**€600k over 18 months (recommended; v1 was €425k).** Month 1 is about March 2027: G2 on 15 Jan 2027 plus about six weeks to close the first tranche (assumption).

**Why 18 months and not shorter or longer (CFO view).** Shorter cuts off before the first paid half-year and the second hospital, so the next round would be raised on a pilot alone. Longer raises more at the weakest point of the evidence (28/100 market fit). 18 months with tranches keeps most of the money behind the pilot's numbers.

### Use of funds, by line

| Line | 18 months | % of €600k | What it buys |
|---|---|---|---|
| **Team (4)** | €326.0k | **54%** | Engineer from month 1 (€95.4k), ML engineer from month 2 (€98.3k), business development from month 2 (€86.7k), marketing at 50% from month 3 and full-time from month 10 (€45.7k) |
| **Regulatory, clinical and legal** | €82.0k | **14%** | Unchanged from v1: regulatory opinion (€10k) · DPIA (€15k) · data-protection officer as a service (€9k) · pilot contracts and terms (€10k) · external security test (€12k) · PATHIEN trademark (€8k) · clinical adviser (€18k). **MDR certification is not in this round** |
| **Research partner** (new) | €37.8k | **6%** | Section 2b |
| **Infrastructure and AI** | €32.5k | **5%** | v1's €24k plus €500 a month from month 2 for evaluation compute and annotation tools (assumption) |
| **Pilots and go-to-market** | €36.0k | **6%** | Travel to target hospitals, one or two health-tech events, pilot materials, translation checks: €2,000 a month |
| **Buffer** | €85.7k | **14%** | About 3.4 months of steady burn: slower sales, a longer DPIA or ethics approval, a gap before tranche 2 |
| **Total** | **€600.0k** | **100%** | |

### Use of funds, by function (the slide's "Why")

| Function | Lines | 18 months | % of €600k |
|---|---|---|---|
| **Sell: marketing and sales** | Business development €86.7k + marketing €45.7k + pilots and go-to-market €36.0k | **€168.4k** | **28%** |
| **Build: product and AI** | Engineer €95.4k + ML engineer €98.3k + infrastructure and AI €32.5k | **€226.2k** | **38%** |
| **Prove: clinical research, regulatory, legal** | Regulatory, clinical and legal €82.0k + research partner €37.8k | **€119.8k** | **20%** |
| **Buffer** | | **€85.7k** | **14%** |

Not in the budget: **the founder's own pay** (D5; €3,000 a month would add €54k), equity for the hires (D8), and certification.

### Burn per month

| Plan months | Burn a month | Why |
|---|---|---|
| 1 to 3 | about €34.7k | Engineer, business development and the ML engineer start; regulatory opinion, DPIA, legal, security test; ethics submission |
| 4 to 6 | about €28.6k | Trademark filings; marketing part-time; research partner starts |
| 7 to 9 | about €26.4k | Steady state with marketing part-time |
| 10 to 15 | about €28.2k | Marketing full-time; infrastructure at the higher tier |
| 16 to 18 | about €25.3k | Research contract ends. **€25.3k is the steady burn of a team of four** |

Average €28.6k. Months 1 to 6 cost €189.7k, inside tranche 1. With the buffer unspent the €600k lasts about **21 months** at the steady burn.

### Milestones the money buys

| When | Milestone | Tranche |
|---|---|---|
| 30 Nov 2026 | **G1** (before any money): 2 of 5 buyers name a cost and a budget owner, plus 1 written pilot interest; 3 of 5 doctors name the moment they would open it | none |
| 15 Jan 2027 | **G2** (before any money): a pilot agreed in writing with a non-insurer buyer; the regulatory adviser's first opinion; a clinician committed | none |
| Months 1 to 3 | DPIA signed off; the real pipeline (directions 1 to 3) on consented records; pilot agreement signed; ethics submission with the research partner | 1 (**€200k**, covers months 1 to 6: €190k) |
| Months 3 to 8 | Free pilot in one international-patient department (2 to 4 months, BMC); 98% accuracy and cost per case measured on the clinician-annotated set | 1 |
| Month ~6 | **The three numbers** (section 5) measured; tranche 2 released only if they hold | 2 (**€400k**) |
| Months 9 to 14 | **First paid pilot.** Slide 11's year 1: €26k (conservative) to €258k (upside) in its paid half-year | 2 |
| Months 15 to 18 | Second paying hospital or the first clinic-chain seats; the clinical validation results with the partner; EIC Accelerator full proposal for the certification round | 2 |

### Reconciliation with slide 11

Slide 11's year 1 starts when the pilot starts (plan month 3); its first half is the free pilot, so paid revenue starts at plan month 9. Year 2 is plan months 15 to 26, ramping in a straight line to slide 11's year-2 total. Model: a short script in the CEO run; every input is in this file.

| | Conservative (slide 11: €26k / €180k / €560k) | Upside (slide 11: €258k / €1.7M / €4.85M) |
|---|---|---|
| Revenue inside the 18 months | **about €55k** | **about €540k** |
| Monthly revenue at month 18 | about €10k (burn €25k) | about €97k (burn €25k) |
| Revenue passes the month-18 burn | **about plan month 26** (gross profit at about month 28), eight months after the runway ends | **plan month 9**, the first paid month |
| Cash left at month 18 | about €140k (most of it the buffer) | about €620k |
| Honest reading | **Revenue does not cover costs inside the runway.** It needs a next round or a signed grant before month 18 | Self-funding from the first paid pilot. Treat as the case to hope for, not to plan on |

**The upside does not change the ask.** The plan is sized on the conservative line; if the upside arrives, tranche 2 can be smaller or skipped.

**Levers if the founder wants a smaller ask (CFO view):** start the ML engineer at month 3 instead of 2 (−€5.8k); keep marketing part-time to month 12 (−€5.5k); fund the research partner from a research grant once signed (up to −€37.8k). Together about €50k: the ask would still be about €550k. The real lever is the team size, which is the founder's.

---

## 4. Funding sources and sequence (reference only, not on the slides)

**v2: not on any slide.** The founder, 14 Nov: "Where the money comes from -> no". This section stays as background for the founder and for questions in the room. The amounts below are updated to v2.

Realistic for a Greek solo founder in health tech: non-dilutive first, equity for the remainder. A grant is counted as runway only once it is signed; EU grants typically take months to decide (assumption).

### Non-dilutive

| Source | What it gives | Fit for Pathien | Status |
|---|---|---|---|
| **EIC Accelerator** (EU) | Grant **up to €2.5M** (TRL 6 to 8) plus equity **€1M to €10M**; a single start-up or SME can apply; short proposals any time; 2027 full-proposal cut-offs 20 Jan, 17 Mar, 1 Sep, 4 Nov 2027 | **The certification round, not this one.** Apply after pilot evidence: short proposal around plan month 9, full proposal at the 1 Sep or 4 Nov 2027 cut-off. Three failed submissions bar a company (secondary) | **verified** ([EIC](https://eic.ec.europa.eu/eic-funding-opportunities/eic-accelerator_en)); three-strike rule **secondary** ([ABGi](https://www.abgi-uk.com/news-resources/eic-accelerator-grant-funding-2026/)) |
| **EIC Pathfinder** (EU) | Research funding for breakthrough science | Not a fit at this stage: Pathien is product and pilot work, not research | **unverified** |
| **Horizon Europe, health calls** (EU) | Consortium research projects | Direction 5 only: join a rare-disease consortium as the SME partner | **unverified** (amounts not checked) |
| **EIT Health, Transformative Healthcare Instrument** | €300k to €500k for an SME, up to 50% of project cost; the 2026 deadline was 16 Sep 2026; one report says the company must accept a future shareholder | Possible for tranche 2 if a 2027 call opens; needs the other 50% matched | **secondary** ([UKRI IUK](https://iuk-business-connect.org.uk/opportunities/eit-transformative-healthcare-instrument-2026/), [StartupCafe](https://startupcafe.ro/granturi-de-pana-la-500-000-eur-pentru-startup-uri-de-sanatate-firmele-trebuie-sa-vina-cu-jumatate-din-bani-si-sa-accepte-un-viitor-actionar-103329)); 2027 call **unverified** |
| **EIT Health, Headstart** | Up to €50k | Early help for tranche 1, if the programme runs in 2027 | **secondary**, undated ([EIT](https://www.eit.europa.eu/news-events/news/eit-health-spain-names-15-winners-headstart-funding)) |
| **Elevate Greece** | The national start-up registry; the official site lists access to NSRF 2021–2027 funds, VC funds and angels. Its 2021 COVID grants (€5k to €100k) are closed | Register once Pathien has a legal entity (D9); it is the door to the Greek instruments | registry **secondary** ([elevategreece.gov.gr](https://elevategreece.gov.gr/)); 2021 grants **secondary** ([GTP](https://news.gtp.gr/2021/01/05/elevate-greece-announces-funding-for-startups/)) |
| **ESPA 2021–2027, Competitiveness programme** | One report names a €70M action "Starting an Entrepreneurial Business"; ticket size and start-up eligibility not confirmed | Candidate for tranche 1; check the call on espa.gr | **unverified** (one press report, seen only in a search summary); check the call on [espa.gr](https://www.espa.gr) |
| **Greece 2.0 (Recovery Fund) instruments** | Loans and grants for businesses | No start-up instrument that fits was checked | **unverified** |
| **Hackathon prizes and credits** | Credits listed at kickoff (Google AI, fal, boxd, Firecrawl, Oumi, treg) | Covers the demo, not the plan | credits **verified** in `docs/00-founder-brief.md` ([Polymath42](https://hackathon.polymath42.com/credits)); prize amounts **unverified** |

### Equity (pre-seed, after G2)

| Source | What it gives | Status |
|---|---|---|
| **EquiFund II** | A **€200M fund of funds** from EU Cohesion funds and Greek national resources, managed by the EIF, with a focus on life sciences and health. It does not invest in companies directly; it invests through selected VC funds | **secondary** ([European Commission](https://ec.europa.eu/regional_policy/whats-new/newsroom/18-06-2024-eur-200-million-for-equifund-2-a-financial-instrument-for-boosting-greek-startups-and-smes-in-life-sciences-and-healthcare_en), [EIF press](https://www.eif.org/press/all/eib-group-to-support-greek-businesses-and-startups-in-life-sciences-health-and-sustainability-with-eur-200-million-new-equity-financing)); the EIF programme page returned 404 today. **Selected fund managers not verified** |
| **Greek VCs from EquiFund I** | Big Pi Ventures and Marathon VC appear in the 2018 EquiFund I listings. Whether either invests at pre-seed in health in 2027 is not known | **secondary** (2018 listings); current fit **unverified** |
| **Greek and EU angels** | Typical tranche-1 money | Names and ticket sizes **unverified**. Sales lists them with treg (Crunchbase) before any approach; nobody is contacted without the founder's go |
| **EU health-tech VCs** | Seed after the pilot | **Not named here**, to avoid unverified names. Sales builds the list |

### The sequence (recommended)

1. **Now to G1 (30 Nov 2026):** €0. Hackathon credits only. Founder-led buyer and doctor conversations.
2. **G1 to G2 (15 Jan 2027):** the regulatory opinion, €3k to €10k of the founder's own money, only if he says yes (already open on MIN-4442). Draft the EIC short proposal (it costs time, not money).
3. **After G2, tranche 1 (€200k):** Greek grant (ESPA) and EIT Health applications go in; the €200k closes from angels on a SAFE or convertible note with a cap (structure: D2). Target close about March 2027.
4. **After the three numbers, tranche 2 (€400k, about month 6):** replaced in part by any grant that has been **signed** by then; the rest from the same angels or a Greek VC from the EquiFund II funds.
5. **Months 15 to 18:** EIC Accelerator full proposal (1 Sep or 4 Nov 2027 cut-off) and a seed round, to fund EU MDR certification of decision support (CTO estimate €300k to €800k) and a team beyond four. The research partner makes Horizon Europe health consortia and Greek research calls reachable here.

**Dilution (assumption):** €600k at a pre-money cap of €2.5M to €3.5M is about 15% to 19%. Tranche 1 alone (€200k) is about 5% to 7%. Every euro of signed grant lowers it. The cap is a guess, not a quote; the founder decides (D2).

---

## 5. The CFO view

### Unit economics, from slide 11 (all assumptions)

| | Per case (international-patient department) | Per seat (clinic chains, telehealth) |
|---|---|---|
| Price | €40 (conservative) to €80 (upside); no published price exists | €50 a month (€600 a year), 40% of Tandem Pro's published €125 |
| Variable cost (assumption) | €2 to €5 (model inference, storage, translation check) if the machine is accurate enough; **€10 to €20 if a person must check each case** | €3 to €5 a month (queries, storage) |
| Gross margin | about 90% machine-only; **about 50% to 75% with a human check** | about 90% |
| Per customer a year | One hospital: €40k (1,000 cases × €40) to €240k (3,000 × €80) | One 20-doctor clinic: €12k |
| Cost to win one hospital (assumption) | About €30k to €40k: a share of business development, travel, and a free pilot of 2 to 4 months | — |
| Payback (conservative) | About 12 months at €36k gross profit a year | — |

**Break-even at a team of four** (steady burn about €25.3k a month): about **€340k of revenue a year at 90% margin**. That is about **8 to 9 hospitals at the conservative €40k each**, or about 1 to 2 at the upside rate, or about 560 doctor seats. Slide 11's conservative line reaches 8 hospitals only in year 3. At a 75% margin break-even is about €405k a year; at 50%, about €610k. **Keeping the margin near 90% is the ML engineer's job** (the third number below).

### Key risks to the plan

1. **No buyer pays for the history (R3).** The whole revenue line rests on it. Tested at G1, before any money.
2. **The device line moves.** If the regulatory opinion says cited retrieval is a medical device, the cost becomes €300k to €800k and 18 to 30 months (CTO estimate), and this plan is wrong. Tested at G1 or G2, before any money.
3. **Accuracy costs people.** If 98% accuracy needs a person on every case, margin falls from about 90% to about 50% to 75%.
4. **Hospital sales are slow.** Each month of delay costs about €25k of runway; the buffer covers about three months.
5. **The team.** A solo founder with two other products and no clinician on the team of four (the research partner covers part of this). The ML engineer removes the v1 single point of failure on the models; the platform still rests on one engineer.
6. **Grants arrive late or not at all.** None is counted until signed.
7. **The name.** PATHIEN trademark clearance is pending (`docs/brand/brand-check-pathien.md`); a conflict means a rename and new filings.
8. **The insurer rule narrows the buyers by design.** The five open edges (public payers, hybrid bodies, employers, a pharma line, insurer-owned hospitals) are the founder's; this plan counts none of them.
9. **The research partner.** University contracts and ethics approval can take longer than planned, and IP terms can claim too much (D12). The pilot does not wait for the partner: the synthetic set and the pilot's consented records still measure accuracy.

### The three numbers to validate in the pilot before raising tranche 2

| # | Number | Threshold (recommended) | Why it matters |
|---|---|---|---|
| 1 | **The price a buyer names**, per case, and which budget pays it | **€40 a case or more**, named by the buyer, not suggested by us | Slide 11's conservative line starts at €40 |
| 2 | **Paid cases per hospital a year** (patients arriving with an outside history) | **1,000 or more** | One hospital at 1,000 × €40 = €40k; below that, break-even needs too many hospitals for a team of four |
| 3 | **Cost per case at 98% field accuracy**, correction time included | **€5 or less** (about 88% gross margin at €40) | Decides whether this is a software margin or a service margin. Owner: the ML engineer, measured on the research partner's annotated set |

---

## 6. Decisions only the founder can make

The CEO seat recommends; it takes none of these. They are money, hiring and company commitments.

| # | Decision | Recommendation |
|---|---|---|
| **D1** | Raise at all, and when | Only after G2 passes. Park by default until then |
| **D2** | Amount, tranches and structure | **€600k** over 18 months in two tranches (**€200k** after G2, **€400k** after the three numbers); grants first; equity on a SAFE or convertible note with a cap. Expected dilution about 15% to 19% for the full amount (assumption). Levers to about €550k in section 3 |
| **D3** | Hiring order | Engineer first (directions 1 to 3 and the DPIA come before any pilot); ML engineer and business development in month 2; marketing in month 3 |
| **D4** | Full-time or part-time | Engineer, ML engineer and business development full-time; marketing 50% until the first paid pilot, then full-time |
| **D5** | The founder's own time and pay on Pathien | At least half-time once tranche 1 lands; his pay is not in the €600k (adding €3,000 a month adds €54k) |
| **D6** | The clinician | A clinical co-founder (equity) or a paid adviser (budgeted at €1,000 a month). The room's G2 condition asks for a committed clinician |
| **D7** | Hires or co-founders | Three of the four roles match the studio's co-founder search (2026-11-10: "Eng - Sales - Marketing"). Hire them as employees with options, or offer co-founder equity: his call |
| **D8** | Option pool for the team | Recommend 10% (assumption), granted with vesting |
| **D9** | The legal entity that raises and hires | Pathien as its own company or inside the studio; needed before Elevate Greece, a grant or a SAFE |
| **D10** | Direction 4 against his own rules | How "analysis and projection for the patient" reads against "route to the doctor, nothing interpreted"; certification is the next round |
| **D11** | The research partner | Approach NKUA Medical School with Attikon University General Hospital (clinical) and the Athena Research Center's Archimedes unit (technical) after G1, budget €37.8k; nobody is contacted without his go |
| **D12** | IP and publication terms with the university | The product IP stays with the company; the university may publish the method after a short review. Walk away from a contract that claims the product IP |

---

## 7. Slide-ready text (v2)

**Replaces** v1's new "Team and funding plan" slide and v1's slide 14 text. Two slides, in the founder's three parts: **Team today** and **What I ask** on slide 14, **Why** on slide 15. **No funding-sources slide** (founder, 14 Nov: "Where the money comes from -> no"). Anna polishes the wording; Pix designs. Every number keeps its label at the same size. These are **recommended** words: the founder approves public copy and the amount.

### Slide 14: "Team today, and what I ask"

**Headline:** Built by one founder and AI agents. Next: €600k, released by a hospital pilot.

**Body (59 words):**
**Team today.** Lefteris Georgaras, founder, onedotatatime.design, working with AI agents. Research partner: a Greek university hospital and an AI research centre (targets, not yet contacted).
**What I ask.** €600k over 18 months (our plan), in two tranches, each released by a gate below. It buys a real pipeline on consented records, a hospital pilot, and the first paying hospital.

**Table, the gates:**

| Gate, before any money | Tranche | What it buys |
|---|---|---|
| A hospital agrees a pilot in writing | €200k | Months 1 to 6: consent and data-protection review, the real pipeline, the pilot running |
| The pilot proves three numbers: the buyer names €40 a case or more; 1,000 cases a year or more; €5 cost per case or less | €400k | Months 7 to 18: the first paying hospital, a second hospital, the certification proposal |

**Footer, required:** Our plan, not a raise in progress. Nothing is raised and nobody is hired before a hospital agrees a pilot in writing. EU MDR certification is the next round.

**Visual note for Pix:** Left: the founder, plus a small "AI agents" mark, plus one outlined "research partner" tile marked "target". Right: the two gates as two steps, the money on each step. No stock faces. No red.

**Speaker notes (~20 s):** "Today it is me, and a team of AI agents that built this with me this weekend. What I ask is six hundred thousand euros over eighteen months, in two parts. The first two hundred thousand comes only when a hospital signs a pilot. The other four hundred only when that pilot proves the price, the volume and the cost of each case."

### Slide 15: "Why: four people and a research partner"

**Headline:** Why €600k: four people, a research partner, and 28% for selling.

**Body (37 words):**
Four hires and one research partner. Two build, two sell, and the partner checks the work with clinicians. Selling gets 28% of the money: business development, marketing, pilots and travel. Nobody is hired before a hospital signs.

**Table 1, the team:**

| Who | Why | Cost a month* |
|---|---|---|
| Engineer | Builds the real pipeline: scan, store, keep the originals, with consent | €5.3k |
| ML engineer | Makes the reading accurate (98%) and cheap (€5 a case); cited answers for doctors | €5.8k |
| Business development | Turns one pilot into the first paying hospital | €5.1k |
| Marketing | Brings patients in through the hospital; part-time first | €1.8k, then €3.7k |
| Research partner (target) | Clinical validation and an ethics-approved test set | €2.9k |

**Table 2, where the €600k goes:**

| Sell: marketing and sales | Build: product and AI | Prove: clinical, regulatory, legal | Buffer |
|---|---|---|---|
| **28% · €168k** | 38% · €226k | 20% · €120k | 14% · €86k |

**Footer, required:** \* Our plan. Every cost is an assumption at Athens rates, with employer contributions. Sell = business development €87k + marketing €46k + pilots and go-to-market €36k. Research partner: months 4 to 15.

**Visual note for Pix:** Table 2 as one horizontal bar in four parts; "Sell" carries the one accent. "Assumption" and "our plan" at the same size as the numbers. No red.

**Speaker notes (~20 s):** "Why this amount. Four people: an engineer and an ML engineer to build it and make the reading accurate and cheap, business development and marketing to sell it. Twenty-eight percent goes to selling. A university hospital checks the work with clinicians. And today: if you know a hospital that treats patients from abroad, or a doctor who would try the doctor view, come and find me. Thank you."

**Contact line** (slide 15, bottom): unchanged from v3 (`[email]` · healthapp-landing.pages.dev).

**Moved off the slides:** v1's non-money asks (a clinical champion pair, introductions, a regulatory adviser) are now one sentence in slide 15's speaker notes, so the slide keeps to the founder's three parts.

---

## Sources in the repo

`docs/deck/deck-content.md` (slides 10, 11, 13, 14) · `docs/lean/00-summary.md` · `docs/lean/05-business-model-canvas.md` (CTO cost estimates, BMC) · `docs/lean/06-market-fit-scorecard.md` (28/100, gates, R1 to R11) · `docs/lean/room/ceo.md`, `cto.md` · `docs/research/buyers.md`, `market-and-competitors.md` · `docs/00-founder-brief.md` · `~/AppDevelopment/conductor/docs/founder-decisions.md` (healthapp entries, 2026-11-10 studio team entries).
