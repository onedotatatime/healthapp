/** Pure parts of the exam flow (A1 + A2): wording, the read-and-retry runner, the edit diff. No React, no DOM. */
import type { z } from 'zod';
import { ApiError } from '../../api/call';
import {
  LOW_CONFIDENCE,
  type ConfirmDocRequest,
  type DocCreateResponse,
  type DocumentDraft,
  type DocumentRow,
  type RefusalReason,
  type ResultRow,
} from '../../api/contract';
import type { ExamListItem } from './scanApi';

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
  /** The kick (MIN-4556): starts the reading in the background. keepalive, never waited on, never throws; its answer is ignored. */
  kick(docId: string): Promise<void>;
  /** "My exams": every upload of the caller, newest first. */
  listExams(): Promise<ExamListItem[]>;
  /** The stored draft, for the review. */
  getDraft(docId: string): Promise<DocumentDraft>;
  /** Opening a saved exam: the server clears its "not checked" mark. Never throws. */
  openExam(docId: string): Promise<void>;
  deleteExam(docId: string): Promise<void>;
  /** confirmed -> draft, owner only. */
  unconfirm(docId: string): Promise<void>;
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
// The scan (MIN-4557): create the row, upload, kick. Nothing waits for the reading: the result is the row's status
// in "My exams". Remembers what already worked so a retry never asks for a second photo because the Wi-Fi blinked.
// ---------------------------------------------------------------------------------------------
export interface ScanCtx {
  blob: Blob;
  docId?: string;
  uploaded?: boolean;
}
export type ScanResult = { phase: 'saved'; docId: string } | { phase: 'failed'; failure: Failure };

/** The scan screen's one failure sentence (the photo is kept for the retry); an ended session still says so. */
export function scanFailureOf(e: unknown): Failure {
  const f = failureOf(e);
  if (f.kind === 'session') return f;
  return { kind: 'photo', title: 'The photo was not saved.', body: 'Try again.' };
}

export async function scanPhoto(api: ExamsApi, ctx: ScanCtx): Promise<ScanResult> {
  try {
    if (!ctx.docId || !ctx.uploaded) {
      ctx.docId = undefined;
      const doc = await api.createDoc(ctx.blob.size);
      await api.upload(doc, ctx.blob);
      ctx.docId = doc.doc_id;
      ctx.uploaded = true;
    }
    // Fire and forget: the reading runs on the server; the screen is already free for the next photo.
    void api.kick(ctx.docId);
    return { phase: 'saved', docId: ctx.docId };
  } catch (e) {
    return { phase: 'failed', failure: scanFailureOf(e) };
  }
}

// ---------------------------------------------------------------------------------------------
// "My exams": one row per upload. The status table (MIN-4555 and its addendum). Wording is Product's placeholder.
// No cause, no condition, no advice, no score in any row (N1).
// ---------------------------------------------------------------------------------------------
export const POLL_MS = 4000;

/** Ask again while any row is waiting or reading; stop when none is. */
export const shouldPoll = (items: Pick<ExamListItem, 'status'>[]): boolean => items.some((i) => i.status === 'queued' || i.status === 'reading');

export type ChipTone = 'neutral' | 'ready' | 'saved' | 'caution';
export interface RowView {
  chip: string;
  tone: ChipTone;
  /** What the row does when pressed: open the review, open the saved exam, or nothing. */
  opens: 'review' | 'record' | null;
  /** The plain sentence for a refused or failed row. */
  reason: string | null;
  /** The "not checked" mark: a confirmed exam read automatically that the owner has not opened. */
  notChecked: boolean;
  retry: boolean;
  del: boolean;
}

const IDENTITY_REASONS = new Set(['name_missing', 'name_mismatch', 'id_mismatch']);
const REFUSAL_REASONS = new Set(['unreadable', 'unsupported_kind', 'incomplete', ...IDENTITY_REASONS]);
export const FALLBACK_REASON = 'We could not read this file.';

/** One plain sentence per reason code. Refusals reuse the review screen's wording (MIN-4478); no printed name, ever. */
export function reasonText(reason: string | null): string {
  if (reason && REFUSAL_REASONS.has(reason)) {
    const v = refusalView(reason as RefusalReason);
    return `${v.title} ${v.body}`;
  }
  switch (reason) {
    case 'model_timeout': return 'The reader took too long. Your photo is kept. Try again.';
    case 'model_http': return 'The reader is busy right now. Your photo is kept. Try again in a moment.';
    case 'model_invalid': return 'We could not read this photo. Your photo is kept. Try again.';
    case 'config': return 'Reading is not available right now. Your photo is kept.';
    case 'too_many_attempts': return 'We tried three times and could not read it. Delete it and scan it again.';
    case 'stuck': return 'This took too long. Your photo is kept. Try again.';
    case 'no_file': return 'The photo did not arrive. Scan it again.';
    case 'delete_failed': return 'We could not remove this photo. Delete it and scan it again.';
    case 'unsupported_type': return 'That file is not a photo. Delete it and scan the paper again.';
    default: return FALLBACK_REASON;
  }
}

/** The status table: which chip, what the row opens, which actions it offers. */
export function rowView(i: Pick<ExamListItem, 'status' | 'reason' | 'can_retry' | 'can_delete' | 'unchecked'>): RowView {
  const base = { opens: null, reason: null, notChecked: false, retry: false, del: false } as const;
  switch (i.status) {
    case 'queued': return { ...base, chip: 'Waiting', tone: 'neutral' };
    case 'reading': return { ...base, chip: 'Reading', tone: 'neutral' };
    case 'draft': return { ...base, chip: 'Ready to check', tone: 'ready', opens: 'review' };
    case 'confirmed': return { ...base, chip: 'Saved', tone: 'saved', opens: 'record', notChecked: i.unchecked === true };
    case 'refused': {
      const identity = !!i.reason && IDENTITY_REASONS.has(i.reason);
      const chip = identity ? 'Not your exam' : i.reason === 'unsupported_kind' ? 'Not an exam' : 'Could not read';
      // The file is gone after a refusal: Delete only, no Try again.
      return { ...base, chip, tone: 'caution', reason: reasonText(i.reason), del: i.can_delete };
    }
    case 'failed': return { ...base, chip: 'Could not read', tone: 'caution', reason: reasonText(i.reason), retry: i.can_retry, del: i.can_delete };
  }
}

export const valuesReadText = (n: number | null) => (n == null ? null : `${n} ${n === 1 ? 'value' : 'values'} read`);

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
