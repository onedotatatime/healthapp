// The reset's statements (MIN-4514). DEV ONLY: the schema is a literal, never built from a request or an env
// value, so no input can point this at healthapp_demo. Scope is the two synthetic accounts, by address.
// The seeded set is the fixed ids of 007_seed_match_persona (md5 of 'min-4505:persona:...') and of
// 011_seed_record (prefix 5eed0000-0000-4000-). Everything else those accounts own is a live addition.
export const SCHEMA = "healthapp_dev";

const SYNTHETIC = `(select p.id from ${SCHEMA}.profiles p join auth.users u on u.id = p.id
  where u.email in ('patient.dev@healthapp.invalid', 'doctor.dev@healthapp.invalid')
    and u.raw_app_meta_data ->> 'app' = 'healthapp' and u.raw_app_meta_data ->> 'env' = 'dev')`;

const PERSONA_DOCS = [
  "lab-2023-12", "lab-2024-11", "lab-2025-05", "lab-2025-08", "lab-2025-12",
  "lab-2026-05", "lab-2026-06", "lab-2026-07", "lab-2026-10", "letter",
].map((k) => `md5('min-4505:persona:${k}')::uuid`).join(", ");

const SEEDED_DOC = `(d.id::text like '5eed0000-0000-4000-%' or d.id in (${PERSONA_DOCS}))`;

/** One statement, one transaction: every count comes from the same snapshot. Order matters only for the
 *  grants delete, which cascades to assistant_turns. */
export const RESET_SQL = `
with g as (delete from ${SCHEMA}.grants where patient_id in ${SYNTHETIC} or doctor_id in ${SYNTHETIC} returning 1),
     h as (delete from ${SCHEMA}.handshake_tokens where patient_id in ${SYNTHETIC} returning 1),
     t as (delete from ${SCHEMA}.assistant_turns where patient_id in ${SYNTHETIC} returning 1),
     d as (delete from ${SCHEMA}.documents d where d.patient_id in ${SYNTHETIC} and not ${SEEDED_DOC} returning 1),
     e as (delete from ${SCHEMA}.diary_entries e where e.patient_id in ${SYNTHETIC}
             and e.id::text not like '5eed0000-0000-4000-%' returning 1)
select (select count(*) from g)::int as grants, (select count(*) from h)::int as handshake_tokens,
       (select count(*) from t)::int as assistant_turns, (select count(*) from d)::int as documents,
       (select count(*) from e)::int as diary_entries`;
