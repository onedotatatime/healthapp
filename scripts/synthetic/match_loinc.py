"""LOINC step 1 mirror of the matching (MIN-4689; rule amended by the CTO on MIN-4690 §3). Synthetic data only.

match.py stays byte-identical to the script the recorded 5,000 run uploaded to boxd (its sha256 is pinned in
simulate_scripts_test.ts), so the code-aware mirror of 020's match_marker(analyte, analyte_key, loinc) lives here.
This file is not embedded and not uploaded.
  LOINC       every row of supabase/sql/020_lab_loinc.sql: code -> LAB_DEFS marker, or None when the row's key is
              not a matching marker (glucose, hdl, MCH ...). test_match_loinc.py fails when this map and 020 disagree.
  marker_of   no code, or a code not in LOINC -> the row's own "marker" (014's answer);
              a listed code with no marker -> None (decides nothing);
              the row's own marker is set and is another marker -> None (decides nothing);
              otherwise -> the code's marker.
  features    match.features over the rows, each with marker = marker_of(row); rows whose marker is None are dropped.
"""
import match

LOINC = {
    "11572-5": "RF", "11580-8": "TSH", "13457-7": "LDL", "13965-9": None, "14804-9": None, "1558-6": None,
    "1742-6": "ALT", "1751-7": None, "17856-6": "HbA1c", "17861-6": None, "1798-8": None, "18262-6": "LDL",
    "19123-9": None, "1920-8": None, "1968-7": None, "1975-2": None, "1988-5": "CRP", "1989-3": "VitD",
    "20448-7": None, "2064-4": "Ceruloplasmin", "2075-0": None, "2085-9": None, "2089-1": "LDL", "2093-3": None,
    "2132-9": None, "2143-6": None, "2157-6": "CK", "2160-0": "Creatinine", "2276-4": "Ferritin", "2284-8": None,
    "2324-2": None, "2345-7": None, "2458-8": None, "2465-3": None, "2472-9": None, "2498-4": None, "2500-7": None,
    "2571-8": None, "26043-0": "HLA_B27", "26464-8": "WBC", "2742-5": "ACE", "2777-1": None, "2823-3": None,
    "2857-1": None, "2885-2": None, "2951-2": None, "3016-3": "TSH", "3024-7": None, "3034-6": None,
    "30341-2": "ESR", "3040-3": None, "3051-0": None, "30522-7": "CRP", "3084-1": "UricAcid", "3091-6": None,
    "3173-2": None, "3255-7": None, "32623-1": None, "33253-6": "ANA", "33935-8": "anti_CCP", "33959-8": None,
    "4485-9": None, "4498-2": None, "4537-7": "ESR", "4544-3": None, "4548-4": "HbA1c", "4821-5": "HLA_B27",
    "5048-4": "ANA", "53027-9": "anti_CCP", "5902-2": None, "5905-5": None, "59261-8": "HbA1c", "62292-8": "VitD",
    "6301-6": None, "6690-2": "WBC", "6768-6": None, "704-7": None, "706-2": None, "711-2": None, "713-8": None,
    "718-7": "Hemoglobin", "731-0": None, "736-9": None, "742-7": None, "751-8": None, "770-8": None, "777-3": None,
    "785-6": None, "786-4": None, "787-2": None, "788-0": None, "789-8": None, "8061-4": "ANA", "8098-6": None,
    "8099-4": None,
}


def marker_of(lab):
    code = lab.get("loinc")
    if code is None or code not in LOINC:
        return lab.get("marker")
    key = LOINC[code]
    if key is None:
        return None
    own = lab.get("marker")
    if own is not None and own != key:
        return None
    return key


def features(patient):
    labs = []
    for lab in patient["labs"]:
        m = marker_of(lab)
        if m is not None:
            labs.append(dict(lab, marker=m))
    return match.features(dict(patient, labs=labs))
