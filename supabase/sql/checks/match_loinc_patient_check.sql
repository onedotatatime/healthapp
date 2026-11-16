-- The patient path of 020 (MIN-4689): match_patient_codes reads results.loinc. DEV ONLY (synthetic persona):
-- `sed -e "s/__SCHEMA__/healthapp_dev/g" -e "s/__ENV__/dev/g"` and paste into execute_sql. Writes one confirmed
-- synthetic document with three result rows for the dev persona, reads her codes, and rolls everything back: the
-- block always ends in an exception whose message is the result (PASS or FAIL with the booleans).
--   by_code     a row whose printed name gives no keyword, with the CK code, gives CK_high
--   guard       a row printed "Glycated haemoglobin (HbA1c)" with the haemoglobin code decides nothing (no Hb_low)
--   no_code     a row without a code keeps 014's keyword path (creatinine printed, 2.5 mg/dL: creatinine_high)
--   before      none of the three codes was among her codes before the rows were added
do $$
declare
  pat uuid; doc uuid := gen_random_uuid(); before text[]; after text[];
  by_code boolean; guard boolean; no_code boolean; clean boolean;
begin
  if '__SCHEMA__' <> 'healthapp_dev' then raise exception 'match_loinc_patient_check is dev only'; end if;
  select p.id into strict pat from __SCHEMA__.profiles p join auth.users u on u.id = p.id
   where u.email = 'patient.__ENV__@healthapp.invalid' and p.role = 'patient';
  before := __SCHEMA__.match_patient_codes(pat);
  insert into __SCHEMA__.documents (id, patient_id, status, kind, language, exam_date, issuer, confirmed_at)
  values (doc, pat, 'confirmed', 'blood_test', 'el', '2099-01-01', 'match_loinc_patient_check (synthetic)', now());
  insert into __SCHEMA__.results (document_id, patient_id, pos, analyte, analyte_key, loinc, value_num, unit, flag, edited_by_patient) values
    (doc, pat, 0, 'Ένζυμο μυϊκής βλάβης', null, '2157-6', 640, 'U/L', 'high', false),
    (doc, pat, 1, 'Glycated haemoglobin (HbA1c)', 'hemoglobin', '718-7', 6.8, '%', 'high', false),
    (doc, pat, 2, 'Κρεατινίνη', 'creatinine', null, 2.5, 'mg/dL', 'high', false);
  after := __SCHEMA__.match_patient_codes(pat);
  clean := not (before && array['CK_high', 'Hb_low', 'creatinine_high']);
  by_code := 'CK_high' = any (after);
  guard := not ('Hb_low' = any (after));
  no_code := 'creatinine_high' = any (after);
  raise exception '% by_code=% guard=% no_code=% before_clean=%',
    case when by_code and guard and no_code and clean then 'PASS' else 'FAIL' end, by_code, guard, no_code, clean;
end $$;
