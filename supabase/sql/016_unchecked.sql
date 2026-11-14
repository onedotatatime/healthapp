-- Per env. Rendered by `scripts/hdb render <env> 016_unchecked.sql` (MIN-4556; CTO addendum on MIN-4555 §2). Applied after 015.
-- Idempotent. DDL only: it reads and writes no row, so it is safe on `demo`.
-- A scanned exam is saved without a tap (the founder's choice, 2026-11-14), so the row says whether a person has seen it:
-- `unchecked` is true from the automatic save until the owner opens the exam, confirms it or unconfirms it.
-- Old and seeded rows get false and show no mark. The column rides on `documents`, so every existing select policy
-- already covers it: no policy, grant or constraint is touched.
alter table __SCHEMA__.documents add column if not exists unchecked boolean not null default false;

insert into __SCHEMA__._applied (file) values ('016_unchecked.sql') on conflict (file) do nothing;
