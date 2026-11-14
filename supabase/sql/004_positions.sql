-- Per env. Rendered by `scripts/hdb render <env> 004_positions.sql` (MIN-4475).
-- results and findings keep the document's own order: the table has no natural order and an update
-- moves a row, so the reading order is stored. Functions write and sort by it; the app may
-- `.order('pos')` on the Data API (it need not select the column).
alter table __SCHEMA__.results  add column if not exists pos smallint not null default 0;
alter table __SCHEMA__.findings add column if not exists pos smallint not null default 0;

insert into __SCHEMA__._applied (file) values ('004_positions.sql') on conflict (file) do nothing;
