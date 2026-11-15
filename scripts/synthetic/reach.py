"""The `reach` block of simulation.json (MIN-4773, CTO decision MIN-4769 comment 1178f99e): the money a health system loses a year to wrong or missed diagnoses, and how it falls as a
share of that geography's residents is in the network. Imported by simulate.py, which writes it as the file's last key. Additive: no other block changes.
Founder, 2026-11-15, verbatim: "We need to start by showing the money Greek health system is losing and how this is decreased as we do best matches and we decrease the wrong diagnoses",
then "Can we have 3 In greece, in europe, Global?".

The model is a straight line in the share s (0 to 1) because the match rate and its effect are HELD at the 5,000-record values; a line is a consequence of that assumption, not a finding.
All arithmetic here is Decimal and rounds half up. The page computes the same formulas in integers on k = the slider in tenths of a percent (0 to 1000), so a .5 never depends on a float.
Nothing is typed on the page: every figure comes from this block. Pure functions, no matching, no file reads: simulate.py hands in the file's own values."""
from decimal import Decimal, ROUND_HALF_UP, getcontext

getcontext().prec = 60
D = Decimal
SLIDER_STEPS = 1000                                  # 0.1% steps, 0 to 100%: 1,001 positions; the file carries no per-step array
CHECK_SHARES_K = (0, 1, 10, 100, 500, 1000)          # 0, 0.1, 1, 10, 50, 100 %
STATUS = "a model on synthetic records, not a measurement"
METHOD = ("share s = k / 1000 (k = the slider in tenths of a percent, 0 to 1000); integers and half-up rounding: "
          "residents(k) = half-up(population x k / 1000); "
          "drop(k) = half-up(drop_at_100 x k / 1000); loss(k) = loss0 - drop(k); "
          "matched(k) = half-up(residents x matched / records); "
          "fewer_dx(k) = half-up to 1 decimal of residents x drop_per_100 / 100, a year, one visit per person a year. "
          "loss0 = half-up(baseline_pct / 100 x spend_total); drop_at_100 = half-up(drop_pts / 100 x spend_total); spend_total is the one euro base of the geography. "
          "The line is straight because the match rate and its effect are held at the {records}-record values (synthetic); they are not measured at this size. "
          "The plan point is plan.patients as residents, share = patients / population, drop = half-up(drop_at_100 x patients / population).")


def hu(x):
    """half-up to an integer, exact in Decimal"""
    return int(D(x).quantize(D(1), rounding=ROUND_HALF_UP))


def hu1(x):
    """half-up to 1 decimal, as a float for JSON"""
    return float(D(x).quantize(D("0.1"), rounding=ROUND_HALF_UP))


def num(x):
    """a JSON number: an int when whole, else a float"""
    x = D(x)
    return int(x) if x == x.to_integral_value() else float(x)


class Inputs(object):
    """The file's own values, never typed in this module: simulate.py reads them from series 3 (baseline), ten_years.plateau and series 1."""

    def __init__(self, baseline_pct, drop_pts, drop_per_100, matched, records, match_rate_opted_in_pct, effect, plan_patients, plan_month):
        self.baseline_pct = D(str(baseline_pct))
        self.drop_pts = D(str(drop_pts))
        self.drop_per_100 = D(str(drop_per_100))
        self.matched = int(matched)
        self.records = int(records)
        self.match_rate_opted_in_pct = match_rate_opted_in_pct
        self.effect = effect
        self.plan_patients = int(plan_patients)
        self.plan_month = int(plan_month)


def point(inp, geo, k=None, plan=False):
    """One check point. k is the slider in tenths of a percent; plan=True is the plan marker (residents = plan.patients exactly)."""
    pop, L0, D100 = D(geo["population"]), D(geo["loss0_eur"]), D(geo["drop_at_100_eur"])
    if plan:
        residents = inp.plan_patients
        share_pct = (D(100) * inp.plan_patients / pop).quantize(D("1e-12"), rounding=ROUND_HALF_UP)
        drop = hu(D100 * inp.plan_patients / pop)
    else:
        residents = hu(pop * k / SLIDER_STEPS)
        share_pct = D(k) / 10
        drop = hu(D100 * k / SLIDER_STEPS)
    return {"share_pct": num(share_pct), "loss_eur": int(L0) - drop, "drop_eur": drop, "residents": residents,
            "matched": hu(D(residents) * inp.matched / inp.records), "fewer_dx": hu1(D(residents) * inp.drop_per_100 / 100)}


def geography(inp, spec):
    """One geography from its spec (simulate.py: Anna's sources, MIN-4723 comment b08a38aa). spend_total_eur is in euros; population is a whole number."""
    total = D(spec["spend_total_eur"])
    pop = D(spec["population"])
    g = {"id": spec["id"], "name": spec["name"], "year": spec["year"],
         "population": spec["population"], "population_source": spec["population_source"],
         "spend_total_eur": spec["spend_total_eur"], "spend_per_inhabitant_eur": spec["spend_per_inhabitant_eur"],
         "spend_per_inhabitant_gap_pct": float(((D(str(spec["spend_per_inhabitant_eur"])) * pop - total) / total * 100).quantize(D("0.0001"), rounding=ROUND_HALF_UP)),
         "spend_source": spec["spend_source"], "original": spec["original"]}
    g["loss0_eur"] = hu(inp.baseline_pct / 100 * total)
    g["drop_at_100_eur"] = hu(inp.drop_pts / 100 * total)
    g["loss_at_100_eur"] = g["loss0_eur"] - g["drop_at_100_eur"]
    plan_pt = point(inp, g, plan=True)
    g["plan_share_pct"] = plan_pt["share_pct"]
    g["check_points"] = [point(inp, g, k=k) for k in CHECK_SHARES_K] + [plan_pt]
    return g


def verify(inp, geos, euro_drop_mio_eur_last):
    """Fails the build (SystemExit) when a base figure is missing, a measure is not monotonic in the share, or a number breaks the model's own identities."""
    problems = []
    if not geos:
        problems.append("no geography")
    for g in geos:
        n = g["id"]
        before = len(problems)
        for key in ("year", "population", "spend_total_eur", "spend_per_inhabitant_eur"):
            if not isinstance(g.get(key), (int, float)) or g[key] <= 0:
                problems.append("%s: %s is missing or not positive" % (n, key))
        for key in ("population_source", "spend_source"):
            src = g.get(key) or {}
            if not (src.get("name") and src.get("url") and src.get("year")):
                problems.append("%s: %s is missing a name, url or year" % (n, key))
        o = g.get("original") or {}
        if o.get("currency") not in ("EUR", "USD") or not o.get("total") or (o["currency"] == "USD" and not (o.get("fx") or {}).get("usd_per_eur")):
            problems.append("%s: original currency, total or fx is missing" % n)
        if len(problems) > before:
            continue
        L0, D100 = g["loss0_eur"], g["drop_at_100_eur"]
        if abs(D100 * inp.baseline_pct - L0 * inp.drop_pts) > D(3) * (inp.baseline_pct + inp.drop_pts):   # D100 / L0 = drop_pts / baseline_pct, within the euro rounding of each
            problems.append("%s: drop_at_100 / loss0 is not drop_pts / baseline_pct" % n)
        if abs(D(str(g["spend_per_inhabitant_eur"])) * D(g["population"]) - D(g["spend_total_eur"])) / D(g["spend_total_eur"]) >= D("0.01"):
            problems.append("%s: per inhabitant x population is more than 1%% from the total" % n)
        # every one of the 1,001 slider positions, from the same function the check points use
        rows = [point(inp, g, k=k) for k in range(SLIDER_STEPS + 1)]
        for key, falling in (("loss_eur", True), ("drop_eur", False), ("residents", False), ("matched", False), ("fewer_dx", False)):
            seq = [r[key] for r in rows]
            if any((b > a) if falling else (b < a) for a, b in zip(seq, seq[1:])):
                problems.append("%s: %s is not monotonic in the share" % (n, key))
        if rows[0]["loss_eur"] != L0 or rows[-1]["loss_eur"] != g["loss_at_100_eur"] or rows[0]["drop_eur"] != 0 or rows[-1]["drop_eur"] != D100:
            problems.append("%s: the ends of the line are not loss0 and loss_at_100" % n)
        if any(r["loss_eur"] < g["loss_at_100_eur"] or r["drop_eur"] > D100 or r["loss_eur"] + r["drop_eur"] != L0 for r in rows):
            problems.append("%s: a loss below loss_at_100, a drop above drop_at_100, or loss + drop is not loss0" % n)
        if not 0 < g["plan_share_pct"] < 100:
            problems.append("%s: the plan share is not inside 0 to 100" % n)
        if g["id"] == "eu27" and (D(D100) / 1000000).quantize(D("0.01"), rounding=ROUND_HALF_UP) != D(str(euro_drop_mio_eur_last)):
            problems.append("eu27: drop_at_100 is not euro.drop_mio_eur[-1]")
    if problems:
        raise SystemExit("reach: " + "; ".join(problems))


def build(inp, specs, euro_drop_mio_eur_last):
    geos = [geography(inp, s) for s in specs]
    verify(inp, geos, euro_drop_mio_eur_last)
    return {
        "label": "Share of a geography's residents in the network, on synthetic records. A model, not a measurement",
        "status": STATUS,
        "method": METHOD.format(records="{:,}".format(inp.records)),
        "inputs": {"baseline_pct": num(inp.baseline_pct), "drop_pts": num(inp.drop_pts), "drop_per_100": num(inp.drop_per_100), "matched": inp.matched, "records": inp.records,
                   "match_rate_opted_in_pct": inp.match_rate_opted_in_pct, "effect": inp.effect,
                   "from": "series 3 baseline; ten_years.plateau; series 1 last"},
        "slider": {"min_pct": 0, "max_pct": 100, "step_pct": 0.1, "unit": "% of residents in the network"},
        "plan": {"patients": inp.plan_patients, "month": inp.plan_month, "from": "ten_years.patients[%d]" % (inp.plan_month - 1)},
        "geographies": geos,
    }
