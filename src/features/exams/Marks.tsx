import { Warning } from '@phosphor-icons/react';
import { ErrorNote } from '../../components/Primitives';
import { outOfRangeText, isLowConfidence, type RefusalView } from './logic';
import type { ResultRow } from '../../api/contract';

/** Out of range: an icon and the printed range in words, amber, never red on a patient result (Drop 0). Says nothing about meaning (N1). */
export function OutOfRange({ r }: { r: Pick<ResultRow, 'ref_text' | 'ref_low' | 'ref_high' | 'unit'> }) {
  return (
    <span className="oor" data-testid="out-of-range">
      <Warning size={16} weight="bold" aria-hidden="true" />
      {outOfRangeText(r)}
    </span>
  );
}

export function CheckThis({ confidence }: { confidence: number | null }) {
  if (!isLowConfidence(confidence)) return null;
  return <span className="check-this" data-testid="check-this">Check this one</span>;
}

/** B1: the calm refusal. Title and body come from the server's typed reason; every variant says nothing was saved. */
export function RefusalNote({ view }: { view: RefusalView }) {
  return (
    <ErrorNote tone="caution">
      <span><strong>{view.title}</strong> {view.body}</span>
    </ErrorNote>
  );
}
