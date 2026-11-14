-- Per env. Rendered by `scripts/hdb render <env> 015_scan_next.sql` (MIN-4556; CTO decision on MIN-4555 §2-4). Applied after 002.
-- Idempotent. DDL only: it reads and writes no row, so it is safe on `demo`.
-- The reading moves off the phone's wait, so a document now has a life before it is a draft:
--   queued -> reading -> draft | refused | failed,   draft -> confirmed (as before)
-- One column, more values: every policy and every query that reads `status = 'confirmed'` (documents, results,
-- findings, file_analysis, matches) stays exactly as it is, so a doctor still sees saved exams only.
-- Written by the Edge Functions only (database owner); a patient reads their own rows under the existing select policy.
alter table __SCHEMA__.documents add column if not exists status_reason text;
alter table __SCHEMA__.documents add column if not exists status_at timestamptz not null default now();
alter table __SCHEMA__.documents add column if not exists read_attempts smallint not null default 0;
alter table __SCHEMA__.documents alter column status set default 'queued';

alter table __SCHEMA__.documents drop constraint if exists documents_status_check;
alter table __SCHEMA__.documents add constraint documents_status_check
  check (status in ('queued', 'reading', 'draft', 'refused', 'failed', 'confirmed'));

-- was: check (status = 'draft' or kind is not null). Only a saved exam must say what it is.
alter table __SCHEMA__.documents drop constraint if exists documents_check;
alter table __SCHEMA__.documents drop constraint if exists documents_confirmed_has_kind;
alter table __SCHEMA__.documents add constraint documents_confirmed_has_kind
  check (status <> 'confirmed' or kind is not null);

-- A reason code exists exactly when the row is refused or failed, and it is one of the codes the contract lists.
alter table __SCHEMA__.documents drop constraint if exists documents_reason_check;
alter table __SCHEMA__.documents add constraint documents_reason_check check (
  (status in ('refused', 'failed')) = (status_reason is not null)
  and (status <> 'refused' or status_reason in ('unreadable', 'unsupported_kind', 'incomplete', 'name_missing', 'name_mismatch', 'id_mismatch'))
  and (status <> 'failed' or status_reason in ('model_timeout', 'model_http', 'model_invalid', 'config', 'too_many_attempts',
                                               'stuck', 'no_file', 'delete_failed', 'unsupported_type', 'error'))
);

-- A refused row keeps the reason code and the times and nothing else: no file, no hash, no kind, no date, no
-- issuer, no printed name or ID, no confidence. The database refuses the row if the code ever tries to keep more.
alter table __SCHEMA__.documents drop constraint if exists documents_refused_empty;
alter table __SCHEMA__.documents add constraint documents_refused_empty check (
  status <> 'refused' or (
    storage_path is null and content_type is null and sha256_file is null and sha256_record is null
    and kind is null and language is null and exam_date is null and issuer is null
    and printed_name is null and printed_id is null and identity_status is null and extract_confidence is null)
);

insert into __SCHEMA__._applied (file) values ('015_scan_next.sql') on conflict (file) do nothing;
