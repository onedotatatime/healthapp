-- SQL-level RLS checks for the grants (MIN-4484 D1/D2) and the patient-gets-nothing rules (MIN-4481
-- C1/C2). Renders with __SCHEMA__ -> healthapp_dev. Needs qa_users_setup.sql applied (QA patient,
-- two QA doctors, one confirmed record) and leaves nothing behind: every row it writes and every
-- policy it weakens is undone inside the statement (rollback). It uses the real policies, as the real
-- role `authenticated` with a real user's claims, exactly what PostgREST does for a session.
-- Output: one row per check: baseline (what the shipped policies give), expected, and `control_got`
-- (what the same check returns once the thing it guards is removed). A check passes when
-- baseline = expected AND control_got <> expected: that is, it can fail.
-- Time is moved, not waited for: an expired grant is one whose expires_at is a second in the past.
create or replace function pg_temp.as_user(uid uuid, q text, mode text) returns text
language plpgsql as $f$
declare n bigint;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
  if mode = 'count' then
    execute 'select count(*) from (' || q || ') s' into n;
    reset role;
    return n::text;
  else
    execute q;
    reset role;
    return 'ok';
  end if;
exception when others then
  reset role;
  return 'ERR ' || sqlstate;
end $f$;

create or replace function pg_temp.scenario() returns jsonb
language plpgsql as $f$
declare
  P  uuid := '7a000000-0000-4000-8000-000000000001';
  D1 uuid := '7a000000-0000-4000-8000-000000000002';
  D2 uuid := '7a000000-0000-4000-8000-000000000003';
  OSD uuid := 'a417699b-3fdb-453d-ba02-e1a2f5fbff7d'; -- signed in, no profile
  P2 uuid;
  G  uuid;
  r  jsonb := '{}';
  t  text;
begin
  select id into P2 from __SCHEMA__.profiles where role = 'patient' and id <> P limit 1;
  insert into __SCHEMA__.diary_entries (patient_id, text, severity) values (P2, 'other patient diary', 2);
  insert into __SCHEMA__.documents (patient_id, kind, status, confirmed_at) values (P2, 'blood_test', 'confirmed', now());
  -- helper: counts of P's four record tables as a doctor
  -- 1. no grant at all
  r := r || jsonb_build_object(
    'no_grant.documents', pg_temp.as_user(D1, format('select 1 from __SCHEMA__.documents where patient_id = %L', P), 'count'),
    'no_grant.results',   pg_temp.as_user(D1, format('select 1 from __SCHEMA__.results where patient_id = %L', P), 'count'),
    'no_grant.findings',  pg_temp.as_user(D1, format('select 1 from __SCHEMA__.findings where patient_id = %L', P), 'count'),
    'no_grant.diary',     pg_temp.as_user(D1, format('select 1 from __SCHEMA__.diary_entries where patient_id = %L', P), 'count'),
    'no_grant.profile',   pg_temp.as_user(D1, format('select 1 from __SCHEMA__.profiles where id = %L', P), 'count'));
  -- 2. a pending grant opens nothing
  insert into __SCHEMA__.grants (patient_id, doctor_id, status, expires_at)
    values (P, D1, 'pending', now() + interval '2 minutes') returning id into G;
  r := r || jsonb_build_object(
    'pending.documents', pg_temp.as_user(D1, format('select 1 from __SCHEMA__.documents where patient_id = %L', P), 'count'),
    'pending.results',   pg_temp.as_user(D1, format('select 1 from __SCHEMA__.results where patient_id = %L', P), 'count'));
  -- 3. approved for 15 minutes: the doctor reads, a second doctor does not
  update __SCHEMA__.grants set status = 'active', approved_at = now(), expires_at = now() + interval '15 minutes' where id = G;
  insert into __SCHEMA__.assistant_turns (grant_id, doctor_id, patient_id, mode, answer)
    values (G, D1, P, 'causes', '{}'::jsonb);
  r := r || jsonb_build_object(
    'active.documents', pg_temp.as_user(D1, format('select 1 from __SCHEMA__.documents where patient_id = %L', P), 'count'),
    'active.results',   pg_temp.as_user(D1, format('select 1 from __SCHEMA__.results where patient_id = %L', P), 'count'),
    'active.findings',  pg_temp.as_user(D1, format('select 1 from __SCHEMA__.findings where patient_id = %L', P), 'count'),
    'active.diary',     pg_temp.as_user(D1, format('select 1 from __SCHEMA__.diary_entries where patient_id = %L', P), 'count'),
    'active.profile_name_and_specialty', pg_temp.as_user(D1, format('select id, role, full_name, specialty from __SCHEMA__.profiles where id = %L', P), 'count'),
    'active.assistant_turns_own', pg_temp.as_user(D1, 'select 1 from __SCHEMA__.assistant_turns', 'count'),
    'second_doctor.documents', pg_temp.as_user(D2, format('select 1 from __SCHEMA__.documents where patient_id = %L', P), 'count'),
    'second_doctor.results',   pg_temp.as_user(D2, format('select 1 from __SCHEMA__.results where patient_id = %L', P), 'count'),
    'second_doctor.diary',     pg_temp.as_user(D2, format('select 1 from __SCHEMA__.diary_entries where patient_id = %L', P), 'count'),
    'second_doctor.grants_seen', pg_temp.as_user(D2, 'select 1 from __SCHEMA__.grants', 'count'),
    'second_doctor.assistant_turns', pg_temp.as_user(D2, 'select 1 from __SCHEMA__.assistant_turns', 'count'),
    'patient.assistant_turns', pg_temp.as_user(P, 'select 1 from __SCHEMA__.assistant_turns', 'count'),
    'patient.other_patient_diary', pg_temp.as_user(P, format('select 1 from __SCHEMA__.diary_entries where patient_id = %L', P2), 'count'),
    'patient.other_patient_documents', pg_temp.as_user(P, format('select 1 from __SCHEMA__.documents where patient_id = %L', P2), 'count'));
  -- the match keys never reach a client role, a live grant or not
  r := r || jsonb_build_object(
    'doctor_in_grant.national_id_norm', pg_temp.as_user(D1, format('select national_id_norm from __SCHEMA__.profiles where id = %L', P), 'count'),
    'doctor_in_grant.full_name_norm',   pg_temp.as_user(D1, format('select full_name_norm from __SCHEMA__.profiles where id = %L', P), 'count'),
    'patient.own_national_id_norm',     pg_temp.as_user(P, format('select national_id_norm from __SCHEMA__.profiles where id = %L', P), 'count'),
    'doctor_in_grant.select_star',      pg_temp.as_user(D1, format('select * from __SCHEMA__.profiles where id = %L', P), 'count'));
  -- 4. revoked: at once 0
  update __SCHEMA__.grants set status = 'revoked', revoked_at = now() where id = G;
  r := r || jsonb_build_object(
    'revoked.documents', pg_temp.as_user(D1, format('select 1 from __SCHEMA__.documents where patient_id = %L', P), 'count'),
    'revoked.results',   pg_temp.as_user(D1, format('select 1 from __SCHEMA__.results where patient_id = %L', P), 'count'),
    'revoked.diary',     pg_temp.as_user(D1, format('select 1 from __SCHEMA__.diary_entries where patient_id = %L', P), 'count'),
    'revoked.assistant_turns', pg_temp.as_user(D1, 'select 1 from __SCHEMA__.assistant_turns', 'count'));
  -- 5. past its end: the stored status still says active, the policy says no
  update __SCHEMA__.grants set status = 'active', revoked_at = null, approved_at = now() - interval '15 minutes',
         expires_at = now() - interval '1 second' where id = G;
  r := r || jsonb_build_object(
    'expired.stored_status_is_active', (select status from __SCHEMA__.grants where id = G),
    'expired.documents', pg_temp.as_user(D1, format('select 1 from __SCHEMA__.documents where patient_id = %L', P), 'count'),
    'expired.results',   pg_temp.as_user(D1, format('select 1 from __SCHEMA__.results where patient_id = %L', P), 'count'),
    'expired.diary',     pg_temp.as_user(D1, format('select 1 from __SCHEMA__.diary_entries where patient_id = %L', P), 'count'),
    'expired.assistant_turns', pg_temp.as_user(D1, 'select 1 from __SCHEMA__.assistant_turns', 'count'));
  -- 6. the diary insert (C1) and its refusals (C2)
  r := r || jsonb_build_object(
    'diary.patient_inserts_own', pg_temp.as_user(P, format('insert into __SCHEMA__.diary_entries (text, severity, occurred_at) values (%L, 4, now() - interval %L)', 'headache', '1 hour'), 'run'),
    'diary.patient_inserts_for_another', pg_temp.as_user(P, format('insert into __SCHEMA__.diary_entries (patient_id, text, severity) values (%L, %L, 4)', P2, 'x'), 'run'),
    'diary.client_sends_recorded_at', pg_temp.as_user(P, format('insert into __SCHEMA__.diary_entries (text, severity, recorded_at) values (%L, 4, %L)', 'x', '2020-01-01'), 'run'),
    'diary.doctor_inserts', pg_temp.as_user(D1, format('insert into __SCHEMA__.diary_entries (patient_id, text, severity) values (%L, %L, 4)', D1, 'x'), 'run'),
    'diary.doctor_inserts_for_patient', pg_temp.as_user(D1, format('insert into __SCHEMA__.diary_entries (patient_id, text, severity) values (%L, %L, 4)', P, 'x'), 'run'),
    'diary.outsider_inserts', pg_temp.as_user(OSD, format('insert into __SCHEMA__.diary_entries (patient_id, text, severity) values (%L, %L, 4)', OSD, 'x'), 'run'),
    'diary.severity_out_of_range', pg_temp.as_user(P, format('insert into __SCHEMA__.diary_entries (text, severity) values (%L, 11)', 'x'), 'run'));
  -- a separate statement on purpose: Postgres does not promise an order for function arguments
  r := r || jsonb_build_object('diary.server_stamp_and_edit_mark', (select format('recorded_at_is_now=%s time_edited=%s',
        abs(extract(epoch from (recorded_at - now()))) < 2, time_edited)
        from __SCHEMA__.diary_entries where patient_id = P and text = 'headache'));
  r := r || jsonb_build_object(
    'tokens.patient_reads', pg_temp.as_user(P, 'select 1 from __SCHEMA__.handshake_tokens', 'count'),
    'tokens.doctor_reads', pg_temp.as_user(D1, 'select 1 from __SCHEMA__.handshake_tokens', 'count'),
    'rate_events.doctor_reads', pg_temp.as_user(D1, 'select 1 from __SCHEMA__.rate_events', 'count'),
    'grants.patient_updates', pg_temp.as_user(P, format('update __SCHEMA__.grants set status = %L where id = %L', 'active', G), 'run'),
    'grants.doctor_inserts', pg_temp.as_user(D2, format('insert into __SCHEMA__.grants (patient_id, doctor_id, status, expires_at) values (%L, %L, %L, now() + interval %L)', P, D2, 'active', '1 hour'), 'run'));
  -- 8. signed in with no profile: nothing, anywhere
  select string_agg(pg_temp.as_user(OSD, 'select 1 from __SCHEMA__.' || x, 'count'), ',' order by x) into t
    from unnest(array['profiles','documents','results','findings','diary_entries','grants','assistant_turns']) x;
  r := r || jsonb_build_object('outsider.every_table_in_order', t);
  return r;
end $f$;

-- Runs the scenario with one control DDL applied, then undoes the DDL and every fixture row.
create or replace function pg_temp.with_control(ddl text) returns jsonb
language plpgsql as $f$
declare v jsonb;
begin
  begin
    if ddl <> '' then execute ddl; end if;
    v := pg_temp.scenario();
    raise exception 'undo';
  exception when others then
    if sqlerrm <> 'undo' then raise; end if;
  end;
  return v;
end $f$;

create table pg_temp.report (check_name text, expected text, baseline text, control text, control_got text, passes boolean);

do $run$
declare
  base jsonb := pg_temp.with_control('');
  exp jsonb := jsonb_build_object(
    'no_grant.documents','0','no_grant.results','0','no_grant.findings','0','no_grant.diary','0','no_grant.profile','0',
    'pending.documents','0','pending.results','0',
    'active.documents','1','active.results','1','active.findings','1','active.diary','1',
    'active.profile_name_and_specialty','1','active.assistant_turns_own','1',
    'second_doctor.documents','0','second_doctor.results','0','second_doctor.diary','0','second_doctor.grants_seen','0',
    'second_doctor.assistant_turns','0','patient.assistant_turns','0','patient.other_patient_diary','0','patient.other_patient_documents','0',
    'doctor_in_grant.national_id_norm','ERR 42501','doctor_in_grant.full_name_norm','ERR 42501',
    'patient.own_national_id_norm','ERR 42501','doctor_in_grant.select_star','ERR 42501',
    'revoked.documents','0','revoked.results','0','revoked.diary','0','revoked.assistant_turns','0',
    'expired.stored_status_is_active','active','expired.documents','0','expired.results','0','expired.diary','0','expired.assistant_turns','0',
    'diary.patient_inserts_own','ok','diary.patient_inserts_for_another','ERR 42501','diary.client_sends_recorded_at','ERR 42501',
    'diary.doctor_inserts','ERR 42501','diary.doctor_inserts_for_patient','ERR 42501','diary.outsider_inserts','ERR 42501',
    'diary.severity_out_of_range','ERR 23514','diary.server_stamp_and_edit_mark','recorded_at_is_now=t time_edited=t',
    'tokens.patient_reads','ERR 42501','tokens.doctor_reads','ERR 42501','rate_events.doctor_reads','ERR 42501',
    'grants.patient_updates','ERR 42501','grants.doctor_inserts','ERR 42501',
    'outsider.every_table_in_order','0,0,0,0,0,0,0');
  k text;
  -- control: (check keys it must turn red, ddl that removes the guard)
  ctl record;
  cv jsonb;
begin
  -- the baseline: every shipped check
  for k in select jsonb_object_keys(exp) loop
    insert into pg_temp.report values (k, exp->>k, base->>k, '', null, (base->>k) = (exp->>k));
  end loop;
  -- the controls: remove one guard, re-run, and the checks that guard it must go red
  for ctl in select * from (values
    ('open policy on documents (using true)', array['no_grant.documents','second_doctor.documents','patient.other_patient_documents'],
     'create policy ctl_open on __SCHEMA__.documents for select to authenticated using (true)'),
    ('doctor policy without the doctor test (and grants readable by all)', array['second_doctor.documents'],
     'drop policy grants_parties on __SCHEMA__.grants; create policy grants_parties on __SCHEMA__.grants for select to authenticated using (true); drop policy documents_doctor_in_grant on __SCHEMA__.documents; create policy documents_doctor_in_grant on __SCHEMA__.documents for select to authenticated using (status = ''confirmed'' and exists (select 1 from __SCHEMA__.grants g where g.patient_id = documents.patient_id and g.status = ''active'' and g.revoked_at is null and g.expires_at > now()))'),
    ('doctor policy without the end time', array['expired.documents'],
     'drop policy documents_doctor_in_grant on __SCHEMA__.documents; create policy documents_doctor_in_grant on __SCHEMA__.documents for select to authenticated using (status = ''confirmed'' and exists (select 1 from __SCHEMA__.grants g where g.patient_id = documents.patient_id and g.doctor_id = (select auth.uid()) and g.status = ''active'' and g.revoked_at is null))'),
    ('doctor policy without status or revoke test', array['revoked.documents','pending.documents'],
     'drop policy documents_doctor_in_grant on __SCHEMA__.documents; create policy documents_doctor_in_grant on __SCHEMA__.documents for select to authenticated using (status = ''confirmed'' and exists (select 1 from __SCHEMA__.grants g where g.patient_id = documents.patient_id and g.doctor_id = (select auth.uid()) and g.expires_at > now()))'),
    ('results policy without the end time', array['expired.results'],
     'drop policy results_doctor_in_grant on __SCHEMA__.results; create policy results_doctor_in_grant on __SCHEMA__.results for select to authenticated using (exists (select 1 from __SCHEMA__.grants g where g.patient_id = results.patient_id and g.doctor_id = (select auth.uid()) and g.status = ''active'' and g.revoked_at is null))'),
    ('diary policy without the end time', array['expired.diary'],
     'drop policy diary_doctor_in_grant on __SCHEMA__.diary_entries; create policy diary_doctor_in_grant on __SCHEMA__.diary_entries for select to authenticated using (exists (select 1 from __SCHEMA__.grants g where g.patient_id = diary_entries.patient_id and g.doctor_id = (select auth.uid()) and g.status = ''active'' and g.revoked_at is null))'),
    ('assistant_turns without the end time', array['expired.assistant_turns'],
     'drop policy turns_doctor_in_grant on __SCHEMA__.assistant_turns; create policy turns_doctor_in_grant on __SCHEMA__.assistant_turns for select to authenticated using (doctor_id = (select auth.uid()))'),
    ('a patient policy on assistant_turns', array['patient.assistant_turns'],
     'create policy ctl_patient_turns on __SCHEMA__.assistant_turns for select to authenticated using (patient_id = (select auth.uid()))'),
    ('full select grant on profiles', array['doctor_in_grant.national_id_norm','doctor_in_grant.full_name_norm','patient.own_national_id_norm','doctor_in_grant.select_star'],
     'grant select on __SCHEMA__.profiles to authenticated'),
    ('diary insert check without the patient test', array['diary.patient_inserts_for_another','diary.outsider_inserts','diary.doctor_inserts_for_patient'],
     'drop policy diary_patient_insert on __SCHEMA__.diary_entries; create policy diary_patient_insert on __SCHEMA__.diary_entries for insert to authenticated with check (true)'),
    ('diary insert check without the role test', array['diary.doctor_inserts'],
     'drop policy diary_patient_insert on __SCHEMA__.diary_entries; create policy diary_patient_insert on __SCHEMA__.diary_entries for insert to authenticated with check (patient_id = (select auth.uid()))'),
    ('recorded_at granted to clients', array['diary.client_sends_recorded_at'],
     'grant insert (recorded_at) on __SCHEMA__.diary_entries to authenticated'),
    ('select grant on handshake_tokens and rate_events', array['tokens.patient_reads','tokens.doctor_reads','rate_events.doctor_reads'],
     'grant select on __SCHEMA__.handshake_tokens, __SCHEMA__.rate_events to authenticated; create policy ctl_t on __SCHEMA__.handshake_tokens for select to authenticated using (true); create policy ctl_r on __SCHEMA__.rate_events for select to authenticated using (true)'),
    ('update on grants for clients', array['grants.patient_updates'],
     'grant update on __SCHEMA__.grants to authenticated; create policy ctl_gu on __SCHEMA__.grants for update to authenticated using (true) with check (true)'),
    ('insert on grants for clients', array['grants.doctor_inserts'],
     'grant insert on __SCHEMA__.grants to authenticated; create policy ctl_gi on __SCHEMA__.grants for insert to authenticated with check (true)'),
    ('grants visible to everyone', array['second_doctor.grants_seen'],
     'drop policy grants_parties on __SCHEMA__.grants; create policy grants_parties on __SCHEMA__.grants for select to authenticated using (true)')
  ) as c (name, keys, ddl) loop
    cv := pg_temp.with_control(ctl.ddl);
    foreach k in array ctl.keys loop
      insert into pg_temp.report values (k, exp->>k, base->>k, ctl.name, cv->>k, (base->>k) = (exp->>k) and (cv->>k) <> (exp->>k));
    end loop;
  end loop;
end $run$;

select (select count(*) from pg_temp.report where control = '' and passes) as baseline_pass,
       (select count(*) from pg_temp.report where control = '' and not coalesce(passes, false)) as baseline_fail,
       (select count(*) from pg_temp.report where control <> '' and passes) as controls_seen_red,
       (select count(*) from pg_temp.report where control <> '' and not coalesce(passes, false)) as controls_not_red,
       (select coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb)
          from (select check_name, expected, baseline, control, control_got
                  from pg_temp.report where not coalesce(passes, false)) r) as problems;
