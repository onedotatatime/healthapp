-- Per env. Rendered by `scripts/hdb render <env> 002_core.sql` (__SCHEMA__ -> healthapp_<env>).
-- The P0 tables of PRD 10.3 (MIN-4471): profiles, documents, results, findings, diary_entries,
-- handshake_tokens, grants, assistant_turns, plus rate_events for the server's rate limits.
-- MIN-4449 decision 1.3: RLS on every table; no policy for anon or public; no `using (true)`.
-- "Signed in" proves nothing here (Conductor's users share auth.users), so every policy ties the
-- caller to their own row in profiles, or to a live grant with its expiry in the policy itself.
-- A table with a select policy and no write policy cannot be written by clients: the absence is
-- the rule. Profiles, documents, results, findings, tokens, grants and turns are written by
-- Edge Functions only. Applied in one transaction; idempotent where it is cheap to be.

-- profiles: one row per healthapp user, written by the seed (service role) only. ---------------
create table if not exists __SCHEMA__.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  role             text not null check (role in ('patient', 'doctor')),
  full_name        text not null,
  full_name_latin  text,
  full_name_norm   text,          -- loose match key (B1 owns the normaliser)
  national_id_norm text,          -- exact-match key, uppercased, no spaces or dashes
  specialty        text,
  org_type         text check (org_type in ('provider')),
  matching_opt_in  boolean not null default false,
  created_at       timestamptz not null default now()
);

-- grants: the time-limited access of one doctor to one patient. -----------------------------
create table if not exists __SCHEMA__.grants (
  id           uuid primary key default gen_random_uuid(),
  patient_id   uuid not null references __SCHEMA__.profiles (id) on delete cascade,
  doctor_id    uuid not null references __SCHEMA__.profiles (id) on delete cascade,
  status       text not null default 'pending'
               check (status in ('pending', 'active', 'refused', 'expired', 'revoked')),
  requested_at timestamptz not null default now(),
  approved_at  timestamptz,
  expires_at   timestamptz,
  revoked_at   timestamptz,
  check (patient_id <> doctor_id)
);
create index if not exists grants_doctor_idx on __SCHEMA__.grants (doctor_id, status);
create index if not exists grants_patient_idx on __SCHEMA__.grants (patient_id, status);

-- documents --------------------------------------------------------------------------------
create table if not exists __SCHEMA__.documents (
  id                 uuid primary key default gen_random_uuid(),
  patient_id         uuid not null references __SCHEMA__.profiles (id) on delete cascade,
  kind               text check (kind in ('blood_test', 'imaging_report', 'doctor_letter')),
  language           text check (language in ('el', 'en')),
  exam_date          date,
  issuer             text,
  printed_name       text,
  printed_id         text,
  identity_status    text check (identity_status in ('match', 'name_only')),
  provenance         text not null default 'uploaded_by_patient'
                     check (provenance in ('uploaded_by_patient', 'verified_by_source')),
  status             text not null default 'draft' check (status in ('draft', 'confirmed')),
  storage_path       text,        -- <patient uuid>/<document uuid>
  content_type       text,
  sha256_file        text,
  sha256_record      text,
  extract_confidence jsonb,
  created_at         timestamptz not null default now(),
  confirmed_at       timestamptz,
  check (status = 'draft' or kind is not null)
);
create index if not exists documents_patient_idx on __SCHEMA__.documents (patient_id, status);

-- results: one row per value. patient_id is carried so the policy needs no join. -------------
create table if not exists __SCHEMA__.results (
  id                uuid primary key default gen_random_uuid(),
  document_id       uuid not null references __SCHEMA__.documents (id) on delete cascade,
  patient_id        uuid not null references __SCHEMA__.profiles (id) on delete cascade,
  analyte           text not null,
  analyte_key       text,
  value_num         numeric,
  value_text        text,
  unit              text,
  ref_low           numeric,
  ref_high          numeric,
  ref_text          text,
  flag              text not null default 'unknown' check (flag in ('low', 'high', 'normal', 'unknown')),
  confidence        real check (confidence between 0 and 1),
  edited_by_patient boolean not null default false
);
create index if not exists results_document_idx on __SCHEMA__.results (document_id);
create index if not exists results_patient_idx on __SCHEMA__.results (patient_id, analyte_key);

-- findings: the document's own words. ------------------------------------------------------
create table if not exists __SCHEMA__.findings (
  id                uuid primary key default gen_random_uuid(),
  document_id       uuid not null references __SCHEMA__.documents (id) on delete cascade,
  patient_id        uuid not null references __SCHEMA__.profiles (id) on delete cascade,
  kind              text not null check (kind in ('conclusion', 'written_diagnosis', 'medication', 'note')),
  text_original     text not null,
  text_lang         text check (text_lang in ('el', 'en')),
  finding_date      date,
  specialty         text,
  confidence        real check (confidence between 0 and 1),
  edited_by_patient boolean not null default false
);
create index if not exists findings_document_idx on __SCHEMA__.findings (document_id);
create index if not exists findings_patient_idx on __SCHEMA__.findings (patient_id);

-- diary_entries: the only table a client writes (settlement 12), insert only. ----------------
create table if not exists __SCHEMA__.diary_entries (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null default auth.uid() references __SCHEMA__.profiles (id) on delete cascade,
  occurred_at timestamptz not null default now(),
  recorded_at timestamptz not null default now(),
  time_edited boolean generated always as (abs(extract(epoch from (occurred_at - recorded_at))) > 300) stored,
  text        text not null check (char_length(text) between 1 and 2000),
  severity    smallint not null check (severity between 1 and 10)
);
create index if not exists diary_patient_idx on __SCHEMA__.diary_entries (patient_id, occurred_at desc);

-- handshake_tokens: nobody reads or writes them from a client. ------------------------------
create table if not exists __SCHEMA__.handshake_tokens (
  jti        text primary key,
  short_code text not null unique,
  patient_id uuid not null references __SCHEMA__.profiles (id) on delete cascade,
  expires_at timestamptz not null,
  used_at    timestamptz,
  used_by    uuid references __SCHEMA__.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- assistant_turns: the doctor of the grant only; no patient policy, on purpose. -------------
create table if not exists __SCHEMA__.assistant_turns (
  id         uuid primary key default gen_random_uuid(),
  grant_id   uuid not null references __SCHEMA__.grants (id) on delete cascade,
  doctor_id  uuid not null references __SCHEMA__.profiles (id) on delete cascade,
  patient_id uuid not null references __SCHEMA__.profiles (id) on delete cascade,
  mode       text not null check (mode in ('ask', 'causes')),
  question   text,
  answer     jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists turns_grant_idx on __SCHEMA__.assistant_turns (grant_id);

-- rate_events: server-side rate limits (demo-login, handshake-claim). Service role only. -------
create table if not exists __SCHEMA__.rate_events (
  id   bigint generated always as identity primary key,
  kind text not null check (kind in ('demo_login', 'handshake_claim')),
  key  text not null,             -- a hash, never an address or a name
  at   timestamptz not null default now()
);
create index if not exists rate_events_idx on __SCHEMA__.rate_events (kind, key, at desc);

-- RLS on every table. ----------------------------------------------------------------------
alter table __SCHEMA__.profiles         enable row level security;
alter table __SCHEMA__.grants           enable row level security;
alter table __SCHEMA__.documents        enable row level security;
alter table __SCHEMA__.results          enable row level security;
alter table __SCHEMA__.findings         enable row level security;
alter table __SCHEMA__.diary_entries    enable row level security;
alter table __SCHEMA__.handshake_tokens enable row level security;
alter table __SCHEMA__.assistant_turns  enable row level security;
alter table __SCHEMA__.rate_events      enable row level security;

-- Privileges: deny by default (001), then exactly what a policy covers. --------------------
revoke all on all tables in schema __SCHEMA__ from public, anon, authenticated;
grant select on __SCHEMA__.profiles, __SCHEMA__.grants, __SCHEMA__.documents, __SCHEMA__.results,
                __SCHEMA__.findings, __SCHEMA__.diary_entries, __SCHEMA__.assistant_turns
  to authenticated;
-- The diary insert names its columns: recorded_at and time_edited cannot be sent by a client.
grant insert (patient_id, occurred_at, text, severity) on __SCHEMA__.diary_entries to authenticated;
grant all on all tables in schema __SCHEMA__ to service_role;
grant usage, select on all sequences in schema __SCHEMA__ to service_role;

-- Policies. "Live grant" is written out in every policy that needs it, expiry included, so that
-- access closes at expires_at with no clock job (PRD 10.7).
drop policy if exists profiles_own on __SCHEMA__.profiles;
create policy profiles_own on __SCHEMA__.profiles
  for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists profiles_doctor_in_grant on __SCHEMA__.profiles;
create policy profiles_doctor_in_grant on __SCHEMA__.profiles
  for select to authenticated
  using (exists (select 1 from __SCHEMA__.grants g
                 where g.patient_id = profiles.id and g.doctor_id = (select auth.uid())
                   and g.status = 'active' and g.revoked_at is null and g.expires_at > now()));

-- A grant row exists only between two profiles (foreign keys), so own-side is tied to profiles.
drop policy if exists grants_parties on __SCHEMA__.grants;
create policy grants_parties on __SCHEMA__.grants
  for select to authenticated
  using (patient_id = (select auth.uid()) or doctor_id = (select auth.uid()));

drop policy if exists documents_patient_own on __SCHEMA__.documents;
create policy documents_patient_own on __SCHEMA__.documents
  for select to authenticated
  using (patient_id = (select auth.uid()));

drop policy if exists documents_doctor_in_grant on __SCHEMA__.documents;
create policy documents_doctor_in_grant on __SCHEMA__.documents
  for select to authenticated
  using (status = 'confirmed'
         and exists (select 1 from __SCHEMA__.grants g
                     where g.patient_id = documents.patient_id and g.doctor_id = (select auth.uid())
                       and g.status = 'active' and g.revoked_at is null and g.expires_at > now()));

drop policy if exists results_patient_own on __SCHEMA__.results;
create policy results_patient_own on __SCHEMA__.results
  for select to authenticated
  using (patient_id = (select auth.uid()));

drop policy if exists results_doctor_in_grant on __SCHEMA__.results;
create policy results_doctor_in_grant on __SCHEMA__.results
  for select to authenticated
  using (exists (select 1 from __SCHEMA__.grants g
                 where g.patient_id = results.patient_id and g.doctor_id = (select auth.uid())
                   and g.status = 'active' and g.revoked_at is null and g.expires_at > now())
         and exists (select 1 from __SCHEMA__.documents d
                     where d.id = results.document_id and d.status = 'confirmed'));

drop policy if exists findings_patient_own on __SCHEMA__.findings;
create policy findings_patient_own on __SCHEMA__.findings
  for select to authenticated
  using (patient_id = (select auth.uid()));

drop policy if exists findings_doctor_in_grant on __SCHEMA__.findings;
create policy findings_doctor_in_grant on __SCHEMA__.findings
  for select to authenticated
  using (exists (select 1 from __SCHEMA__.grants g
                 where g.patient_id = findings.patient_id and g.doctor_id = (select auth.uid())
                   and g.status = 'active' and g.revoked_at is null and g.expires_at > now())
         and exists (select 1 from __SCHEMA__.documents d
                     where d.id = findings.document_id and d.status = 'confirmed'));

drop policy if exists diary_patient_own on __SCHEMA__.diary_entries;
create policy diary_patient_own on __SCHEMA__.diary_entries
  for select to authenticated
  using (patient_id = (select auth.uid()));

drop policy if exists diary_doctor_in_grant on __SCHEMA__.diary_entries;
create policy diary_doctor_in_grant on __SCHEMA__.diary_entries
  for select to authenticated
  using (exists (select 1 from __SCHEMA__.grants g
                 where g.patient_id = diary_entries.patient_id and g.doctor_id = (select auth.uid())
                   and g.status = 'active' and g.revoked_at is null and g.expires_at > now()));

-- Insert own, and only as a patient: the caller's profile row says so.
drop policy if exists diary_patient_insert on __SCHEMA__.diary_entries;
create policy diary_patient_insert on __SCHEMA__.diary_entries
  for insert to authenticated
  with check (patient_id = (select auth.uid())
              and exists (select 1 from __SCHEMA__.profiles p
                          where p.id = (select auth.uid()) and p.role = 'patient'));

drop policy if exists turns_doctor_in_grant on __SCHEMA__.assistant_turns;
create policy turns_doctor_in_grant on __SCHEMA__.assistant_turns
  for select to authenticated
  using (doctor_id = (select auth.uid())
         and exists (select 1 from __SCHEMA__.grants g
                     where g.id = assistant_turns.grant_id and g.doctor_id = (select auth.uid())
                       and g.status = 'active' and g.revoked_at is null and g.expires_at > now()));

-- handshake_tokens, rate_events: RLS on and no policy, so no client role reaches them.

-- Realtime on grants only (settlement 8). RLS applies to the subscriber.
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = '__SCHEMA__' and tablename = 'grants') then
    execute 'alter publication supabase_realtime add table __SCHEMA__.grants';
  end if;
end $$;

insert into __SCHEMA__._applied (file) values ('002_core.sql') on conflict (file) do nothing;
