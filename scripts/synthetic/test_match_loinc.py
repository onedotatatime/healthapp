"""Checks of match_loinc.py against supabase/sql/020_lab_loinc.sql (MIN-4689; rule amended on MIN-4690 §3).
Usage: python3 test_match_loinc.py [--parity]   (exit 1 on any failure). Synthetic data only.
--parity also prints the md5 of marker_of over every (020 code + one unlisted code) x (no marker + each LAB_DEFS
marker), in the form the SQL twin in the --parity block computes from 020's match_marker(null, key, code)."""
import hashlib, json, os, re, sys

import match
from match import LAB_DEFS
from match_loinc import LOINC, features, marker_of
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
src = open(SQL, encoding="utf-8").read()
rows = ROW.findall(src)
n_decl = int(re.search(r"if n <> (\d+) or fp", src).group(1))
check("every seed row of 020 was read (%d rows, 020 says %d)" % (len(rows), n_decl), len(rows) == n_decl and 60 <= len(rows) <= 100)

marker_of_key = {k: m for m, k in ANALYTE_KEY.items()}
want = {code: (marker_of_key.get(key) if key else None) for code, key in rows}
check("LOINC holds every row of 020 (%d codes), None where the key is not a matching marker" % len(want), LOINC == want)
check("every LAB_DEFS marker has at least one code", {m for m in LOINC.values() if m} == set(LAB_DEFS))
check("every non-None LOINC value is a LAB_DEFS marker", all(m in LAB_DEFS for m in LOINC.values() if m))


def P(*labs):
    return {"labs": list(labs), "imaging": [], "symptoms": [], "specialties": []}


# a code decides only with a key, and only when the row's own marker is absent or the same
check("a coded row with no marker is its code's marker (CRP code -> CRP_high)",
      features(P({"loinc": "1988-5", "value": 40, "date": "2026-05"})) == {"CRP_high"})
check("a coded row whose marker agrees decides (CRP + CRP code -> CRP_high)",
      features(P({"marker": "CRP", "loinc": "1988-5", "value": 40, "date": "2026-05"})) == {"CRP_high"})
check("a coded row whose marker disagrees decides nothing (ESR row, CRP code -> {})",
      features(P({"marker": "ESR", "loinc": "1988-5", "value": 40, "date": "2026-05"})) == frozenset())
check("uric acid printed with the creatinine code decides nothing (MIN-4690 §3)",
      features(P({"marker": "UricAcid", "loinc": "2160-0", "value": 2.1, "date": "2026-05"})) == frozenset())
check("a listed code with no key decides nothing (MCH keyed as haemoglobin -> {})",
      features(P({"marker": "Hemoglobin", "loinc": "785-6", "value": 10, "date": "2026-05"})) == frozenset())
check("a code not in the map keeps the row's marker (-> ESR_high)",
      features(P({"marker": "ESR", "loinc": "99999-9", "value": 40, "date": "2026-05"})) == {"ESR_high"})
check("no code keeps the row's marker (-> ESR_high)",
      features(P({"marker": "ESR", "value": 40, "date": "2026-05"})) == {"ESR_high"})
check("no code and no marker decides nothing",
      features(P({"value": 40, "date": "2026-05"})) == frozenset())
for code, name in (("785-6", "MCH"), ("786-4", "MCHC")):
    p = P({"marker": "Hemoglobin", "loinc": code, "value": 30, "date": "2026-05"},
          {"marker": "Hemoglobin", "loinc": "718-7", "value": 10.5, "date": "2026-01"})
    check("a newer %s row does not hide a coded low Hb (-> Hb_low; MIN-4690 §3)" % name, features(p) == {"Hb_low"})
p = P({"marker": "CRP", "value": 40, "date": "2026-01"}, {"loinc": "1988-5", "value": 2, "date": "2026-05"})
check("latest decides across coded and uncoded rows of one marker (newer coded CRP 2 -> no CRP_high)", features(p) == frozenset())

# the committed synthetic records carry no code: match_loinc.features is match.features on every one of them
cohort = json.load(open(os.path.join(DATA, "cohort.json")))["records"]
check("no synthetic record carries a code", not any("loinc" in l for r in cohort for l in r["labs"]))
check("on the cohort (%d records) match_loinc.features == match.features" % len(cohort),
      all(features(r) == match.features(r) for r in cohort))

if "--parity" in sys.argv:
    # SQL twin (render __SCHEMA__):
    #   select count(*), md5(string_agg(c.loinc || ' ' || coalesce(k.key, '-') || ' ' || coalesce((select d.analyte_key
    #            from __SCHEMA__.match_lab_defs d where d.analyte_key = __SCHEMA__.match_marker(null::text, k.key, c.loinc)), '-'),
    #          '|' order by c.loinc collate "C", k.key collate "C" nulls first))
    # (SQL returns a non-matching key such as glucose, which match_read ignores; Python returns None: both print "-")
    #   from (select loinc from __SCHEMA__.lab_loinc union all select '99999-9') c(loinc)
    #   cross join (select analyte_key from __SCHEMA__.match_lab_defs union all select null) k(key);
    parts = []
    for c in sorted(list(LOINC) + ["99999-9"]):
        for k in [None] + sorted(ANALYTE_KEY.values()):
            m = marker_of({"loinc": c, "marker": marker_of_key[k] if k else None})
            parts.append("%s %s %s" % (c, k or "-", ANALYTE_KEY[m] if m else "-"))
    print("parity rows %d md5 %s" % (len(parts), hashlib.md5("|".join(parts).encode()).hexdigest()))

print("\n%d FAILED" % len(fails) if fails else "\nall passed")
sys.exit(1 if fails else 0)
