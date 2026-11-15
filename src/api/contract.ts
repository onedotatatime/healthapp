/**
 * Frontend copy of Cron's `contract.ts` (MIN-4471; shapes from CTO review section 3 and MIN-4449 decision 1).
 * Same file name and the same zod style, so the swap is: delete this file, copy Cron's `contract.ts`
 * (and its fixtures) from `staging`, fix the import names that differ. Nothing outside `src/api` and
 * `src/auth` reads the wire shapes.
 */
import { z } from 'zod';

export const Role = z.enum(['patient', 'doctor']);
export type Role = z.infer<typeof Role>;

/** A row of healthapp_<env>.profiles, read under RLS (own row). */
export const Profile = z.object({
  id: z.string(),
  role: Role,
  full_name: z.string(),
});
export type Profile = z.infer<typeof Profile>;

/** grants.status, review 3 row 9. The timer reads `expires_at` from the grant. */
export const GrantStatus = z.enum(['pending', 'active', 'refused', 'expired', 'revoked']);
export type GrantStatus = z.infer<typeof GrantStatus>;

// =============================================================================================
// A1 + A2 (MIN-4476): copied VERBATIM from Cron's contract.ts (MIN-4471, CONTRACT_VERSION 2026-11-14.5 for the MIN-4556 sections),
// supabase/functions/_shared/contract.ts. Swap = delete this section and import his file. Do not edit here.
// =============================================================================================
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const Uuid = z.string().regex(UUID_RE, "uuid");
/** ISO 8601 timestamp with offset, as Postgres timestamptz serialises it. */
export const Timestamp = z.string().min(20);
/** Calendar date, YYYY-MM-DD. */
export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");
export const DocumentKind = z.enum(["blood_test", "imaging_report", "doctor_letter"]);
/** queued -> reading -> draft | refused | failed, then draft -> confirmed (MIN-4556). A doctor only ever sees `confirmed`. */
export const DocumentStatus = z.enum(["queued", "reading", "draft", "refused", "failed", "confirmed"]);
export const IdentityStatus = z.enum(["match", "name_only"]);
export const Provenance = z.enum(["uploaded_by_patient", "verified_by_source"]);
export const Flag = z.enum(["low", "high", "normal", "unknown"]);
export const FindingKind = z.enum(["conclusion", "written_diagnosis", "medication", "note"]);
export const Language = z.enum(["el", "en"]);
export const UploadMime = z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

/** healthapp-demo-login (copied from Cron's contract.ts; MIN-4515 replaced the local stub). */
export const Persona = z.enum(["patient", "doctor"]);
export type Persona = z.infer<typeof Persona>;
// "founder" is the founder's own account in the demo deployment only (MIN-4541): dev answers 400.
export const DemoPersona = z.enum(["patient", "doctor", "founder"]);
export type DemoPersona = z.infer<typeof DemoPersona>;
export const DemoLoginRequest = z.object({ persona: DemoPersona, passcode: z.string().min(1).max(200) });
export const DemoLoginResponse = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  expires_at: z.number().int(), // unix seconds
  user_id: Uuid,
  persona: DemoPersona,
  role: Role,
});
export type DemoLoginResponse = z.infer<typeof DemoLoginResponse>;

// ---------------------------------------------------------------------------------------------
// Errors: every non-2xx answer has this body
// ---------------------------------------------------------------------------------------------
export const ErrorCode = z.enum([
  "bad_request", // 400: body or env header invalid
  "unauthenticated", // 401: no or bad session
  "bad_passcode", // 401: demo-login only
  "no_profile", // 403: signed in, but no profile in healthapp_<env>
  "wrong_role", // 403: e.g. a patient calling the assistant
  "grant_expired", // 403: the grant ended (expired, revoked, refused)
  "not_found", // 404: no such row for this caller
  "token_expired", // 409: handshake claim
  "token_used", // 409: handshake claim
  "token_invalid", // 404: handshake claim
  "rate_limited", // 429
  "model_unavailable", // 503: the model call failed after retries or timed out
  "internal", // 500
]);
export type ErrorCode = z.infer<typeof ErrorCode>;
export const ErrorBody = z.object({ error: z.object({ code: ErrorCode, message: z.string() }) });
export type ErrorBody = z.infer<typeof ErrorBody>;

export const DocumentRow = z.object({
  id: Uuid,
  patient_id: Uuid,
  kind: DocumentKind,
  language: Language.nullable(),
  exam_date: IsoDate.nullable(),
  issuer: z.string().nullable(),
  identity_status: IdentityStatus.nullable(),
  provenance: Provenance,
  status: DocumentStatus,
  created_at: Timestamp,
  confirmed_at: Timestamp.nullable(),
  /** MIN-4556 addendum: true from the automatic save of a scanned exam until its owner opens, confirms or unconfirms it.
   *  The fact it states: read automatically, the patient has not opened it. Not per value. */
  unchecked: z.boolean(),
});
export type DocumentRow = z.infer<typeof DocumentRow>;
export const DOCUMENT_COLUMNS =
  "id,patient_id,kind,language,exam_date,issuer,identity_status,provenance,status,created_at,confirmed_at,unchecked";

export const ResultRow = z.object({
  id: Uuid,
  document_id: Uuid,
  patient_id: Uuid,
  analyte: z.string(), // as printed
  analyte_key: z.string().nullable(), // normalised, for series over time
  value_num: z.number().nullable(),
  value_text: z.string().nullable(),
  unit: z.string().nullable(),
  ref_low: z.number().nullable(),
  ref_high: z.number().nullable(),
  ref_text: z.string().nullable(),
  flag: Flag, // computed by the server from the printed range, never by the model
  confidence: z.number().min(0).max(1).nullable(),
  edited_by_patient: z.boolean(),
});
export type ResultRow = z.infer<typeof ResultRow>;
export const RESULT_COLUMNS =
  "id,document_id,patient_id,analyte,analyte_key,value_num,value_text,unit,ref_low,ref_high,ref_text,flag,confidence,edited_by_patient";

export const FindingRow = z.object({
  id: Uuid,
  document_id: Uuid,
  patient_id: Uuid,
  kind: FindingKind,
  text_original: z.string(), // the document's own words, in its language
  text_lang: Language.nullable(),
  finding_date: IsoDate.nullable(),
  specialty: z.string().nullable(),
  confidence: z.number().min(0).max(1).nullable(),
  edited_by_patient: z.boolean(),
});
export type FindingRow = z.infer<typeof FindingRow>;
export const FINDING_COLUMNS =
  "id,document_id,patient_id,kind,text_original,text_lang,finding_date,specialty,confidence,edited_by_patient";

// healthapp-doc-create (patient) ---------------------------------------------------------------
// Settlement 5. Returns a draft document id and a signed upload for the private bucket.
// Upload with supabase.storage.from(bucket).uploadToSignedUrl(path, token, file).
export const DocCreateRequest = z.object({
  content_type: UploadMime,
  size_bytes: z.number().int().positive().max(20 * 1024 * 1024),
});
export const DocCreateResponse = z.object({
  doc_id: Uuid,
  bucket: z.string(),
  path: z.string(), // <patient uuid>/<document uuid>, never a file or person name
  token: z.string(),
  signed_url: z.string().url(),
});
export type DocCreateResponse = z.infer<typeof DocCreateResponse>;

// healthapp-extract-exam (patient) --------------------------------------------------------------
// MIN-4556: the phone sends the call with keepalive and does not wait. The function claims the upload, answers 202
// {outcome:"queued"} and reads in the background; the result is the row's status (healthapp-my-exams). Before it was one
// synchronous call of up to 60 s.
export const ExtractRequest = z.object({
  doc_id: Uuid,
  /** MIN-4549: run only the file analysis for an already-saved document of the caller (the dev backfill script).
   *  The app never sends it. Answer: AnalyseResponse. */
  analyse_only: z.boolean().optional(),
});
export const RefusalReason = z.enum([
  "unreadable", // the model says it cannot read the page
  "unsupported_kind", // not a blood test, imaging report or doctor's letter
  "incomplete", // no exam date, no printed name, or no result and no finding
  "name_missing", // no readable name on the document
  "name_mismatch", // the name on the document is different
  "id_mismatch", // the ID on the document is different
]);
export type RefusalReason = z.infer<typeof RefusalReason>;

export const DraftResult = ResultRow.omit({ patient_id: true });
export const DraftFinding = FindingRow.omit({ patient_id: true });
export const DocumentDraft = z.object({
  document: DocumentRow,
  printed_name: z.string().nullable(), // verbatim from the document, for the review screen
  printed_id: z.string().nullable(),
  /** Per header field, 0..1. Below LOW_CONFIDENCE the screen highlights the field. */
  header_confidence: z.object({
    exam_date: z.number().min(0).max(1).nullable(),
    issuer: z.number().min(0).max(1).nullable(),
    printed_name: z.number().min(0).max(1).nullable(),
    printed_id: z.number().min(0).max(1).nullable(),
  }),
  results: z.array(DraftResult),
  findings: z.array(DraftFinding),
});
export type DocumentDraft = z.infer<typeof DocumentDraft>;
export const LOW_CONFIDENCE = 0.6;

export const ExtractAccepted = z.object({ outcome: z.literal("queued") });
export type ExtractAccepted = z.infer<typeof ExtractAccepted>;

/** MIN-4556: the call answers 202 {outcome:"queued"} at once and never reads the model's answer. The draft and the
 *  refusal variants are what it returned before; they are not returned any more and stay only so client code that
 *  still names them compiles until MIN-4557 removes them. */
export const ExtractResponse = z.discriminatedUnion("outcome", [
  ExtractAccepted,
  z.object({ outcome: z.literal("draft"), draft: DocumentDraft }),
  z.object({
    outcome: z.literal("refused"),
    reason: RefusalReason,
    message: z.string(), // names what did not match; nothing was stored
    /** name_mismatch and id_mismatch only: the two values that differ (MIN-4478). Both are the patient's own. */
    mismatch: z.object({ printed: z.string(), profile: z.string() }).optional(),
  }),
]);
export type ExtractResponse = z.infer<typeof ExtractResponse>;

// healthapp-my-exams and healthapp-exam-delete (patient) -----------------------------------------
// MIN-4556 (CTO decision on MIN-4555). The patient's own uploads, one row each, newest first. Every call first
// sweeps the caller's stuck rows (reading > 3 min, queued > 10 min) to failed. No value, no mark, no verdict here:
// the row says where the upload is, and for a draft or a saved exam what kind it is, its date and how many values.
// Poll every 4 s while any row is queued or reading, stop when none is and while the tab is hidden.
export const FailReason = z.enum([
  "model_timeout", // the reader did not answer in time (after its one retry)
  "model_http", // the reader answered with an error (after its one retry)
  "model_invalid", // the reader's answer was not usable (after its one retry)
  "config", // reading is not configured on the server
  "too_many_attempts", // read three times and still failed: Delete only
  "stuck", // waiting or reading for too long
  "no_file", // the photo never arrived (the upload did not finish)
  "delete_failed", // old rows only: before MIN-4637 a refusal deleted the file, and this was a refusal whose delete failed
  "unsupported_type", // not a photo
  "error", // anything else
]);
export type FailReason = z.infer<typeof FailReason>;
/** Rows from before this change: a draft that was never read is shown as failed with this code, computed at read, never stored. */
export const NOT_READ = "not_read" as const;
export const ExamReason = z.union([RefusalReason, FailReason, z.literal(NOT_READ)]);
export type ExamReason = z.infer<typeof ExamReason>;

export const ExamListItem = z.object({
  id: Uuid,
  status: DocumentStatus,
  /** refused: a RefusalReason. failed: a FailReason, or "not_read" for an old draft that was never read. Otherwise null. */
  reason: ExamReason.nullable(),
  uploaded_at: Timestamp,
  /** When the status last changed. */
  status_at: Timestamp,
  /** draft and confirmed only. */
  kind: DocumentKind.nullable(),
  exam_date: IsoDate.nullable(),
  /** draft and confirmed only: how many values were read. No value, no flag. */
  values_read: z.number().int().min(0).nullable(),
  /** The one "Try again" signal. failed, or refused with its original kept (MIN-4637), and only while the file exists, its
   *  14 days have not passed and it has been read fewer than three times. The retry is a new call to extract-exam. */
  can_retry: z.boolean(),
  /** Every row that is not saved. */
  can_delete: z.boolean(),
  /** confirmed only: read and saved automatically, and its owner has not opened it yet. Always false for every other status. */
  unchecked: z.boolean(),
  /** refused only (MIN-4637): the original photo is still stored, for up to 14 days from the refusal, and the owner can
   *  delete it. False for every other status and for a refused row whose file is gone. It decides the copy, not the button.
   *  Defaults to false so a client built for this field still parses an answer from a function that does not send it yet
   *  (the function deploy is then the single switch, and a rollback of the functions does not take the list down). */
  file_kept: z.boolean().default(false),
});
export type ExamListItem = z.infer<typeof ExamListItem>;
/** No body needed. With { doc_id } the answer is that upload's draft (ExamDraftResponse) instead of the list. */
export const MyExamsRequest = z.object({ doc_id: Uuid.optional() });
export const MyExamsResponse = z.object({ exams: z.array(ExamListItem), server_now: Timestamp });
export type MyExamsResponse = z.infer<typeof MyExamsResponse>;
/** The exam beside the photo: what extract-exam used to return, read from the stored row. A draft opens the review (edit and Confirm);
 *  a confirmed exam answers the same shape, read-only, and the call clears its `unchecked` mark. `draft.document.status` says which.
 *  404 not_found unless the upload is the caller's and is a draft or confirmed. */
export const ExamDraftResponse = z.object({ draft: DocumentDraft });
export type ExamDraftResponse = z.infer<typeof ExamDraftResponse>;
/** Deletes an upload that is not saved, file included. 404 not_found for a saved or someone else's. */
export const ExamDeleteRequest = z.object({ doc_id: Uuid });
export const ExamDeleteResponse = z.object({ deleted: z.literal(true), doc_id: Uuid });
export type ExamDeleteResponse = z.infer<typeof ExamDeleteResponse>;

// healthapp-unconfirm-doc (patient, owner only) -------------------------------------------------
// confirmed -> draft: the exam leaves the doctor view, the file analysis and the matching at the next read (they all test
// status = 'confirmed'). Values, file and file analysis stay; confirm again is the existing healthapp-confirm-doc. No model.
// 404 not_found for someone else's upload or one that is not confirmed; 403 wrong_role for a doctor.
export const UnconfirmDocRequest = z.object({ doc_id: Uuid });
export const UnconfirmDocResponse = z.object({ document: DocumentRow });
export type UnconfirmDocResponse = z.infer<typeof UnconfirmDocResponse>;

// healthapp-confirm-doc (patient) ---------------------------------------------------------------
// Edits to values, units and dates are accepted and marked edited_by_patient.
// There is no field for name or ID: they cannot be edited.
export const ResultEdit = z.object({
  id: Uuid,
  value_num: z.number().nullable().optional(),
  value_text: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
});
export const FindingEdit = z.object({
  id: Uuid,
  text_original: z.string().optional(),
  finding_date: IsoDate.nullable().optional(),
});
export const ConfirmDocRequest = z.object({
  doc_id: Uuid,
  exam_date: IsoDate.optional(),
  results: z.array(ResultEdit).default([]),
  findings: z.array(FindingEdit).default([]),
});
export const ConfirmDocResponse = z.object({
  document: DocumentRow,
  results: z.array(ResultRow),
  findings: z.array(FindingRow),
  sha256_record: z.string().regex(/^[0-9a-f]{64}$/),
});
export type ConfirmDocResponse = z.infer<typeof ConfirmDocResponse>;

// healthapp-doc-photo (patient, or doctor in a live grant) --------------------------------------
export const DocPhotoRequest = z.object({ doc_id: Uuid, grant_id: Uuid.optional() });
export const DocPhotoResponse = z.object({
  signed_url: z.string().url(),
  expires_at: Timestamp, // 60 s, never beyond the grant's end
  content_type: UploadMime,
  fingerprint: z.enum(["match", "mismatch", "unchecked"]),
});
export type DocPhotoResponse = z.infer<typeof DocPhotoResponse>;
// Diary (MIN-4481): copied from Cron's contract.ts, same as the sections above (MIN-4515 replaced the local DiaryEntry stub).
export const DiaryRow = z.object({
  id: Uuid,
  patient_id: Uuid,
  occurred_at: Timestamp,
  recorded_at: Timestamp, // server's now(), not settable by the client
  time_edited: z.boolean(), // occurred_at differs from recorded_at by more than 5 minutes
  text: z.string(),
  severity: z.number().int().min(1).max(10),
});
export type DiaryRow = z.infer<typeof DiaryRow>;
export const DIARY_COLUMNS = "id,patient_id,occurred_at,recorded_at,time_edited,text,severity";

/** Settlement 12: the diary is a direct insert through supabase-js. patient_id defaults to the
 *  caller; recorded_at is the server's now() and cannot be sent. */
export const DiaryInsert = z.object({
  text: z.string().min(1).max(2000),
  severity: z.number().int().min(1).max(10),
  occurred_at: Timestamp.optional(),
});
export type DiaryInsert = z.infer<typeof DiaryInsert>;
