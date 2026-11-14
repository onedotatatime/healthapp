/**
 * E1 + E2 wire shapes (MIN-4488): copied VERBATIM from Cron's `contract.ts` (MIN-4471, CONTRACT_VERSION
 * 2026-11-14.1, supabase/functions/_shared/contract.ts): the primitives, the four rows the doctor reads under RLS
 * (documents, results, findings, diary_entries: the E1 overview is a read, not a function, cto-review section 3 row 4),
 * `healthapp-assistant` and `healthapp-doc-photo`. `Uuid` and `Timestamp` come from the handshake copy (identical).
 * Swap = delete this file and import Cron's. Do not edit the shapes here; change them in his file and note it on MIN-4487.
 * Only change from the original: `npm:zod@4.6.7` is `zod`.
 */
import { z } from 'zod';
import { Timestamp, Uuid } from '../handshake/contract';

export { Timestamp, Uuid };
/** Calendar date, YYYY-MM-DD. */
export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD');

/** Citation ids are full row ids with a one-letter kind (settlement 3). */
export const CiteId = z.string().regex(/^[rfd]:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'r:<uuid> | f:<uuid> | d:<uuid>');
export type CiteId = z.infer<typeof CiteId>;

export const DocumentKind = z.enum(['blood_test', 'imaging_report', 'doctor_letter']);
export const DocumentStatus = z.enum(['draft', 'confirmed']);
export const IdentityStatus = z.enum(['match', 'name_only']);
export const Provenance = z.enum(['uploaded_by_patient', 'verified_by_source']);
export const Flag = z.enum(['low', 'high', 'normal', 'unknown']);
export const FindingKind = z.enum(['conclusion', 'written_diagnosis', 'medication', 'note']);
export const Language = z.enum(['el', 'en']);
export const UploadMime = z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

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
  'id,patient_id,kind,language,exam_date,issuer,identity_status,provenance,status,created_at,confirmed_at';

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
  'id,document_id,patient_id,analyte,analyte_key,value_num,value_text,unit,ref_low,ref_high,ref_text,flag,confidence,edited_by_patient';

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
  'id,document_id,patient_id,kind,text_original,text_lang,finding_date,specialty,confidence,edited_by_patient';

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
export const DIARY_COLUMNS = 'id,patient_id,occurred_at,recorded_at,time_edited,text,severity';

// healthapp-doc-photo (patient, or doctor in a live grant) --------------------------------------
export const DocPhotoRequest = z.object({ doc_id: Uuid, grant_id: Uuid.optional() });
export const DocPhotoResponse = z.object({
  signed_url: z.string().url(),
  expires_at: Timestamp, // 60 s, never beyond the grant's end
  content_type: UploadMime,
  fingerprint: z.enum(['match', 'mismatch', 'unchecked']),
});
export type DocPhotoResponse = z.infer<typeof DocPhotoResponse>;

// healthapp-assistant (doctor in a live grant) --------------------------------------------------
// One whole JSON answer (settlement 1). Draw the screen from segments, never from raw text.
// 403 wrong_role for a patient, 403 grant_expired when the grant has ended.
// E1 (overview) is not a mode: it is a SQL read (cto-review §3 row 4).
export const AssistantMode = z.enum(['ask', 'causes']);
export const AssistantRequest = z.object({
  grant_id: Uuid,
  mode: AssistantMode,
  question: z.string().min(1).max(1000).optional(), // required for ask
});
export const SegmentKind = z.enum(['record_fact', 'general_knowledge']);
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
