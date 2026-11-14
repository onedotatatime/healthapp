"""Generate the blind synthetic cohort + the test personas (MIN-4505). Seeded: same seed, same files.
Synthetic only. Not tuned to any real person. No names, no real ids, country only.
Usage: python3 generate.py <out_dir>
"""
import json, random, sys, os
from match import LAB_DEFS, IMAGING, SYMPTOMS, SPECIALTIES, features

SEED = 20261114
N = 400
COUNTRIES = [("GR", 5), ("DE", 4), ("FR", 3), ("ES", 3), ("IT", 3), ("NL", 2), ("PT", 2), ("SE", 1), ("CY", 1)]
AGE_BANDS = ["18-29", "30-39", "40-49", "50-59", "60-69", "70+"]
# lab code -> (marker, direction)
CODE_TO_LAB = {}
for m, (_u, _lo, _hi, a, b) in LAB_DEFS.items():
    if a: CODE_TO_LAB[a] = (m, "above")
    if b: CODE_TO_LAB[b] = (m, "below")

# name: size, core codes with presence probability, age bands, sex weights (F share), 
CLUSTERS = [
    ("inflammatory_back_pain", 28, {"CRP_high": .9, "ESR_high": .85, "HLA_B27_positive": .95, "morning_stiffness": .9,
        "low_back_pain": .95, "img_sacroiliitis": .85, "spec_orthopaedics": .8, "spec_rheumatology": .85}, [0, 1, 2], .35),
    ("rheumatoid_arthritis", 26, {"RF_positive": .9, "anti_CCP_positive": .9, "CRP_high": .85, "joint_pain": .95,
        "morning_stiffness": .85, "hand_swelling": .7, "spec_rheumatology": .9}, [2, 3, 4], .75),
    ("hypothyroid", 26, {"TSH_high": .95, "fatigue": .9, "cold_intolerance": .8, "weight_gain": .75, "spec_endocrinology": .75,
        "spec_gp": .6}, [1, 2, 3, 4], .85),
    ("type2_diabetes_metabolic", 30, {"HbA1c_high": .95, "LDL_high": .8, "polyuria": .75, "fatigue": .7,
        "spec_endocrinology": .8, "spec_cardiology": .4}, [3, 4, 5], .45),
    ("iron_deficiency", 22, {"Hb_low": .95, "ferritin_low": .95, "fatigue": .9, "headache": .6, "spec_gp": .8,
        "spec_gastroenterology": .55}, [0, 1, 2], .9),
    ("lupus_like", 14, {"ANA_positive": .95, "joint_pain": .85, "rash": .8, "fatigue": .8, "WBC_low": .65,
        "spec_rheumatology": .9}, [0, 1, 2], .9),
    ("gout", 12, {"uric_acid_high": .95, "joint_pain": .9, "CRP_high": .6, "spec_orthopaedics": .6,
        "spec_rheumatology": .5}, [3, 4, 5], .15),
    ("hyperthyroid", 12, {"TSH_low": .95, "palpitations": .85, "heat_intolerance": .8, "weight_loss": .8, "tremor": .6,
        "spec_endocrinology": .8, "spec_cardiology": .5}, [1, 2, 3], .8),
    ("reduced_kidney_function", 10, {"creatinine_high": .95, "leg_oedema": .7, "fatigue": .7, "spec_nephrology": .9,
        "spec_cardiology": .5}, [4, 5], .45),
    ("low_bone_density", 15, {"vitD_low": .9, "img_osteopenia": .9, "bone_pain": .8, "spec_orthopaedics": .8,
        "spec_endocrinology": .4}, [4, 5], .85),
    # rare patterns: fewer than 5 members each, they must never come back from the matching
    ("rare_sarcoid_like", 3, {"ACE_high": .98, "img_hilar_lymphadenopathy": .98, "cough": .95, "dry_eyes": .9,
        "spec_pulmonology": .95}, [2, 3], .5),
    ("rare_copper_metabolism", 2, {"ceruloplasmin_low": .98, "ALT_high": .98, "tremor": .95, "spec_hepatology": .95,
        "spec_neurology": .95}, [0, 1], .5),
    ("rare_myopathy", 4, {"CK_high": .98, "muscle_weakness": .98, "ALT_high": .9, "spec_neurology": .9,
        "spec_rheumatology": .8}, [1, 2, 3], .5),
]
NOISE_CODES = (["CRP_high", "vitD_low", "ferritin_low", "LDL_high", "ALT_high", "ESR_high", "WBC_high", "TSH_high"] * 2
               + ["headache", "fatigue", "joint_pain", "low_back_pain", "cough", "rash", "weight_gain", "polyuria"] * 2
               + ["img_disc_degeneration", "img_joint_effusion", "spec_gp", "spec_cardiology", "spec_orthopaedics"] * 2)


def month(rng, lo=1, hi=36):
    """A month/year date, 1..36 months before Nov 2026. Never a day."""
    back = rng.randint(lo, hi)
    y, m = divmod(2026 * 12 + 10 - back, 12)
    return "%04d-%02d" % (y, m + 1)


def lab_value(rng, marker, state):
    unit, lo, hi, _a, _b = LAB_DEFS[marker]
    if unit == "qual":
        return 1 if state == "above" else 0
    span = (hi - lo) or 1.0
    if state == "above":
        v = hi + span * rng.uniform(0.15, 1.2)
    elif state == "below":
        v = lo - span * rng.uniform(0.1, 0.5)
        v = max(v, lo * 0.2)
    else:
        v = rng.uniform(lo + 0.15 * span, hi - 0.15 * span)
    return round(v, 1 if hi < 100 else 0)


def build(rng, pid, intended, country, age, sex, opt_in):
    labs, imaging, symptoms, specs = [], [], [], []
    states = {}
    for code in sorted(intended):   # sets iterate in hash order: sort, or the seed means nothing
        if code in CODE_TO_LAB:
            m, st = CODE_TO_LAB[code]
            states[m] = st
        elif code in IMAGING:
            imaging.append({"code": code, "date": month(rng)})
        elif code in SYMPTOMS:
            symptoms.append(code)
        elif code in SPECIALTIES:
            specs.append(code)
    # a normal panel for some other markers, so records look like real folders
    others = [m for m in LAB_DEFS if m not in states]
    for m in rng.sample(others, rng.randint(3, 6)):
        states[m] = "normal"
    for m, st in states.items():
        unit, lo, hi, _a, _b = LAB_DEFS[m]
        latest = month(rng, 1, 18)
        labs.append({"marker": m, "value": lab_value(rng, m, st), "unit": unit, "ref_low": lo, "ref_high": hi, "date": latest})
        if rng.random() < 0.3:   # an older, different result: the latest one decides
            older = month(rng, 19, 36)
            old_state = "normal" if st != "normal" else rng.choice(["normal", "above" if LAB_DEFS[m][3] else "normal"])
            if unit != "qual" or old_state == "normal":
                labs.append({"marker": m, "value": lab_value(rng, m, old_state), "unit": unit, "ref_low": lo,
                             "ref_high": hi, "date": older})
    if not specs:
        specs = ["spec_gp"] if rng.random() < .6 else []
    return {"id": pid, "synthetic": True, "label": "seeded, synthetic", "country": country, "age_band": age,
            "sex": sex, "matching_opt_in": opt_in, "labs": labs, "imaging": imaging,
            "symptoms": sorted(symptoms), "specialties": sorted(set(specs))}


def make_cohort(rng):
    cw = [c for c, w in COUNTRIES for _ in range(w)]
    people, tags = [], []
    for name, size, core, ages, f_share in CLUSTERS:
        for _ in range(size):
            intended = {c for c, p in core.items() if rng.random() < p}
            for c in rng.sample(NOISE_CODES, rng.choice([0, 0, 1, 2])):   # incidental extras
                intended.add(c)
            people.append((intended, rng.choice(ages), "F" if rng.random() < f_share else "M"))
            tags.append(name)
    while len(people) < N:   # noise patients: scattered, no shared pattern
        intended = set(rng.sample(NOISE_CODES, rng.randint(1, 4)))
        people.append((intended, rng.randrange(6), "F" if rng.random() < .5 else "M"))
        tags.append("noise")
    order = list(range(len(people)))
    rng.shuffle(order)   # ids carry no cluster information
    cohort, truth = [], {}
    for n, i in enumerate(order, 1):
        intended, age, sex = people[i]
        pid = "syn-%04d" % n
        rec = build(rng, pid, intended, rng.choice(cw), AGE_BANDS[age], sex, rng.random() < 0.9)
        cohort.append(rec)
        truth[pid] = tags[i]
    return cohort, truth


def make_persona(rng, pid, intended, opt_in, country="GR", age="50-59", sex="F"):
    return build(rng, pid, set(intended), country, age, sex, opt_in)


def main(out):
    os.makedirs(out, exist_ok=True)
    rng = random.Random(SEED)
    cohort, truth = make_cohort(rng)
    prng = random.Random(SEED + 1)
    maria_codes = ["CRP_high", "RF_positive", "anti_CCP_positive", "joint_pain", "morning_stiffness", "spec_rheumatology"]
    personas = {
        "maria": make_persona(prng, "persona-maria", maria_codes, True),
        "maria_not_opted_in": make_persona(prng, "persona-maria-no-optin", maria_codes, False),
        "rare": make_persona(prng, "persona-rare", ["ACE_high", "img_hilar_lymphadenopathy", "cough", "dry_eyes", "spec_pulmonology"], True, "DE", "40-49", "M"),
        "no_pattern": make_persona(prng, "persona-no-pattern", ["spec_gp"], True, "FR", "30-39", "F"),
    }
    dump = lambda name, obj: open(os.path.join(out, name), "w").write(json.dumps(obj, indent=1, sort_keys=True) + "\n")
    dump("cohort.json", {"synthetic": True, "label": "seeded, synthetic", "seed": SEED, "records": cohort})
    dump("persona-maria.json", personas["maria"])
    dump("test-personas.json", personas)
    # truth: which cluster generated whom. Test/debug only, never part of the cohort the matching sees.
    sizes = {}
    for t in truth.values(): sizes[t] = sizes.get(t, 0) + 1
    dump("cohort-seed-summary.json", {"seed": SEED, "cohort_size": len(cohort), "opted_in": sum(r["matching_opt_in"] for r in cohort),
                                      "seeded_patterns": sizes})
    print("cohort", len(cohort), "opted_in", sum(r["matching_opt_in"] for r in cohort))
    print("seeded patterns", json.dumps(sizes, sort_keys=True))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "out")
