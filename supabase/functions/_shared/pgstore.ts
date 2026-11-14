// The real Store (MIN-4475): Postgres over SUPABASE_DB_URL, not PostgREST. healthapp_<env> is not in
// the Data API's exposed schemas, and this keeps working whether or not it ever is. It runs as the
// database owner, so RLS does not apply: every query below filters on patient_id (or the grant) itself,
// and the handler has already checked the session and the role (docs.ts authenticate).
// The schema name comes from the validated env (dev | demo), never from input. Values are parameters.
import postgres from "npm:postgres@3.4.5";
import { FindingRow, type HealthappEnv, ResultRow } from "./contract.ts";
import { type DocMeta, DocRecordSchema, type DocState, type PlanOutcome, type Role, type Saved, type Store } from "./docs.ts";
import type { DraftIn } from "./extract.ts";

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

/** A jsonb parameter is passed as the value itself: the driver encodes it, and a string would be encoded twice. */
const jsonb = (v: unknown) => v as never;

const schema = (env: HealthappEnv) => (env === "demo" ? "healthapp_demo" : "healthapp_dev");
// deno-lint-ignore no-explicit-any
type Q = { unsafe: (q: string, p?: any[]) => any };

// Row to the contract's shape. Unknown columns (printed_name, storage_path, hashes...) are stripped by zod.
const parseState = (d: Record<string, unknown>, results: unknown[], findings: unknown[]): DocState => {
  const meta: DocMeta = {
    storage_path: (d.storage_path as string) ?? null,
    content_type: (d.content_type as string) ?? null,
    sha256_file: (d.sha256_file as string) ?? null,
    sha256_record: (d.sha256_record as string) ?? null,
    printed_name: (d.printed_name as string) ?? null,
    printed_id: (d.printed_id as string) ?? null,
  };
  return {
    document: DocRecordSchema.parse(d),
    meta,
    results: results.map((r) => ResultRow.parse(r)),
    findings: findings.map((f) => FindingRow.parse(f)),
  };
};

async function load(tx: Q, S: string, where: string, params: unknown[], lock = false): Promise<DocState | null> {
  const docs = await tx.unsafe(`select to_jsonb(d) as j from ${S}.documents d where ${where}${lock ? " for update" : ""}`, params);
  if (docs.length === 0) return null;
  const d = docs[0].j as Record<string, unknown>;
  const rs = await tx.unsafe(
    `select to_jsonb(r) as j from ${S}.results r where document_id = $1 order by pos, id`,
    [d.id],
  );
  const fs = await tx.unsafe(
    `select to_jsonb(f) as j from ${S}.findings f where document_id = $1 order by pos, id`,
    [d.id],
  );
  return parseState(d, rs.map((x: { j: unknown }) => x.j), fs.map((x: { j: unknown }) => x.j));
}

export const pgStore: Store = {
  async roleOf(env, uid) {
    const rows = await db().unsafe(`select role from ${schema(env)}.profiles where id = $1`, [uid]);
    const role = rows[0]?.role;
    return role === "patient" || role === "doctor" ? (role as Role) : null;
  },

  async createDraft(env, patientId, contentType) {
    const id = crypto.randomUUID();
    const path = `${patientId}/${id}`;
    await db().unsafe(
      `insert into ${schema(env)}.documents (id, patient_id, status, storage_path, content_type) values ($1, $2, 'draft', $3, $4)`,
      [id, patientId, path, contentType],
    );
    return { id, storage_path: path };
  },

  getOwn(env, patientId, docId) {
    return load(db(), schema(env), "d.id = $1 and d.patient_id = $2", [docId, patientId]);
  },

  getAny(env, docId) {
    return load(db(), schema(env), "d.id = $1", [docId]);
  },

  async liveGrantEnd(env, grantId, doctorId, patientId) {
    const rows = await db().unsafe(
      `select to_json(expires_at) #>> '{}' as e from ${schema(env)}.grants
        where id = $1 and doctor_id = $2 and patient_id = $3 and status = 'active' and expires_at > now()`,
      [grantId, doctorId, patientId],
    );
    return rows[0]?.e ?? null;
  },

  async saveExtraction(env, patientId, docId, draft: DraftIn, sha256File): Promise<Saved | null> {
    const S = schema(env);
    return await db().begin(async (tx) => {
      const up = await tx.unsafe(
        `update ${S}.documents set kind = $3, language = $4, exam_date = $5, issuer = $6, printed_name = $7,
                printed_id = $8, extract_confidence = $9::jsonb, sha256_file = $10
          where id = $1 and patient_id = $2 and status = 'draft' returning id`,
        [docId, patientId, draft.kind, draft.language, draft.exam_date, draft.issuer, draft.printed_name,
          draft.printed_id, jsonb(draft.header_confidence), sha256File],
      );
      if (up.length === 0) return null;
      await tx.unsafe(`delete from ${S}.results where document_id = $1`, [docId]);
      await tx.unsafe(`delete from ${S}.findings where document_id = $1`, [docId]);
      if (draft.results.length) {
        await tx.unsafe(
          `insert into ${S}.results (document_id, patient_id, pos, analyte, analyte_key, value_num, value_text, unit,
                                     ref_low, ref_high, ref_text, flag, confidence)
           select $1::uuid, $2::uuid, x.ord::int - 1, x.v->>'analyte', x.v->>'analyte_key', (x.v->>'value_num')::numeric, x.v->>'value_text',
                  x.v->>'unit', (x.v->>'ref_low')::numeric, (x.v->>'ref_high')::numeric, x.v->>'ref_text', x.v->>'flag',
                  (x.v->>'confidence')::real
             from jsonb_array_elements($3::jsonb) with ordinality as x(v, ord)`,
          [docId, patientId, jsonb(draft.results)],
        );
      }
      if (draft.findings.length) {
        await tx.unsafe(
          `insert into ${S}.findings (document_id, patient_id, pos, kind, text_original, text_lang, finding_date, specialty, confidence)
           select $1::uuid, $2::uuid, x.ord::int - 1, x.v->>'kind', x.v->>'text_original', x.v->>'text_lang', (x.v->>'finding_date')::date,
                  x.v->>'specialty', (x.v->>'confidence')::real
             from jsonb_array_elements($3::jsonb) with ordinality as x(v, ord)`,
          [docId, patientId, jsonb(draft.findings)],
        );
      }
      return await load(tx, S, "d.id = $1", [docId]);
    });
  },

  async discardDraft(env, patientId, docId) {
    await db().unsafe(`delete from ${schema(env)}.documents where id = $1 and patient_id = $2 and status = 'draft'`, [
      docId,
      patientId,
    ]);
  },

  async confirm(env, patientId, docId, plan) {
    const S = schema(env);
    return await db().begin(async (tx) => {
      const cur = await load(tx, S, "d.id = $1 and d.patient_id = $2", [docId, patientId], true);
      if (!cur) return null;
      const outcome: PlanOutcome = await plan(cur);
      if (outcome.kind === "error") return { error: outcome };
      if (outcome.kind === "already") return { state: cur };
      const p = outcome.plan;
      for (const r of p.results) {
        await tx.unsafe(
          `update ${S}.results set value_num = $2, value_text = $3, unit = $4, flag = $5,
                  edited_by_patient = edited_by_patient or $6 where id = $1 and document_id = $7`,
          [r.id, r.value_num, r.value_text, r.unit, r.flag, r.edited, docId],
        );
      }
      for (const f of p.findings) {
        await tx.unsafe(
          `update ${S}.findings set text_original = $2, finding_date = $3,
                  edited_by_patient = edited_by_patient or $4 where id = $1 and document_id = $5`,
          [f.id, f.text_original, f.finding_date, f.edited, docId],
        );
      }
      await tx.unsafe(
        `update ${S}.documents set exam_date = $2, status = 'confirmed', confirmed_at = now(), sha256_record = $3 where id = $1`,
        [docId, p.exam_date, p.sha256_record],
      );
      const state = await load(tx, S, "d.id = $1", [docId]);
      return state ? { state } : null;
    });
  },
};

/** Rate limit for demo-login over the same connection (the Data API cannot reach healthapp_<env> yet). One
 *  advisory lock per key makes the count-then-insert atomic. The key is a hash, never an address. */
export async function allowTry(env: HealthappEnv, key: string, max: number, windowSeconds: number): Promise<boolean> {
  const S = schema(env);
  return await db().begin(async (tx) => {
    await tx.unsafe(`select pg_advisory_xact_lock(hashtext($1))`, [`demo_login:${key}`]);
    const c = await tx.unsafe(
      `select count(*)::int as n from ${S}.rate_events where kind = 'demo_login' and key = $1 and at > now() - make_interval(secs => $2::int)`,
      [key, windowSeconds],
    );
    if (c[0].n >= max) return false;
    await tx.unsafe(`insert into ${S}.rate_events (kind, key) values ('demo_login', $1)`, [key]);
    return true;
  });
}
