# healthapp: treg findings, 2026-11-14

Author: Anna Lytica (Marketing), MIN-4469. Run plan: `treg-call-plan.md` (CTO, MIN-4468).
All calls on 2026-11-14 through the treg CLI. Public and aggregate queries only; no patient facts, no private individuals.
Raw answers for Q1 to Q3 (aggregate data only): `treg-raw-2026-11-14/`. Q4 and Q5 raw answers are not kept in the repo (they carry personal investor profiles and full third-party pages).

**Spend: $0.278** (balance $0.9906 before, $0.7126 after). Cap was $0.50. Two Q3 traffic calls failed with a provider HTTP 500 and were free.

## Bottom line

The problem is real and documented, but in Greece the state is closing the lab-results part of it right now. Since 1 November 2026, EOPYY requires labs to post results into one national database, and patients already reach results through MyHealth (about 9,900 Google searches a month for "myhealth app" from Greece). Nobody searches for "move my exams" in Greek. The idea holds only if healthapp is pitched on what the state file does not hold: private and out-of-pocket tests, old paper, imaging, records from abroad, and the doctor-side summary. **Verdict: unclear, leaning weakened for the Greek consumer pitch; supported for the doctor-side, cross-border pitch.** The founder should confirm the gaps at LifeTech Park today (questions in Q6).

## Q1. Monthly Google search volume

Tool `dataforseo.google.keywords.volume` (Google Ads data), Greece (location 2300) and worldwide. 18 keywords, 2 calls, $0.18.

| Keyword | Greece / month | Worldwide / month | CPC worldwide |
|---|---|---|---|
| myhealth app | 9,900 | 18,100 | $1.98 |
| αποτελέσματα εξετάσεων | 3,600 | 3,600 | n/a |
| medical records | 40 | 49,500 | $4.06 |
| patient portal | 30 | 246,000 | $4.09 |
| personal health record | 30 | 6,600 | $5.06 |
| medical records app | 10 | 590 | $7.82 |
| store medical records | 10 | 590 | $27.68 |
| health records app | 10 | 320 | $2.08 |
| medical history app | 10 | 110 | $4.35 |
| lab results app | 0 | 90 | $8.28 |
| scan lab results | below floor | 10 | n/a |
| μεταφορά εξετάσεων, ιατρικό ιστορικό εφαρμογή, ψηφιακές εξετάσεις, φάκελος υγείας, ηλεκτρονικός φάκελος υγείας, ιατρικός φάκελος, εξετάσεις online | below Google's reporting floor | below floor | n/a |

"Below floor" means Google Ads returned no volume, not zero. The worldwide "myhealth app" figure mixes several unrelated apps of that name.

- **Verdict: weakens** consumer pull in Greece. Greeks look for their results (3,600) and the state app (9,900), not for a tool to move or store exams. Worldwide, people search for portals and records (246k, 49.5k), and "store medical records" carries a $27.68 CPC, so advertisers pay for that intent.
- For a doctor-facing product, search volume is a weak signal either way. It does not test the doctor's pain.
- Closes: §7 had no demand data. Not a deck stat.

## Q2. Google top 10 in Greece

Tool `treg.google.serp.organic` (answered by crawl4ai; no filters ignored, so results are Greek). 5 calls, $0.0019.

- "μεταφορά εξετάσεων" and "ψηφιακές εξετάσεις" return school and university exams (εξετάσεις also means school exams). The Greek words the deck uses do not mean "medical tests" to Google.
- "ιατρικό ιστορικό εφαρμογή": generic Play Store apps (Spanish and Catalan), apps.moh.gov.gr, no Greek product.
- "medical records app" and "scan lab results": generic Play Store apps and foreign lab portals. No Greek competitor ranks.
- **Verdict: supports** (no private Greek product owns the space) **with a copy warning**: say "ιατρικές εξετάσεις" or "αποτελέσματα εξετάσεων", never "εξετάσεις" alone.
- Closes: §6 "closest Greek patient-held record" stays Wellbee; none found in the top 10.

## Q3. Competitor search traffic and authority

Traffic tool `dataforseo.x.dataforseo-labs-google-bulk-traffic-estimation-live`, Greece (2300). Estimated **Google search** visits per month (organic), not total visits. Paid was 0 for all.

| Domain | Est. Google visits / month from Greece | Domain authority (SE Ranking, 0–100) |
|---|---|---|
| myhealth.gov.gr | 87,688 | 56 |
| doctolib.fr | 1,004 | n/a |
| doctolib.de | 358 | n/a |
| eka.care | 97 | 73 |
| doctolib.com | 39 | 83 |
| openevidence.com | 8 | 84 |
| glass.health | 1 | 76 |

Authority tool `treg.web.url.metrics` ($0.0027 per domain). The worldwide and US traffic calls failed twice with a provider error (free); **no worldwide traffic figure**.

- **Verdict: supports** that private competitors have no Greek presence, and **weakens** the "nobody holds the record" story: the state record is the incumbent, with roughly 88k search visits a month.
- Closes: §6 "MyHealth user count unverified" only partly. 88k monthly search visits is a floor on interest, not a user count. The "1.5 million" vendor claim stays unverified.

## Q4. Funding (company-level only)

Tool `aviato.companies.funding_rounds`, 4 calls, $0.04. Amounts as Aviato lists them (USD). **Cross-check each against one news source before a slide.** Some rounds look duplicated in Aviato (two Eka Care seeds of $4.5M; Glass's $6.5M "venture round" may be the sum of the others).

| Company | Rounds listed | Latest | Valuation listed |
|---|---|---|---|
| OpenEvidence | Seed $5M (2021), Seed $27M (2022), A $75M (Feb 2025), B $210M (Jul 2025), C $200M (Oct 2025), D $250M (Jan 2026), E $250M (Sep 2026) | Series E, 2026-09-16 | $925M at A; $3.29B at B; none listed after |
| Doctolib | Seed $1.3M (2014) to F $548M (Mar 2022, plus debt); corporate round 2026-10-13, no amount | Corporate, 2026-10-13 | $5.81B at F |
| Eka Care | Seed $4.5M (2021), A $15M (Jul 2022) | Series A, 2022 | est. $60–90M at A |
| Glass Health | Pre-seed $1.5M and $0.5M, Seed $5M (Sep 2023) | Seed, 2023 | none |

- **Verdict: supports** that investors fund clinical AI over records at scale (OpenEvidence about $1B across listed rounds), and confirms OpenEvidence as the best-funded threat.
- Closes: §4 "OpenEvidence at $15B" is **still unverified**; Aviato shows $3.29B at Series B and no later valuation. Use "raised about $1B (Aviato, to Sep 2026)" only after a news cross-check.

## Q5. Doctors, paper exams and duplicate tests (anecdotes and leads, not statistics)

Tools `treg.web.search` (answered by Exa, 4 calls) and `crawl4ai.reddit.search.posts` (3 calls; nothing relevant came back). $0.03.

Greece, from the news (the most important finding of the run):
- Since 1 November 2026, labs must post EOPYY patients' results digitally into one database; posting is tied to reimbursement, and the stated aim is to stop "pointless and costly repetition of tests". Ta Nea, 2026-11-02: https://www.tanea.gr/2026/11/02/science-technology/health/eopyy-psifiaka-pleon-i-anartisi-ton-diagnostikon-eksetaseon-poies-eksairountai-prosorina/
- Citizens already get results through the MyHealth app or myhealth.gov.gr. Insider.gr: https://www.insider.gr/ygeia/340865/diagnostikes-exetaseis-sto-psifiako-apothetirio-ta-apotelesmata-apo-oles-tis-domes-tis
- EOPYY now caps how often key blood tests can be re-prescribed, built into e-prescribing; doctors say they "cannot prescribe the repeat of critical tests". Ethnos: https://www.ethnos.gr/health/article/401344/eopyyseefarmoghoineoikoftesstisdiagnostikesexetaseisposesforesmporoymenatisepanalaboyme ; Aftodioikisi: https://www.aftodioikisi.gr/ygeia/eopyy-chronika-oria-stin-epanalipsi-vasikon-diagnostikon-exetaseon-prokaloyn-antidraseis/
- Evangelismos hospital is adding software that blocks unnecessary repeat lab tests. Ygeiamou: https://www.ygeiamou.gr/idisis/371662/esi-pio-elliniko-nosokomio-vazi-freno-se-perittes-exetasis-pos-ofelounte-i-asthenis/

What this means: repeats are now harder to get, so a doctor needs the earlier result at hand. That supports a doctor-side tool. But the state file now holds EOPYY lab results, which weakens "patients carry paper" for those tests. Not covered by the state file, as far as these sources say: private tests paid out of pocket, results from before the rollout, imaging, and records from abroad.

Global anecdote: a physician column on ordering a full work-up when the patient did not bring prior results: "if a patient hadn't brought his past stuff, I just did it all." MDedge: https://www.mdedge.com/content/duplicating-tests-when-urgency-not-issue

Study leads (abstracts seen through search, primaries **not opened**; not for a slide until someone opens them):
- Netherlands, BJGP Open 2022: 56% of GP-ordered lab tests were repeated after referral to the outpatient clinic. https://bjgpopen.org/content/6/1/BJGPO.2021.0134
- Netherlands, Amsterdam UMC: complete information for 17.6% of referred oncology patients; lab results shared completely for 55.2%. https://pure.amsterdamumc.nl/en/publications/incomplete-patient-information-exchange-and-unnecessary-repeat-di/
- US, 85 transfers between two hospitals (2006–07): 32% had a duplicate test; 20% at least one not clinically indicated. https://pmc.ncbi.nlm.nih.gov/articles/PMC2995707/

- **Verdict: supports** the problem (duplicates are documented in Europe) and **weakens** the Greek paper angle (the state is digitising EOPYY lab results this month).
- Closes: §4 "use the OECD one-fifth line": the Dutch 56% could replace or back it once the primary is opened. §7 item 1 is partly answered: results flow into MyHealth; uploads and sharing with any doctor are still unconfirmed.

## Q6. For the founder at LifeTech Park today (not a treg question)

1. "When a patient comes to you, where are their earlier results? MyHealth, paper, phone photos, or nothing?" Ask for the rough share of each.
2. "Since the EOPYY limits on repeat tests, what do you do when the patient has no earlier result and you can't re-prescribe?"
3. "Which results never reach MyHealth: private tests paid out of pocket, imaging, tests from abroad, older ones?"
4. "How long does it take you to rebuild a new patient's history today?" Get minutes, not adjectives.
5. "Would you, or your clinic, pay for a one-page summary of a patient's past records before the visit? What would it have to replace for you to pay?" Ask for a monthly figure; do not suggest one.

## What changed in market-and-competitors.md

A dated note under §7 points here. No deck stat in §4 was re-verified by this run (treg does not reach WHO, ONC or the EHDS pages). OpenEvidence's funding rounds now have a source (Aviato), but the $15B valuation stays on the "do not put on a slide" list.

## Skipped (lean demo)

- Worldwide and US competitor traffic (provider error twice; not retried further).
- Any EU country beyond Greece for Q1, the paid "total visits" traffic tool, and news cross-checks for Q4.
- Opening the study primaries in Q5.
