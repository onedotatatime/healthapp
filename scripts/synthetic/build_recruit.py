"""Build the browser-ready file of the recruitment search (MIN-4710). Synthetic only.

  python3 scripts/synthetic/build_recruit.py [out.json]     default: data/synthetic/recruit-50000.json

Same records as `generate.py <dir> --n 50000 --sarcoid 6` (seed 20261114), made in memory: generate.make_cohort() is the
one generator, nothing is written except the output file. Rows are [country, ageBand, optIn 0|1, codeIdx[]] with NO
seeded-group column (the page must not be able to see which pattern made a row). Deterministic: no clock, no randomness
beyond the seed, so a second build is byte-identical. The file also carries the conditions (with their synonyms) and the
`expected` answer of every condition, which the browser code and its tests must reproduce.
"""
import hashlib, json, os, random, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import generate as G
from match import features, K
import recruit as R

N = 50000
SARCOID = 6
PAGE_LABEL = "Seeded synthetic data. Not real patients."
DEFAULT_OUT = os.path.join(HERE, "..", "..", "data", "synthetic", "recruit-50000.json")
SCRIPTS = ["generate.py", "match.py", "recruit.py", "build_recruit.py"]


def sha256(name):
    with open(os.path.join(HERE, name), "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def make_rows():
    """(codes, rows) from the generator; the same call as generate.py main() with --n 50000 --sarcoid 6."""
    cohort, _truth = G.make_cohort(random.Random(G.SEED), N, SARCOID)
    feats = [features(r) for r in cohort]
    codes = sorted(set().union(*feats))
    cx = {c: i for i, c in enumerate(codes)}
    rows = [[r["country"], G.AGE_BANDS.index(r["age_band"]), 1 if r["matching_opt_in"] else 0, sorted(cx[c] for c in f)]
            for r, f in zip(cohort, feats)]
    return codes, rows


def expected_for(rows, codes):
    out = {}
    for c in R.CONDITIONS:
        r = R.recruit(rows, codes, c)
        out[c["id"]] = {"shown": True, "eligible": r["eligible"], "countries": r["countries"]} if r["shown"] else {"shown": False}
    return out


def build(out=DEFAULT_OUT):
    codes, rows = make_rows()
    data = {
        "synthetic": True, "label": PAGE_LABEL, "seed": G.SEED, "n": len(rows), "k": K,
        "opted_in": sum(r[2] for r in rows),
        "codes": codes, "age_bands": G.AGE_BANDS,
        "records": rows,
        "conditions": R.CONDITIONS,
        "expected": expected_for(rows, codes),
        "made": {"where": "development machine", "script_sha256": {n: sha256(n) for n in SCRIPTS}},
    }
    with open(out, "w") as f:
        json.dump(data, f, separators=(",", ":"), sort_keys=True)
        f.write("\n")
    print("wrote %s: %d records, %d opted in, expected %s" % (
        out, len(rows), data["opted_in"],
        {k: (v["eligible"] if v["shown"] else "empty") for k, v in data["expected"].items()}))


if __name__ == "__main__":
    build(sys.argv[1] if len(sys.argv) > 1 else DEFAULT_OUT)
