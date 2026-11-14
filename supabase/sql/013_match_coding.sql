-- Per env. Rendered by `scripts/hdb render <env> 013_match_coding.sql` (__SCHEMA__ -> healthapp_<env>).
-- Possible matches, round 2 of the patient's feature coding (MIN-4505). Needs 005 (tables, RPC) and 006
-- (match_lab_defs). Replaces match_patient_codes only: the RPC, exact-set grouping, k = 5 and the one empty
-- answer are 005's and do not change. Nothing derived is stored; the extraction (extract-exam) is not touched.
-- What this adds over 005:
--  1. Markers the extraction does not key are read from the printed analyte name, English and Greek
--     (match_analyte_alias): ANA, HLA-B27, HbA1c, ACE, ceruloplasmin, CK. The name wins over the extraction's
--     key, so "Glycated haemoglobin (HbA1c)", which the extraction keys as haemoglobin, is HbA1c and never Hb_low.
--  2. Qualitative results: "positive", "negative", "θετικό", "αρνητικό", "detected", titres. ANA and HLA-B27
--     printed as a number are read through the printed range (the extraction's flag). RF and anti-CCP printed
--     as text are read too. Borderline or unreadable text decides nothing.
--  3. Units for the four numeric new markers (match_unit_conv): HbA1c in mmol/mol, ceruloplasmin in g/L or
--     mg/L are converted to match.py's units; any other printed unit decides nothing (never a wrong code).
--  4. Negation in the record's words: "no joint pain", "χωρίς πόνο", "denies", "negative for", "όχι",
--     "δεν παρατηρείται" do not code. Rule (deterministic): a sentence, or a clause cut at but/however/αλλά/
--     όμως, codes a term only when no negation word stands up to 5 words before it and no "absent"/"not seen"/
--     "δεν παρατηρείται" up to 3 words after it. "No improvement/change in X" is not a negation of X.
-- The latest result per marker that decides something is the one that counts (005: latest by exam date).
-- Same thresholds and codes as scripts/synthetic/match.py (LAB_DEFS, seeded by 006); match.py is unchanged.
-- Check: supabase/sql/checks/match_coding_check.sql. Idempotent; applied in one transaction.

-- 1. Printed names of the markers the extraction does not key (POSIX regex over match_fold(analyte)).
create table if not exists __SCHEMA__.match_analyte_alias (
  analyte_key text primary key,   -- a match_lab_defs key
  pattern     text not null,
  not_pattern text                -- a name that also matches this is not the marker (CK-MB is not CK)
);
delete from __SCHEMA__.match_analyte_alias;
insert into __SCHEMA__.match_analyte_alias (analyte_key, pattern, not_pattern) values
  ('ana', '(^|[^a-z0-9α-ω])f?ana([^a-z0-9α-ω]|$)|anti-? ?nuclear|αντιπυρηνικ', null),
  ('hla_b27', 'hla[- ]?b[- ]?27|(^|[^a-z0-9α-ω])b27([^a-z0-9α-ω]|$)', null),
  ('hba1c', 'hb ?a1c|(^|[^a-z0-9α-ω])a1c|glyc(at|osyl)ated ha?emoglobin|γλυκο[ζσ]υλιωμεν|γλυκιωμεν', null),
  ('ace', '(^|[^a-z0-9α-ω])s?ace([^a-z0-9α-ω]|$)|angiotensin[- ]?(i[- ])?converting|μετατρεπτικ[α-ω]* ενζυμ|αγγειοτ[αε]ν?σιν', null),
  ('ceruloplasmin', 'ca?eruloplasmin|σερουλοπλασμιν|κυανοπλασμιν', null),
  ('ck', '(^|[^a-z0-9α-ω])(ck|cpk)([^a-z0-9α-ω]|$)|creatine?[- ]?(phospho)?kinase|κρεατιν[α-ω]* (φωσφο)?κινασ|κρεατινοφωσφοκινασ',
         '(^|[^a-z0-9α-ω])mb([^a-z0-9α-ω]|$)|ck-?mb|μβ');

-- 3. Printed units read for a marker (POSIX regex over lower(unit) without spaces): value * factor + addend
-- is in match.py's unit. A marker with rows here and a printed unit that matches none decides nothing.
-- A blank unit is read as match.py's unit. Markers with no row keep 005's reading (the value as printed).
create table if not exists __SCHEMA__.match_unit_conv (
  analyte_key  text not null,
  unit_pattern text not null,
  factor       numeric not null,
  addend       numeric not null default 0,
  primary key (analyte_key, unit_pattern)
);
delete from __SCHEMA__.match_unit_conv;
insert into __SCHEMA__.match_unit_conv (analyte_key, unit_pattern, factor, addend) values
  ('hba1c', '^%', 1, 0),
  ('hba1c', '^mmol/mol', 0.09148, 2.152),        -- IFCC (mmol/mol) to NGSP (%), the master equation
  ('ceruloplasmin', '^mg/dl$', 1, 0),
  ('ceruloplasmin', '^g/l$', 100, 0),
  ('ceruloplasmin', '^mg/l$', 0.1, 0),
  ('ck', '^(i?u|ui)/l$', 1, 0),
  ('ace', '^(i?u|ui)/l$', 1, 0);

alter table __SCHEMA__.match_analyte_alias enable row level security;
alter table __SCHEMA__.match_unit_conv     enable row level security;
revoke all on __SCHEMA__.match_analyte_alias, __SCHEMA__.match_unit_conv from public, anon, authenticated;
grant all on __SCHEMA__.match_analyte_alias, __SCHEMA__.match_unit_conv to service_role;
-- RLS on and no policy: no client role reads these tables. The absence is the rule (as 005).

-- Which marker a result row is: the printed name first, then the extraction's key.
create or replace function __SCHEMA__.match_marker(analyte text, analyte_key text) returns text
language sql stable set search_path = ''
as $$
  select coalesce((
    select a.analyte_key from __SCHEMA__.match_analyte_alias a
    where __SCHEMA__.match_fold(match_marker.analyte) ~ a.pattern
      and (a.not_pattern is null or __SCHEMA__.match_fold(match_marker.analyte) !~ a.not_pattern)
    order by a.analyte_key collate "C" limit 1), match_marker.analyte_key)
$$;

-- 2. A qualitative result written as text: true = positive, false = negative, null = decides nothing.
-- Negative words are tested first ("not detected" contains "detected"). A titre counts from 1:80
-- (the EULAR/ACR 2019 ANA entry criterion); "<1:80" is negative.
create or replace function __SCHEMA__.match_qual_text(t text) returns boolean
language sql immutable set search_path = ''
as $$
  select case
    when z.s ~ '(^|[^a-z0-9α-ω])(negativ|neg([^a-z]|$)|not detected|non-? ?reactive|not present|absent|undetectable|αρνητικ|δεν ανιχνευ|μη ανιχνευσ|απουσ)'
      then false
    when z.s ~ '(^|[^a-z0-9α-ω])(positiv|pos([^a-z]|$)|detected|reactive|present|θετικ|ανιχνευ)'
      then true
    when z.s ~ '^[<≤] *1 *[:/]' then false
    when z.s ~ '(^|[^0-9])1 *[:/] *[0-9]+' then substring(z.s from '(?:^|[^0-9])1 *[:/] *([0-9]+)')::numeric >= 80
  end
  from (select __SCHEMA__.match_fold(btrim(coalesce(t, ''))) as s) z
$$;

-- What one result row says about its marker: the codes it gives ('{}' = decided, nothing to code) or
-- null when it decides nothing (not a coded marker, unreadable text, unknown unit, no printed range).
create or replace function __SCHEMA__.match_read(marker text, value_num numeric, value_text text, unit text, flag text)
returns text[]
language sql stable set search_path = ''
as $$
  select case
    when x.analyte_key is null then null
    when match_read.value_num is null then
      case when x.code_above like '%\_positive' then
        case __SCHEMA__.match_qual_text(match_read.value_text)
          when true then array[x.code_above] when false then '{}'::text[] end
      end
    when x.unit = 'qual' then
      case match_read.flag when 'high' then array[x.code_above] when 'normal' then '{}'::text[]
                           when 'low' then '{}'::text[] end
    when nullif(btrim(match_read.unit), '') is null
      or not exists (select 1 from __SCHEMA__.match_unit_conv c where c.analyte_key = x.analyte_key)
      then __SCHEMA__.match_lab_codes(x.analyte_key, match_read.value_num)
    else (select __SCHEMA__.match_lab_codes(x.analyte_key, match_read.value_num * c.factor + c.addend)
          from __SCHEMA__.match_unit_conv c
          where c.analyte_key = x.analyte_key
            and regexp_replace(lower(match_read.unit), '\s', '', 'g') ~ c.unit_pattern
          order by c.unit_pattern collate "C" limit 1)
  end
  from (select 1) one left join __SCHEMA__.match_lab_defs x on x.analyte_key = match_read.marker
$$;

-- 4. Does the (folded) text state the term, not negated? See the header for the rule. A text without the term
-- is answered before any splitting (most texts hold few of the terms).
create or replace function __SCHEMA__.match_text_has(t text, pattern text) returns boolean
language sql immutable set search_path = ''
as $$
  with clause as (
    select regexp_replace(c,
             '(^|[^a-z0-9α-ω])(no (significant |further )?(change|increase|decrease|improvement|worsening)|not only|δεν (βελτιω|αλλαξ|υποχωρ)[α-ω]*|χωρισ (βελτιωσ|αλλαγ|υφεσ)[α-ω]*)',
             '\1 ', 'g') as c
    from regexp_split_to_table(coalesce(t, ''),
           '[.;!?' || chr(10) || chr(13) || ']+|(?:^|[^a-z0-9α-ω])(?:but|however|although|except|αλλα|ομωσ|ενω|εκτοσ)(?=[^a-z0-9α-ω]|$)') c
  )
  select case when coalesce(match_text_has.t, '') !~ match_text_has.pattern then false else exists (
    select 1 from clause
    where clause.c ~ match_text_has.pattern
      and clause.c !~ ('(?:^|[^a-z0-9α-ω])(?:no|not|without|denies|denied|deny|denying|negative for|free of|absence of|never|none|nor|neither|οχι|χωρισ|δεν|ουτε|ουδεμια|ουδεν|αρνειται|αρνηθηκε|απουσια|αρνητικ[α-ω]* για)[^a-z0-9α-ω]+(?:[a-z0-9α-ω]+[^a-z0-9α-ω]+){0,5}[a-z0-9α-ω]*(?:'
                       || match_text_has.pattern || ')')
      and clause.c !~ ('(?:' || match_text_has.pattern
                       || ')[a-z0-9α-ω]*(?:[^a-z0-9α-ω]+[a-z0-9α-ω]+){0,3}[^a-z0-9α-ω]+(?:absent|not (?:seen|present|found|detected|observed|noted|reported)|denied|απουσιαζ[α-ω]*|δεν (?:παρατηρειται|παρατηρουνται|ανευρισκεται|ανευρισκονται|αναφερεται|αναφερονται|ανιχνευεται))(?:[^a-z0-9α-ω]|$)')
  ) end
$$;

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

-- New functions get EXECUTE for PUBLIC (001): take it away. Only the owner (via the 005 RPC) and service_role.
revoke execute on function __SCHEMA__.match_marker(text, text), __SCHEMA__.match_qual_text(text),
  __SCHEMA__.match_read(text, numeric, text, text, text), __SCHEMA__.match_text_has(text, text),
  __SCHEMA__.match_codes_from(jsonb, jsonb, jsonb), __SCHEMA__.match_patient_codes(uuid)
  from public, anon, authenticated;
grant execute on function __SCHEMA__.match_marker(text, text), __SCHEMA__.match_qual_text(text),
  __SCHEMA__.match_read(text, numeric, text, text, text), __SCHEMA__.match_text_has(text, text),
  __SCHEMA__.match_codes_from(jsonb, jsonb, jsonb), __SCHEMA__.match_patient_codes(uuid) to service_role;

insert into __SCHEMA__._applied (file) values ('013_match_coding.sql') on conflict (file) do nothing;
