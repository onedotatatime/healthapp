import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { ErrorNote, Spinner } from '../../components/Primitives';
import { ProvenanceMark } from '../../components/ProvenanceMark';
import { useExams } from './context';
import { OutOfRange } from './Marks';
import { FIXED_LINE, KIND_LABEL, formatDate, isOutOfRange, printedRange, valueString, type RecordFull } from './logic';

/** A saved record: its values, the out-of-range marks, the findings in the document's own words, and the original photo. */
export function RecordView() {
  const { api, home } = useExams();
  const { id = '' } = useParams();
  const saved = (useLocation().state as { saved?: boolean } | null)?.saved === true;
  const [rec, setRec] = useState<RecordFull | null>(null);
  const [failed, setFailed] = useState(false);
  const [photo, setPhoto] = useState<string | 'error' | null>(null);

  useEffect(() => {
    let live = true;
    api.getRecord(id).then((r) => live && setRec(r), () => live && setFailed(true));
    api.photoUrl(id).then((u) => live && setPhoto(u), () => live && setPhoto('error'));
    return () => { live = false; };
  }, [api, id]);

  if (failed) return <main className="page"><ErrorNote tone="caution">We could not open this record.</ErrorNote><p style={{ marginTop: 'var(--space-4)' }}><Link to={home} className="btn block">Back to your record</Link></p></main>;
  if (!rec) return <main className="page"><Spinner label="Loading" /></main>;
  const d = rec.document;

  return (
    <main className="page" data-testid="record-view">
      {saved && <div className="saved" role="status" data-testid="saved">Saved to your record.</div>}
      <p><Link to={home} className="back">Back to your record</Link></p>
      <h1>{KIND_LABEL[d.kind]}</h1>
      <p className="muted" data-testid="record-meta">{formatDate(d.exam_date)}{d.issuer ? `, ${d.issuer}` : ''}</p>
      <div className="mark-row">
        <ProvenanceMark kind={d.provenance === 'verified_by_source' ? 'verified' : 'uploaded'} />
        {d.identity_status === 'name_only' && <ProvenanceMark kind="name-match" />}
      </div>

      {rec.results.length > 0 && <h2 style={{ marginTop: 'var(--space-6)' }}>Results</h2>}
      <ul className="rows">
        {rec.results.map((r) => {
          const range = printedRange(r);
          return (
            <li key={r.id} className="rrow" data-testid="result">
              <div className="rname">{r.analyte}</div>
              <div className="rvalue" data-testid="result-value">{valueString(r)}{r.unit ? ` ${r.unit}` : ''}</div>
              <div className="rmeta">
                {range && <span className="muted">Printed range: {range}</span>}
                {isOutOfRange(r) && <OutOfRange r={r} />}
                {r.edited_by_patient && <ProvenanceMark kind="edited" />}
              </div>
            </li>
          );
        })}
      </ul>

      {rec.findings.length > 0 && <h2 style={{ marginTop: 'var(--space-6)' }}>Written in the exam</h2>}
      <ul className="rows">
        {rec.findings.map((f) => (
          <li key={f.id} className="rrow" data-testid="finding">
            <div className="rname">{formatDate(f.finding_date)}</div>
            <p lang={f.text_lang ?? undefined} style={{ margin: 0 }}>{f.text_original}</p>
            {f.edited_by_patient && <div className="rmeta"><ProvenanceMark kind="edited" /></div>}
          </li>
        ))}
      </ul>

      <p className="fixed-line" data-testid="fixed-line">{FIXED_LINE}</p>

      <h2 style={{ marginTop: 'var(--space-6)' }}>Original photo</h2>
      {photo === null && <Spinner label="Loading the photo" />}
      {photo === 'error' && <p className="muted">The photo could not be loaded.</p>}
      {photo && photo !== 'error' && <img className="orig" src={photo} alt="The original photo of the exam" data-testid="original-photo" />}
    </main>
  );
}
