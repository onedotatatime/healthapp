"""Plan-side checks on the timeline block of simulation.json (MIN-4701, CTO decision MIN-4699 comment 8b038e47; round 2: per-case ramp and the yearly income run rate, CEO seat MIN-4698). No matching, under 1 s.
Runs in the PR `static` job: a change to the plan's conservative line (docs/business/funding_plan.py) turns the PR red until simulate.py is rerun.
It recomputes patients, income_eur and income_run_rate_eur from the plan with its own arithmetic (it does not import simulate.py) and compares them with the JSON.
Usage: python3 test_timeline_plan.py [data_dir]    (default: ../../data/synthetic). Exit 1 on any failure."""
import json, math, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
D = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "..", "data", "synthetic")
BIZ = os.path.join(HERE, "..", "..", "docs", "business")
sys.path.insert(0, BIZ)
import funding_plan as fp

fails = []


def check(name, ok, detail=""):
    print("%s  %s%s" % ("ok  " if ok else "FAIL", name, ("   " + detail) if (detail and not ok) else ""))
    if not ok:
        fails.append(name)


def half_up(x):
    return int(math.floor(x + 0.5))


def code_lines(path):                       # executable lines only: a comment or a docstring that names a thing is not the thing
    text = open(path).read()
    text = re.sub(r'""".*?"""', "", text, flags=re.S)
    return [ln.split("#", 1)[0] for ln in text.splitlines()]


# 1. One definition of the plan's revenue. funding-model.py imports it and does not define its own again.
fm = code_lines(os.path.join(BIZ, "funding-model.py"))
check("1 funding-model.py does not define its own revenue()", not any(re.match(r"\s*def\s+revenue\b", ln) for ln in fm))
check("1 funding-model.py imports revenue and the conservative line from funding_plan",
      any(re.search(r"from\s+funding_plan\s+import", ln) and "revenue" in ln and "CONSERVATIVE" in ln for ln in fm))
fpl = code_lines(os.path.join(BIZ, "funding_plan.py"))
check("1 funding_plan.py prints nothing and reads no sys.argv (importable, no side effects)", not any("print(" in ln or "sys.argv" in ln for ln in fpl))

# 2. The plan's own arithmetic: every plan year adds up to its yearly total (EUR thousands), paid revenue starts at month 9.
cons = fp.revenue(*fp.CONSERVATIVE)
y1, y2, y3 = (sum(cons[m] for m in range(a, b + 1)) for a, b in ((9, 14), (15, 26), (27, 38)))
check("2 plan years add up: months 9-14 = %s, 15-26 = %s, 27-38 = %s (EUR k)" % fp.CONSERVATIVE,
      all(abs(v - t) < 1e-6 for v, t in zip((y1, y2, y3), fp.CONSERVATIVE)), str((y1, y2, y3)))
check("2 no revenue before month 9", all(cons[m] == 0 for m in range(1, 9)) and cons[9] > 0)
check("2 per-case lines sit inside the totals (line A < total, same plan years)", all(0 < a < t for a, t in zip(fp.CONSERVATIVE_PER_CASE, fp.CONSERVATIVE)))

# 3. The timeline block against the plan.
sim = json.load(open(os.path.join(D, "simulation.json")))
tl = sim.get("timeline")
check("3 the timeline block is in simulation.json (MIN-4701 round 2; no skip)", tl is not None)
if tl is not None:
    N = fp.N
    ramp = tl["patients"].get("ramp")
    check("3 patients.ramp is per_case_only, the CEO seat's decision (MIN-4698)", ramp == "per_case_only", str(ramp))
    # The expected arrays, by this file's own arithmetic.
    exp_income, exp_patients = [], []
    run_all = run_case = 0.0
    for m in range(1, N + 1):
        run_all += cons[m]
        if m >= 9:                                           # line A's share of the plan year the month sits in
            year = 0 if m <= 14 else 1 if m <= 26 else 2
            run_case += cons[m] * fp.CONSERVATIVE_PER_CASE[year] / fp.CONSERVATIVE[year]
        exp_income.append(half_up(run_all * 1000))
        exp_patients.append(half_up((run_all if ramp == "all_revenue" else run_case) * 1000 / fp.PRICE_EUR_PER_CASE))
    check("3 every array has %d values" % N,
          all(len(a) == N for a in (tl["x"]["values"], tl["patients"]["values"], tl["income_eur"]["values"], tl["matches"]["count"], tl["matches"]["network"], tl["effect"])))
    check("3 x is plan months 1..%d" % N, tl["x"]["values"] == list(range(1, N + 1)))
    check("3 income_eur equals the plan's conservative line, running total, half-up to the euro", tl["income_eur"]["values"] == exp_income,
          "json %s... plan %s..." % (tl["income_eur"]["values"][-3:], exp_income[-3:]))
    check("3 patients equals the plan's ramp (%s), running total, half-up, EUR %d a case" % (ramp, fp.PRICE_EUR_PER_CASE), tl["patients"]["values"] == exp_patients,
          "json %s... plan %s..." % (tl["patients"]["values"][-3:], exp_patients[-3:]))
    ry = tl.get("income_run_rate_eur", {}).get("values")
    check("3 income_run_rate_eur is the plan's revenue in that month x 12, in euros (a yearly figure, MIN-4698); none before the first paid month",
          ry == [half_up(cons[m] * 12 * 1000) for m in range(1, N + 1)] and ry[:8] == [0] * 8 and ry[8] > 0,
          "json %s... plan %s..." % (str(ry)[-40:], [half_up(cons[m] * 12 * 1000) for m in range(N - 2, N + 1)]))
    check("3 the last income is the plan's own 24-month figure x 1000 (EUR 164,352 for 26/180/560)",
          tl["income_eur"]["values"][-1] == half_up(sum(cons[m] for m in range(1, N + 1)) * 1000))
    check("3 income at month 14 is the plan's first year, EUR %dk" % fp.CONSERVATIVE[0], tl["income_eur"]["values"][13] == fp.CONSERVATIVE[0] * 1000)
    first_paid = next(m for m in range(1, N + 1) if tl["patients"]["values"][m - 1] > 0)
    check("3 plan.pilot_from is the plan's PILOT_FROM (%d), the free pilot start (MIN-4715)" % fp.PILOT_FROM, tl["plan"].get("pilot_from") == fp.PILOT_FROM, str(tl["plan"].get("pilot_from")))
    check("3 the first month with patients (%d) comes after pilot_from" % first_paid, isinstance(tl["plan"].get("pilot_from"), int) and first_paid > tl["plan"]["pilot_from"])
    check("3 plan.yearly_k_eur and price_eur_per_case are the plan's", tl["plan"]["yearly_k_eur"] == list(fp.CONSERVATIVE) and tl["plan"]["price_eur_per_case"] == fp.PRICE_EUR_PER_CASE)
    check("3 patients, income and matches never fall; patients and matches start at 0",
          all(all(b >= a for a, b in zip(v, v[1:])) for v in (tl["patients"]["values"], tl["income_eur"]["values"], tl["matches"]["count"]))
          and tl["patients"]["values"][0] == 0 and tl["matches"]["count"][0] == 0)
    check("3 matches.network equals patients; no month has more matches than patients", tl["matches"]["network"] == tl["patients"]["values"]
          and all(c <= p for c, p in zip(tl["matches"]["count"], tl["patients"]["values"])))
    check("3 patients at the last month are not more than cohort_size (%d)" % sim["cohort_size"], tl["patients"]["values"][-1] <= sim["cohort_size"])

print("\n%s" % ("ALL CHECKS PASSED" if not fails else "%d FAILED: %s" % (len(fails), "; ".join(fails))))
sys.exit(1 if fails else 0)
