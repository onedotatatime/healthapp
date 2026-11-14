/**
 * SYNTHETIC fixtures for the two doctor panels (MIN-4550, MIN-4552): Maria Papadopoulou is the stage persona, no real
 * person and no real exam. Used by the tests and by `/preview/doctor-analysis`. A result on this data does not count
 * toward the project goal: it only shows the screens. The over-time answer for it comes from `analysis.calc.ts`.
 */
import type { FileAnalysisRow } from './analysis.contract';
import { ID, MOCK_PATIENT_ID, MOCK_RECORD } from './mock';
import type { DocumentRow, ResultRow } from './contract';
import type { RecordData } from './record';

const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
export const SERIES_ID = { docJun: uid(105), docAug: uid(106), crpJun: uid(206), crpAug: uid(207) };

const SHA = 'a3f19c0e5b7d42c8a1e6f0b9d4c27e83f5a0b1c2d3e4f5061728394a5b6c7d8e';

const doc = (id: string, exam_date: string): DocumentRow => ({ id, patient_id: MOCK_PATIENT_ID, kind: 'blood_test', language: 'en', exam_date, issuer: 'Synthetic Diagnostic Lab, Athens', identity_status: 'match', provenance: 'uploaded_by_patient', status: 'confirmed', created_at: `${exam_date}T09:00:00+02:00`, confirmed_at: `${exam_date}T09:05:00+02:00`, unchecked: false });
const crp = (id: string, document_id: string, value: number): ResultRow => ({ id, document_id, patient_id: MOCK_PATIENT_ID, analyte: 'CRP', analyte_key: 'crp', value_num: value, value_text: null, unit: 'mg/L', ref_low: null, ref_high: 5, ref_text: null, flag: value > 5 ? 'high' : 'normal', confidence: 0.97, edited_by_patient: false });

/** MOCK_RECORD plus two more CRP results, so CRP has four results (a series with a projection) and ESR has two (not enough). */
export const MOCK_SERIES_RECORD: RecordData = {
  ...MOCK_RECORD,
  documents: [...MOCK_RECORD.documents, doc(SERIES_ID.docJun, '2026-06-18'), doc(SERIES_ID.docAug, '2026-08-20')],
  results: [...MOCK_RECORD.results, crp(SERIES_ID.crpJun, SERIES_ID.docJun, 8.9), crp(SERIES_ID.crpAug, SERIES_ID.docAug, 11)],
};

const base = (document_id: string): FileAnalysisRow => ({
  document_id, patient_id: MOCK_PATIENT_ID, analysed_at: '2026-10-30T09:03:00+02:00', status: 'done', error_code: null, doc_type: 'blood_test', pages: 2, readable: true, blurred: false, cropped: false, rotated: false, handwriting_present: false,
  issuer_present: true, date_present: true, stamp_or_signature_present: false, sha256: SHA, mime: 'image/jpeg', bytes: 483_210, uploaded_at: '2026-10-30T09:02:11+02:00', hash_verified: true, items_count: 0, items: [],
});

/** The four states, one per document of MOCK_RECORD: analysed with items, analysed with none, not analysed yet, failed. */
export const MOCK_FILE_ANALYSIS: Record<string, FileAnalysisRow | null> = {
  [ID.docOct]: { ...base(ID.docOct), blurred: true, cropped: true, items_count: 2, items: [{ text_original: 'Ferritin 48 ng/mL (ref 30-400)', page: 2 }, { text_original: 'Note: sample taken after 12 h fasting.', page: 2 }] },
  [ID.docMar]: { ...base(ID.docMar), pages: 1, issuer_present: true, stamp_or_signature_present: true, mime: 'application/pdf', bytes: 91_034, uploaded_at: '2026-03-12T10:15:00+02:00' },
  [ID.docMri]: null,
  [ID.docLetter]: { ...base(ID.docLetter), status: 'failed', error_code: 'model_timeout', doc_type: null, pages: null, readable: null, blurred: null, cropped: null, rotated: null, handwriting_present: null, issuer_present: null, date_present: null, stamp_or_signature_present: null, hash_verified: null },
};
