-- Per env. Rendered by `scripts/hdb render <env> 017_refused_keeps_file.sql` (MIN-4637; CTO decision "MIN-4630" on MIN-4613,
-- part B; the founder's yes, 2026-11-15: "Yes, keep for 14 days"). Applied after 015 and 016.
-- Idempotent. DDL only: it selects and writes no row, so it is safe on `demo`. Adding the checks validates the existing
-- rows, and every existing row passes: 015 kept refused rows without a file, and the new column starts empty.
--
-- A refused scan now keeps its ORIGINAL for 14 days, so it can be read again after a fix ("Try again"). It still keeps
-- no reading: no name, no ID, no kind, no date, no issuer, no values. The file stays in the private bucket, which no
-- client can read (000_storage_closed); only the functions read it, and doc-photo serves draft and confirmed rows only.
--   file_kept_until  set by the first refusal (refusal time + 14 days), kept by a refused re-run (a re-run never
--                    extends it), cleared by a re-run that saves, cleared with the file by the sweep on the owner's
--                    next list call once it has passed.
alter table __SCHEMA__.documents add column if not exists file_kept_until timestamptz;

-- was (015): a refused row keeps nothing, storage_path, content_type and sha256_file included.
-- Now: the file, its type and its hash may stay, and nothing else. The file and its end date go together, and the type
-- and the hash only travel with the file, so a refused row either holds a kept file with its 14-day end, or nothing.
alter table __SCHEMA__.documents drop constraint if exists documents_refused_empty;
alter table __SCHEMA__.documents add constraint documents_refused_empty check (
  status <> 'refused' or (
    sha256_record is null and kind is null and language is null and exam_date is null and issuer is null
    and printed_name is null and printed_id is null and identity_status is null and extract_confidence is null
    and (storage_path is null) = (file_kept_until is null)
    and (storage_path is not null or (content_type is null and sha256_file is null)))
);

-- The end date exists only on a row that came from a refusal and is not saved: refused, being read again, or failed on
-- that re-read. A save that forgot to clear it is refused here, so a saved exam can never be swept.
alter table __SCHEMA__.documents drop constraint if exists documents_file_kept_until_status;
alter table __SCHEMA__.documents add constraint documents_file_kept_until_status check (
  file_kept_until is null or status in ('refused', 'reading', 'failed')
);

insert into __SCHEMA__._applied (file) values ('017_refused_keeps_file.sql') on conflict (file) do nothing;
