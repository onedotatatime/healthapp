-- Per env. Rendered by `scripts/hdb render <env> 005_matches.sql` (__SCHEMA__ -> healthapp_<env>).
-- Possible matches (MIN-4505, stories F1 and F2; CTO decision on MIN-4505; PRD 10.10).
-- The SQL port of scripts/synthetic/match.py: a cohort row matches when it shares at least 4 of the
-- patient's coded features; rows are grouped by the exact shared set (groups never overlap, CTO ruling);
-- a group of fewer than k = 5 rows is dropped; no opt-in, no match and below-k all give the one empty
-- answer {"groups": [], "match_count": 0}. The patient's features are computed on the fly from her own
-- confirmed records: nothing derived is stored. Seeds: 006 (cohort, lab thresholds), 007 (dev persona).
-- Client-callable: healthapp_possible_matches (doctor, F2), healthapp_set_matches_opt_in and
-- healthapp_get_matches_opt_in (patient, F1). Shapes: RPCS in supabase/functions/_shared/contract.ts.
-- Applied in one transaction; idempotent. Verified in healthapp_dev on 14 Nov 2026 (MIN-4505).

-- Opt-in: matching_opt_in (002) plus the time consent was given. Off by default; off clears the time.
alter table __SCHEMA__.profiles add column if not exists matching_opt_in_at timestamptz;
-- An opt-in without a recorded consent time is not consent: such a row is switched off, never backdated.
update __SCHEMA__.profiles set matching_opt_in = false where matching_opt_in and matching_opt_in_at is null;
update __SCHEMA__.profiles set matching_opt_in_at = null where not matching_opt_in and matching_opt_in_at is not null;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_matching_consent_check'
                 and conrelid = '__SCHEMA__.profiles'::regclass) then
    alter table __SCHEMA__.profiles add constraint profiles_matching_consent_check
      check (matching_opt_in = (matching_opt_in_at is not null));
  end if;
end $$;

-- The seeded synthetic cohort. No person behind any row. Read only through healthapp_possible_matches.
create table if not exists __SCHEMA__.match_cohort (
  id              text primary key check (id ~ '^syn-[0-9]{4}$'),
  synthetic       boolean not null default true check (synthetic),
  label           text not null default 'seeded, synthetic' check (label = 'seeded, synthetic'),
  country         text not null check (country ~ '^[A-Z]{2}$'),
  age_band        text not null check (age_band ~ '^[0-9]{2}(-[0-9]{2}|\+)$'),
  matching_opt_in boolean not null,
  codes           text[] not null check (cardinality(codes) > 0)
);

-- Lab coding: the latest value of an analyte above ref_high gives code_above, below ref_low code_below.
-- Fixed thresholds (match.LAB_DEFS), not the printed range, so both sides are coded the same way. Seeded by 006.
create table if not exists __SCHEMA__.match_lab_defs (
  analyte_key text primary key,          -- results.analyte_key, as the extraction writes it
  unit        text not null,
  ref_low     numeric not null,
  ref_high    numeric not null,
  code_above  text,
  code_below  text,
  check (ref_low <= ref_high and (code_above is not null or code_below is not null))
);

-- Text coding: a symptom, imaging or specialty code is present when the record's own words match the
-- pattern (POSIX regex over match_fold: lower case, Greek accents removed, final sigma as sigma).
-- English and Greek. Keyword coding only: no negation ("no effusion" still codes effusion).
create table if not exists __SCHEMA__.match_vocab (
  code    text primary key,
  source  text not null check (source in ('symptom', 'imaging', 'specialty')),
  pattern text not null
);

insert into __SCHEMA__.match_vocab (code, source, pattern) values
  ('morning_stiffness', 'symptom', 'morning stiffness|πρωινη δυσκαμψια'),
  ('low_back_pain', 'symptom', 'low(er)? back pain|lumbar pain|lumbago|οσφυαλγια|πον\S* στη(ν)? μεση'),
  ('joint_pain', 'symptom', 'joint pain|pain in the joints|arthralgia|αρθραλγια|πον\S* στι(σ)? αρθρωσ'),
  ('fatigue', 'symptom', 'fatigue|tiredness|κοπωση|κουραση|εξαντληση'),
  ('weight_loss', 'symptom', 'weight loss|loss of weight|απωλεια (του )?βαρουσ'),
  ('weight_gain', 'symptom', 'weight gain|gain of weight|αυξηση (του )?βαρουσ'),
  ('polyuria', 'symptom', 'polyuria|πολυουρια'),
  ('palpitations', 'symptom', 'palpitation|αισθημα παλμων'),
  ('cold_intolerance', 'symptom', 'cold intolerance|intolerance to cold|δυσανεξια στο κρυο'),
  ('heat_intolerance', 'symptom', 'heat intolerance|intolerance to heat|δυσανεξια στη ζεστη'),
  ('rash', 'symptom', '\mrash|εξανθημα'),
  ('headache', 'symptom', 'headache|κεφαλαλγια|πονοκεφαλ'),
  ('cough', 'symptom', '\mcough|βηχ'),
  ('dry_eyes', 'symptom', 'dry eyes?|ξηροφθαλμια|ξηροτητα (των )?ματιων'),
  ('hand_swelling', 'symptom', 'swollen hands?|hand swelling|swelling of the hands?|οιδημα (στα |των )?χεριων|πρηξιμο (στα )?χερια'),
  ('bone_pain', 'symptom', 'bone pain|οστικ\S* πον'),
  ('muscle_weakness', 'symptom', 'muscle weakness|muscular weakness|μυικη αδυναμια'),
  ('tremor', 'symptom', 'tremor|τρομοσ'),
  ('leg_oedema', 'symptom', 'leg o?edema|o?edema of the legs|leg swelling|swollen legs|οιδημα (των )?(κατω ακρων|ποδιων)'),
  ('img_sacroiliitis', 'imaging', 'sacroiliitis|ιερολαγονιτιδα'),
  ('img_disc_degeneration', 'imaging', 'disc degeneration|degenerative disc|disc desiccation|εκφυλιση (του |των )?δισκ|δισκοπαθεια'),
  ('img_joint_effusion', 'imaging', 'joint effusion|knee effusion|υδαρθρωσ|υδραρθρωσ|αρθρικη συλλογη'),
  ('img_osteopenia', 'imaging', 'osteopeni|osteoporo|οστεοπενια|οστεοπορωσ'),
  ('img_hand_erosions', 'imaging', 'erosion|διαβρωσ'),
  ('img_hilar_lymphadenopathy', 'imaging', 'hilar (lymph|adenopathy)|πυλαια λεμφαδεν|λεμφαδενοπαθεια (των )?πυλων'),
  ('spec_orthopaedics', 'specialty', 'orthop|ορθοπ'),
  ('spec_rheumatology', 'specialty', 'rheumatol|ρευματολογ'),
  ('spec_gp', 'specialty', 'general pract|family (medicine|physician|doctor)|\mgp\M|γενικ\S* ιατρ|οικογενειακ'),
  ('spec_endocrinology', 'specialty', 'endocrin|ενδοκρινολογ'),
  ('spec_cardiology', 'specialty', 'cardiol|καρδιολογ'),
  ('spec_gastroenterology', 'specialty', 'gastroent|γαστρεντερολογ'),
  ('spec_nephrology', 'specialty', 'nephrol|νεφρολογ'),
  ('spec_pulmonology', 'specialty', 'pulmon|pneumon|respirat|πνευμονολογ'),
  ('spec_neurology', 'specialty', 'neurol|νευρολογ'),
  ('spec_hepatology', 'specialty', 'hepatol|ηπατολογ')
on conflict (code) do update set source = excluded.source, pattern = excluded.pattern;

alter table __SCHEMA__.match_cohort   enable row level security;
alter table __SCHEMA__.match_lab_defs enable row level security;
alter table __SCHEMA__.match_vocab    enable row level security;
revoke all on __SCHEMA__.match_cohort, __SCHEMA__.match_lab_defs, __SCHEMA__.match_vocab
  from public, anon, authenticated;
grant all on __SCHEMA__.match_cohort, __SCHEMA__.match_lab_defs, __SCHEMA__.match_vocab to service_role;
-- RLS on and no policy: no client role reads these tables. The absence is the rule.

-- Helpers. Not callable by clients; the RPC below runs them as the owner.
create or replace function __SCHEMA__.match_fold(t text) returns text
language sql immutable set search_path = ''
as $$ select translate(lower(t), 'άέήίόύώϊϋΐΰς', 'αεηιουωιυιυσ') $$;

create or replace function __SCHEMA__.match_lab_codes(analyte_key text, value_num numeric) returns text[]
language sql stable set search_path = ''
as $$
  select coalesce((
    select array_remove(array[
             case when match_lab_codes.value_num > x.ref_high then x.code_above end,
             case when match_lab_codes.value_num < x.ref_low  then x.code_below end], null)
    from __SCHEMA__.match_lab_defs x where x.analyte_key = match_lab_codes.analyte_key), '{}')
$$;

-- The patient's coded features from her own confirmed records: latest value per analyte, the words of
-- her findings and diary, and the specialty written on her findings. Computed, never stored.
create or replace function __SCHEMA__.match_patient_codes(patient uuid) returns text[]
language sql stable set search_path = ''
as $$
  with latest as (
    select distinct on (r.analyte_key) r.analyte_key, r.value_num
    from __SCHEMA__.results r
    join __SCHEMA__.documents d on d.id = r.document_id and d.status = 'confirmed'
    where r.patient_id = match_patient_codes.patient and r.analyte_key is not null and r.value_num is not null
    order by r.analyte_key, d.exam_date desc nulls last, d.confirmed_at desc nulls last, r.id
  ), texts as (
    select __SCHEMA__.match_fold(f.text_original) as t, d.kind as doc_kind
    from __SCHEMA__.findings f
    join __SCHEMA__.documents d on d.id = f.document_id and d.status = 'confirmed'
    where f.patient_id = match_patient_codes.patient
    union all
    select __SCHEMA__.match_fold(e.text), null
    from __SCHEMA__.diary_entries e where e.patient_id = match_patient_codes.patient
  ), specialties as (
    select __SCHEMA__.match_fold(f.specialty) as t
    from __SCHEMA__.findings f
    join __SCHEMA__.documents d on d.id = f.document_id and d.status = 'confirmed'
    where f.patient_id = match_patient_codes.patient and f.specialty is not null
  ), codes as (
    select unnest(__SCHEMA__.match_lab_codes(l.analyte_key, l.value_num)) as code from latest l
    union
    select v.code from __SCHEMA__.match_vocab v
    where (v.source = 'symptom'   and exists (select 1 from texts x where x.t ~ v.pattern))
       or (v.source = 'imaging'   and exists (select 1 from texts x where x.doc_kind = 'imaging_report'
                                                                      and x.t ~ v.pattern))
       or (v.source = 'specialty' and exists (select 1 from specialties s where s.t ~ v.pattern))
  )
  select coalesce(array_agg(c.code order by c.code collate "C"), '{}') from codes c
$$;

-- RPC, F2: supabase.schema('healthapp_<env>').rpc('healthapp_possible_matches', { patient_id }).
-- Callable only by a doctor with a live grant for this patient (expiry in the check, as in 002's policies);
-- anyone else gets SQLSTATE 42501 (HTTP 403 from the Data API). The patient's opt-in is checked in the
-- same query and its absence gives the same empty answer as "no matches".
create or replace function __SCHEMA__.healthapp_possible_matches(patient_id uuid) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  k          constant integer := 5;  -- k-anonymity: a pattern shared by fewer than k cohort rows is not shown
  min_shared constant integer := 4;  -- a cohort row matches when it shares at least this many codes
  answer     jsonb;
begin
  if not exists (
    select 1 from __SCHEMA__.grants g
    join __SCHEMA__.profiles d on d.id = g.doctor_id and d.role = 'doctor'
    where g.doctor_id = (select auth.uid()) and g.patient_id = healthapp_possible_matches.patient_id
      and g.status = 'active' and g.revoked_at is null and g.expires_at > now()
  ) then
    raise exception 'possible matches: only a doctor with a live grant for this patient'
      using errcode = '42501';
  end if;

  with me as (
    select __SCHEMA__.match_patient_codes(p.id) as codes
    from __SCHEMA__.profiles p
    where p.id = healthapp_possible_matches.patient_id and p.role = 'patient' and p.matching_opt_in
  ), shared as (
    select array(select c from unnest(m.codes) c where c = any (co.codes) order by c collate "C") as pattern,
           co.country
    from me m cross join __SCHEMA__.match_cohort co
    where co.matching_opt_in
  ), grouped as (
    select s.pattern, count(*)::integer as n,
           array_agg(distinct s.country collate "C" order by s.country collate "C") as countries
    from shared s
    where cardinality(s.pattern) >= min_shared
    group by s.pattern
    having count(*) >= k
  )
  select jsonb_build_object(
           'match_count', coalesce(sum(g.n), 0),
           'groups', coalesce(jsonb_agg(jsonb_build_object('n', g.n, 'pattern', to_jsonb(g.pattern),
                                                           'countries', to_jsonb(g.countries),
                                                           'label', 'seeded, synthetic')
                                        order by g.n desc, g.pattern collate "C"), '[]'::jsonb))
    into answer
  from grouped g;
  return answer;
end
$$;

-- RPC, F1: supabase.schema('healthapp_<env>').rpc('healthapp_set_matches_opt_in', { opt_in }).
-- The patient sets her own opt-in; anyone else gets 42501. On: the consent time is set (kept if already on).
-- Off: takes effect at once and clears it.
create or replace function __SCHEMA__.healthapp_set_matches_opt_in(opt_in boolean) returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  answer jsonb;
begin
  if healthapp_set_matches_opt_in.opt_in is null then
    raise exception 'opt_in must be true or false' using errcode = '22004';
  end if;
  update __SCHEMA__.profiles p
     set matching_opt_in    = healthapp_set_matches_opt_in.opt_in,
         matching_opt_in_at = case when not healthapp_set_matches_opt_in.opt_in then null
                                   when p.matching_opt_in then p.matching_opt_in_at
                                   else now() end
   where p.id = (select auth.uid()) and p.role = 'patient'
  returning jsonb_build_object('matching_opt_in', p.matching_opt_in, 'matching_opt_in_at', p.matching_opt_in_at)
    into answer;
  if answer is null then
    raise exception 'matches opt-in: only the patient herself' using errcode = '42501';
  end if;
  return answer;
end
$$;

-- RPC, F1 screen load: supabase.schema('healthapp_<env>').rpc('healthapp_get_matches_opt_in').
-- The patient reads her own opt-in. profiles.matching_opt_in is not granted to any client role (010,
-- MIN-4484), so a doctor in a grant cannot read it: the flag reaches the patient through this only.
create or replace function __SCHEMA__.healthapp_get_matches_opt_in() returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  answer jsonb;
begin
  select jsonb_build_object('matching_opt_in', p.matching_opt_in, 'matching_opt_in_at', p.matching_opt_in_at)
    into answer
  from __SCHEMA__.profiles p where p.id = (select auth.uid()) and p.role = 'patient';
  if answer is null then
    raise exception 'matches opt-in: only the patient herself' using errcode = '42501';
  end if;
  return answer;
end
$$;

-- Postgres gives EXECUTE to PUBLIC on every new function (001): take it away, then give back exactly three.
revoke execute on function __SCHEMA__.match_fold(text), __SCHEMA__.match_lab_codes(text, numeric),
  __SCHEMA__.match_patient_codes(uuid), __SCHEMA__.healthapp_possible_matches(uuid),
  __SCHEMA__.healthapp_set_matches_opt_in(boolean), __SCHEMA__.healthapp_get_matches_opt_in()
  from public, anon, authenticated;
grant execute on function __SCHEMA__.healthapp_possible_matches(uuid),
  __SCHEMA__.healthapp_set_matches_opt_in(boolean), __SCHEMA__.healthapp_get_matches_opt_in() to authenticated;
grant execute on function __SCHEMA__.match_fold(text), __SCHEMA__.match_lab_codes(text, numeric),
  __SCHEMA__.match_patient_codes(uuid), __SCHEMA__.healthapp_possible_matches(uuid),
  __SCHEMA__.healthapp_set_matches_opt_in(boolean), __SCHEMA__.healthapp_get_matches_opt_in() to service_role;

notify pgrst, 'reload schema';

insert into __SCHEMA__._applied (file) values ('005_matches.sql') on conflict (file) do nothing;
