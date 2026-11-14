"""Offline test of the matching logic. Usage: python3 run_test.py <data_dir>   (exit 1 on any failed check)"""
import json, sys, os
from match import find_matches, features, EMPTY, K, LAB_DEFS, IMAGING, SYMPTOMS, SPECIALTIES

d = sys.argv[1]
cohort = json.load(open(os.path.join(d, "cohort.json")))["records"]
P = json.load(open(os.path.join(d, "test-personas.json")))
fails = []
def check(name, cond):
    print(("PASS " if cond else "FAIL ") + name)
    if not cond: fails.append(name)
show = lambda title, obj: print("\n== %s ==\n%s" % (title, json.dumps(obj, indent=1)))

# data checks
check("every cohort row flagged synthetic", all(r["synthetic"] is True and r["label"] == "seeded, synthetic" for r in cohort))
check("ids unique", len({r["id"] for r in cohort}) == len(cohort))
allowed = {"id", "synthetic", "label", "country", "age_band", "sex", "matching_opt_in", "labs", "imaging", "symptoms", "specialties"}
check("rows carry only the allowed fields (no name, no address)", all(set(r) == allowed for r in cohort))
check("dates are month/year only", all(len(l["date"]) == 7 for r in cohort for l in r["labs"]) )
vocab = {c for _m, v in LAB_DEFS.items() for c in v[3:5] if c} | set(IMAGING) | set(SYMPTOMS) | set(SPECIALTIES)
check("derived features stay inside the fixed vocabulary", all(features(r) <= vocab for r in cohort))

# 1. persona -> matches
maria = find_matches(P["maria"], cohort)
show("TEST 1  Maria (opted in) -> matches", {"persona_features": sorted(features(P["maria"])), "answer": maria})
check("Maria gets at least one group", maria["match_count"] > 0 and len(maria["groups"]) >= 1)
check("every group has N >= K", all(g["n"] >= K for g in maria["groups"]))
check("a group exposes only n, pattern, countries, label", all(set(g) == {"n", "pattern", "countries", "label"} for g in maria["groups"]))
check("every group carries the label", all(g["label"] == "seeded, synthetic" for g in maria["groups"]))
check("match_count is the sum of the group sizes", maria["match_count"] == sum(g["n"] for g in maria["groups"]))
flat = json.dumps(maria)
check("answer holds no id, no sex, no age band, no date", not any(x in flat for x in ("syn-", "persona-", "age_band", '"sex"', "2025-", "2026-")))

# 2. rare pattern -> empty (k)
rare = find_matches(P["rare"], cohort)
show("TEST 2  rare pattern (3 seeded rows share it) -> empty", rare)
check("rare pattern returns the empty answer", rare == EMPTY)
rare_k1 = find_matches(P["rare"], cohort, k=1)
check("CONTROL: with k=1 the same persona DOES match, so k is what suppresses", rare_k1["match_count"] > 0)
print("  control (k=1, internal check only): %d record(s) share the rare pattern" % rare_k1["match_count"])
check("CONTROL: those rare groups are all below K", all(g["n"] < K for g in rare_k1["groups"]))

# 3. not opted in -> empty
noopt = find_matches(P["maria_not_opted_in"], cohort)
show("TEST 3  same persona, matching_opt_in = false -> empty", noopt)
check("not opted in returns the empty answer", noopt == EMPTY)
flipped = dict(P["maria_not_opted_in"], matching_opt_in=True)
check("CONTROL: flipping only the opt-in flag brings the matches back", find_matches(flipped, cohort)["match_count"] > 0)

# empty answers are indistinguishable
none = find_matches(P["no_pattern"], cohort)
check("no-match, below-k and not-opted-in answers are byte-identical",
      json.dumps(none, sort_keys=True) == json.dumps(rare, sort_keys=True) == json.dumps(noopt, sort_keys=True))

# opted-out cohort rows never count
cohort_out = [dict(r, matching_opt_in=False) for r in cohort]
check("cohort rows that did not opt in are never matched", find_matches(P["maria"], cohort_out) == EMPTY)

# idempotent / pure
check("same input, same answer", find_matches(P["maria"], cohort) == maria)
print("\n%s" % ("ALL CHECKS PASSED" if not fails else "FAILED: %s" % fails))
sys.exit(1 if fails else 0)
