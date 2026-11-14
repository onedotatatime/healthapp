/** Pure parts of the exam flow (A1 + A2): wording, the read-and-retry runner, the edit diff. No React, no DOM. */
import type { z } from 'zod';
import { ApiError } from '../../api/call';
import {
  LOW_CONFIDENCE,
  type ConfirmDocRequest,
  type DocCreateResponse,
  type DocumentDraft,
  type DocumentRow,
  type ExtractResponse,
  type RefusalReason,
  type ResultRow,
} from '../../api/contract';

/** One call surface for the screens. `real.ts` talks to Cron's functions, `mock.ts` to in-memory fixtures. */
export interface RecordSummary {
  document: DocumentRow;
  outOfRange: number;
}
export interface RecordFull {
  document: DocumentRow;
  results: ResultRow[];
  findings: import('../../api/contract').FindingRow[];
}
export type ConfirmInput = z.input<typeof ConfirmDocRequest>;
export interface ExamsApi {
  createDoc(sizeBytes: number): Promise<DocCreateResponse>;
  upload(doc: DocCreateResponse, blob: Blob): Promise<void>;
  extract(docId: string, signal?: AbortSignal): Promise<ExtractResponse>;
  confirm(req: ConfirmInput): Promise<{ document: DocumentRow }>;
  listRecords(): Promise<RecordSummary[]>;
  getRecord(id: string): Promise<RecordFull>;
  /** A short-lived signed URL of the original photo. */
  photoUrl(docId: string): Promise<string>;
}

// ---------------------------------------------------------------------------------------------
// Wording (PRD 13.4). No exclamation marks, no explanation of what a value means (N1).
// ---------------------------------------------------------------------------------------------
export const KIND_LABEL: Record<DocumentRow['kind'], string> = {
  blood_test: 'Blood test',
  imaging_report: 'Imaging report',
  doctor_letter: "Doctor's letter",
};

export const FIXED_LINE = 'Only a doctor can tell you what your results mean.';

export function formatDate(iso: string | null): string {
  if (!iso) return 'No date';
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/** The range as printed on the paper (`ref_text`), else built from the numbers, with the unit. null when none was read. */
export function printedRange(r: Pick<ResultRow, 'ref_text' | 'ref_low' | 'ref_high' | 'unit'>): string | null {
  const text = r.ref_text?.trim();
  const range =
    text ||
    (r.ref_low != null && r.ref_high != null
      ? `${r.ref_low}–${r.ref_high}`
      : r.ref_high != null
        ? `<${r.ref_high}`
        : r.ref_low != null
          ? `>${r.ref_low}`
          : null);
  if (!range) return null;
  return r.unit && !range.includes(r.unit) ? `${range} ${r.unit}` : range;
}

export const isOutOfRange = (r: Pick<ResultRow, 'flag'>) => r.flag === 'high' || r.flag === 'low';

export function outOfRangeText(r: Pick<ResultRow, 'ref_text' | 'ref_low' | 'ref_high' | 'unit'>): string {
  const range = printedRange(r);
  return range ? `Outside the printed range (${range})` : 'Outside the printed range';
}

export const valueString = (r: Pick<ResultRow, 'value_num' | 'value_text'>) =>
  r.value_num != null ? String(r.value_num) : (r.value_text ?? '');

/** The document-level provenance marks, in order: where it came from, then "name match only" when the ID was not checked. */
export function docMarks(d: { provenance: string; identity_status: string | null }): ('verified' | 'uploaded' | 'name-match')[] {
  return [d.provenance === 'verified_by_source' ? 'verified' : 'uploaded', ...(d.identity_status === 'name_only' ? (['name-match'] as const) : [])];
}

export const isLowConfidence = (c: number | null) => c != null && c < LOW_CONFIDENCE;

// ---------------------------------------------------------------------------------------------
// Refusals and failures: the server's typed reason picks the sentence (PRD 12.2)
// ---------------------------------------------------------------------------------------------
export type RefusalView = { kind: 'cannot-read' | 'identity'; title: string; body: string };

export function refusalView(reason: RefusalReason): RefusalView {
  switch (reason) {
    case 'unreadable':
      return {
        kind: 'cannot-read',
        title: "We couldn't read this photo.",
        body: 'Fit the whole page in the frame, flat and in good light, then try again. Nothing was saved.',
      };
    case 'unsupported_kind':
      return {
        kind: 'cannot-read',
        title: "We couldn't read this photo.",
        body: "It doesn't look like a blood test, an imaging report or a doctor's letter. Nothing was saved.",
      };
    case 'incomplete':
      return {
        kind: 'cannot-read',
        title: "We couldn't read this photo.",
        body: 'We could not find the exam date, your name or a result on it. Fit the whole page in the frame and try again. Nothing was saved.',
      };
    case 'name_mismatch':
      return { kind: 'identity', title: "This exam isn't yours.", body: "The name on it doesn't match your profile. We didn't save it." };
    case 'id_mismatch':
      return { kind: 'identity', title: "This exam isn't yours.", body: "The ID on it doesn't match your profile. We didn't save it." };
    case 'name_missing':
      return {
        kind: 'identity',
        title: "We can't find your name on this exam.",
        body: 'An exam is saved only when it shows your name. Nothing was saved.',
      };
  }
}

export type Failure = { kind: 'network' | 'timeout' | 'server' | 'session' | 'photo'; title: string; body: string };

export function failureOf(e: unknown): Failure {
  if (e instanceof DOMException && e.name === 'AbortError') {
    return { kind: 'timeout', title: 'This is taking too long.', body: 'Your photo is kept. Try again.' };
  }
  if (e instanceof ApiError) {
    if (e.status === 0) return { kind: 'network', title: 'We could not reach the server.', body: 'Your photo is kept. Check the connection and try again.' };
    if (e.status === 401 || e.code === 'unauthenticated') return { kind: 'session', title: 'Your session ended.', body: 'Sign in again to continue.' };
    if (e.code === 'model_unavailable' || e.status === 503) return { kind: 'server', title: 'The reader is busy right now.', body: 'Your photo is kept. Try again in a moment.' };
  }
  return { kind: 'server', title: 'Something went wrong.', body: 'Your photo is kept. Try again.' };
}

// ---------------------------------------------------------------------------------------------
// The read: create the draft, upload, extract. Remembers what already worked so a retry never asks
// for a second photo because the Wi-Fi blinked (PRD 12.2).
// ---------------------------------------------------------------------------------------------
export interface ReadCtx {
  blob: Blob;
  docId?: string;
  uploaded?: boolean;
}
export type ReadResult =
  | { phase: 'review'; draft: DocumentDraft }
  | { phase: 'refused'; view: RefusalView }
  | { phase: 'failed'; failure: Failure };

export const EXTRACT_LIMIT_MS = 60_000;

export async function readExam(api: ExamsApi, ctx: ReadCtx, limitMs = EXTRACT_LIMIT_MS): Promise<ReadResult> {
  try {
    if (!ctx.docId || !ctx.uploaded) {
      ctx.docId = undefined;
      const doc = await api.createDoc(ctx.blob.size);
      await api.upload(doc, ctx.blob);
      ctx.docId = doc.doc_id;
      ctx.uploaded = true;
    }
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), limitMs);
    let res: ExtractResponse;
    try {
      res = await api.extract(ctx.docId, ac.signal);
    } finally {
      clearTimeout(timer);
    }
    if (res.outcome === 'refused') {
      // Nothing is saved and the server deleted the upload: the next photo starts from a clean slate.
      ctx.docId = undefined;
      ctx.uploaded = false;
      return { phase: 'refused', view: refusalView(res.reason) };
    }
    if (res.outcome === 'queued') {
      // MIN-4556: the reading now runs in the background (202 at once). The scan screen of MIN-4557 replaces this wait;
      // until it lands, a deployed extract-exam must not reach this screen.
      return { phase: 'failed', failure: failureOf(new ApiError(202, 'The reading runs in the background.')) };
    }
    return { phase: 'review', draft: res.draft };
  } catch (e) {
    return { phase: 'failed', failure: failureOf(e) };
  }
}

// ---------------------------------------------------------------------------------------------
// The review form (A2): what the patient may change, and the diff that goes to confirm-doc.
// Name and ID have no field here and no field in ConfirmDocRequest: there is no code path to edit them.
// ---------------------------------------------------------------------------------------------
export interface ReviewForm {
  examDate: string;
  results: Record<string, { value: string; unit: string }>;
  findings: Record<string, string>;
}

export function initForm(d: DocumentDraft): ReviewForm {
  return {
    examDate: d.document.exam_date ?? '',
    results: Object.fromEntries(d.results.map((r) => [r.id, { value: valueString(r), unit: r.unit ?? '' }])),
    findings: Object.fromEntries(d.findings.map((f) => [f.id, f.text_original])),
  };
}

/** A numeric result stays numeric: "21,5" reads as 21.5, "abc" is refused before anything is sent. */
export function parseNumber(text: string): number | null {
  const t = text.trim().replace(',', '.');
  if (t === '' || !/^-?\d+(\.\d+)?$/.test(t)) return null;
  return Number(t);
}

export function resultEdited(r: DocumentDraft['results'][number], f: ReviewForm['results'][string]): boolean {
  return f.value.trim() !== valueString(r).trim() || f.unit.trim() !== (r.unit ?? '').trim();
}

/** Field errors by result id. A numeric original must stay a number. */
export function validateForm(d: DocumentDraft, form: ReviewForm): { examDate?: string; results: Record<string, string> } {
  const out: { examDate?: string; results: Record<string, string> } = { results: {} };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.examDate)) out.examDate = 'Enter the exam date.';
  for (const r of d.results) {
    const f = form.results[r.id];
    if (!f) continue;
    if (r.value_num != null && parseNumber(f.value) === null) out.results[r.id] = 'Enter a number.';
    if (r.value_num == null && f.value.trim() === '') out.results[r.id] = 'Enter the value.';
  }
  return out;
}

export const hasErrors = (e: ReturnType<typeof validateForm>) => !!e.examDate || Object.keys(e.results).length > 0;

/** Only what changed goes to the server; it marks each of those fields edited_by_patient. */
export function buildConfirm(d: DocumentDraft, form: ReviewForm): ConfirmInput {
  const req: ConfirmInput = { doc_id: d.document.id, results: [], findings: [] };
  if (form.examDate && form.examDate !== d.document.exam_date) req.exam_date = form.examDate;
  for (const r of d.results) {
    const f = form.results[r.id];
    if (!f || !resultEdited(r, f)) continue;
    const edit: NonNullable<ConfirmInput['results']>[number] = { id: r.id };
    if (f.value.trim() !== valueString(r).trim()) {
      if (r.value_num != null) edit.value_num = parseNumber(f.value);
      else edit.value_text = f.value.trim();
    }
    if (f.unit.trim() !== (r.unit ?? '').trim()) edit.unit = f.unit.trim() || null;
    req.results!.push(edit);
  }
  for (const fd of d.findings) {
    const text = form.findings[fd.id];
    if (text !== undefined && text.trim() !== fd.text_original.trim()) req.findings!.push({ id: fd.id, text_original: text.trim() });
  }
  return req;
}
