# Health app: possible buyers, global (research, 2026-11-13, global rewrite)

Author: Spast Arxidas (Sales). Public sources only. No one has been contacted; no outreach is drafted here.
Replaces the Greece-first version of this file. Founder's market decision (verbatim, 2026-11-13): "Dont focus on the greek market. we need to focus on global market". Greece is kept only as a pilot location, at the end.
Founder's original ask (verbatim): "Find possible buyers -> hospitals, clinics etc or even governments".

Confidence tags: 🟢 verified on a page I opened · 🟡 seen in a search result or a secondary source, page not opened, or sources disagree · 🔴 my assumption, not sourced.
**Honest status of this round:** I ran web searches and read their summaries; I did not open the source pages tonight. So no figure below is 🟢. Every price, budget owner and sales-cycle figure is 🔴: there is no published benchmark for this product, and the pitch must present them as hypotheses.

Hard rule from the founder's brief: **insurers are excluded.** "These data should not be accessible to insurance companies as proofs" (docs/00-founder-brief.md). No insurer is a buyer, a data recipient or a channel. Public payers and employers are the grey zone; see section 1.9 and the "awaiting founder" box.

---

## 0. What a buyer will compare us to (competitive lens)

Every buyer already has one of three things. The pitch has to start from them, not ignore them.

| Alternative | Examples (🟡 unless noted) | What it covers | The gap we can claim (hypothesis, 🔴) |
|---|---|---|---|
| **National or regional record** | Germany ePA (opt-out, nationwide since 29 Apr 2025; [BMG](https://www.bundesgesundheitsministerium.de/presse/pressemitteilungen/epa-fuer-alle-startet-morgen-pm-28-04-2025)); France Mon espace santé (~16-17m users per [France Assos Santé / Quotidien du Pharmacien](https://www.lequotidiendupharmacien.fr/exercice-pro/politique-de-sante/mon-espace-sante-simposera-t-il-face-doctolib)); Italy FSE 2.0 ([Agenda Digitale](https://www.agendadigitale.eu/sanita/fascicolo-sanitario-elettronico-2-0-si-cambia-davvero-tutto-quello-che-ce-da-sapere/)); Abu Dhabi Malaffi (3.5bn records, mandatory for licensed facilities, [M42](https://m42.ae/media-resources/news/malaffi-reaches-35-billion-clinical-records-setting-a-new-standard-for-healthcare-innovation-in-abu-dhabi/), [Gulf News](https://gulfnews.com/uae/1-billion-clinical-records-now-in-abu-dhabis-digital-health-information-exchange-1.90367601)); Singapore NEHR ([Synapxe](https://www.synapxe.sg/news/national-programmes/health-information-bill)); India ABDM/ABHA ([MoHFW](https://www.mohfw.gov.in/press-info/7908)); Saudi Sehhaty (30m+ users, [MoH](https://www.moh.gov.sa/en/ministry/projects/pages/seha-virtual-hospital.aspx)); NHS App with a Single Patient Record planned for 2028 ([Healthcare Management](https://www.healthcare-management.uk/government-patients-access-record-nhs-app)) | State-system events, inside one jurisdiction | None is patient-held across borders, none ingests the **paper and photocopy** history, none bridges specialists. |
| **Provider and lab apps (walled)** | MyQuest (15m+ users, [Quest](https://www.questdiagnostics.com/business-solutions/health-plans/promote-member-engagement)); Mi Quirónsalud ([Quirónsalud](https://www.quironsalud.com/es/comunicacion/actualidad/portal-pacientes-miquironsalud-supera-5-millones-usuarios)); myAster ([Zawya](https://www.zawya.com/en/press-release/companies-news/aster-dm-healthcare-launches-myaster-in-saudi-arabia-alongside-ai-and-generative-ai-enabled-arabic-voice-response-with-google-cloud-nhhhbp90)); Apollo 24\|7 PHR ([Apollo](https://apollo247.com/guest-health-records)); Mediclinic app shows only Mediclinic lab tests ([Mediclinic FAQ](https://www.mediclinic.ae/en/corporate/Mediclinic-app/mediclinic-app-faq.html)) | Only that group's own data | Cross-provider, patient-held. |
| **Consumer and booking platforms** | Doctolib (company claims 80-90m patients; its boss said it will let patients centralise medical documents, [L'Info Durable](https://www.linfodurable.fr/doctolib-proposera-aux-patients-de-centraliser-leurs-documents-medicaux-selon-son-patron-47995)); Apple Health Records (Quest and Labcorp results, [Fierce](https://www.fiercehealthcare.com/tech/quest-diagnostics-becomes-second-national-lab-to-join-apple-health-records)) | Booking, plus a growing document vault; structured lab feeds | Doctolib is the closest threat in Europe: same promise, far larger reach. Our edge has to be the doctor-side AI bridge and the privacy model, not "a vault". |

Implication for every segment: position as **the layer the patient carries across all of these**, importing from them (ePA, ABHA, Malaffi, Apple Health) and never competing with the state record.

---

## 1. Buyer segments (global)

"Budget owner" is a role, not a person. Cycles are 🔴 guesses.

| # | Segment | Why they'd pay | Budget owner (🔴) | Model | Cycle (🔴) | Main objection |
|---|---|---|---|---|---|---|
| 1.1 | Hospital networks and IDNs | Faster intake, fewer repeat tests, doctor time, international-patient conversion | CMO, CIO / CDO, digital-innovation lead | Enterprise licence per site + per-doctor seat; or pilot fee | 9-18 mo; a single-department pilot 2-4 mo | "We have our own EHR and app" |
| 1.2 | Multi-specialty clinic chains | Same, with a faster decision and a direct rollout across sites | Medical Director / COO | Per-doctor monthly seat | 2-6 mo | No IT team; integration and training cost |
| 1.3 | Telehealth platforms | The remote doctor never sees the history; a patient-held record plus summary lifts consult quality and retention | Chief Product Officer / CMO | White-label or API licence, per-consult fee | 4-9 mo | "We are building this ourselves" (Doctolib is) |
| 1.4 | Diagnostic lab networks (**data source and buyer**) | As source: signed results enable "verified by source", the founder's must-have. As buyer: patient retention, shareable results | Group CDO / CEO | Partnership, white-label, integration fee | 6-12 mo | Own apps; liability for exported data; fear patients leave |
| 1.5 | Governments and national digital-health agencies | Citizen-held archive, backlog digitisation, EHDS or national-record readiness | Ministry digital-health lead; agency CEO | Tender, framework, innovation sandbox, grant. Direct sale in year 1 unlikely | 12-30 mo | The national record exists; procurement; AI = medical device |
| 1.6 | Multilaterals and programmes | **Funders, not buyers**: EU (EHDS regulation, EU4Health, IHI), WHO digital-health network, World Bank digital-health loans to governments | Programme officer; consortium lead | Grant / loan-funded country deployment | 6-18 mo | Consortium needs; call timing; they fund governments, not start-ups directly |
| 1.7 | Medical-tourism hubs and international patient departments | Pre-arrival records for foreign patients, in the patient's language, consented | Head of International Patients / Medical Tourism | Per-case fee or seat | 3-9 mo | Records arrive in many languages and formats |
| 1.8 | Patient associations and rare-disease networks | Members hold the thickest paper archives and see the most specialists; the "possible matches" idea fits them best | Board / executive director | Free pilot, later sponsored licence | 1-4 mo | No budget; will not endorse without a clinical sponsor |
| 1.9 | Employers with self-funded health benefits | Employee navigation and second-opinion programmes | Head of Benefits / CHRO | Per-employee-per-month | 6-12 mo | **Conflicts with the founder's rule, see flag below** |
| 1.10 | Pharma and CROs (consented matches only) | Opt-in anonymous patient matching for research and trial recruitment | Head of Clinical Development / Real-World Evidence | Service fee per matched study | 12+ mo | Ethics, GDPR, reputation; crowded (Clinerion-type networks, Mayo Platform) |
| 1.11 | Insurers | **EXCLUDED by the founder's rule.** | n/a | n/a | n/a | n/a |

### 1.1 Hospital networks and IDNs
- **Why:** each group already ships a patient app, which proves they value patient-facing records (MyQuest, Mi Quirónsalud, myAster). Our add is the pre-digital paper history plus the specialist-bridging assistant for their own doctors. International-patient volumes are a second reason: Cleveland Clinic Abu Dhabi reported 35% growth in international patient visits in 2024 and asks overseas patients to send their last 6 months of records before travel 🟡 ([Abu Dhabi Media Office](https://www.mediaoffice.abudhabi/en/health/cleveland-clinic-abu-dhabi-reports-35-percent-growth-in-international-patient-visits-in-2024/)).
- **Budget owner (🔴):** CMO for clinical value, CIO for integration, digital-innovation lead for pilots.
- **Objection to test:** "We have our own EHR." Answer: we sit on the patient's side, work across providers, import theirs, and never replace their EHR.
- **Insurer wrinkle:** some groups are insurer-owned or insurer-adjacent. Check ownership before any pilot; needs a written data firewall.

### 1.2 Multi-specialty clinic chains
Same logic, smaller deal, faster. Example profile: Aster (15 hospitals, 126 clinics, 338 pharmacies in the Middle East per a Feb 2026 company release 🟡, [Zawya](https://www.zawya.com/en/press-release/companies-news/aster-dm-healthcare-launches-myaster-in-saudi-arabia-alongside-ai-and-generative-ai-enabled-arabic-voice-response-with-google-cloud-nhhhbp90)).

### 1.3 Telehealth platforms
- **Why:** the doctor on a video call has the least history of any doctor. A scanned, summarised, patient-consented record is a direct quality and retention lever.
- **Market state:** the US pure-plays are under pressure: Teladoc 2025 revenue about $2.53bn, down 2%, with a flat 2026 outlook; Amwell 2025 revenue $249.3m, down 2%, 2026 outlook $195-205m 🟡 ([TeleCare Aware, from the 10-Ks](https://telecareaware.com/chutes-teladocs-flat-2025-walgreens-and-cigna-layoffs-telehealth-stable-at-7-humana-centerwell-buys-maxhealth-clinics-honest-health-raises-140m/)). Flat revenue means they want differentiation, but also tight budgets (🔴 inference).
- **Europe:** Doctolib is both a platform and the likeliest competitor (see section 0). Kry/Livi operates in Sweden, Norway, Spain (and France via Livi) 🟡 ([TechCrunch](https://techcrunch.com/?p=1724879)).

### 1.4 Diagnostic lab networks
- **As data source:** a lab that signs or QR-stamps results lets us mark "verified by source". Scale: Quest's MyQuest has 15m+ users 🟡; Synlab reports more than 300 laboratories, about 600m tests a year and EUR 2.54bn revenue in 2025 🟡 ([Synlab](https://www.synlab.com/about-synlab)). Synlab is also divesting country units (its Spanish unit went to Eurofins on 31 Mar 2025, [Eurofins](https://www.eurofins.com/en/media-centre/press-releases/2025-04-01/)), so ownership changes are a timing risk.
- **As buyer:** a white-label patient wallet; they already run apps and fear disintermediation, so the pitch is open export that works with a patient-held key.

### 1.5 Governments and national digital-health agencies
- **Why they'd pay:** backlog digitisation, citizen engagement, readiness for EHDS (EU) or national-record mandates. Singapore's Health Information Act is passed (12 Jan 2026) and will require all licensed providers to contribute key data to the NEHR 🟡 ([Synapxe](https://www.synapxe.sg/news/national-programmes/health-information-bill)); the UK plans a Single Patient Record in the NHS App by 2028 🟡.
- **Model:** tender, framework or sandbox. A direct sale in year 1 is unrealistic (🔴); the realistic outcome is a pilot, sandbox or partner slot, often through an agency's innovation programme (Seha Virtual Hospital runs a sandbox for health innovators, 🟡).
- **Objection:** the national record exists, and the AI diagnostic-support function is a medical device (EU MDR, FDA, local rules). The founder's flag 3 applies: show the AI risk at the end of the deck.

### 1.6 Multilaterals and programmes (funders, not buyers)
- **EU EHDS** (Regulation (EU) 2025/327): in force 26 March 2025; general application from March 2027; primary use for patient summaries and ePrescriptions from 2029, lab results, imaging and discharge reports from 2031; secondary use mostly from March 2029, genomics 2031; third-country access to HealthData@EU about 2035. Sources are law-firm blogs and disagree on some 2027 details 🟡 ([Kennedys](https://www.kennedyslaw.com/en/thought-leadership/article/2026/the-european-health-data-space-is-in-force-implications-for-healthcare-medtech-and-life-sciences), [Skadden](https://www.skadden.com/insights/publications/2025/06/the-european-health-data-space)). Check the Official Journal before any slide quotes a date.
- **IHI (Innovative Health Initiative):** digital-health and data-exchange calls; large consortia, so we would join, not lead. Call 12 (2026) closed 21 Apr 2026; Call 13 unverified 🟡 ([IHI work programme 2026](https://www.ihi.europa.eu/sites/default/files/uploads/Documents/About/AWP/WorkProgramme2026.pdf)). EU4Health 2026: nothing citable found; do not put on a slide.
- **WHO:** the World Health Assembly extended the Global Strategy on Digital Health to 2027 and started work on a 2028-2033 strategy (draft due WHA May 2027) 🟡 ([WHO](https://www.who.int/news/item/23-05-2025-world-health-assembly-endorses-extension-of-the-global-digital-health-strategy-to-2027)). The Global Initiative on Digital Health is a WHO-managed network of organisations and agencies 🟡 ([WHO GIDH](https://www.who.int/initiatives/gidh)). It is a door to country agencies, not a purchaser.
- **World Bank:** funds national digital-health components through country loans (for example Tunisia, May 2025, USD 125m including telemedicine and electronic health records 🟡 ([World Bank](https://www.worldbank.org/en/news/press-release/2025/05/28/new-project-to-boost-tunisia-s-health-system-and-pandemic-response)); West Bengal, Jan 2026, USD 286m, digital NCD tracking 🟡). The buyer is the borrowing government; the route is partner-with-a-prime or ride the project's vendor list (🔴).

### 1.7 Medical-tourism hubs and international patient departments
- **Why:** international patients arrive with foreign-language records. Bumrungrad's own FAQ says about 1.1m outpatients a year, 50% international (so about 550,000), from 190+ countries per its older fact sheet 🟡 ([Bumrungrad FAQ](https://bumrungrad.com/en/hospital-faq), [fact sheet](https://bumrungrad.com/en/about-us/bumrungrad-factsheet)). Acıbadem lists 45+ hospitals and clinics, 7 JCI-accredited hospitals and patients from 90+ countries 🟡 ([Acıbadem International](https://acibademinternational.com/patient-guides/why-choose-acibadem-for-treatment-in-turkey/)). Turkey welcomed about 2m health tourists in 2024 and Thailand 1.4m to 3.5m depending on source 🟡.
- **Why it is our best wedge:** it is the founder's own problem ("take my exams with me") at its sharpest, a buyer with a clear revenue reason, and no EHR integration is needed to start.
- **Model:** per-case fee or seat; **objection:** many formats and languages (a real product risk).

### 1.8 Patient associations and rare-disease networks
Largest paper archives, most specialists, strongest motive for the founder's "possible matches" idea. EURORDIS is the European federation 🟡. Model: free pilot first. Risk: no budget; need a clinical sponsor; must not conflict with national rare-disease registries.

### 1.9 Employers with self-funded health benefits (flag)
- **The conflict:** a self-funded employer carries the claims risk itself, so in function it is the insurer and normally uses a third-party administrator and wellness vendors that receive health data. The founder's rule is that insurers get no access "as proofs". Even a "no data to employer" promise would be hard to prove to a buyer who pays per employee and wants engagement reports.
- **Recommendation (🔴):** do not target employers until the founder rules on whether an employer-funded plan counts as an insurer. If allowed, only as a navigation benefit with zero employer-side data and aggregate-count reporting. **No named employer targets are listed.**

### 1.10 Pharma and CROs (consented matches only; ethics flag)
- **Why:** the founder's idea: find "matches about his condition with someone else across the globe" so doctors can compare. Pharma and CROs buy the research version of this.
- **Incumbents:** Mayo Clinic Platform runs a federated, de-identified data network ("Data Behind Glass") 🟡 ([Mayo](https://www.mayoclinicplatform.org/focus-areas/healthcare-providers/connect/)); patient-matching networks like Clinerion already exist (🟡, from the earlier file). Crowded, not empty.
- **Ethics flag (the founder's judgement, not mine):** opt-in only, per-purpose, revocable, no re-identification, no revenue line that reads as "selling patient data". Recommendation: keep it off the "who pays today" slide; show it only as a later, consent-gated option, consistent with flag 4. Under EHDS the lawful secondary-use route runs through national health data access bodies, not direct deals 🟡.

### 1.11 Insurers: excluded
No sale, no access, no money. Consequences: (a) the data firewall is a documented product promise; (b) buyers owned by an insurer need a written separation before a pilot; (c) public payers and employers are **not decided**, see the box below.

---

## 2. Awaiting founder (not targets)

> **Decisions only the founder can make. I list these here and not as targets.**
>
> 1. **Public payers / national health insurers.** Examples: Germany's statutory insurers (the GKV funds), France's Assurance Maladie, US Medicare (CMS), Turkey's SGK, Thailand's NHSO, Greece's EOPYY, Cyprus's HIO. They are payers, so the "no insurance companies" rule probably covers them, but they are also public bodies that fund national records. Question: does "insurance companies" include public payers? Recommendation (🔴): treat them as excluded until you say otherwise.
> 2. **Hybrid public bodies.** India's National Health Authority runs both ABDM (the digital mission) and PM-JAY (a public insurance scheme); the NHS in England commissions and provides care. Target list rows below talk to their **digital** arms only. Confirm you accept that split.
> 3. **Employers with self-funded benefits** (section 1.9): is an employer-funded plan an "insurer" for the purposes of your rule?
> 4. **Pharma and CRO revenue** (section 1.10): are you comfortable with a consent-gated research-service line at all, and what wording on the deck?
> 5. **Insurer-owned providers** (hospital groups owned or part-owned by insurers): allowed with a written firewall, or excluded?

---

## 3. Named global targets (39)

All decision-maker entries are **public roles only**. I gathered no names, emails or phones. Source = the page behind the claim; all 🟡 unless stated (opened nothing tonight). Rows marked "homepage only" have no verified claim behind them.

### 3.1 United States
| # | Organisation | Segment | Why it fits | Public decision-maker role | Source |
|---|---|---|---|---|---|
| 1 | **Mayo Clinic Platform** (Mayo Clinic) | 1.1 / 1.10 | Federated data network of health systems; membership reported as 8 systems across 3 continents (2024 list: Mayo, Mercy, Sheba, Albert Einstein, UHN, SNUH, SingHealth, UC Davis; a July 2026 article lists a different roster incl. Aga Khan University). Validation partner; a door to a global story | Head of Mayo Clinic Platform; partnerships lead | [Mayo Platform Connect](https://www.mayoclinicplatform.org/focus-areas/healthcare-providers/connect/), [HIT Consultant, Jul 2026](https://hitconsultant.net/2026/07/30/mayo-clinic-einstein-hospital-israelita-platform-connect-ai-data/). Roster unconfirmed |
| 2 | **Cleveland Clinic** (Ohio) | 1.1 | Builds AI with partners (Oracle + G42 platform for the US and UAE; Dyania, DASI, AKASA); chief digital officer describes a co-development model | Chief Digital Officer; Innovations lead | [Healthcare Finance News](https://www.healthcarefinancenews.com/news/oracle-cleveland-clinic-g42-collaborate-ai-platform), [Becker's](https://www.beckershospitalreview.com/innovation/cleveland-clinic-launches-international-ai-collaboration/) |
| 3 | **Quest Diagnostics** | 1.4 | MyQuest 15m+ users (company claim); results already flow to Apple Health Records and an Epic collaboration; both a source and a competitor-in-waiting | Chief Digital / Consumer Officer | [Quest](https://www.questdiagnostics.com/business-solutions/health-plans/promote-member-engagement), [Fierce](https://www.fiercehealthcare.com/tech/quest-diagnostics-becomes-second-national-lab-to-join-apple-health-records) |
| 4 | **Labcorp** | 1.4 | First national lab to connect results to Apple Health; large patient reach; also now buying lab assets in Europe (a Labcorp release names Synlab) | Chief Digital Officer | [Becker's](https://www.beckershospitalreview.com/ehrs/apple-adds-2nd-clinical-laboratory-to-health-records-project.html) |
| 5 | **Teladoc Health** | 1.3 | 100m+ US members (profile claim); revenue about $2.53bn, flat; needs differentiation | Chief Product / Medical Officer | [TeleCare Aware](https://telecareaware.com/chutes-teladocs-flat-2025-walgreens-and-cigna-layoffs-telehealth-stable-at-7-humana-centerwell-buys-maxhealth-clinics-honest-health-raises-140m/) |
| 6 | **Amwell** | 1.3 | Revenue shrinking ($249.3m in 2025); a smaller platform may license rather than build | Chief Product Officer | same TeleCare Aware link |

### 3.2 European Union
| # | Organisation | Country | Segment | Why it fits | Public decision-maker role | Source |
|---|---|---|---|---|---|---|
| 7 | **Helios Germany** (Fresenius) | DE | 1.1 | Largest private hospital operator in Germany: 80+ hospitals, 200+ care centres (2025 report); the German ePA is the incumbent record | CEO Helios; CIO / Chief Medical Officer | [Fresenius AR 2025](https://report.fresenius.com/2025/annual-report/to-our-shareholders/letter-to-our-shareholders.html) |
| 8 | **Quirónsalud** (Fresenius Helios Spain) | ES | 1.1 | Spain's largest private group: about 50 hospitals and 100 outpatient centres (2025 report); Mi Quirónsalud portal claims over 5m users | Chief Digital Officer; Medical Director General | [Fresenius AR 2025](https://report.fresenius.com/2025/annual-report/to-our-shareholders/letter-to-our-shareholders.html), [Quirónsalud](https://www.quironsalud.com/es/comunicacion/actualidad/portal-pacientes-miquironsalud-supera-5-millones-usuarios) |
| 9 | **Ramsay Santé** | FR / SE / NO / DK / IT | 1.1 / 1.2 | 13m patients across 5 countries; AI medical reporting in Sweden and remote monitoring in France; plan "Connecting Care 2030"; parent may distribute its stake in Q4 2026 (timing risk) | Group CDO; country CEOs | [Euronext results, Oct 2025](https://live.euronext.com/en/products/equities/company-news/2025-10-17-ramsay-sante-annual-results-end-june-2025) |
| 10 | **gematik** | DE | 1.5 | The approval gate for any German patient-held record; not a customer, the entry condition | Managing Director | [gematik 1-year ePA factsheet](https://www.gematik.de/media/gematik/Medien/Newsroom/Presse/Dokumente/gem_Factsheet_1_Jahr_ePA_06.pdf) |
| 11 | **Doctolib** | FR / DE / IT | 1.3 | Biggest European booking platform (80-90m patients, company claims); plans to let patients centralise medical documents. Partner or direct competitor | CEO; Chief Product Officer | [L'Info Durable](https://www.linfodurable.fr/doctolib-proposera-aux-patients-de-centraliser-leurs-documents-medicaux-selon-son-patron-47995), [ICT&health](https://www.icthealth.org/news/how-this-platform-mastered-the-art-of-appointment-management) |
| 12 | **Kry / Livi** | SE / NO / ES / FR | 1.3 | Nordic telehealth leader operating in Sweden, Norway, Spain; Livi in France | CPO; Medical Director | [TechCrunch](https://techcrunch.com/?p=1724879) |
| 13 | **Synlab** | DE (group) | 1.4 | 300+ laboratories, about 600m tests a year, EUR 2.54bn revenue (2025); many Spanish and eastern-European units sold on | Group CEO; CDO | [Synlab](https://www.synlab.com/about-synlab), [Eurofins](https://www.eurofins.com/en/media-centre/press-releases/2025-04-01/) |
| 14 | **Unilabs** | CH / multi | 1.4 | Pan-European lab group; a search result suggests it bought Synlab's Slovakia unit in Feb 2026. No size data found 🔴 | Group CDO | homepage only: [unilabs.com](https://www.unilabs.com) |
| 15 | **Délégation au numérique en santé / Mon espace santé** | FR | 1.5 | State record (16-17m activated profiles) under pressure from Doctolib; a partner path for import, not a buyer | Head of the Délégation | [Quotidien du Pharmacien](https://www.lequotidiendupharmacien.fr/exercice-pro/politique-de-sante/mon-espace-sante-simposera-t-il-face-doctolib) |
| 16 | **AGENAS / Italian Ministry of Health (FSE 2.0)** | IT | 1.5 | FSE 2.0 funded by the national recovery plan (about EUR 1.3bn), due fully operational 2026, but described as incomplete with regional gaps. AGENAS's exact role not confirmed 🔴 | Digital transformation lead | [Agenda Digitale](https://www.agendadigitale.eu/sanita/fascicolo-sanitario-elettronico-2-0-si-cambia-davvero-tutto-quello-che-ce-da-sapere/) |
| 17 | **Kanta Services (Kela) and Inera** | FI / SE | 1.5 | Nordic national record operators. **Not verified tonight**: my search returned nothing on them; listed because the founder asked for the Nordics | CEO / digital health lead | homepage only: [kanta.fi](https://www.kanta.fi), [inera.se](https://www.inera.se) |
| 18 | **Nictiz / MedMij** | NL | 1.5 | Dutch standards body and personal-health-record scheme. **Not verified tonight**, same reason | Programme lead | homepage only: [nictiz.nl](https://www.nictiz.nl), [medmij.nl](https://www.medmij.nl) |
| 19 | **European Commission DG SANTE (EHDS)** | EU | 1.6 | Owns the EHDS; sets the interoperability our import and export must follow | Head of the digital-health unit | [Commission EHDS page](https://health.ec.europa.eu/ehealth-digital-health-and-care/european-health-data-space-regulation-ehds_en) |
| 20 | **Innovative Health Initiative JU** | EU | 1.6 | Digital-health and data-exchange calls; we join as a SME partner | Programme office / call coordinator | [IHI 2026 work programme](https://www.ihi.europa.eu/sites/default/files/uploads/Documents/About/AWP/WorkProgramme2026.pdf) |
| 21 | **EURORDIS** | EU | 1.8 | European rare-disease federation; strongest "doctor sees everything" and "possible matches" fit. Size and programmes unverified 🔴 | Director of digital / policy | homepage only: [eurordis.org](https://www.eurordis.org) |

### 3.3 United Kingdom
| # | Organisation | Segment | Why it fits | Public decision-maker role | Source |
|---|---|---|---|---|---|
| 22 | **NHS England** (NHS App, Single Patient Record, Federated Data Platform) | 1.5 | SPR planned for the NHS App by 2028 and requires legislation; the FDP is controversial (data-guardian concerns about vendor access). Our import layer fits; direct sale unlikely. NHS is a commissioner as well as an operator (see "awaiting founder") | Chief Digital and Information Officer; NHS App programme director | [Healthcare Management](https://www.healthcare-management.uk/government-patients-access-record-nhs-app), [Digital Health](https://www.digitalhealth.net/2025/06/the-nhs-10-year-health-plan-what-do-we-know-so-far/) |

### 3.4 Gulf
| # | Organisation | Segment | Why it fits | Public decision-maker role | Source |
|---|---|---|---|---|---|
| 23 | **Department of Health Abu Dhabi / Malaffi (ADHDS, an M42 company)** | 1.5 | Health information exchange with 3.5bn records; connection mandatory for licensed facilities. A partner path for importing records, not a buyer. Malaffi covers Abu Dhabi only | CEO of Abu Dhabi Health Data Services; DoH digital-health lead | [M42](https://m42.ae/media-resources/news/malaffi-reaches-35-billion-clinical-records-setting-a-new-standard-for-healthcare-innovation-in-abu-dhabi/), [Gulf News](https://gulfnews.com/uae/1-billion-clinical-records-now-in-abu-dhabis-digital-health-information-exchange-1.90367601) |
| 24 | **Cleveland Clinic Abu Dhabi** | 1.1 / 1.7 | 35% growth in international patient visits in 2024; top source countries Kuwait, Saudi Arabia, Pakistan, Bahrain, USA; asks overseas patients for records in advance, which is exactly our use case. Gulf investor story | Head of International Patients; Chief Digital Officer | [Abu Dhabi Media Office](https://www.mediaoffice.abudhabi/en/health/cleveland-clinic-abu-dhabi-reports-35-percent-growth-in-international-patient-visits-in-2024/) |
| 25 | **Mediclinic Middle East** | 1.1 / 1.7 | 6-7 UAE hospitals and 20-29 clinics; international patient programme with a remote assessment call; its app shows only Mediclinic's own lab tests | International Patient Coordinator head; Chief Digital Officer | [Mediclinic](https://www.mediclinic.ae/en/corporate/medical-tourism.html), [FAQ](https://www.mediclinic.ae/en/corporate/Mediclinic-app/mediclinic-app-faq.html) |
| 26 | **Aster DM Healthcare** | 1.2 | UAE expansion (AED 1bn) and Saudi growth (USD 250m); myAster has 2m+ downloads; Google Cloud AI partner | Group CEO; Chief Digital Officer | [Zawya](https://www.zawya.com/en/press-release/companies-news/aster-dm-healthcare-launches-myaster-in-saudi-arabia-alongside-ai-and-generative-ai-enabled-arabic-voice-response-with-google-cloud-nhhhbp90) |
| 27 | **Saudi Ministry of Health / Seha Virtual Hospital / Health Holding Company** | 1.5 | Seha Virtual Hospital links about 241 hospitals and 1,400 health centres and runs a **sandbox for health innovators**; Sehhaty has 30m+ users; Mass General Brigham signed with the Health Holding Company in Oct 2025. Governance split between the ministry and the HHC unconfirmed | Seha Virtual Hospital director; Digital Health lead | [MoH Seha Virtual Hospital](https://www.moh.gov.sa/en/ministry/projects/pages/seha-virtual-hospital.aspx), [World Health Expo](https://www.worldhealthexpo.com/insights/healthcare-management/spotlight-saudi-moh-introduces-health-holding-company) |
| 28 | **Qatar Ministry of Public Health and Hamad Medical Corporation** | 1.5 / 1.1 | MoPH sets the national e-health strategy; HMC and PHCC share one record ("One Patient, One Record") and a patient portal; a shared-record programme (QHUB) planned. Material is mostly 2016-2018, status unverified | MoPH e-health lead; HMC Chief Digital Officer | [MoPH](https://moph.gov.qa/english/strategies/Supporting-Strategies-and-Frameworks/NationalEHealthAndDataManagementStrategy/Pages/default.aspx) |

### 3.5 India and Singapore
| # | Organisation | Segment | Why it fits | Public decision-maker role | Source |
|---|---|---|---|---|---|
| 29 | **National Health Authority, India (ABDM)** | 1.5 | ABDM/ABHA: 74 crore ABHA accounts and 49 crore records linked as of Feb 2025 (official reply); newer figures up to 90 crore+ are unconfirmed. Records are linked by consent, which matches our model; any PHR app can connect. NHA also runs PM-JAY insurance: see "awaiting founder" | CEO NHA; ABDM digital lead | [MoHFW](https://www.mohfw.gov.in/press-info/7908), [ThePrint](https://theprint.in/india/nearly-74-cr-ayushman-bharat-health-records-created-govt-tells-rs/2489727/) |
| 30 | **Apollo Hospitals** | 1.1 / 1.7 | Apollo 24\|7 claims 40m+ users and a PHR syncing across its group; international patients about 6% of Q3 FY26 revenue (INR 190 crore of 3,183 crore) | Chief Digital Officer; International Patients head | [Apollo 24\|7](https://apollo247.com/guest-health-records), [Business Standard](https://www.business-standard.com/companies/news/apollo-redraws-medical-tourism-map-bangladesh-share-dips-126021500418_1.html) |
| 31 | **Ministry of Health Singapore / Synapxe (NEHR, HealthHub)** | 1.5 | Health Information Act passed 12 Jan 2026; NEHR gives patients an access history and, from H2 2026, direct restriction control via HealthHub. A strong privacy-first reference; an import partner | CEO Synapxe; MOH digital-health lead | [Synapxe](https://www.synapxe.sg/news/national-programmes/health-information-bill), [gov.sg](https://www.gov.sg/explainers/parliament-jan2026/) |
| 32 | **SingHealth** | 1.1 | Public healthcare cluster and a founding Mayo Clinic Platform Connect member | Group CIO / Chief Medical Informatics Officer | [Mayo news](https://newsnetwork.mayoclinic.org/discussion/mayo-clinic-platform-expands-its-distributed-data-network-to-partner-to-globally-transform-patient-care/) |

### 3.6 Medical-tourism hubs and innovation gateways
| # | Organisation | Segment | Why it fits | Public decision-maker role | Source |
|---|---|---|---|---|---|
| 33 | **Bumrungrad International Hospital** (Bangkok) | 1.7 | About 1.1m outpatients a year, 50% international per its own FAQ (about 550,000), more than 190 countries in an older fact sheet. The strongest international-patient case in the list | Head of International Patient Services; CIO | [Bumrungrad FAQ](https://bumrungrad.com/en/hospital-faq), [fact sheet](https://bumrungrad.com/en/about-us/bumrungrad-factsheet) |
| 34 | **Acıbadem Healthcare Group** (Istanbul) | 1.1 / 1.7 | 45+ hospitals and clinics, 7 JCI-accredited, patients from 90+ countries, 39-50+ representative offices abroad; Turkey about 2m health tourists in 2024 | Head of International Patients; Chief Digital Officer | [Acıbadem International](https://acibademinternational.com/patient-guides/why-choose-acibadem-for-treatment-in-turkey/) |
| 35 | **Sheba Medical Center and ARC Innovation** (Israel) | 1.1 / innovation gateway | ARC pairs start-ups with clinicians (100+ start-ups since 2019); Sheba is a Mayo Platform Connect member; **ARC reportedly being sold to Redesign Health: check status** | Head of ARC Innovation; Sheba Chief Innovation Officer | [Globes](https://en.globes.co.il/en/article-sheba-medical-center-launches-digital-innovation-center-1001308142), [Calcalist](https://www.calcalistech.com/ctechnews/article/h1m1jodhgx) |

### 3.7 Multilateral doors
| # | Organisation | Segment | Why it fits | Public decision-maker role | Source |
|---|---|---|---|---|---|
| 36 | **WHO Global Initiative on Digital Health (GIDH)** | 1.6 | WHO-managed network of organisations and agencies; access to country digital-health agencies. Not a buyer | GIDH Secretariat lead | [WHO GIDH](https://www.who.int/initiatives/gidh) |
| 37 | **World Bank health practice (digital health loans)** | 1.6 | Funds national digital-health components (Tunisia, West Bengal, El Salvador, Jordan). The customer is the borrowing government | Task team leader on a given project | [World Bank, Tunisia](https://www.worldbank.org/en/news/press-release/2025/05/28/new-project-to-boost-tunisia-s-health-system-and-pandemic-response) |
| 38 | **Hellenic Healthcare Group (HHG)** | 1.1 | Largest Greek private group, also operating in Cyprus; kept here as the bridge to the Greece pilot section | Group CEO / CMO / CIO | [HHG](https://www.hhg.gr/en/profile/about-us) |
| 39 | **Clinerion** | 1.10 | A patient-matching network already live; an incumbent and possible partner for "possible matches" | Business development lead | [Applied Clinical Trials](https://www.appliedclinicaltrialsonline.com/view/hygeia-group-hospitals-expands-clinerion-s-global-network-hospitals-greece) |

### 3.8 Gaps I could not close tonight
- Unilabs, Kanta/Kela, Inera and Nictiz/MedMij: no useful search result; rows are homepage-only and must not go on a slide as facts.
- EURORDIS size and digital programmes; Turkish Ministry of Health (e-Nabız) and Thai national schemes: not searched.
- Mayo Platform's current membership list (sources differ); Sheba ARC's ownership; Quest/Labcorp portal counts for Labcorp.
- No page was opened tonight, so everything is 🟡 at best. The treg pass tomorrow (founder: "Yes, tomorrow") should recheck the top ten.

---

## 4. The first three global pilots after the hackathon

Test: fast access, low regulatory burden, a clear patient and doctor group, and a story an investor repeats. All reasoning is mine (🔴); this is a recommendation.

1. **Innovation-gateway pilot: Sheba ARC (first), Mayo Clinic Platform Accelerate as the second door.**
   - *Fast access:* both are programmes designed to take start-ups; ARC pairs a start-up with clinicians, and the two programmes were reported to cross-refer start-ups 🟡.
   - *Regulation:* a validation run on de-identified or synthetic data avoids touching live patient records and the MDR question.
   - *Investor story:* a named clinical partner that sits inside the Mayo Platform network, which the pitch can reuse. Risk: ARC's reported sale (check), and that this proves clinical credibility, not revenue.
2. **Medical-tourism pre-arrival pilot: Bumrungrad (first), Acıbadem (second), Cleveland Clinic Abu Dhabi (third).**
   - *Why:* the buyer has a direct revenue reason (foreign patients are 50% of Bumrungrad's outpatients per its own FAQ) and already asks patients for records before they arrive (CCAD). The pilot is a consented, translated record packet for foreign patients; no hospital EHR integration is needed.
   - *Regulation:* patient-controlled sharing, no AI diagnosis shown to patients. The AI summary is for the receiving doctor only; flag that it still needs the medical-device review for a product (flag 3).
   - *Investor story:* the plainest "who pays" case on this list: a hospital pays per foreign patient. Risk: records in many languages and formats.
3. **Rare-disease network pilot: EURORDIS (with a member organisation).**
   - *Fast access:* patient groups can recruit 20-30 members quickly (🔴), with no hospital IT. Free pilot.
   - *Regulation:* consent-based under GDPR; the "possible matches" feature stays off until ethics review.
   - *Investor story:* it is the founder's own vision (patients with the same condition across the globe, doctors collaborating on cause and cure) proven in the group where it matters most. Risk: no revenue; verify EURORDIS's size and programmes first.

**Reserve:** Apollo Hospitals (India), because ABHA-linked consent and 40m+ app users give scale; Aster or Mediclinic in the Gulf, once a medical-tourism pilot exists. **Do not lead with:** Germany (gematik approval gate; Helios is a long cycle), the NHS (legislation not yet in place), or Doctolib (likelier competitor).

---

## 5. One slide: who pays (global)

Suggested title: **Who pays, and when**

| When | Who pays | What for | Model (to be tested) |
|---|---|---|---|
| Year 1 | Hospitals and international-patient departments | Records for foreign and referred patients, a faster first visit | Per-case fee, per-doctor seat |
| Year 1 | Clinic chains and telehealth platforms | The doctor sees the whole history; fewer repeat tests | Per-doctor seat, white-label licence |
| Year 1 | Lab networks | Patient-held results marked "verified by source" | Partnership, integration fee |
| Year 1-2 | Programmes and grants (EU, WHO network, development banks) | A privacy-first, standards-aligned record pilot | Grant funding, not revenue |
| Year 2+ | National health-data agencies | Citizen-held layer next to the national record | Tender, framework, sandbox |
| Later, consent-gated | Pharma and CROs | Opt-in anonymous "possible matches" for research | Service fee, never a data sale |
| **Never** | **Insurers** | Excluded by design: no access, no money | n/a |

Speaker line (🔴, for the deck owner): "The patient never pays and the insurer never sees. Hospitals and platforms pay for a better first visit; programmes fund the privacy-first layer; research is a later, opt-in extra."

Mark on the slide that the models are hypotheses for pilots to test. No prices appear because none are sourced.

---

## 6. Pilot location: Greece / Athens LifeTech Park

The hackathon is in Athens, and the founder said Greece is at most one launch or pilot location, not the market. The earlier Greece-first study had 27 targets; the three that matter as local pilots:

1. **Athens LifeTech Park (Spata).** Hosts the Biotech & AI track; the park incubates biotech start-ups and is reported to have a CRO and a translational research centre, and a clinical-research collaboration with Papageorgiou General Hospital 🟡. Ask for an introduction to its clinical-research contact and one clinician champion. Sources: [To Vima](https://www.tovima.com/politics/mitsotakis-touts-e1bn-pharma-push-at-athens-biotech-hub/), [ALTP at BIO](https://convention.bio.org/exhibitors/athens-lifetech-park), [Hackathon prep](https://hackathon.polymath42.com/prep).
2. **Rare Diseases Greece (ΕΣΑΕ)**, Greece's EURORDIS representative, founded Feb 2022 🟡. A free pilot for 20-30 members, with EURORDIS (global target 21) as the amplifier. Respect the national rare-disease registries run by IDIKA. Sources: [Rare Disease Day](https://rarediseaseday.org/?p=68133), [EURORDIS Greece](https://www.eurordis.org/rare-disease-policy/national-policy/national-plan-for-rare-diseases-greece).
3. **One mid-size private hospital department: Mediterraneo Hospital (Glyfada)**, first choice (147-164 beds across sources, 25+ specialties); Athens Medical Group second. An orthopaedics-plus-rheumatology pair is the founder's own example. Avoid Euroclinic until its insurer ownership (Generali Hellas) is settled with the founder. Sources: [Slideshare profile](https://www.slideshare.net/kstergiopoulos/mediterraneo-hospital), [To Vima](https://www.tovima.com/finance/athens-based-euroclinic-group-purchased-by-generali-hellas/amp/).

Local context to keep: Greece's national record (ΕΗΦΥ, live for all citizens since 26 May 2025, via myHealth; [CNN Greece](https://www.cnn.gr/ellada/story/466625/ilektronikos-fakelos-tou-astheni-i-nea-psifiaki-epoxi-ygeias-gia-ton-kathe-politi)) is the same "national record" alternative as in section 0. EOPYY, the national health insurer, is in the "awaiting founder" box.

---

## 7. Method note

Skills used: dossier, market-research and competitive-intel, as an approach: search, then verify, tag confidence, competitor lens in section 0, run through web search. The sales-engineer, cold-email and pricing-strategy skills were loaded by the dispatch but are not applied: no outreach, no demo, no pricing. Public sources only; no personal data; nobody contacted. Search summaries are not pages I opened; see the status line at the top.
