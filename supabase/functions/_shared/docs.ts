// The document functions' seams (MIN-4475): what a handler needs from the database and from storage,
// the session check every one of them starts with, and the pure confirm logic. Handlers import
// this file only, so a test can run them against a fake store; pgstore.ts and blobs.ts are the real ones.
import {
  ConfirmDocRequest,
  DocumentKind,
  type DocumentDraft,
  DocumentRow,
  type ErrorCode,
  type ExamListItem,
  type ExamReason,
  type FailReason,
  FindingRow,
  type HealthappEnv,
  type RefusalReason,
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
  /** The per-field confidence the extraction stored (documents.extract_confidence), for the review of a draft. */
  header_confidence?: DocumentDraft["header_confidence"] | null;
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

/** One row of the patient's upload list as the store reads it: columns and a count, nothing from the file. */
export interface ExamRow {
  id: string;
  status: string;
  status_reason: string | null;
  created_at: string;
  status_at: string;
  kind: string | null;
  exam_date: string | null;
  read_attempts: number;
  has_file: boolean;
  values_read: number;
  unchecked: boolean;
  /** MIN-4637: the row carries a 14-day end for a kept refused file (documents.file_kept_until) and that end has passed.
   *  Computed by the store on its own clock, so the list and the claim agree on "passed". */
  kept_expired: boolean;
}

/** The test for saving a reading with no tap (CTO, MIN-4555 addendum §1), on what the reading produced. The reading
 *  succeeded and the identity check did not refuse by the time this runs; the reading must also say what kind of exam it is
 *  and carry at least one result or finding. Not met: the reading is saved as a draft for the patient to confirm. */
export function autoConfirmable(d: { kind: string | null; results: readonly unknown[]; findings: readonly unknown[] }): boolean {
  return d.kind !== null && d.results.length + d.findings.length > 0;
}

/** A failed upload is read again by the patient at most this many times; then it is Delete only (CTO, MIN-4555 §3). */
export const MAX_READS = 3;
/** The lazy sweep's limits: a row reading this long, or waiting this long, is dead (CTO, MIN-4555 §3). */
export const READING_STUCK_MINUTES = 3;
export const QUEUED_STUCK_MINUTES = 10;
/** A refused scan keeps its original this many days, for "Try again" after a fix (CTO decision on MIN-4613, part B; the
 *  founder's yes, 2026-11-15). Set at the first refusal; a re-run never extends it. */
export const KEEP_REFUSED_DAYS = 14;

/** The list's row for one upload. A draft that was never read (a row from before this change) is shown as failed,
 *  computed here and never stored. Kind, date and the count are shown only once there is something read to show. */
export function toListItem(r: ExamRow): ExamListItem {
  const neverRead = r.status === "draft" && r.kind === null;
  const status = (neverRead ? "failed" : r.status) as ExamListItem["status"];
  const reason = (neverRead ? "not_read" : r.status_reason) as ExamReason | null;
  const read = (status === "draft" || status === "confirmed");
  return {
    id: r.id,
    status,
    reason: status === "refused" || status === "failed" ? reason : null,
    uploaded_at: r.created_at,
    status_at: r.status_at,
    kind: read ? (r.kind as ExamListItem["kind"]) : null,
    exam_date: read ? r.exam_date : null,
    values_read: read ? r.values_read : null,
    // The one "Try again" signal (MIN-4637): a failed upload as before, and a refused one whose original is kept. Either way
    // only while the file is there, its 14 days (if it has any) have not passed and it was read fewer than three times:
    // exactly the rows claimForReading will take.
    can_retry: (status === "failed" || status === "refused") && r.has_file && !r.kept_expired && r.read_attempts < MAX_READS &&
      reason !== "no_file" && reason !== "unsupported_type",
    can_delete: status !== "confirmed",
    // The copy signal: a refused upload whose original is still stored (kept 14 days, deletable). Never for another status.
    file_kept: status === "refused" && r.has_file,
    // The mark exists only on a saved exam; a draft, whatever its column says, is already waiting for the owner.
    unchecked: status === "confirmed" && r.unchecked,
  };
}

export interface Store {
  roleOf(env: HealthappEnv, uid: string): Promise<Role | null>;
  createDraft(env: HealthappEnv, patientId: string, contentType: string): Promise<{ id: string; storage_path: string }>;
  getOwn(env: HealthappEnv, patientId: string, docId: string): Promise<DocState | null>;
  /** Any document, for the doctor path of doc-photo. The caller must then prove a grant. */
  getAny(env: HealthappEnv, docId: string): Promise<DocState | null>;
  /** The grant's end if the doctor holds a live grant on this patient, else null. */
  liveGrantEnd(env: HealthappEnv, grantId: string, doctorId: string, patientId: string): Promise<string | null>;
  /** Atomically takes an upload for reading (queued, failed, a draft that was never read, or a refused one whose file is
   *  kept (MIN-4637); read fewer than MAX_READS times; and never a row whose 14-day end has passed): status reading, one more
   *  attempt. Null when it is not the caller's or cannot be taken now, so a second kick reads nothing twice. */
  claimForReading(env: HealthappEnv, patientId: string, docId: string): Promise<DocState | null>;
  /** Writes the draft of a row that is `reading`, and moves it to `draft`. Null when the row is not reading any more
   *  (deleted, or swept as stuck). */
  saveExtraction(
    env: HealthappEnv,
    patientId: string,
    docId: string,
    draft: DraftIn,
    sha256File: string,
    identity: "match" | "name_only",
    /** The automatic save (MIN-4555 addendum). When given, `plan` runs on the saved row inside the same transaction and, if
     *  it yields a plan, the row is confirmed there and then (unchecked true): it goes from reading to confirmed with no
     *  visible draft in between. When the plan is refused the row stays a draft. */
    auto?: { plan: (s: DocState) => Promise<PlanOutcome> },
  ): Promise<Saved | null>;
  /** reading -> refused, keeping the reason code, the times and the original (MIN-4637): storage_path, content_type and
   *  sha256_file stay, the record hash and every extracted field are set to null in the same statement, and the file's
   *  end is set to KEEP_REFUSED_DAYS from now unless it already has one (a refused re-run keeps the first refusal's end).
   *  False when the row was not reading. The file is never deleted here. */
  markRefused(env: HealthappEnv, patientId: string, docId: string, reason: RefusalReason): Promise<boolean>;
  /** reading -> failed with a reason code; at MAX_READS the code becomes too_many_attempts. Only from `reading`. */
  markFailed(env: HealthappEnv, patientId: string, docId: string, reason: FailReason): Promise<void>;
  /** The caller's rows that have been reading for READING_STUCK_MINUTES or queued for QUEUED_STUCK_MINUTES become
   *  failed (stuck; no_file for a queued row whose photo never arrived). Returns how many. */
  sweepStuck(env: HealthappEnv, patientId: string): Promise<number>;
  /** The caller's own uploads, newest first. */
  listOwn(env: HealthappEnv, patientId: string): Promise<ExamRow[]>;
  /** MIN-4637: the caller's refused or failed rows that still hold a file whose 14-day end has passed (store's clock). */
  expiredKeptFiles(env: HealthappEnv, patientId: string): Promise<{ id: string; storage_path: string }[]>;
  /** MIN-4637: after the storage API deleted the object, clears storage_path, content_type, sha256_file and
   *  file_kept_until on that row, only if it is still the caller's, still refused or failed, still that path and still
   *  past its end. False when nothing matched. */
  dropKeptFile(env: HealthappEnv, patientId: string, docId: string, path: string): Promise<boolean>;
  /** The stored object's own metadata (type, size, upload time) from storage, or null when there is no object. */
  objectMeta(env: HealthappEnv, path: string): Promise<ObjectMeta | null>;
  /** Upserts the one analysis row of a document of this patient (MIN-4549). Twice leaves one row. */
  saveAnalysis(env: HealthappEnv, patientId: string, docId: string, f: AnalysisFields): Promise<void>;
  /** confirmed -> draft for the owner's own exam: confirmed_at null, unchecked false. Values, file and file analysis stay.
   *  Null when the upload is not the caller's or does not exist; `not_confirmed` when it is not a saved exam. */
  unconfirm(env: HealthappEnv, patientId: string, docId: string): Promise<DocState | "not_confirmed" | null>;
  /** The owner opened a saved exam: clears `unchecked` on it. False when it was not marked (or not theirs, or not confirmed). */
  markOpened(env: HealthappEnv, patientId: string, docId: string): Promise<boolean>;
  /** The match keys of the patient's own profile (never sent to a client). */
  identityOf(env: HealthappEnv, uid: string): Promise<IdentityProfile | null>;
  /** Deletes an upload of the caller that is not saved (any status but confirmed). False when there is none. */
  deleteUnsaved(env: HealthappEnv, patientId: string, docId: string): Promise<boolean>;
  /** Runs `plan` on the row inside one transaction (row locked), then writes what it returns. The one place that writes
   *  `confirmed`: the patient's confirm and the automatic save of a scanned exam both come through here, so they cannot
   *  differ. `unchecked` is true only for the automatic one; any confirm by the patient leaves it false. */
  confirm(
    env: HealthappEnv,
    patientId: string,
    docId: string,
    plan: (s: DocState) => Promise<PlanOutcome>,
    opts?: { unchecked?: boolean },
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
  /** True when the object is gone (or was never there); false when the storage refused. */
  remove(bucket: string, path: string): Promise<boolean>;
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
