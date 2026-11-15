-- Counts-only check of 020_lab_loinc.sql (MIN-4689). `scripts/hdb loinc <env>` renders it (__SCHEMA__ ->
-- healthapp_<env>) and runs it when HDB_DATABASE_URL is set. Prints counts, booleans and one md5 of the reference
-- table: never a value of a patient, so it is safe on healthapp_demo (MIN-4526).
-- Want after 020: rows 95 (between 60 and 100), distinct_codes = rows, bad_format 0, match_keys_covered 19,
--   match_keys_missing 0, unknown_keys 0, lab_loinc_md5 d991c4e5dc77e8dca62f6e3895a6b516 (020's own check),
--   no_client_grant true, results_loinc_column true, results_loinc_bad 0, applied_020 true.
-- results_with_code / results_without_code count result rows; decided_by_code, decided_by_keyword and
-- decided_nothing_disagree say how match_marker(analyte, analyte_key, loinc) decides each row (counts only).
-- "Known keys" are the 19 match_lab_defs keys and the extraction's own keys (_shared/extract.ts ANALYTE_KEYS;
-- extract_test.ts fails if this list and that one disagree).
with known (k) as (
  select analyte_key from __SCHEMA__.match_lab_defs
  union
  select unnest(array['crp','esr','anti_ccp','rf','hemoglobin','wbc','rbc','hematocrit','platelets','glucose',
                      'cholesterol_total','hdl','ldl','triglycerides','creatinine','urea','alt','ast','uric_acid',
                      'ferritin','iron','tsh','vitamin_d','sodium','potassium'])
), res as (
  select r.loinc,
         (select x.analyte_key from __SCHEMA__.lab_loinc x where x.loinc = r.loinc) as code_key,
         __SCHEMA__.match_marker(r.analyte, null::text) as alias_key
  from __SCHEMA__.results r
)
select
  (select count(*) from __SCHEMA__.lab_loinc)                                                      as rows,
  (select count(distinct loinc) from __SCHEMA__.lab_loinc)                                         as distinct_codes,
  (select count(*) from __SCHEMA__.lab_loinc where loinc !~ '^[0-9]{1,7}-[0-9]$')                  as bad_format,
  (select count(*) from __SCHEMA__.match_lab_defs m
    where exists (select 1 from __SCHEMA__.lab_loinc l where l.analyte_key = m.analyte_key))       as match_keys_covered,
  (select count(*) from __SCHEMA__.match_lab_defs m
    where not exists (select 1 from __SCHEMA__.lab_loinc l where l.analyte_key = m.analyte_key))   as match_keys_missing,
  (select count(*) from __SCHEMA__.lab_loinc l
    where l.analyte_key is not null and l.analyte_key not in (select k from known))               as unknown_keys,
  (select md5(string_agg(l.loinc || ' ' || l.name_en || ' ' || coalesce(l.name_el, '') || ' ' || coalesce(l.ucum, '')
                         || ' ' || coalesce(l.analyte_key, '') || ' ' || l.loinc_version, '|' order by l.loinc collate "C"))
     from __SCHEMA__.lab_loinc l)                                                                  as lab_loinc_md5,
  not (has_table_privilege('anon', '__SCHEMA__.lab_loinc', 'SELECT')
       or has_table_privilege('authenticated', '__SCHEMA__.lab_loinc', 'SELECT'))                  as no_client_grant,
  exists (select 1 from information_schema.columns where table_schema = '__SCHEMA__'
          and table_name = 'results' and column_name = 'loinc')                                    as results_loinc_column,
  (select count(*) from __SCHEMA__.results where loinc !~ '^[0-9]{1,7}-[0-9]$')                    as results_loinc_bad,
  (select count(*) from res where loinc is not null)                                               as results_with_code,
  (select count(*) from res where loinc is null)                                                   as results_without_code,
  (select count(*) from res where code_key is not null
     and coalesce(alias_key, code_key) = code_key)                                                 as decided_by_code,
  (select count(*) from res where code_key is null)                                                as decided_by_keyword,
  (select count(*) from res where code_key is not null and alias_key <> code_key)                  as decided_nothing_disagree,
  exists (select 1 from __SCHEMA__._applied where file = '020_lab_loinc.sql')                      as applied_020;
