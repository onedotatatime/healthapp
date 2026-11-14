import { useId } from 'react';
import { MARK_LABEL, ProvenanceMark } from './ProvenanceMark';

export interface CitationRecord {
  name: string;
  date: string;
  provenance: 'verified' | 'uploaded';
}

/** A numbered source chip at the end of a claim. Hover or keyboard focus shows the record card; click opens the viewer. */
export function CitationChip({ n, record, open = false, onOpen }: { n: number; record: CitationRecord; open?: boolean; onOpen?: () => void }) {
  const id = useId();
  const label = `Source ${n}: ${record.name}, ${record.date}, ${MARK_LABEL[record.provenance].toLowerCase()}`;
  return (
    <span className="chip-wrap">
      <button type="button" className="chip" aria-label={label} aria-describedby={id} aria-pressed={open} onClick={onOpen}>
        {n}
      </button>
      <span id={id} role="tooltip" className="chip-card">
        <strong>{record.name}</strong>
        <ProvenanceMark kind={record.provenance} surface="doctor" />
      </span>
    </span>
  );
}
