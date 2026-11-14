-- Per env. Rendered by `scripts/hdb render <env> 013_file_analysis.sql` (MIN-4549, direction 3; CTO decision on
-- MIN-4548 §4). Applied after 002. Idempotent. (The CTO's text says 012; 012 is already 012_seed_verified.)
-- One row per stored original file, written by the second pass inside healthapp-extract-exam (service side:
-- it runs as the database owner) and upserted on document_id, so running it twice leaves one row.
-- Read by a DOCTOR in a live grant only. There is deliberately no patient policy: the patient's screens never
-- show the analysis (MIN-4548 §1). A table with a select policy and no write policy cannot be written by a
-- client: the absence is the rule (same as results and findings).
-- The only free text is items[].text_original: the document's own words. Everything else is an enum, a boolean
-- or a number, so nothing here can carry an opinion.
create table if not exists __SCHEMA__.file_analysis (
  document_id uuid primary key references __SCHEMA__.documents (id) on delete cascade,
  patient_id  uuid not null references __SCHEMA__.profiles (id) on delete cascade,
  status      text not null check (status in ('done', 'failed')),
  error_code  text check (error_code in ('no_object', 'unsupported_type', 'budget', 'model_timeout', 'model_http', 'model_invalid', 'config', 'error')),
  -- the reading (null when failed)
  doc_type    text check (doc_type in ('blood_test', 'imaging_report', 'doctor_letter', 'other')),
  pages       int check (pages >= 1),
  readable    boolean,
  blurred     boolean,
  cropped     boolean,
  rotated     boolean,
  handwriting_present        boolean,
  issuer_present             boolean,
  date_present               boolean,
  stamp_or_signature_present boolean,
  -- file facts computed by the server, no model (null when the object could not be read)
  sha256      text check (sha256 ~ '^[0-9a-f]{64}$'),
  mime        text,
  bytes       bigint check (bytes >= 0),
  uploaded_at timestamptz,
  hash_verified boolean,      -- the object hashed the same after the run, and matches the extraction's hash
  items_count int not null default 0 check (items_count between 0 and 20),
  items       jsonb not null default '[]'::jsonb
              check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) = items_count),
  analysed_at timestamptz not null default now(),
  check ((status = 'done') = (error_code is null)),
  check (status = 'failed' or (doc_type is not null and pages is not null and readable is not null
         and blurred is not null and cropped is not null and rotated is not null and handwriting_present is not null
         and issuer_present is not null and date_present is not null and stamp_or_signature_present is not null))
);
create index if not exists file_analysis_patient_idx on __SCHEMA__.file_analysis (patient_id);

alter table __SCHEMA__.file_analysis enable row level security;
revoke all on __SCHEMA__.file_analysis from public, anon, authenticated;
grant select on __SCHEMA__.file_analysis to authenticated;
grant all on __SCHEMA__.file_analysis to service_role;

-- A doctor with a live grant on the document's patient, and only on a confirmed document: the same predicate
-- documents_doctor_in_grant uses, expiry in the policy itself so access closes with no clock job.
drop policy if exists file_analysis_doctor_in_grant on __SCHEMA__.file_analysis;
create policy file_analysis_doctor_in_grant on __SCHEMA__.file_analysis
  for select to authenticated
  using (exists (select 1 from __SCHEMA__.grants g
                 where g.patient_id = file_analysis.patient_id and g.doctor_id = (select auth.uid())
                   and g.status = 'active' and g.revoked_at is null and g.expires_at > now())
         and exists (select 1 from __SCHEMA__.documents d
                     where d.id = file_analysis.document_id and d.status = 'confirmed'));

insert into __SCHEMA__._applied (file) values ('013_file_analysis.sql') on conflict (file) do nothing;
