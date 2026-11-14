// healthapp contract: every Edge Function's request and response, and the rows the app reads
// straight from Postgres under RLS. Imported by the functions (Deno) and by the web app (Vite).
// One rule for both sides: import only zod here, nothing Deno- or browser-specific.
// zod is imported with Deno's npm specifier so the functions need no import map. The web app maps
// it to its own zod (same version) in two lines: vite.config resolve.alias
// { find: "npm:zod@4.6.7", replacement: "zod" } and tsconfig paths { "npm:zod@4.6.7": ["./node_modules/zod"] }.
//
// Sources, in order of authority: CTO decisions on MIN-4449, docs/reviews/cto-review.md §3
// (the 14 settlements), docs/PRD.md §10. Owner: Backend (MIN-4471). Changes go through a PR
// and a note on the Frontend issue.
//
// Settled points this file encodes (cto-review §3):
//  1  assistant answers are one JSON response, never streamed
//  2  block kinds: record_fact, general_knowledge, not_in_record, possibilities[]
//  3  cite ids are full: r:<uuid> (result), f:<uuid> (finding), d:<uuid> (diary)
//  5  doc-create (doc_id + signed upload), then the upload, then extract-exam {doc_id}, synchronous
//  6  QR payload is a fragment: https://<app>/s#hs1.<jti>
//  7  codes live 120 s, no auto-refresh
//  8  grant-status takes grant_id as optional
//  9  grant statuses pending/active/refused/expired/revoked + typed claim errors
// 12  diary is a direct insert, no function
import { z } from "npm:zod@4.6.7";

export const CONTRACT_VERSION = "2026-11-14.3";

// ---------------------------------------------------------------------------------------------
// Calling convention
// ---------------------------------------------------------------------------------------------
// Every function is POST https://<project>.supabase.co/functions/v1/<name> with a JSON body,
// headers `apikey` + `authorization: Bearer <session access token>` + `x-healthapp-env: dev|demo`.
// Only healthapp-hello and healthapp-demo-login run without a session.
// Send x-healthapp-env on function calls only, never as a global supabase-js header (MIN-4449 1.1).
export const ENV_HEADER = "x-healthapp-env";
export const ENVS = ["dev", "demo"] as const;
export const HealthappEnv = z.enum(ENVS);
export type HealthappEnv = z.infer<typeof HealthappEnv>;
export const schemaFor = (env: HealthappEnv) => `healthapp_${env}` as const;
export const bucketFor = (env: HealthappEnv) => `healthapp-${env}` as const;

// ---------------------------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------------------------
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const Uuid = z.string().regex(UUID_RE, "uuid");
/** ISO 8601 timestamp with offset, as Postgres timestamptz serialises it. */
export const Timestamp = z.string().min(20);
/** Calendar date, YYYY-MM-DD. */
export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");

/** Citation ids are full row ids with a one-letter kind (settlement 3). */
export const CiteId = z.string().regex(
  /^[rfd]:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  "r:<uuid> | f:<uuid> | d:<uuid>",
);
export type CiteId = z.infer<typeof CiteId>;

export const Role = z.enum(["patient", "doctor"]);
export const DocumentKind = z.enum(["blood_test", "imaging_report", "doctor_letter"]);
export const DocumentStatus = z.enum(["draft", "confirmed"]);
export const IdentityStatus = z.enum(["match", "name_only"]);
export const Provenance = z.enum(["uploaded_by_patient", "verified_by_source"]);
export const Flag = z.enum(["low", "high", "normal", "unknown"]);
export const FindingKind = z.enum(["conclusion", "written_diagnosis", "medication", "note"]);
export const GrantStatus = z.enum(["pending", "active", "refused", "expired", "revoked"]);
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

// ---------------------------------------------------------------------------------------------
// Rows read straight from Postgres (schema healthapp_<env>) under RLS
// ---------------------------------------------------------------------------------------------
export const ProfileRow = z.object({
  id: Uuid,
  role: Role,
  full_name: z.string(), // as the person writes it (Greek for Maria)
  full_name_latin: z.string().nullable(),
  specialty: z.string().nullable(), // doctors
  created_at: Timestamp,
});
export type ProfileRow = z.infer<typeof ProfileRow>;
/** Columns the app selects from profiles. Identity-match columns stay server-side. */
export const PROFILE_COLUMNS = "id,role,full_name,full_name_latin,specialty,created_at";

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

// file_analysis (MIN-4549, direction 3; CTO decision on MIN-4548 §4): one row per stored original file, written by
// the second pass inside healthapp-extract-exam, read by a DOCTOR in a live grant only (no patient policy, on
// purpose: the patient's screens never show any of it). Read under RLS like documents:
//   supabase.from("file_analysis").select(FILE_ANALYSIS_COLUMNS).eq("patient_id", patientId)
// No row for a document = "not analysed yet". status "failed" = analysis failed (error_code says why, closed set).
// The only free text in the row is items[].text_original: the document's own words, 200 characters at most, 20 items
// at most. Everything else is an enum, a boolean or an integer, so there is nothing to word as health advice.
export const FileDocType = z.enum(["blood_test", "imaging_report", "doctor_letter", "other"]);
export const FileAnalysisStatus = z.enum(["done", "failed"]);
export const FileAnalysisError = z.enum(["no_object", "budget", "model_timeout", "model_http", "model_invalid", "config", "error"]);
export const FILE_ITEMS_MAX = 20;
export const FILE_ITEM_CHARS = 200;
export const FileAnalysisItem = z.object({
  text_original: z.string().max(FILE_ITEM_CHARS), // as printed on the file, not in the record
  page: z.number().int().min(1), // the page the words are on
});
export type FileAnalysisItem = z.infer<typeof FileAnalysisItem>;
export const FileAnalysisRow = z.object({
  document_id: Uuid,
  patient_id: Uuid,
  status: FileAnalysisStatus,
  error_code: FileAnalysisError.nullable(), // null when status is done
  // The reading. All null when status is failed.
  doc_type: FileDocType.nullable(),
  pages: z.number().int().min(1).nullable(),
  readable: z.boolean().nullable(),
  blurred: z.boolean().nullable(),
  cropped: z.boolean().nullable(),
  rotated: z.boolean().nullable(),
  handwriting_present: z.boolean().nullable(),
  issuer_present: z.boolean().nullable(),
  date_present: z.boolean().nullable(),
  stamp_or_signature_present: z.boolean().nullable(),
  // File facts computed by the server, no model. Null when the object could not be read (no_object).
  sha256: z.string().regex(/^[0-9a-f]{64}$/).nullable(), // show the first 8 characters
  mime: z.string().nullable(),
  bytes: z.number().int().min(0).nullable(),
  uploaded_at: Timestamp.nullable(), // when the object was stored
  hash_verified: z.boolean().nullable(), // the object hashed the same after the run (and matches the extraction's hash)
  items_count: z.number().int().min(0).max(FILE_ITEMS_MAX),
  items: z.array(FileAnalysisItem).max(FILE_ITEMS_MAX), // on the file, absent from the extracted record
  analysed_at: Timestamp,
});
export type FileAnalysisRow = z.infer<typeof FileAnalysisRow>;
export const FILE_ANALYSIS_COLUMNS =
  "document_id,patient_id,status,error_code,doc_type,pages,readable,blurred,cropped,rotated,handwriting_present,issuer_present,date_present,stamp_or_signature_present,sha256,mime,bytes,uploaded_at,hash_verified,items_count,items,analysed_at";

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

export const GrantRow = z.object({
  id: Uuid,
  patient_id: Uuid,
  doctor_id: Uuid,
  status: GrantStatus,
  requested_at: Timestamp,
  approved_at: Timestamp.nullable(),
  expires_at: Timestamp.nullable(),
  revoked_at: Timestamp.nullable(),
});
export type GrantRow = z.infer<typeof GrantRow>;
/** Realtime: postgres_changes on healthapp_<env>.grants only (RLS applies to the subscriber). */
export const GRANT_COLUMNS = "id,patient_id,doctor_id,status,requested_at,approved_at,expires_at,revoked_at";
export const REALTIME_TABLES = ["grants"] as const;

// ---------------------------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------------------------

// healthapp-hello (no session) ------------------------------------------------------------------
export const HelloRequest = z.object({});
export const HelloResponse = z.object({ ok: z.literal(true), env: HealthappEnv });

// healthapp-demo-login (no session) -------------------------------------------------------------
// The /demo panel: persona buttons + passcode. No password ships in the bundle.
// 401 bad_passcode, 429 rate_limited (5 tries a minute). On 200 call
// supabase.auth.setSession({ access_token, refresh_token }).
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

export const ExtractResponse = z.discriminatedUnion("outcome", [
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

/** Answer to { analyse_only: true }. Counts and a status, nothing from the file. */
export const AnalyseResponse = z.object({
  outcome: z.literal("analysed"),
  status: FileAnalysisStatus,
  error_code: FileAnalysisError.nullable(),
  items_count: z.number().int().min(0),
});
export type AnalyseResponse = z.infer<typeof AnalyseResponse>;

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

// healthapp-handshake-create (patient) ----------------------------------------------------------
// The QR text is `${origin}/s#${token}` (fragment, settlement 6). The typed code is shown 4 + 4.
// 120 s life, no auto-refresh: the screen has a "New code" button (settlement 7).
export const HANDSHAKE_TOKEN_RE = /^hs1\.[A-Za-z0-9_-]{22}$/;
export const SHORT_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // no 0/O, 1/I/L
export const HandshakeToken = z.string().regex(HANDSHAKE_TOKEN_RE, "hs1.<22 base64url>");
export const ShortCode = z.string().regex(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/, "8 characters");
export const HandshakeCreateRequest = z.object({});
export const HandshakeCreateResponse = z.object({
  token: HandshakeToken,
  short_code: ShortCode,
  expires_at: Timestamp,
  server_now: Timestamp,
});
export type HandshakeCreateResponse = z.infer<typeof HandshakeCreateResponse>;
export const qrText = (origin: string, token: string) => `${origin.replace(/\/$/, "")}/s#${token}`;

// healthapp-handshake-claim (doctor) ------------------------------------------------------------
// Exactly one of token (scanned) or short_code (typed). 5 failed claims per doctor per minute.
// Errors: 404 token_invalid, 409 token_expired | token_used, 429 rate_limited.
export const HandshakeClaimRequest = z.union([
  z.object({ token: HandshakeToken }),
  z.object({ short_code: ShortCode }),
]);

// The grant as both screens see it, with the other party's display fields (read by the server).
export const Party = z.object({ id: Uuid, full_name: z.string(), specialty: z.string().nullable() });
export const GrantView = z.object({
  grant_id: Uuid,
  status: GrantStatus,
  requested_at: Timestamp,
  approved_at: Timestamp.nullable(),
  expires_at: Timestamp.nullable(), // pending: when the request lapses; active: when access ends
  revoked_at: Timestamp.nullable(),
  patient: Party,
  doctor: Party,
});
export type GrantView = z.infer<typeof GrantView>;
/** Every grant answer carries the server's clock: countdowns use expires_at - server_now. */
export const GrantEnvelope = z.object({ grant: GrantView, server_now: Timestamp });
export type GrantEnvelope = z.infer<typeof GrantEnvelope>;

export const HandshakeClaimResponse = GrantEnvelope;

// healthapp-grant-status (patient or doctor) ----------------------------------------------------
// Settlement 8: grant_id optional; without it, the caller's newest pending or active grant.
// Realtime on grants first; poll every 2 s when the channel is silent for 3 s.
// Settlement 10: an empty RLS read after data was shown means "call grant-status and close".
export const GrantStatusRequest = z.object({ grant_id: Uuid.optional() });
export const GrantStatusResponse = z.object({ grant: GrantView.nullable(), server_now: Timestamp });
export type GrantStatusResponse = z.infer<typeof GrantStatusResponse>;

// healthapp-grant-decide, healthapp-grant-revoke (patient) --------------------------------------
// The grant length is a server value (settlement 13); the client cannot choose it.
export const GrantDecideRequest = z.object({ grant_id: Uuid, approve: z.boolean() });
export const GrantDecideResponse = GrantEnvelope;
export const GrantRevokeRequest = z.object({ grant_id: Uuid });
export const GrantRevokeResponse = GrantEnvelope;

// healthapp-assistant (doctor in a live grant) --------------------------------------------------
// One whole JSON answer (settlement 1). Draw the screen from segments, never from raw text.
// 403 wrong_role for a patient, 403 grant_expired when the grant has ended.
// E1 (overview) is not a mode: it is a SQL read (cto-review §3 row 4).
export const AssistantMode = z.enum(["ask", "causes"]);
export const AssistantRequest = z.object({
  grant_id: Uuid,
  mode: AssistantMode,
  question: z.string().min(1).max(1000).optional(), // required for ask
});
export const SegmentKind = z.enum(["record_fact", "general_knowledge"]);
export const Segment = z.object({
  kind: SegmentKind,
  text: z.string(),
  cites: z.array(CiteId), // a record_fact has at least one; general_knowledge has none
  /** false: failed the server's check twice; show "could not be verified against the record". */
  verified: z.boolean(),
});
export type Segment = z.infer<typeof Segment>;
export const Possibility = z.object({
  label: z.string(),
  rationale: z.string(),
  cites: z.array(CiteId).min(1),
}); // no numeric field on purpose (settlement 2)
export type Possibility = z.infer<typeof Possibility>;
export const AssistantResponse = z.object({
  turn_id: Uuid,
  mode: AssistantMode,
  /** true: the answer is exactly "not in this record"; segments and possibilities are empty. */
  not_in_record: z.boolean(),
  segments: z.array(Segment),
  possibilities: z.array(Possibility), // causes mode only; [] in ask mode
  created_at: Timestamp,
});
export type AssistantResponse = z.infer<typeof AssistantResponse>;

// healthapp-over-time (MIN-4551; CTO decision on MIN-4548): the doctor's view of a patient's numbers over time.
// Doctor with a live grant only: 403 wrong_role for a patient, 403 grant_expired when the grant has ended.
// Plain arithmetic in code, no model, nothing stored. One series per value (analyte_key, else the printed
// name) with 2+ dated numeric results in one unit. No cause, advice, score, rank or word for a direction.
// There is NO field for "the date the line crosses a range limit" on purpose (a forecast of an abnormal result).
export const OverTimeRequest = z.object({ grant_id: Uuid });
export const OverTimePoint = z.object({
  date: IsoDate, // the document's date
  value: z.number(),
  cite: CiteId, // r:<uuid>, the same cite format the assistant uses
  ref_low: z.number().nullable(), // the limits printed on that result's own document
  ref_high: z.number().nullable(),
  /** value below ref_low or above ref_high; null when the document prints no numeric limit. */
  out_of_range: z.boolean().nullable(),
});
export const OverTimeProjection = z.object({
  n: z.number().int(), // results used (3 or more, on 3 or more different dates)
  first_date: IsoDate,
  last_date: IsoDate,
  /** one least-squares straight line through the n results, in the series' unit per day. */
  slope_per_day: z.number(),
  /** as far ahead as the data is long, at most 180, never further than last_date - first_date; shorter if the line would
   *  go below 0 while every result is 0 or above. */
  horizon_days: z.number().int(),
  horizon_date: IsoDate,
  value_at_horizon: z.number(),
});
export const OverTimeSeries = z.object({
  key: z.string(), // analyte_key, else the printed name lower-cased
  analyte: z.string(), // the printed name on the latest result
  unit: z.string().nullable(),
  points: z.array(OverTimePoint).min(2), // date order, oldest first
  out_of_range: z.object({
    count: z.number().int(), // results outside the range printed on their own document
    first_date: IsoDate.nullable(),
    latest_date: IsoDate.nullable(),
  }),
  /** null = "Not enough results for a projection" (fewer than 3 results or fewer than 3 different dates). */
  projection: OverTimeProjection.nullable(),
});
export const OverTimeCounts = z.object({
  records_read: z.number().int(), // result rows read for the patient
  values_with_series: z.number().int(),
  projections_computed: z.number().int(),
  /** values with 2+ numeric results that were left out: mixed units, or fewer than 2 dated. Never guessed. */
  series_excluded: z.number().int(),
  errors: z.number().int(),
});
export const OverTimeResponse = z.object({
  series: z.array(OverTimeSeries), // ordered by key; empty is a valid answer
  counts: OverTimeCounts, // the same five integers the function logs; the panel prints them as its footer
});
export type OverTimeResponse = z.infer<typeof OverTimeResponse>;

// ---------------------------------------------------------------------------------------------
// Possible matches (MIN-4505, F1 and F2): Postgres functions, not Edge Functions.
// ---------------------------------------------------------------------------------------------
// Called through the Data API: supabase.schema(schemaFor(env)).rpc(name, args), with the session.
// No x-healthapp-env header (that is for Edge Functions only). A caller who may not call one gets
// HTTP 403 with the PostgREST body { code: "42501", message } (not ErrorBody): show nothing, or
// "not available", never a reason. SQL: supabase/sql/005_matches.sql.
export const MATCH_K = 5; // a pattern shared by fewer than 5 seeded rows is never shown (same as SQL)
export const MATCH_MIN_SHARED = 4; // a seeded row matches when it shares at least 4 codes
export const MATCH_LABEL = "seeded, synthetic" as const;
export const RPC_DENIED_CODE = "42501";

// healthapp_possible_matches (doctor in a live grant) ------------------------------------------
// A patient token, a doctor without a live grant for this patient, or no session: 403, 42501.
// "Not opted in", "no match" and "every pattern below k" are the SAME answer, MATCHES_EMPTY: the
// screen cannot and must not tell them apart.
export const PossibleMatchesArgs = z.object({ patient_id: Uuid });
export const MatchGroup = z.object({
  n: z.number().int().min(MATCH_K), // seeded synthetic records sharing exactly this pattern
  pattern: z.array(z.string().min(1)).min(MATCH_MIN_SHARED), // shared codes, e.g. "CRP_high", "joint_pain"
  countries: z.array(z.string().regex(/^[A-Z]{2}$/)).min(1), // ISO country codes, nothing finer
  label: z.literal(MATCH_LABEL),
}).strict(); // no name, id, date, age or anything below country, ever
export type MatchGroup = z.infer<typeof MatchGroup>;
export const PossibleMatchesResponse = z.object({
  match_count: z.number().int().min(0), // the sum of the groups' n
  groups: z.array(MatchGroup), // largest group first; groups never overlap (exact shared set)
}).strict();
export type PossibleMatchesResponse = z.infer<typeof PossibleMatchesResponse>;
export const MATCHES_EMPTY: PossibleMatchesResponse = { match_count: 0, groups: [] };

// healthapp_set_matches_opt_in, healthapp_get_matches_opt_in (the patient herself) --------------
// Off by default. On: matching_opt_in_at is the consent time (kept if already on). Off: takes
// effect at once and clears it. Anyone but the patient: 403, 42501. profiles.matching_opt_in is not
// readable through the Data API (010): the F1 screen reads the state with the get function.
export const SetMatchesOptInArgs = z.object({ opt_in: z.boolean() });
export const GetMatchesOptInArgs = z.object({});
export const MatchesOptIn = z.object({
  matching_opt_in: z.boolean(),
  matching_opt_in_at: Timestamp.nullable(), // null exactly when matching_opt_in is false
}).strict();
export type MatchesOptIn = z.infer<typeof MatchesOptIn>;

export const RPCS = {
  healthapp_possible_matches: { args: PossibleMatchesArgs, response: PossibleMatchesResponse },
  healthapp_set_matches_opt_in: { args: SetMatchesOptInArgs, response: MatchesOptIn },
  healthapp_get_matches_opt_in: { args: GetMatchesOptInArgs, response: MatchesOptIn },
} as const;
export type RpcName = keyof typeof RPCS;
export type RpcArgsOf<N extends RpcName> = z.input<(typeof RPCS)[N]["args"]>;
export type RpcResponseOf<N extends RpcName> = z.infer<(typeof RPCS)[N]["response"]>;

// ---------------------------------------------------------------------------------------------
// The function table: one typed wrapper on the client can key off this.
// ---------------------------------------------------------------------------------------------
export const FUNCTIONS = {
  "healthapp-hello": { session: false, request: HelloRequest, response: HelloResponse },
  "healthapp-demo-login": { session: false, request: DemoLoginRequest, response: DemoLoginResponse },
  "healthapp-doc-create": { session: true, request: DocCreateRequest, response: DocCreateResponse },
  "healthapp-extract-exam": { session: true, request: ExtractRequest, response: ExtractResponse },
  "healthapp-confirm-doc": { session: true, request: ConfirmDocRequest, response: ConfirmDocResponse },
  "healthapp-doc-photo": { session: true, request: DocPhotoRequest, response: DocPhotoResponse },
  "healthapp-handshake-create": {
    session: true,
    request: HandshakeCreateRequest,
    response: HandshakeCreateResponse,
  },
  "healthapp-handshake-claim": {
    session: true,
    request: HandshakeClaimRequest,
    response: HandshakeClaimResponse,
  },
  "healthapp-grant-status": { session: true, request: GrantStatusRequest, response: GrantStatusResponse },
  "healthapp-grant-decide": { session: true, request: GrantDecideRequest, response: GrantDecideResponse },
  "healthapp-grant-revoke": { session: true, request: GrantRevokeRequest, response: GrantRevokeResponse },
  "healthapp-assistant": { session: true, request: AssistantRequest, response: AssistantResponse },
  "healthapp-over-time": { session: true, request: OverTimeRequest, response: OverTimeResponse },
} as const;
export type FunctionName = keyof typeof FUNCTIONS;
export type RequestOf<N extends FunctionName> = z.input<(typeof FUNCTIONS)[N]["request"]>;
export type ResponseOf<N extends FunctionName> = z.infer<(typeof FUNCTIONS)[N]["response"]>;
