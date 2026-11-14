-- file_analysis access (MIN-4549, CTO on MIN-4548 §1 and §4): a doctor with a live grant reads the analysis of a
-- confirmed document and nothing else; a patient reads none of it ("no patient policy"); nobody writes from a client.
-- Renders with __SCHEMA__ -> healthapp_dev (sed 's/__SCHEMA__/healthapp_dev/g'; hdb render takes top-level files only,
-- so paste the rendered text into execute_sql, or run it with psql). Needs at least one patient with a confirmed document that has a file_analysis row, and a
-- draft one for the same patient when you want the draft check to count. It leaves nothing behind: every fixture
-- row and every control policy is undone inside the statement. Real policies, real role `authenticated`, real claims.
-- Output: one row per check: expected, baseline (the shipped policies), control_got (the same check once the guard is
-- removed). A check passes when baseline = expected AND control_got <> expected: it is able to fail.
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
  P  uuid;  D1 uuid; D2 uuid;
  OSD uuid := gen_random_uuid();                 -- signed in, no profile
  G  uuid;
  confirmed_n int;
  r  jsonb := '{}';
  Q  text := 'select 1 from __SCHEMA__.file_analysis';
begin
  -- the patient with the most analysed, confirmed files, and two doctors
  select d.patient_id into P from __SCHEMA__.file_analysis fa join __SCHEMA__.documents d on d.id = fa.document_id
   where d.status = 'confirmed' group by d.patient_id order by count(*) desc limit 1;
  select count(*) into confirmed_n from __SCHEMA__.file_analysis fa join __SCHEMA__.documents d on d.id = fa.document_id
   where d.status = 'confirmed' and fa.patient_id = P;
  select id into D1 from __SCHEMA__.profiles where role = 'doctor' order by id limit 1;
  select id into D2 from __SCHEMA__.profiles where role = 'doctor' and id <> D1 order by id limit 1;
  update __SCHEMA__.grants set status = 'revoked', revoked_at = now() where patient_id = P and status in ('pending', 'active');
  r := r || jsonb_build_object('fixture.confirmed_analysed_files_of_the_patient', confirmed_n::text);
  -- 1. no grant, 2. a pending grant
  r := r || jsonb_build_object('no_grant.doctor', pg_temp.as_user(D1, Q, 'count'));
  insert into __SCHEMA__.grants (patient_id, doctor_id, status, expires_at) values (P, D1, 'pending', now() + interval '2 minutes') returning id into G;
  r := r || jsonb_build_object('pending.doctor', pg_temp.as_user(D1, Q, 'count'));
  -- 3. active: the doctor reads the confirmed documents' analyses, a second doctor does not, the patient does not
  update __SCHEMA__.grants set status = 'active', approved_at = now(), expires_at = now() + interval '15 minutes' where id = G;
  r := r || jsonb_build_object(
    'active.doctor_reads_confirmed_only', (pg_temp.as_user(D1, Q, 'count') = confirmed_n::text)::text,
    'active.second_doctor', pg_temp.as_user(D2, Q, 'count'),
    'active.patient', pg_temp.as_user(P, Q, 'count'),
    'active.outsider', pg_temp.as_user(OSD, Q, 'count'),
    'active.anon_table_read', (select count(*)::text from information_schema.role_table_grants
                                where table_schema = '__SCHEMA__' and table_name = 'file_analysis' and grantee in ('anon', 'PUBLIC')));
  -- a draft document's analysis is not shown to the doctor (the documents policy shows confirmed ones only)
  update __SCHEMA__.documents set status = 'draft', confirmed_at = null
   where id = (select fa.document_id from __SCHEMA__.file_analysis fa join __SCHEMA__.documents d on d.id = fa.document_id
                where fa.patient_id = P and d.status = 'confirmed' limit 1);
  r := r || jsonb_build_object('active.doctor_after_one_document_is_a_draft', (pg_temp.as_user(D1, Q, 'count') = (confirmed_n - 1)::text)::text);
  -- 4. nobody writes from a client: patient, the doctor of the grant, an outsider
  r := r || jsonb_build_object(
    'write.patient_update', pg_temp.as_user(P, 'update __SCHEMA__.file_analysis set items_count = 0', 'run'),
    'write.patient_delete', pg_temp.as_user(P, 'delete from __SCHEMA__.file_analysis', 'run'),
    'write.doctor_update', pg_temp.as_user(D1, 'update __SCHEMA__.file_analysis set items_count = 0', 'run'),
    'write.doctor_delete', pg_temp.as_user(D1, 'delete from __SCHEMA__.file_analysis', 'run'),
    'write.doctor_insert', pg_temp.as_user(D1, format('insert into __SCHEMA__.file_analysis (document_id, patient_id, status, error_code) select id, patient_id, %L, %L from __SCHEMA__.documents limit 1', 'failed', 'error'), 'run'));
  -- 5. revoked: at once 0; past its end: the stored status still says active, the policy says no
  update __SCHEMA__.grants set status = 'revoked', revoked_at = now() where id = G;
  r := r || jsonb_build_object('revoked.doctor', pg_temp.as_user(D1, Q, 'count'));
  update __SCHEMA__.grants set status = 'active', revoked_at = null, approved_at = now() - interval '15 minutes', expires_at = now() - interval '1 second' where id = G;
  r := r || jsonb_build_object('expired.doctor', pg_temp.as_user(D1, Q, 'count'));
  return r;
end $f$;

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
    'no_grant.doctor','0','pending.doctor','0',
    'active.doctor_reads_confirmed_only','true','active.second_doctor','0','active.patient','0','active.outsider','0',
    'active.anon_table_read','0','active.doctor_after_one_document_is_a_draft','true',
    'write.patient_update','ERR 42501','write.patient_delete','ERR 42501','write.doctor_update','ERR 42501',
    'write.doctor_delete','ERR 42501','write.doctor_insert','ERR 42501','revoked.doctor','0','expired.doctor','0');
  k text; ctl record; cv jsonb;
  -- The policy reads grants and documents, and those reads are themselves filtered by RLS for the caller, so a
  -- second doctor, a revoked or an expired grant is hidden twice. A control that weakens only this table's own
  -- clauses therefore also opens those two reads, so that the clause it removes is the only thing deciding.
  opened constant text := 'create policy ctl_docs_open on __SCHEMA__.documents for select to authenticated using (true); create policy ctl_grants_open on __SCHEMA__.grants for select to authenticated using (true); ';
begin
  -- (a client update or delete has no UPDATE or DELETE grant: refused 42501 before any policy is read)
  for k in select jsonb_object_keys(exp) loop
    insert into pg_temp.report values (k, exp->>k, base->>k, '', null, (base->>k) = (exp->>k));
  end loop;
  for ctl in select * from (values
    ('a patient policy on file_analysis', array['active.patient'],
     'create policy ctl_patient on __SCHEMA__.file_analysis for select to authenticated using (patient_id = (select auth.uid()))'),
    ('an open policy (using true)', array['no_grant.doctor','pending.doctor','active.second_doctor','active.patient','active.outsider','revoked.doctor','expired.doctor'],
     'create policy ctl_open on __SCHEMA__.file_analysis for select to authenticated using (true)'),
    ('the doctor policy without the confirmed-document test', array['active.doctor_after_one_document_is_a_draft'],
     'drop policy file_analysis_doctor_in_grant on __SCHEMA__.file_analysis; create policy file_analysis_doctor_in_grant on __SCHEMA__.file_analysis for select to authenticated using (exists (select 1 from __SCHEMA__.grants g where g.patient_id = file_analysis.patient_id and g.doctor_id = (select auth.uid()) and g.status = ''active'' and g.revoked_at is null and g.expires_at > now()))'),
    ('the doctor policy without the end time', array['expired.doctor'],
     opened || 'drop policy file_analysis_doctor_in_grant on __SCHEMA__.file_analysis; create policy file_analysis_doctor_in_grant on __SCHEMA__.file_analysis for select to authenticated using (exists (select 1 from __SCHEMA__.grants g where g.patient_id = file_analysis.patient_id and g.doctor_id = (select auth.uid()) and g.status = ''active'' and g.revoked_at is null) and exists (select 1 from __SCHEMA__.documents d where d.id = file_analysis.document_id and d.status = ''confirmed''))'),
    ('the doctor policy without the doctor test', array['active.second_doctor'],
     opened || 'drop policy file_analysis_doctor_in_grant on __SCHEMA__.file_analysis; create policy file_analysis_doctor_in_grant on __SCHEMA__.file_analysis for select to authenticated using (exists (select 1 from __SCHEMA__.grants g where g.patient_id = file_analysis.patient_id and g.status = ''active'' and g.revoked_at is null and g.expires_at > now()) and exists (select 1 from __SCHEMA__.documents d where d.id = file_analysis.document_id and d.status = ''confirmed''))'),
    ('the doctor policy without the revoke test', array['revoked.doctor'],
     opened || 'drop policy file_analysis_doctor_in_grant on __SCHEMA__.file_analysis; create policy file_analysis_doctor_in_grant on __SCHEMA__.file_analysis for select to authenticated using (exists (select 1 from __SCHEMA__.grants g where g.patient_id = file_analysis.patient_id and g.doctor_id = (select auth.uid()) and g.expires_at > now()) and exists (select 1 from __SCHEMA__.documents d where d.id = file_analysis.document_id and d.status = ''confirmed''))'),
    ('update and delete granted to authenticated plus open policies', array['write.patient_update','write.patient_delete','write.doctor_update','write.doctor_delete'],
     'grant update, delete on __SCHEMA__.file_analysis to authenticated; create policy ctl_upd on __SCHEMA__.file_analysis for update to authenticated using (true) with check (true); create policy ctl_del on __SCHEMA__.file_analysis for delete to authenticated using (true)'),
    ('an insert grant for authenticated plus an open insert policy', array['write.doctor_insert'],
     'grant insert on __SCHEMA__.file_analysis to authenticated; create policy ctl_ins on __SCHEMA__.file_analysis for insert to authenticated with check (true)')
  ) as c(label, keys, ddl) loop
    cv := pg_temp.with_control(ctl.ddl);
    foreach k in array ctl.keys loop
      update pg_temp.report set control = ctl.label, control_got = cv->>k, passes = passes and (cv->>k) <> expected where check_name = k and control = '';
      if not found then
        insert into pg_temp.report select k, exp->>k, base->>k, ctl.label, cv->>k, (base->>k) = (exp->>k) and (cv->>k) <> (exp->>k);
      end if;
    end loop;
  end loop;
end $run$;

select check_name, expected, baseline, control, control_got, passes from pg_temp.report order by check_name, control;
