/**
 * In-memory fixtures for unit tests (the app never imports it). Synthetic only:
 * the persona Maria Papadopoulou, ids shaped like Cron's `contract.fixtures.ts`. Steer the read with the URL:
 * `?outcome=unreadable | name | id | missing | failed | offline`: what the NEXT scanned exam turns into (the default is read, saved and not checked).
 * `?list=settled` hides the seeded waiting and reading rows, so the list can be seen to stop asking.
 */
import { ApiError } from '../../api/call';
import type { DocumentRow, FindingRow, ResultRow } from '../../api/contract';
import type { ExamsApi, RecordFull } from './logic';
import type { ExamListItem } from './scanApi';

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

const ago = (min: number) => new Date(Date.parse(NOW) - min * 60_000).toISOString();
const item = (n: number, o: Partial<ExamListItem>): ExamListItem => ({
  id: uid(n), status: 'queued', reason: null, uploaded_at: ago(5), status_at: ago(5), kind: null, exam_date: null, values_read: null, can_retry: false, can_delete: true, ...o,
});
/** One row per status, newest first. Synthetic: does not count toward the goal. */
const exams: ExamListItem[] = [
  item(301, { status: 'queued', uploaded_at: ago(1), status_at: ago(1) }),
  item(302, { status: 'reading', uploaded_at: ago(2), status_at: ago(1) }),
  item(303, { status: 'confirmed', kind: 'blood_test', exam_date: '2026-11-10', values_read: 9, unchecked: true, can_delete: false, uploaded_at: ago(8) }),
  item(304, { status: 'draft', kind: 'blood_test', exam_date: '2026-11-09', values_read: 2, uploaded_at: ago(12) }),
  item(305, { status: 'refused', reason: 'name_mismatch', uploaded_at: ago(20) }),
  item(306, { status: 'failed', reason: 'model_timeout', can_retry: true, uploaded_at: ago(30) }),
  item(307, { status: 'failed', reason: 'too_many_attempts', uploaded_at: ago(40) }),
  item(101, { status: 'confirmed', kind: 'blood_test', exam_date: '2026-03-12', values_read: 3, unchecked: false, can_delete: false, uploaded_at: ago(60 * 24 * 30) }),
  item(102, { status: 'confirmed', kind: 'imaging_report', exam_date: '2026-02-02', values_read: 0, unchecked: false, can_delete: false, uploaded_at: ago(60 * 24 * 60) }),
];
store.docs.unshift(doc(uid(303), { exam_date: '2026-11-10', created_at: ago(8) }));
store.results.push(res(31, uid(303), { analyte: 'CRP', value_num: 21.5, flag: 'high' }));

let scanned = 0;
const later = (fn: () => void, ms: number) => void setTimeout(fn, ms);

export const mockApi: ExamsApi = {
  async createDoc() {
    await wait(300);
    if (outcome() === 'offline') throw new ApiError(0, 'Could not reach the server.');
    const n = 900 + exams.length + scanned;
    const id = uid(n);
    exams.unshift(item(n, { status: 'queued', uploaded_at: new Date().toISOString(), status_at: new Date().toISOString() }));
    return { doc_id: id, bucket: 'healthapp-dev', path: `${PATIENT}/${id}`, token: 'mock', signed_url: 'https://example.invalid/upload' };
  },
  async upload() {
    await wait(300);
  },
  async kick(docId) {
    // The server's side, played out in time so the polling can be watched: waiting, reading, then the outcome.
    const o = outcome();
    const row = exams.find((e) => e.id === docId);
    if (!row) return;
    scanned++;
    later(() => { row.status = 'reading'; row.status_at = new Date().toISOString(); }, 3000);
    later(() => {
      row.status_at = new Date().toISOString();
      if (o === 'unreadable') { row.status = 'refused'; row.reason = 'unreadable'; }
      else if (o === 'name') { row.status = 'refused'; row.reason = 'name_mismatch'; }
      else if (o === 'id') { row.status = 'refused'; row.reason = 'id_mismatch'; }
      else if (o === 'missing') { row.status = 'refused'; row.reason = 'name_missing'; }
      else if (o === 'failed') { row.status = 'failed'; row.reason = 'model_http'; row.can_retry = true; }
      else {
        const d = draftFor(docId);
        row.status = 'confirmed'; row.kind = 'blood_test'; row.exam_date = '2026-11-10'; row.values_read = 2; row.unchecked = true; row.can_delete = false;
        store.docs.unshift({ ...d.document, status: 'confirmed', confirmed_at: row.status_at });
        store.results.push(...d.results.map((r) => ({ ...r, patient_id: PATIENT })));
      }
    }, 7000);
  },
  async listExams() {
    await wait(150);
    if (outcome() === 'offline') throw new ApiError(0, 'Could not reach the server.');
    const settledOnly = new URLSearchParams(typeof location === 'undefined' ? '' : location.search).get('list') === 'settled';
    (globalThis as { __examListCalls?: number }).__examListCalls = ((globalThis as { __examListCalls?: number }).__examListCalls ?? 0) + 1; // so a browser check can count the asks
    return exams.filter((e) => !settledOnly || e.id !== uid(301) && e.id !== uid(302)).map((e) => ({ ...e }));
  },
  async getDraft(docId) {
    await wait(150);
    if (!exams.some((e) => e.id === docId && e.status === 'draft')) throw new ApiError(404, 'Not found.', 'not_found');
    return draftFor(docId);
  },
  async openExam(docId) {
    const row = exams.find((e) => e.id === docId);
    if (row?.status === 'confirmed') row.unchecked = false;
  },
  async deleteExam(docId) {
    await wait(200);
    const i = exams.findIndex((e) => e.id === docId && e.can_delete);
    if (i < 0) throw new ApiError(404, 'Not found.', 'not_found');
    exams.splice(i, 1);
  },
  async unconfirm(docId) {
    await wait(200);
    const row = exams.find((e) => e.id === docId && e.status === 'confirmed');
    if (!row) throw new ApiError(404, 'Not found.', 'not_found');
    row.status = 'draft'; row.unchecked = false; row.can_delete = true;
    const d = store.docs.find((x) => x.id === docId);
    if (d) { d.status = 'draft'; d.confirmed_at = null; }
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
    store.docs = store.docs.filter((x) => x.id !== req.doc_id);
    store.results = store.results.filter((r) => r.document_id !== req.doc_id);
    store.docs.unshift(document);
    store.results.push(...results);
    const row = exams.find((e) => e.id === req.doc_id);
    if (row) { row.status = 'confirmed'; row.unchecked = false; row.can_delete = false; }
    return { document };
  },
  async listRecords() {
    await wait(200);
    return store.docs.filter((d) => d.status === 'confirmed')
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
