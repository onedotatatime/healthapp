/**
 * F1 (MIN-4507): the patient's possible-matches switch. Off by default (the database default). The state shown is
 * what the server holds: a change is applied only after `healthapp_set_matches_opt_in` answers, and on a failure the
 * switch stays where it was and says so.
 */
import { useEffect, useState } from 'react';
import { ErrorNote, Spinner } from '../../components/Primitives';
import { useMatchesApi } from './context';
import { COPY } from './copy';
import './matches.css';

type Load = { status: 'loading' } | { status: 'error' } | { status: 'ready'; on: boolean };

export function MatchesOptIn({ onChange }: { onChange?: (on: boolean) => void }) {
  const api = useMatchesApi();
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    api.getOptIn().then(
      (on) => alive && setLoad({ status: 'ready', on }),
      () => alive && setLoad({ status: 'error' }),
    );
    return () => {
      alive = false;
    };
  }, [api]);

  async function flip() {
    if (load.status !== 'ready' || saving) return;
    setSaving(true);
    setFailed(false);
    try {
      const on = await api.setOptIn(!load.on);
      setLoad({ status: 'ready', on });
      onChange?.(on);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }

  const on = load.status === 'ready' && load.on;
  return (
    <section className="mx-optin" aria-labelledby="mx-optin-title" data-testid="matches-optin">
      <h2 id="mx-optin-title">{COPY.optInTitle}</h2>
      <p>{COPY.optInBody}</p>
      {load.status === 'loading' && <p><Spinner label={COPY.optInLoading} /></p>}
      {load.status === 'error' && <ErrorNote tone="caution">{COPY.optInReadError}</ErrorNote>}
      {load.status === 'ready' && (
        <div className="mx-switch-row">
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-labelledby="mx-switch-label"
            className="mx-switch"
            disabled={saving}
            onClick={() => void flip()}
            data-testid="matches-switch"
          >
            <span className="mx-knob" aria-hidden="true" />
          </button>
          <span id="mx-switch-label" className="mx-switch-label">{COPY.optInSwitch}: <strong data-testid="matches-switch-state">{on ? COPY.optInOn : COPY.optInOff}</strong></span>
        </div>
      )}
      <p className="muted small">{COPY.optInTag}</p>
      {failed && <ErrorNote tone="caution">{COPY.optInError}</ErrorNote>}
    </section>
  );
}
