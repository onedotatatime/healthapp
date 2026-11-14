-- Project-wide, applied once (not per env). Restrictive: no conductor storage policy,
-- present or future, can open the healthapp buckets. For every other bucket it is true.
-- MIN-4449 decision 1.4. Idempotent.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
                 and policyname = 'healthapp_buckets_closed') then
    create policy healthapp_buckets_closed on storage.objects
      as restrictive for all to anon, authenticated
      using      (bucket_id not in ('healthapp-dev', 'healthapp-demo'))
      with check (bucket_id not in ('healthapp-dev', 'healthapp-demo'));
  end if;
end $$;
