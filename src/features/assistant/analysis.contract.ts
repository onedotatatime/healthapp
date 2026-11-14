/**
 * Wire shapes for direction 3 (`file_analysis`, MIN-4549) and direction 4 (`healthapp-over-time`, MIN-4551).
 * Cron has not posted his shapes yet: this file is my reading of the CTO decision on MIN-4548 section 4, in ONE place.
 * The swap, when his `contract.ts` has them: delete the schemas below, import his, fix any name that differs. The drift
 * test (`src/api/contract.drift.test.ts`) already compares every name here that his file also has, so a mismatch goes red.
 * Doctor view only (MIN-4548 decision 1): nothing here is read by any patient screen.
 */
import { z } from 'zod';
import { CiteId, IsoDate, Timestamp, Uuid, Flag } from './contract';

export { CiteId, IsoDate, Timestamp, Uuid, Flag };

// ---- Direction 3: one row of `file_analysis`, read by the doctor under RLS (grant on the document's patient) ----
export const FileDocType = z.enum(['blood_test', 'imaging_report', 'doctor_letter', 'other']);
export type FileDocType = z.infer<typeof FileDocType>;
/** `text_original` is the document's own words, 200 characters at most; it is the only string the model writes. */
export const FileItem = z.object({ text_original: z.string().max(200), page: z.number().int().positive().nullable() });
export type FileItem = z.infer<typeof FileItem>;
export const FileAnalysisRow = z.object({
  document_id: Uuid,
  status: z.enum(['done', 'failed']),
  error_code: z.string().nullable(),
  doc_type: FileDocType.nullable(),
  pages: z.number().int().nonnegative().nullable(),
  readable: z.boolean().nullable(),
  blurred: z.boolean().nullable(),
  cropped: z.boolean().nullable(),
  rotated: z.boolean().nullable(),
  handwriting: z.boolean().nullable(),
  issuer_present: z.boolean().nullable(),
  date_present: z.boolean().nullable(),
  stamp_or_signature_present: z.boolean().nullable(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/).nullable(),
  mime: z.string().nullable(),
  bytes: z.number().int().nonnegative().nullable(),
  uploaded_at: Timestamp.nullable(),
  hash_verified: z.boolean().nullable(),
  items_count: z.number().int().nonnegative(),
  items: z.array(FileItem).max(20),
});
export type FileAnalysisRow = z.infer<typeof FileAnalysisRow>;
export const FILE_ANALYSIS_COLUMNS =
  'document_id,status,error_code,doc_type,pages,readable,blurred,cropped,rotated,handwriting,issuer_present,date_present,stamp_or_signature_present,sha256,mime,bytes,uploaded_at,hash_verified,items_count,items';

// ---- Direction 4: `healthapp-over-time` (doctor in a live grant). Calculated in code, no model, nothing stored ----
export const OverTimeRequest = z.object({ grant_id: Uuid });
export const OverTimePoint = z.object({
  cite: CiteId, // `r:<result id>`: opens the source document
  date: IsoDate,
  value: z.number(),
  ref_low: z.number().nullable(), // the range printed on this result's own document
  ref_high: z.number().nullable(),
  flag: Flag, // computed by the server against that range
});
export type OverTimePoint = z.infer<typeof OverTimePoint>;
/** One least-squares straight line, one horizon point (never beyond the data span, 180 days at most). No crossing date. */
export const Projection = z.object({
  n: z.number().int().min(3),
  slope_per_day: z.number(),
  horizon_date: IsoDate,
  value_at_horizon: z.number(),
});
export type Projection = z.infer<typeof Projection>;
export const OverTimeSeries = z.object({
  analyte_key: z.string(),
  analyte: z.string(), // as printed
  unit: z.string(), // one unit per series
  points: z.array(OverTimePoint).min(2), // date order
  out_of_range: z.object({ count: z.number().int().nonnegative(), first_date: IsoDate.nullable(), latest_date: IsoDate.nullable() }),
  projection: Projection.nullable(), // null: fewer than 3 results on 3 different dates
});
export type OverTimeSeries = z.infer<typeof OverTimeSeries>;
/** The five integers of MIN-4551 point 7. Shown as a footer so the founder's "seen: yes" can carry them. */
export const OverTimeCounts = z.object({
  records_read: z.number().int().nonnegative(),
  values_with_series: z.number().int().nonnegative(),
  projections_computed: z.number().int().nonnegative(),
  series_excluded: z.number().int().nonnegative(),
  errors: z.number().int().nonnegative(),
});
export type OverTimeCounts = z.infer<typeof OverTimeCounts>;
export const OverTimeResponse = z.object({ series: z.array(OverTimeSeries), counts: OverTimeCounts });
export type OverTimeResponse = z.infer<typeof OverTimeResponse>;
