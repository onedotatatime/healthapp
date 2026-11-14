// The assistant's Store (MIN-4487): Postgres over SUPABASE_DB_URL, like pgstore.ts (no Data API needed).
// It runs as the database owner, so RLS does not apply: the live-grant predicate of the doctor_in_grant
// policies (002_core.sql) is written out here, in the same transaction as the reads, and every query
// filters on the grant's patient. The schema name comes from the validated env, values are parameters.
import postgres from "npm:postgres@3.4.5";
import type { HealthappEnv } from "./contract.ts";
import type { DiaryFact, FindingFact, PatientRecord, ResultFact } from "./assistant.ts";

type Sql = postgres.Sql;
let _sql: Sql | null = null;
function db(): Sql {
  if (!_sql) {
    const url = Deno.env.get("SUPABASE_DB_URL");
    if (!url) throw new Error("SUPABASE_DB_URL missing");
    _sql = postgres(url, { max: 1, prepare: false, idle_timeout: 20, connect_timeout: 10 });
  }
  return _sql;
}
const schema = (env: HealthappEnv) => (env === "demo" ? "healthapp_demo" : "healthapp_dev");

/** The demo's clock for a diary entry's day. */
export const DIARY_TZ = "Europe/Athens";
/** A demo record is tens of documents; a cap keeps a runaway one inside the model's context. */
export const ROW_CAP = 500;

export interface GrantState {
  patient_id: string;
  live: boolean;
}

export interface AssistantStore {
  /** The grant if it is this doctor's, with whether it is live now. Null for unknown or somebody else's. */
  grantState(env: HealthappEnv, grantId: string, doctorId: string): Promise<GrantState | null>;
  /** The patient's confirmed record, read only while the grant is live (null otherwise). */
  record(env: HealthappEnv, grantId: string, doctorId: string): Promise<PatientRecord | null>;
}

export const assistantPg: AssistantStore = {
  async grantState(env, grantId, doctorId) {
    const rows = await db().unsafe(
      `select patient_id, (status = 'active' and revoked_at is null and expires_at > now()) as live
         from ${schema(env)}.grants where id = $1::uuid and doctor_id = $2::uuid`,
      [grantId, doctorId],
    );
    return rows[0] ? { patient_id: rows[0].patient_id as string, live: rows[0].live === true } : null;
  },

  async record(env, grantId, doctorId) {
    const S = schema(env);
    return await db().begin(async (tx) => {
      const g = await tx.unsafe(
        `select patient_id from ${S}.grants
          where id = $1::uuid and doctor_id = $2::uuid and status = 'active' and revoked_at is null and expires_at > now()`,
        [grantId, doctorId],
      );
      if (g.length === 0) return null;
      const p = g[0].patient_id as string;
      const results = await tx.unsafe(
        `select r.id, d.exam_date::text as exam_date, d.kind, d.provenance, r.analyte, r.analyte_key,
                r.value_num::float8 as value_num, r.value_text, r.unit, r.ref_low::float8 as ref_low,
                r.ref_high::float8 as ref_high, r.ref_text, r.flag, r.edited_by_patient
           from ${S}.results r join ${S}.documents d on d.id = r.document_id
          where r.patient_id = $1::uuid and d.patient_id = $1::uuid and d.status = 'confirmed' and d.exam_date is not null
          order by d.exam_date, r.pos, r.id limit ${ROW_CAP}`,
        [p],
      );
      const findings = await tx.unsafe(
        `select f.id, d.exam_date::text as exam_date, d.kind, d.provenance, f.kind as finding_kind, f.text_original,
                f.finding_date::text as finding_date, f.specialty, f.edited_by_patient
           from ${S}.findings f join ${S}.documents d on d.id = f.document_id
          where f.patient_id = $1::uuid and d.patient_id = $1::uuid and d.status = 'confirmed' and d.exam_date is not null
          order by coalesce(f.finding_date, d.exam_date), f.pos, f.id limit ${ROW_CAP}`,
        [p],
      );
      const diary = await tx.unsafe(
        `select id, to_char(occurred_at at time zone '${DIARY_TZ}', 'YYYY-MM-DD') as day, severity::int as severity, text
           from ${S}.diary_entries where patient_id = $1::uuid order by occurred_at, id limit ${ROW_CAP}`,
        [p],
      );
      return {
        results: results as unknown as ResultFact[],
        findings: findings as unknown as FindingFact[],
        diary: diary as unknown as DiaryFact[],
      };
    });
  },
};
