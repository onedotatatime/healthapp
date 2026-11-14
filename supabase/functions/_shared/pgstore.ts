// The real Store (MIN-4475): Postgres over SUPABASE_DB_URL, not PostgREST. healthapp_<env> is not in
// the Data API's exposed schemas, and this keeps working whether or not it ever is. It runs as the
// database owner, so RLS does not apply: every query below filters on patient_id (or the grant) itself,
// and the handler has already checked the session and the role (docs.ts authenticate).
// The schema name comes from the validated env (dev | demo), never from input. Values are parameters.
import postgres from "npm:postgres@3.4.5";
import { bucketFor, DocumentDraft, FindingRow, type HealthappEnv, ResultRow } from "./contract.ts";
import {
  type DocMeta,
  DocRecordSchema,
  type DocState,
  type ConfirmPlan,
  type ExamRow,
  MAX_READS,
  type PlanOutcome,
  QUEUED_STUCK_MINUTES,
  READING_STUCK_MINUTES,
  type Role,
  type Saved,
  type Store,
} from "./docs.ts";
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
    header_confidence: DocumentDraft.shape.header_confidence.safeParse(d.extract_confidence).data ?? null,
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

/** The one writer of `confirmed`: the patient's confirm and the automatic save of a scanned exam both end here, so they
 *  cannot differ (same edits applied, same record hash, same confirmed_at). `unchecked` is true only for the automatic one. */
async function writeConfirm(tx: Q, S: string, docId: string, p: ConfirmPlan, unchecked: boolean): Promise<void> {
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
    `update ${S}.documents set exam_date = $2, status = 'confirmed', confirmed_at = now(), sha256_record = $3, unchecked = $4::boolean where id = $1`,
    [docId, p.exam_date, p.sha256_record, unchecked],
  );
}

export const pgStore: Store = {
  async roleOf(env, uid) {
    const rows = await db().unsafe(`select role from ${schema(env)}.profiles where id = $1`, [uid]);
    const role = rows[0]?.role;
    return role === "patient" || role === "doctor" ? (role as Role) : null;
  },

  async identityOf(env, uid) {
    const rows = await db().unsafe(
      `select full_name, full_name_latin, national_id_norm from ${schema(env)}.profiles where id = $1`,
      [uid],
    );
    const r = rows[0];
    return r ? { full_name: r.full_name, full_name_latin: r.full_name_latin, national_id_norm: r.national_id_norm } : null;
  },

  async objectMeta(env, path) {
    const rows = await db().unsafe(
      `select metadata->>'mimetype' as mime, (metadata->>'size')::bigint as size, to_json(created_at) #>> '{}' as created_at
         from storage.objects where bucket_id = $1 and name = $2`,
      [bucketFor(env), path],
    );
    const r = rows[0];
    return r ? { mime: r.mime ?? null, size: r.size === null ? null : Number(r.size), created_at: r.created_at ?? null } : null;
  },

  async saveAnalysis(env, patientId, docId, f) {
    await db().unsafe(
      `insert into ${schema(env)}.file_analysis
         (document_id, patient_id, status, error_code, doc_type, pages, readable, blurred, cropped, rotated, handwriting_present,
          issuer_present, date_present, stamp_or_signature_present, sha256, mime, bytes, uploaded_at, hash_verified,
          items_count, items, analysed_at)
       select d.id, d.patient_id, $3, $4, $5, $6::int, $7::boolean, $8::boolean, $9::boolean, $10::boolean, $11::boolean,
              $12::boolean, $13::boolean, $14::boolean, $15, $16, $17::bigint, $18::timestamptz, $19::boolean,
              $20::int, $21::jsonb, now()
         from ${schema(env)}.documents d where d.id = $1::uuid and d.patient_id = $2::uuid
       on conflict (document_id) do update set
         status = excluded.status, error_code = excluded.error_code, doc_type = excluded.doc_type, pages = excluded.pages,
         readable = excluded.readable, blurred = excluded.blurred, cropped = excluded.cropped, rotated = excluded.rotated,
         handwriting_present = excluded.handwriting_present, issuer_present = excluded.issuer_present,
         date_present = excluded.date_present, stamp_or_signature_present = excluded.stamp_or_signature_present,
         sha256 = excluded.sha256, mime = excluded.mime, bytes = excluded.bytes, uploaded_at = excluded.uploaded_at,
         hash_verified = excluded.hash_verified, items_count = excluded.items_count, items = excluded.items,
         analysed_at = excluded.analysed_at`,
      [docId, patientId, f.status, f.error_code, f.doc_type, f.pages, f.readable, f.blurred, f.cropped, f.rotated,
        f.handwriting_present, f.issuer_present, f.date_present, f.stamp_or_signature_present, f.sha256, f.mime, f.bytes,
        f.uploaded_at, f.hash_verified, f.items_count, jsonb(f.items)],
    );
  },

  async createDraft(env, patientId, contentType) {
    const id = crypto.randomUUID();
    const path = `${patientId}/${id}`;
    await db().unsafe(
      `insert into ${schema(env)}.documents (id, patient_id, status, storage_path, content_type) values ($1, $2, 'queued', $3, $4)`,
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

  async claimForReading(env, patientId, docId) {
    const S = schema(env);
    // One statement is the lock: two kicks cannot both take the row, so nothing is read twice.
    const up = await db().unsafe(
      `update ${S}.documents set status = 'reading', status_reason = null, status_at = now(), read_attempts = read_attempts + 1
        where id = $1::uuid and patient_id = $2::uuid and read_attempts < $3::int
          and (status in ('queued', 'failed') or (status = 'draft' and kind is null)) returning id`,
      [docId, patientId, MAX_READS],
    );
    return up.length === 0 ? null : await load(db(), S, "d.id = $1 and d.patient_id = $2", [docId, patientId]);
  },

  async markRefused(env, patientId, docId, reason) {
    const S = schema(env);
    return await db().begin(async (tx) => {
      // The row keeps the code and the times. Everything the file or the reading put on it is cleared in this statement.
      const up = await tx.unsafe(
        `update ${S}.documents set status = 'refused', status_reason = $3, status_at = now(),
                storage_path = null, content_type = null, sha256_file = null, sha256_record = null, kind = null, language = null,
                exam_date = null, issuer = null, printed_name = null, printed_id = null, identity_status = null, extract_confidence = null
          where id = $1::uuid and patient_id = $2::uuid and status = 'reading' returning id`,
        [docId, patientId, reason],
      );
      if (up.length === 0) return false;
      await tx.unsafe(`delete from ${S}.results where document_id = $1::uuid`, [docId]);
      await tx.unsafe(`delete from ${S}.findings where document_id = $1::uuid`, [docId]);
      return true;
    });
  },

  async markFailed(env, patientId, docId, reason) {
    await db().unsafe(
      `update ${schema(env)}.documents
          set status = 'failed', status_reason = case when read_attempts >= $4::int then 'too_many_attempts' else $3 end, status_at = now()
        where id = $1::uuid and patient_id = $2::uuid and status = 'reading'`,
      [docId, patientId, reason, MAX_READS],
    );
  },

  async sweepStuck(env, patientId) {
    const S = schema(env);
    const r = await db().unsafe(
      `update ${S}.documents d set status = 'failed', status_at = now(),
              status_reason = case when d.read_attempts >= $4::int then 'too_many_attempts'
                                   when d.status = 'queued' and not exists
                                     (select 1 from storage.objects o where o.bucket_id = $2 and o.name = d.storage_path) then 'no_file'
                                   else 'stuck' end
        where d.patient_id = $1::uuid
          and ((d.status = 'reading' and d.status_at < now() - make_interval(mins => $5::int))
            or (d.status = 'queued' and d.status_at < now() - make_interval(mins => $3::int)))
        returning d.id`,
      [patientId, bucketFor(env), QUEUED_STUCK_MINUTES, MAX_READS, READING_STUCK_MINUTES],
    );
    return r.length;
  },

  async listOwn(env, patientId) {
    const S = schema(env);
    const rows = await db().unsafe(
      `select d.id::text as id, d.status, d.status_reason, to_json(d.created_at) #>> '{}' as created_at,
              to_json(d.status_at) #>> '{}' as status_at, d.kind, to_char(d.exam_date, 'YYYY-MM-DD') as exam_date,
              d.read_attempts::int as read_attempts, (d.storage_path is not null) as has_file, d.unchecked,
              (select count(*)::int from ${S}.results r where r.document_id = d.id) as values_read
         from ${S}.documents d where d.patient_id = $1::uuid order by d.created_at desc, d.id`,
      [patientId],
    );
    return rows as unknown as ExamRow[];
  },

  async saveExtraction(env, patientId, docId, draft: DraftIn, sha256File, identity, auto): Promise<Saved | null> {
    const S = schema(env);
    return await db().begin(async (tx) => {
      const up = await tx.unsafe(
        `update ${S}.documents set kind = $3, language = $4, exam_date = $5, issuer = $6, printed_name = $7,
                printed_id = $8, extract_confidence = $9::jsonb, sha256_file = $10, identity_status = $11,
                status = 'draft', status_reason = null, status_at = now()
          where id = $1 and patient_id = $2 and status = 'reading' returning id`,
        [docId, patientId, draft.kind, draft.language, draft.exam_date, draft.issuer, draft.printed_name,
          draft.printed_id, jsonb(draft.header_confidence), sha256File, identity],
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
      let st = await load(tx, S, "d.id = $1", [docId]);
      // The automatic save (MIN-4555 addendum) is in this same transaction: the row goes from `reading` straight to
      // `confirmed`, so a client that polls never sees a `draft` it must then watch turn into a saved exam.
      if (st && auto) {
        const o = await auto.plan(st);
        if (o.kind === "plan") {
          await writeConfirm(tx, S, docId, o.plan, true);
          st = await load(tx, S, "d.id = $1", [docId]);
        }
      }
      return st;
    });
  },

  async deleteUnsaved(env, patientId, docId) {
    const r = await db().unsafe(
      `delete from ${schema(env)}.documents where id = $1::uuid and patient_id = $2::uuid and status <> 'confirmed' returning id`,
      [docId, patientId],
    );
    return r.length > 0;
  },

  async unconfirm(env, patientId, docId) {
    const S = schema(env);
    return await db().begin(async (tx) => {
      const cur = await load(tx, S, "d.id = $1 and d.patient_id = $2", [docId, patientId], true);
      if (!cur) return null;
      if (cur.document.status !== "confirmed") return "not_confirmed" as const;
      await tx.unsafe(
        `update ${S}.documents set status = 'draft', confirmed_at = null, unchecked = false where id = $1::uuid and patient_id = $2::uuid and status = 'confirmed'`,
        [docId, patientId],
      );
      return await load(tx, S, "d.id = $1", [docId]);
    });
  },

  async markOpened(env, patientId, docId) {
    const r = await db().unsafe(
      `update ${schema(env)}.documents set unchecked = false where id = $1::uuid and patient_id = $2::uuid and status = 'confirmed' and unchecked returning id`,
      [docId, patientId],
    );
    return r.length > 0;
  },

  async confirm(env, patientId, docId, plan, opts) {
    const S = schema(env);
    return await db().begin(async (tx) => {
      const cur = await load(tx, S, "d.id = $1 and d.patient_id = $2", [docId, patientId], true);
      if (!cur) return null;
      const outcome: PlanOutcome = await plan(cur);
      if (outcome.kind === "error") return { error: outcome };
      if (outcome.kind === "already") return { state: cur };
      await writeConfirm(tx, S, docId, outcome.plan, opts?.unchecked === true);
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
