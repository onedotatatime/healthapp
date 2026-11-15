# Pathien funding model v5 (EUR thousands). Every input is an assumption unless the plan labels it otherwise.
# Run:  python3 docs/business/funding-model.py          -> v5 (the plan's numbers, deck v4.8; cash numbers identical to v4)
#       python3 docs/business/funding-model.py --v3     -> v3 as shipped in deck v4.6, for the before/after check
# v4 changes (CFO, 15 Nov 2026, MIN-4503): one cost method for every hire (variable pay loaded, tools for everyone);
# tranches EUR400k / EUR600k, both committed at signing, the second drawn when the gate holds; cash simulated
# tranche by tranche; break-even = gross profit covers running costs; both cash lows reported; unit economics,
# dilution, trial volume and slide 7's savings formula computed here so every deck number reruns.
# v5 (CFO on the founder's behalf, 15 Nov 2026, founder: "CFO you make the call"): the open money decisions taken.
# D2 convertible loan agreement, tranche-1 cap EUR3.5M pre-money (floor EUR3.0M), tranche 2 at 1.5x (step-up),
# walk away above 25% dilution. Q38 EUR5,000 set-up + EUR1,000 per randomised patient, sponsor or CRO billed only.
# Q39 government revenue not counted until a contract is signed. D3 order unchanged, tranche-2 hires wait for the release.
# D5 no founder salary from this round (full-time cost shown as a contingency). D6/D13 both new seats kept.
# None of these changes a cash line: every cash number is the same as v4.
import sys, math, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from funding_plan import N, H, GM, PRICE_EUR_PER_CASE, CONSERVATIVE, UPSIDE, rng, revenue   # the plan's revenue line lives in funding_plan.py (MIN-4701)
V3 = '--v3' in sys.argv
EMP = 1.2179     # employer social security 21.79% (secondary, PwC)
TOOLS = 0.2      # about EUR200 a month for tools, per person
def loaded(gross, share=1.0):
    """Loaded monthly cost: gross a year (14 salaries) x 1.2179 / 12, times the share of time, plus tools."""
    return gross*EMP/12/1000*share + TOOLS
def loaded_v3(gross, tools=0.2): return gross*EMP/12/1000 + tools   # v3's helper, kept for --v3
ASK = 1000.0
GATE = 9         # the tranche-2 gate fires at the end of month 9
T1 = 300.0 if V3 else 400.0   # tranche 1, drawn after G2, before month 1
T2 = ASK - T1                 # tranche 2, drawn before month GATE+1 (v4: committed at signing, released by the gate)
if V3:
    team = {
     'Engineer (platform and pipeline)':   [(rng(1,H), loaded_v3(50000))],
     'ML engineer':                         [(rng(2,H), loaded_v3(55000))],
     'Business development':                [(rng(2,H), 4.56+0.56)],
     'Marketing':                           [(rng(3,9), loaded_v3(36000,0)*0.5), (rng(10,H), loaded_v3(36000,0.0))],
     'Clinical and regulatory lead (50%)':  [(rng(1,H), loaded_v3(60000,0)*0.5+0.1)],
     'Second engineer (integrations)':      [(rng(13,H), loaded_v3(45000))],
    }
else:
    team = {
     'Engineer (platform and pipeline)':   [(rng(1,H), loaded(50000))],
     'ML engineer':                         [(rng(2,H), loaded(55000))],
     'Business development':                [(rng(2,H), loaded(45000*1.15))],            # EUR45k + 15% variable, both loaded
     'Marketing':                           [(rng(3,9), loaded(36000, 0.5)), (rng(10,H), loaded(36000))],
     'Clinical and regulatory lead (50%)':  [(rng(1,H), loaded(60000, 0.5))],
     'Second engineer (integrations)':      [(rng(13,H), loaded(45000))],
    }
fn = {'Engineer (platform and pipeline)':'Build','ML engineer':'Build','Second engineer (integrations)':'Build',
      'Business development':'Sell','Marketing':'Sell','Clinical and regulatory lead (50%)':'Prove'}
other = {
 # line: (function, {month: amount}); recurring items continue past N where noted
 'Regulatory and legal': ('Prove', {1:10+7.5+3.4+0.5, 2:7.5+3.3+0.5, 3:3.3+12+0.5, 4:2.7+0.5, 5:2.7+0.5, 6:2.6+0.5, **{m:0.5 for m in rng(7,H)}}),
 'Regulatory pathway (QMS, gated)': ('Prove', {m:50/15 for m in rng(10,24)}),
 'Research partner': ('Prove', {2:3.0, **{m:2.0+(0.9 if m<=15 else 0) for m in rng(4,21)}}),
 'Infrastructure and AI': ('Build', {1:2.0, **{m:1.5 for m in rng(2,9)}, **{m:2.0 for m in rng(10,H)}}),
 'Pilots, sales and go-to-market': ('Sell', {m:2.5 for m in rng(1,H)}),
 'Public procurement adviser': ('Sell', {m:1.0 for m in rng(10,24)}),
 'Trials sponsor pilot': ('Sell', {m:25/9 for m in rng(10,18)}),
}
def cost(m, team=team, other=other):
    t = 0; by = {}
    for k, segs in team.items():
        for r, v in segs:
            if m in r: t += v; by[k] = by.get(k,0)+v
    for k,(f,d) in other.items():
        v = d.get(m,0); t += v; by[k] = by.get(k,0)+v
    return t, by
c = lambda m: cost(m)[0]

cons = revenue(*CONSERVATIVE); up = revenue(*UPSIDE)

def path(costf, rev, t1=T1, t2=T2, gate=GATE, shift=0):
    """Month-end cash with tranche 1 drawn before month 1 and tranche 2 before month gate+1."""
    cash = t1; out = []
    for m in rng(1,H):
        if m == gate+1: cash += t2
        r = rev.get(m-shift,0.0) if m-shift >= 1 else 0.0
        cash += r*GM - costf(m)
        out.append((m, cash))
    return out
def summary(costf, rev, label, t1=T1, t2=T2):
    p = dict(path(costf, rev, t1, t2))
    be = next((m for m in rng(1,H) if rev[m]*GM >= costf(m)), None)       # break-even: gross profit covers running costs
    rx = next((m for m in rng(1,H) if rev[m] >= costf(m)), None)          # revenue alone passes running costs (not used on slides)
    pre = min((p[m], m) for m in rng(1,GATE))                              # lowest cash before tranche 2
    post = min((p[m], m) for m in rng(GATE+1,H))                           # lowest cash after tranche 2
    neg = next((m for m in rng(1,H) if p[m] < 0), None)
    rev24 = sum(rev[m] for m in rng(1,N))
    print(f"{label}: revenue in {N}m {rev24:.0f}k | cash m{N} {p[N]:.0f}k | BREAK-EVEN (gross profit >= cost) m{be} "
          f"[revenue >= cost m{rx}] | low before T2 {pre[0]:.0f}k m{pre[1]} | low after T2 {post[0]:.0f}k m{post[1]} | cash<0 m{neg}")
    return dict(be=be, rx=rx, pre=pre, post=post, cash24=p[N], rev24=rev24)
def maxslip(costf, rev, t1=T1, t2=T2):
    d = 0
    while d < 24 and min(v for _, v in path(costf, rev, t1, t2, shift=d)) >= 0: d += 1
    return d-1
def runway_no_revenue(costf, t1=T1, t2=T2):
    cash = t1
    for m in rng(1,H):
        if m == GATE+1: cash += t2
        if cash - costf(m) < 0: return m-1 + cash/costf(m)
        cash -= costf(m)
    return H

tag = "v3 (as shipped, deck v4.6)" if V3 else "v5 (deck v4.8)"
print(f"=== Pathien funding model {tag} ===")
tot = sum(c(m) for m in rng(1,N))
print(f"Spend months 1-{N}: {tot:.1f}k ; buffer {ASK-tot:.1f}k ({(ASK-tot)/ASK*100:.1f}%)")
lines = {}; fsum = {'Sell':0,'Build':0,'Prove':0}
for m in rng(1,N):
    for k,v in cost(m)[1].items(): lines[k] = lines.get(k,0)+v
for k,v in lines.items():
    f = fn.get(k) or other[k][0]; fsum[f] += v
    print(f"  {k:40s} {v:7.1f}k  {f}")
for f,v in fsum.items(): print(f"  {f}: {v:.1f}k {v/ASK*100:.1f}%")
print(f"  Buffer: {ASK-tot:.1f}k {(ASK-tot)/ASK*100:.1f}%  (= {(ASK-tot)/c(25):.1f} months of the steady burn)")
for q in range(8):
    ms = list(rng(3*q+1,3*q+3)); print(f"  Q{q+1} m{ms[0]}-{ms[-1]}: avg burn {sum(c(m) for m in ms)/3:.1f}k/month")
print(f"  average burn months 1-{N}: {tot/N:.1f}k ; m24 {c(24):.1f}k ; m25+ {c(25):.1f}k")
teamtot = 0
for k, segs in team.items():
    tt = sum(v for m in rng(1,N) for r,v in segs if m in r); teamtot += tt
    print(f"  team {k}: monthly {[round(v,2) for r,v in segs]} total {tt:.1f}k")
print(f"  team total {teamtot:.1f}k ({teamtot/ASK*100:.0f}%) ; full team a month (m13) {sum(v for k,segs in team.items() for r,v in segs if 13 in r):.1f}k")

print("--- tranches (tranche by tranche, no revenue counted) ---")
s19 = sum(c(m) for m in rng(1,GATE)); s1024 = sum(c(m) for m in rng(GATE+1,N))
slack = T1 - s19
print(f"  tranche 1 {T1:.0f}k vs months 1-{GATE} {s19:.1f}k: slack {slack:.1f}k = {slack/c(GATE):.1f} months at the month-{GATE} burn ({c(GATE):.1f}k)"
      f" = {slack/c(GATE)*30.4:.0f} days")
print(f"  if tranche 2 never comes and costs stay at month {GATE}'s level: tranche 1 lasts {GATE + slack/c(GATE):.1f} months")
print(f"  tranche 2 {T2:.0f}k vs months {GATE+1}-{N} {s1024:.1f}k: {T2-s1024:+.1f}k (tranche 1's leftover carries over: total buffer {ASK-tot:.1f}k)")
for t1 in (300, 350, 400, 450):
    sl = t1 - s19
    print(f"    sizing check: tranche 1 {t1}k -> slack {sl:.1f}k, {sl/c(GATE):.1f} months, tranche 2 {ASK-t1:.0f}k")
print(f"  months the EUR1M lasts with no revenue at all (tranche 2 drawn at month {GATE+1}): {runway_no_revenue(c):.1f}")

print("--- revenue against cost, both lines, tranche schedule ---")
S_cons = summary(c, cons, f"{tag} conservative")
S_up = summary(c, up, f"{tag} upside")
print(f"  sales can slip, cash never below zero: conservative {maxslip(c, cons)} months, upside {maxslip(c, up)} months")
print(f"  monthly revenue m24: conservative {cons[24]:.1f}k, upside {up[24]:.1f}k ; cost m24 {c(24):.1f}k")
print(f"  upside volume year 3: 15 hospitals x 3,000 cases = {15*3000:,} cases + 2,000 seats, on the same six-person cost base (more people needed, not modelled)")

print("--- unit economics (slide 10's conservative prices) ---")
be_rev = c(25)*12/GM
hosp_rev, cases, price = 40.0, 1000, 40
gp_h = hosp_rev*GM
print(f"  one hospital: {cases:,} cases x EUR{price} = {hosp_rev:.0f}k a year ; gross margin {GM*100:.1f}% ; gross profit {gp_h:.0f}k a year")
print(f"  cost to win one hospital EUR30k-40k -> payback {30/gp_h*12:.0f} to {40/gp_h*12:.0f} months (about 12)")
print(f"  break-even revenue at the steady burn ({c(25):.1f}k a month): {be_rev:.0f}k a year -> {be_rev/hosp_rev:.1f} hospitals"
      f" (so {math.ceil(be_rev/hosp_rev)}; {math.floor(be_rev/hosp_rev)} x 40k = {math.floor(be_rev/hosp_rev)*40:.0f}k is short) or {be_rev/0.6:.0f} doctor seats at EUR600 a year")
for gm in (0.75, 0.50):
    print(f"    at {gm*100:.0f}% margin break-even is {c(25)*12/gm:.0f}k a year")
print(f"  conservative run rate at month 24: {cons[24]:.1f}k a month = {cons[24]*12:.0f}k a year ({cons[24]*12/be_rev*100:.0f}% of break-even)")

print("--- trials (not in slide 10's totals) ---")
fee = 5 + 19*1.0; saving = 5*36
print(f"  fee per trial {fee:.0f}k = {fee/saving*100:.1f}% of the {saving:.0f}k saving ; 5 trials a year = {5*fee:.0f}k")
fee15 = 5 + 19*1.5
print(f"  Q38 (decided: EUR1,000 a randomised patient, sponsor or CRO billed only). Not chosen: EUR1,500 -> {fee15:.1f}k a trial"
      f" = {fee15/saving*100:.1f}% of the saving, sponsor keeps {saving-fee15:.1f}k ; 5 a year = {5*fee15:.1f}k")
tr = dict(cons)
for m in rng(19,24): tr[m] += fee/6
for m in rng(25,36): tr[m] += 5*fee/12
summary(c, tr, f"{tag} conservative + trials (1 trial in m19-24, then 5 a year)")

print("--- slide 7 savings on tests, Greece (EUR millions; our estimate) ---")
spend, lab_img = 19869, 810
cons_s = lab_img*0.25*0.20*0.10
up_v46 = spend*0.025*0.50*0.30
up_v47 = spend*0.025*0.20*0.30
print(f"  conservative {lab_img} x 25% x 20% x 10% = {cons_s:.2f}M")
print(f"  upside v4.6  {spend*0.025:.0f} x 50% x 30% = {up_v46:.1f}M (50% anchored to S17's odds ratio for duplicate imaging only)")
print(f"  upside v4.7  {spend*0.025:.0f} x 20% x 30% = {up_v47:.1f}M (same 20% prevented share as conservative)")

print("--- dilution (D2 decided as CFO, 15 Nov 2026: caps are pre-money, tranche 2 at 1.5x tranche 1's cap) ---")
def dil(cap1, mult):
    s1 = T1/(cap1+T1); s2 = T2/(cap1*mult+T2)
    return s1, s2, s1*(1-s2)+s2
for cap1, name in ((3500, 'target'), (3000, 'floor')):
    s1, s2, tt = dil(cap1, 1.5)
    print(f"  {name}: tranche-1 cap EUR{cap1/1000:.1f}M -> {s1*100:.1f}% ; tranche-2 cap EUR{cap1*1.5/1000:.2f}M -> {s2*100:.1f}% ; total {tt*100:.1f}%"
          f" (founder keeps {100-tt*100:.1f}% before any option pool)")
print(f"  walk-away: above 25% from this round (EUR2.5M with a step-up gives {dil(2500,1.5)[2]*100:.1f}%)")
print("  grid, for reference:")
for cap1 in (2500, 3500):
    s1 = T1/(cap1+T1)
    for mult, name in ((1.5, 'tranche 2 at 1.5x the cap'), (1.0, 'both at one cap')):
        if mult == 1.0: tot_s = ASK/(cap1+ASK)
        else:
            s2 = T2/(cap1*mult+T2); tot_s = s1*(1-s2)+s2
        print(f"  tranche-1 cap EUR{cap1/1000:.1f}M: tranche 1 {s1*100:.1f}% ; {name}: total {tot_s*100:.1f}%")

print("--- D5 contingency (not in the plan): the founder full-time at EUR48k gross from month 10 ---")
fp = loaded(48000)
cf = lambda m: c(m) + (fp if m >= GATE+1 else 0)
tot_f = sum(cf(m) for m in rng(1,N))
print(f"  {fp:.2f}k a month loaded ; months 10-24 {tot_f-tot:.1f}k ; buffer {ASK-tot_f:.1f}k ({(ASK-tot_f)/ASK*100:.1f}%) ;"
      f" steady burn {cf(25):.1f}k -> break-even revenue {cf(25)*12/GM:.0f}k a year")
summary(cf, cons, "  founder full-time, conservative")
print(f"  founder full-time: sales can slip {maxslip(cf, cons)} months")

print("--- the lower-ask alternative (levers), rerun with the same buffer ---")
alt_team = dict(team); alt_team['Second engineer (integrations)'] = [(rng(19,H), team['Second engineer (integrations)'][0][1])]
alt_other = dict(other)
alt_other['Regulatory pathway (QMS, gated)'] = ('Prove', {})
alt_other['Trials sponsor pilot'] = ('Sell', {})
alt_other['Research partner'] = ('Prove', {2:3.0, **{m:2.0+(0.9 if m<=15 else 0) for m in rng(4,15)}})
ca = lambda m: cost(m, alt_team, alt_other)[0]
tot_a = sum(ca(m) for m in rng(1,N)); buf = ASK - tot
ask_a = tot_a + buf
print(f"  levers save {tot-tot_a:.1f}k ; ask with the same {buf:.1f}k buffer: {ask_a:.0f}k")
summary(ca, cons, f"  alternative EUR{ask_a:.0f}k conservative", t1=T1, t2=ask_a-T1)
print(f"  alternative: sales can slip {maxslip(ca, cons, T1, ask_a-T1)} months")

print("--- v2 cost line (EUR600k, all drawn up front) on the same revenue method ---")
def v2c(m):
    if m<=3: return 34.7
    if m<=6: return 28.6
    if m<=9: return 26.4
    if m<=15: return 28.2
    return 25.3
p2 = path(v2c, cons, 600, 0)
be2 = next(m for m in rng(1,H) if cons[m]*GM >= v2c(m))
lo2 = min((v, m) for m, v in p2)
print(f"  v2 conservative: break-even m{be2} ; lowest cash {lo2[0]:.0f}k m{lo2[1]} ; sales can slip {maxslip(v2c, cons, 600, 0)} months ;"
      f" runway no revenue {runway_no_revenue(v2c, 600, 0):.1f} months")
