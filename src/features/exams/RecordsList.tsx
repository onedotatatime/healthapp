import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { EmptyState, Spinner } from '../../components/Primitives';
import { ProvenanceMark } from '../../components/ProvenanceMark';
import { useExams } from './context';
import { KIND_LABEL, docMarks, formatDate, type RecordSummary } from './logic';

/** The patient home list: records by exam date, newest first (the server orders them). */
export function RecordsList() {
  const { api, base } = useExams();
  const [rows, setRows] = useState<RecordSummary[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    api.listRecords().then((r) => live && setRows(r), () => live && setFailed(true));
    return () => { live = false; };
  }, [api]);

  return (
    <section data-testid="records">
      <Link to={`${base}/add`} className="btn primary block" data-testid="add-exam-link">Add an exam</Link>
      <div style={{ marginTop: 'var(--space-6)' }}>
        {failed && <div className="note caution" data-testid="records-error">We could not load your record. Reload the page to try again.</div>}
        {!failed && rows === null && <Spinner label="Loading your record" />}
        {rows && rows.length === 0 && <EmptyState>No exams yet. Photograph a paper exam to add the first one.</EmptyState>}
        {rows && rows.length > 0 && (
          <ul className="records">
            {rows.map(({ document: d, outOfRange }) => (
              <li key={d.id}>
                <Link to={`${base}/${d.id}`} className="record-link" data-testid="record-row">
                  <span className="rtitle">{KIND_LABEL[d.kind]}</span>
                  <span className="rdate">{formatDate(d.exam_date)}</span>
                  {d.issuer && <span className="muted">{d.issuer}</span>}
                  <span className="rmeta">
                    {docMarks(d).map((k) => <ProvenanceMark key={k} kind={k} />)}
                    {outOfRange > 0 && <span className="oor-count" data-testid="oor-count">{outOfRange} outside the printed range</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
