import { Lock } from '@phosphor-icons/react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ApiError } from '../../api/call';
import type { DocumentDraft } from '../../api/contract';
import { ErrorNote, Spinner } from '../../components/Primitives';
import { ProvenanceMark } from '../../components/ProvenanceMark';
import { useExams } from './context';
import { CheckThis, OutOfRange } from './Marks';
import {
  KIND_LABEL,
  buildConfirm,
  hasErrors,
  initForm,
  isOutOfRange,
  printedRange,
  resultEdited,
  validateForm,
  type ReviewForm,
} from './logic';

/** A2: the fields beside the photo (above it on a phone). Name and ID are read from the exam and cannot change. */
export function ReviewPanel({ draft, photoUrl, backTo, onRetake, onSaved }: { draft: DocumentDraft; photoUrl: string; backTo?: string; onRetake: () => void; onSaved: (docId: string) => void }) {
  const { api } = useExams();
  const [form, setForm] = useState<ReviewForm>(() => initForm(draft));
  const [shown, setShown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errors = validateForm(draft, form);

  async function save(e: FormEvent) {
    e.preventDefault();
    setShown(true);
    if (hasErrors(errors)) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api.confirm(buildConfirm(draft, form));
      onSaved(res.document.id);
    } catch (err) {
      setSaving(false);
      setError(
        err instanceof ApiError && err.status === 0
          ? 'We could not reach the server. Nothing was lost: try saving again.'
          : 'The record was not saved. Try again.',
      );
    }
  }

  return (
    <main className="page wide" data-testid="review">
      {backTo && <p><Link to={backTo} className="back" data-testid="review-back">Back to my exams</Link></p>}
      <h1>Check what we read</h1>
      <p className="muted">Fix anything that is wrong, then save. Until you save it, this exam stays out of your record.</p>
      <div className="review">
        <figure className="photo">
          <img src={photoUrl} alt="Your photo of the exam" />
          <figcaption><a href={photoUrl} target="_blank" rel="noreferrer">Open the photo full size</a></figcaption>
        </figure>

        <form className="fields" onSubmit={save} noValidate>
          <dl className="locked" data-testid="locked-fields">
            <div><dt>Exam type</dt><dd>{KIND_LABEL[draft.document.kind]}</dd></div>
            {draft.document.issuer && <div><dt>Issued by</dt><dd>{draft.document.issuer}</dd></div>}
            <div><dt>Name</dt><dd data-testid="printed-name"><Lock size={16} weight="bold" aria-hidden="true" />{draft.printed_name ?? 'Not read'}</dd></div>
            <div><dt>ID</dt><dd data-testid="printed-id"><Lock size={16} weight="bold" aria-hidden="true" />{draft.printed_id ?? 'Not read'}</dd></div>
          </dl>
          <p className="muted small">Name and ID are read from the exam and can't be changed.</p>

          <label className="field">
            <span>Exam date</span>
            <input type="date" value={form.examDate} data-testid="exam-date" aria-invalid={shown && !!errors.examDate} onChange={(e) => setForm({ ...form, examDate: e.target.value })} />
            {shown && errors.examDate && <em className="err">{errors.examDate}</em>}
          </label>

          {draft.results.length > 0 && <h2>Results</h2>}
          <ul className="rows">
            {draft.results.map((r) => {
              const f = form.results[r.id]!;
              const edited = resultEdited(r, f);
              const range = printedRange(r);
              return (
                <li key={r.id} className="rrow" data-testid="result-row">
                  <div className="rname">{r.analyte} <CheckThis confidence={r.confidence} /></div>
                  <div className="rinputs">
                    <label className="field"><span>Value</span>
                      <input value={f.value} inputMode={r.value_num != null ? 'decimal' : 'text'} data-testid={`value-${r.analyte_key ?? r.id}`} aria-invalid={shown && !!errors.results[r.id]}
                        onChange={(e) => setForm({ ...form, results: { ...form.results, [r.id]: { ...f, value: e.target.value } } })} />
                    </label>
                    <label className="field"><span>Unit</span>
                      <input value={f.unit} data-testid={`unit-${r.analyte_key ?? r.id}`}
                        onChange={(e) => setForm({ ...form, results: { ...form.results, [r.id]: { ...f, unit: e.target.value } } })} />
                    </label>
                  </div>
                  {shown && errors.results[r.id] && <em className="err">{errors.results[r.id]}</em>}
                  <div className="rmeta">
                    {range && <span className="muted">Printed range: {range}</span>}
                    {/* The flag is the server's, computed from the original value: it is not shown on a value the patient has changed. */}
                    {!edited && isOutOfRange(r) && <OutOfRange r={r} />}
                    {edited && <ProvenanceMark kind="edited" />}
                  </div>
                </li>
              );
            })}
          </ul>

          {draft.findings.length > 0 && <h2>Written in the exam</h2>}
          <ul className="rows">
            {draft.findings.map((fd) => (
              <li key={fd.id} className="rrow" data-testid="finding-row">
                <label className="field"><span>{fd.finding_date ? `Finding, ${fd.finding_date}` : 'Finding'} <CheckThis confidence={fd.confidence} /></span>
                  <textarea rows={4} value={form.findings[fd.id]} onChange={(e) => setForm({ ...form, findings: { ...form.findings, [fd.id]: e.target.value } })} />
                </label>
              </li>
            ))}
          </ul>

          {error && <ErrorNote tone="caution">{error}</ErrorNote>}
          <div className="btn-stack">
            <button type="submit" className="btn primary block" disabled={saving} data-testid="save">{saving ? <Spinner label="Saving" /> : 'Save to my record'}</button>
            <button type="button" className="btn block" disabled={saving} onClick={onRetake}>Take another photo</button>
          </div>
        </form>
      </div>
    </main>
  );
}
