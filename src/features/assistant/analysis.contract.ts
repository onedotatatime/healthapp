/**
 * Wire shapes for direction 3 (`file_analysis`, MIN-4549) and direction 4 (`healthapp-over-time`, MIN-4551), copied
 * verbatim from `supabase/functions/_shared/contract.ts` (Cron's file). Do not edit a schema here: the drift test
 * (`src/api/contract.drift.test.ts`) compares every name below against his file and goes red on any difference.
 * Doctor view only (MIN-4548 decision 1): nothing here is read by any patient screen.
 */
import { z } from 'zod';
import { CiteId, IsoDate, Timestamp, Uuid } from './contract';

export { CiteId, IsoDate, Timestamp, Uuid };

export const FileDocType = z.enum(["blood_test", "imaging_report", "doctor_letter", "other"]);
export const FileAnalysisStatus = z.enum(["done", "failed"]);
export const FileAnalysisError = z.enum(["no_object", "unsupported_type", "budget", "model_timeout", "model_http", "model_invalid", "config", "error"]);
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

// Types Cron's file does not export (types are not wire shapes; the schemas above are the contract).
export type FileDocType = z.infer<typeof FileDocType>;
export type OverTimePoint = z.infer<typeof OverTimePoint>;
export type OverTimeSeries = z.infer<typeof OverTimeSeries>;
export type Projection = z.infer<typeof OverTimeProjection>;
