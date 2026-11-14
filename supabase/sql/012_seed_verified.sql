-- Per env. Rendered by `scripts/hdb render dev 012_seed_verified.sql` (MIN-4478, B2). DEV ONLY, synthetic only.
-- One record of the synthetic patient Maria shows the mark "Verified by source": the doctor's letter of
-- 011_seed_record.sql (document 5, issued by a clinic). Every photo upload stays "uploaded_by_patient"
-- (the column default; no client role holds INSERT or UPDATE on documents, and extract-exam never reads
-- a provenance from a request). Needs 011 first. healthapp_demo: Maria's record is made on stage, so
-- this refuses there, loudly, like 011.
do $$
declare n int;
begin
  if '__SCHEMA__' <> 'healthapp_dev' then raise exception '012_seed_verified is for healthapp_dev only'; end if;
  update __SCHEMA__.documents set provenance = 'verified_by_source'
   where id = '5eed0000-0000-4000-8000-000000000005'::uuid;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'run 011_seed_record first (document 5 is missing)'; end if;
end $$;

insert into __SCHEMA__._applied (file) values ('012_seed_verified.sql') on conflict (file) do nothing;
