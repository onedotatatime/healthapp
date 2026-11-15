-- Check for 017_refused_keeps_file.sql (MIN-4637). Renders with __SCHEMA__ -> healthapp_<env> (sed, as the other checks).
-- Reads no row of documents and writes none: it copies the LIVE table's definition, CHECK constraints included, into a
-- temporary table (LIKE ... INCLUDING CONSTRAINTS) and tries synthetic rows there. So it proves the constraints the
-- database really holds, on dev and on demo alike, and leaves nothing behind (the temp table dies with the session).
-- Output: one row. The check passes when failures = 0 and applied = true; `failed` names the cases that did not behave.
--   cases     hand-written rows: each is either accepted or refused by the copied constraints, as the case says
--   applied   017 is recorded in _applied and the column exists
drop table if exists pg_temp.doc_probe;
create temporary table doc_probe (like __SCHEMA__.documents including defaults including constraints);
create or replace function pg_temp.refused_keeps_file_check()
returns table (cases bigint, failures bigint, failed text[], applied boolean)
language plpgsql as $check$
declare
  c record;
  ok boolean;
  n bigint := 0;
  bad text[] := '{}';
  pid uuid := gen_random_uuid();
  kept timestamptz := now() + interval '14 days';
begin
  for c in
    select * from (values
      -- name, accept?, status, reason, storage_path, content_type, sha256_file, file_kept_until, a reading column set?
      ('refused, file kept with its 14-day end (the new shape)',           true,  'refused', 'name_mismatch', 'p/x', 'image/jpeg', 'f', kept, null),
      ('refused, file kept, no hash yet',                                  true,  'refused', 'unreadable',    'p/x', 'image/jpeg', null, kept, null),
      ('refused, nothing kept (a row from before 017, or swept)',          true,  'refused', 'name_mismatch', null, null, null, null, null),
      ('refused, file kept with NO end date',                              false, 'refused', 'name_mismatch', 'p/x', 'image/jpeg', 'f', null, null),
      ('refused, an end date with no file',                                false, 'refused', 'name_mismatch', null, null, null, kept, null),
      ('refused, a type with no file',                                     false, 'refused', 'name_mismatch', null, 'image/jpeg', null, null, null),
      ('refused, a hash with no file',                                     false, 'refused', 'name_mismatch', null, null, 'f', null, null),
      ('refused, file kept and a kind',                                    false, 'refused', 'name_mismatch', 'p/x', 'image/jpeg', null, kept, 'kind'),
      ('refused, file kept and a printed name',                            false, 'refused', 'name_mismatch', 'p/x', 'image/jpeg', null, kept, 'printed_name'),
      ('refused, file kept and a printed ID',                              false, 'refused', 'name_mismatch', 'p/x', 'image/jpeg', null, kept, 'printed_id'),
      ('refused, file kept and an exam date',                              false, 'refused', 'name_mismatch', 'p/x', 'image/jpeg', null, kept, 'exam_date'),
      ('refused, file kept and an issuer',                                 false, 'refused', 'name_mismatch', 'p/x', 'image/jpeg', null, kept, 'issuer'),
      ('refused, file kept and a language',                                false, 'refused', 'name_mismatch', 'p/x', 'image/jpeg', null, kept, 'language'),
      ('refused, file kept and an identity status',                        false, 'refused', 'name_mismatch', 'p/x', 'image/jpeg', null, kept, 'identity_status'),
      ('refused, file kept and a record hash',                             false, 'refused', 'name_mismatch', 'p/x', 'image/jpeg', null, kept, 'sha256_record'),
      ('refused, file kept and a confidence',                              false, 'refused', 'name_mismatch', 'p/x', 'image/jpeg', null, kept, 'extract_confidence'),
      ('reading again, end date kept',                                     true,  'reading', null, 'p/x', 'image/jpeg', null, kept, null),
      ('failed on the re-read, end date kept',                             true,  'failed',  'model_timeout', 'p/x', 'image/jpeg', null, kept, null),
      ('a draft with an end date (a save that did not clear it)',          false, 'draft',   null, 'p/x', 'image/jpeg', 'f', kept, 'kind'),
      ('queued with an end date',                                          false, 'queued',  null, 'p/x', 'image/jpeg', null, kept, null)
    ) v(name, accept, status, reason, path, ctype, sha, until, reading)
  loop
    n := n + 1;
    begin
      insert into doc_probe (patient_id, status, status_reason, storage_path, content_type, sha256_file, file_kept_until,
                             kind, language, exam_date, issuer, printed_name, printed_id, identity_status, sha256_record,
                             extract_confidence)
      values (pid, c.status, c.reason, c.path, c.ctype, c.sha, c.until,
              case when c.reading = 'kind' then 'blood_test' end,
              case when c.reading = 'language' then 'el' end,
              case when c.reading = 'exam_date' then date '2025-05-14' end,
              case when c.reading = 'issuer' then 'Synthetic Lab' end,
              case when c.reading = 'printed_name' then 'SYNTHETIC NAME' end,
              case when c.reading = 'printed_id' then 'XX000000' end,
              case when c.reading = 'identity_status' then 'match' end,
              case when c.reading = 'sha256_record' then 'r' end,
              case when c.reading = 'extract_confidence' then '{}'::jsonb end);
      ok := true;
    exception when check_violation then
      ok := false;
    end;
    if ok <> c.accept then bad := bad || array[c.name::text]; end if;
  end loop;
  delete from doc_probe;
  return query select n, coalesce(array_length(bad, 1), 0)::bigint, bad,
    exists (select 1 from __SCHEMA__._applied where file = '017_refused_keeps_file.sql')
    and exists (select 1 from information_schema.columns
                 where table_schema = '__SCHEMA__' and table_name = 'documents' and column_name = 'file_kept_until');
end
$check$;
select * from pg_temp.refused_keeps_file_check();
