// The document functions' seams (MIN-4475): what a handler needs from the database and from storage,
// the session check every one of them starts with, and the pure confirm logic. Handlers import
// this file only, so a test can run them against a fake store; pgstore.ts and blobs.ts are the real ones.
import {
  ConfirmDocRequest,
  DocumentKind,
  DocumentRow,
  type ErrorCode,
  FindingRow,
  type HealthappEnv,
  ResultRow,
} from "./contract.ts";
import type { AnalysisFields } from "./analysis.ts";
import { flagOf } from "./extract.ts";
import type { DraftIn } from "./extract.ts";
import type { IdentityProfile } from "./identity.ts";
import { readEnv } from "./env.ts";
import { fail } from "./http.ts";
import type { z } from "npm:zod@4.6.7";

export type Role = "patient" | "doctor";
/** A document row as the server sees it: before the photo is read, kind is still null. */
export const DocRecordSchema = DocumentRow.extend({ kind: DocumentKind.nullable() });
export type DocRecord = z.infer<typeof DocRecordSchema>;
export type ResultRec = z.infer<typeof ResultRow>;
export type FindingRec = z.infer<typeof FindingRow>;
/** Server-side columns that never go to the client. */
export interface DocMeta {
  storage_path: string | null;
  content_type: string | null;
  sha256_file: string | null;
  sha256_record: string | null;
  printed_name: string | null;
  printed_id: string | null;
}
export interface DocState {
  document: DocRecord;
  meta: DocMeta;
  results: ResultRec[];
  findings: FindingRec[];
}
export type Saved = DocState;

export interface ConfirmPlan {
  exam_date: string;
  results: { id: string; value_num: number | null; value_text: string | null; unit: string | null; flag: string; edited: boolean }[];
  findings: { id: string; text_original: string; finding_date: string | null; edited: boolean }[];
  sha256_record: string;
}
export type PlanOutcome =
  | { kind: "plan"; plan: ConfirmPlan }
  | { kind: "already" }
  | { kind: "error"; status: number; code: ErrorCode; message: string };

export interface Store {
  roleOf(env: HealthappEnv, uid: string): Promise<Role | null>;
  createDraft(env: HealthappEnv, patientId: string, contentType: string): Promise<{ id: string; storage_path: string }>;
  getOwn(env: HealthappEnv, patientId: string, docId: string): Promise<DocState | null>;
  /** Any document, for the doctor path of doc-photo. The caller must then prove a grant. */
  getAny(env: HealthappEnv, docId: string): Promise<DocState | null>;
  /** The grant's end if the doctor holds a live grant on this patient, else null. */
  liveGrantEnd(env: HealthappEnv, grantId: string, doctorId: string, patientId: string): Promise<string | null>;
  saveExtraction(
    env: HealthappEnv,
    patientId: string,
    docId: string,
    draft: DraftIn,
    sha256File: string,
    identity: "match" | "name_only",
  ): Promise<Saved | null>;
  /** The stored object's own metadata (type, size, upload time) from storage, or null when there is no object. */
  objectMeta(env: HealthappEnv, path: string): Promise<ObjectMeta | null>;
  /** Upserts the one analysis row of a document of this patient (MIN-4549). Twice leaves one row. */
  saveAnalysis(env: HealthappEnv, patientId: string, docId: string, f: AnalysisFields): Promise<void>;
  /** The match keys of the patient's own profile (never sent to a client). */
  identityOf(env: HealthappEnv, uid: string): Promise<IdentityProfile | null>;
  discardDraft(env: HealthappEnv, patientId: string, docId: string): Promise<void>;
  /** Runs `plan` on the row inside one transaction (row locked), then writes what it returns. */
  confirm(
    env: HealthappEnv,
    patientId: string,
    docId: string,
    plan: (s: DocState) => Promise<PlanOutcome>,
  ): Promise<{ state: DocState } | { error: Extract<PlanOutcome, { kind: "error" }> } | null>;
}

export interface ObjectMeta {
  mime: string | null;
  size: number | null;
  created_at: string | null;
}

export interface Blobs {
  createSignedUpload(bucket: string, path: string): Promise<{ token: string; signed_url: string } | null>;
  download(bucket: string, path: string): Promise<Uint8Array | null>;
  remove(bucket: string, path: string): Promise<void>;
  signedUrl(bucket: string, path: string, seconds: number): Promise<string | null>;
}

export interface Auth {
  /** The user id behind a session access token (GoTrue), or null. */
  verify(token: string): Promise<string | null>;
}

// ---------------------------------------------------------------------------------------------
// The session check: env header, bearer token, a profile in healthapp_<env> with the right role.
// "Signed in" proves nothing on Conductor's shared auth.users, so the profile is the gate.
// ---------------------------------------------------------------------------------------------
export async function authenticate(
  req: Request,
  deps: { auth: Auth; store: Pick<Store, "roleOf"> },
  allowed: Role[],
): Promise<{ env: HealthappEnv; uid: string; role: Role } | Response> {
  const env = readEnv(req);
  if (!env) return fail(req, 400, "bad_request", "x-healthapp-env must be dev or demo");
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return fail(req, 401, "unauthenticated", "Sign in first.");
  const uid = await deps.auth.verify(token);
  if (!uid) return fail(req, 401, "unauthenticated", "Sign in first.");
  const role = await deps.store.roleOf(env, uid);
  if (!role) return fail(req, 403, "no_profile", "This account has no healthapp profile.");
  if (!allowed.includes(role)) return fail(req, 403, "wrong_role", "This action is not available for this role.");
  return { env, uid, role };
}

export async function readJson(req: Request): Promise<{ ok: true; body: unknown } | { ok: false }> {
  try {
    return { ok: true, body: await req.json() };
  } catch {
    return { ok: false };
  }
}

// ---------------------------------------------------------------------------------------------
// Confirm: edits to values, units and dates only; name and ID can never be edited.
// ---------------------------------------------------------------------------------------------
/** Keys the confirm request may carry. Anything else, a name or an ID above all, is refused. */
export const CONFIRM_KEYS = ["doc_id", "exam_date", "results", "findings"];
export const RESULT_EDIT_KEYS = ["id", "value_num", "value_text", "unit"];
export const FINDING_EDIT_KEYS = ["id", "text_original", "finding_date"];

export function forbiddenConfirmKey(body: unknown): string | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
  const b = body as Record<string, unknown>;
  for (const k of Object.keys(b)) if (!CONFIRM_KEYS.includes(k)) return k;
  for (const [list, allowed] of [[b.results, RESULT_EDIT_KEYS], [b.findings, FINDING_EDIT_KEYS]] as const) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (typeof item !== "object" || item === null) continue;
      for (const k of Object.keys(item)) if (!allowed.includes(k)) return k;
    }
  }
  return null;
}

function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o).sort().map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`).join(",")}}`;
  }
  return JSON.stringify(v ?? null);
}

export async function recordHash(
  doc: DocState["document"],
  sha256File: string | null,
  examDate: string,
  results: { id: string; analyte: string; value_num: number | null; value_text: string | null; unit: string | null; ref_low: number | null; ref_high: number | null; flag: string }[],
  findings: { id: string; kind: string; text_original: string; finding_date: string | null }[],
): Promise<string> {
  const rec = {
    document: {
      id: doc.id, patient_id: doc.patient_id, kind: doc.kind, language: doc.language, exam_date: examDate,
      issuer: doc.issuer, provenance: doc.provenance, sha256_file: sha256File,
    },
    results: results.map((r) => ({
      id: r.id, analyte: r.analyte, value_num: r.value_num, value_text: r.value_text, unit: r.unit,
      ref_low: r.ref_low, ref_high: r.ref_high, flag: r.flag,
    })).sort((a, b) => a.id.localeCompare(b.id)),
    findings: findings.map((f) => ({
      id: f.id, kind: f.kind, text_original: f.text_original, finding_date: f.finding_date,
    })).sort((a, b) => a.id.localeCompare(b.id)),
  };
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical(rec)));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const same = (a: unknown, b: unknown) => (a ?? null) === (b ?? null);
const isRealDate = (s: string) => {
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
};

export async function planConfirm(s: DocState, req: z.infer<typeof ConfirmDocRequest>): Promise<PlanOutcome> {
  const bad = (message: string): PlanOutcome => ({ kind: "error", status: 400, code: "bad_request", message });
  if (s.document.status === "confirmed") return { kind: "already" };
  if (!s.document.kind || !s.document.exam_date) return bad("This document has not been read yet.");

  let examDate = s.document.exam_date;
  if (req.exam_date !== undefined) {
    if (!isRealDate(req.exam_date)) return bad("exam_date is not a real date.");
    examDate = req.exam_date;
  }

  const results = s.results.map((r) => ({ ...r, edited: false }));
  for (const e of req.results) {
    const r = results.find((x) => x.id === e.id);
    if (!r) return bad("A result in the edit does not belong to this document.");
    let changed = false;
    if (e.value_num !== undefined && !same(e.value_num, r.value_num)) { r.value_num = e.value_num; changed = true; }
    if (e.value_text !== undefined && !same(e.value_text, r.value_text)) { r.value_text = e.value_text; changed = true; }
    if (e.unit !== undefined && !same(e.unit, r.unit)) { r.unit = e.unit; changed = true; }
    if (changed) {
      r.edited = true;
      r.flag = flagOf(r.value_num, r.ref_low, r.ref_high);
    }
  }
  const findings = s.findings.map((f) => ({ ...f, edited: false }));
  for (const e of req.findings) {
    const f = findings.find((x) => x.id === e.id);
    if (!f) return bad("A finding in the edit does not belong to this document.");
    let changed = false;
    if (e.text_original !== undefined) {
      const t = e.text_original.trim();
      if (!t) return bad("A finding cannot be empty.");
      if (t !== f.text_original) { f.text_original = t; changed = true; }
    }
    if (e.finding_date !== undefined) {
      if (e.finding_date !== null && !isRealDate(e.finding_date)) return bad("finding_date is not a real date.");
      if (!same(e.finding_date, f.finding_date)) { f.finding_date = e.finding_date; changed = true; }
    }
    if (changed) f.edited = true;
  }

  const sha256_record = await recordHash(s.document, s.meta.sha256_file, examDate, results, findings);
  return {
    kind: "plan",
    plan: {
      exam_date: examDate,
      results: results.map((r) => ({
        id: r.id, value_num: r.value_num, value_text: r.value_text, unit: r.unit, flag: r.flag, edited: r.edited,
      })),
      findings: findings.map((f) => ({
        id: f.id, text_original: f.text_original, finding_date: f.finding_date, edited: f.edited,
      })),
      sha256_record,
    },
  };
}
