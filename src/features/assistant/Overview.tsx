/** E1: the overview the workspace opens on. Composed from the record read (record.ts), no model. Every item has its marks and a source button. */
import { CitationChip } from '../../components/CitationChip';
import { ProvenanceMark } from '../../components/ProvenanceMark';
import { EmptyState } from '../../components/Primitives';
import type { Overview, OverviewItem, Subject } from './record';

interface Props {
  overview: Overview;
  openCite: string | null;
  onOpenCite(cite: string): void;
  onOpenSubject(s: Subject): void;
}

export function OverviewPanel({ overview, openCite, onOpenCite, onOpenSubject }: Props) {
  const { outOfRange, conditions, timeline } = overview;
  let n = 0;
  const items = (list: OverviewItem[], testid: string) => (
    <ul className="as-list" data-testid={testid}>
      {list.map((it) => (
        <li key={it.key}>
          <p className="as-item">
            <span className="as-date">{it.date}</span> {it.text} <CitationChip n={++n} record={{ name: it.source.name, date: it.source.date, provenance: it.source.provenance }} open={openCite === it.source.cite} onOpen={() => onOpenCite(it.source.cite)} />
          </p>
          <span className="as-marks">{it.source.marks.map((m) => <ProvenanceMark key={m} kind={m} surface="doctor" />)}</span>
        </li>
      ))}
    </ul>
  );
  if (timeline.length === 0) return <EmptyState>This record has nothing in it yet.</EmptyState>;
  return (
    <div data-testid="overview">
      <h2>Outside the printed range</h2>
      {outOfRange.length ? items(outOfRange, 'overview-out-of-range') : <p className="muted">No values outside the printed range.</p>}
      <h2>Conditions written in the documents</h2>
      {conditions.length ? items(conditions, 'overview-conditions') : <p className="muted">No condition is written in the documents.</p>}
      <h2>Timeline</h2>
      <ol className="as-list as-timeline" data-testid="timeline">
        {timeline.map((r) => (
          <li key={r.key} data-kind={r.kind}>
            <p className="as-item">
              <span className="as-date">{r.date}</span> <strong>{r.title}</strong>
              {r.detail && <span className="as-detail">. {r.detail}</span>}
            </p>
            <span className="as-marks">
              {r.marks.map((m) => <ProvenanceMark key={m} kind={m} surface="doctor" />)}
              <button type="button" className="as-link" onClick={() => onOpenSubject(r.subject)} data-testid="timeline-open" aria-label={`Open source: ${r.title}, ${r.date}`}>Open source</button>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
