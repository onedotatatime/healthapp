# Pathien: team and funding plan (v3)

| | |
|---|---|
| **Owner** | CEO seat (ceo-minhos), on Linear MIN-4503 (deck). Copy polish: Anna (Marketing). Slide design: Pix (Design). |
| **Date** | 15 Nov 2026, Gen AI Summit Hackathon, Athens |
| **Version** | **v3, 15 Nov 2026.** Changes from v2: **the ask is €1M** (was €600k), over **24 months** (was 18), in two tranches of **€300k and €700k** (were €200k and €400k). The money is not scaled up line by line: it buys a longer runway, **two new seats** (a half-time clinical and regulatory lead from month 1, a second engineer from month 13), a **gated start on the regulatory pathway** (a quality system), **public-buyer selling** (hospitals, governments, private clinics) and a **clinical-trials sponsor pilot**. The €1,000-a-month clinical adviser is replaced by the lead. Revenue is unchanged (slide 11). The model is now a file you can rerun: `docs/business/funding-model.py`. Section 7 has the new text for the two slides "Team and ask" and "Why". v2 changes from v1 are kept in git history. |
| **Status** | **Recommended, not decided.** The founder decides the raise, its size and structure, the hiring order, and full-time or part-time (section 6). Nothing here commits the company, contacts anyone or spends money. |
| **Method** | The CEO lens (ceo-advisor: capital allocation, what €1M buys that €600k does not), the CFO lens (cfo-advisor: runway, burn, tranches, break-even), the analyst lens (financial-analyst: a month-by-month model, rerun on the same method for v2), and the founder-load lens (founder-coach). |
| **Labels** | **verified**: read at the primary source. **secondary**: quoted by someone else, or read only through a search summary. **assumption**: our number, with its anchor. **unverified**: named, not checked. **Every cost and revenue figure in this file is an assumption** unless it carries another label. |

**The founder's words.**
- 14 Nov: "Just me Lefteris Georgaras (founder of onedotatatime.design studio)"; "Also do an excersise with CEO use funding advisors CFO and add a plan for team and funding."; "Mention small team of 3, marketing, business development, engineer".
- 14 Nov, on v1: "Team today / What I ask -> the result of the exercise (have you done that?) / Why -> say about the team and the marketing / sales spends / Where the money comes from -> no / We need to add at the team one ML engineer and a colab with a UNI / research center".
- **15 Nov, on v2: "Fund 1m -> do the maths".** Also 15 Nov (relayed in the brief): the buyers are now **hospitals, governments and private clinics** (Anna is reworking slide 10).

---

## Bottom line

- **The ask (recommended): €1M over 24 months**, in two tranches: **€300k after G2** (a hospital agrees a pilot in writing), which covers months 1 to 9 (€292k); **€700k after the pilot proves three numbers** (section 5), about month 9.
- **What €1M buys that €600k did not (CEO view).** Not the same plan, bigger. Five things, in order of the risk they remove:
  1. **Runway to break-even.** On slide 11's conservative line, revenue passes costs at **month 29**, and the money is still there: **€204k at its lowest point (month 30)**. Hospital sales can arrive **6 months late** and the money still reaches break-even. On the same method, €600k reached break-even with €60k left and 2 months of slack.
  2. **A clinician on the team from day 1.** A half-time **clinical and regulatory lead** fills the gap every seat in the lean room named first.
  3. **The regulatory pathway, started and gated.** €50k for a quality management system (the ISO 13485 groundwork), released only if the regulatory opinion says the roadmap needs a device route. Certification itself stays in the next round.
  4. **Selling to public buyers.** Hospitals, governments and private clinics buy slowly. More runway, a public-procurement adviser, and a second engineer for hospital and national-system integrations (from month 13).
  5. **A clinical-trials sponsor pilot** (€25k): tests the second revenue line on slide 7c (direction 5).
- **The team to hire: 6.** Engineer €5.3k a month · clinical and regulatory lead (half-time, new) €3.1k · ML engineer €5.8k · business development €5.1k · marketing €1.8k half-time, then €3.7k · second engineer (new, month 13) €4.8k. Loaded Athens costs.
- **Use of funds:** **Sell (marketing and sales) €285k, 29%** · Build €361k, 36% · Prove €242k, 24% · Buffer €112k, 11%.
- **Burn:** €37.6k a month in the first quarter (one-off legal and security costs), down to €28.5k in the third, **€38k to €43k a month in year 2** with the full team, **€32.7k a month after month 24** (the steady team of six). Average €37.0k.
- **Break-even:** about **€449k of revenue a year** at an 87.5% gross margin. Conservative line: revenue passes costs at **month 29**, gross profit at **month 31**: after the 24 planned months, but before the money runs out. Upside line: at **month 12**.
- **Park by default still holds.** No money is raised and nobody is hired unless G2 passes. The gates (G0 15 Nov, G1 30 Nov, G2 15 Jan 2027) are the room's recommendation, still open for the founder on MIN-4442.

---

## 1. The team today

**Lefteris Georgaras, founder, onedotatatime.design studio. A solo founder, supported by AI agents.**

- No employees, no co-founder, no clinician on the team.
- The studio's AI agents did the research, PRD, design, build and deck of this weekend's prototype, under the founder's direction.
- The founder also runs two other products (minhOS, TravelHood). Until G1 his time on Pathien is capped at about 4 hours a week, with no money and no build (CEO cap, `docs/lean/room/ceo.md`).
- **Research partner (target, not contacted):** a Greek university hospital and an AI research centre (section 2b). Nothing is agreed.

**What this means for a funder (CEO lens):** the weekend proved a small team builds the flow fast. It did not prove operating with real health data, selling to a hospital, or the founder's capacity to run a third company. A funded plan needs the founder at least half-time on Pathien; that choice is his (decision D5).

---

## 2. The team to hire: 6

v3: the founder's four (engineer, ML engineer, business development, marketing) stay, with the same pay and start months. €1M adds two seats: a **clinical and regulatory lead** (half-time, month 1) and a **second engineer** (month 13).

Costs are **loaded monthly costs** for a Greek employee in Athens: gross annual salary (paid as 14 monthly salaries in Greece) × 1.2179 for the employer's social security (21.79% from 1 Jan 2025, **secondary**: [PwC tax summaries](https://taxsummaries.pwc.com/greece/individual/other-taxes); other sources give 22.29% to 22.54%), ÷ 12, plus about €200 a month for tools. Every salary is an **assumption**.

| # | Hire | Role in one line | Starts | Gross a year (assumption) | **Loaded a month** | **24 months** |
|---|---|---|---|---|---|---|
| 1 | **Engineer** (platform and pipeline) | Builds and runs the real pipeline: scan, extract, store, keep the originals, with consent and a DPIA first (directions 1 to 3) | Month 1, full-time | €50,000 | **€5.3k** | **€127k** |
| 2 | **Clinical and regulatory lead** (new in v3) | A physician with clinical-affairs or MDR experience: the DPIA's clinical side, the pilot's clinical protocol, the ethics file with the research partner, the doctor view, and the quality system if the opinion asks for it | Month 1, **half-time** (keeps clinical practice) | €60,000 full-time | **€3.1k** | **€76k** |
| 3 | **ML engineer** | Makes the reading accurate (98%) and cheap (€5 a case); owns every model and the evaluation sets | Month 2, full-time | €55,000 | **€5.8k** | **€133k** |
| 4 | **Business development** | Turns the signed pilot into paying hospitals and private clinic chains; works public tenders with the procurement adviser | Month 2, full-time | €45,000 + 15% variable | **€5.1k** | **€118k** |
| 5 | **Marketing** | Brings patients in through the hospital; consent and onboarding copy, the case study, the site | Month 3 half-time; full-time from month 10 | €36,000 full-time | **€1.8k**, then **€3.7k** | **€68k** |
| 6 | **Second engineer** (new in v3) | Hospital and national-system integrations (FHIR and HL7, a public buyer's systems), security, and the platform's second pair of hands | Month 13, full-time | €45,000 | **€4.8k** | **€57k** |
| | **Team total** | | | | **€27.7k a month at full team (month 13 on)** | **€578k (58%)** |

Salary anchors:
- Software engineer, Greece: about €42,300 gross a year average in 2025 (**secondary**, ILO-based estimate: [Life Indexed](https://lifeindexed.com/salary/europe/greece/software-engineer/2025/)); 80% earn €1,540 to €4,342 gross a month (**secondary**: [Paylab](https://www.paylab.com/gr/salaryinfo/information-technology/software-engineer)). €50k is upper-middle, for a senior trusted with health data; €45k for the second engineer.
- Machine learning engineer, Greece: median €37,000, range €27,000 to €66,000 (**secondary**, search summary only: [Jobmentis](https://www.jobmentis.com/en/salaries/country/greece)); an Athens posting lists €45,000 to €75,000 (**secondary**: [aijobs.net](https://aijobs.net/job/machine-learning-engineer-athens-gr-15125-272052/)).
- Business development manager, Greece: 80% earn €1,264 to €4,860 gross a month (**secondary**: [Paylab](https://paylab.com/gr/salaryinfo/management/business-development-manager)).
- Digital marketing manager, Greece: 80% earn €1,059 to €3,377 gross a month (**secondary**: [Paylab](https://www.paylab.com/gr/salaryinfo/marketing-advertising-pr/digital-marketing-manager?lang=en)).
- Clinical and regulatory lead: **no salary source checked** (assumption: €60k full-time, paid half). A clinician who keeps practising is the usual shape at this stage; it also answers the room's G2 condition (a committed clinician). Whether this person is a co-founder is the founder's call (D6).

**Why these two seats and not others (CEO view).** The clinician gap was the first missing resource in every seat of the lean room (`docs/lean/00-summary.md`, decision 9); v2 covered it with a €1,000-a-month adviser. The second engineer removes v2's single point of failure on the platform, and hospitals and governments ask for integrations before they buy. Considered and not recommended: a second business-development hire (public buyers are slow; a procurement adviser at €1k a month covers tenders until the first public pilot), and consumer marketing (no consumer acquisition, BMC).

### First 90 days of each hire

Day 1 is the day the first tranche lands, **after G2**. Nobody is hired before G2. If G2 fails, nobody is hired.

The founder's five directions: (1) scan, then the AI reads it; (2) store the extracted data; (3) store and analyse the original files; (4) real analysis and projection for the patient; (5) real matching.

| Days | Engineer (directions 1 to 3) | Clinical and regulatory lead (half-time, new) | Business development | Marketing (half-time) |
|---|---|---|---|---|
| **1 to 30** | **Consent and a DPIA first.** DPIA with the external data-protection officer; consent flow; an EU-region model endpoint with no training and no retention; security baseline; the five engineering controls from the regulatory opinion. No third person's record enters before the DPIA is signed off. | The clinical side of the DPIA; the pilot's clinical protocol; the ethics submission with the research partner; reads the regulatory opinion with the founder. | Turn G2's written pilot interest into a signed pilot agreement: scope, data-processing agreement, success metrics, the price after the pilot. The buyer names the price. | Consent and onboarding copy in English and Greek, reviewed by the clinical lead; the kit a hospital coordinator uses to ask patients for their history. |
| **31 to 60** | **The real pipeline on consented real records:** photo or PDF → extraction (1) → structured, cited record (2) → encrypted originals marked "verified by source" or "uploaded by patient" (3). | Defines with the ML engineer what "correct" means for each field; the clinician-annotated evaluation set starts once ethics approval lands. | 15 to 20 conversations with hospitals, private clinic chains and one public buyer (targets from `buyers.md`; nobody contacted). | A doctor one-pager and the pilot case-study template. |
| **61 to 90** | **Pilot-ready:** doctor view with cited answers, QR access grants with an expiry, the signed log, a one-command wipe. | Runs the clinical side of the pilot; collects the doctors' feedback; drafts the intended-use statement the regulatory opinion needs. | Pilot running; weekly measures. A second hospital in the pipeline. | Measures activation: of the patients the hospital asks, how many upload and finish consent. |

**ML engineer, first 90 days (starts month 2):** evaluation sets first (synthetic now, the clinician-annotated set with the research partner later); baseline field accuracy and a cost-per-case meter; then extraction to the **98% field accuracy after correction** target on Greek and English lab reports and discharge letters, with confidence per field so a person checks only the uncertain fields (this keeps **cost per case at €5 or less**); then monitoring on the pilot. Unchanged from v2.

**Second engineer, first 90 days (starts month 13):** the integration the first paying hospital asks for (FHIR or HL7 import and export); the security test's findings; on-call cover so the platform no longer rests on one person.

**Directions 4 and 5, said plainly:**
- **Direction 4 (analysis and projection for the patient)** collides with two of the founder's own rules: no diagnosis from the AI for the patient (13 Nov) and "route to the doctor", nothing interpreted (14 Nov). This round funds doctor-facing analysis with every answer citing its source, the patient's own values over time with no interpretation, and, **new in v3, the start of the regulatory pathway** (€50k, gated): the quality system projection would need. Certification itself (about €300k to €800k and 18 to 30 months, the CTO's estimate, not sourced) is the next round.
- **Direction 5 (real matching)** is opt-in only (13 Nov). v3 funds the consent design and **a trials sponsor pilot**: one sponsor or CRO, one trial, pre-screening with the patient's consent, priced as on slide 7c (€5,000 a trial plus €1,000 a randomised patient, about €24,000 a trial, assumptions; `docs/business/clinical-trials-fit.md` §8).

---

## 2b. The research partner

The founder, 14 Nov: "a colab with a UNI / research center". **Recommended shape: one clinical partner and one technical partner, under one small budget.** Nobody below has been contacted. Every name is a **target**.

**What it is for:** clinical validation of the extraction and the doctor view; an ethics-approved, clinician-annotated evaluation set (the only fair test of the 98% bar); research credibility and a joint publication on the method; the grant and consortium routes later; part of the clinician gap. **New in v3:** the validation contract runs to month 21, so its results can feed the clinical evaluation the quality system would need.

**Targets (not contacted):**

| Target | Type | Why it fits | Existence checked |
|---|---|---|---|
| **NKUA Medical School with Attikon University General Hospital** (Haidari, Athens) | Clinical, first choice | A university hospital with a research record, close to the Athens team | **secondary** ([ERA-LEARN](https://era-learn.eu/network-information/networks/jpiamr-action/3rd-jpiamr-action-joint-call-2022/international-fungal-network-for-one-health-resistance-surveillance-antifungal-resistance/attikon-university-general-hospital-medical-school-national-and-kapodistrian-university-of-athens)); 383 registered trials in the EU trials register ([CTIS](https://www.ctis.eu/sites/greece/org-100030696)). Its ethics committee page was **not** found |
| **Athena Research Center, Archimedes unit** (Marousi, Athens) | Technical, first choice | AI, data science and algorithms; health care among its application areas; Greek-language NLP | **secondary** ([EETN](https://www.eetn.gr/en/archimedes-new-research-unit-of-athena-research-centre-on-ai-data-science-and-algorithms/), [Archimedes](https://archimedesai.gr/en/research-areas)) |
| **FORTH-ICS, Computational BioMedicine Laboratory** (Heraklion) | Technical, health-specific | Biomedical informatics; pairs with a Crete clinical partner if Athens does not work | **secondary** ([FORTH-ICS CBML](https://ics.forth.gr/cbml/cbml-contact-information)) |
| **NTUA, biomedical engineering** (Athens) | Technical, students | MSc and PhD students for the student project | **secondary** ([biomed.ntua.gr](https://www.biomed.ntua.gr/people/phd-candidates/)) |
| **NCSR Demokritos, Institute of Informatics and Telecommunications** (Athens) | Technical | Software and knowledge engineering, NLP | **secondary** ([EETN](https://www.eetn.gr/en/research_fields/planning-and-scheduling-en/)) |
| **BRFAA** (Biomedical Research Foundation, Academy of Athens) | Biomedical, lower fit | Biomarker and clinical research; less fit for document AI | **secondary** ([CORDIS](https://cordis.europa.eu/docs/results/245/245928/final1-transmed-presentation-2013.pdf)) |

**What it costs (all assumptions; no price was asked):**

| Item | When | Cost | Note |
|---|---|---|---|
| Ethics approval and a data-sharing agreement | Month 2 | €3,000 | Approval takes about 2 to 3 months (assumption): data arrives from month 4 |
| Clinical validation contract, through the university's research account | Months 4 to 21 (v2: to 15) | €36,000 (€2,000 a month) | Clinician-researchers' time; the university's overhead included |
| One MSc or PhD student project at the technical partner | Months 4 to 15 | €10,800 (€900 a month) | Extraction benchmarks on Greek and English records |
| **Total** | | **€49,800** (5% of €1M) | Grant money for the partner is not counted until signed |

**One condition (CEO view):** the product IP stays with the company, and the university may publish the method after a short review (D12). A contract that claims the product IP is a reason to walk away.

---

## 3. The funding ask

**€1M over 24 months (recommended; v2 was €600k over 18).** Month 1 is about March 2027: G2 on 15 Jan 2027 plus about six weeks to close the first tranche (assumption).

**Why 24 months (CFO view).** 18 months ends before slide 11's conservative line can pay for the team, so the next round would be raised on a pilot alone. 24 months of planned spend, plus an 11% buffer, carries the company to break-even on the conservative line (month 29) with money left. Longer than 24 raises more at the weakest point of the evidence (28/100 market fit).

### Use of funds, by line

| Line | 24 months | % of €1M | What it buys |
|---|---|---|---|
| **Team (6)** | €577.7k | **58%** | Section 2 |
| **Regulatory, clinical and legal** | €67.0k | **7%** | Regulatory opinion €10k · DPIA €15k · data-protection officer as a service €12k · pilot contracts and terms €10k · external security test €12k · PATHIEN trademark €8k. v2's clinical adviser (€18k) is replaced by the lead |
| **Regulatory pathway** (new, gated) | €50.0k | **5%** | Months 10 to 24: a quality management system set up with a consultant (the ISO 13485 groundwork), an eQMS tool, a gap check of the technical documentation. **Released only if the regulatory opinion says the roadmap needs a device route**; otherwise it returns to the buffer. Certification is not in this round. No price was asked |
| **Research partner** | €49.8k | **5%** | Section 2b |
| **Infrastructure and AI** | €44.0k | **4%** | €1.5k a month to month 9 (set-up €2k in month 1), €2k a month from month 10 (evaluation compute, annotation tools, hospital-grade hosting) |
| **Pilots, sales and go-to-market** | €60.0k | **6%** | €2.5k a month: travel to hospitals and clinic chains, health-tech events, pilot materials, translation checks |
| **Public-procurement adviser** (new) | €15.0k | **2%** | €1k a month, months 10 to 24: tenders and framework agreements for public hospitals and government buyers |
| **Trials sponsor pilot** (new) | €25.0k | **3%** | Months 10 to 18: the sponsor or CRO contract, the ethics amendment for pre-screening consent, turning one trial's criteria into rules. **Released when a sponsor or CRO agrees a pilot in writing** |
| **Buffer** | €111.6k | **11%** | About 3.4 months of the steady burn: slower sales, a longer DPIA or ethics approval, a gap before tranche 2 |
| **Total** | **€1,000.0k** | **100%** | |

### Use of funds, by function (the slide's "Why")

| Function | Lines | 24 months | % of €1M | v2 (€600k) |
|---|---|---|---|---|
| **Sell: marketing and sales** | Business development €117.8k + marketing €67.6k + pilots and go-to-market €60.0k + procurement adviser €15.0k + trials sponsor pilot €25.0k | **€285k** | **29%** | €168k, 28% |
| **Build: product and AI** | Engineer €126.6k + ML engineer €133.0k + second engineer €57.2k + infrastructure and AI €44.0k | **€361k** | **36%** | €226k, 38% |
| **Prove: clinical, regulatory, legal** | Clinical and regulatory lead €75.5k + regulatory and legal €67.0k + regulatory pathway €50.0k + research partner €49.8k | **€242k** | **24%** | €120k, 20% |
| **Buffer** | | **€112k** | **11%** | €86k, 14% |

Not in the budget: **the founder's own pay** (D5; €3,000 a month would cost €72k over 24 months and take most of the buffer), equity for the hires (D8), and certification.

### Burn per quarter

| Quarter | Plan months | Burn a month | Why |
|---|---|---|---|
| Q1 | 1 to 3 | **€37.6k** | Engineer and the clinical lead start, then the ML engineer and business development; regulatory opinion, DPIA, contracts, security test |
| Q2 | 4 to 6 | **€31.2k** | Trademark; marketing half-time; research partner starts |
| Q3 | 7 to 9 | **€28.5k** | Pilot running; the lowest burn while the three numbers are measured |
| Q4 | 10 to 12 | **€38.0k** | Tranche 2: marketing full-time; the regulatory pathway, the procurement adviser and the trials pilot start |
| Q5 | 13 to 15 | **€42.8k** | Second engineer; the peak |
| Q6 | 16 to 18 | **€41.9k** | Student project ends |
| Q7 | 19 to 21 | **€39.1k** | Trials pilot ends; validation contract ends at month 21 |
| Q8 | 22 to 24 | **€37.1k** | Full team, run costs, regulatory pathway |
| After | 25 on | **€32.7k** | The steady team of six with run costs; certification is the next round |

Average €37.0k a month. Months 1 to 9 cost €292k, inside tranche 1. Months 10 to 24 cost €596k; with the buffer, tranche 2 is €700k.

### Milestones the money buys

| When | Milestone | Tranche |
|---|---|---|
| 30 Nov 2026 | **G1** (before any money): 2 of 5 buyers name a cost and a budget owner, plus 1 written pilot interest; 3 of 5 doctors name the moment they would open it | none |
| 15 Jan 2027 | **G2** (before any money): a pilot agreed in writing with a non-insurer buyer; the regulatory adviser's first opinion; a clinician committed (the clinical and regulatory lead) | none |
| Months 1 to 3 | DPIA signed off; the real pipeline (directions 1 to 3) on consented records; pilot agreement signed; ethics submission | 1 (**€300k**, covers months 1 to 9: €292k) |
| Months 3 to 8 | Free pilot in one hospital department (2 to 4 months, BMC); 98% accuracy and cost per case measured on the clinician-annotated set | 1 |
| About month 9 | **The three numbers** (section 5) measured; tranche 2 released only if they hold | 2 (**€700k**) |
| Months 9 to 14 | **First paid hospital.** Slide 11's year 1: €26k (conservative) to €258k (upside) in its paid half-year | 2 |
| Months 10 to 18 | Regulatory pathway starts, if the opinion asks for it; trials sponsor pilot, if a sponsor signs; private clinic chain seats; one public buyer in a tender or framework (pipeline, no revenue counted) | 2 |
| Months 13 to 24 | Second engineer: hospital integrations; second paying hospital; the clinical validation results with the partner (month 21); EIC Accelerator proposal for the certification round | 2 |

### Revenue against cost (slide 11, conservative and upside)

**Method (v3, in `docs/business/funding-model.py`).** Slide 11's year 1 starts when the pilot starts (plan month 3); its first half is the free pilot, so paid revenue starts at plan month 9. Inside each slide-11 year, monthly revenue climbs in a straight line: year 1 from zero; years 2 and 3 from the last month of the year before, to the year's total. After year 3, revenue is held flat (no growth assumed). Gross margin 87.5% (€5 cost per €40 case: the third number). After month 24 the cost is the steady €32.7k. v2's cost line is rerun on the same method for the comparison; v2's own figures used a slightly different ramp (it put the crossing at month 26).

| | Conservative (slide 11: €26k / €180k / €560k) | Upside (slide 11: €258k / €1.7M / €4.85M) |
|---|---|---|
| Revenue inside the 24 months | **about €164k** | **about €1.57M** |
| Monthly revenue at month 24 | about €19k (cost €37k) | about €179k (cost €37k) |
| **Revenue passes costs** | **month 29** (gross profit: month 31), five months after the planned 24 | **month 12** |
| Cash at month 24 | about €255k | about €1.49M |
| Cash at its lowest | **€204k, month 30** | never below the start |
| Sales can slip, and the money still reaches break-even | **6 months** | 18 months |
| Honest reading | **Break-even inside the money, not inside the 24 planned months.** If the conservative line holds, no second round is needed to reach it; a round is still needed for certification | Self-funding from the first paid year; tranche 2 could be smaller. The case to hope for, not to plan on |

**€600k against €1M, on the same method (conservative line):**

| | €600k, 18 months (v2) | €1M, 24 months (v3) |
|---|---|---|
| Team | 4 | 6 |
| Months the money lasts with no revenue at all | 21 | **27** |
| Revenue passes costs | month 28 | month 29 |
| Cash at its lowest | €60k (month 27) | **€204k** (month 30) |
| Months sales can slip and still reach break-even | 2 | **6** |
| Sell (marketing and sales) | €168k | **€285k** |

**Not counted:** clinical-trials revenue. If the sponsor pilot converts (one trial in months 19 to 24, then five a year at about €24,000 each; assumptions), revenue passes costs two months earlier (month 27). Slide 11 still does not add it as a line (`docs/business/clinical-trials-fit.md` §8). Government revenue is not counted inside 24 months: procurement is slow.

**The upside does not change the ask.** The plan is sized on the conservative line; if the upside arrives, tranche 2 can be smaller or skipped.

**Levers if the founder wants less than €1M (CFO view):** second engineer at month 19 (−€29k); the regulatory pathway left to the next round (−€50k); the trials pilot funded by its sponsor (−€25k); research partner back to 15 months (−€12k). Together about €115k: the ask would be about €885k. Rerun with the same €112k buffer: break-even still month 29, and sales can still slip 6 months. What is lost is the clinician-led regulatory start, the trials test and the earlier second engineer, not the runway.

---

## 4. Funding sources and sequence (reference only, not on the slides)

**Not on any slide.** The founder, 14 Nov: "Where the money comes from -> no". This section stays as background for the founder and for questions in the room. v3 updates only the amounts in the sequence and the dilution; the source table is unchanged from v2.

Realistic for a Greek solo founder in health tech: non-dilutive first, equity for the remainder. A grant is counted as runway only once it is signed.

### Non-dilutive

| Source | What it gives | Fit for Pathien | Status |
|---|---|---|---|
| **EIC Accelerator** (EU) | Grant **up to €2.5M** (TRL 6 to 8) plus equity **€1M to €10M**; 2027 full-proposal cut-offs 20 Jan, 17 Mar, 1 Sep, 4 Nov 2027 | **The certification round, not this one.** Short proposal around plan month 9, full proposal at the 1 Sep or 4 Nov 2027 cut-off. The v3 quality-system work makes the proposal stronger. Three failed submissions bar a company (secondary) | **verified** ([EIC](https://eic.ec.europa.eu/eic-funding-opportunities/eic-accelerator_en)); three-strike rule **secondary** ([ABGi](https://www.abgi-uk.com/news-resources/eic-accelerator-grant-funding-2026/)) |
| **EIC Pathfinder** (EU) | Research funding for breakthrough science | Not a fit at this stage | **unverified** |
| **Horizon Europe, health calls** (EU) | Consortium research projects | Direction 5: join a rare-disease consortium as the SME partner | **unverified** |
| **EIT Health, Transformative Healthcare Instrument** | €300k to €500k for an SME, up to 50% of project cost | Possible for tranche 2 if a 2027 call opens; needs the other 50% matched | **secondary** ([UKRI IUK](https://iuk-business-connect.org.uk/opportunities/eit-transformative-healthcare-instrument-2026/), [StartupCafe](https://startupcafe.ro/granturi-de-pana-la-500-000-eur-pentru-startup-uri-de-sanatate-firmele-trebuie-sa-vina-cu-jumatate-din-bani-si-sa-accepte-un-viitor-actionar-103329)); 2027 call **unverified** |
| **EIT Health, Headstart** | Up to €50k | Early help for tranche 1, if it runs in 2027 | **secondary**, undated ([EIT](https://www.eit.europa.eu/news-events/news/eit-health-spain-names-15-winners-headstart-funding)) |
| **Elevate Greece** | The national start-up registry; the door to the Greek instruments | Register once Pathien has a legal entity (D9) | **secondary** ([elevategreece.gov.gr](https://elevategreece.gov.gr/)) |
| **ESPA 2021–2027, Competitiveness programme** | One report names a €70M action "Starting an Entrepreneurial Business" | Candidate for tranche 1; check the call | **unverified**; check [espa.gr](https://www.espa.gr) |
| **Greece 2.0 (Recovery Fund) instruments** | Loans and grants for businesses | None checked | **unverified** |
| **Hackathon prizes and credits** | Credits listed at kickoff | Covers the demo, not the plan | credits **verified** in `docs/00-founder-brief.md` ([Polymath42](https://hackathon.polymath42.com/credits)); prizes **unverified** |

### Equity (pre-seed, after G2)

| Source | What it gives | Status |
|---|---|---|
| **EquiFund II** | A **€200M fund of funds** (EU Cohesion funds and Greek resources, managed by the EIF), focused on life sciences and health; invests through selected VC funds | **secondary** ([European Commission](https://ec.europa.eu/regional_policy/whats-new/newsroom/18-06-2024-eur-200-million-for-equifund-2-a-financial-instrument-for-boosting-greek-startups-and-smes-in-life-sciences-and-healthcare_en), [EIF press](https://www.eif.org/press/all/eib-group-to-support-greek-businesses-and-startups-in-life-sciences-health-and-sustainability-with-eur-200-million-new-equity-financing)); selected fund managers **not verified** |
| **Greek VCs from EquiFund I** | Big Pi Ventures and Marathon VC appear in the 2018 listings | **secondary** (2018); current fit **unverified** |
| **Greek and EU angels** | Typical tranche-1 money | **unverified**; nobody is contacted without the founder's go |
| **EU health-tech VCs** | Seed after the pilot | **Not named here** |

### The sequence (recommended)

1. **Now to G1 (30 Nov 2026):** €0. Hackathon credits only.
2. **G1 to G2 (15 Jan 2027):** the regulatory opinion, €3k to €10k of the founder's own money, only if he says yes (MIN-4442). Draft the EIC short proposal.
3. **After G2, tranche 1 (€300k):** Greek grant (ESPA) and EIT Health applications go in; the €300k closes from angels on a SAFE or convertible note with a cap (D2). Target close about March 2027.
4. **After the three numbers, tranche 2 (€700k, about month 9):** replaced in part by any grant **signed** by then; the rest from the same angels or a Greek VC from the EquiFund II funds, at a higher cap if the numbers hold.
5. **Months 18 to 24:** EIC Accelerator full proposal (1 Sep or 4 Nov 2027 cut-off) and a seed round for EU MDR certification (CTO estimate €300k to €800k).

**Dilution (assumption):** €1M at a pre-money cap of €3M to €4M is about 20% to 25%. Tranched, with tranche 1 (€300k) at a €2.5M to €3.5M cap (about 8% to 11%) and tranche 2 at a higher cap after the three numbers, the total can land nearer 18% to 20%. Every euro of signed grant lowers it. The caps are guesses, not quotes; the founder decides (D2).

---

## 5. The CFO view

### Unit economics, from slide 11 (all assumptions)

| | Per case (hospital department) | Per seat (private clinic chains, telehealth) |
|---|---|---|
| Price | €40 (conservative) to €80 (upside); no published price exists | €50 a month (€600 a year), 40% of Tandem Pro's published €125 |
| Variable cost | €2 to €5 if the machine is accurate enough; **€10 to €20 if a person must check each case** | €3 to €5 a month |
| Gross margin | about 90% machine-only; **about 50% to 75% with a human check**; the model uses 87.5% | about 90% |
| Per customer a year | One hospital: €40k (1,000 cases × €40) to €240k (3,000 × €80) | One 20-doctor clinic: €12k |
| Cost to win one hospital | About €30k to €40k: a share of business development, travel, a free pilot of 2 to 4 months | — |
| Payback (conservative) | About 12 months at €35k gross profit a year | — |

**Break-even at a team of six** (steady burn €32.7k a month after month 24): about **€449k of revenue a year at 87.5% margin** (v2, team of four: €340k at 90%). That is about **11 hospitals at the conservative €40k**, about 2 at the upside's €240k, or about 750 doctor seats. Slide 11's conservative year 3 is €560k. At a 75% margin break-even is about €523k a year; at 50%, about €785k. **Keeping the margin near 87.5% is the ML engineer's job.**

### Key risks to the plan

1. **No buyer pays for the history (R3).** The whole revenue line rests on it. Tested at G1, before any money.
2. **The device line moves.** If the regulatory opinion says cited retrieval is a medical device, the cost becomes €300k to €800k and 18 to 30 months (CTO estimate). v3's €50k quality-system start is the first step on that road, not the road. Tested at G1 or G2.
3. **Accuracy costs people.** If 98% needs a person on every case, margin falls to about 50% to 75%, and break-even rises to €523k to €785k a year.
4. **Public buyers are slow.** Governments buy through tenders that can take longer than this plan; the plan counts no government revenue. Each month of hospital delay costs about €37k of runway; the money absorbs about 6 months of delay on the conservative line.
5. **The team.** A solo founder with two other products. v3 adds a clinician (half-time) and a second engineer; the founder's own time is still the constraint (D5).
6. **Grants arrive late or not at all.** None is counted until signed.
7. **The name.** PATHIEN trademark clearance is pending (`docs/brand/brand-check-pathien.md`).
8. **The insurer rule narrows the buyers by design.** Insurers stay out; the five open edges are the founder's.
9. **The research partner.** University contracts and ethics approval can take longer; IP terms can claim too much (D12). The pilot does not wait for the partner.
10. **The trials pilot.** No sponsor has been asked. If none signs by month 12, its €25k returns to the buffer.

### The three numbers to validate in the pilot before tranche 2

| # | Number | Threshold (recommended) | Why it matters |
|---|---|---|---|
| 1 | **The price a buyer names**, per case, and which budget pays it | **€40 a case or more**, named by the buyer | Slide 11's conservative line starts at €40 |
| 2 | **Paid cases per hospital a year** | **1,000 or more** | One hospital at 1,000 × €40 = €40k; below that, break-even needs too many hospitals |
| 3 | **Cost per case at 98% field accuracy**, correction time included | **€5 or less** (87.5% gross margin at €40) | Software margin or service margin. Owner: the ML engineer, on the research partner's annotated set |

---

## 6. Decisions only the founder can make

The CEO seat recommends; it takes none of these. They are money, hiring and company commitments.

| # | Decision | Recommendation |
|---|---|---|
| **D1** | Raise at all, and when | Only after G2 passes. Park by default until then |
| **D2** | Amount, tranches and structure | **€1M** over 24 months in two tranches (**€300k** after G2, **€700k** after the three numbers); grants first; equity on a SAFE or convertible note with a cap. Dilution about 18% to 25% (assumption). Levers to about €885k in section 3 |
| **D3** | Hiring order | Engineer and the clinical and regulatory lead in month 1; ML engineer and business development in month 2; marketing in month 3; second engineer in month 13 |
| **D4** | Full-time or part-time | Engineers, ML engineer and business development full-time; the clinical lead half-time; marketing half-time until tranche 2, then full-time |
| **D5** | The founder's own time and pay | At least half-time once tranche 1 lands; his pay is not in the €1M (€3,000 a month adds €72k, from the buffer) |
| **D6** | The clinician | v3 hires a half-time clinical and regulatory lead from month 1 (€76k over 24 months). Co-founder (equity) or employee is his call. The room's G2 condition asks for a committed clinician |
| **D7** | Hires or co-founders | Three of the roles match the studio's co-founder search (2026-11-10: "Eng - Sales - Marketing"); his call |
| **D8** | Option pool | Recommend 10% (assumption), with vesting |
| **D9** | The legal entity | Pathien as its own company or inside the studio; needed before Elevate Greece, a grant or a SAFE |
| **D10** | Direction 4 against his own rules | How "analysis and projection for the patient" reads against "route to the doctor, nothing interpreted"; v3 starts the quality system only if the opinion asks for it |
| **D11** | The research partner | Approach NKUA Medical School with Attikon (clinical) and the Athena Research Center's Archimedes unit (technical) after G1, budget €49.8k; nobody is contacted without his go |
| **D12** | IP and publication terms | The product IP stays with the company; the university may publish the method after a short review |
| **D13** (new) | The two new seats and the three new lines | Clinical and regulatory lead, second engineer, regulatory pathway (gated), procurement adviser, trials sponsor pilot. Each can be dropped; section 3 shows what each saves |

---

## 7. Slide-ready text (v3)

**Replaces** v2's slides 14 and 15. After Anna's renumbering they are "Team and ask" and "Why" (about 13 and 14). In the founder's three parts: **Team today** and **What I ask** on "Team and ask", **Why** on "Why". **No funding-sources content** (founder, 14 Nov). Bodies kept under 60 words and number-led (the founder keeps asking for less text). Anna polishes the wording; Pix designs. Every number keeps its label at the same size. These are **recommended** words: the founder approves public copy and the amount.

### "Team and ask"

**Headline:** One founder and AI agents built this. Next: €1M, released by a hospital pilot.

**Body (42 words):**
**Team today.** Lefteris Georgaras, founder, onedotatatime.design, with AI agents. Research partner: a Greek university hospital and an AI research centre (targets, not yet contacted).
**What I ask.** €1M over 24 months (our plan), in two tranches. Each is released by a gate.

**Table, the gates:**

| Gate, before any money | Tranche | Months |
|---|---|---|
| A hospital signs a pilot | **€300k** | 1 to 9: the real pipeline, the pilot |
| The pilot proves €40+ a case, 1,000+ cases a year, €5 or less a case to run | **€700k** | 10 to 24: paying hospitals and clinics, public buyers, regulatory groundwork |

**Footer, required:** Our plan, not a raise in progress. Nobody is hired before a hospital signs a pilot. Certification is the next round.

**Visual note for Pix:** Left: the founder, a small "AI agents" mark, one outlined "research partner" tile marked "target". Right: the two gates as two steps, the money on each step. No stock faces. No red.

**Speaker notes (~20 s):** "Today it is me, and a team of AI agents that built this with me this weekend. What I ask is one million euros over twenty-four months, in two parts. Three hundred thousand only when a hospital signs a pilot. Seven hundred thousand only when that pilot proves the price, the volume and the cost of each case."

### "Why"

**Headline:** Why €1M: six people, 29% to sell, break-even at month 29.

**Body (41 words):**
Two new seats close our gaps: a clinical and regulatory lead, and a second engineer for hospital and government systems. Selling gets €285k. On our conservative line, revenue passes costs at month 29, and about €200k is still in the bank.

**Table 1, the team:**

| Who | From month | Cost a month* |
|---|---|---|
| Engineer | 1 | €5.3k |
| Clinical and regulatory lead, half-time (new) | 1 | €3.1k |
| ML engineer | 2 | €5.8k |
| Business development | 2 | €5.1k |
| Marketing | 3 | €1.8k, then €3.7k |
| Second engineer (new) | 13 | €4.8k |
| Research partner (target) | 4 | €2.9k |

**Table 2, where the €1M goes (one bar in four parts):**

| Sell: marketing and sales | Build: product and AI | Prove: clinical, regulatory, legal | Buffer |
|---|---|---|---|
| **€285k · 29%** | €361k · 36% | €242k · 24% | €112k · 11% |

**Footer, required:** \* Our plan. Every cost is an assumption at Athens rates, with employer contributions. Sell = business development, marketing, pilots, public procurement, a trials pilot. Break-even on our conservative revenue line (slide 11).

**Visual note for Pix:** Table 2 as one horizontal bar in four parts; "Sell" carries the one accent. "Our plan" and "assumption" at the same size as the numbers. No red.

**Speaker notes (~20 s):** "Why this amount. Six people: two engineers and an ML engineer to build it, a clinician to keep it safe and on the regulatory path, and business development and marketing to sell it to hospitals, clinics and governments. Twenty-nine percent goes to selling. On our conservative line it pays for itself at month twenty-nine, with money left. If you know a hospital that would pilot this, come and find me. Thank you."

**Contact line** ("Why", bottom): `hello@onedotatatime.design` · healthapp-landing.pages.dev (email: founder, 2026-11-14).

---

## Sources in the repo

`docs/business/funding-model.py` (the v3 model; rerun to check every number in sections 3 and 5) · `docs/business/clinical-trials-fit.md` §8 (trial pricing) · `docs/deck/deck-content.md` (slides 7c, 10, 11) · `docs/lean/00-summary.md` · `docs/lean/05-business-model-canvas.md` (CTO cost estimates, BMC) · `docs/lean/06-market-fit-scorecard.md` (28/100, gates, R1 to R11) · `docs/lean/room/ceo.md`, `cto.md` · `docs/research/buyers.md`, `market-and-competitors.md` · `docs/00-founder-brief.md` · `~/AppDevelopment/conductor/docs/founder-decisions.md` (healthapp entries; 2026-11-15 "raise ask €1M").
