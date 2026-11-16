"""Recruitment rule for the 50,000 seeded synthetic records (MIN-4710, CTO decision on MIN-4706). Synthetic only.

A condition is a list of inclusion criteria over the coded features that match.py derives from lab values:
  eligible = opted in  +  every `must` code  +  at least `min_some` of the `some` codes.
Specialty codes are not criteria. The sentence a person types only supplies a number and a condition id
(parsed in the browser, from the synonyms below, which travel in the file).
Rule of five: 0 to 4 eligible records -> {"shown": False}: no count, no countries (one answer for "none" and "fewer than 5").
This is the reference the browser code (src/features/simulate/recruit.ts) must reproduce.
Not imported by generate.py, match.py or build_run.py, which stay byte-identical (their hashes are embedded elsewhere).
"""
import re

K = 5   # same k as match.py; kept local so this file does not depend on it

# id (= the generator's cluster name), name, synonyms (already normalised), must, some, min_some
_C = [
    ("inflammatory_back_pain", "Inflammatory back pain",
     ["inflammatory back pain", "ankylosing spondylitis", "axial spondyloarthritis", "spondyloarthritis", "axspa"],
     ["low_back_pain"], ["HLA_B27_positive", "img_sacroiliitis", "CRP_high", "ESR_high", "morning_stiffness"], 3),
    ("rheumatoid_arthritis", "Rheumatoid arthritis",
     ["rheumatoid arthritis", "rheumatoid", "ra"],
     ["joint_pain"], ["RF_positive", "anti_CCP_positive", "CRP_high", "morning_stiffness", "hand_swelling"], 3),
    ("hypothyroid", "Hypothyroidism",
     ["hypothyroidism", "hypothyroid", "underactive thyroid"],
     ["TSH_high"], ["fatigue", "cold_intolerance", "weight_gain"], 2),
    ("type2_diabetes_metabolic", "Type 2 diabetes",
     ["type 2 diabetes", "type ii diabetes", "type two diabetes", "t2d", "t2dm", "diabetes"],
     ["HbA1c_high"], ["LDL_high", "polyuria", "fatigue"], 1),
    ("iron_deficiency", "Iron deficiency anaemia",
     ["iron deficiency anaemia", "iron deficiency anemia", "iron deficiency", "anaemia", "anemia"],
     ["Hb_low", "ferritin_low"], [], 0),
    ("lupus_like", "Lupus",
     ["lupus", "sle", "systemic lupus erythematosus"],
     ["ANA_positive"], ["joint_pain", "rash", "fatigue", "WBC_low"], 2),
    ("gout", "Gout",
     ["gout", "hyperuricaemia", "hyperuricemia"],
     ["uric_acid_high"], ["joint_pain", "CRP_high"], 1),
    ("hyperthyroid", "Hyperthyroidism",
     ["hyperthyroidism", "hyperthyroid", "overactive thyroid", "graves"],
     ["TSH_low"], ["palpitations", "heat_intolerance", "weight_loss", "tremor"], 2),
    ("reduced_kidney_function", "Chronic kidney disease",
     ["chronic kidney disease", "kidney disease", "ckd", "reduced kidney function", "renal impairment"],
     ["creatinine_high"], ["leg_oedema", "fatigue"], 1),
    ("low_bone_density", "Osteoporosis",
     ["osteoporosis", "osteopenia", "low bone density"],
     ["img_osteopenia"], ["vitD_low", "bone_pain"], 1),
    ("rare_sarcoid_like", "Sarcoidosis",
     ["sarcoidosis", "sarcoid"],
     ["ACE_high", "img_hilar_lymphadenopathy"], ["cough", "dry_eyes"], 1),
    ("rare_copper_metabolism", "Wilson disease",
     ["wilson disease", "wilsons disease", "copper metabolism"],
     ["ceruloplasmin_low"], ["ALT_high", "tremor"], 1),
    ("rare_myopathy", "Myopathy",
     ["myopathy", "myositis"],
     ["CK_high", "muscle_weakness"], [], 0),
]
CONDITIONS = [{"id": i, "name": n, "synonyms": s, "must": m, "some": o, "min_some": t} for i, n, s, m, o, t in _C]
COMMON = [c["id"] for c in CONDITIONS if not c["id"].startswith("rare_")]   # the ten with precision/recall targets


def normalise(text):
    """The parser's step 1: lower case, apostrophes and punctuation out, spaces collapsed."""
    t = text.lower().replace("'", "").replace("’", "")
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]+", " ", t)).strip()


def eligible_rows(records, cond, cx, opt_in_required=True):
    """File-order indexes of the records that fit the criteria. records: [country, ageBand, optIn, codeIdx[]].
    cx: {code: index}. opt_in_required exists only so a test can prove the opt-in check bites."""
    must = [cx[c] for c in cond["must"]]
    some = {cx[c] for c in cond["some"]}
    need = cond["min_some"]
    out = []
    for i, (_country, _age, opt, idx) in enumerate(records):
        if opt_in_required and not opt:
            continue
        s = set(idx)
        if all(m in s for m in must) and len(s & some) >= need:
            out.append(i)
    return out


def recruit(records, codes, cond, asked=None, k=K):
    """The search. asked None or 0 = no number: every eligible record is selected.
    Fewer than k eligible -> {"shown": False} (no count, no countries).
    Otherwise selected = the first min(asked, eligible) eligible rows in file order (rows are shuffled by the generator,
    so this is a seeded sample); short = asked - eligible when the request is larger than what exists. No padding."""
    cx = {c: i for i, c in enumerate(codes)}
    rows = eligible_rows(records, cond, cx)
    if len(rows) < k:
        return {"shown": False}
    take = rows if not asked else rows[:asked]
    return {"shown": True, "eligible": len(rows), "asked": asked or None, "selected": len(take),
            "short": max(0, asked - len(rows)) if asked else 0,
            "countries": sorted({records[i][0] for i in take})}
