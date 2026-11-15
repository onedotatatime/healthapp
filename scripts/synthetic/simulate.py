"""Writes simulation.json. Series 1 = the real matching logic on growing cohort samples. Series 2 and 3 = Anna's formula (MIN-4506),
with an assumed effect of a match that rises with the matches made so far (MIN-4605). The euro block turns the cost drop into money (MIN-4607).
The network is SIM_N = 5,000 synthetic records (founder, 2026-11-15: "can we increase the https://healthapp-8ui.pages.dev/simulation to 5000?", MIN-4679), built here
with generate.make_cohort(n=5000, S): the same 5,000 records as data/synthetic/run-5000.json (S = its seeded.rare_sarcoid_like, read from the file, never typed).
It is NOT read from cohort.json: that file stays the 400-record cohort that the DB seed and the matches panel use.
The timeline block (MIN-4696, built under MIN-4701 to the CTO's contract, MIN-4699 comment 8b038e47) puts the same matching on the plan's months 1 to 24.
Founder, 2026-11-15, verbatim: "this diagrams dont seems so optimistic. It was supposed. Have we connected it to patient numbers during time? or connect the timeline
with the money? maybe to have one diagram with all the numbers inside showing how having onboard patients and growing our model and getting everyday more and more
correct diagnoses how the money saved and our income grow". Patients and income come from the funding model's own code (docs/business/funding_plan.py), never typed.
Round 2 (CEO seat, MIN-4698, 2026-11-15): the ramp is per_case_only (doctor-seat fees are income, not patients); the money and the diagnoses on screen are YEARLY figures
at that month's network size, never running totals (patients and records with a match stay running totals); income is shown as the plan's yearly run rate.
Usage: python3 simulate.py <out_dir> [--ramp per_case_only|all_revenue]     (writes <out_dir>/simulation.json; the default is what is committed)"""
import argparse, json, math, os, random, sys, time
from match import find_matches, features, K, MIN_SHARED
from generate import make_cohort, SEED as GEN_SEED
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "docs", "business"))
import funding_plan                     # the plan's revenue line, importable (CTO, MIN-4699)

SEED = 20261114 + 2
STEPS = 12
SIM_N = 5000                # synthetic records at the last step (12 steps, x = round(5000 * i / 12))
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
# Timeline (MIN-4701). The patient ramp is a parameter; the CEO seat decided on MIN-4698 (2026-11-15). The committed file is the default invocation (test_simulate.py check 6).
#   per_case_only : patients = running total of the plan's revenue x its per-case share (deck A6 line A / total, per plan year) / EUR 40 (Marketing, MIN-4697). THE DEFAULT.
#   all_revenue   : patients = running total of the plan's revenue / EUR 40 (counts doctor-seat fees as cases). The CTO's first contract formula; kept for comparison only.
TIMELINE_RAMP = "per_case_only"
TIMELINE_LABEL = "Plan months on synthetic records. A plan and a model, not a measurement"
TIMELINE_PLAN_STATUS = "a plan, not a measurement (CEO seat, MIN-4503)"
# The CEO seat's wording, MIN-4698 decision comment 7b038e47: the modelled drop "is the yearly figure at that month's network size".
TIMELINE_MEASURE_STATUS = ("CEO on the founder's behalf, MIN-4698, 2026-11-15: the modelled drop in cost is the yearly figure at that month's network size, "
                           "a model on synthetic records and a plan, not a measurement")

ap = argparse.ArgumentParser(description="Writes simulation.json")
ap.add_argument("out_dir")
ap.add_argument("--ramp", choices=("per_case_only", "all_revenue"), default=TIMELINE_RAMP, help="how the plan's months become patients (default: %s)" % TIMELINE_RAMP)
args = ap.parse_args()
d = args.out_dir
RUN_5000 = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "data", "synthetic", "run-5000.json")
SARCOID = json.load(open(RUN_5000))["seeded"]["rare_sarcoid_like"]      # the run's S (MIN-4684 c): one set of 5,000 records on every screen
cohort = make_cohort(random.Random(GEN_SEED), SIM_N, SARCOID)[0]
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
# ---- timeline: the same matching on the plan's months 1 to 24 (MIN-4701, CTO contract MIN-4699 comment 8b038e47) ----
# Index i is the end of plan month i + 1. Every measure is a running total and starts at 0. Rounding is half up, never Python's round() on a .5.
def half_up(x):
    return int(math.floor(x + 0.5))


def half_up_dec(x, places):
    return math.floor(x * 10 ** places + 0.5) / 10 ** places


TL_N = funding_plan.N                                              # 24 plan months
PRICE = funding_plan.PRICE_EUR_PER_CASE
cons = funding_plan.revenue(*funding_plan.CONSERVATIVE)            # EUR thousands a month, conservative line
cum_all = cum_case = 0.0
patients, income_eur = [], []
for m in range(1, TL_N + 1):
    cum_all += cons[m]
    cum_case += cons[m] * funding_plan.per_case_share(m)
    income_eur.append(half_up(cum_all * 1000))
    patients.append(half_up((cum_all if args.ramp == "all_revenue" else cum_case) * 1000 / PRICE))
if patients[-1] > len(cohort):
    sys.exit("timeline: %d patients at the last month, more than the %d synthetic records" % (patients[-1], len(cohort)))
t0 = time.time()
tl_counts, tl_rates = [], []
for n in patients:                                                  # the network at month m is order[:n]: same 5,000 records, same shuffle, same loop as the 12 steps
    sample = order[:n]
    pool = [r for r in sample if r["matching_opt_in"]]
    found = sum(1 for r in pool if find_matches(r, sample, feats=feats)["match_count"] > 0)
    tl_counts.append(found)
    tl_rates.append(found / len(pool) if pool else 0.0)
tl_seconds = time.time() - t0
C = founds[-1]                                                      # the 12-step run's last count, computed in this run, never typed
tl_effects = [EFFECT_START + (EFFECT_CEILING - EFFECT_START) * (f / C if C else 0.0) for f in tl_counts]
tl_drop_pts = [round(BASE_COST_PCT - round(BASE_COST_PCT * (1 - e * r), 2), 2) for e, r in zip(tl_effects, tl_rates)]   # the published 2-decimal cost, as the euro block does
MATCH_DEF = "opted-in records in the sample with at least one match (k = %d, at least %d shared codes)" % (K, MIN_SHARED)
if args.ramp == "all_revenue":
    ramp_text = ("patients[m] = half-up(sum of the plan's revenue in months 1 to m, in euros / %d); one paid case is one new patient; "
                 "doctor-seat fees are counted as cases (an assumption)" % PRICE)
else:
    ramp_text = ("patients[m] = half-up(sum over months 1 to m of the plan's revenue x its per-case share, in euros / %d); the share is %s for months 9 to 14 "
                 "and %s for months 15 to 26 (deck A6 line A over the plan year's total); one paid case is one new patient; doctor-seat fees are income, not patients (an assumption)"
                 % (PRICE, "/".join(str(v) for v in (funding_plan.CONSERVATIVE_PER_CASE[0], funding_plan.CONSERVATIVE[0])),
                    "/".join(str(v) for v in (funding_plan.CONSERVATIVE_PER_CASE[1], funding_plan.CONSERVATIVE[1]))))
timeline = {
    "label": TIMELINE_LABEL,
    "x": {"unit": "plan month", "values": list(range(1, TL_N + 1))},
    "plan": {"name": "Pathien funding model v5, conservative line", "module": "docs/business/funding_plan.py",
             "yearly_k_eur": list(funding_plan.CONSERVATIVE), "price_eur_per_case": PRICE, "status": TIMELINE_PLAN_STATUS,
             "pilot_from": funding_plan.PILOT_FROM},
    "patients": {"unit": "patients in the network, running total", "ramp": args.ramp, "formula": ramp_text, "values": patients},
    "income_eur": {"unit": "EUR, running total, plan",
                   "formula": "income[m] = half-up(sum of the plan's revenue in months 1 to m, in euros); the plan's conservative line (EUR %dk, %dk, %dk a plan year)" % funding_plan.CONSERVATIVE,
                   "values": income_eur},
    "matches": {"definition": MATCH_DEF, "network": patients, "count": tl_counts},
    "effect": [half_up_dec(e, 3) for e in tl_effects],
}
if args.ramp == "per_case_only":
    timeline["patients"]["per_case_k_eur"] = list(funding_plan.CONSERVATIVE_PER_CASE)
# Yearly figures at that month's network size (CEO seat, MIN-4698). Nothing below accumulates over months. Each is built from the published 2-decimal drop, as the euro block is.
tl_dx_pts = [round(BASE_WRONG_PER_100 - round(BASE_WRONG_PER_100 * (1 - e * r), 2), 2) for e, r in zip(tl_effects, tl_rates)]   # fewer wrong or missed diagnoses per 100 visits
diagnoses = [half_up_dec(n * dp / 100, 1) for n, dp in zip(patients, tl_dx_pts)]
drop_eur = [half_up(n * dp / 100 * EU27_HEALTH_SPEND_EUR_HAB) for n, dp in zip(patients, tl_drop_pts)]
income_year_eur = [half_up(cons[m] * 12 * 1000) for m in range(1, TL_N + 1)]      # the plan's yearly run rate: that month's revenue x 12
timeline["income_run_rate_eur"] = {
    "unit": "EUR a year, the plan's run rate at that month", "status": TIMELINE_PLAN_STATUS,
    "formula": "income_run_rate[m] = half-up(the plan's revenue in month m, in euros x 12); the plan's conservative line; a plan, not a measurement",
    "values": income_year_eur}
timeline["diagnoses"] = {
    "unit": "fewer wrong or missed diagnoses a year at that month's network size, in the model", "status": TIMELINE_MEASURE_STATUS,
    "method": "year_at_network_size",
    "assumption": "one visit per patient a year",
    "formula": "diagnoses[m] = half-up to 1 decimal of patients[m] x drop_per_100[m] / 100; drop_per_100 = %d - wrong_or_missed_per_100 (series 2), at 2 decimals, as published; one visit per patient a year (an assumption)" % BASE_WRONG_PER_100,
    "drop_per_100": tl_dx_pts, "values": diagnoses}
timeline["drop_eur"] = {
    "unit": "EUR a year, modelled drop in cost for the patients in the network at that month", "status": TIMELINE_MEASURE_STATUS,
    "method": "year_at_network_size",
    "per_inhabitant_eur": EU27_HEALTH_SPEND_EUR_HAB,
    "formula": "drop_eur[m] = half-up to the euro of patients[m] x drop_pts[m] / 100 x %s (EUR per inhabitant a year, %s %d); drop_pts = %d - cost (series 3), at 2 decimals, as the euro block; a yearly figure, never a running total"
               % (EU27_HEALTH_SPEND_EUR_HAB, SPEND_GEO, SPEND_YEAR, BASE_COST_PCT),
    "drop_pts": tl_drop_pts, "values": drop_eur}

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
                "definition": MATCH_DEF,
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
    "timeline": timeline,
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
print("Timeline (%s ramp, plan months 1 to %d; the %d matching runs took %.1fs):" % (args.ramp, TL_N, TL_N, tl_seconds))
for m in (9, 12, 18, 24):
    print("  month %2d | patients %5d | matches %5d | effect %.3f | drop EUR %6d a year | income EUR %6d a year | fewer diagnoses %.1f a year | (income so far EUR %d)" % (
        m, patients[m - 1], tl_counts[m - 1], timeline["effect"][m - 1], drop_eur[m - 1], income_year_eur[m - 1], diagnoses[m - 1], income_eur[m - 1]))
