-- Per env. Rendered by `scripts/hdb render <env> 018_matches_codes_once.sql` (__SCHEMA__ -> healthapp_<env>).
-- Possible matches: the patient's codes are computed once per call (MIN-4649, CTO decision on MIN-4649).
-- Needs 005 (the RPC and its tables; refuses to run without it). Replaces healthapp_possible_matches only.
-- Why: in 005 the patient's codes sit in a CTE (me) referenced once, so Postgres folds it into the outer
-- query and match_patient_codes(p.id) moves into the per-row subplans: it ran once per opted-in cohort row,
-- then once per kept row (about 415 calls at 400 rows). It is never inlined (set search_path = ''), and
-- each call reads all of the patient's results, findings and diary (014's negation rules). At about 33
-- confirmed documents one call takes about 30 ms, the RPC took 11 s, and the 8 s statement timeout of
-- `authenticated` cancelled it (HTTP 500, 2026-11-15 01:57 UTC). Here the codes go into a variable first
-- and the query matches against the variable, so match_patient_codes runs once whatever the cohort size.
-- Same answer as 005: the grant check first, k = 5, min_shared = 4, exact-set groups, and the one empty
-- answer {"groups": [], "match_count": 0} for no opt-in, no match and below k.
-- Rollback: re-apply 005's healthapp_possible_matches (no data is touched here).
-- Idempotent; applied in one transaction.

do $$
begin
  if not exists (select 1 from __SCHEMA__._applied where file = '005_matches.sql') then
    raise exception '018_matches_codes_once.sql needs 005_matches.sql';
  end if;
end $$;

-- RPC, F2: supabase.schema('healthapp_<env>').rpc('healthapp_possible_matches', { patient_id }).
-- Callable only by a doctor with a live grant for this patient (expiry in the check, as in 002's policies);
-- anyone else gets SQLSTATE 42501 (HTTP 403 from the Data API). The patient's opt-in is checked when her
-- codes are read, and its absence gives the same empty answer as "no matches".
create or replace function __SCHEMA__.healthapp_possible_matches(patient_id uuid) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  k          constant integer := 5;  -- k-anonymity: a pattern shared by fewer than k cohort rows is not shown
  min_shared constant integer := 4;  -- a cohort row matches when it shares at least this many codes
  my_codes   text[];                 -- the patient's codes, computed once; null when she has not opted in
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

  select __SCHEMA__.match_patient_codes(p.id) into my_codes
  from __SCHEMA__.profiles p
  where p.id = healthapp_possible_matches.patient_id and p.role = 'patient' and p.matching_opt_in;

  with me as (
    select my_codes as codes where my_codes is not null
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

-- CREATE OR REPLACE keeps 005's grants; said again so this file stands alone (hdb check: no PUBLIC EXECUTE).
revoke execute on function __SCHEMA__.healthapp_possible_matches(uuid) from public, anon, authenticated;
grant execute on function __SCHEMA__.healthapp_possible_matches(uuid) to authenticated, service_role;

notify pgrst, 'reload schema';

insert into __SCHEMA__._applied (file) values ('018_matches_codes_once.sql') on conflict (file) do nothing;
