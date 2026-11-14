/**
 * In-memory fixtures for unit tests (the app never imports it). Synthetic only:
 * the persona Maria Papadopoulou, ids shaped like Cron's `contract.fixtures.ts`. Steer the read with the URL:
 * `?outcome=unreadable | name | id | missing | offline | slow`.
 */
import { ApiError } from '../../api/call';
import type { DocumentRow, FindingRow, ResultRow } from '../../api/contract';
import type { ExamsApi, RecordFull } from './logic';

const PATIENT = '6f1d2c3b-4a59-4e2f-9b1a-0c8d7e6f5a41';
const NOW = '2026-11-15T09:30:00.000+00:00';
const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

const doc = (id: string, o: Partial<DocumentRow>): DocumentRow => ({
  id, patient_id: PATIENT, kind: 'blood_test', language: 'el', exam_date: '2026-03-12', issuer: 'Demo Lab Athens',
  identity_status: 'match', provenance: 'uploaded_by_patient', status: 'confirmed', created_at: NOW, confirmed_at: NOW, ...o,
});
const res = (n: number, document_id: string, o: Partial<ResultRow>): ResultRow => ({
  id: uid(n), document_id, patient_id: PATIENT, analyte: 'CRP', analyte_key: 'crp', value_num: 14.2, value_text: null, unit: 'mg/L',
  ref_low: null, ref_high: 5, ref_text: '<5', flag: 'high', confidence: 0.97, edited_by_patient: false, ...o,
});

const ID_BLOOD = uid(101);
const ID_IMG = uid(102);
const store = {
  docs: [
    doc(ID_BLOOD, {}),
    doc(ID_IMG, { kind: 'imaging_report', exam_date: '2026-02-02', issuer: 'Demo Imaging Centre', identity_status: 'name_only' }),
  ],
  results: [
    res(1, ID_BLOOD, {}),
    res(2, ID_BLOOD, { analyte: 'ΤΚΕ', analyte_key: 'esr', value_num: 38, unit: 'mm/h', ref_low: 0, ref_high: 20, ref_text: '0-20', confidence: 0.93 }),
    res(3, ID_BLOOD, { analyte: 'Αιμοσφαιρίνη', analyte_key: 'hb', value_num: 12.9, unit: 'g/dL', ref_low: 12, ref_high: 16, ref_text: '12-16', flag: 'normal', edited_by_patient: true }),
  ] as ResultRow[],
  findings: [
    {
      id: uid(11), document_id: ID_IMG, patient_id: PATIENT, kind: 'conclusion',
      text_original: 'Μικρή συλλογή υγρού στο δεξί γόνατο. Ήπιες εκφυλιστικές αλλοιώσεις.', text_lang: 'el',
      finding_date: '2026-02-02', specialty: 'Orthopaedics', confidence: 0.91, edited_by_patient: false,
    },
  ] as FindingRow[],
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const outcome = () => new URLSearchParams(typeof location === 'undefined' ? '' : location.search).get('outcome');

/** The same rule the server applies from the printed range (the server stays the truth; this only feeds the mock). */
function flagOf(v: number | null, lo: number | null, hi: number | null): ResultRow['flag'] {
  if (v == null || (lo == null && hi == null)) return 'unknown';
  if (hi != null && v > hi) return 'high';
  if (lo != null && v < lo) return 'low';
  return 'normal';
}

const photoSvg = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><rect width="600" height="800" fill="#fbfbf8"/><text x="40" y="70" font-family="monospace" font-size="22" fill="#222">DEMO LAB ATHENS (synthetic)</text><text x="40" y="120" font-family="monospace" font-size="16" fill="#222">ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ   AK 123456</text><text x="40" y="190" font-family="monospace" font-size="16" fill="#222">CRP        21.5   mg/L   &lt;5</text><text x="40" y="225" font-family="monospace" font-size="16" fill="#222">Anti-CCP   Θετικό        Αρνητικό</text></svg>`,
)}`;

const draftRes = (n: number, document_id: string, o: Partial<ResultRow>) => {
  const { patient_id: _p, ...r } = res(n, document_id, o);
  return r;
};
const draftFor = (id: string) => ({
  document: doc(id, { exam_date: '2026-11-10', status: 'draft', confirmed_at: null }),
  printed_name: 'ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ',
  printed_id: 'AK 123456',
  header_confidence: { exam_date: 0.95, issuer: 0.9, printed_name: 0.98, printed_id: 0.97 },
  results: [
    draftRes(21, id, { value_num: 21.5, confidence: 0.96 }),
    draftRes(22, id, { analyte: 'Anti-CCP', analyte_key: 'anti_ccp', value_num: null, value_text: 'Θετικό', unit: null, ref_low: null, ref_high: null, ref_text: 'Αρνητικό', flag: 'unknown', confidence: 0.52 }),
  ],
  findings: [],
});

export const mockApi: ExamsApi = {
  async createDoc() {
    await wait(300);
    if (outcome() === 'offline') throw new ApiError(0, 'Could not reach the server.');
    const id = uid(900 + store.docs.length);
    return { doc_id: id, bucket: 'healthapp-dev', path: `${PATIENT}/${id}`, token: 'mock', signed_url: 'https://example.invalid/upload' };
  },
  async upload() {
    await wait(300);
  },
  async extract(docId, signal) {
    const o = outcome();
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(resolve, o === 'slow' ? 70_000 : 1800);
      signal?.addEventListener('abort', () => {
        clearTimeout(t);
        reject(new DOMException('aborted', 'AbortError'));
      });
    });
    if (o === 'unreadable') return { outcome: 'refused', reason: 'unreadable', message: 'The page could not be read.' };
    if (o === 'name') return { outcome: 'refused', reason: 'name_mismatch', message: 'The name on the document is different.' };
    if (o === 'id') return { outcome: 'refused', reason: 'id_mismatch', message: 'The ID on the document is different.' };
    if (o === 'missing') return { outcome: 'refused', reason: 'name_missing', message: 'No readable name.' };
    return { outcome: 'draft', draft: draftFor(docId) };
  },
  async confirm(req) {
    await wait(400);
    const d = draftFor(req.doc_id);
    const document = { ...d.document, exam_date: req.exam_date ?? d.document.exam_date, status: 'confirmed' as const, confirmed_at: NOW };
    const results: ResultRow[] = d.results.map((r) => {
      const e = req.results?.find((x) => x.id === r.id);
      const value_num = e && 'value_num' in e ? (e.value_num ?? null) : r.value_num;
      const row: ResultRow = {
        ...r, patient_id: PATIENT, value_num, value_text: e && 'value_text' in e ? (e.value_text ?? null) : r.value_text,
        unit: e && 'unit' in e ? (e.unit ?? null) : r.unit, edited_by_patient: !!e,
      };
      return e ? { ...row, flag: flagOf(row.value_num, row.ref_low, row.ref_high) } : row;
    });
    store.docs.unshift(document);
    store.results.push(...results);
    return { document };
  },
  async listRecords() {
    await wait(200);
    return [...store.docs]
      .sort((a, b) => (b.exam_date ?? '').localeCompare(a.exam_date ?? ''))
      .map((document) => ({
        document,
        outOfRange: store.results.filter((r) => r.document_id === document.id && (r.flag === 'high' || r.flag === 'low')).length,
      }));
  },
  async getRecord(id): Promise<RecordFull> {
    await wait(150);
    const document = store.docs.find((d) => d.id === id);
    if (!document) throw new ApiError(404, 'Not found.');
    return { document, results: store.results.filter((r) => r.document_id === id), findings: store.findings.filter((f) => f.document_id === id) };
  },
  async photoUrl() {
    return photoSvg;
  },
};
