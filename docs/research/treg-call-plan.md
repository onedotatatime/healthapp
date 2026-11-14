# treg call plan for Anna's research

CTO, 2026-11-14. Written from real `treg` runs (CLI v0.30.0, team `lefteris-s-team`), not from the docs.

## State

- Connection works. `treg`, `treg balance`, `treg catalog search` and `treg catalog get` all answer.
- `catalog search` and `catalog get` are free (balance was $1.00 before and after 13 of them).
- Balance now: **$0.99055**. The CTO spent $0.00945 on two test calls.
- The only credit on the account is the $1.00 promotional grant of 2026-11-14 (the standard new-account credit). **No hackathon credits are on the balance.** Nothing was redeemed.
- Budget for this plan: expected **$0.29**, hard ceiling **$0.43**. Both fit.

## Rules for the run

- Public and aggregate queries only. No patient facts. No lookups of private individuals.
- Run from a terminal with `export PATH="$HOME/.local/bin:$PATH"`.
- After each call, note the `treg: charged $…` line (stderr). Run `treg balance` after each question. Stop if the total passes $0.45.
- A 4xx is free and is a mistake in the request: fix it, do not retry elsewhere.
- Do not repeat a call that already answered. Save every answer to a file (`> q1-gr.json`).

## What the two test calls showed

| Test | Tool | Cost | Result |
|---|---|---|---|
| 1 | `serpstat.google.keywords.volume`, database `g_gr`, 5 keywords | $0.0005 | Only "medical records app" came back (10 searches/month in Greece). The 3 Greek terms and "scan lab results" are not in Serpstat's Greek index. |
| 2 | `treg.google.keywords.volume` routed to SE Ranking, `country: gr`, 5 keywords | $0.00895 | All 5 returned `is_data_found: false`, and the miss was billed. |

Conclusion: the cheap keyword indexes do not hold these Greek long-tail terms. Use the Google Ads source (DataForSEO) for Q1. Do not use Serpstat or SE Ranking for Greek keywords again.

Early signal for the research itself: these exact phrases have very low search volume in Greece. Add broader variants to the Q1 call (it costs the same for 1 or 1,000 keywords).

## Q1. Monthly search volume, Greece and EU

Tool: `dataforseo.google.keywords.volume` (Google Ads data, 12-month trend, CPC). Price: **$0.09 per call**, flat for up to 1,000 keywords. Not test-called (over the CTO's $0.05 test cap); treg measures it at 100% answered, 100% hit over 41k calls.

Greece (location 2300):

```bash
treg call dataforseo.google.keywords.volume --method POST --data '[{"keywords":["μεταφορά εξετάσεων","ιατρικό ιστορικό εφαρμογή","ψηφιακές εξετάσεις","medical records app","scan lab results"],"location_code":2300}]' > q1-gr.json
```

Worldwide (no location), as the upper bound:

```bash
treg call dataforseo.google.keywords.volume --method POST --data '[{"keywords":["μεταφορά εξετάσεων","ιατρικό ιστορικό εφαρμογή","ψηφιακές εξετάσεις","medical records app","scan lab results"]}]' > q1-world.json
```

Expected cost: **$0.18** (2 calls).

- **No tool gives an "EU" total.** Google Ads volume is per country or worldwide. All 27 countries would be 27 calls, $2.43, which does not fit. If one EU market is needed, add one call with `"location_code":2276` (Germany) or `2250` (France), $0.09 each.
- Add Anna's broader variants to the same `keywords` array before running (for example "αποτελέσματα εξετάσεων", "φάκελος υγείας", "εξετάσεις online"). Same price. Each keyword: max 80 characters, 10 words.
- If a keyword comes back with `search_volume: null`, Google has no data for it: report it as "below Google's reporting floor", not as zero.

## Q2. Google top results in Greece

Tool: `treg.google.serp.organic` (routed, 7 providers). Price: **$0.00038 to $0.015 per hit**; the cheapest provider usually answers. One call per keyword, 5 calls. Not test-called by the CTO.

```bash
treg call treg.google.serp.organic --method POST --header 'X-Treg-Route-Max-Cost: 0.02' --data '{"q":"μεταφορά εξετάσεων","country":"gr","language":"el","limit":10}' > q2-1.json
treg call treg.google.serp.organic --method POST --header 'X-Treg-Route-Max-Cost: 0.02' --data '{"q":"ιατρικό ιστορικό εφαρμογή","country":"gr","language":"el","limit":10}' > q2-2.json
treg call treg.google.serp.organic --method POST --header 'X-Treg-Route-Max-Cost: 0.02' --data '{"q":"ψηφιακές εξετάσεις","country":"gr","language":"el","limit":10}' > q2-3.json
treg call treg.google.serp.organic --method POST --header 'X-Treg-Route-Max-Cost: 0.02' --data '{"q":"medical records app","country":"gr","language":"en","limit":10}' > q2-4.json
treg call treg.google.serp.organic --method POST --header 'X-Treg-Route-Max-Cost: 0.02' --data '{"q":"scan lab results","country":"gr","language":"en","limit":10}' > q2-5.json
```

Expected cost: **$0.01**. Ceiling: $0.10.

Check `_treg.ignored_filters` in each answer. If `country` is listed there, the results are not Greek results: say so in the research.

## Q3. Competitor traffic and authority

Traffic. Tool: `dataforseo.x.dataforseo-labs-google-bulk-traffic-estimation-live`. Price: **$0.0124 per call**, all 5 domains in one call. Not test-called.

All countries:

```bash
treg call dataforseo.x.dataforseo-labs-google-bulk-traffic-estimation-live --method POST --data '[{"targets":["myhealth.gov.gr","doctolib.com","eka.care","glass.health","openevidence.com"],"item_types":["organic","paid"]}]' > q3-traffic-all.json
```

Greece only:

```bash
treg call dataforseo.x.dataforseo-labs-google-bulk-traffic-estimation-live --method POST --data '[{"targets":["myhealth.gov.gr","doctolib.com","eka.care","glass.health","openevidence.com"],"location_code":2300,"language_code":"el","item_types":["organic","paid"]}]' > q3-traffic-gr.json
```

Authority. Tool: `treg.web.url.metrics` (routed; SE Ranking first at **$0.00268 per domain**). One call per domain, 5 calls. Not test-called.

```bash
for d in myhealth.gov.gr doctolib.com eka.care glass.health openevidence.com; do
  treg call treg.web.url.metrics --method POST --header 'X-Treg-Route-Max-Cost: 0.01' --data "{\"target\":\"$d\"}" > "q3-auth-$d.json"
done
```

Expected cost: **$0.04** ($0.025 traffic + $0.0134 authority). Ceiling: $0.075.

- The traffic figure is **estimated Google search traffic** (organic and paid), not total visits. Label it that way. Total visits by source exists (`akta.x.website-traffic`) at $0.075 per domain, $0.375 for five: skipped as too expensive for the demo.
- Doctolib's main sites are `doctolib.fr` and `doctolib.de`; `doctolib.com` will look small. Add those two to `targets` in the traffic call at no extra cost.
- If the Greece call fails with a language error, drop `"language_code":"el"` and run again (a failed call is free).

## Q4. Funding and company data

Tool: `aviato.companies.funding_rounds`. Price: **$0.01 per successful call**, one call per company, 4 calls. Not test-called.

```bash
treg call aviato.companies.funding_rounds --query perPage=20 --query page=0 --query website=doctolib.fr > q4-doctolib.json
treg call aviato.companies.funding_rounds --query perPage=20 --query page=0 --query website=eka.care > q4-eka.json
treg call aviato.companies.funding_rounds --query perPage=20 --query page=0 --query website=glass.health > q4-glass.json
treg call aviato.companies.funding_rounds --query perPage=20 --query page=0 --query website=openevidence.com > q4-openevidence.json
```

Expected cost: **$0.04**.

- Use the company-level fields only: round name, stage, date, amount, valuation, investor firms. The answer also lists individual investors; do not copy personal profiles into the research.
- If a company is not found (free), fall back to `treg call crawl4ai.crunchbase.company.profile --method POST --data '{"company":"doctolib"}'` ($0.00015). It gives investors and round names but **no amounts or dates**.
- Cross-check any amount that goes into the deck against one public news source.

## Q5. Doctors on paper exams and duplicate tests

**No tool fits exactly.** treg has no search of Greek medical forums or Facebook groups. The nearest are open-web search and Reddit search; treat what they return as anecdotes, not a measurement.

Web. Tool: `treg.web.search` (routed, 20 providers). Price: **$0 to $0.007 per hit** for the providers that normally answer. `contents: true` returns the matching passages. Not test-called.

```bash
treg call treg.web.search --method POST --header 'X-Treg-Route-Max-Cost: 0.01' --data '{"q":"γιατροί ασθενείς φέρνουν εξετάσεις σε χαρτί επανάληψη εξετάσεων","limit":10,"contents":true}' > q5-web-1.json
treg call treg.web.search --method POST --header 'X-Treg-Route-Max-Cost: 0.01' --data '{"q":"περιττές επαναλαμβανόμενες εξετάσεις ασθενείς δεν έχουν τα αποτελέσματα μαζί τους γιατρός","limit":10,"contents":true}' > q5-web-2.json
treg call treg.web.search --method POST --header 'X-Treg-Route-Max-Cost: 0.01' --data '{"q":"doctors frustrated patients bring paper lab results duplicate tests ordered","limit":10,"contents":true}' > q5-web-3.json
treg call treg.web.search --method POST --header 'X-Treg-Route-Max-Cost: 0.01' --data '{"q":"duplicate diagnostic tests missing prior results study Europe percentage","limit":10,"contents":true}' > q5-web-4.json
```

Reddit. Tool: `crawl4ai.reddit.search.posts`. Price: **$0.0009 per successful call** (an empty answer is free). Not test-called.

```bash
treg call crawl4ai.reddit.search.posts --method POST --data '{"query":"patients bring paper lab results repeat tests","subreddit":"medicine","limit":25}' > q5-reddit-1.json
treg call crawl4ai.reddit.search.posts --method POST --data '{"query":"outside records missing had to repeat labs","subreddit":"FamilyMedicine","limit":25}' > q5-reddit-2.json
treg call crawl4ai.reddit.search.posts --method POST --data '{"query":"εξετάσεις χαρτί γιατρός","subreddit":"greece","limit":25}' > q5-reddit-3.json
```

Expected cost: **$0.02**. Ceiling: $0.043.

- Reddit answers carry no scores or comment counts. Quote posts without usernames.
- If the output contains anything about an identifiable patient, leave it out.

## Total

| Question | Tool | Calls | Expected | Ceiling |
|---|---|---|---|---|
| Q1 volume | `dataforseo.google.keywords.volume` | 2 | $0.18 | $0.18 |
| Q2 SERP | `treg.google.serp.organic` | 5 | $0.01 | $0.10 |
| Q3 traffic | `dataforseo.x.dataforseo-labs-google-bulk-traffic-estimation-live` | 2 | $0.025 | $0.025 |
| Q3 authority | `treg.web.url.metrics` | 5 | $0.014 | $0.05 |
| Q4 funding | `aviato.companies.funding_rounds` | 4 | $0.04 | $0.04 |
| Q5 complaints | `treg.web.search` + `crawl4ai.reddit.search.posts` | 7 | $0.02 | $0.043 |
| **Total** | | **25** | **$0.29** | **$0.44** |

Balance $0.99055. About $0.55 is left after the ceiling, enough for one more EU country in Q1 ($0.09) and reruns.

## Skipped (lean demo)

- Per-country EU volumes (27 calls, $2.43).
- Total-visits traffic with sources ($0.375).
- A treg MCP connection: the CLI is enough, and no settings were changed.
- A dedicated agent token for Anna: she runs under the founder's sign-in.
- Test calls for Q2 to Q5: the two allowed tests went to Q1, the one question where the cheap tools turned out not to work.
