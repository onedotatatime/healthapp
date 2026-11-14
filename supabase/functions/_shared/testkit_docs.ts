// Test helpers only (never imported by a function): an in-memory Store, Blobs and Auth for the
// document handlers. The fake enforces the same ownership filter as pgstore.ts, so "another patient's
// document" is a test of the handler's use of the store, not of the fake.
import type { HealthappEnv } from "./contract.ts";
import {
  type Auth,
  type Blobs,
  type DocState,
  type PlanOutcome,
  type Role,
  type Saved,
  type Store,
} from "./docs.ts";
import type { AnalysisFields } from "./analysis.ts";
import type { DraftIn } from "./extract.ts";
import type { IdentityProfile } from "./identity.ts";

export const PATIENT = "11111111-1111-4111-8111-111111111111";
export const PATIENT2 = "22222222-2222-4222-8222-222222222222";
export const DOCTOR = "33333333-3333-4333-8333-333333333333";
export const OUTSIDER = "44444444-4444-4444-8444-444444444444";
export const TOKENS: Record<string, string> = { tp: PATIENT, tp2: PATIENT2, td: DOCTOR, to: OUTSIDER };
const ROLES: Record<string, Role> = { [PATIENT]: "patient", [PATIENT2]: "patient", [DOCTOR]: "doctor" };

const PROFILES: Record<string, IdentityProfile> = {
  [PATIENT]: { full_name: "Μαρία Παπαδοπούλου", full_name_latin: "Maria Papadopoulou", national_id_norm: "AK123456" },
  [PATIENT2]: { full_name: "Ελένη Δημητρίου", full_name_latin: "Eleni Dimitriou", national_id_norm: "AB555555" },
};

export const fakeAuth: Auth = { verify: (t) => Promise.resolve(TOKENS[t] ?? null) };

export function fakeStore() {
  const docs = new Map<string, DocState>();
  const grants = new Map<string, { doctor: string; patient: string; end: string }>();
  /** file_analysis rows by document id: an upsert, like the table's primary key. */
  const analyses = new Map<string, AnalysisFields & { patient_id: string }>();
  let saves = 0;
  let seq = 0;
  const calls: string[] = [];
  const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  const store: Store = {
    roleOf: (_e, uid) => Promise.resolve(ROLES[uid] ?? null),
    identityOf: (_e, uid) => Promise.resolve(PROFILES[uid] ?? null),
    objectMeta: (_e, path) => {
      const d = [...docs.values()].find((x) => x.meta.storage_path === path);
      return Promise.resolve(d ? { mime: d.meta.content_type, size: null, created_at: "2026-11-14T10:00:30.000+00:00" } : null);
    },
    saveAnalysis(_e, patientId, docId, f) {
      saves++;
      const d = docs.get(docId);
      if (d && d.document.patient_id === patientId) analyses.set(docId, { ...f, patient_id: patientId });
      return Promise.resolve();
    },
    createDraft(_e, patientId, contentType) {
      const id = uuid(++seq);
      const path = `${patientId}/${id}`;
      docs.set(id, {
        document: {
          id, patient_id: patientId, kind: null as never, language: null, exam_date: null, issuer: null,
          identity_status: null, provenance: "uploaded_by_patient", status: "draft",
          created_at: "2026-11-14T10:00:00.000+00:00", confirmed_at: null,
        },
        meta: { storage_path: path, content_type: contentType, sha256_file: null, sha256_record: null, printed_name: null, printed_id: null },
        results: [], findings: [],
      });
      calls.push("createDraft");
      return Promise.resolve({ id, storage_path: path });
    },
    getOwn: (_e, p, id) => Promise.resolve(docs.get(id)?.document.patient_id === p ? docs.get(id)! : null),
    getAny: (_e, id) => Promise.resolve(docs.get(id) ?? null),
    liveGrantEnd(_e, gid, doctor, patient) {
      const g = grants.get(gid);
      return Promise.resolve(g && g.doctor === doctor && g.patient === patient && Date.parse(g.end) > Date.now() ? g.end : null);
    },
    saveExtraction(_e, patientId, docId, d: DraftIn, sha, identity): Promise<Saved | null> {
      calls.push("saveExtraction");
      const cur = docs.get(docId);
      if (!cur || cur.document.patient_id !== patientId || cur.document.status !== "draft") return Promise.resolve(null);
      let n = 0;
      cur.document = { ...cur.document, kind: d.kind, language: d.language, exam_date: d.exam_date, issuer: d.issuer, identity_status: identity };
      cur.meta = { ...cur.meta, sha256_file: sha, printed_name: d.printed_name, printed_id: d.printed_id };
      cur.results = d.results.map((r) => ({ ...r, id: uuid(1000 + ++n), document_id: docId, patient_id: patientId, edited_by_patient: false }));
      cur.findings = d.findings.map((f) => ({ ...f, id: uuid(2000 + ++n), document_id: docId, patient_id: patientId, edited_by_patient: false }));
      return Promise.resolve(cur);
    },
    discardDraft(_e, p, id) {
      calls.push("discardDraft");
      if (docs.get(id)?.document.patient_id === p && docs.get(id)?.document.status === "draft") docs.delete(id);
      return Promise.resolve();
    },
    async confirm(_e, patientId, docId, plan) {
      calls.push("confirm");
      const cur = docs.get(docId);
      if (!cur || cur.document.patient_id !== patientId) return null;
      const o: PlanOutcome = await plan(cur);
      if (o.kind === "error") return { error: o };
      if (o.kind === "already") return { state: cur };
      for (const r of o.plan.results) {
        const row = cur.results.find((x) => x.id === r.id)!;
        Object.assign(row, { value_num: r.value_num, value_text: r.value_text, unit: r.unit, flag: r.flag });
        row.edited_by_patient = row.edited_by_patient || r.edited;
      }
      for (const f of o.plan.findings) {
        const row = cur.findings.find((x) => x.id === f.id)!;
        Object.assign(row, { text_original: f.text_original, finding_date: f.finding_date });
        row.edited_by_patient = row.edited_by_patient || f.edited;
      }
      cur.document = { ...cur.document, exam_date: o.plan.exam_date, status: "confirmed", confirmed_at: "2026-11-14T10:05:00.000+00:00" };
      cur.meta.sha256_record = o.plan.sha256_record;
      return { state: cur };
    },
  };
  return { store, docs, grants, calls, analyses, saves: () => saves };
}

export function fakeBlobs() {
  const files = new Map<string, Uint8Array>();
  const removed: string[] = [];
  const signed: { path: string; seconds: number }[] = [];
  const blobs: Blobs = {
    createSignedUpload: (b, p) => Promise.resolve({ token: "upload-token", signed_url: `https://x.supabase.co/storage/v1/object/upload/sign/${b}/${p}?token=upload-token` }),
    download: (_b, p) => Promise.resolve(files.get(p) ?? null),
    remove(_b, p) { removed.push(p); files.delete(p); return Promise.resolve(); },
    signedUrl(b, p, seconds) { signed.push({ path: p, seconds }); return Promise.resolve(`https://x.supabase.co/storage/v1/object/sign/${b}/${p}?token=t`); },
  };
  return { blobs, files, removed, signed };
}

export function call(fn: string, body: unknown, token: string | null = "tp", env: string | null = "dev"): Request {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  if (env) headers["x-healthapp-env"] = env;
  return new Request(`https://x/functions/v1/${fn}`, { method: "POST", headers, body: typeof body === "string" ? body : JSON.stringify(body) });
}

export const ENV: HealthappEnv = "dev";
