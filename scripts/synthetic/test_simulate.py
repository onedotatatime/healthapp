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

# 1. Identical to the base ref, except what the founder's 2026-11-15 decision ("lets go to 1200") changes: the network size.
#    Changes by decision: cohort_size 400 -> 1200, x (100 ... 1200), series 1 values, the last value of series 2 and 3. Everything else stays.
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
        same = same and a["values"][0] == b["values"][0]
    check("1 identical to %s: top-level keys (not cohort_size, x), series 1 id/key, series 2 and 3 id/key/label/unit/baseline/sources and first value" % BASE_REF, same)
check("1 network: cohort_size 1200, x = 100 ... 1200 in 12 steps of 100",
      sim["cohort_size"] == 1200 and sim["x"]["values"] == list(range(100, 1201, 100)) and sim["steps"] == 12)

# 2. matches and the effect curve.
c = ma["count"]
check("2 matches.count: %d integers, non-decreasing, first 0" % N,
      len(c) == N and all(isinstance(v, int) for v in c) and all(b >= a for a, b in zip(c, c[1:])) and c[0] == 0)
eff = asum["effect"]
check("2 assumption.effect: %d values, first 0.1, last 0.2; start/ceiling/value" % N,
      len(eff) == N and eff[0] == 0.1 and eff[-1] == 0.2 and asum["start"] == 0.1 and asum["ceiling"] == 0.2 == asum["value"])

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

# 5. The last row at 1,200 records (the CEO's 400-record row was 4.66, 10.26, 0.74, €13.6 billion, €30).
check("5 last step (1,200 records, 473 matches): series 2 4.56, series 3 10.04, drop_pts 0.96, '€17.6 billion', '€39'",
      ma["count"][-1] == 473 and s2["values"][-1] == 4.56 and v3[-1] == 10.04 and eu["drop_pts"][-1] == 0.96 and fmt(dm[-1]) == "€17.6 billion"
      and "€%d" % js_round(eu["drop_eur_per_inhabitant"][-1]) == "€39"
      and eu["total_mio_eur"] == 1833973.32 and eu["total_eur_per_inhabitant"] == 4074.88 and eu["year"] == 2024 and eu["geography"] == "EU-27")

# 6. The file reproduces byte for byte (simulate.py builds its own 1,200-record cohort; run_all.sh does the same on a fresh run).
with tempfile.TemporaryDirectory() as t:
    subprocess.check_call([sys.executable, os.path.join(HERE, "simulate.py"), t], stdout=subprocess.DEVNULL, cwd=HERE)
    check("6 simulate.py reproduces simulation.json byte for byte", open(os.path.join(t, "simulation.json"), "rb").read() == open(os.path.join(D, "simulation.json"), "rb").read())

print("\n%s" % ("ALL CHECKS PASSED" if not fails else "%d FAILED: %s" % (len(fails), "; ".join(fails))))
sys.exit(1 if fails else 0)
