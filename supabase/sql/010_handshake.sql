-- Per env. Rendered by `scripts/hdb render <env> 010_handshake.sql` (MIN-4484, MIN-4492 fix 1).
-- Applied after 002. Idempotent.
-- 1. profiles: column-level select. A doctor in a live grant may read the patient's name and
--    specialty (PRD 10.3) and nothing else: national_id_norm, full_name_norm and matching_opt_in are
--    not granted to any client role. `select *` on profiles now fails with 42501, so the app lists its
--    columns (PROFILE_COLUMNS in contract.ts already does).
revoke select on __SCHEMA__.profiles from authenticated;
grant select (id, role, full_name, full_name_latin, specialty, org_type, created_at)
  on __SCHEMA__.profiles to authenticated;

-- 2. At most one open (pending or active) grant per patient and doctor, so a second claim by the
--    same doctor can never stack a second row. Expiry is lazy, so the claim ends stale rows first.
create unique index if not exists grants_open_pair_idx
  on __SCHEMA__.grants (patient_id, doctor_id) where status in ('pending', 'active');

-- 3. Looking a token up by its typed code is a unique-index read already (short_code is unique).
--    handshake_tokens and rate_events keep RLS on and no policy: no client role reaches them.

insert into __SCHEMA__._applied (file) values ('010_handshake.sql') on conflict (file) do nothing;
