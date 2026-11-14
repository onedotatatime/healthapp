/**
 * An in-memory record and assistant for the tests. SYNTHETIC only: Maria Papadopoulou is the
 * persona (no real person, no real exam). It follows Cron's contract: whole answers, `r:`/`f:`/`d:` cite ids, a flag
 * the server computed, a 60 s photo URL. The answers are canned by keyword, so the demo screen works before
 * `healthapp-assistant` (MIN-4487) is live; the shape is what matters.
 */
import { ApiError } from '../../api/call';
import type { AssistantApi } from './api';
import type { FileAnalysisRow, OverTimeResponse } from './analysis.contract';
import { computeOverTime } from './analysis.calc';
import type { AssistantResponse, DiaryRow, DocumentRow, FindingRow, ResultRow, Segment } from './contract';
import type { RecordData } from './record';

const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
export const MOCK_PATIENT_ID = uid(1);
export const ID = {
  docOct: uid(101), docMar: uid(102), docMri: uid(103), docLetter: uid(104),
  crpOct: uid(201), esrOct: uid(202), hbOct: uid(203), crpMar: uid(204), esrMar: uid(205),
  fLetter: uid(301), fMri: uid(302),
  d1: uid(401), d2: uid(402), d3: uid(403),
};

const doc = (id: string, kind: DocumentRow['kind'], exam_date: string, issuer: string, provenance: DocumentRow['provenance'], identity: DocumentRow['identity_status'] = 'match'): DocumentRow => ({
  id, patient_id: MOCK_PATIENT_ID, kind, language: 'en', exam_date, issuer, identity_status: identity, provenance, status: 'confirmed', created_at: `${exam_date}T09:00:00+02:00`, confirmed_at: `${exam_date}T09:05:00+02:00`, unchecked: false,
});
const res = (id: string, document_id: string, analyte: string, value: number, unit: string, lo: number | null, hi: number | null, flag: ResultRow['flag']): ResultRow => ({
  id, document_id, patient_id: MOCK_PATIENT_ID, analyte, analyte_key: analyte.toLowerCase(), value_num: value, value_text: null, unit, ref_low: lo, ref_high: hi, ref_text: null, flag, confidence: 0.97, edited_by_patient: false,
});
const finding = (id: string, document_id: string, kind: FindingRow['kind'], text: string, date: string, specialty: string): FindingRow => ({
  id, document_id, patient_id: MOCK_PATIENT_ID, kind, text_original: text, text_lang: 'en', finding_date: date, specialty, confidence: 0.95, edited_by_patient: false,
});
const entry = (id: string, at: string, text: string, severity: number): DiaryRow => ({ id, patient_id: MOCK_PATIENT_ID, occurred_at: at, recorded_at: at, time_edited: false, text, severity });

export const MOCK_RECORD: RecordData = {
  documents: [
    doc(ID.docOct, 'blood_test', '2026-10-30', 'Synthetic Diagnostic Lab, Athens', 'uploaded_by_patient'),
    doc(ID.docMar, 'blood_test', '2026-03-12', 'Synthetic Diagnostic Lab, Athens', 'verified_by_source'),
    doc(ID.docMri, 'imaging_report', '2026-06-02', 'Synthetic Imaging Centre', 'uploaded_by_patient', 'name_only'),
    doc(ID.docLetter, 'doctor_letter', '2026-01-20', 'Orthopaedics, Synthetic General Hospital', 'verified_by_source'),
  ],
  results: [
    res(ID.crpOct, ID.docOct, 'CRP', 14.2, 'mg/L', null, 5, 'high'),
    res(ID.esrOct, ID.docOct, 'ESR', 28, 'mm/h', 0, 20, 'high'),
    res(ID.hbOct, ID.docOct, 'Haemoglobin', 13.1, 'g/dL', 12, 16, 'normal'),
    res(ID.crpMar, ID.docMar, 'CRP', 3.1, 'mg/L', null, 5, 'normal'),
    res(ID.esrMar, ID.docMar, 'ESR', 12, 'mm/h', 0, 20, 'normal'),
  ],
  findings: [
    finding(ID.fLetter, ID.docLetter, 'written_diagnosis', 'Mild osteoarthritis of the left knee.', '2026-01-20', 'Orthopaedics'),
    finding(ID.fMri, ID.docMri, 'conclusion', 'Small joint effusion, left knee. No fracture.', '2026-06-02', 'Radiology'),
  ],
  diary: [
    entry(ID.d1, '2026-10-28T18:10:00+02:00', 'Sharp pain in the left knee on the stairs.', 6),
    entry(ID.d2, '2026-11-02T08:05:00+02:00', 'Knee stiff in the morning for about an hour.', 4),
    entry(ID.d3, '2026-11-10T02:30:00+02:00', 'Pain woke me at night.', 7),
  ],
};

const seg = (kind: Segment['kind'], text: string, cites: string[] = []): Segment => ({ kind, text, cites, verified: true });
const turn = (n: number, segments: Segment[], not_in_record = false): AssistantResponse => ({ turn_id: uid(900 + n), mode: 'ask', not_in_record, segments, possibilities: [], created_at: new Date().toISOString() });

/** Canned answers by keyword. Anything else is "not in this record". `offline` throws, to show the retry. */
export function answerFor(question: string, n = 1): AssistantResponse {
  const q = question.toLowerCase();
  if (q.includes('crp')) {
    return turn(n, [
      seg('record_fact', 'CRP was 14.2 mg/L on 30 Oct 2026, above the printed range (below 5).', [`r:${ID.crpOct}`]),
      seg('record_fact', 'On 12 Mar 2026 it was 3.1 mg/L, within the printed range.', [`r:${ID.crpMar}`]),
      seg('general_knowledge', 'CRP is a general marker of inflammation. A raised value does not point to one cause.'),
    ]);
  }
  if (q.includes('condition') || q.includes('diagnos')) {
    return turn(n, [seg('record_fact', 'The orthopaedic letter of 20 Jan 2026 writes: mild osteoarthritis of the left knee.', [`f:${ID.fLetter}`])]);
  }
  if (q.includes('knee') || q.includes('pain')) {
    return turn(n, [
      seg('record_fact', 'The patient wrote on 28 Oct 2026 about sharp pain in the left knee on the stairs, severity 6 of 10.', [`d:${ID.d1}`]),
      seg('record_fact', 'The knee MRI report of 2 Jun 2026 concludes: small joint effusion, left knee, no fracture.', [`f:${ID.fMri}`]),
    ]);
  }
  return turn(n, [], true);
}

/** A 1x1-ish inline SVG so the preview shows a "photo" with no network. */
export const MOCK_PHOTO = (label: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="360" height="480" viewBox="0 0 360 480"><rect width="360" height="480" fill="#fff"/><rect x="16" y="16" width="328" height="448" fill="none" stroke="#6F8084"/><text x="32" y="56" font-family="monospace" font-size="16" fill="#12303A">SYNTHETIC EXAM PHOTO</text><text x="32" y="84" font-family="monospace" font-size="13" fill="#5B6B70">${label.replace(/[<&]/g, '')}</text>${Array.from({ length: 9 }, (_, i) => `<rect x="32" y="${120 + i * 36}" width="${200 + ((i * 53) % 90)}" height="10" fill="#DDE3E2"/>`).join('')}</svg>`)}`;

export interface MockAssistantOptions {
  latencyMs?: number;
  record?: RecordData;
  /** Per document: a row, `null` (not analysed yet) or an Error (the read fails). Default: not analysed. */
  fileAnalyses?: Record<string, FileAnalysisRow | null | Error>;
  /** The over-time answer, or an Error. Default: computed from the record. */
  overTime?: OverTimeResponse | Error | ((record: RecordData) => OverTimeResponse);
}

export function createMockAssistant(opts: MockAssistantOptions = {}): AssistantApi & { asked: string[] } {
  const wait = () => new Promise((r) => setTimeout(r, opts.latencyMs ?? 900));
  const record = opts.record ?? MOCK_RECORD;
  let n = 0;
  const asked: string[] = [];
  return {
    asked,
    async loadRecord() {
      await new Promise((r) => setTimeout(r, Math.min(opts.latencyMs ?? 900, 300)));
      return record;
    },
    async ask(_grantId, question) {
      asked.push(question);
      await wait();
      if (question.toLowerCase().includes('offline')) throw new ApiError(0, 'Could not reach the server.');
      return answerFor(question, ++n);
    },
    async photo(docId) {
      await wait();
      const d = record.documents.find((x) => x.id === docId);
      return { signed_url: MOCK_PHOTO(d ? `${d.kind.replace('_', ' ')} ${d.exam_date}` : 'document'), expires_at: new Date(Date.now() + 60_000).toISOString(), content_type: 'image/png', fingerprint: 'unchecked' };
    },
    async fileAnalysis(docId) {
      await new Promise((r) => setTimeout(r, Math.min(opts.latencyMs ?? 900, 400)));
      const row = opts.fileAnalyses?.[docId] ?? null;
      if (row instanceof Error) throw row;
      return row;
    },
    async overTime() {
      await new Promise((r) => setTimeout(r, Math.min(opts.latencyMs ?? 900, 500)));
      const o = opts.overTime;
      if (o instanceof Error) throw o;
      if (typeof o === 'function') return o(record);
      return o ?? computeOverTime(record);
    },
  };
}
