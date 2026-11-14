-- Removes what qa_users_setup.sql made (and only that): the three QA users, their identities and, by
-- the profiles' ON DELETE CASCADE, every grant, token, document, result, finding and diary row.
begin;
delete from __SCHEMA__.rate_events where key in (
  select substr(encode(sha256(convert_to('handshake_claim:' || u.id::text, 'UTF8')), 'hex'), 1, 32)
  from auth.users u where u.email like 'qa-%.dev@healthapp.invalid');
delete from __SCHEMA__.profiles where id in (select id from auth.users where email like 'qa-%.dev@healthapp.invalid');
delete from auth.identities where user_id in (select id from auth.users where email like 'qa-%.dev@healthapp.invalid');
delete from auth.users where email like 'qa-%.dev@healthapp.invalid';
commit;
