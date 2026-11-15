"""Checks of match.py's LOINC map against supabase/sql/020_lab_loinc.sql (MIN-4689). Usage: python3 test_match_loinc.py
Exit 1 on any failure. Synthetic data only."""
import json, os, re, sys

from match import LAB_DEFS, LOINC, features, latest_labs
from seed_sql import ANALYTE_KEY

HERE = os.path.dirname(os.path.abspath(__file__))
SQL = os.path.join(HERE, "..", "..", "supabase", "sql", "020_lab_loinc.sql")
DATA = os.path.join(HERE, "..", "..", "data", "synthetic")
fails = []


def check(name, cond):
    print(("ok    " if cond else "FAIL  ") + name)
    if not cond:
        fails.append(name)


TXT = r"'(?:[^']|'')*'"
ROW = re.compile(r"^  \('([0-9]{1,7}-[0-9])', " + TXT + ", (?:" + TXT + "|null), (?:" + TXT + r"|null), (?:'([a-z0-9_]+)'|null), '[0-9.]+'\)", re.M)
rows = ROW.findall(open(SQL, encoding="utf-8").read())
n_decl = int(re.search(r"if n <> (\d+) or fp", open(SQL, encoding="utf-8").read()).group(1))
check("every seed row of 020 was read (%d rows, 020 says %d)" % (len(rows), n_decl), len(rows) == n_decl and 60 <= len(rows) <= 100)

marker_of_key = {k: m for m, k in ANALYTE_KEY.items()}
want = {code: marker_of_key[key] for code, key in rows if key in marker_of_key}
check("LOINC equals 020's codes whose key is a LAB_DEFS marker (%d codes)" % len(want), LOINC == want)
check("every LAB_DEFS marker has at least one code", set(LOINC.values()) == set(LAB_DEFS))
check("every LOINC value is a LAB_DEFS marker", all(m in LAB_DEFS for m in LOINC.values()))

# the code decides the marker; no code, or a code that is not in the map, keeps the row's own marker
p = {"labs": [{"marker": "ESR", "loinc": "1988-5", "value": 40, "date": "2026-05"}], "imaging": [], "symptoms": [], "specialties": []}
check("a coded row is its code's marker (ESR row with the CRP code -> CRP_high)", features(p) == {"CRP_high"})
p["labs"][0]["loinc"] = "99999-9"
check("a code not in the map keeps the row's marker (-> ESR_high)", features(p) == {"ESR_high"})
del p["labs"][0]["loinc"]
check("no code keeps the row's marker (-> ESR_high)", features(p) == {"ESR_high"})
p = {"labs": [{"marker": "CRP", "value": 40, "date": "2026-01"}, {"marker": "ESR", "loinc": "1988-5", "value": 2, "date": "2026-05"}],
     "imaging": [], "symptoms": [], "specialties": []}
check("latest decides across coded and uncoded rows of one marker (newer coded CRP 2 -> no CRP_high)",
      features(p) == frozenset() and latest_labs(p)["CRP"]["value"] == 2)

# the committed synthetic records carry no code: what features() reads from them is unchanged by the map
cohort = json.load(open(os.path.join(DATA, "cohort.json")))["records"]
check("no synthetic record carries a code", not any("loinc" in l for r in cohort for l in r["labs"]))

print("\n%d FAILED" % len(fails) if fails else "\nall passed")
sys.exit(1 if fails else 0)
