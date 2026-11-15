"""Plan-side checks on the timeline block of simulation.json (MIN-4701, CTO decision MIN-4699 comment 8b038e47; round 2: per-case ramp and the yearly income run rate, CEO seat MIN-4698). The ten_years block (MIN-4748, CTO decision MIN-4744) is checked the same way in section 4. No matching, under 1 s.
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

# 4. The ten_years block (MIN-4748, CTO decision MIN-4744 comment fee57739): the plan and the matching held to month 120, for Greece. Plan side only: nothing here runs the matching.
#    Patients, income and the plateau are recomputed from funding_plan and from the file's own 12-step run; months 1 to 24 must equal the timeline block.
ty = sim.get("ten_years")
check("4 the ten_years block is in simulation.json (MIN-4748)", ty is not None)
if ty is not None and tl is not None:
    TY = 120
    cons10 = fp.revenue(*fp.CONSERVATIVE, h=TY)
    check("4 funding_plan.revenue(h=120) is the default revenue() up to month %d, then held flat at month 38 (the plan's rule, no growth)" % fp.H,
          all(cons10[m] == cons[m] for m in range(1, fp.H + 1)) and all(cons10[m] == cons10[38] for m in range(38, TY + 1)) and len(cons10) == TY)
    check("4 x is plan months 1..%d and every monthly array has %d values" % (TY, TY),
          ty["x"]["values"] == list(range(1, TY + 1))
          and all(len(a) == TY for a in (ty["patients"]["values"], ty["matches"]["values"], ty["diagnoses"]["yearly"]["values"], ty["diagnoses"]["total"]["values"], ty["diagnoses"]["drop_per_100"],
                                         ty["saved_eur"]["yearly"]["values"], ty["saved_eur"]["total"]["values"], ty["saved_eur"]["drop_pts"],
                                         ty["income_eur"]["yearly"]["values"], ty["income_eur"]["total"]["values"])))
    # Patients and income, by this file's own arithmetic.
    pv10, mv10 = ty["patients"]["values"], ty["matches"]["values"]
    run_all = run_case = 0.0
    exp_p, exp_it, exp_iy = [], [], []
    for m in range(1, TY + 1):
        run_all += cons10[m]
        if m >= 9:
            year = 0 if m <= 14 else 1 if m <= 26 else 2         # plan year 3's share is kept after month 26
            run_case += cons10[m] * fp.CONSERVATIVE_PER_CASE[year] / fp.CONSERVATIVE[year]
        exp_it.append(half_up(run_all * 1000))
        exp_iy.append(half_up(cons10[m] * 12 * 1000))
        exp_p.append(half_up((run_all if ty["patients"]["ramp"] == "all_revenue" else run_case) * 1000 / fp.PRICE_EUR_PER_CASE))
    check("4 patients.ramp is the timeline's (%s) and patients.kind is plan" % tl["patients"]["ramp"], ty["patients"]["ramp"] == tl["patients"]["ramp"] and ty["patients"]["kind"] == "plan")
    check("4 patients equals the plan's ramp to month 120, running total, half-up, EUR %d a case (plan year 3's per-case share kept past month 26)" % fp.PRICE_EUR_PER_CASE, pv10 == exp_p,
          "json %s... plan %s..." % (pv10[-3:], exp_p[-3:]))
    check("4 income_eur.total is the plan's running total and income_eur.yearly is the plan's revenue in that month x 12, held flat from month 38 (EUR %d a year)" % exp_iy[-1],
          ty["income_eur"]["total"]["values"] == exp_it and ty["income_eur"]["yearly"]["values"] == exp_iy and len(set(exp_iy[37:])) == 1)
    check("4 plan block names the plan, the held rule after year 3 (after_year_3), and is otherwise the timeline's plan",
          all(ty["plan"].get(k) == v for k, v in tl["plan"].items()) and "held flat at month 38" in ty["plan"].get("after_year_3", ""))
    # Months 1 to 24 equal the timeline block (CTO, MIN-4744 section 6).
    K = fp.N
    check("4 months 1 to %d of patients, matches and income (total and yearly) equal the timeline block" % K,
          pv10[:K] == tl["patients"]["values"] and mv10[:K] == tl["matches"]["count"] and ty["income_eur"]["total"]["values"][:K] == tl["income_eur"]["values"]
          and ty["income_eur"]["yearly"]["values"][:K] == tl["income_run_rate_eur"]["values"],
          "patients %s matches %s" % (pv10[:K] == tl["patients"]["values"], mv10[:K] == tl["matches"]["count"]))
    check("4 months 1 to %d of drop_pts, drop_per_100 and diagnoses (yearly) equal the timeline block (same matching, same published 2-decimal drops)" % K,
          ty["saved_eur"]["drop_pts"][:K] == tl["drop_eur"]["drop_pts"] and ty["diagnoses"]["drop_per_100"][:K] == tl["diagnoses"]["drop_per_100"]
          and ty["diagnoses"]["yearly"]["values"][:K] == tl["diagnoses"]["values"])
    # Where the real matching stops and the plateau starts: computed from the records we have, not typed.
    mu = max(m for m in range(1, TY + 1) if pv10[m - 1] <= sim["cohort_size"])
    pl = ty["plateau"]
    check("4 measured_until_month (%d) is the last month the network fits the %d synthetic records, and the plateau starts the month after" % (mu, sim["cohort_size"]),
          ty["measured_until_month"] == mu and pl["from_month"] == mu + 1 and 0 < mu < TY and ty["matches"]["kind_until"] == {"computed": mu, "model": TY}, str((ty["measured_until_month"], pl["from_month"])))
    p_drop5 = round(5 - sim["series"][1]["values"][-1], 2)       # the published 2-decimal drop per 100 visits at the full network (series 2)
    check("4 the plateau is the 12-step run's last step: %d records, %d matched, effect %s, drop_pts %s, drop_per_100 %s, and it says so in words" % (
              sim["cohort_size"], sim["matches"]["count"][-1], sim["assumption"]["effect"][-1], sim["euro"]["drop_pts"][-1], p_drop5),
          pl["records"] == sim["cohort_size"] and pl["matched"] == sim["matches"]["count"][-1] and pl["effect"] == sim["assumption"]["effect"][-1] == sim["assumption"]["ceiling"]
          and pl["drop_pts"] == sim["euro"]["drop_pts"][-1] and pl["drop_per_100"] == p_drop5 and len(pl.get("text", "")) > 40 and "held" in pl["text"],
          str(pl))
    check("4 matches[m] = half-up(patients[m] x matched / records) from the plateau on (a model); before it never more than patients, never falling",
          all(mv10[m - 1] == half_up(pv10[m - 1] * pl["matched"] / pl["records"]) for m in range(mu + 1, TY + 1))
          and all(c <= p for c, p in zip(mv10[:mu], pv10[:mu])) and all(b >= a for a, b in zip(mv10, mv10[1:])), str(mv10[mu - 2:mu + 3]))
    dp10, dx10 = ty["saved_eur"]["drop_pts"], ty["diagnoses"]["drop_per_100"]
    check("4 drop_pts and drop_per_100 are held at the plateau values from month %d on and never above the model's ceiling (11 x 0.2 = 2.2 points, 5 x 0.2 = 1 per 100)" % (mu + 1),
          all(dp10[m - 1] == pl["drop_pts"] and dx10[m - 1] == pl["drop_per_100"] for m in range(mu + 1, TY + 1)) and all(0 <= v <= 2.2 for v in dp10) and all(0 <= v <= 1.0 for v in dx10),
          str((dp10[mu - 2:mu + 2], dx10[mu - 2:mu + 2])))
    # Greece's base: Eurostat hlth_sha11_hf EUR_HAB, EL, 2024 (Marketing, MIN-4723 comment 9e14b7f0). Typed here as an independent anchor, as test_simulate.py types 4074.88.
    sv = ty["saved_eur"]
    src = sv.get("source", {})
    check("4 the Greek base is Eurostat's EUR 1,915.30 per inhabitant (EL, 2024), with name, url, query_url, year and the date it was opened; total EUR 19,869.37 million, population 10,375,764",
          sv["per_inhabitant_eur"] == 1915.30 and src.get("year") == 2024 and all(src.get(k) for k in ("name", "url", "query_url", "opened"))
          and "geo=EL" in src["query_url"] and "hlth_sha11_hf" in src["query_url"] and "EUR_HAB" in src["query_url"] and ty["geography"] == "Greece"
          and sv["total_mio_eur"] == 19869.37 and sv["population"] == 10375764, str((sv.get("per_inhabitant_eur"), src)))
    exp_sy = [half_up(pv10[m] * dp10[m] / 100 * 1915.30) for m in range(TY)]
    exp_dy = [math.floor(pv10[m] * dx10[m] / 100 * 10 + 0.5) / 10 for m in range(TY)]

    def total12(yearly, scale):                    # half-up(sum of the published yearly values to month m / 12), in integers
        out, acc = [], 0
        for v in yearly:
            acc += v
            out.append((2 * acc + 12 * scale) // (24 * scale))
        return out
    check("4 saved_eur.yearly[m] = half-up(patients x drop_pts / 100 x 1915.30) at every month, and it never exceeds the model's ceiling for those patients (2.2 points)",
          sv["yearly"]["values"] == exp_sy and all(y <= half_up(p * 2.2 / 100 * 1915.30) for y, p in zip(sv["yearly"]["values"], pv10)), str(sv["yearly"]["values"][-3:]))
    check("4 diagnoses.yearly[m] = half-up to 1 decimal of patients x drop_per_100 / 100 at every month; one visit per patient a year",
          ty["diagnoses"]["yearly"]["values"] == exp_dy and "one visit per patient a year" in ty["diagnoses"]["assumption"], str(ty["diagnoses"]["yearly"]["values"][-3:]))
    check("4 both bases: saved_eur.total and diagnoses.total are half-up(sum of the published yearly values / 12), running totals since month 1; every total never falls",
          sv["total"]["values"] == total12(exp_sy, 1) and ty["diagnoses"]["total"]["values"] == total12([half_up(v * 10) for v in exp_dy], 10)
          and all(all(b >= a for a, b in zip(v, v[1:])) for v in (sv["total"]["values"], ty["diagnoses"]["total"]["values"], ty["income_eur"]["total"]["values"], pv10)),
          str((sv["total"]["values"][-3:], ty["diagnoses"]["total"]["values"][-3:])))
    lim = half_up(pl["drop_pts"] / 100 * sv["total_mio_eur"] * 1e6)   # the all-Greece limit: drop_pts x Greece's total health spending (CEO seat MIN-4744; CTO review 1a8014d4)
    check("4 no yearly money value exceeds the all-Greece limit (drop_pts x Greece's total spending, EUR %d), and patients never exceed Greece's population (%d)" % (lim, sv["population"]),
          max(sv["yearly"]["values"]) <= lim and max(pv10) <= sv["population"], "max saved %d limit %d max patients %d population %d" % (max(sv["yearly"]["values"]), lim, max(pv10), sv["population"]))
    check("4 every extrapolated value is marked: status on diagnoses, saved_eur and income_eur; the Greek rates caveat; the plateau text",
          all(ty[k].get("status") for k in ("diagnoses", "saved_eur", "income_eur")) and "not Greek rates" in sv["status"] and "plan" in ty["income_eur"]["status"])

print("\n%s" % ("ALL CHECKS PASSED" if not fails else "%d FAILED: %s" % (len(fails), "; ".join(fails))))
sys.exit(1 if fails else 0)
