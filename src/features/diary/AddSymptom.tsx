import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ErrorNote } from '../../components/Primitives';
import { addDiaryEntry } from './diaryApi';
import { formatWhen, isTimeEdited, toLocalInput } from './format';

/** Patient-side diary entry (C1, C2). No assistant, no AI box: a plain form (PRD 10.6). Wording: PRD 13.4. */
export function AddSymptom() {
  const defaultTime = useMemo(() => toLocalInput(new Date()), []);
  const [text, setText] = useState('');
  const [severity, setSeverity] = useState(5);
  const [when, setWhen] = useState(defaultTime);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const edited = isTimeEdited(when, defaultTime);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const iso = new Date(when).toISOString();
      await addDiaryEntry({ text: text.trim(), severity, occurred_at: iso, time_edited: edited });
      setSavedAt(iso);
    } catch {
      setError('This entry was not saved. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  if (savedAt) {
    return (
      <main className="page" data-testid="diary-saved">
        <h1>Saved for your doctor. {formatWhen(savedAt)}</h1>
        <p className="muted" data-testid="emergency-line">In an emergency, call 112 or your local emergency number.</p>
        <div className="btn-stack" style={{ marginTop: 'var(--space-6)' }}>
          <Link className="btn primary block" to="/patient">Back to your record</Link>
          <button type="button" className="btn block" data-testid="add-another" onClick={() => { setSavedAt(null); setText(''); }}>
            Add another
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="page" data-testid="diary-form">
      <h1>Add symptom</h1>
      <form onSubmit={submit} className="btn-stack">
        <label className="field">
          <span>What are you feeling?</span>
          <input data-testid="diary-text" value={text} onChange={(e) => setText(e.target.value)} maxLength={500} autoFocus />
        </label>
        <label className="field">
          <span>How strong, 1 to 10: {severity}</span>
          <input data-testid="diary-severity" type="range" min={1} max={10} step={1} value={severity} onChange={(e) => setSeverity(Number(e.target.value))} />
        </label>
        <label className="field">
          <span>When{edited ? ' (changed)' : ''}</span>
          <input data-testid="diary-time" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value || defaultTime)} />
        </label>
        {error && <ErrorNote>{error}</ErrorNote>}
        <button type="submit" className="btn primary block" data-testid="diary-save" disabled={busy || !text.trim()}>
          {busy ? 'Saving' : 'Save'}
        </button>
        <p className="muted" data-testid="emergency-line">In an emergency, call 112 or your local emergency number.</p>
        <Link to="/patient" className="muted">Cancel</Link>
      </form>
    </main>
  );
}
