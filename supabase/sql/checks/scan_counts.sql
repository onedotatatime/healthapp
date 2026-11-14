-- Counts only (MIN-4556, CTO on MIN-4555 §8). Renders with __SCHEMA__ and __BUCKET__ (`scripts/hdb scan <env>`).
-- Selects counts and booleans and nothing else: no id, no name, no value, no path, no date. Safe to run on
-- `healthapp_demo` (conductor rule 3a9ed68: an agent proves the real-record run without reading a row).
-- stuck = the lazy sweep's own limits: reading for more than 3 minutes, queued for more than 10.
-- refused_rows_with_file = a refused row that still has a path, or whose object still exists in the bucket.
select
  count(*)::int                                                              as uploads,
  count(*) filter (where d.status = 'queued')::int                           as queued,
  count(*) filter (where d.status = 'reading')::int                          as reading,
  count(*) filter (where d.status = 'draft')::int                            as draft,
  count(*) filter (where d.status = 'refused')::int                          as refused,
  count(*) filter (where d.status = 'failed')::int                           as failed,
  count(*) filter (where d.status = 'confirmed')::int                        as confirmed,
  count(*) filter (where d.status = 'refused' and d.status_reason = 'unreadable')::int        as refused_unreadable,
  count(*) filter (where d.status = 'refused' and d.status_reason = 'unsupported_kind')::int  as refused_unsupported_kind,
  count(*) filter (where d.status = 'refused' and d.status_reason = 'incomplete')::int        as refused_incomplete,
  count(*) filter (where d.status = 'refused' and d.status_reason = 'name_missing')::int      as refused_name_missing,
  count(*) filter (where d.status = 'refused' and d.status_reason = 'name_mismatch')::int     as refused_name_mismatch,
  count(*) filter (where d.status = 'refused' and d.status_reason = 'id_mismatch')::int       as refused_id_mismatch,
  count(*) filter (where (d.status = 'reading' and d.status_at < now() - interval '3 minutes')
                      or (d.status = 'queued'  and d.status_at < now() - interval '10 minutes'))::int as stuck,
  count(*) filter (where d.status = 'refused'
                     and (d.storage_path is not null
                          or exists (select 1 from storage.objects o
                                      where o.bucket_id = '__BUCKET__' and o.name = d.patient_id::text || '/' || d.id::text)))::int
                                                                             as refused_rows_with_file,
  exists (select 1 from __SCHEMA__.results)                                  as has_result_rows
from __SCHEMA__.documents d;
