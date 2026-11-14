# healthapp: global market data and competitor teardown

Author: Spast Arxidas (Sales). Date: 2026-11-13. Public web only; nobody contacted.
Founder decision (2026-11-13): "Dont focus on the greek market. we need to focus on global market". This file replaces the earlier Greece/EU version. Greece is only the launch-market note at the end.
Method: web search plus page fetches on 2026-11-13. Skills applied: market-research (bottom-up plus top-down sizing, sourced), competitive-teardown (gap-based; no app-store review mining, job-post counts or SEO tooling in the one-night window, so no numeric 12-dimension scorecard), competitive-intel and competitive-brief framing for sections 3 and 4.

Marking rules:
- **(verified)** = I opened the primary page, or the search result quoted the primary study or an official page.
- **(secondary)** = seen only through news, a law firm or an aggregator summary. Cite with care.
- **unverified** = could not confirm, or sources conflict. Not for a slide.
- **[INFERENCE]** = my conclusion. **[ASSUMPTION]** = my input to a model. **[DERIVED]** = my arithmetic on sourced inputs.
- Several fetches returned HTTP 403 (HHS, digitalhealth.net, Oracle); figures from those pages are secondary via search quotes.

---

## 0. Summary

- **TAM ~$8.5B/yr** [DERIVED]: about 14.1M physicians worldwide x $600/seat/yr [ASSUMPTION]. Top-down cross-check: PHR software about $11B plus AI in clinical workflow $2.8B, about $13.8B (secondary).
- **SAM ~$1.9B/yr** [DERIVED]: direct-care physicians in US (905k) and EU (1.98M) at $600, plus India (1.39M registered) at $120.
- **SOM ~$19M/yr by year 3** [ASSUMPTION]: 1% of SAM seats (about 42.7k seats).
- The job is real and global: WHO says 1 in 10 patients is harmed in care; 59% of US adults have more than one patient portal and only 7% combine them (ONC, 2024).
- The record rails are opening everywhere (US TEFCA, EU EHDS, UK NHS App, India ABDM, Abu Dhabi Malaffi, Saudi Sehhaty). That helps ingestion and shrinks "we hold your records" as a moat. The moat is patient control, old paper, cross-border and the specialist bridge.
- Most dangerous: Epic (Emmie plus Art), OpenAI ChatGPT Health, OpenEvidence.
- Entry order after Greece: 1 UAE/GCC, 2 UK, 3 India, 4 US (niche only), 5 Germany/EU.

---

## 1. Global market data

### 1.1 The size of the problem

| Fact | Number | Status | Source |
|---|---|---|---|
| Patients harmed in health care | about 1 in 10; more than 3 million deaths a year from unsafe care; over 50% of harm preventable; up to 80% avoidable in primary and ambulatory care | verified (WHO fact sheet, 11 Sep 2023) | https://www.who.int/news-room/fact-sheets/detail/patient-safety |
| Diagnostic errors | occur in 5 to 20% of physician-patient encounters; harmful ones in at least 0.7% of adult hospital admissions | verified (same WHO fact sheet) | same |
| Cost of patient harm | reduces global economic growth by 0.7% a year; "trillions of US dollars" indirect | verified (same) | same |
| A medication-error cost of $42B a year circulates | WHO fact sheet gives no such figure | **unverified, do not use** | n/a |
| US outpatient diagnostic error rate | 5.08%, about 12M adults a year; about half potentially harmful (extrapolated) | verified | https://psnet.ahrq.gov/issue/frequency-diagnostic-errors-outpatient-care-estimations-three-large-observational-studies |
| NAM 2015 | "most people will have at least one diagnostic error in their lifetime" | verified (report summary) | https://www.nationalacademies.org/read/21794/chapter/2 |
| Primary-care diagnostic errors where history-taking broke down (190 errors, JAMA Intern Med 2013, US) | 56.3% | secondary | https://immattersacp.org/weekly/archives/2013/03/05/4.htm |
| Physician time in the EHR per encounter (about 100M encounters, US; vendor-authored) | 16 min 14 s; chart review 33% (5 min 22 s) | secondary | https://www.fiercehealthcare.com/practices/for-each-patient-visit-physicians-spend-about-16-minutes-ehrs-study-finds |
| Global health-worker shortage projected for 2030 | 11.1 million (WHO) | secondary | https://www.devdiscourse.com/article/health/3979244-more-health-workers-unequal-care-who-warns-of-ageing-and-global-staffing-gaps |

**Fragmented records (the core job).** ASTP/ONC data brief, HINTS 7, fielded Mar to Sep 2024, 7,278 responses (verified, fetched): 77% of US adults were offered online record access; 65% used it; **59% had multiple portals (50% in 2022); only 7% used an app to combine them (2% in 2022)**; 57% access through an app. https://www.healthit.gov/data/data-briefs/individuals-access-and-use-patient-portals-and-smartphone-health-apps-2024
[INFERENCE] Even in the most digitised large market, the record is split by provider and almost nobody reassembles it. Paper and PDFs from labs and abroad come on top.

**Duplicate tests.** No global euro figure exists. Evidence is partial:

| Fact | Number | Status | Source |
|---|---|---|---|
| Medicare repeat testing within 3 years (US) | 55% of echocardiograms, 46% of chest CTs repeated; reason not measured | secondary | https://healthmanagement.org/pdf/article/are-doctors-routinely-repeating-diagnostic-tests |
| Australian GPs forced to repeat tests because results were inaccessible (1,600+ GPs, self-reported) | 50% in the past two weeks | secondary | https://www.healthed.com.au/clinical_articles/path-companies-make-billions-from-repeat-tests |
| Duplicate imaging, US Veterans/Defense, without vs with shared viewer | 11.2% vs 6.1% | secondary | https://theincidentaleconomist.com/wordpress/recent-research-integrated-health-record-viewers-and-duplicate-imaging/ |
| Share of health spending with no or minimal outcome contribution (OECD, 2017) | about one fifth | verified wording via commentary | https://conversableeconomist.com/2017/02/23/wasteful-health-care-spending/ |
| Counter-evidence | image access can raise ordering | secondary | https://www.diagnosticimaging.com/view/electronic-image-access-encourages-test-ordering |

**Chronic and multi-specialty patients.**

| Fact | Number | Status | Source |
|---|---|---|---|
| US adults with 2+ chronic conditions (BRFSS 2023, 12 conditions) | 51.4% (47.3% in 2013); 76.4% have 1+ | secondary (search quote of CDC study) | https://cdc.gov/pcd/issues/2025/24_0539.htm |
| EU people 65+ with 2+ chronic diseases (SHARE 2017) | about 37% | verified (OECD) | https://www.oecd.org/en/publications/health-at-a-glance-europe-2020_82129230-en/full-report/component-20.html |
| EU people 65+ with 1+ chronic condition (EU-SILC 2023) | 60% | verified (OECD) | https://www.oecd.org/en/publications/health-at-a-glance-europe-2024_b3704e14-en/full-report/component-8.html |

**Rare disease and the diagnostic odyssey.**

| Fact | Number | Status | Source |
|---|---|---|---|
| People living with a rare disease | about 300M, over 7,000 diseases (350M in one secondary source; Global Genes primary not opened) | secondary | https://www.weforum.org/stories/2019/05/rare-diseases-arent-rare-but-treatments-for-them-are-its-time-to-change-that/ |
| Time to diagnosis, Europe | 4.7 years average; 56% waited over 6 months after first contact; more doctors consulted = longer delay (OR 5.15) | verified (EURORDIS Rare Barometer, Eur J Hum Genet 2024) | https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11369105/ |
| Other estimates | 4.5 years (42-country EURORDIS survey) to 8 years (WEF 2019); about 95% of rare diseases lack an approved treatment | secondary | https://intuitionlabs.ai/articles/rare-disease-landscape-2025 |

### 1.2 Market size: how I sized it

**Method:** bottom-up on clinician seats (the paying side), cross-checked top-down against analyst reports. The patient side is free in this model (the founder's brief makes the record patient-held); consumer subscriptions are upside and not counted. Price benchmark: Tandem Pro EUR125/user/month on its site, Heidi USD55 to 150 depending on source (conflicting), Glass free for US NPI-verified clinicians, OpenEvidence free to doctors (ad-supported). **$50/seat/month ($600/yr) is [ASSUMPTION]**: below paid scribes, above the free tools. India at $10/month ($120/yr) [ASSUMPTION].

| Layer | Formula | Result | Inputs and sources |
|---|---|---|---|
| **TAM** | 14.1M physicians x $600 | **~$8.5B/yr** [DERIVED] | Physician count = WHO-cited density 17.2 per 10,000 x about 8.2B people (UN, my rounding) = 14.1M. Density is secondary and its year is not stated (https://www.medboundtimes.com/daily-pulse/top-10-countries-with-severe-doctor-shortages). Ceiling only: low-income markets will not pay $600 |
| **SAM** | US 905,452 direct-care physicians x $600 = $543M; EU 1.98M practising physicians x $600 = $1,188M; India 1,386,157 registered allopathic doctors x $120 = $166M | **~$1.9B/yr** [DERIVED] | US: AAMC 2025, 1,044,078 active, 905,452 direct care (verified, fetched) https://www.aamc.org/data-reports/data/2025-key-findings . EU: Eurostat 2023 about 1.98M (secondary) https://ec.europa.eu/eurostat/statistics-explained/index.php/Healthcare_personnel_statistics_-_physicians . India: Lok Sabha reply July 2025 via NMC; registered, not active; count disputed by RTI reporting (secondary) https://www.lokmattimes.com/national/1386-lakh-registered-allopathic-doctors-751-lakh-practitioners-in-ayush-system-centre/amp . UK and Gulf excluded (no sourced counts): upside |
| **SOM (year 3)** | 1% of SAM seats | **~$19M/yr, about 42.7k seats** [ASSUMPTION] | 9,055 US + 19,800 EU + 13,862 India seats. Sanity: OpenEvidence reports about 760,000 registered US physicians (secondary), so 42.7k seats is about 5.6% of that base. At half the price, SOM is $9.5M |

**Top-down cross-check (secondary, analyst reports, conflicting):**

| Segment | 2025 size | Source |
|---|---|---|
| PHR software | about $11B (Business Research Co $11B; Market.us $10.9B), but Fortune BI says $48.1B and Straits about $47M (units error); 4x spread | https://www.gii.tw/report/tbrc1825503-personal-health-record-software-global-market.html ; https://media.market.us/personal-health-record-software-market ; https://www.fortunebusinessinsights.com/personal-health-record-software-market-116594 |
| AI in clinical workflow | $2.78B, to $11.08B by 2030 (31.9% CAGR) | https://www.marketsandmarkets.com/Market-Reports/ai-clinical-workflow-market-175075380.html |
| AI in healthcare, broad | $25.9B to $38B in 2025 depending on publisher | https://www.marketsandmarkets.com/Market-Reports/artificial-intelligence-healthcare-market-54679303.html |
| Ambient scribe market | about $600M (Menlo Ventures, Oct 2025) | https://www.statnews.com/2026/02/04/epic-ai-charting-ambient-scribe-abridge-microsoft/ |

Reconciliation: PHR plus clinical-workflow AI is about $13.8B; my seat-based TAM of $8.5B is the same order of magnitude and smaller because it counts clinicians only. Analyst numbers are not audited; none should carry a slide alone.

Investor-appetite signals (not market size):
- OpenEvidence: $250M Series D at $12B (Jan 2026, Thrive/DST); one report says $15B later, unconfirmed. https://www.businesswire.com/news/home/20260121029132/en
- Abridge: $5.3B valuation (Jun 2025). https://aimagazine.com/news/abridge-nvidia-lilly-and-the-clinician-intelligence-push
- Heidi: $340M raise at $900M valuation, ARR $50M (Apr 2026). Correction: the earlier version said "$100M Series C"; the cited page title says $340M. https://pulse2.com/heidi-secures-340-million-at-900-million-valuation-to-expand-ai-across-healthcare-systems/
- Tandem Health (Stockholm): $100M raise. https://mobihealthnews.com/news/tandem-health-raises-100m-expand-clinical-ai-across-europe
- Navina: $55M Series C (Mar 2025, Goldman Sachs), about $100M total. https://www.fiercehealthcare.com/ai-and-machine-learning/navina-reels-55m-series-c-led-goldman-sachs
- Metriport: $26M Series A (Aug 2026). https://pulse2.com/metriport-raises-26-million-as-healthcare-data-platform-reaches-amazon-one-medical-sollis-health-and-color-health/

### 1.3 Regulatory and interoperability tailwinds

| Region | What is happening | Status | Source |
|---|---|---|---|
| **US** | TEFCA: about 10M records exchanged Jan 2025 to nearly 500M by Feb 2026; HHS later said over 1B (26 June). Info-blocking rules in force, enforcement described as slow. CMS payer Patient Access API: payer metrics reporting from 1 Jan 2026. CMS Health Tech Ecosystem (Jul 2025): conversational-AI pledges incl. Anthropic, Google, Microsoft AI, Hippocratic AI, K Health. FDA updated its CDS and wellness guidance on 6 Jan 2026, widening non-device CDS enforcement discretion for clinician-facing software with a single clinically appropriate recommendation | secondary (HHS page 403 on fetch; law-firm summaries) | https://www.hhs.gov/press-room/tefca-americas-national-interoperability-network-reaches-nearly-500-million-health-records-exchanged.html ; https://www.beckershospitalreview.com/healthcare-information-technology/ehrs/tefca-reaches-500m-health-records-exchanged/ ; https://www.mcdermottlaw.com/insights/key-takeaways-2026-astp-annual-meeting/ ; https://www.medicaleconomics.com/view/white-house-and-cms-tap-amazon-apple-google-and-other-tech-giants-to-drive-patient-centered-digital-health-initiative ; https://www.orrick.com/en/insights/2026/01/fda-eases-oversight-for-ai-enabled-clinical-decision-support-software-and-wearables |
| **EU** | EHDS in force 26 Mar 2025. March 2029: first priority categories (patient summaries, ePrescriptions) and secondary-use rules. March 2031: images, lab results, discharge reports; genomics for secondary use. Patients can add their own data, restrict access, see who accessed, opt out of secondary use | verified | https://health.ec.europa.eu/ehealth-digital-health-and-care/european-health-data-space-regulation-ehds_en |
| **EU, device law** | AI in medical devices (MDR class IIa and up) is high-risk under the AI Act; the May 2026 Omnibus deal moved that date from Aug 2027 to 2 Aug 2028. Sources conflict on whether it is final | secondary | https://meddeviceguide.com/blog/eu-ai-act-omnibus-amendment-2026-medical-device-impact-guide |
| **UK** | NHS App: more than 39M registered (Dec 2025), later reports 41M; GP record viewed about 20M times a month. Government plans a Single Patient Record in the app with default patient access, target December 2028 | secondary (digitalhealth.net 403 on fetch) | https://www.digitalhealth.net/2025/12/record-39-million-people-registered-for-the-nhs-app/ ; https://www.healthcare-management.uk/government-patients-access-record-nhs-app |
| **India** | ABDM: 93.95 crore (939.5M) ABHA numbers and over 105 crore (1.05B) records linked as of 10 Jul 2026; a Parliament reply gave 95.99 crore at 31 Jul 2026 | secondary | https://www.gktoday.in/ayushman-bharat-digital-mission-crosses-93-95-crore-health-accounts/ ; https://www.drishtiias.com/daily-updates/daily-news-analysis/ayushman-bharat-health-accounts-abha/print_manually |
| **UAE** | Malaffi (Abu Dhabi): 3,018 facilities, 100% of patient episodes, about 7M unique patients and 1B records; Riayati (federal) holds a reported 2.7B records for 11.6M patients (an earlier release said 1.9B and 9.5M, so counts are inconsistent); Malaffi, Nabidh and Riayati integrated | secondary | https://www.doh.gov.ae/en/news/uae-health-authorities-announce-successful-integration-between-riayati-malaffi-and-nabidh ; https://gulfnews.com/uae/1-billion-clinical-records-now-in-abu-dhabis-digital-health-information-exchange-1.90367601 |
| **Saudi Arabia** | Sehhaty citizen app: over 31M users (MoH 2025 report); NPHIES national exchange | secondary | https://www.moh.gov.sa/en/Ministry/MediaCenter/News/Pages/news-2026-06-20-001.aspx |
| **Germany** | ePA: about 73M accounts for 74.5M insured, but active use only about 4% (insurer data: TK about 850k active of 11.5M; Barmer 440k of 8M) | secondary | https://heise.de/-10624736 ; https://www.aerzteblatt.de/themen/e-health/unter-vier-prozent-nutzen-elektronische-patientenakte-aktiv-eb02ecd1-2e58-470f-8f26-9c3ac8caf3d9 |
| **France** | Mon espace santé: about 24M activated profiles (early 2026, secondary); target 40M by end 2027; 420M documents deposited by professionals in 2025 | secondary | https://telehealth.org/?p=164239 |
| **Australia** | My Health Record about 25.1M records (Jun 2026; records, not people) | verified (agency PDF title in search) | https://www.digitalhealth.gov.au/sites/default/files/documents/my-health-record-june-2026-statistics-landscape-version.pdf |

[INFERENCE] Two effects. (1) Ingestion gets easier: patient-mediated APIs (US, India) and EHDS rights (EU) let us pull and add records. (2) "We hold the records" stops being a moat in each market on a known clock; low active use (Germany 4%) shows state apps hold data but do not make it useful for the doctor.

### 1.4 Medical tourism and cross-border patients

| Fact | Number | Status | Source |
|---|---|---|---|
| Foreign records are often unavailable, incomplete or illegible; foreign lab results can force repeat work-ups; many foreign centres cannot copy records or films for the patient | qualitative, Cleveland Clinic J Med review | secondary | https://www.ccjm.org/content/83/11/794.full.pdf |
| MyHealth@EU patient summary covers only a structured subset of the clinical record | vendor commentary (Tandem) | secondary, commercial | https://tandemhealth.ai/resources/knowledge/cross-border-patient-records-what-gets-lost-in-transit |
| Formal measurement of lost continuity for medical tourists | none found | **unverified** | n/a |
| Turkey health tourists | 733,798 and $1.39B in Q2 2025 (official, USHAS via search); about 1.5M and about $3B in 2024 | secondary | https://health.istanbul.com/medical-tourism-stats |
| India foreign medical arrivals | 131,856 in Jan to Apr 2025 | secondary | https://medicaltourismbusiness7.blogspot.com/2025/09/medical-tourism-statistics-by-country.html |
| South Korea foreign patients | 2.01M in 2025 (market report) | secondary | https://www.kenresearch.com/industry-reports/global-medical-tourism-market |
| Dubai international patients | over 630,000 (2022) | secondary, old | same blog link as India |
| Global medical-tourism market, 2025 | $16.5B to $172B depending on publisher; global head-count about 44M (old forecast) | **unverified, do not use** | https://www.persistencemarketresearch.com/market-research/medical-tourism-market.asp |

[INFERENCE] Cross-border patients are the clearest case where no state rail follows the patient: each country's HIE stops at its border, records come in another language and often on paper. It is also a small, concentrated, high-willingness-to-pay segment, which suits an entry wedge.

---

## 2. Global competitor teardown

The idea in one line: the patient photographs old exams, AI structures them into one history, the doctor gets access with a handshake, an assistant answers the doctor's questions across specialties. Patient-held keys, no insurer access, opt-in anonymous matches. Teardown is gap-based, not a numeric scorecard.

### 2.1 Consumer PHR and patient-side AI

| Player | What it does | Where | Model / pricing | Gap vs us | Source |
|---|---|---|---|---|---|
| **OpenAI ChatGPT Health** | Connect medical records (via b.well), Apple Health, wellness apps; explains labs, trends | US only; not EEA, UK or Switzerland; no confirmed later launch. About 230M weekly health users claimed | Inside ChatGPT plans | Patient-facing answers; no doctor handshake; no source-verified marking; no old paper | https://openai.com/index/introducing-chatgpt-health/ ; https://the-decoder.com/dr-chatgpt-is-now-officially-in-as-openai-launches-dedicated-health-section-for-230-million-weekly-users/ ; https://www.doctors.net.uk/news/chatgpt-health-regulatory-hurdles-delay-rollout-across-uk-and-europe |
| **Anthropic Claude for Healthcare** | US Pro/Max users connect records via HealthEx and Function (beta); HealthEx reaches 50,000+ health systems | US only; beta | Subscription | Same as above; no doctor-side workflow | https://fortune.com/2026/01/11/anthropic-unveils-claude-for-healthcare-and-expands-life-science-features-partners-with-healthex-to-let-users-connect-medical-records/ |
| **Microsoft Copilot Health** | Reported to use HealthEx for record access | US (reported) | n/a | Thin evidence | **unverified**, single commentary: https://www.onhealthcare.tech/p/bwell-connected-health-the-120m-infrastructure |
| **Google Health (ex-Fitbit) and Health Connect** | Gemini coach; US medical-record sync; Health Connect medical-records APIs global since Mar 2025; EU via DocMorris pharmacy partnership | US records; EU unclear | Subscription | Coaching and wellness; no doctor workflow | https://www.techrepublic.com/article/news-google-health-fitbit-ai-coach-fitbit-air/ ; https://www.fiercehealthcare.com/ai-and-machine-learning/google-rolls-out-medical-records-apis-ai-co-scientist-annual-check-event |
| **Apple Health Records** | Pulls clinical records from participating providers | US (500+ institutions), Canada, UK; list incomplete. Health+ AI coach reported, not launched | Free, on device | Needs provider integrations; no doctor assistant; no paper | https://institutions.healthrecords.apple.com ; https://www.macrumors.com/2025/11/10/ai-apple-health-service-still-coming/ |
| **Epic MyChart and Emmie** | Patient AI assistant that answers questions grounded in the chart; at health systems that adopt it (second US launch May 2026; English only) | US health systems | Bundled with Epic | Only the one system's data; no outside paper or foreign records | https://www.epic.com/epic/post/community-health-network-adopts-emmie-an-ai-assistant-in-mychart-to-enhance-patient-experience/ ; https://reidhealth.org/Healthy-Communities/Reid-Health-Blogs-News-and-Stories/News/Search/Reid-Health-second-in-the-US-to-launch-Emmie |
| **HealthEx / b.well** | Patient-consented record aggregation (APIs) that powers AI assistants | US | B2B infrastructure | Pipes, not the doctor view; US-only networks | https://www.cms.gov/initiatives/health-technology-ecosystem/overview/early-adopters-all-pledgees/health-care-keeps-up-you/healthex |
| **PicnicHealth** | Retrieves and digitises records into one timeline; research datasets; AI assistant | US | Patients free; revenue from de-identified research data to approved organisations | Closest to our digitise-once job, but US retrieval model and research-data business | https://picnichealth.com/privacy-policy ; https://prnewswire.com/news-releases/picnichealth-introduces-ai-health-assistant-to-simplify-patient-care-302309693.html |
| **Citizen Health (ex-Ciitizen)** | Patient-centred platform and AI advocate for rare and complex conditions; gets records with patient permission; early a16z $3M | US | n/a | Same niche as our matches; no doctor-side handshake found | https://www.cbinsights.com/company/ciitizen |
| **Fasten Health** | Open-source, self-hosted PHR; CMS pledgee | US-centred | Open source | Self-hosted tool, no AI doctor view | https://github.com/fastenhealth |
| **Patients Know Best (UK)** | Patient-held record, single patient record integration; GBP6M Jan 2025, DNV investment Sep 2025; claims 7.8M registered users | UK, some international | Provider subscriptions (third-party profile) | Provider-paid, so not patient-controlled in the insurer-proof sense; no AI doctor assistant found | https://www.digitalhealth.net/2025/09/patients-know-best-secures-funding-to-expand-single-patient-record/ ; https://patientsknowbest.com/ |
| **Eka Care (India)** | ABDM-approved PHR, AI to standardise Indian records, Samsung Health tie-up; 12 languages | India | Raised about $19.8M; about $3M annual revenue (Nov 2025) | The regional leader to beat in India; user counts undated | https://yourstory.com/2025/11/healthtech-startup-eka-care-ai-standardise-medical-records-doctor-patient |
| **State apps** | NHS App (UK), ABHA/ABDM (India), Sehhaty (Saudi), Malaffi/Riayati (UAE, clinician side), Germany ePA, France Mon espace santé, Greece MyHealth | see 1.3 | Free, state-run | Hold only what enters state systems; no foreign or old paper; central custody; no insurer-proof promise stated | see 1.3 |
| **Doctolib (EU)** | Booking and practice software; clinician AI assistant, patient AI assistant planned; bought UK's Medicus (about $125M, Jul 2026); NVIDIA stake reported Oct 2026 | France, Germany, Italy, Netherlands, now UK | Doctor subscriptions | Distribution in EU; the record vault is not its core | https://siecledigital.fr/2026/05/07/doctolib-mise-sur-le-royaume-uni-pour-poursuivre-sa-croissance-avec-le-rachat-de-medicus/ |
| **Gulf and MENA** | Vezeeta (booking, tele; about $71.5M raised), Altibbi (Arabic tele), Okadoc (Saudi booking) | MENA | Booking and tele fees | Booking, not records | https://www.arabnews.pk/node/2164561 |
| **Ada Health** | CE-marked symptom checker; B2B2C | EU, global | Enterprise | Different job: triage | https://fortune.com/2024/01/04/ai-make-business-better-ada-health/ |
| **Blockchain PHRs** (Medicalchain, Patientory) | Blockchain access control | 2017 to 2021 era | Tokens | Prior art; current status unverified; we keep data off chain | https://healthdatamanagement.com/news/blockchain-remains-a-work-in-progress-for-use-in-healthcare |

### 2.2 Clinical AI over records and notes

| Player | What it does | Where | Model / pricing | Gap vs us | Source |
|---|---|---|---|---|---|
| **Epic Art (Insights) and AI Charting** | Chart summary before visits (over 16M uses a month); AI Charting released Feb 2026. Epic holds 42% of the acute-hospital EHR market (STAT) | US, mostly large hospitals | Bundled | Summarises inside one institution's chart; not a patient's outside or paper history | https://www.epic.com/epic/post/epic-ai-charting-rolls-out-alongside-an-expanding-set-of-built-in-ai-capabilities/ ; https://www.statnews.com/2026/02/04/epic-ai-charting-ambient-scribe-abridge-microsoft/ |
| **Abridge** | Ambient scribe; 300+ health systems; KLAS 94.7 | US | Enterprise; valuation $5.3B | Creates new notes; no old-history digitisation or patient-held record | https://aimagazine.com/news/abridge-nvidia-lilly-and-the-clinician-intelligence-push |
| **Microsoft Dragon Copilot (Nuance DAX)** | Ambient plus chart tools; 100,000+ clinicians, 600+ health systems (early 2026); about 33% of the $600M scribe market (Menlo, Oct 2025) | US, global | Enterprise | Same | https://www.statnews.com/2026/02/04/epic-ai-charting-ambient-scribe-abridge-microsoft/ |
| **OpenEvidence** | Evidence Q&A for doctors; free, ad-supported; about 20M consultations a month (Jan 2026); revenue about $150M end 2025, $300M annualised (Sacra est., Jul 2026); $12B valuation | US-led | Free to verified clinicians | Answers from literature, not from this patient's history; the gap that patient context would close | https://sacra.com/research/openevidence ; https://www.businesswire.com/news/home/20260121029132/en |
| **Glass Health** | Differential diagnosis and plans from a clinician's one-liner; scribing; free for US NPI-verified clinicians (own page; a third party lists $90 and $200/month) | US | Free or conflicting | Input is a short summary, not the patient's records | https://glass.health/compare/abridge ; https://blog.glass.health/glass-health-raises-5m-for-ai-powered-clinical-decision-support-platform |
| **Navina** | AI chart summary for primary care in value-based care; $55M Series C | US (Israeli roots) | Enterprise | Summarises connected EHR and claims data, not patient-uploaded paper | https://www.fiercehealthcare.com/ai-and-machine-learning/navina-reels-55m-series-c-led-goldman-sachs |
| **Metriport** | Open-source record retrieval, dedup, summarisation for clinicians; $26M Series A | US | B2B | Same: networks, not paper | https://hitconsultant.net/2026/08/27/metriport-raises-26m-matrix-open-source-healthcare-data-infrastructure/ |
| **Heidi, Tandem, Nabla, Suki, Ambience** | Ambient scribes; Heidi in 190 countries, ARR $50M; Tandem Pro EUR125/user/month (a rival page says EUR109) | Global, EU | Per-seat | Notes going forward only | https://www.heidihealth.com/blog/nabla-copilot-alternative ; https://tandemhealth.ai/pricing |

### 2.3 Patient matching and rare-disease networks

| Player | What it does | Model | Gap vs us | Source |
|---|---|---|---|---|
| **Matchmaker Exchange** | Federated matching of patients by genotype and phenotype; about 150,000 families, 11,000+ contributors, 88 countries (Broad, undated) | Research and clinician network | Needs genetic, clinician-curated data; our matches are a lighter, patient-opt-in layer | https://www.broadinstitute.org/patients-rare-disease-meet-their-matches |
| **Undiagnosed Diseases Network (US)** | Shared 2,584 records to Matchmaker Exchange by summer 2026 | Research programme | Referral-based, not consumer | https://undiagnosed.hms.harvard.edu/wp-content/uploads/2026/07/UDN-Quarterly-Report-Summer-2026.pdf |
| **PatientsLikeMe** | Patient community and data sharing; UnitedHealth bought it in 2019; about 500k members then (old) | Research partnerships | Users objected to the insurer link; supports our "no insurer" line | https://medcitynews.com/2019/06/patientslikeme-acquired-by-unitedhealth-group/ |
| **Clinerion** | Network of partner hospitals (30.2M patients, undated), de-identified queries, then the hospital's physician identifies matches; patient-facing link via Wefight/Vik | B2B to pharma for trial recruitment | Matches patients to trials, not patient-to-patient for cause and cure | https://appliedclinicaltrialsonline.com/view/trialbee-partners-with-clinerion-for-global-real-world-data |

### 2.4 Document digitisation
No pure-play scaling "photo of an old paper exam to structured history" was found. The nearest are PicnicHealth (retrieval plus digitising) and Eka Care (Indian records standardisation). Evidence on OCR methods is thin. [INFERENCE] Paper digitisation is a feature inside others, not a funded category, so the first mover claim is open but unproven.

### 2.5 Substitutes
A folder of paper and PDFs; phone photos and messenger threads with the doctor [INFERENCE, no data]; each provider's own portal (the 59% with multiple portals, ONC).

---

## 3. Where we win globally

### Positioning lines (draft, for Anna)
1. **Patient-held, cross-provider:** "Your portals each hold a chapter. You hold the book." (59% of US adults have several portals; 7% combine them.)
2. **Cross-border:** "Your history travels when you do: any country, any language, any paper." (No state rail crosses a border; MyHealth@EU is a subset.)
3. **Historical paper:** "Digitise the last twenty years once." (State rails mostly carry new data; EHDS lab results and images only from 2031.)
4. **The specialist bridge:** "One timeline for the orthopaedist and the rheumatologist." (Epic Art, Navina summarise one institution or one network.)
5. **Consented matches:** "Opt in, anonymous, and a doctor-to-doctor handshake." (Matchmaker Exchange is clinician-only; PatientsLikeMe's insurer episode.) Each record also says who vouches for it: verified by source, or uploaded by you.

### The 3 biggest threats
1. **Big AI platforms plus Epic reach patients first.** ChatGPT Health, Claude, Google and Epic Emmie already hold users and record pipes in the US; the EU and UK are blocked by regulation only. Counter: the doctor-side handshake, source-verified marking, old paper and cross-border, which none ships.
2. **State and national rails go patient-facing with AI** (NHS App Single Patient Record by Dec 2028, ABDM/ABHA with Eka Care, EHDS 2029 and 2031, Greece MyHealth, Malaffi/Riayati). They commoditise "records in one place". Counter: they hold what enters their system; custody is central; no foreign or old paper. Low active use (Germany 4%) shows access does not equal use.
3. **Regulation and the clinician-side giants.** Suggesting causes makes us a medical device (EU MDR plus AI Act high-risk, now dated Aug 2028 per a secondary source; FDA CDS rules loosened Jan 2026 for clinician-facing single recommendations). And OpenEvidence (20M consultations a month, free) or Epic Art could add patient context. The founder wants the "possible causes" slide at the end of the deck.

**Most dangerous competitors:** (1) Epic (Emmie plus Art, 42% of US acute hospitals), (2) OpenAI ChatGPT Health, (3) OpenEvidence.

---

## 4. Eight deck stats (global; use the verified ones)

1. **About 1 in 10 patients is harmed in health care; more than 3 million deaths a year from unsafe care.** (verified, WHO 2023) https://www.who.int/news-room/fact-sheets/detail/patient-safety
2. **Diagnostic errors occur in 5 to 20% of physician-patient encounters.** (verified, WHO 2023) same link
3. **59% of US adults have more than one patient portal; only 7% use an app to combine them.** (verified, ASTP/ONC 2024) https://www.healthit.gov/data/data-briefs/individuals-access-and-use-patient-portals-and-smartphone-health-apps-2024
4. **Rare-disease patients in Europe wait 4.7 years on average for a diagnosis; more doctors seen means a longer wait. About 300 million people live with a rare disease.** (verified for 4.7 years; secondary for 300M) https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11369105/
5. **Over half of US adults (51.4%) have two or more chronic conditions.** (secondary, CDC study) https://cdc.gov/pcd/issues/2025/24_0539.htm
6. **Doctors spend about a third of EHR time per visit on chart review: 5 min 22 s of 16 min (US, about 100M encounters).** (secondary, vendor-authored) https://www.fiercehealthcare.com/practices/for-each-patient-visit-physicians-spend-about-16-minutes-ehrs-study-finds
7. **India has issued about 940 million health IDs and linked over 1 billion records (July 2026); US TEFCA went from about 10M to nearly 500M exchanged records in a year.** (secondary) https://www.gktoday.in/ayushman-bharat-digital-mission-crosses-93-95-crore-health-accounts/ ; https://www.hhs.gov/press-room/tefca-americas-national-interoperability-network-reaches-nearly-500-million-health-records-exchanged.html
8. **EU EHDS: patients get the right to add their own data and restrict access from 2029; lab results and images join in 2031.** (verified) https://health.ec.europa.eu/ehealth-digital-health-and-care/european-health-data-space-regulation-ehds_en

Five strongest for slides: 1, 2, 3, 4, 8.

### Do not put on a slide (unverified or conflicting)
- Any PHR or medical-tourism market size ($11B vs $48B; $16.5B vs $172B) without saying "analyst estimates, 4x to 10x spread".
- The $42B medication-error cost and the ">78% inadequate history" claim (not found in primaries).
- Global medical-tourist head-count (about 44M, old forecast).
- OpenEvidence at $15B; ChatGPT "230M weekly health users" (company claim); Epic's 42% share (STAT via search); Navina valuation; Heidi and Glass pricing.
- Eka Care user counts (undated), PatientsLikeMe 500k, Clinerion 30.2M (undated), Riayati record counts (inconsistent).
- Microsoft Copilot Health using HealthEx (single commentary).
- Our TAM, SAM and SOM themselves, until the $600 seat price and 1% share are validated.
- A euro or dollar figure for duplicate tests. Use the OECD "one fifth" line and the 50% Australian GP survey, labelled.

---

## 5. Which markets after Greece

Criteria: (a) a rail that lets us ingest, (b) a paper and cross-border gap the rail does not close, (c) concentrated buyers, (d) regulatory load for a doctor-facing assistant, (e) competition, (f) speed to the first paying buyer. Rankings are [INFERENCE] built on the sourced facts.

| Rank | Market | Why | Watch-outs |
|---|---|---|---|
| **1** | **UAE (Abu Dhabi, Dubai), then Saudi Arabia** | Malaffi covers 100% of Abu Dhabi episodes yet carries only data from inside the emirate; large expatriate and medical-tourism flows arrive with foreign and paper records (Dubai over 630k international patients in 2022); few large hospital groups and government health authorities as buyers; Sehhaty (31M users) shows citizen-app appetite | Data residency, local licensing; no sourced expat share; confirm in discovery |
| **2** | **UK** | English; NHS App 39M+ registered, Single Patient Record by default Dec 2028 means rails will exist but the private-sector, abroad and paper gap remains; ChatGPT Health not available; Patients Know Best is a provider-paid incumbent | MHRA device rules (ChatGPT Health likely regulated as a device); NHS sales cycles; the default record shrinks the gap after 2028 |
| **3** | **India** | Largest rail by scale (about 940M ABHA numbers, over 1B records linked); 1.39M registered doctors; chaotic paper and PDF records (Eka Care's own pitch); inbound medical tourists | Low price point ($120 per seat in my model); Eka Care incumbent; doctor count disputed |
| **4** | **US, niche only** | Biggest buyer pool (905k direct-care physicians), rails open (TEFCA, Cures, CMS), clear gap (59% multi-portal, 7% combine); enter via rare-disease and international-patient offices | Most crowded (Epic, Abridge, OpenEvidence, ChatGPT Health, Claude, Navina, Metriport); HIPAA, FDA; broad entry is a capital fight |
| **5** | **Germany and core EU** | EHDS clock (2029, 2031), ePA 73M accounts at about 4% active (so the doctor view is missing); Doctolib distribution | MDR plus AI Act, GDPR; slow public buyers; EU home base after the pilot proves value |

Treg pass tomorrow (founder: "Yes, tomorrow"; no personal contacts): search demand per market, funding for Eka Care, PKB, Heidi, Navina; hiring signals; patient voice on Reddit. Use it first to test rank 1 versus rank 2.

---

## 6. Launch-market note: Greece

Pilot only; not the market. Facts from the earlier version, mostly press on official sources:
- National record (ΗΦΥ/AIFI via MyHealth) full rollout began 26 May 2025; MyHealthApp for citizens launched 11 to 12 Dec 2025; a doctor AI assistant (myHealthDoc, by IDIKA) was presented Oct 2025. https://ehealthrecord.gov.gr/en ; https://www.in.gr/2025/12/12/inbox/myhealthapp-launches-full-digital-health-records-one-app ; https://www.tovima.com/society/greece-launches-ai-assistant-for-doctors-citizens-version-coming-soon
- Not stated: whether citizens can upload their own documents or share with any doctor; whether private-lab paper is in the state file. Check at LifeTech Park.
- OECD 2025 (press): 12.1% of Greeks report unmet medical need (OECD avg 3.4%); about 39% of spending is out of pocket (avg 25%). https://www.tovima.com/society/greek-households-shoulder-heavy-health-costs-oecd-report-says
- MyHealth user count: "over 1.5 million" is a vendor claim, **unverified**. No Greek figures on duplicate tests or history-taking time. Closest Greek patient-held record found: Wellbee (thin details).
- Sword Health and the Greek state on an AI front door (secondary). https://www.lqventures.com/?p=90071

## 7. Open items and search gaps
1. Does MyHealth allow uploads and sharing? (Greek pilot framing.)
2. Ask 10 attendees how they keep exams: paper, photos or none (missing "paper" stat).
3. Validate the $600 seat price and the 1% SOM against free tools (OpenEvidence, Glass) with one hospital buyer.
4. Confirm primaries I could not open: HHS TEFCA release, NHS England statistics, Eurostat dataset, Global Genes, Apple Health Records country list.
5. No global physician headcount was found in a primary; the TAM seat count is derived.
6. Valuations, pricing and user counts of clinical-AI vendors conflict across sources.
