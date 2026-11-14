"""Build the browser-ready file of the doctor-simulate page (MIN-4504). Synthetic only.

  python3 build_run.py <cohort_dir> <out.json>     cohort_dir = output of: generate.py <dir> --n 5000 --sarcoid S
  python3 build_run.py --sweep                     find S: start at 6, +1 until the demo patient gets exactly one group of 5 to 9

The file holds the 5,000 records as coded features (no names, country and age band only), the demo patient
(persona-rare), the result of the real matcher (match.py), and the dummy exams of the matched records only.
The page re-runs the matching in the browser; the "result" block is what its test must equal.
"""
import json, os, random, sys
from collections import defaultdict
import generate as G
from match import find_matches, features, K, MIN_SHARED

PAGE_LABEL = "Seeded synthetic data. Not real patients."


def sweep():
    persona = G.make_personas()["rare"]
    s = 6
    while True:
        cohort, _ = G.make_cohort(random.Random(G.SEED), 5000, s)
        r = find_matches(persona, cohort)
        sizes = [g["n"] for g in r["groups"]]
        k1 = find_matches(persona, cohort, k=1)
        print("S=%d  groups shown=%s  match_count=%d  (k=1 control, exact-set groups of: %s)" % (
            s, sizes, r["match_count"], sorted((g["n"] for g in k1["groups"]), reverse=True)))
        if len(sizes) == 1 and 5 <= sizes[0] <= 9:
            print("-> S = %d" % s)
            return s
        s += 1


def build(cohort_dir, out):
    rd = lambda f: json.load(open(os.path.join(cohort_dir, f)))
    cohort = rd("cohort.json")["records"]
    persona = rd("test-personas.json")["rare"]
    truth = rd("cohort-truth.json")
    summary = rd("cohort-seed-summary.json")
    assert persona["id"] == "persona-rare" and len(cohort) == truth["n"] == 5000
    feats = {r["id"]: features(r) for r in cohort}
    pf = features(persona)
    codes = sorted(set().union(*feats.values()) | pf)
    cx = {c: i for i, c in enumerate(codes)}
    names = sorted(set(truth["truth"].values()))
    gx = {g: i for i, g in enumerate(names)}
    rows = [[r["country"], G.AGE_BANDS.index(r["age_band"]), 1 if r["matching_opt_in"] else 0, gx[truth["truth"][r["id"]]],
             sorted(cx[c] for c in feats[r["id"]])] for r in cohort]

    res = find_matches(persona, cohort, feats=feats)
    shown = res["groups"]
    # funnel (what the page animates): opted in -> share >= MIN_SHARED codes -> same exact set -> shown (n >= K)
    opted = [r for r in cohort if r["matching_opt_in"] and r["id"] != persona["id"]]
    by_set = defaultdict(list)
    for r in opted:
        sh = pf & feats[r["id"]]
        if len(sh) >= MIN_SHARED:
            by_set[sh].append(r["id"])
    share_min = sum(len(v) for v in by_set.values())
    exact = max((len(v) for v in by_set.values()), default=0)
    shown_ids = {i for g in shown for i in by_set[frozenset(g["pattern"])]}
    matched = [i for i, r in enumerate(cohort) if r["id"] in shown_ids]
    detail = {str(i): {k: cohort[i][k] for k in ("country", "age_band", "labs", "imaging", "symptoms", "specialties")} for i in matched}

    data = {
        "synthetic": True, "label": PAGE_LABEL, "seed": G.SEED, "n": len(cohort), "k": K, "min_shared": MIN_SHARED,
        "seeded": summary["seeded_patterns"],
        "codes": codes, "age_bands": G.AGE_BANDS, "groups": names,
        "records": rows,
        "persona": {"id": persona["id"], "country": persona["country"], "age_band": persona["age_band"],
                    "codes": sorted(pf), "opt_in": persona["matching_opt_in"]},
        "result": {"match_count": res["match_count"], "groups": shown, "matched": matched,
                   "funnel": {"opted_in": len(opted), "share_min": share_min, "exact": exact, "shown": res["match_count"]}},
        "detail": detail,
        "vm": None,   # filled by run_on_boxd.sh from the wrapper's real timestamps, or left null (local fallback)
    }
    with open(out, "w") as f:
        json.dump(data, f, separators=(",", ":"), sort_keys=True)
        f.write("\n")
    print("wrote %s: %d records, S=%d, shown groups %s, funnel %s" % (
        out, len(rows), summary["seeded_patterns"].get("rare_sarcoid_like", 0), [g["n"] for g in shown], data["result"]["funnel"]))
    assert len(shown) == 1 and 5 <= shown[0]["n"] <= 9, "demo patient must get exactly one group of 5 to 9"


if __name__ == "__main__":
    if sys.argv[1:] == ["--sweep"]:
        sweep()
    else:
        build(sys.argv[1], sys.argv[2])
