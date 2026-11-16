-- Counts-only check of the matching cohort and the matches RPC (MIN-4649). `scripts/hdb matches <env>` renders it
-- (__SCHEMA__ -> healthapp_<env>) and runs it when HDB_DATABASE_URL is set. Reads the synthetic cohort, function
-- metadata and _applied only: no patient row, so it is safe on healthapp_demo (MIN-4526).
-- Want, after 018 and 019:  cohort_rows 5000, opted_in 4499, first_id syn-0001, last_id syn-5000, not_synthetic 0,
--   cohort_md5 = the value `python3 scripts/synthetic/test_seed_sql.py` prints (the same 5,000 rows as
--   data/synthetic/run-5000.json), rpc_codes_once true, applied_018 true, applied_019 true.
-- Before 019 (006's 400 rows): cohort_rows 400, opted_in 367, last_id syn-0400.
select
  (select count(*) from __SCHEMA__.match_cohort)                                              as cohort_rows,
  (select count(*) from __SCHEMA__.match_cohort where matching_opt_in)                        as opted_in,
  (select min(id collate "C") from __SCHEMA__.match_cohort)                                   as first_id,
  (select max(id collate "C") from __SCHEMA__.match_cohort)                                   as last_id,
  (select count(*) from __SCHEMA__.match_cohort where not synthetic or label <> 'seeded, synthetic') as not_synthetic,
  (select md5(string_agg(id || ' ' || country || ' ' || age_band || ' ' || matching_opt_in::text || ' '
                         || array_to_string(codes, ','), '|' order by id collate "C"))
     from __SCHEMA__.match_cohort)                                                            as cohort_md5,
  (select p.prosrc like '%into my_codes%' and p.prosrc not like '%match_patient_codes(p.id) as codes%'
     from pg_proc p where p.oid = to_regprocedure('__SCHEMA__.healthapp_possible_matches(uuid)')) as rpc_codes_once,
  exists (select 1 from __SCHEMA__._applied where file = '018_matches_codes_once.sql')        as applied_018,
  exists (select 1 from __SCHEMA__._applied where file = '019_seed_match_cohort_5000.sql')    as applied_019;
