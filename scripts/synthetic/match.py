"""Matching logic for the seeded synthetic cohort (MIN-4505, offline part).

Mirrors the future Supabase RPC. Kept as plain set operations so it ports to one SQL function:
  features(patient)  -> rows (patient_id, code)   [a view / CTE over the exam rows]
  shared             -> persona codes ∩ record codes (join on code)
  group              -> GROUP BY array_agg(code ORDER BY code) HAVING count(*) >= K
  opt-in             -> WHERE matching_opt_in (persona and cohort rows), checked in the same query
Synthetic data only. No names, no exact dates and nothing below country leave this function.
"""
from collections import defaultdict

K = 5                 # k-anonymity: a pattern shared by fewer than K cohort rows == "no matches"
MIN_SHARED = 4        # a record matches when it shares at least this many of the persona's codes
LABEL = "seeded, synthetic"
EMPTY = {"match_count": 0, "groups": []}   # the ONE empty answer: no opt-in, no match, count < K

# marker -> (unit, ref_low, ref_high, code_if_above, code_if_below). Qualitative markers: 0 = negative, 1 = positive.
LAB_DEFS = {
    "CRP":        ("mg/L", 0, 5, "CRP_high", None),
    "ESR":        ("mm/h", 0, 20, "ESR_high", None),
    "RF":         ("IU/mL", 0, 14, "RF_positive", None),
    "anti_CCP":   ("U/mL", 0, 20, "anti_CCP_positive", None),
    "ANA":        ("qual", 0, 0, "ANA_positive", None),
    "HLA_B27":    ("qual", 0, 0, "HLA_B27_positive", None),
    "TSH":        ("mIU/L", 0.4, 4.0, "TSH_high", "TSH_low"),
    "HbA1c":      ("%", 4.0, 5.6, "HbA1c_high", None),
    "LDL":        ("mg/dL", 0, 130, "LDL_high", None),
    "Ferritin":   ("ng/mL", 30, 300, None, "ferritin_low"),
    "Hemoglobin": ("g/dL", 12.0, 17.5, None, "Hb_low"),
    "WBC":        ("10^9/L", 4.0, 11.0, "WBC_high", "WBC_low"),
    "VitD":       ("ng/mL", 30, 100, None, "vitD_low"),
    "Creatinine": ("mg/dL", 0.6, 1.3, "creatinine_high", None),
    "UricAcid":   ("mg/dL", 3.5, 7.2, "uric_acid_high", None),
    "ALT":        ("U/L", 7, 40, "ALT_high", None),
    "ACE":        ("U/L", 8, 52, "ACE_high", None),
    "Ceruloplasmin": ("mg/dL", 20, 60, None, "ceruloplasmin_low"),
    "CK":         ("U/L", 30, 200, "CK_high", None),
}
IMAGING = ["img_sacroiliitis", "img_disc_degeneration", "img_joint_effusion", "img_osteopenia",
           "img_hand_erosions", "img_hilar_lymphadenopathy", "img_normal"]
SYMPTOMS = ["morning_stiffness", "low_back_pain", "joint_pain", "fatigue", "weight_loss", "weight_gain",
            "polyuria", "palpitations", "cold_intolerance", "heat_intolerance", "rash", "headache",
            "cough", "dry_eyes", "hand_swelling", "bone_pain", "muscle_weakness", "tremor", "leg_oedema"]
SPECIALTIES = ["spec_orthopaedics", "spec_rheumatology", "spec_gp", "spec_endocrinology", "spec_cardiology",
               "spec_gastroenterology", "spec_nephrology", "spec_pulmonology", "spec_neurology", "spec_hepatology"]
IGNORED = {"img_normal"}   # carries no pattern information


def latest_labs(patient):
    """Latest result per marker (month/year strings sort correctly)."""
    best = {}
    for lab in patient["labs"]:
        if lab["marker"] not in best or lab["date"] > best[lab["marker"]]["date"]:
            best[lab["marker"]] = lab
    return best


def features(patient):
    """Derive the coded features of one patient from raw results. Demographics are never features."""
    out = set()
    for marker, lab in latest_labs(patient).items():
        _, lo, hi, above, below = LAB_DEFS[marker]
        if above and lab["value"] > hi:
            out.add(above)
        if below and lab["value"] < lo:
            out.add(below)
    out.update(f["code"] for f in patient["imaging"])
    out.update(patient["symptoms"])
    out.update(patient["specialties"])
    return frozenset(out - IGNORED)


def find_matches(persona, cohort, k=K, min_shared=MIN_SHARED, feats=None):
    """Returns EMPTY or {"match_count": n, "groups": [{n, pattern, countries, label}]}.
    Only the pattern, the count and countries leave this function.
    feats: optional {id: features} cache (speed only, same result)."""
    feats = feats if feats is not None else {}
    if not persona.get("matching_opt_in"):
        return dict(EMPTY, groups=[])
    pf = features(persona)
    groups = defaultdict(list)
    for rec in cohort:
        if not rec.get("matching_opt_in") or rec["id"] == persona["id"]:
            continue
        if rec["id"] not in feats:
            feats[rec["id"]] = features(rec)
        shared = pf & feats[rec["id"]]
        if len(shared) >= min_shared:
            groups[shared].append(rec["country"])
    out = [{"n": len(c), "pattern": sorted(p), "countries": sorted(set(c)), "label": LABEL}
           for p, c in groups.items() if len(c) >= k]
    if not out:
        return dict(EMPTY, groups=[])
    out.sort(key=lambda g: (-g["n"], g["pattern"]))
    return {"match_count": sum(g["n"] for g in out), "groups": out}
