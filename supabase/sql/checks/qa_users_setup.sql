-- QA fixtures for the grant checks (MIN-4484). NOT a migration: never rendered by hdb, never run on
-- healthapp_demo. Three throwaway synthetic users (a patient with one confirmed record, two doctors)
-- with a known bcrypt hash, so real tokens can be had from GoTrue without touching the persona
-- password. Replace __PWHASH__ with a bcrypt hash (htpasswd -bnBC 10 "" "$PW" | tr -d ':\n') and
-- __SCHEMA__ with healthapp_dev. Remove with qa_users_teardown.sql when the checks are done.
begin;
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                        confirmation_token, recovery_token, email_change_token_new, email_change)
select '00000000-0000-0000-0000-000000000000', q.id, 'authenticated', 'authenticated', q.email, '__PWHASH__', now(),
       '{"app":"healthapp","env":"dev","provider":"email","providers":["email"]}'::jsonb,
       '{"email_verified":true}'::jsonb, now(), now(), '', '', '', ''
from (values
  ('7a000000-0000-4000-8000-000000000001'::uuid, 'qa-patient.dev@healthapp.invalid'),
  ('7a000000-0000-4000-8000-000000000002'::uuid, 'qa-doctor.dev@healthapp.invalid'),
  ('7a000000-0000-4000-8000-000000000003'::uuid, 'qa-doctor2.dev@healthapp.invalid')
) as q (id, email)
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, 'email',
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true), now(), now(), now()
from auth.users u where u.email like 'qa-%.dev@healthapp.invalid'
  and not exists (select 1 from auth.identities i where i.user_id = u.id);

insert into __SCHEMA__.profiles (id, role, full_name, full_name_latin, full_name_norm, national_id_norm, specialty, org_type)
values
 ('7a000000-0000-4000-8000-000000000001', 'patient', 'QA Patient', 'QA Patient', 'QA PATIENT', 'QA000001', null, null),
 ('7a000000-0000-4000-8000-000000000002', 'doctor', 'QA Doctor One', 'QA Doctor One', 'QA DOCTOR ONE', null, 'Cardiology', 'provider'),
 ('7a000000-0000-4000-8000-000000000003', 'doctor', 'QA Doctor Two', 'QA Doctor Two', 'QA DOCTOR TWO', null, 'Neurology', 'provider')
on conflict (id) do nothing;

-- One confirmed blood test (a result and a finding) and one diary entry for the patient.
insert into __SCHEMA__.documents (id, patient_id, kind, language, exam_date, issuer, identity_status, status, confirmed_at)
values ('7a000000-0000-4000-8000-0000000000d1', '7a000000-0000-4000-8000-000000000001', 'blood_test', 'en',
        '2026-11-01', 'QA Lab', 'match', 'confirmed', now())
on conflict (id) do nothing;
insert into __SCHEMA__.results (id, document_id, patient_id, analyte, analyte_key, value_num, unit, ref_low, ref_high, flag)
values ('7a000000-0000-4000-8000-0000000000e1', '7a000000-0000-4000-8000-0000000000d1',
        '7a000000-0000-4000-8000-000000000001', 'QA analyte', 'qa_analyte', 5.1, 'mg/L', 0, 3, 'high')
on conflict (id) do nothing;
insert into __SCHEMA__.findings (id, document_id, patient_id, kind, text_original, text_lang)
values ('7a000000-0000-4000-8000-0000000000f1', '7a000000-0000-4000-8000-0000000000d1',
        '7a000000-0000-4000-8000-000000000001', 'note', 'QA finding text', 'en')
on conflict (id) do nothing;
insert into __SCHEMA__.diary_entries (id, patient_id, text, severity)
values ('7a000000-0000-4000-8000-0000000000a1', '7a000000-0000-4000-8000-000000000001', 'QA diary entry', 3)
on conflict (id) do nothing;
commit;
