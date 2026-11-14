-- Per env. Rendered by `scripts/hdb render <env> 001_scaffold.sql`:
-- __SCHEMA__ -> healthapp_<env>, __BUCKET__ -> healthapp-<env>. Every object schema-qualified.
-- MIN-4449 decision 1.3 (grants, deny by default) and 1.4 (private bucket). Idempotent.
create schema if not exists __SCHEMA__;

revoke all on schema __SCHEMA__ from public, anon;
grant usage on schema __SCHEMA__ to authenticated, service_role;

-- Deny by default for tables and sequences created later in this schema (measured 2026-11-14).
-- NOT for functions: a per-schema revoke cannot remove Postgres's built-in PUBLIC EXECUTE
-- (measured: a probe function got EXECUTE for anon, authenticated and PUBLIC). Every function
-- file must say `revoke execute on function ... from public, anon, authenticated` itself;
-- `hdb check` (functions_exec_anon_or_public) goes red when one does not.
-- Tables still need an explicit `grant ... to authenticated` plus RLS policies to be reachable.
alter default privileges in schema __SCHEMA__ revoke all on tables from public, anon, authenticated;
alter default privileges in schema __SCHEMA__ revoke all on sequences from public, anon, authenticated;
alter default privileges in schema __SCHEMA__ revoke execute on functions from public, anon, authenticated;
alter default privileges in schema __SCHEMA__ grant all on tables to service_role;
alter default privileges in schema __SCHEMA__ grant all on sequences to service_role;

-- Which SQL files have run in this schema.
create table if not exists __SCHEMA__._applied (
  file       text primary key,
  applied_at timestamptz not null default now()
);
alter table __SCHEMA__._applied enable row level security;
revoke all on __SCHEMA__._applied from public, anon, authenticated;

-- Private bucket: 20 MB, JPEG/PNG/WebP/PDF. No client policies: signed URLs from functions only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('__BUCKET__', '__BUCKET__', false, 20971520,
        array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

insert into __SCHEMA__._applied (file) values ('000_storage_closed.sql'), ('001_scaffold.sql')
on conflict (file) do nothing;
