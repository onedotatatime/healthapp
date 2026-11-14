import { Check, CircleNotch, Clock, ListChecks, Prohibit, WarningCircle } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { ProvenanceMark } from '../../components/ProvenanceMark';
import { KIND_LABEL, docMarks, formatDate, rowView, valuesReadText, type ChipTone, type RowView } from './logic';
import type { ExamListItem } from './scanApi';

/** What the saved list knew before this change: the document's provenance marks and the count outside the printed range. */
export interface SavedExtras {
  marks: ReturnType<typeof docMarks>;
  outOfRange: number;
}

const ICON: Record<ChipTone, typeof Check> = { neutral: Clock, ready: ListChecks, saved: Check, caution: WarningCircle };

/** The status chip: an icon and the words, never colour alone. Amber for "could not", never red or green. */
export function StatusChip({ view, status }: { view: RowView; status: ExamListItem['status'] }) {
  const Icon = status === 'reading' ? CircleNotch : view.tone === 'caution' && view.chip !== 'Could not read' ? Prohibit : ICON[view.tone];
  return (
    <span className={`mark status ${view.tone}`} data-testid="status-chip" data-status={status}>
      <Icon size={16} weight="bold" aria-hidden="true" />
      {view.chip}
    </span>
  );
}

interface Props {
  item: ExamListItem;
  base: string;
  extras?: SavedExtras;
  /** 'deleting' | 'retrying' while a call is out, and the row's last error. */
  busy?: 'deleting' | 'retrying';
  error?: string;
  onDelete(id: string): void;
  onRetry(id: string): void;
}

/** One upload, one row. A draft opens the review, a saved exam opens read-only, everything else shows what happened. */
export function ExamRow({ item, base, extras, busy, error, onDelete, onRetry }: Props) {
  const view = rowView(item);
  const done = item.status === 'draft' || item.status === 'confirmed';
  const values = done ? valuesReadText(item.values_read) : null;
  const body = (
    <>
      <span className="rtop">
        <span className="rtitle">{item.kind ? KIND_LABEL[item.kind] : 'Exam photo'}</span>
        <StatusChip view={view} status={item.status} />
      </span>
      <span className="rdate" data-testid="row-dates">
        {item.exam_date ? `${formatDate(item.exam_date)}, ` : ''}Uploaded {formatDate(item.uploaded_at)}
      </span>
      {(values || view.notChecked || extras) && (
        <span className="rmeta">
          {values && <span data-testid="values-read">{values}</span>}
          {view.notChecked && <ProvenanceMark kind="unchecked" />}
          {!view.notChecked && extras?.marks.map((k) => <ProvenanceMark key={k} kind={k} />)}
          {!view.notChecked && extras && extras.outOfRange > 0 && <span className="oor-count" data-testid="oor-count">{extras.outOfRange} outside the printed range</span>}
        </span>
      )}
      {view.notChecked && <span className="muted small" data-testid="unchecked-hint">Read automatically. Open it to check it.</span>}
    </>
  );

  if (view.opens) {
    return (
      <li>
        <Link to={view.opens === 'review' ? `${base}/${item.id}/review` : `${base}/${item.id}`} className="record-link" data-testid="record-row" data-status={item.status}>
          {body}
        </Link>
      </li>
    );
  }
  return (
    <li>
      <div className="record-link static" data-testid="record-row" data-status={item.status}>
        {body}
        {view.reason && <p className="reason" data-testid="row-reason">{view.reason}</p>}
        {error && <p className="reason err-line" role="alert">{error}</p>}
        {(view.retry || view.del) && (
          <div className="row-actions">
            {view.retry && <button type="button" className="btn primary" disabled={!!busy} onClick={() => onRetry(item.id)} data-testid="row-retry">{busy === 'retrying' ? 'Trying again' : 'Try again'}</button>}
            {view.del && <button type="button" className="btn" disabled={!!busy} onClick={() => onDelete(item.id)} data-testid="row-delete">{busy === 'deleting' ? 'Deleting' : 'Delete'}</button>}
          </div>
        )}
      </div>
    </li>
  );
}
