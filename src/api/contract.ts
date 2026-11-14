/**
 * LOCAL STUB of Cron's `contract.ts` (MIN-4471; shapes from CTO review section 3 and MIN-4449 decision 1).
 * Same file name and the same zod style, so the swap is: delete this file, copy Cron's `contract.ts`
 * (and its fixtures) from `staging`, fix the import names that differ. Nothing outside `src/api` and
 * `src/auth` reads the wire shapes.
 */
import { z } from 'zod';

export const Role = z.enum(['patient', 'doctor']);
export type Role = z.infer<typeof Role>;

/** healthapp-demo-login: no session needed; the passcode is typed by the presenter (MIN-4449 decision 1, 5). */
export const DemoLoginRequest = z.object({ persona: Role, passcode: z.string().min(1) });
export type DemoLoginRequest = z.infer<typeof DemoLoginRequest>;
export const DemoLoginResponse = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  expires_at: z.number().int(), // unix seconds
  user_id: z.string(),
  persona: z.enum(['patient', 'doctor']),
  role: Role,
});
export type DemoLoginResponse = z.infer<typeof DemoLoginResponse>;

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
// A1 + A2 (MIN-4476): copied VERBATIM from Cron's contract.ts (MIN-4471, CONTRACT_VERSION 2026-11-14.1),
// supabase/functions/_shared/contract.ts. Swap = delete this section and import his file. Do not edit here.
// =============================================================================================
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const Uuid = z.string().regex(UUID_RE, "uuid");
/** ISO 8601 timestamp with offset, as Postgres timestamptz serialises it. */
export const Timestamp = z.string().min(20);
/** Calendar date, YYYY-MM-DD. */
export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");
export const DocumentKind = z.enum(["blood_test", "imaging_report", "doctor_letter"]);
export const DocumentStatus = z.enum(["draft", "confirmed"]);
export const IdentityStatus = z.enum(["match", "name_only"]);
export const Provenance = z.enum(["uploaded_by_patient", "verified_by_source"]);
export const Flag = z.enum(["low", "high", "normal", "unknown"]);
export const FindingKind = z.enum(["conclusion", "written_diagnosis", "medication", "note"]);
export const Language = z.enum(["el", "en"]);
export const UploadMime = z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

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
});
export type DocumentRow = z.infer<typeof DocumentRow>;
export const DOCUMENT_COLUMNS =
  "id,patient_id,kind,language,exam_date,issuer,identity_status,provenance,status,created_at,confirmed_at";

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
// Synchronous, up to 60 s. One honest label and an indeterminate bar on the client (no stages).
export const ExtractRequest = z.object({ doc_id: Uuid });
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

export const ExtractResponse = z.discriminatedUnion("outcome", [
  z.object({ outcome: z.literal("draft"), draft: DocumentDraft }),
  z.object({
    outcome: z.literal("refused"),
    reason: RefusalReason,
    message: z.string(), // names what did not match; nothing was stored
  }),
]);
export type ExtractResponse = z.infer<typeof ExtractResponse>;

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
/** diary_entries (review 3 row 12): a direct insert under RLS, no function. `recorded_at` is the server's `now()`. */
export const DiaryEntry = z.object({
  id: z.string(),
  occurred_at: z.string(),
  recorded_at: z.string().nullish(),
  time_edited: z.boolean(),
  text: z.string(),
  severity: z.number().int().min(1).max(10),
});
export type DiaryEntry = z.infer<typeof DiaryEntry>;
export const DiaryInsert = z.object({
  // patient_id defaults to the caller; recorded_at and time_edited are set by the database.
  occurred_at: z.string().min(1),
  text: z.string().trim().min(1),
  severity: z.number().int().min(1).max(10),
});
export type DiaryInsert = z.infer<typeof DiaryInsert>;
