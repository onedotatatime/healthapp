"""Writes simulation.json. Series 1 = the real matching logic on growing cohort samples. Series 2 and 3 = Anna's formula (MIN-4506).
Usage: python3 simulate.py <data_dir>"""
import json, os, random, sys
from match import find_matches, features, K, MIN_SHARED

SEED = 20261114 + 2
STEPS = 12
ASSUMPTION = 0.20           # ONE constant. Pending CEO approval; the CEO may change it.
BASE_WRONG_PER_100 = 5      # WHO patient safety fact sheet (low end of 5-20%)
BASE_COST_PCT = 11          # OECD Health Working Paper 176 (2025)
PENDING = "pending CEO approval of the 20% assumption"

d = sys.argv[1]
cohort = json.load(open(os.path.join(d, "cohort.json")))["records"]
order = list(cohort)
random.Random(SEED).shuffle(order)           # the network "grows" in this order
feats = {}
xs, rates = [], []
for i in range(1, STEPS + 1):
    n = round(len(order) * i / STEPS)
    sample = order[:n]
    pool = [r for r in sample if r["matching_opt_in"]]
    found = sum(1 for r in pool if find_matches(r, sample, feats=feats)["match_count"] > 0)   # the real matching, record by record
    xs.append(n)
    rates.append(found / len(pool) if pool else 0.0)
sim = {
    "synthetic": True,
    "label": "Simulation on synthetic data. A model, not a measurement",
    "seed": SEED, "cohort_size": len(cohort), "k": K, "min_shared": MIN_SHARED, "steps": STEPS,
    "x": {"label": "Synthetic records in the network", "values": xs},
    "assumption": {"value": ASSUMPTION, "status": PENDING,
                   "text": "We assume that a match lowers the chance of a wrong or missed diagnosis by 20%.",
                   "sourced": False},
    "series": [
        {"id": 1, "key": "match_rate", "label": "Records that find a match", "unit": "% of records",
         "origin": "computed by running the matching logic on cohort samples of growing size",
         "values": [round(100 * r, 1) for r in rates]},
        {"id": 2, "key": "wrong_or_missed_per_100", "label": "Wrong or missed diagnoses", "unit": "per 100 visits",
         "status": PENDING, "baseline": BASE_WRONG_PER_100,
         "formula": "5 x (1 - 0.20 x match_rate)",
         "sources": [{"name": "WHO, Patient safety fact sheet, 11 Sep 2023 (5-20% of physician-patient encounters; low end used)",
                      "url": "https://www.who.int/news-room/fact-sheets/detail/patient-safety"}],
         "values": [round(BASE_WRONG_PER_100 * (1 - ASSUMPTION * r), 2) for r in rates]},
        {"id": 3, "key": "cost_pct_of_health_spend", "label": "Cost of wrong or missed diagnoses", "unit": "% of health spending",
         "status": PENDING, "baseline": BASE_COST_PCT,
         "formula": "11 x (1 - 0.20 x match_rate)",
         "sources": [{"name": "OECD Health Working Paper No. 176, The economics of diagnostic safety, 2025 (about 11% of health spending; an OECD model estimate)",
                      "url": "https://www.oecd.org/content/dam/oecd/en/publications/reports/2025/03/the-economics-of-diagnostic-safety_6e0ed50b/fc61057a-en.pdf"}],
         "values": [round(BASE_COST_PCT * (1 - ASSUMPTION * r), 2) for r in rates]},
    ],
}
open(os.path.join(d, "simulation.json"), "w").write(json.dumps(sim, indent=1) + "\n")
print("Series 1: matches growing as the network grows")
for n, r in zip(xs, rates):
    print("  %4d records | %5.1f%% | %s" % (n, 100 * r, "#" * int(round(50 * r))))
print("Series 2 (wrong/missed per 100 visits): %s -> %s" % (sim["series"][1]["values"][0], sim["series"][1]["values"][-1]))
print("Series 3 (cost, %% of spend):           %s -> %s" % (sim["series"][2]["values"][0], sim["series"][2]["values"][-1]))
