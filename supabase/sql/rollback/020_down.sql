-- ROLLBACK of 020_lab_loinc.sql (MIN-4689), on the CTO's call only. Per env.
-- Not a migration: it lives in supabase/sql/rollback/, which `scripts/hdb render` cannot take.
-- Rendered by `scripts/hdb down <env> 020_down.sql`. Apply it in one transaction (one execute_sql call, or psql -1).
-- What it does: 014's match_codes_from and match_patient_codes come back, byte for byte from 014_match_coding.sql (the
-- part between "The coding itself" and the grants, copied by a script, never retyped), with 014's revoke and grant;
-- then match_marker(text, text, text) is dropped and 020's _applied row is deleted. Matching is then 014's keyword
-- path again for every row.
-- What it keeps: lab_loinc and results.loinc, with their rows. Dropping them on demo would delete data, and the
-- extract function writes results.loinc: roll the function back first if the column must go (a separate decision).
-- It refuses to commit unless the restored functions no longer read a code.
-- No patient row is read or touched.

-- The coding itself, over plain values so it can be checked without writing a row:
--   labs        [{o, a, k, n, x, u, f}]: order (1 = newest), analyte, analyte_key, value_num, value_text, unit, flag
--   texts       [{t, img}]: findings and diary text; img = the finding is from an imaging report
--   specialties ["Rheumatology", ...]
create or replace function __SCHEMA__.match_codes_from(labs jsonb, texts jsonb, specialties jsonb) returns text[]
language sql stable set search_path = ''
as $$
  with lab as (
    select l.o, __SCHEMA__.match_marker(l.a, l.k) as marker, l.n, l.x, l.u, l.f
    from jsonb_to_recordset(coalesce(labs, '[]'::jsonb)) as l (o bigint, a text, k text, n numeric, x text, u text, f text)
  ), decided as (
    select distinct on (z.marker) z.codes
    from (select lab.o, lab.marker, __SCHEMA__.match_read(lab.marker, lab.n, lab.x, lab.u, lab.f) as codes from lab) z
    where z.codes is not null
    order by z.marker, z.o
  ), txt as (
    select __SCHEMA__.match_fold(t.t) as t, coalesce(t.img, false) as img
    from jsonb_to_recordset(coalesce(texts, '[]'::jsonb)) as t (t text, img boolean)
  ), spec as (
    select __SCHEMA__.match_fold(s.s) as t from jsonb_array_elements_text(coalesce(specialties, '[]'::jsonb)) as s (s)
  ), codes as (
    select unnest(d.codes) as code from decided d
    union
    select v.code from __SCHEMA__.match_vocab v
    where (v.source = 'symptom' and exists (select 1 from txt where __SCHEMA__.match_text_has(txt.t, v.pattern)))
       or (v.source = 'imaging' and exists (select 1 from txt where txt.img and __SCHEMA__.match_text_has(txt.t, v.pattern)))
       or (v.source = 'specialty' and exists (select 1 from spec where spec.t ~ v.pattern))
  )
  select coalesce(array_agg(c.code order by c.code collate "C"), '{}') from codes c
$$;

-- The patient's coded features from her own confirmed records (same sources as 005). Computed, never stored.
create or replace function __SCHEMA__.match_patient_codes(patient uuid) returns text[]
language sql stable set search_path = ''
as $$
  select __SCHEMA__.match_codes_from(
    (select coalesce(jsonb_agg(jsonb_build_object('o', q.o, 'a', q.analyte, 'k', q.analyte_key, 'n', q.value_num,
                                                  'x', q.value_text, 'u', q.unit, 'f', q.flag)), '[]'::jsonb)
       from (select r.analyte, r.analyte_key, r.value_num, r.value_text, r.unit, r.flag,
                    row_number() over (order by d.exam_date desc nulls last, d.confirmed_at desc nulls last, r.id) as o
               from __SCHEMA__.results r
               join __SCHEMA__.documents d on d.id = r.document_id and d.status = 'confirmed'
              where r.patient_id = match_patient_codes.patient) q),
    (select coalesce(jsonb_agg(jsonb_build_object('t', x.t, 'img', x.img)), '[]'::jsonb)
       from (select f.text_original as t, d.kind = 'imaging_report' as img
               from __SCHEMA__.findings f
               join __SCHEMA__.documents d on d.id = f.document_id and d.status = 'confirmed'
              where f.patient_id = match_patient_codes.patient
             union all
             select e.text, false from __SCHEMA__.diary_entries e where e.patient_id = match_patient_codes.patient) x),
    (select coalesce(jsonb_agg(f.specialty), '[]'::jsonb)
       from __SCHEMA__.findings f
       join __SCHEMA__.documents d on d.id = f.document_id and d.status = 'confirmed'
      where f.patient_id = match_patient_codes.patient and f.specialty is not null))
$$;

revoke execute on function __SCHEMA__.match_codes_from(jsonb, jsonb, jsonb), __SCHEMA__.match_patient_codes(uuid)
  from public, anon, authenticated;
grant execute on function __SCHEMA__.match_codes_from(jsonb, jsonb, jsonb), __SCHEMA__.match_patient_codes(uuid)
  to service_role;

drop function if exists __SCHEMA__.match_marker(text, text, text);

delete from __SCHEMA__._applied where file = '020_lab_loinc.sql';

do $$
begin
  if to_regprocedure('__SCHEMA__.match_marker(text, text, text)') is not null
     or exists (select 1 from pg_proc p
                where p.oid in (to_regprocedure('__SCHEMA__.match_codes_from(jsonb, jsonb, jsonb)'),
                                to_regprocedure('__SCHEMA__.match_patient_codes(uuid)'))
                  and (p.prosrc like '%loinc%' or p.prosrc like '%l.l)%'))
     or to_regprocedure('__SCHEMA__.match_marker(text, text)') is null then
    raise exception '020_down: the restored functions still read a code, or 014''s match_marker is missing: nothing was changed';
  end if;
end $$;
