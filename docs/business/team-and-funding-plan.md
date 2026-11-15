# Pathien: team and funding plan (v4)

| | |
|---|---|
| **Owner** | CEO seat (ceo-minhos), on Linear MIN-4503 (deck). Copy polish: Anna (Marketing). Slide design: Pix (Design). |
| **Date** | 15 Nov 2026, Gen AI Summit Hackathon, Athens |
| **Version** | **v4, 15 Nov 2026** (CFO review of deck v4.6, then the CFO's decision on the founder's delegation, MIN-4503). Changes from v3: (1) **tranches €400k then €600k, both committed at signing**, the second released by its gate (were €300k then €700k, the second raised after the gate); (2) **one cost method for every hire**: variable pay loaded with employer contributions, €200 of tools for every person including part-time (+€14.5k over 24 months, out of the buffer: €112k → €97k); (3) **break-even means gross profit covers running costs: month 31** (v3 said "revenue passes costs at month 29"); (4) **cash simulated tranche by tranche**, both lows reported on both lines; the upside's low corrected (€690k at month 11 after tranche 2, not "never below the start"); (5) the tranche-2 gate written as a **written commitment**; (6) **unit economics in two lines** for A9; (7) **trials: five a year** everywhere; (8) slide numbers follow the deck since v4.2 (revenue is slide 10, impact 7, trials economics 6c, team and ask 13 and 14). The use-of-funds lines, the team, the hiring months and the €1M over 24 months are unchanged. The deck changes are in `docs/business/cfo-fixes-v4.7.md`. v3 is in git history; `python3 docs/business/funding-model.py --v3` reproduces its numbers. |
| **Status** | **€1M over 24 months confirmed by the founder, 15 Nov 2026** ("Confirm €1M"). **Tranche structure: CFO on the founder's behalf, 15 Nov 2026** (founder delegated: "CFO will answer"); the founder can overturn it. **Still open:** the two new seats (D6/D13), the hiring order (D3), the founder's own pay (D5), the caps (D2), the trial fee (Q38), government revenue (Q39). Nothing here commits the company, contacts anyone or spends money. |
| **Method** | The CEO lens (ceo-advisor: capital allocation, what €1M buys that €600k does not), the CFO lens (cfo-advisor: runway tranche by tranche, burn, break-even as gross profit against running costs, unit economics), the analyst lens (a month-by-month model you can rerun: `docs/business/funding-model.py`), and the founder-load lens (founder-coach). |
| **Labels** | **verified**: read at the primary source. **secondary**: quoted by someone else, or read only through a search summary. **assumption**: our number, with its anchor. **unverified**: named, not checked. **Every cost and revenue figure in this file is an assumption** unless it carries another label. |

**The founder's words.**
- 14 Nov: "Just me Lefteris Georgaras (founder of onedotatatime.design studio)"; "Also do an excersise with CEO use funding advisors CFO and add a plan for team and funding."; "Mention small team of 3, marketing, business development, engineer".
- 14 Nov, on v1: "Team today / What I ask -> the result of the exercise (have you done that?) / Why -> say about the team and the marketing / sales spends / Where the money comes from -> no / We need to add at the team one ML engineer and a colab with a UNI / research center".
- 15 Nov, on v2: "Fund 1m -> do the maths". Also 15 Nov (relayed in the brief): the buyers are **hospitals, governments and private clinics**.
- 15 Nov, on v3: "Confirm €1M".
- **15 Nov, on the tranche choice after the CFO review ((a) €400k / €600k, or (b) both tranches committed at signing): "CFO will answer".**

---

## Bottom line

- **The ask: €1M over 24 months, committed at one signing after G2, released in two tranches.** **€400k** at signing, for months 1 to 9 (€297k) plus about 3.5 months of reserve. **€600k** committed at the same signing and released when the gate holds: **a hospital commits in writing to 1,000 or more paid cases a year at €40 or more, and the pilot measures €5 or less a case to run** (section 5). About month 10.
- **Why this shape (CFO view).** v3's €300k tranche covered months 1 to 9 with 8 days to spare, and its gate was due in the same month: a pilot two weeks late emptied the company with €700k only promised. Now tranche 1 carries its own reserve for a late gate, and tranche 2 is a drawdown, not a second raise. An investor risks €400k before the gate, not €1M (section 3, "The tranches").
- **What €1M buys that €600k did not (CEO view).** Not the same plan, bigger. Five things, in order of the risk they remove:
  1. **Runway to break-even.** On slide 10's conservative line, gross profit covers running costs at **month 31**, and the money is still there: **€186k at its lowest point after tranche 2 (month 30)**. Hospital sales can arrive **5 months late** and the money still reaches break-even. On the same method, €600k reached break-even with €60k left and 2 months of slack.
  2. **A clinician on the team from day 1.** A half-time **clinical and regulatory lead** fills the gap every seat in the lean room named first.
  3. **The regulatory pathway, started and gated.** €50k for a quality management system (the ISO 13485 groundwork), released only if the regulatory opinion says the roadmap needs a device route. Certification itself stays in the next round.
  4. **Selling to public buyers.** Hospitals, governments and private clinics buy slowly. More runway, a public-procurement adviser, and a second engineer for hospital and national-system integrations (from month 13).
  5. **A clinical-trials sponsor pilot** (€25k): tests the second revenue line on slide 6c (direction 5).
- **The team to hire: 6.** Engineer €5.3k a month · clinical and regulatory lead (half-time, new) €3.2k · ML engineer €5.8k · business development €5.5k · marketing €2.0k half-time, then €3.9k · second engineer (new, month 13) €4.8k. Loaded Athens costs, one method for every hire.
- **Use of funds:** **Sell (marketing and sales) €297k, 30%** · Build €361k, 36% · Prove €245k, 24% · Buffer €97k, 10%.
- **Burn:** €38.0k a month in the first quarter (one-off legal and security costs), down to €29.2k in the third, **€38.6k to €43.4k a month in year 2** with the full team, **€33.4k a month after month 24** (the steady team of six). Average €37.6k.
- **Break-even (gross profit covers running costs):** about **€458k of revenue a year** at an 87.5% gross margin, about **12 hospitals** at €40k a year. Conservative line: **month 31**, after the 24 planned months but before the money runs out. Upside line: **month 12**.
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

The founder's four (engineer, ML engineer, business development, marketing) keep the same pay and start months as v2. €1M adds two seats: a **clinical and regulatory lead** (half-time, month 1) and a **second engineer** (month 13).

Costs are **loaded monthly costs** for a Greek employee in Athens, **one method for every hire (v4)**: gross annual salary (paid as 14 monthly salaries in Greece), variable pay included, × 1.2179 for the employer's social security (21.79% from 1 Jan 2025, **secondary**: [PwC tax summaries](https://taxsummaries.pwc.com/greece/individual/other-taxes); other sources give 22.29% to 22.54%), ÷ 12, × the share of time, plus about €200 a month for tools for every person, part-time included. v3 left business development's variable pay unloaded and gave marketing no tools and the clinical lead half the tools: €14.5k over 24 months, now in the costs and out of the buffer. Every salary is an **assumption**.

| # | Hire | Role in one line | Starts | Gross a year (assumption) | **Loaded a month** | **24 months** |
|---|---|---|---|---|---|---|
| 1 | **Engineer** (platform and pipeline) | Builds and runs the real pipeline: scan, extract, store, keep the originals, with consent and a DPIA first (directions 1 to 3) | Month 1, full-time | €50,000 | **€5.3k** | **€127k** |
| 2 | **Clinical and regulatory lead** (new in v3) | A physician with clinical-affairs or MDR experience: the DPIA's clinical side, the pilot's clinical protocol, the ethics file with the research partner, the doctor view, and the quality system if the opinion asks for it | Month 1, **half-time** (keeps clinical practice) | €60,000 full-time | **€3.2k** | **€78k** |
| 3 | **ML engineer** | Makes the reading accurate (98%) and cheap (€5 a case); owns every model and the evaluation sets | Month 2, full-time | €55,000 | **€5.8k** | **€133k** |
| 4 | **Business development** | Turns the signed pilot into paying hospitals and private clinic chains; works public tenders with the procurement adviser | Month 2, full-time | €45,000 + 15% variable (€51,750) | **€5.5k** | **€125k** |
| 5 | **Marketing** | Brings patients in through the hospital; consent and onboarding copy, the case study, the site | Month 3 half-time; full-time from month 10 | €36,000 full-time | **€2.0k**, then **€3.9k** | **€72k** |
| 6 | **Second engineer** (new in v3) | Hospital and national-system integrations (FHIR and HL7, a public buyer's systems), security, and the platform's second pair of hands | Month 13, full-time | €45,000 | **€4.8k** | **€57k** |
| | **Team total** | | | | **€28.4k a month at full team (month 13 on)** | **€592k (59%)** |

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
- **Direction 4 (analysis and projection for the patient)** collides with two of the founder's own rules: no diagnosis from the AI for the patient (13 Nov) and "route to the doctor", nothing interpreted (14 Nov). This round funds doctor-facing analysis with every answer citing its source, the patient's own values over time with no interpretation, and **the start of the regulatory pathway** (€50k, gated): the quality system projection would need. Certification itself (about €300k to €800k and 18 to 30 months, the CTO's estimate, not sourced) is the next round.
- **Direction 5 (real matching)** is opt-in only (13 Nov). This round funds the consent design and **a trials sponsor pilot**: one sponsor or CRO, one trial, pre-screening with the patient's consent, priced as on slide 6c (€5,000 a trial plus €1,000 a randomised patient, about €24,000 a trial, assumptions; `docs/business/clinical-trials-fit.md` §8).

---

## 2b. The research partner

The founder, 14 Nov: "a colab with a UNI / research center". **Recommended shape: one clinical partner and one technical partner, under one small budget.** Nobody below has been contacted. Every name is a **target**.

**What it is for:** clinical validation of the extraction and the doctor view; an ethics-approved, clinician-annotated evaluation set (the only fair test of the 98% bar); research credibility and a joint publication on the method; the grant and consortium routes later; part of the clinician gap. The validation contract runs to month 21, so its results can feed the clinical evaluation the quality system would need.

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

**€1M over 24 months (confirmed by the founder; v2 was €600k over 18).** Month 1 is about March 2027: G2 on 15 Jan 2027 plus about six weeks to close (assumption).

**Why 24 months (CFO view).** 18 months ends before slide 10's conservative line can pay for the team, so the next round would be raised on a pilot alone. 24 months of planned spend, plus a 10% buffer, carries the company to break-even on the conservative line (month 31) with money left. Longer than 24 raises more at the weakest point of the evidence (28/100 market fit).

### The tranches (v4: CFO on the founder's behalf, 15 Nov 2026)

The founder, 15 Nov, on (a) €400k / €600k or (b) both tranches committed at signing: **"CFO will answer"**. The CFO's answer is both together.

| Tranche | Committed | Drawn | Carries | Its own reserve |
|---|---|---|---|---|
| **1: €400k** | At one signing after G2 | Before month 1 (about March 2027) | Months 1 to 9: **€297k** | **€103k**: about **3.5 months** at the month-9 burn (€29.2k), for a late pilot or a late gate |
| **2: €600k** | **At the same signing** | When the gate holds (about month 10): a drawdown, not a new raise | Months 10 to 24: **€606k**, with what is left of tranche 1's reserve | The plan's buffer: **€97k** left at month 24 |

- **Why not €300k / €700k (v3).** Months 1 to 9 cost €297k on one cost method (€292k in v3): 3 days of cash (8 in v3) before a gate due in the same month.
- **Why not (a) alone.** €400k / €600k with tranche 2 raised after the gate: the €103k reserve covers a late pilot *or* a 3-month raise, not both, and a raise can take 6 months.
- **Why not (b) alone.** €300k / €700k with both committed: tranche 2 arrives in weeks, but tranche 1 has no reserve if the pilot runs late.
- **Sizing check (model):** a first tranche of €300k leaves 3 days of reserve; €350k, 1.8 months; **€400k, 3.5 months**; €450k, 5.2 months (more at risk before the gate for the investor, a harder first close).
- **If the gate fails:** the investor need not release tranche 2. Tranche 1, held at month 9's costs (no tranche-2 lines started), lasts to about **month 12.5**: time to change course, wind down cleanly, or find other money.
- **Fallback if no investor will commit tranche 2 at signing:** keep €400k / €600k and start the tranche-2 raise at month 6, on the pilot's interim numbers.
- **For the term sheet (the founder's call, D2):** both tranches in one SAFE or convertible-note agreement; tranche 2's cap agreed at signing and set above tranche 1's; the investor may release tranche 2 early. A lawyer drafts it; nothing is signed before G2.

### Use of funds, by line

| Line | 24 months | % of €1M | What it buys |
|---|---|---|---|
| **Team (6)** | €592.1k | **59%** | Section 2 |
| **Regulatory, clinical and legal** | €67.0k | **7%** | Regulatory opinion €10k · DPIA €15k · data-protection officer as a service €12k · pilot contracts and terms €10k · external security test €12k · PATHIEN trademark €8k. v2's clinical adviser (€18k) is replaced by the lead |
| **Regulatory pathway** (gated) | €50.0k | **5%** | Months 10 to 24: a quality management system set up with a consultant (the ISO 13485 groundwork), an eQMS tool, a gap check of the technical documentation. **Released only if the regulatory opinion says the roadmap needs a device route**; otherwise it returns to the buffer. Certification is not in this round. No price was asked |
| **Research partner** | €49.8k | **5%** | Section 2b |
| **Infrastructure and AI** | €44.0k | **4%** | €1.5k a month to month 9 (set-up €2k in month 1), €2k a month from month 10 (evaluation compute, annotation tools, hospital-grade hosting) |
| **Pilots, sales and go-to-market** | €60.0k | **6%** | €2.5k a month: travel to hospitals and clinic chains, health-tech events, pilot materials, translation checks |
| **Public-procurement adviser** | €15.0k | **2%** | €1k a month, months 10 to 24: tenders and framework agreements for public hospitals and government buyers |
| **Trials sponsor pilot** | €25.0k | **3%** | Months 10 to 18: the sponsor or CRO contract, the ethics amendment for pre-screening consent, turning one trial's criteria into rules. **Released when a sponsor or CRO agrees a pilot in writing** |
| **Buffer** | €97.1k | **10%** | About 2.9 months of the steady burn: slower sales, a longer DPIA or ethics approval. Tranche 1's reserve for a late gate is the same money, held early (section "The tranches") |
| **Total** | **€1,000.0k** | **100%** | |

### Use of funds, by function (the slide's "Why")

| Function | Lines | 24 months | % of €1M | v3 | v2 (€600k) |
|---|---|---|---|---|---|
| **Sell: marketing and sales** | Business development €125.4k + marketing €72.0k + pilots and go-to-market €60.0k + procurement adviser €15.0k + trials sponsor pilot €25.0k | **€297k** | **30%** | €285k, 29% | €168k, 28% |
| **Build: product and AI** | Engineer €126.6k + ML engineer €133.0k + second engineer €57.2k + infrastructure and AI €44.0k | **€361k** | **36%** | €361k, 36% | €226k, 38% |
| **Prove: clinical, regulatory, legal** | Clinical and regulatory lead €77.9k + regulatory and legal €67.0k + regulatory pathway €50.0k + research partner €49.8k | **€245k** | **24%** | €242k, 24% | €120k, 20% |
| **Buffer** | | **€97k** | **10%** | €112k, 11% | €86k, 14% |

The shares are 29.7%, 36.1%, 24.5% and 9.7%; rounded they sum to 100.

Not in the budget: **the founder's own pay** (D5; €3,000 a month would cost €72k over 24 months, most of the buffer), equity for the hires (D8), and certification.

### Burn per quarter

| Quarter | Plan months | Burn a month | Why |
|---|---|---|---|
| Q1 | 1 to 3 | **€38.0k** | Engineer and the clinical lead start, then the ML engineer and business development; regulatory opinion, DPIA, contracts, security test |
| Q2 | 4 to 6 | **€31.8k** | Trademark; marketing half-time; research partner starts |
| Q3 | 7 to 9 | **€29.2k** | Pilot running; the lowest burn while the three numbers are measured |
| Q4 | 10 to 12 | **€38.6k** | Tranche 2: marketing full-time; the regulatory pathway, the procurement adviser and the trials pilot start |
| Q5 | 13 to 15 | **€43.4k** | Second engineer; the peak |
| Q6 | 16 to 18 | **€42.5k** | Student project ends |
| Q7 | 19 to 21 | **€39.7k** | Trials pilot ends; validation contract ends at month 21 |
| Q8 | 22 to 24 | **€37.7k** | Full team, run costs, regulatory pathway |
| After | 25 on | **€33.4k** | The steady team of six with run costs; certification is the next round |

Average €37.6k a month. Months 1 to 9 cost €297k (tranche 1 is €400k); months 10 to 24 cost €606k (tranche 2 is €600k, plus what is left of tranche 1).

### Milestones the money buys

| When | Milestone | Tranche |
|---|---|---|
| 30 Nov 2026 | **G1** (before any money): 2 of 5 buyers name a cost and a budget owner, plus 1 written pilot interest; 3 of 5 doctors name the moment they would open it | none |
| 15 Jan 2027 | **G2** (before any money): a pilot agreed in writing with a non-insurer buyer; the regulatory adviser's first opinion; a clinician committed (the clinical and regulatory lead). **The €1M is committed at one signing** | none |
| Months 1 to 3 | DPIA signed off; the real pipeline (directions 1 to 3) on consented records; pilot agreement signed; ethics submission | 1 (**€400k**: months 1 to 9 cost €297k) |
| Months 3 to 8 | Free pilot in one hospital department (2 to 4 months, BMC); 98% accuracy and cost per case measured on the clinician-annotated set | 1 |
| About month 9 | **The gate** (section 5): the hospital commits in writing to 1,000 or more paid cases a year at €40 or more, and a case costs €5 or less to run. Tranche 2 is released only if it holds | 2 (**€600k**, released) |
| Months 9 to 14 | **First paid hospital.** Slide 10's year 1: €26k (conservative) to €258k (upside) in its paid half-year | 2 |
| Months 10 to 18 | Regulatory pathway starts, if the opinion asks for it; trials sponsor pilot, if a sponsor signs; private clinic chain seats; one public buyer in a tender or framework (pipeline, no revenue counted) | 2 |
| Months 13 to 24 | Second engineer: hospital integrations; second paying hospital; the clinical validation results with the partner (month 21); EIC Accelerator proposal for the certification round | 2 |

### Revenue against cost (slide 10, conservative and upside)

**Method (`docs/business/funding-model.py` v4).** Slide 10's year 1 starts when the pilot starts (plan month 3); its first half is the free pilot, so paid revenue starts at plan month 9. Inside each slide-10 year, monthly revenue climbs in a straight line: year 1 from zero; years 2 and 3 from the last month of the year before, to the year's total. After year 3, revenue is held flat (no growth assumed). Gross margin 87.5% (€5 cost per €40 case: the third number). After month 24 the cost is the steady €33.4k. Cash is simulated tranche by tranche: €400k before month 1, €600k before month 10.

**One definition of break-even (v4):** the first month in which **gross profit** (revenue less the €5 a case it costs to serve) **covers running costs**. From that month cash stops falling. v3 used "revenue passes costs" (month 29), which ignores the cost of each case; on the conservative line revenue alone passes costs at month 30 in v4, and that figure is not used on any slide.

| | Conservative (slide 10: €26k / €180k / €560k) | Upside (slide 10: €258k / €1.7M / €4.85M) |
|---|---|---|
| Revenue inside the 24 months | **about €164k** | **about €1.57M** |
| Monthly revenue at month 24 | about €19k (cost €38k) | about €179k (cost €38k) |
| **Break-even** (gross profit covers running costs) | **month 31**, seven months after the planned 24 | **month 12** |
| Cash at month 24 | about €241k | about €1.47M |
| **Cash at its lowest, before tranche 2** | **about €104k, month 9** (€600k committed, not yet drawn) | **about €114k, month 9** |
| **Cash at its lowest, after tranche 2** | **about €186k, month 30** | **about €690k, month 11**: costs start months before revenue |
| Sales can slip, and the money still reaches break-even | **5 months** | 17 months |
| Honest reading | **Break-even inside the money, not inside the 24 planned months.** If the conservative line holds, no second round is needed to reach it; a round is still needed for certification | Self-funding from the first paid year; tranche 2 could be smaller. **The upside needs more people, not modelled:** 45,000 cases and 2,000 seats a year by year 3 run here on the six-person cost base, so its break-even and cash figures flatter it. The case to hope for, not to plan on |

**€600k against €1M, on the same method (conservative line):**

| | €600k, 18 months (v2, drawn up front) | €1M, 24 months (v4) |
|---|---|---|
| Team | 4 | 6 |
| Months the money lasts with no revenue at all | 21 | **27** |
| Break-even (gross profit covers running costs) | month 28 | month 31 |
| Cash at its lowest | €60k (month 27) | **€186k** (month 30, after tranche 2); €104k at month 9, before it |
| Months sales can slip and still reach break-even | 2 | **5** |
| Sell (marketing and sales) | €168k | **€297k** |

**Not counted:** clinical-trials revenue. If the sponsor pilot converts (one trial in months 19 to 24, then **five a year** at about €24,000 each, about €120,000 a year; assumptions), break-even comes one quarter sooner (month 28). Slide 10 still does not add it as a line (`docs/business/clinical-trials-fit.md` §8). Government revenue is not counted inside 24 months: procurement is slow.

**The upside does not change the ask.** The plan is sized on the conservative line; if the upside arrives, tranche 2 can be smaller or released early.

**Levers if the founder wants less than €1M (CFO view):** second engineer at month 19 (−€29k); the regulatory pathway left to the next round (−€50k); the trials pilot funded by its sponsor (−€25k); research partner back to 15 months (−€12k). Together about €115k: the ask would be about €885k. Rerun with the same €97k buffer and the same €400k first tranche: break-even still month 31, and sales can still slip 5 months. What is lost is the clinician-led regulatory start, the trials test and the earlier second engineer, not the runway.

---

## 4. Funding sources and sequence (reference only, not on the slides)

**Not on any slide.** The founder, 14 Nov: "Where the money comes from -> no". This section stays as background for the founder and for questions in the room. v4 updates only the tranche amounts, the commitment and the dilution; the source table is unchanged from v2.

Realistic for a Greek solo founder in health tech: non-dilutive first, equity for the remainder. A grant is counted as runway only once it is signed.

### Non-dilutive

| Source | What it gives | Fit for Pathien | Status |
|---|---|---|---|
| **EIC Accelerator** (EU) | Grant **up to €2.5M** (TRL 6 to 8) plus equity **€1M to €10M**; 2027 full-proposal cut-offs 20 Jan, 17 Mar, 1 Sep, 4 Nov 2027 | **The certification round, not this one.** Short proposal around plan month 9, full proposal at the 1 Sep or 4 Nov 2027 cut-off. The quality-system work makes the proposal stronger. Three failed submissions bar a company (secondary) | **verified** ([EIC](https://eic.ec.europa.eu/eic-funding-opportunities/eic-accelerator_en)); three-strike rule **secondary** ([ABGi](https://www.abgi-uk.com/news-resources/eic-accelerator-grant-funding-2026/)) |
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
3. **After G2, one signing for the €1M:** Greek grant (ESPA) and EIT Health applications go in; the €1M is committed by angels or a Greek VC from the EquiFund II funds on one SAFE or convertible-note agreement with two tranches (D2). **€400k is drawn at signing**, target about March 2027.
4. **At the gate (about month 9):** **€600k is released**, less any grant **signed** by then (a signed grant can replace part of tranche 2 if the agreement allows it).
5. **Months 18 to 24:** EIC Accelerator full proposal (1 Sep or 4 Nov 2027 cut-off) and a seed round for EU MDR certification (CTO estimate €300k to €800k).

**Dilution (assumption; the caps are guesses, not quotes; the founder decides, D2).** Tranche 1 (€400k) at a €2.5M to €3.5M cap is about **10% to 14%**. If tranche 2's cap is agreed at signing at 1.5 times tranche 1's, the total is about **19.5% to 26%**; at one cap for both, about **22% to 29%**. Committing tranche 2 at signing costs the founder the chance to price it on the pilot's evidence; the step-up cap keeps part of that. Every euro of signed grant lowers it. All figures are in the model.

---

## 5. The CFO view

### Unit economics, from slide 10 (all assumptions)

| | Per case (hospital department) | Per seat (private clinic chains, telehealth) |
|---|---|---|
| Price | €40 (conservative) to €80 (upside); no published price exists | €50 a month (€600 a year), 40% of Tandem Pro's published €125 |
| Variable cost | €2 to €5 if the machine is accurate enough; **€10 to €20 if a person must check each case** | €3 to €5 a month |
| Gross margin | about 90% machine-only; **about 50% to 75% with a human check**; the model uses 87.5% | about 90% |
| Per customer a year | One hospital: €40k (1,000 cases × €40) to €240k (3,000 × €80) | One 20-doctor clinic: €12k |
| Cost to win one hospital | About €30k to €40k: a share of business development, travel, a free pilot of 2 to 4 months | — |
| Payback (conservative) | About 12 months (10 to 14) at €35k gross profit a year | — |

**Break-even at a team of six** (steady burn €33.4k a month after month 24): about **€458k of revenue a year at 87.5% margin** (v2, team of four: €340k at 90%). That is **about 12 hospitals at the conservative €40k** (11.4: 11 hospitals bring €440k, short of it), about 2 at the upside's €240k, or about 760 doctor seats. Slide 10's conservative year 3 is €560k. At month 24 the conservative line runs at about **€19k a month** (€229k a year), half of break-even. At a 75% margin break-even is about €534k a year; at 50%, about €801k. **Keeping the margin near 87.5% is the ML engineer's job.**

**The two lines for A9 (unit economics):**
- One hospital pays **€40k a year** at an **87.5% gross margin**; it costs about **€30k to €40k to win** and pays that back in **about 12 months**.
- **About 12 hospitals** cover our running costs; at month 24 the conservative line runs at **about €19k a month**, half of that.

### Key risks to the plan

1. **No buyer pays for the history (R3).** The whole revenue line rests on it. Tested at G1, before any money.
2. **The device line moves.** If the regulatory opinion says cited retrieval is a medical device, the cost becomes €300k to €800k and 18 to 30 months (CTO estimate). The €50k quality-system start is the first step on that road, not the road. Tested at G1 or G2.
3. **Accuracy costs people.** If 98% needs a person on every case, margin falls to about 50% to 75%, and break-even rises to €534k to €801k a year.
4. **Public buyers are slow.** Governments buy through tenders that can take longer than this plan; the plan counts no government revenue. Each month of hospital delay costs about €38k of runway; the money absorbs about 5 months of delay on the conservative line.
5. **The pilot runs late.** Tranche 1's €103k reserve covers about 3.5 months of a late gate at month 9's burn; beyond that, tranche-2 work starts late or the plan changes.
6. **The team.** A solo founder with two other products. The plan adds a clinician (half-time) and a second engineer; the founder's own time is still the constraint (D5).
7. **Grants arrive late or not at all.** None is counted until signed.
8. **The name.** PATHIEN trademark clearance is pending (`docs/brand/brand-check-pathien.md`).
9. **The insurer rule narrows the buyers by design.** Insurers stay out; the five open edges are the founder's.
10. **The research partner.** University contracts and ethics approval can take longer; IP terms can claim too much (D12). The pilot does not wait for the partner.
11. **The trials pilot.** No sponsor has been asked. If none signs by month 12, its €25k returns to the buffer.

### The gate for tranche 2: three numbers, measured at the end of the pilot

v4 writes numbers 1 and 2 as **a written commitment**: at the end of a free pilot nobody has paid for a year of cases yet, so "1,000 paid cases a year" can only be measured as what the hospital commits to in writing.

| # | Number | Threshold (recommended) | How it is measured | Why it matters |
|---|---|---|---|---|
| 1 and 2 | **Price and volume** | **The hospital commits in writing to 1,000 or more paid cases a year at €40 or more a case**, and names the budget that pays | A signed order, letter of intent or framework with the volume and the price | Slide 10's conservative line starts at €40 and 1,000 cases: €40k a hospital. Below that, break-even needs too many hospitals |
| 3 | **Cost per case at 98% field accuracy**, correction time included | **€5 or less** (87.5% gross margin at €40) | Measured in the pilot on the research partner's annotated set | Software margin or service margin. Owner: the ML engineer |

---

## 6. Decisions only the founder can make

The CEO seat recommends; it takes none of these, except where the founder delegated (D2's tranche structure, 15 Nov). They are money, hiring and company commitments.

| # | Decision | Recommendation |
|---|---|---|
| **D1** | Raise at all, and when | Only after G2 passes. Park by default until then |
| **D2** | Amount, tranches and structure | **€1M** over 24 months (confirmed). **Tranches €400k / €600k, both committed at one signing, the second released by the gate: CFO on the founder's behalf, 15 Nov** ("CFO will answer"); he can overturn it. **Still his:** the instrument (SAFE or convertible note), the caps and whether tranche 2 steps up. Grants first. Dilution about 19.5% to 29% (assumption). Levers to about €885k in section 3 |
| **D3** | Hiring order | Engineer and the clinical and regulatory lead in month 1; ML engineer and business development in month 2; marketing in month 3; second engineer in month 13 |
| **D4** | Full-time or part-time | Engineers, ML engineer and business development full-time; the clinical lead half-time; marketing half-time until tranche 2, then full-time |
| **D5** | The founder's own time and pay | At least half-time once tranche 1 lands; his pay is not in the €1M (€3,000 a month adds €72k, from the €97k buffer) |
| **D6** | The clinician | A half-time clinical and regulatory lead from month 1 (€78k over 24 months). Co-founder (equity) or employee is his call. The room's G2 condition asks for a committed clinician |
| **D7** | Hires or co-founders | Three of the roles match the studio's co-founder search (2026-11-10: "Eng - Sales - Marketing"); his call |
| **D8** | Option pool | Recommend 10% (assumption), with vesting |
| **D9** | The legal entity | Pathien as its own company or inside the studio; needed before Elevate Greece, a grant or a SAFE |
| **D10** | Direction 4 against his own rules | How "analysis and projection for the patient" reads against "route to the doctor, nothing interpreted"; the quality system starts only if the opinion asks for it |
| **D11** | The research partner | Approach NKUA Medical School with Attikon (clinical) and the Athena Research Center's Archimedes unit (technical) after G1, budget €49.8k; nobody is contacted without his go |
| **D12** | IP and publication terms | The product IP stays with the company; the university may publish the method after a short review |
| **D13** | The two new seats and the three new lines | Clinical and regulatory lead, second engineer, regulatory pathway (gated), procurement adviser, trials sponsor pilot. Each can be dropped; section 3 shows what each saves |

---

## 7. Slide-ready text (v4, for deck v4.7)

Slides 13 ("Team today, and what I ask") and 14 ("Why the money"), main numbers only; the detail is on A9. The deck-facing changes, word for word, are in `docs/business/cfo-fixes-v4.7.md`; this section repeats the two slides so the plan and the deck say the same thing. **No funding-sources content** (founder, 14 Nov). Every estimate carries a "\*" and the small footnote (deck rule 8, v4.2). The founder approves public copy.

### Slide 13: Team today, and what I ask

**Headline:** One founder and AI agents built this. Next: €1M\*, released by a hospital pilot.

**Team today.** Lefteris Georgaras, founder, onedotatatime.design, with AI agents. Research partner: a university hospital and an AI research centre (targets, not contacted).

**What I ask.** **€1M\*** over 24 months, committed at signing, released in two gated tranches:

| Gate | Tranche |
|---|---|
| A hospital signs a pilot | **€400k** |
| The hospital commits to 1,000+ paid cases a year at €40+; a case costs us €5 or less | **€600k** |

**Footer, small, required:** \* Our plan, not a raise in progress; costs are assumptions. Nobody is hired before a hospital signs a pilot. Certification is the next round. Details → A9

**Speaker notes (~20 s):** "Today it is me, and a team of AI agents that built this with me this weekend. What I ask is one million euros over twenty-four months, committed at one signing. Four hundred thousand when a hospital signs a pilot. Six hundred thousand released only when that hospital commits to paid cases at our price, and each case costs us five euros or less."

### Slide 14: Why the money

**Headline:** Why €1M: six people, 30% to sell, break-even at month 31\*.

**One line:** 6 people: 3 build, 2 sell, 1 clinical and regulatory lead.

| Sell | Build | Prove | Buffer |
|---|---|---|---|
| **€297k · 30%** | €361k · 36% | €245k · 24% | €97k · 10% |

**Footer, small, required:** \* Our plan; costs are assumptions. Break-even: when gross profit covers running costs, on our conservative revenue line (slide 10). Details → A9

**Speaker notes (~20 s):** "Why this amount. Six people: two engineers and an ML engineer to build it, a clinician to keep it safe and on the regulatory path, and business development and marketing to sell it to hospitals, clinics and governments. Thirty percent goes to selling. On our conservative line we break even at month thirty-one, with money left. If you know a hospital that would pilot this, come and find me. Thank you."

**Contact line** (slide 14, bottom): `hello@onedotatatime.design` · healthapp-landing.pages.dev (email: founder, 2026-11-14).

---

## Sources in the repo

`docs/business/funding-model.py` (the v4 model; rerun to check every number in sections 3 and 5; `--v3` reproduces v3) · `docs/business/cfo-fixes-v4.7.md` (the deck changes, word for word) · `docs/business/clinical-trials-fit.md` §8 (trial pricing) · `docs/deck/deck-content.md` (slides 6c, 7, 10, 13, 14; A3, A4, A6, A7, A9) · `docs/lean/00-summary.md` · `docs/lean/05-business-model-canvas.md` (CTO cost estimates, BMC) · `docs/lean/06-market-fit-scorecard.md` (28/100, gates, R1 to R11) · `docs/lean/room/ceo.md`, `cto.md` · `docs/research/buyers.md`, `market-and-competitors.md` · `docs/00-founder-brief.md` · `~/AppDevelopment/conductor/docs/founder-decisions.md` (healthapp entries; 2026-11-15 "Raise ask €1M" and "Tranches €400k then €600k, both committed at signing; break-even at month 31").
