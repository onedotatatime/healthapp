import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/call';
import type { DocCreateResponse, DocumentDraft, ExtractResponse } from '../../api/contract';
import {
  buildConfirm,
  failureOf,
  hasErrors,
  initForm,
  outOfRangeText,
  parseNumber,
  printedRange,
  readExam,
  refusalView,
  validateForm,
  type ExamsApi,
} from './logic';

const U = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const DOC = U(1);
const base = { document_id: DOC, analyte_key: null, value_text: null, ref_low: null, confidence: 0.9, edited_by_patient: false };
const draft: DocumentDraft = {
  document: {
    id: DOC, patient_id: U(9), kind: 'blood_test', language: 'el', exam_date: '2026-11-10', issuer: 'Demo Lab Athens',
    identity_status: 'match', provenance: 'uploaded_by_patient', status: 'draft', created_at: '2026-11-15T09:30:00.000+00:00', confirmed_at: null, unchecked: false,
  },
  printed_name: 'ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ',
  printed_id: 'AK 123456',
  header_confidence: { exam_date: 0.95, issuer: 0.9, printed_name: 0.98, printed_id: 0.97 },
  results: [
    { ...base, id: U(2), analyte: 'CRP', value_num: 21.5, unit: 'mg/L', ref_high: 5, ref_text: '<5', flag: 'high' },
    { ...base, id: U(3), analyte: 'Anti-CCP', value_num: null, value_text: 'Θετικό', unit: null, ref_high: null, ref_text: 'Αρνητικό', flag: 'unknown' },
  ],
  findings: [],
};
const doc: DocCreateResponse = { doc_id: DOC, bucket: 'b', path: 'p', token: 't', signed_url: 'https://example.invalid/u' };

function fakeApi(over: Partial<ExamsApi> = {}): ExamsApi {
  return {
    createDoc: vi.fn(async () => doc),
    upload: vi.fn(async () => undefined),
    extract: vi.fn(async (): Promise<ExtractResponse> => ({ outcome: 'draft', draft })),
    confirm: vi.fn(),
    listRecords: vi.fn(),
    getRecord: vi.fn(),
    photoUrl: vi.fn(),
    ...over,
  } as ExamsApi;
}
const blob = new Blob(['x']);

describe('printed range and the out-of-range sentence (PRD 13.4)', () => {
  it('uses the range as printed and adds the unit', () => {
    expect(printedRange({ ref_text: '<5', ref_low: null, ref_high: 5, unit: 'mg/L' })).toBe('<5 mg/L');
    expect(outOfRangeText({ ref_text: '0-20', ref_low: 0, ref_high: 20, unit: 'mm/h' })).toBe('Outside the printed range (0-20 mm/h)');
  });
  it('builds the range from the numbers when no text was read, and says nothing invented when there is none', () => {
    expect(printedRange({ ref_text: null, ref_low: 12, ref_high: 16, unit: 'g/dL' })).toBe('12–16 g/dL');
    expect(printedRange({ ref_text: null, ref_low: null, ref_high: null, unit: 'g/dL' })).toBeNull();
    expect(outOfRangeText({ ref_text: null, ref_low: null, ref_high: null, unit: null })).toBe('Outside the printed range');
  });
});

describe('refusals pick their sentence from the server reason', () => {
  it('says "Nothing was saved" on every refusal and keeps identity apart from reading', () => {
    for (const r of ['unreadable', 'unsupported_kind', 'incomplete', 'name_mismatch', 'id_mismatch', 'name_missing'] as const) {
      const v = refusalView(r);
      expect(`${v.title} ${v.body}`).toMatch(/Nothing was saved|didn't save/);
    }
    expect(refusalView('unreadable')).toMatchObject({ kind: 'cannot-read', title: "We couldn't read this photo." });
    expect(refusalView('id_mismatch').kind).toBe('identity');
  });
});

describe('readExam', () => {
  it('creates, uploads, extracts, and returns the draft', async () => {
    const api = fakeApi();
    const r = await readExam(api, { blob });
    expect(r).toMatchObject({ phase: 'review' });
    expect(api.createDoc).toHaveBeenCalledWith(blob.size);
    expect(api.upload).toHaveBeenCalledWith(doc, blob);
    expect(api.extract).toHaveBeenCalledWith(DOC, expect.any(AbortSignal));
  });
  it('turns a refusal into a view, and forgets the doc so the next photo starts clean', async () => {
    const api = fakeApi({ extract: vi.fn(async () => ({ outcome: 'refused', reason: 'unreadable', message: 'x' }) as ExtractResponse) });
    const ctx = { blob };
    const r = await readExam(api, ctx);
    expect(r).toMatchObject({ phase: 'refused', view: { kind: 'cannot-read' } });
    expect(ctx).toMatchObject({ docId: undefined, uploaded: false });
  });
  it('after a network failure on extract, a retry does not upload the photo again', async () => {
    let n = 0;
    const api = fakeApi({
      extract: vi.fn(async (): Promise<ExtractResponse> => {
        if (n++ === 0) throw new ApiError(0, 'down');
        return { outcome: 'draft', draft };
      }),
    });
    const ctx = { blob };
    expect(await readExam(api, ctx)).toMatchObject({ phase: 'failed', failure: { kind: 'network' } });
    expect(await readExam(api, ctx)).toMatchObject({ phase: 'review' });
    expect(api.createDoc).toHaveBeenCalledTimes(1);
    expect(api.upload).toHaveBeenCalledTimes(1);
    expect(api.extract).toHaveBeenCalledTimes(2);
  });
  it('after an upload failure, a retry starts again from a new draft', async () => {
    const api = fakeApi({ upload: vi.fn().mockRejectedValueOnce(new ApiError(0, 'down')).mockResolvedValue(undefined) });
    const ctx = { blob };
    expect(await readExam(api, ctx)).toMatchObject({ phase: 'failed' });
    expect(await readExam(api, ctx)).toMatchObject({ phase: 'review' });
    expect(api.createDoc).toHaveBeenCalledTimes(2);
  });
  it('stops waiting at the limit and says the photo is kept', async () => {
    const api = fakeApi({
      extract: (_id, signal) => new Promise((_, rej) => signal?.addEventListener('abort', () => rej(new DOMException('a', 'AbortError')))),
    });
    const r = await readExam(api, { blob }, 20);
    expect(r).toMatchObject({ phase: 'failed', failure: { kind: 'timeout', body: expect.stringContaining('kept') } });
  });
  it('maps the typed server errors', () => {
    expect(failureOf(new ApiError(503, 'x', 'model_unavailable')).kind).toBe('server');
    expect(failureOf(new ApiError(401, 'x', 'unauthenticated')).kind).toBe('session');
    expect(failureOf(new Error('boom')).kind).toBe('server');
  });
});

describe('the review form (A2)', () => {
  it('sends nothing but the exam id when nothing was changed', () => {
    expect(buildConfirm(draft, initForm(draft))).toEqual({ doc_id: DOC, results: [], findings: [] });
  });
  it('sends only the changed fields, a number as a number, and a comma as a decimal point', () => {
    const form = initForm(draft);
    form.results[U(2)] = { value: '2,15', unit: 'mg/L' };
    form.results[U(3)] = { value: 'Αρνητικό', unit: '' };
    form.examDate = '2026-11-09';
    expect(buildConfirm(draft, form)).toEqual({
      doc_id: DOC,
      exam_date: '2026-11-09',
      results: [
        { id: U(2), value_num: 2.15 },
        { id: U(3), value_text: 'Αρνητικό' },
      ],
      findings: [],
    });
  });
  it('can change a unit and clear it', () => {
    const form = initForm(draft);
    form.results[U(2)] = { value: '21.5', unit: '' };
    expect(buildConfirm(draft, form).results).toEqual([{ id: U(2), unit: null }]);
  });
  it('refuses a number that is not one, before anything is sent', () => {
    const form = initForm(draft);
    form.results[U(2)] = { value: 'abc', unit: 'mg/L' };
    const e = validateForm(draft, form);
    expect(e.results[U(2)]).toBe('Enter a number.');
    expect(hasErrors(e)).toBe(true);
    expect(parseNumber('2,5')).toBe(2.5);
    expect(parseNumber('')).toBeNull();
  });
  it('has no field for the name or the ID: the request type cannot carry them', () => {
    const req = buildConfirm(draft, initForm(draft));
    expect(Object.keys(req).sort()).toEqual(['doc_id', 'findings', 'results']);
  });
});
