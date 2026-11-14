import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router';
import { ErrorNote, Spinner } from '../../components/Primitives';
import { ProvenanceMark } from '../../components/ProvenanceMark';
import { PatientScreen } from '../../components/Shell';
import { useExams } from './context';
import { OutOfRange } from './Marks';
import { FIXED_LINE, docMarks, KIND_LABEL, formatDate, isOutOfRange, printedRange, valueString, type RecordFull } from './logic';

/** A saved record: its values, the out-of-range marks, the findings in the document's own words, and the original photo. */
export function RecordView() {
  const { api, base, home } = useExams();
  const nav = useNavigate();
  const { id = '' } = useParams();
  const saved = (useLocation().state as { saved?: boolean } | null)?.saved === true;
  const [rec, setRec] = useState<RecordFull | null>(null);
  const [failed, setFailed] = useState(false);
  const [photo, setPhoto] = useState<string | 'error' | null>(null);
  const [unconfirming, setUnconfirming] = useState(false);
  const [unconfirmError, setUnconfirmError] = useState(false);

  useEffect(() => {
    let live = true;
    void api.openExam(id); // opening clears the "not checked" mark, on the server
    api.getRecord(id).then((r) => live && setRec(r), () => live && setFailed(true));
    api.photoUrl(id).then((u) => live && setPhoto(u), () => live && setPhoto('error'));
    return () => { live = false; };
  }, [api, id]);

  if (failed) return <PatientScreen back={home}><ErrorNote tone="caution">We could not open this record.</ErrorNote><p style={{ marginTop: 'var(--space-4)' }}><Link to={home} className="btn block">Back to your record</Link></p></PatientScreen>;
  if (!rec) return <PatientScreen back={home}><Spinner label="Loading" /></PatientScreen>;
  const d = rec.document;
  if (d.status === 'draft') return <Navigate to={`${base}/${id}/review`} replace />;

  async function unconfirm() {
    setUnconfirming(true);
    setUnconfirmError(false);
    try {
      await api.unconfirm(id);
      nav(`${base}/${id}/review`);
    } catch {
      setUnconfirming(false);
      setUnconfirmError(true);
    }
  }

  return (
    <PatientScreen back={home} className="wide" data-testid="record-view">
      {saved && <div className="saved" role="status" data-testid="saved">Saved to your record.</div>}
      <p><Link to={home} className="back">Back to your record</Link></p>
      <h1>{KIND_LABEL[d.kind]}</h1>
      <p className="muted" data-testid="record-meta">{formatDate(d.exam_date)}{d.issuer ? `, ${d.issuer}` : ''}</p>
      <div className="mark-row">
        {docMarks(d).map((k) => <ProvenanceMark key={k} kind={k} />)}
      </div>

      <div className="review">
      <figure className="photo">
        {photo === null && <Spinner label="Loading the photo" />}
        {photo === 'error' && <p className="muted">The photo could not be loaded.</p>}
        {photo && photo !== 'error' && <img src={photo} alt="The original photo of the exam" data-testid="original-photo" />}
      </figure>
      <div className="fields">
      <p className="muted small" data-testid="readonly-note">Saved to your record. To change a value, unconfirm it, fix it, and save it again.</p>
      {rec.results.length > 0 && <h2>Results</h2>}
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

      {rec.findings.length > 0 && <h2 style={{ marginTop: 'var(--space-5)' }}>Written in the exam</h2>}
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

      {unconfirmError && <ErrorNote tone="caution">It was not unconfirmed. Try again.</ErrorNote>}
      <div className="btn-stack" style={{ marginTop: 'var(--space-4)' }}>
        <button type="button" className="btn block" disabled={unconfirming} onClick={() => void unconfirm()} data-testid="unconfirm">{unconfirming ? 'Unconfirming' : 'Unconfirm'}</button>
      </div>
      <p className="muted small">Unconfirmed, this exam leaves your doctor's view until you save it again.</p>
      </div>
      </div>
    </PatientScreen>
  );
}
