"""Checks for the recruitment file and its reference rule (MIN-4710). Synthetic data only.
  python3 scripts/synthetic/test_recruit.py
Plain asserts, no framework. Exit code 1 when any check fails. Takes about 15 s: it runs generate.py once into a temp dir
(the real command from the CTO decision) to prove the file holds exactly those records and to read the seeded truth
for precision and recall. Nothing is left in the repo.
"""
import json, os, subprocess, sys, tempfile, traceback

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build_recruit as B
import recruit as R
from match import features, K

FILE = B.DEFAULT_OUT
PRECISION, RECALL = 0.95, 0.85
RESULTS = []


def check(fn):
    try:
        fn()
        RESULTS.append((fn.__name__, True, ""))
        print("PASS", fn.__name__)
    except Exception as e:   # noqa: BLE001  the harness reports every failure, then exits 1
        RESULTS.append((fn.__name__, False, str(e) or traceback.format_exc()))
        print("FAIL", fn.__name__, "->", str(e) or traceback.format_exc())


with open(FILE, "rb") as f:
    RAW = f.read()
DATA = json.loads(RAW)
RECORDS, CODES = DATA["records"], DATA["codes"]
CX = {c: i for i, c in enumerate(CODES)}
COND = {c["id"]: c for c in DATA["conditions"]}

# One real run of the generator, the command from the CTO decision, in a temp dir.
TMP = tempfile.TemporaryDirectory()
subprocess.run([sys.executable, os.path.join(HERE, "generate.py"), TMP.name, "--n", "50000", "--sarcoid", "6"],
               check=True, stdout=subprocess.DEVNULL, cwd=TMP.name)
with open(os.path.join(TMP.name, "cohort.json")) as f:
    COHORT = json.load(f)["records"]
with open(os.path.join(TMP.name, "cohort-truth.json")) as f:
    TRUTH = json.load(f)["truth"]


@check
def second_build_is_byte_identical_to_the_committed_file():
    with tempfile.TemporaryDirectory() as d:
        out = os.path.join(d, "again.json")
        B.build(out)
        with open(out, "rb") as f:
            again = f.read()
    assert again == RAW, "a second build differs from data/synthetic/recruit-50000.json (%d vs %d bytes)" % (len(again), len(RAW))


@check
def file_holds_exactly_the_records_generate_py_makes():
    assert len(COHORT) == len(RECORDS) == DATA["n"] == 50000
    cx = {c: i for i, c in enumerate(sorted(set().union(*(features(r) for r in COHORT))))}
    assert list(cx) == CODES, "code list differs from the generator's"
    for r, row in zip(COHORT, RECORDS):
        want = [r["country"], B.G.AGE_BANDS.index(r["age_band"]), 1 if r["matching_opt_in"] else 0,
                sorted(cx[c] for c in features(r))]
        assert row == want, "row differs from the generator's record %s" % r["id"]
    assert DATA["opted_in"] == sum(r[2] for r in RECORDS)


@check
def file_shape_has_no_group_column_and_nothing_extra():
    assert set(DATA) == {"synthetic", "label", "seed", "n", "k", "opted_in", "codes", "age_bands", "records",
                         "conditions", "expected", "made"}, sorted(DATA)
    assert DATA["synthetic"] is True and DATA["label"] == "Seeded synthetic data. Not real patients."
    assert DATA["seed"] == 20261114 and DATA["k"] == 5
    assert all(len(r) == 4 and isinstance(r[0], str) and r[1] in range(6) and r[2] in (0, 1) and isinstance(r[3], list)
               for r in RECORDS), "a row is not [country, ageBand, optIn, codeIdx[]]"
    assert all(set(c) == {"id", "name", "synonyms", "must", "some", "min_some"} for c in DATA["conditions"])
    ids = {c["id"] for c in DATA["conditions"]}
    assert not any(i in json.dumps(DATA["records"]) for i in ids), "a pattern name leaked into the records"


@check
def made_block_is_honest_and_hashes_match_the_scripts():
    made = DATA["made"]
    assert made["where"] == "development machine"
    assert set(made["script_sha256"]) == set(B.SCRIPTS)
    for name, h in made["script_sha256"].items():
        assert B.sha256(name) == h, "%s changed since the file was built: rebuild it" % name


@check
def conditions_in_file_equal_recruit_py():
    assert DATA["conditions"] == R.CONDITIONS
    assert len(R.CONDITIONS) == 13 and len(R.COMMON) == 10


@check
def expected_equals_a_fresh_recruit_for_all_13():
    assert DATA["expected"] == B.expected_for(RECORDS, CODES)
    for cid, e in DATA["expected"].items():
        r = R.recruit(RECORDS, CODES, COND[cid])
        if e["shown"]:
            assert r["shown"] and r["eligible"] == e["eligible"] and r["countries"] == e["countries"], cid
        else:
            assert r == {"shown": False}, cid


@check
def common_conditions_meet_precision_and_recall():
    seeded = {}
    for pid, name in TRUTH.items():
        seeded.setdefault(name, []).append(pid)
    opted = {r["id"] for r in COHORT if r["matching_opt_in"]}
    lines = []
    for cid in R.COMMON:
        rows = R.eligible_rows(RECORDS, COND[cid], CX)
        ids = {COHORT[i]["id"] for i in rows}
        tp = len(ids & set(seeded[cid]))
        precision = tp / len(ids)
        recall = tp / len(opted & set(seeded[cid]))
        lines.append("%-26s eligible %5d  precision %.3f  recall %.3f" % (cid, len(ids), precision, recall))
        assert precision >= PRECISION, "%s precision %.3f < %.2f" % (cid, precision, PRECISION)
        assert recall >= RECALL, "%s recall %.3f < %.2f" % (cid, recall, RECALL)
    print("   " + "\n   ".join(lines))


@check
def sarcoid_is_shown_copper_and_myopathy_are_empty():
    assert DATA["expected"]["rare_sarcoid_like"]["shown"] is True and DATA["expected"]["rare_sarcoid_like"]["eligible"] >= K
    assert DATA["expected"]["rare_copper_metabolism"] == {"shown": False}
    assert DATA["expected"]["rare_myopathy"] == {"shown": False}
    for cid in ("rare_copper_metabolism", "rare_myopathy"):   # fewer than 5 by their own size, whatever the opt-in
        assert len(R.eligible_rows(RECORDS, COND[cid], CX, opt_in_required=False)) < K, cid


@check
def no_opted_out_record_in_any_result_and_the_check_can_fail():
    for cid, c in COND.items():
        rows = R.eligible_rows(RECORDS, c, CX)
        assert all(RECORDS[i][2] == 1 for i in rows), "%s selects an opted-out record" % cid
    # control: without the opt-in test the same query does return opted-out records, so the assertion above bites
    leaks = [cid for cid, c in COND.items()
             if any(RECORDS[i][2] == 0 for i in R.eligible_rows(RECORDS, c, CX, opt_in_required=False))]
    assert len(leaks) >= 10, "control failed: only %s would leak without the opt-in check" % leaks


@check
def every_criteria_code_exists():
    for c in R.CONDITIONS:
        for code in c["must"] + c["some"]:
            assert code in CX, "%s: unknown code %s" % (c["id"], code)
        assert 0 <= c["min_some"] <= len(c["some"]) and len(set(c["must"] + c["some"])) == len(c["must"] + c["some"]), c["id"]
        assert not any(code.startswith("spec_") for code in c["must"] + c["some"]), "%s uses a specialty code" % c["id"]
        assert c["must"], "%s has no must code" % c["id"]


def _synonym_problems(conditions):
    owner, bad = {}, []
    for c in conditions:
        for s in c["synonyms"]:
            if R.normalise(s) != s:
                bad.append("%s: synonym %r is not normalised" % (c["id"], s))
            if s in owner and owner[s] != c["id"]:
                bad.append("synonym %r belongs to %s and %s" % (s, owner[s], c["id"]))
            owner[s] = c["id"]
        if R.normalise(c["name"]) not in c["synonyms"]:
            bad.append("%s: its own name is not a synonym" % c["id"])
    for s, o in owner.items():   # a synonym that is a whole-word part of another condition's synonym would be ambiguous
        for t, p in owner.items():
            if o != p and (" " + s + " ") in (" " + t + " "):
                bad.append("%r (%s) sits inside %r (%s)" % (s, o, t, p))
    return bad


@check
def no_synonym_belongs_to_two_conditions():
    assert _synonym_problems(R.CONDITIONS) == []
    # control: the detector fires on a duplicate and on a non-normalised synonym
    dup = [dict(c) for c in R.CONDITIONS]
    dup[1] = dict(dup[1], synonyms=dup[1]["synonyms"] + ["gout"])
    dup[2] = dict(dup[2], synonyms=dup[2]["synonyms"] + ["Under-active"])
    assert len(_synonym_problems(dup)) >= 2


@check
def k_rule_asked_and_short_behaviour():
    c = COND["gout"]
    e = DATA["expected"]["gout"]["eligible"]
    rows = R.eligible_rows(RECORDS, c, CX)
    r = R.recruit(RECORDS, CODES, c, asked=100)
    assert r["shown"] and r["selected"] == 100 and r["short"] == 0 and r["eligible"] == e
    assert r["countries"] == sorted({RECORDS[i][0] for i in rows[:100]}), "selection is not the first 100 eligible rows"
    big = R.recruit(RECORDS, CODES, c, asked=e + 50)
    assert big["selected"] == e and big["short"] == 50, big
    for none in (None, 0):
        assert R.recruit(RECORDS, CODES, c, asked=none)["selected"] == e
    # under k: no count, no countries, one answer
    assert R.recruit(RECORDS, CODES, COND["rare_myopathy"], asked=3) == {"shown": False}
    assert R.recruit(RECORDS, CODES, COND["rare_myopathy"]) == {"shown": False}
    five = [[ "GR", 0, 1, [CX["CK_high"], CX["muscle_weakness"]]] for _ in range(K)]
    assert R.recruit(five, CODES, COND["rare_myopathy"])["eligible"] == K
    assert R.recruit(five[:K - 1], CODES, COND["rare_myopathy"]) == {"shown": False}


@check
def hand_built_records_prove_the_criteria_rule():
    mk = lambda opt, *codes: ["GR", 0, opt, sorted(CX[c] for c in codes)]
    c = COND["gout"]   # must uric_acid_high, some joint_pain/CRP_high, min 1
    cases = [(mk(1, "uric_acid_high", "joint_pain"), True), (mk(1, "uric_acid_high"), False),
             (mk(1, "joint_pain", "CRP_high"), False), (mk(0, "uric_acid_high", "CRP_high"), False),
             (mk(1, "uric_acid_high", "CRP_high", "spec_rheumatology"), True)]
    for rec, ok in cases:
        assert bool(R.eligible_rows([rec], c, CX)) is ok, (rec, ok)
    ia = COND["iron_deficiency"]   # two must codes, no some
    assert R.eligible_rows([mk(1, "Hb_low", "ferritin_low")], ia, CX) == [0]
    assert R.eligible_rows([mk(1, "Hb_low")], ia, CX) == []


if __name__ == "__main__":
    TMP.cleanup()
    failed = [n for n, ok, _ in RESULTS if not ok]
    print("\n%d checks, %d failed" % (len(RESULTS), len(failed)))
    sys.exit(1 if failed else 0)
