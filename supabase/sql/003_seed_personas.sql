-- Per env. Rendered by `scripts/hdb render <env> 003_seed_personas.sql`. Synthetic personas only.
-- Run after `scripts/seed-personas.ts <env>` has created the auth users. Profiles are written here
-- (service side) and never by a client. Only users carrying the healthapp marker are taken.
insert into __SCHEMA__.profiles (id, role, full_name, full_name_latin, full_name_norm, national_id_norm,
                                 specialty, org_type)
select u.id, p.role, p.full_name, p.full_name_latin, p.full_name_norm, p.national_id_norm, p.specialty, p.org_type
from (values
  ('patient.__ENV__@healthapp.invalid', 'patient', 'Μαρία Παπαδοπούλου', 'Maria Papadopoulou',
   'MARIA PAPADOPOULOU', 'AK123456', null, null),
  ('patient2.__ENV__@healthapp.invalid', 'patient', 'Ελένη Δημητρίου', 'Eleni Dimitriou',
   'ELENI DIMITRIOU', 'AB555555', null, null),
  ('doctor.__ENV__@healthapp.invalid', 'doctor', 'Νίκος Ανδρέου', 'Nikos Andreou',
   'NIKOS ANDREOU', null, 'Orthopaedics', 'provider')
) as p (email, role, full_name, full_name_latin, full_name_norm, national_id_norm, specialty, org_type)
join auth.users u on u.email = p.email
 and u.raw_app_meta_data ->> 'app' = 'healthapp'
 and u.raw_app_meta_data ->> 'env' = '__ENV__'
on conflict (id) do update set
  role = excluded.role, full_name = excluded.full_name, full_name_latin = excluded.full_name_latin,
  full_name_norm = excluded.full_name_norm, national_id_norm = excluded.national_id_norm,
  specialty = excluded.specialty, org_type = excluded.org_type;

insert into __SCHEMA__._applied (file) values ('003_seed_personas.sql') on conflict (file) do nothing;
