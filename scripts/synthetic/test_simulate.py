"""Checks on simulation.json (MIN-4607, contract: MIN-4610 CTO comment 04f2ff86; decision: MIN-4605 CEO seat de26aa96).
Usage: python3 test_simulate.py <data_dir>      (default: ../../data/synthetic). Exit 1 on any failure.
Typed numbers are fine here; under src/ they are not. BASE_REF overrides the git ref the file is compared with (default origin/staging)."""
import json, math, os, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
D = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "..", "data", "synthetic")
BASE_REF = os.environ.get("BASE_REF", "origin/staging")
sim = json.load(open(os.path.join(D, "simulation.json")))
fails = []


def check(name, ok, detail=""):
    print("%s  %s%s" % ("ok  " if ok else "FAIL", name, ("   " + detail) if (detail and not ok) else ""))
    if not ok:
        fails.append(name)


def js_round(x):                      # Math.round: half up
    return math.floor(x + 0.5)


def fmt(mio):                         # the one formatter of the CTO's table (section 2), for the euro drop in EUR million
    if mio == 0:
        return "€0"
    if mio < 1:
        return "€{:,}".format(js_round(mio * 1e6))
    if mio < 1000:
        return "€%d million" % js_round(mio)
    return "€%.1f billion" % (mio / 1000)


N = len(sim["x"]["values"])
s1, s2, s3 = sim["series"]
eu, ma, asum = sim["euro"], sim["matches"], sim["assumption"]

# 1. Identical to the base ref, except what the founder's 2026-11-15 decisions ("lets go to 1200", then "increase ... to 5000", MIN-4679) change: the network size.
#    Changes by decision: cohort_size, x, series 1 values, series 2 and 3 values. Everything else stays. (At 5,000 the first frame is no longer empty,
#    so series 2 and 3 no longer start at their baselines: MIN-4684 a, which supersedes the first-value check of MIN-4610.)
try:
    base = json.loads(subprocess.check_output(["git", "-C", HERE, "show", "%s:data/synthetic/simulation.json" % BASE_REF], stderr=subprocess.STDOUT))
except Exception as e:
    base = None
    check("1 base file readable from %s" % BASE_REF, False, str(getattr(e, "output", e)))
if base is not None:
    top = ["synthetic", "label", "seed", "k", "min_shared", "steps"]
    same = all(json.dumps(sim[k]) == json.dumps(base[k]) for k in top)
    same = same and sim["series"][0]["id"] == base["series"][0]["id"] and sim["series"][0]["key"] == base["series"][0]["key"]
    for i in (1, 2):
        a, b = sim["series"][i], base["series"][i]
        same = same and all(json.dumps(a[k]) == json.dumps(b[k]) for k in ("id", "key", "label", "unit", "baseline", "sources"))
    check("1 identical to %s: top-level keys (not cohort_size, x), series 1 id/key, series 2 and 3 id/key/label/unit/baseline/sources" % BASE_REF, same)
check("1 network: cohort_size 5000, x = round(5000 * i / 12) for i = 1..12, all whole numbers, 12 steps",
      sim["cohort_size"] == 5000 and sim["steps"] == 12 and N == 12
      and sim["x"]["values"] == [js_round(5000 * i / 12) for i in range(1, 13)] and all(type(v) is int for v in sim["x"]["values"])
      and sim["x"]["values"][-1] == 5000)

# 1b. The cohort is the 5,000 records of data/synthetic/run-5000.json (MIN-4684 c): same country, age band, opt-in and codes, record by record.
sys.path.insert(0, HERE)
import random
from generate import make_cohort, SEED as GEN_SEED
from match import features
run = json.load(open(os.path.join(D, "run-5000.json")))
S = run["seeded"]["rare_sarcoid_like"]
coh = make_cohort(random.Random(GEN_SEED), 5000, S)[0]
same_coh = len(coh) == len(run["records"]) == 5000
if same_coh:
    for r, rec in zip(coh, run["records"]):
        if not (rec[0] == r["country"] and run["age_bands"][rec[1]] == r["age_band"] and bool(rec[2]) == bool(r["matching_opt_in"])
                and sorted(run["codes"][j] for j in rec[4]) == sorted(features(r))):
            same_coh = False
            break
check("1b the cohort built with S = run-5000.json seeded.rare_sarcoid_like (%d) equals run-5000.json's 5,000 records (country, age band, opt-in, codes)" % S, same_coh)
check("1b S is read from run-5000.json, not typed in simulate.py",
      "run-5000.json" in open(os.path.join(HERE, "simulate.py")).read() and 'make_cohort(random.Random(GEN_SEED), SIM_N, SARCOID)' in open(os.path.join(HERE, "simulate.py")).read())

# 2. matches and the effect curve. At 5,000 the first frame already has matches (107), so neither starts at zero.
c = ma["count"]
check("2 matches.count: %d whole numbers, non-decreasing" % N,
      len(c) == N and all(type(v) is int for v in c) and all(b >= a for a, b in zip(c, c[1:])) and c[0] > 0)
eff = asum["effect"]
check("2 assumption.effect[k] == round(0.1 + 0.1 * count[k] / count[-1], 3) at all %d steps; last 0.2; start/ceiling/value" % N,
      len(eff) == N and all(eff[k] == round(0.1 + 0.1 * c[k] / c[-1], 3) for k in range(N)) and eff[-1] == 0.2
      and asum["start"] == 0.1 and asum["ceiling"] == 0.2 == asum["value"])

# 3. The cost never rises, the euro drop never falls. If this fails: stop and post on MIN-4605, never tweak a constant.
v3, dm = s3["values"], eu["drop_mio_eur"]
check("3 series 3 non-increasing", all(b <= a for a, b in zip(v3, v3[1:])), str(v3))
check("3 euro.drop_mio_eur non-decreasing", all(b >= a for a, b in zip(dm, dm[1:])), str(dm))

# 4. Condition 6 at every step: the euro shown equals the formula, with the total as printed (EUR 1,834 billion).
bad = [(k, fmt(dm[k]), fmt(eu["drop_pts"][k] / 100 * 1834000)) for k in range(N) if fmt(dm[k]) != fmt(eu["drop_pts"][k] / 100 * 1834000)]
check("4 condition 6, fmt(drop_mio_eur[k]) == fmt(drop_pts[k] / 100 x 1,834,000) at all %d steps" % N, not bad, str(bad))
check("4 drop_pts[k] == round(11 - series3[k], 2) at every step", all(eu["drop_pts"][k] == round(11 - v3[k], 2) for k in range(N)))
check("4 every euro array has %d values, 0 where the match count is 0" % N,
      all(len(eu[k]) == N for k in ("drop_pts", "drop_mio_eur", "drop_eur_per_inhabitant", "loss_mio_eur"))
      and all(dm[k] == 0 and eu["drop_eur_per_inhabitant"][k] == 0 for k in range(N) if c[k] == 0))

# 4b. Condition 6 over every 2-decimal drop 0.00 .. 2.00 (MIN-4610): the euro of a drop, as published, equals the formula at the printed total.
bad = [d for d in range(0, 201) if fmt(round(d / 100 / 100 * 1833973.32, 2)) != fmt(d / 100 / 100 * 1834000)]
check("4b condition 6 over every 2-decimal drop 0.00 .. 2.00 (201 values)", not bad, str(bad[:5]))

# 5. The last row at 5,000 records (CTO scratch run on MIN-4684: 2,071 matches, 4.54, 9.99, 1.01, "€18.5 billion", "€41"; confirmed by this file's own run).
check("5 last step (5,000 records, 2,071 matches): series 2 4.54, series 3 9.99, drop_pts 1.01, '€18.5 billion', '€41'",
      ma["count"][-1] == 2071 and s2["values"][-1] == 4.54 and v3[-1] == 9.99 and eu["drop_pts"][-1] == 1.01 and fmt(dm[-1]) == "€18.5 billion"
      and "€%d" % js_round(eu["drop_eur_per_inhabitant"][-1]) == "€41"
      and eu["total_mio_eur"] == 1833973.32 and eu["total_eur_per_inhabitant"] == 4074.88 and eu["year"] == 2024 and eu["geography"] == "EU-27")

# 5b. The timeline block (MIN-4701, CTO contract MIN-4699 comment 8b038e47): the plan's months 1 to 24 run through the same matching.
#     The plan side (patients and income against funding_plan) is also checked by test_timeline_plan.py, which runs in CI without matching.
tl = sim.get("timeline")
check("5b the timeline block exists", tl is not None)
if tl is not None:
    sys.path.insert(0, os.path.join(HERE, "..", "..", "docs", "business"))
    import funding_plan as fp
    TN = fp.N
    pv, iv, cv, ev = tl["patients"]["values"], tl["income_eur"]["values"], tl["matches"]["count"], tl["effect"]
    ramp = tl["patients"]["ramp"]
    check("5b one value per plan month (%d) for every measure, x = 1..%d, whole numbers where the contract says whole" % (TN, TN),
          tl["x"]["values"] == list(range(1, TN + 1)) and all(len(a) == TN for a in (pv, iv, cv, ev, tl["matches"]["network"]))
          and all(type(v) is int for v in pv + iv + cv) and all(len(tl[k]["values"]) == TN for k in ("diagnoses", "drop_eur") if k in tl))
    check("5b every total starts at its first plan month's value and never falls (patients, income, matches; diagnoses and drop when present)",
          all(all(b >= a for a, b in zip(v, v[1:])) for v in [pv, iv, cv] + [tl[k]["values"] for k in ("diagnoses", "drop_eur") if k in tl])
          and pv[0] == iv[0] == cv[0] == 0)
    check("5b patients at the last month are not more than cohort_size", pv[-1] <= sim["cohort_size"] and tl["matches"]["network"] == pv)
    check("5b matches.definition is the 12-step run's", tl["matches"]["definition"] == ma["definition"])
    # Income against the plan's own figures, here by the plan module's revenue() (test_timeline_plan.py holds the independent arithmetic).
    cons = fp.revenue(*fp.CONSERVATIVE)
    rev24 = sum(cons[m] for m in range(1, TN + 1))
    year1 = sum(cons[m] for m in range(9, 15))
    check("5b income total equals the plan's 24-month figure (EUR %d) and month 14 equals plan year 1 (EUR %dk)" % (js_round(rev24 * 1000), fp.CONSERVATIVE[0]),
          iv[-1] == js_round(rev24 * 1000) and iv[13] == js_round(year1 * 1000) == fp.CONSERVATIVE[0] * 1000 and iv[7] == 0 and iv[8] > 0)
    # The network at month m is the first patients[m] records of the same shuffle; opted-in records in it bound the matches.
    order = list(coh)
    random.Random(sim["seed"]).shuffle(order)
    opt_prefix = [0]
    for r in order:
        opt_prefix.append(opt_prefix[-1] + (1 if r["matching_opt_in"] else 0))
    pool = [opt_prefix[n] for n in pv]
    check("5b matches[m] <= the opted-in records in the network at month m", all(c <= p for c, p in zip(cv, pool)))
    C = ma["count"][-1]
    check("5b effect[m] == half-up(1000 x (0.1 + 0.1 x count[m] / C)) / 1000 with C = the 12-step run's last count (%d), at all %d months" % (C, TN),
          all(ev[m] == js_round(1000 * (0.1 + 0.1 * cv[m] / C)) / 1000 for m in range(TN)) and ev[0] == 0.1)
    # The last row, from the CTO's scratch run on real matching (MIN-4699: 4,109 patients, 1,693 records with a match, effect 0.182, drop 0.92)
    # and from this generator's own run for the other ramp (2,806, 1,137, 0.155).
    last = {"all_revenue": (4109, 1693, 0.182), "per_case_only": (2806, 1137, 0.155)}[ramp]
    check("5b last row (%s ramp): patients %d, records with a match %d, effect %s" % ((ramp,) + last), (pv[-1], cv[-1], ev[-1]) == last)
    # drop_pts as the euro block publishes it: round(11 - round(11 x (1 - effect x rate), 2), 2), effect unrounded.
    dps = []
    for m in range(TN):
        rate = cv[m] / pool[m] if pool[m] else 0.0
        eff = 0.1 + 0.1 * cv[m] / C
        dps.append(round(11 - round(11 * (1 - eff * rate), 2), 2))
    drop_last = {"all_revenue": 0.92, "per_case_only": 0.77}[ramp]
    check("5b drop_pts at the last month (%s ramp) is %s, and never falls" % (ramp, drop_last), dps[-1] == drop_last and all(b >= a for a, b in zip(dps, dps[1:])), str(dps))
    new = [b - a for a, b in zip([0] + pv, pv)]
    if "diagnoses" in tl:                  # optional: only after the CEO seat approves it (MIN-4698)
        run, exp = 0.0, []
        for m in range(TN):
            rate = cv[m] / pool[m] if pool[m] else 0.0
            run += new[m] * 5 / 100 * (0.1 + 0.1 * cv[m] / C) * rate
            exp.append(math.floor(run * 10 + 0.5) / 10)
        check("5b diagnoses equals new x 5/100 x effect x rate, summed, half-up to 1 decimal", tl["diagnoses"]["values"] == exp and bool(tl["diagnoses"]["status"]), str(exp[-3:]))
    if "drop_eur" in tl:
        method, run, exp = tl["drop_eur"]["method"], 0.0, []
        for m in range(TN):
            run += (pv[m] / 12 if method == "patient_months" else new[m]) * dps[m] / 100 * 4074.88
            exp.append(js_round(run))
        check("5b drop_eur (%s) equals its formula at the published 2-decimal drop, half-up to the euro" % method,
              method in ("patient_months", "case_year") and tl["drop_eur"]["values"] == exp and bool(tl["drop_eur"]["status"]), str(exp[-3:]))

# 6. The file reproduces byte for byte (simulate.py builds its own 5,000-record cohort; run_all.sh does the same on a fresh run).
with tempfile.TemporaryDirectory() as t:
    subprocess.check_call([sys.executable, os.path.join(HERE, "simulate.py"), t], stdout=subprocess.DEVNULL, cwd=HERE)
    check("6 simulate.py reproduces simulation.json byte for byte", open(os.path.join(t, "simulation.json"), "rb").read() == open(os.path.join(D, "simulation.json"), "rb").read())

print("\n%s" % ("ALL CHECKS PASSED" if not fails else "%d FAILED: %s" % (len(fails), "; ".join(fails))))
sys.exit(1 if fails else 0)
