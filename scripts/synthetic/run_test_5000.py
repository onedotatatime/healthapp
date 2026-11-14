"""Checks of the 5,000-record run behind /doctor/simulate (MIN-4504). Usage: python3 run_test_5000.py <run-5000.json>   (exit 1 on a failed check)
Regenerates the cohort in memory with the recorded seed, n and S, and checks the committed file against it."""
import json, random, sys
import generate as G
from match import find_matches, features, EMPTY, K

f = json.load(open(sys.argv[1]))
fails = []
def check(name, cond):
    print(("PASS " if cond else "FAIL ") + name)
    if not cond: fails.append(name)

S = f["seeded"]["rare_sarcoid_like"]
cohort, _ = G.make_cohort(random.Random(f["seed"]), f["n"], S)
P = G.make_personas()
res = find_matches(P["rare"], cohort)
check("n = 5000, seed 20261114, declared S in 6..9", f["n"] == 5000 == len(cohort) and f["seed"] == G.SEED and 6 <= S <= 9)
check("demo patient (persona-rare) gets exactly one group of 5 to 9", len(res["groups"]) == 1 and 5 <= res["groups"][0]["n"] <= 9)
check("committed result equals the real matcher's answer", f["result"]["groups"] == res["groups"] and f["result"]["match_count"] == res["match_count"])
check("matched rows are the group's records (opted in, exact set)", len(f["result"]["matched"]) == res["match_count"] and
      all(features(cohort[i]) >= set(res["groups"][0]["pattern"]) and cohort[i]["matching_opt_in"] for i in f["result"]["matched"]))
check("detail holds exactly the matched rows, nothing else", sorted(map(int, f["detail"])) == sorted(f["result"]["matched"]))
check("detail rows carry no id, no name, no sex", all(set(d) == {"country", "age_band", "labs", "imaging", "symptoms", "specialties"} for d in f["detail"].values()))
check("records rows: country, age band, opt-in, group, codes only", all(len(r) == 5 for r in f["records"]) and len(f["records"]) == 5000)
rebuilt = [[r["country"], G.AGE_BANDS.index(r["age_band"]), 1 if r["matching_opt_in"] else 0] for r in cohort]
check("committed records equal a fresh regeneration (same script, same seed)", [r[:3] for r in f["records"]] == rebuilt and
      all([f["codes"][i] for i in row[4]] == sorted(features(c)) for row, c in zip(f["records"], cohort)))
m0 = f["result"]["matched"][0]
check("k = 5: with one matched record opted out the group is 4 and the answer is the one empty answer",
      find_matches(P["rare"], [dict(c, matching_opt_in=False) if i == m0 else c for i, c in enumerate(cohort)]) == EMPTY)
others = [G.make_persona(random.Random(1), "persona-x", c, True) for c in
          (["ceruloplasmin_low", "ALT_high", "tremor", "spec_hepatology", "spec_neurology"],
           ["CK_high", "muscle_weakness", "ALT_high", "spec_neurology", "spec_rheumatology"])]
check("the other rare patterns (copper, myopathy) return the empty answer", all(find_matches(p, cohort) == EMPTY for p in others))
check("a not-opted-in copy of the demo patient gets the one empty answer", find_matches(dict(P["rare"], matching_opt_in=False), cohort) == EMPTY)
check("with 400 records (committed cohort) the same patient gets no answer",
      find_matches(P["rare"], json.load(open(sys.argv[1].rsplit("/", 1)[0] + "/cohort.json"))["records"]) == EMPTY)
check("vm block is null or names a deleted boxd machine", f["vm"] is None or (f["vm"]["provider"] == "boxd" and f["vm"]["deleted"] is True))
print("\n%s" % ("ALL CHECKS PASSED" if not fails else "FAILED: %s" % fails))
sys.exit(1 if fails else 0)
