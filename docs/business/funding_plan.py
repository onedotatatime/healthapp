"""The plan's revenue line, importable (CTO decision, MIN-4699 comment 8b038e47; MIN-4701).
Code-only move out of funding-model.py: no prints, no sys.argv, no change to any number. The plan's numbers stay the CEO seat's (MIN-4503).
funding-model.py and scripts/synthetic/simulate.py both import this file, so the plan has one definition of its revenue."""

N = 24           # budgeted plan months
H = 48           # horizon simulated
GM = 0.875       # gross margin: EUR5 cost per EUR40 case (the third number)
PRICE_EUR_PER_CASE = 40          # slide 10's conservative price per paid case, in euros
CONSERVATIVE = (26, 180, 560)    # slide 10's conservative yearly totals, EUR thousands
UPSIDE = (258, 1705, 4850)       # slide 10's upside yearly totals, EUR thousands
# Deck A6 line A (paid cases per hospital), conservative, EUR thousands per plan year; the rest of CONSERVATIVE is doctor seats (line B).
# Added for the patient ramp "per_case_only" (Marketing, MIN-4697). Not used by funding-model.py.
CONSERVATIVE_PER_CASE = (20, 120, 320)
# First month of the free pilot: team-and-funding-plan.md section 3, "Months 3 to 8 · Free pilot". Named, not computed: nothing in this plan derives it (revenue() hard-codes paid month 9).
# Read by scripts/synthetic/simulate.py (timeline.plan.pilot_from); funding-model.py does not use it (MIN-4715, CTO decision MIN-4714).
PILOT_FROM = 3


def rng(a, b): return range(a, b+1)


def revenue(y1, y2, y3, h=H):
    """Slide 10's yearly totals as months: paid revenue starts at plan month 9 (after the free pilot),
    climbs in a straight line inside each year, and is held flat after year 3 (no growth assumed).
    h is the last month returned (default H, the plan's own horizon; simulate.py's ten_years block asks for 120, MIN-4748: the same flat hold, further out)."""
    r = {m:0.0 for m in rng(1,h)}
    k = y1/21.0
    for i in rng(1,6): r[8+i] = k*i
    s = r[14]
    for start, tot in ((15,y2),(27,y3)):
        e = s + (tot - 12*s)/6.5
        for i in rng(1,12): r[start-1+i] = s + (e-s)*i/12
        s = r[start+11]
    for m in rng(39,h): r[m] = s
    return r


def per_case_share(m):
    """Share of plan month m's revenue that comes from paid cases (line A) rather than doctor seats (line B).
    Plan year 1 is months 9 to 14 (the free pilot comes first), plan year 2 is months 15 to 26, plan year 3 is months 27 to 38; none before month 9."""
    if m < 9: return 0.0
    y = 0 if m <= 14 else (1 if m <= 26 else 2)
    return CONSERVATIVE_PER_CASE[y] / CONSERVATIVE[y]
