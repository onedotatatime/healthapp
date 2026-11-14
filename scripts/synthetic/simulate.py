"""Writes simulation.json. Series 1 = the real matching logic on growing cohort samples. Series 2 and 3 = Anna's formula (MIN-4506),
with an assumed effect of a match that rises with the matches made so far (MIN-4605). The euro block turns the cost drop into money (MIN-4607).
Usage: python3 simulate.py <data_dir>"""
import json, os, random, sys
from match import find_matches, features, K, MIN_SHARED

SEED = 20261114 + 2
STEPS = 12
EFFECT_START = 0.10         # assumed effect of the first match (CEO seat, MIN-4605, 2026-11-15)
EFFECT_CEILING = 0.20       # assumed effect once the network is full; the 20% approved on MIN-4506. Also the file's `assumption.value`.
BASE_WRONG_PER_100 = 5      # WHO patient safety fact sheet (low end of 5-20%)
BASE_COST_PCT = 11          # OECD Health Working Paper 176 (2025)
PENDING = "approved by the CEO seat on the founder's behalf, 2026-11-15 (an assumption, not a measurement)"
# Health spending totals (MIN-4604 candidates, MIN-4605 decision). Eurostat hlth_sha11_hf, TOT_HF, EU27_2020, 2024; opened 2026-11-15.
SPEND_YEAR = 2024
SPEND_GEO = "EU-27"
EU27_HEALTH_SPEND_MIO_EUR = 1833973.32    # unit MIO_EUR, exactly as Eurostat returns it
EU27_HEALTH_SPEND_EUR_HAB = 4074.88       # unit EUR_HAB, same dataset
SPEND_SOURCE_NAME = "Eurostat, current health expenditure (hlth_sha11_hf, all financing schemes), EU-27, 2024"
SPEND_SOURCE_URL = "https://ec.europa.eu/eurostat/databrowser/view/hlth_sha11_hf/default/table"
SPEND_QUERY_URL = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/hlth_sha11_hf?format=JSON&unit=MIO_EUR&icha11_hf=TOT_HF&geo=EU27_2020&time=2024"
SPEND_OPENED = "2026-11-15"

d = sys.argv[1]
cohort = json.load(open(os.path.join(d, "cohort.json")))["records"]
order = list(cohort)
random.Random(SEED).shuffle(order)           # the network "grows" in this order
feats = {}
xs, rates, founds = [], [], []
for i in range(1, STEPS + 1):
    n = round(len(order) * i / STEPS)
    sample = order[:n]
    pool = [r for r in sample if r["matching_opt_in"]]
    found = sum(1 for r in pool if find_matches(r, sample, feats=feats)["match_count"] > 0)   # the real matching, record by record
    xs.append(n)
    founds.append(found)
    rates.append(found / len(pool) if pool else 0.0)
# The effect of a match rises in step with the matches made so far (unrounded), from the start to the ceiling.
effects = [EFFECT_START + (EFFECT_CEILING - EFFECT_START) * (f / founds[-1] if founds[-1] else 0.0) for f in founds]
cost = [round(BASE_COST_PCT * (1 - e * r), 2) for e, r in zip(effects, rates)]      # the published, 2-decimal cost
drop_pts = [round(BASE_COST_PCT - c, 2) for c in cost]                              # euro values come from the published cost, never the unrounded one
sim = {
    "synthetic": True,
    "label": "Simulation on synthetic data. A model, not a measurement",
    "seed": SEED, "cohort_size": len(cohort), "k": K, "min_shared": MIN_SHARED, "steps": STEPS,
    "x": {"label": "Synthetic records in the network", "values": xs},
    "assumption": {"value": EFFECT_CEILING, "start": EFFECT_START, "ceiling": EFFECT_CEILING,
                   "effect": [round(e, 3) for e in effects],
                   "status": PENDING,
                   "text": "We assume that each match lowers the chance of a wrong or missed diagnosis by 10%, rising to 20% as matches accumulate.",
                   "sourced": False},
    "matches": {"label": "Records with a match",
                "definition": "opted-in records in the sample with at least one match (k = %d, at least %d shared codes)" % (K, MIN_SHARED),
                "count": founds},
    "series": [
        {"id": 1, "key": "match_rate", "label": "Records that find a match", "unit": "% of records",
         "origin": "computed by running the matching logic on cohort samples of growing size",
         "values": [round(100 * r, 1) for r in rates]},
        {"id": 2, "key": "wrong_or_missed_per_100", "label": "Wrong or missed diagnoses", "unit": "per 100 visits",
         "status": PENDING, "baseline": BASE_WRONG_PER_100,
         "formula": "5 x (1 - effect x match_rate), effect = 0.10 + 0.10 x (matches so far / matches in the full synthetic network)",
         "sources": [{"name": "WHO, Patient safety fact sheet, 11 Sep 2023 (5-20% of physician-patient encounters; low end used)",
                      "url": "https://www.who.int/news-room/fact-sheets/detail/patient-safety"}],
         "values": [round(BASE_WRONG_PER_100 * (1 - e * r), 2) for e, r in zip(effects, rates)]},
        {"id": 3, "key": "cost_pct_of_health_spend", "label": "Cost of wrong or missed diagnoses", "unit": "% of health spending",
         "status": PENDING, "baseline": BASE_COST_PCT,
         "formula": "11 x (1 - effect x match_rate), effect = 0.10 + 0.10 x (matches so far / matches in the full synthetic network)",
         "sources": [{"name": "OECD Health Working Paper No. 176, The economics of diagnostic safety, 2025 (about 11% of health spending; an OECD model estimate)",
                      "url": "https://www.oecd.org/content/dam/oecd/en/publications/reports/2025/03/the-economics-of-diagnostic-safety_6e0ed50b/fc61057a-en.pdf"}],
         "values": cost},
    ],
    "euro": {"currency": "EUR", "geography": SPEND_GEO, "year": SPEND_YEAR,
             "total_mio_eur": EU27_HEALTH_SPEND_MIO_EUR, "total_eur_per_inhabitant": EU27_HEALTH_SPEND_EUR_HAB,
             "drop_pts": drop_pts,
             "drop_mio_eur": [round(d / 100 * EU27_HEALTH_SPEND_MIO_EUR, 2) for d in drop_pts],
             "drop_eur_per_inhabitant": [round(d / 100 * EU27_HEALTH_SPEND_EUR_HAB, 2) for d in drop_pts],
             "loss_mio_eur": [round(c / 100 * EU27_HEALTH_SPEND_MIO_EUR, 2) for c in cost],
             "formula": "drop_pts / 100 x %s EUR million (%s current health expenditure, %d); drop_pts = %d - cost, cost at 2 decimals"
                        % (EU27_HEALTH_SPEND_MIO_EUR, SPEND_GEO, SPEND_YEAR, BASE_COST_PCT),
             "source": {"name": SPEND_SOURCE_NAME, "url": SPEND_SOURCE_URL, "query_url": SPEND_QUERY_URL, "opened": SPEND_OPENED}},
}
open(os.path.join(d, "simulation.json"), "w").write(json.dumps(sim, indent=1) + "\n")
print("Series 1: matches growing as the network grows")
for n, r in zip(xs, rates):
    print("  %4d records | %5.1f%% | %s" % (n, 100 * r, "#" * int(round(50 * r))))
print("Series 2 (wrong/missed per 100 visits): %s -> %s" % (sim["series"][1]["values"][0], sim["series"][1]["values"][-1]))
print("Series 3 (cost, %% of spend):           %s -> %s" % (sim["series"][2]["values"][0], sim["series"][2]["values"][-1]))
print("Matches (records with a match):         %s -> %s" % (sim["matches"]["count"][0], sim["matches"]["count"][-1]))
print("Assumed effect of a match:              %s -> %s" % (sim["assumption"]["effect"][0], sim["assumption"]["effect"][-1]))
print("Euro, drop (EUR million, EU-27 %d):   %s -> %s   | per inhabitant %s -> %s" % (SPEND_YEAR, sim["euro"]["drop_mio_eur"][0], sim["euro"]["drop_mio_eur"][-1],
      sim["euro"]["drop_eur_per_inhabitant"][0], sim["euro"]["drop_eur_per_inhabitant"][-1]))
