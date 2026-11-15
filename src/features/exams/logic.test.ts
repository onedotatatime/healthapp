import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/call';
import type { DocCreateResponse, DocumentDraft } from '../../api/contract';
import {
  buildConfirm,
  failureOf,
  hasErrors,
  initForm,
  outOfRangeText,
  parseNumber,
  printedRange,
  FALLBACK_REASON,
  POLL_MS,
  reasonText,
  refusalView,
  rowView,
  scanFailureOf,
  scanPhoto,
  shouldPoll,
  valuesReadText,
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
    kick: vi.fn(async () => undefined),
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

describe('scanPhoto (MIN-4557: nothing waits for the reading)', () => {
  it('creates, uploads, kicks the reading, and says saved', async () => {
    const api = fakeApi();
    const r = await scanPhoto(api, { blob });
    expect(r).toEqual({ phase: 'saved', docId: DOC });
    expect(api.createDoc).toHaveBeenCalledWith(blob.size);
    expect(api.upload).toHaveBeenCalledWith(doc, blob);
    expect(api.kick).toHaveBeenCalledWith(DOC);
  });
  it('does not wait for the kick: a kick that never answers still gives "saved"', async () => {
    const api = fakeApi({ kick: vi.fn(() => new Promise<void>(() => {})) });
    expect(await scanPhoto(api, { blob })).toMatchObject({ phase: 'saved' });
  });
  it('five scans in a row: five rows created, five kicks, each with its own id', async () => {
    let n = 0;
    const api = fakeApi({ createDoc: vi.fn(async () => ({ ...doc, doc_id: U(10 + n++) })) });
    for (let i = 0; i < 5; i++) expect(await scanPhoto(api, { blob })).toMatchObject({ phase: 'saved' });
    expect(api.kick).toHaveBeenCalledTimes(5);
    expect((api.kick as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0])).toEqual([U(10), U(11), U(12), U(13), U(14)]);
  });
  it('after an upload failure the photo is kept and a retry starts again from a new row, with no kick before it worked', async () => {
    const api = fakeApi({ upload: vi.fn().mockRejectedValueOnce(new ApiError(0, 'down')).mockResolvedValue(undefined) });
    const ctx = { blob };
    expect(await scanPhoto(api, ctx)).toMatchObject({ phase: 'failed', failure: { title: 'The photo was not saved.', body: 'Try again.' } });
    expect(api.kick).not.toHaveBeenCalled();
    expect(ctx.blob).toBe(blob);
    expect(await scanPhoto(api, ctx)).toMatchObject({ phase: 'saved' });
    expect(api.createDoc).toHaveBeenCalledTimes(2);
    expect(api.kick).toHaveBeenCalledTimes(1);
  });
  it('an ended session still says so; any other failure uses the one sentence', () => {
    expect(scanFailureOf(new ApiError(401, 'x', 'unauthenticated')).kind).toBe('session');
    expect(scanFailureOf(new ApiError(503, 'x')).title).toBe('The photo was not saved.');
    expect(scanFailureOf(new Error('boom')).title).toBe('The photo was not saved.');
  });
  it('maps the typed server errors', () => {
    expect(failureOf(new ApiError(503, 'x', 'model_unavailable')).kind).toBe('server');
    expect(failureOf(new ApiError(401, 'x', 'unauthenticated')).kind).toBe('session');
    expect(failureOf(new Error('boom')).kind).toBe('server');
  });
});

describe('the status table of "My exams" (MIN-4555 and its addendum)', () => {
  const row = (status: Parameters<typeof rowView>[0]['status'], o: Partial<Parameters<typeof rowView>[0]> = {}) =>
    rowView({ status, reason: null, can_retry: false, can_delete: true, unchecked: false, ...o });

  it('waiting and reading: a chip, no action, no opening', () => {
    expect(row('queued')).toMatchObject({ chip: 'Waiting', opens: null, retry: false, del: false, reason: null });
    expect(row('reading')).toMatchObject({ chip: 'Reading', opens: null, retry: false, del: false });
  });
  it('draft: "Ready to check", opens the review', () => {
    expect(row('draft')).toMatchObject({ chip: 'Ready to check', opens: 'review', notChecked: false });
  });
  it('confirmed: "Saved", opens the saved exam; "not checked" only while unchecked', () => {
    expect(row('confirmed', { can_delete: false })).toMatchObject({ chip: 'Saved', opens: 'record', notChecked: false, del: false });
    expect(row('confirmed', { unchecked: true, can_delete: false })).toMatchObject({ chip: 'Saved', opens: 'record', notChecked: true });
    expect(row('confirmed', { unchecked: undefined, can_delete: false }).notChecked).toBe(false);
  });
  it('refused: the reason in words and Delete only (the file is gone), chip by reason code', () => {
    const v = row('refused', { reason: 'name_mismatch' });
    expect(v).toMatchObject({ chip: 'Not your exam', retry: false, del: true, opens: null });
    expect(v.reason).toBe("This exam isn't yours. The name on it doesn't match your profile. We didn't save it.");
    expect(row('refused', { reason: 'name_missing' }).chip).toBe('Not your exam');
    expect(row('refused', { reason: 'unsupported_kind' }).chip).toBe('Not an exam');
    expect(row('refused', { reason: 'unreadable' }).chip).toBe('Could not read');
  });
  it('refused with the photo kept (MIN-4639): the kept sentence; Try again exactly when can_retry', () => {
    const kept = (reason: NonNullable<Parameters<typeof rowView>[0]['reason']>, can_retry: boolean) => row('refused', { reason, can_retry, file_kept: true });
    expect(kept('unreadable', true)).toMatchObject({ retry: true, del: true });
    expect(kept('unreadable', true).reason).toBe("We couldn't read this photo. Fit the whole page in the frame, flat and in good light, then try again. Nothing was saved, and the photo is kept for 14 days so it can be checked again; you can delete it.");
    expect(kept('name_mismatch', true).reason).toBe("This exam isn't yours. The name on it doesn't match your profile. We didn't save it, and the photo is kept for 14 days so it can be checked again; you can delete it.");
    for (const r of ['unreadable', 'unsupported_kind', 'incomplete', 'name_missing'] as const) expect(kept(r, false).reason).toMatch(/Nothing was saved, and the photo is kept for 14 days so it can be checked again; you can delete it\.$/);
    expect(kept('id_mismatch', false).reason).toMatch(/We didn't save it, and the photo is kept for 14 days so it can be checked again; you can delete it\.$/);
    // read 3 times: sentence stays, button goes
    expect(kept('incomplete', false)).toMatchObject({ retry: false, del: true });
  });
  it('refused without a kept photo: the old sentence, no Try again', () => {
    const v = row('refused', { reason: 'unreadable', file_kept: false });
    expect(v.retry).toBe(false);
    expect(v.reason).toMatch(/Nothing was saved\.$/);
    expect(v.reason).not.toContain('14 days');
  });
  it('failed: the reason, Try again only when the server says so, Delete', () => {
    expect(row('failed', { reason: 'model_timeout', can_retry: true })).toMatchObject({ chip: 'Could not read', retry: true, del: true });
    expect(row('failed', { reason: 'too_many_attempts', can_retry: false })).toMatchObject({ retry: false, del: true });
  });
  it('a reason code with no sentence says the fallback, and so does a missing reason', () => {
    expect(reasonText('something_new')).toBe(FALLBACK_REASON);
    expect(reasonText(null)).toBe(FALLBACK_REASON);
    expect(FALLBACK_REASON).toBe('We could not read this file.');
  });
  it('no row says a cause, a condition, advice, a score, or a printed name', () => {
    const codes = ['unreadable', 'unsupported_kind', 'incomplete', 'name_missing', 'name_mismatch', 'id_mismatch', 'model_timeout', 'model_http', 'model_invalid', 'config', 'too_many_attempts', 'stuck', 'no_file', 'delete_failed', 'unsupported_type', 'error', 'not_read', 'zzz'];
    for (const c of codes) expect(reasonText(c)).not.toMatch(/\b(cause|diagnos|condition|advice|score|risk|healthy|abnormal)\w*/i);
  });
  it('polls while any row is waiting or reading, and only then', () => {
    expect(shouldPoll([{ status: 'confirmed' }, { status: 'draft' }, { status: 'failed' }, { status: 'refused' }])).toBe(false);
    expect(shouldPoll([{ status: 'confirmed' }, { status: 'queued' }])).toBe(true);
    expect(shouldPoll([{ status: 'reading' }])).toBe(true);
    expect(shouldPoll([])).toBe(false);
    expect(POLL_MS).toBe(4000);
  });
  it('"N values read"', () => {
    expect(valuesReadText(9)).toBe('9 values read');
    expect(valuesReadText(1)).toBe('1 value read');
    expect(valuesReadText(null)).toBeNull();
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
