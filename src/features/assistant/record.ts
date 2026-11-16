/**
 * The record the doctor reads under the grant, and everything computed from it (pure, no React). E1 is a read
 * (cto-review section 3 row 4): the overview is composed here from four RLS reads, with no model call. The same index
 * resolves every cite id of an answer (PRD 12.5: a fact whose cite does not resolve is not shown as a fact).
 */
import type { MarkKind } from '../../components/ProvenanceMark';
import type { CiteId, DiaryRow, DocumentRow, FindingRow, ResultRow, Segment } from './contract';

export interface RecordData {
  documents: DocumentRow[];
  results: ResultRow[];
  findings: FindingRow[];
  diary: DiaryRow[];
}

/** What a source viewer opens: a whole document (its photo and values, optionally one row marked) or one diary entry. */
export type Subject = { kind: 'doc'; docId: string; focus?: CiteId } | { kind: 'diary'; id: string };

export interface Source {
  cite: CiteId;
  subject: Subject;
  /** Short name for the chip card: "Blood test: CRP". */
  name: string;
  /** "30 Oct 2026" */
  date: string;
  provenance: 'verified' | 'uploaded';
  /** The provenance mark first, then edited / name-match when they apply. */
  marks: MarkKind[];
}

export const KIND_LABEL: Record<DocumentRow['kind'], string> = {
  blood_test: 'Blood test',
  imaging_report: 'Imaging report',
  doctor_letter: "Doctor's letter",
};

const DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const DATE_LOCAL = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Athens' });
const TIME_LOCAL = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Athens' });

/** `YYYY-MM-DD` (a calendar date: no zone) or a timestamp (shown in the hospital's zone). */
export function formatDate(d: string | null): string {
  if (!d) return 'No date';
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? DATE.format(new Date(`${d}T00:00:00Z`)) : DATE_LOCAL.format(new Date(d));
}
export const formatTime = (ts: string) => TIME_LOCAL.format(new Date(ts));

/** The printed range, in the document's own terms. */
export function rangeText(r: ResultRow): string | null {
  if (r.ref_text) return r.ref_text;
  if (r.ref_low !== null && r.ref_high !== null) return `${r.ref_low} to ${r.ref_high}`;
  if (r.ref_high !== null) return `below ${r.ref_high}`;
  if (r.ref_low !== null) return `above ${r.ref_low}`;
  return null;
}
export const valueText = (r: ResultRow) => [r.value_num ?? r.value_text ?? 'no value', r.unit].filter((x) => x !== null && x !== '').join(' ');
export const FLAG_WORD: Record<ResultRow['flag'], string> = { low: 'below range', high: 'above range', normal: 'within range', unknown: 'no range printed' };

const docMarks = (d: DocumentRow, edited: boolean): MarkKind[] => [
  d.provenance === 'verified_by_source' ? 'verified' : 'uploaded',
  ...(edited ? (['edited'] as MarkKind[]) : []),
  ...(d.identity_status === 'name_only' ? (['name-match'] as MarkKind[]) : []),
];

export interface RecordIndex {
  /** Every citeable row by its full cite id (`r:`, `f:`, `d:`). */
  sources: Map<string, Source>;
  docs: Map<string, DocumentRow>;
  resolve(cite: string): Source | null;
}

export function buildIndex(data: RecordData): RecordIndex {
  const docs = new Map(data.documents.map((d) => [d.id, d]));
  const sources = new Map<string, Source>();
  for (const r of data.results) {
    const d = docs.get(r.document_id);
    if (!d) continue; // a result whose document the doctor cannot read is not citeable
    const cite = `r:${r.id}` as CiteId;
    sources.set(cite, { cite, subject: { kind: 'doc', docId: d.id, focus: cite }, name: `${KIND_LABEL[d.kind]}: ${r.analyte}`, date: formatDate(d.exam_date ?? d.created_at), provenance: d.provenance === 'verified_by_source' ? 'verified' : 'uploaded', marks: docMarks(d, r.edited_by_patient) });
  }
  for (const f of data.findings) {
    const d = docs.get(f.document_id);
    if (!d) continue;
    const cite = `f:${f.id}` as CiteId;
    sources.set(cite, { cite, subject: { kind: 'doc', docId: d.id, focus: cite }, name: KIND_LABEL[d.kind], date: formatDate(f.finding_date ?? d.exam_date ?? d.created_at), provenance: d.provenance === 'verified_by_source' ? 'verified' : 'uploaded', marks: docMarks(d, f.edited_by_patient) });
  }
  for (const e of data.diary) {
    const cite = `d:${e.id}` as CiteId;
    sources.set(cite, { cite, subject: { kind: 'diary', id: e.id }, name: 'Diary entry', date: formatDate(e.occurred_at), provenance: 'uploaded', marks: ['uploaded'] });
  }
  return { sources, docs, resolve: (c) => sources.get(c) ?? null };
}

/** A fact is shown as a fact only with at least one cite and every cite resolved (PRD 12.5). */
export function factStatus(seg: Pick<Segment, 'cites' | 'verified'>, index: Pick<RecordIndex, 'resolve'>): 'ok' | 'unverified' | 'unresolved' {
  if (seg.cites.length === 0 || seg.cites.some((c) => !index.resolve(c))) return 'unresolved';
  return seg.verified ? 'ok' : 'unverified';
}

// Overview -------------------------------------------------------------------------------------------------

export interface OverviewItem {
  key: string;
  /** "CRP 14.2 mg/L, above range (printed: below 5)" or the document's own words */
  text: string;
  date: string;
  source: Source;
}
export interface TimelineRow {
  key: string;
  at: number;
  kind: 'exam' | 'diary';
  title: string;
  detail: string;
  date: string;
  subject: Subject;
  marks: MarkKind[];
}
export interface Overview {
  outOfRange: OverviewItem[];
  conditions: OverviewItem[];
  timeline: TimelineRow[];
}

const ms = (d: string | null) => (d ? Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T00:00:00Z` : d) : 0);

export function buildOverview(data: RecordData, index: RecordIndex): Overview {
  const outOfRange = data.results
    .filter((r) => r.flag === 'low' || r.flag === 'high')
    .flatMap((r) => {
      const source = index.resolve(`r:${r.id}`);
      const d = index.docs.get(r.document_id);
      if (!source || !d) return [];
      const range = rangeText(r);
      return [{ at: ms(d.exam_date ?? d.created_at), item: { key: r.id, text: `${r.analyte} ${valueText(r)}, ${FLAG_WORD[r.flag]}${range ? ` (printed: ${range})` : ''}`, date: source.date, source } }];
    })
    .sort((a, b) => b.at - a.at || a.item.text.localeCompare(b.item.text))
    .map((x) => x.item);

  const conditions = data.findings
    .filter((f) => f.kind === 'written_diagnosis')
    .flatMap((f) => {
      const source = index.resolve(`f:${f.id}`);
      const d = index.docs.get(f.document_id);
      if (!source || !d) return [];
      return [{ at: ms(f.finding_date ?? d.exam_date ?? d.created_at), item: { key: f.id, text: f.text_original, date: source.date, source } }];
    })
    .sort((a, b) => b.at - a.at)
    .map((x) => x.item);

  const exams: TimelineRow[] = data.documents.map((d) => {
    const flagged = data.results.filter((r) => r.document_id === d.id && (r.flag === 'low' || r.flag === 'high')).length;
    const n = data.results.filter((r) => r.document_id === d.id).length;
    return {
      key: `doc-${d.id}`,
      at: ms(d.exam_date ?? d.created_at),
      kind: 'exam',
      title: KIND_LABEL[d.kind],
      detail: [d.issuer, n ? `${n} values${flagged ? `, ${flagged} outside range` : ''}` : null].filter(Boolean).join('. '),
      date: formatDate(d.exam_date ?? d.created_at),
      subject: { kind: 'doc', docId: d.id },
      marks: docMarks(d, false),
    };
  });
  const diary: TimelineRow[] = data.diary.map((e) => ({
    key: `diary-${e.id}`,
    at: ms(e.occurred_at),
    kind: 'diary',
    title: `Diary entry, severity ${e.severity} of 10`,
    detail: e.text,
    date: `${formatDate(e.occurred_at)}, ${formatTime(e.occurred_at)}`,
    subject: { kind: 'diary', id: e.id },
    marks: ['uploaded'],
  }));
  const timeline = [...exams, ...diary].sort((a, b) => b.at - a.at);
  return { outOfRange, conditions, timeline };
}


// Exams list (MIN-4664) -----------------------------------------------------------------------------------------

export interface ExamRow {
  key: string;
  at: number;
  title: string;
  date: string;
  values: number;
  /** results with a low or high flag (the document's own printed range) */
  flagged: number;
  findings: number;
  subject: Subject;
  marks: MarkKind[];
}

/** Every confirmed document the grant can read, newest exam date first. A row opens that document in the source viewer. */
export function buildExams(data: RecordData): ExamRow[] {
  return data.documents
    .map((d) => {
      const rs = data.results.filter((r) => r.document_id === d.id);
      return {
        key: d.id,
        at: ms(d.exam_date ?? d.created_at),
        title: KIND_LABEL[d.kind],
        date: formatDate(d.exam_date ?? d.created_at),
        values: rs.length,
        flagged: rs.filter((r) => r.flag === 'low' || r.flag === 'high').length,
        findings: data.findings.filter((f) => f.document_id === d.id).length,
        subject: { kind: 'doc', docId: d.id } as Subject,
        marks: docMarks(d, false),
      };
    })
    .sort((a, b) => b.at - a.at || a.key.localeCompare(b.key));
}
