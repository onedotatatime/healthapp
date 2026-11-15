# Pathien funding model v3 (EUR thousands). Run: python3 docs/business/funding-model.py. Every input is an assumption unless the plan labels it otherwise.
import sys
EMP = 1.2179  # employer social security 21.79% (secondary, PwC)
def loaded(gross, tools=0.2): return gross*EMP/12/1000 + tools
N = 24          # budgeted plan months
H = 48          # horizon simulated
ASK = 1000.0
GM = 0.875      # gross margin: EUR5 cost per EUR40 case (the third pilot number)

def rng(a, b): return range(a, b+1)
team = {
 'Engineer (platform and pipeline)':   [(rng(1,H), loaded(50000))],
 'ML engineer':                         [(rng(2,H), loaded(55000))],
 'Business development':                [(rng(2,H), 4.56+0.56)],
 'Marketing':                           [(rng(3,9), loaded(36000,0)*0.5+0.0), (rng(10,H), loaded(36000,0.0))],
 'Clinical and regulatory lead (50%)':  [(rng(1,H), loaded(60000,0)*0.5+0.1)],
 'Second engineer (integrations)':      [(rng(13,H), loaded(45000))],
}
fn = {'Engineer (platform and pipeline)':'Build','ML engineer':'Build','Second engineer (integrations)':'Build',
      'Business development':'Sell','Marketing':'Sell','Clinical and regulatory lead (50%)':'Prove'}
other = {
 # line: (function, {month: amount}) ; recurring items continue past N where noted
 'Regulatory and legal': ('Prove', {1:10+7.5+3.4+0.5, 2:7.5+3.3+0.5, 3:3.3+12+0.5, 4:2.7+0.5, 5:2.7+0.5, 6:2.6+0.5, **{m:0.5 for m in rng(7,H)}}),
 'Regulatory pathway (QMS, gated)': ('Prove', {m:50/15 for m in rng(10,24)}),
 'Research partner': ('Prove', {2:3.0, **{m:2.0+(0.9 if m<=15 else 0) for m in rng(4,21)}}),
 'Infrastructure and AI': ('Build', {1:2.0, **{m:1.5 for m in rng(2,9)}, **{m:2.0 for m in rng(10,H)}}),
 'Pilots, sales and go-to-market': ('Sell', {**{m:2.5 for m in rng(1,H)}, **{m:1.0 for m in []}}),
 'Public procurement adviser': ('Sell', {m:1.0 for m in rng(10,24)}),
 'Trials sponsor pilot': ('Sell', {m:25/9 for m in rng(10,18)}),
}
def cost(m):
    t = 0; by = {}
    for k, segs in team.items():
        for r, v in segs:
            if m in r: t += v; by[k] = by.get(k,0)+v
    for k,(f,d) in other.items():
        v = d.get(m,0); t += v; by[k] = by.get(k,0)+v
    return t, by

def revenue(y1, y2, y3, y4=None):
    r = {m:0.0 for m in rng(1,H)}
    k = y1/21.0
    for i in rng(1,6): r[8+i] = k*i
    s = r[14]
    for start, tot in ((15,y2),(27,y3)):
        e = s + (tot - 12*s)/6.5
        for i in rng(1,12): r[start-1+i] = s + (e-s)*i/12
        s = r[start+11]
    for m in rng(39,H): r[m] = s   # flat after slide 11's year 3 (conservative: no growth assumed)
    return r
cons = revenue(26,180,560); up = revenue(258,1705,4850)

def run(costf, rev, ask, label):
    cash = ask; out=None; cross=None; gpx=None; cum_rev_n=0
    for m in rng(1,H):
        c = costf(m)
        cash += rev[m]*GM - c
        if m<=N: cum_rev_n += rev[m]
        if cross is None and rev[m] >= c: cross = m
        if gpx is None and rev[m]*GM >= c: gpx = m
        if out is None and cash < 0: out = m
        if m==N: cashN = cash
    print(f"{label}: revenue in {N}m {cum_rev_n:.0f}k | cash at m{N} {cashN:.0f}k | revenue>=cost m{cross} | gross profit>=cost m{gpx} | cash<0 m{out}")

c = lambda m: cost(m)[0]
tot = sum(c(m) for m in rng(1,N))
print(f"Spend months 1-{N}: {tot:.1f}k ; buffer {ASK-tot:.1f}k ({(ASK-tot)/ASK*100:.1f}%)")
# by function and line
lines = {}; fsum = {'Sell':0,'Build':0,'Prove':0}
for m in rng(1,N):
    _, by = cost(m)
    for k,v in by.items(): lines[k]=lines.get(k,0)+v
for k,v in lines.items():
    f = fn.get(k) or other[k][0]; fsum[f]+=v
    print(f"  {k:40s} {v:7.1f}k  {f}")
for f,v in fsum.items(): print(f"  {f}: {v:.1f}k {v/ASK*100:.1f}%")
print(f"  Buffer: {ASK-tot:.1f}k {(ASK-tot)/ASK*100:.1f}%")
for q in range(8):
    ms = list(rng(3*q+1,3*q+3)); print(f"  Q{q+1} m{ms[0]}-{ms[-1]}: avg burn {sum(c(m) for m in ms)/3:.1f}k/month")
print(f"  steady burn m24: {c(24):.1f}k ; m25+: {c(25):.1f}k ; months 1-8 spend {sum(c(m) for m in rng(1,8)):.1f}k; months 1-9 {sum(c(m) for m in rng(1,9)):.1f}k")
for k, segs in team.items():
    tt = sum(v for m in rng(1,N) for r,v in segs if m in r)
    print(f"  team {k}: monthly {[round(v,2) for r,v in segs]} total {tt:.1f}k")
print(f"  break-even revenue a year at m25 burn: {c(25)*12/GM:.0f}k")
run(c, cons, ASK, "v3 EUR1M conservative"); run(c, up, ASK, "v3 EUR1M upside")
# v2 cost line on the same revenue method
def v2c(m):
    if m<=3: return 34.7
    if m<=6: return 28.6
    if m<=9: return 26.4
    if m<=15: return 28.2
    return 25.3
N2=N; N=18
run(v2c, cons, 600, "v2 EUR600k conservative"); run(v2c, up, 600, "v2 EUR600k upside")
N=N2
print("cons revenue m9..m40:", [round(cons[m],1) for m in rng(9,40)])
print("cons revenue m14,m18,m24:", round(cons[14],1), round(cons[18],1), round(cons[24],1), "| up m14,m18,m24:", round(up[14],1), round(up[18],1), round(up[24],1))
# trials sensitivity: 1 sponsor trial in m19-24 and 5 trials in months 25-36 at EUR24k (assumption)
tr = dict(cons)
for m in rng(19,24): tr[m] += 24/6
for m in rng(25,36): tr[m] += 5*24/12
run(c, tr, ASK, "v3 cons + trials (1 trial in m19-24, 5 in m25-36)")
def trough(costf, rev, ask, shift=0):
    cash=ask; lo=(ask,0)
    for m in rng(1,H):
        r = rev.get(m-shift,0.0) if m-shift>=1 else 0.0
        cash += r*GM - costf(m)
        if cash<lo[0]: lo=(cash,m)
    return lo
def maxslip(costf, rev, ask):
    d=0
    while d<24 and trough(costf, rev, ask, d)[0] >= 0: d+=1
    return d-1
zero = {m:0.0 for m in rng(1,H)}
def runway0(costf, ask):
    cash=ask
    for m in rng(1,H):
        cash-=costf(m)
        if cash<0: return m-1+ (cash+costf(m))/costf(m)
print("v3 trough cons", [round(x,1) for x in trough(c,cons,ASK)], "max slip months", maxslip(c,cons,ASK), "runway no revenue", round(runway0(c,ASK),1))
print("v2 trough cons", [round(x,1) for x in trough(v2c,cons,600)], "max slip months", maxslip(v2c,cons,600), "runway no revenue", round(runway0(v2c,600),1))
print("v3 tranche1 months1-9", round(sum(c(m) for m in rng(1,9)),1), "months 10-24", round(sum(c(m) for m in rng(10,24)),1))
print("revenue m1-24 cons by year-window: m9-14", round(sum(cons[m] for m in rng(9,14)),1), "m15-24", round(sum(cons[m] for m in rng(15,24)),1))
