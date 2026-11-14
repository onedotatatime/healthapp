-- Counts only (MIN-4549, CTO on MIN-4548 §5). Renders with __SCHEMA__ -> healthapp_<env> (`scripts/hdb files <env>`).
-- Selects count(*) and bool_and(...) and nothing else: no id, no name, no value, no path, no date.
-- A "file" is a document that has a stored object path. A file with no done analysis counts against the two
-- booleans (a missing hash is not a hash), and an empty set is false, not vacuously true.
select
  count(*)::int                                                              as files_total,
  count(*) filter (where fa.status = 'done')::int                            as files_analysed,
  count(*) filter (where fa.status = 'failed')::int                          as files_failed,
  count(*) filter (where fa.status = 'done' and fa.items_count > 0)::int     as files_with_items_not_in_record,
  coalesce(bool_and(fa.sha256 is not null), false)                           as all_files_have_hash,
  coalesce(bool_and(coalesce(fa.hash_verified, false)), false)               as all_hashes_match_stored_object
from __SCHEMA__.documents d
left join __SCHEMA__.file_analysis fa on fa.document_id = d.id
where d.storage_path is not null;
