import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { AccessTimer } from '../../components/AccessTimer';
import { ErrorNote, Spinner } from '../../components/Primitives';
import { formatShortCode } from './codes';
import { localDeadlineIso, mmss, offsetFrom, secondsLeft } from './clock';
import { qrText, type GrantEnvelope, type HandshakeCreateResponse } from './contract';
import { useHandshake } from './context';
import { askingLine, grantSeconds, patientEnded, whoLine } from './messages';
import { QrCard } from './QrCard';
import { useGrantSession } from './useGrantSession';
import { useWidth } from './useWidth';
import './handshake.css';

interface Code {
  data: HandshakeCreateResponse;
  /** server minus device clock when the code was issued */
  offsetMs: number;
}

/** Patient: share with a doctor. One screen, five states: code, asking, running, ended (declined, expired, ended). */
export function PatientShare() {
  const { api, home } = useHandshake();
  const feed = useGrantSession(api, { pollWhenNone: true });
  const { session } = feed;

  const [code, setCode] = useState<Code | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [helix, setHelix] = useState(() => new URLSearchParams(location.search).get('helix') !== '0');
  const making = useRef(false);

  const newCode = useCallback(async () => {
    if (making.current) return;
    making.current = true;
    setCodeError(null);
    try {
      const data = await api.create();
      setCode({ data, offsetMs: offsetFrom(data.server_now, Date.now()) });
    } catch {
      setCodeError('Could not make a code. Check the connection and try again.');
    } finally {
      making.current = false;
    }
  }, [api]);

  // A code is made when the screen opens and whenever it is shown again. Once a doctor has used it, nothing is made.
  useEffect(() => {
    if (session.phase === 'none' && !code) void newCode();
  }, [session.phase, code, newCode]);

  const shareAgain = () => {
    feed.reset();
    setCode(null);
  };

  if (session.phase === 'none') {
    return <CodeScene code={code} error={codeError} nowMs={feed.nowMs} helix={helix} onHelix={() => setHelix((h) => !h)} onNew={() => void newCode()} home={home} />;
  }
  if (session.phase === 'pending') return <Asking feed={feed} />;
  if (session.phase === 'active') return <Running feed={feed} />;
  const { title, body } = patientEnded(session.reason, session.grant);
  return (
    <main className="page hs-ended" data-testid="share-ended" data-reason={session.reason}>
      <div className="card">
        <h1>{title}</h1>
        <p>{body}</p>
        <div className="btn-stack">
          <button type="button" className="btn primary block" onClick={shareAgain} data-testid="share-again">
            Share again
          </button>
          <Link className="btn block" to={home}>
            Back to your record
          </Link>
        </div>
      </div>
    </main>
  );
}

function CodeScene({ code, error, nowMs, helix, onHelix, onNew, home }: { code: Code | null; error: string | null; nowMs: number; helix: boolean; onHelix(): void; onNew(): void; home: string }) {
  const ref = useRef<HTMLElement>(null);
  const width = useWidth(ref);
  const left = code ? secondsLeft(code.data.expires_at, code.offsetMs, nowMs) : 0;
  const expired = code !== null && left === 0;
  const origin = typeof location === 'undefined' ? '' : location.origin;
  return (
    <main className="hs-night" ref={ref} data-testid="share-scene">
      <h1 className="hs-title">Share with a doctor</h1>
      {error && (
        <div className="hs-error">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}
      {!code && !error && (
        <p className="hs-wait">
          <Spinner label="Making a code" />
        </p>
      )}
      {code && (
        <>
          <QrCard text={qrText(origin, code.data.token)} available={Math.min(width - 32, 358)} helix={helix} expired={expired} secondsLeft={left} />
          <p className="hs-valid" data-testid="share-valid" data-expired={expired}>
            {expired ? 'Code expired' : `Code valid for ${mmss(left)}`}
          </p>
          <p className="hs-code mono" data-testid="share-short-code" aria-label={`Typed code ${formatShortCode(code.data.short_code).split('').join(' ')}`}>
            {formatShortCode(code.data.short_code).replace(' ', ' ')}
          </p>
        </>
      )}
      <div className="hs-actions">
        <button type="button" className="btn hs-btn" onClick={onNew} data-testid="share-new-code">
          New code
        </button>
        <button type="button" className="hs-link" onClick={onHelix} data-testid="share-helix-toggle" aria-pressed={!helix}>
          {helix ? 'Hide the helix' : 'Show the helix'}
        </button>
        <Link className="hs-link" to={home}>
          Back
        </Link>
      </div>
      <p className="hs-hint">Turn the screen brightness up so the doctor's camera can read the code.</p>
    </main>
  );
}

type Feed = ReturnType<typeof useGrantSession>;

/** Run an action that answers with a grant envelope; on failure show a note and let the person tap again. */
function useAct(feed: Feed) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const act = async (fn: () => Promise<GrantEnvelope>, failure: string) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      feed.accept(await fn());
    } catch {
      setError(failure);
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, act };
}

function Asking({ feed }: { feed: Feed }) {
  const { api } = useHandshake();
  const { busy, error, act } = useAct(feed);
  if (feed.session.phase !== 'pending') return null;
  const g = feed.session.grant;
  const lapse = g.expires_at ? secondsLeft(g.expires_at, feed.offsetMs, feed.nowMs) : null;
  return (
    <>
      <div className="sheet-scrim" aria-hidden="true" />
      <main className="sheet" data-testid="share-asking">
        <h1>{askingLine(g.doctor)} is asking</h1>
        <p>They want to see your record. Nothing is shared until you approve.</p>
        <div className="btn-stack">
          <button type="button" className="btn primary block" disabled={busy} onClick={() => void act(() => api.decide(g.grant_id, true), 'Could not approve. Try again.')} data-testid="ask-approve">
            Approve
          </button>
          <button type="button" className="btn block" disabled={busy} onClick={() => void act(() => api.decide(g.grant_id, false), 'Could not decline. Try again.')} data-testid="ask-decline">
            Decline
          </button>
        </div>
        {lapse !== null && <p className="muted" style={{ marginTop: 'var(--space-4)' }}>The request ends in {mmss(lapse)}.</p>}
        {error && <ErrorNote>{error}</ErrorNote>}
      </main>
    </>
  );
}

function Running({ feed }: { feed: Feed }) {
  const { api } = useHandshake();
  const { busy, error, act } = useAct(feed);
  if (feed.session.phase !== 'active' || !feed.session.grant.expires_at) return null;
  const g = feed.session.grant;
  return (
    <div data-testid="share-running">
      <AccessTimer
        surface="patient"
        label={whoLine(g.doctor)}
        expiresAt={localDeadlineIso(g.expires_at!, feed.offsetMs)}
        totalSeconds={grantSeconds(g)}
        onEndAccess={busy ? undefined : () => void act(() => api.revoke(g.grant_id), 'Could not end access. Tap End access again.')}
      />
      <main className="page">
        <div className="card">
          <h1>{g.doctor.full_name} can see your record</h1>
          <p className="muted">Access ends by itself when the timer reaches zero, or as soon as you tap End access.</p>
          {error && <ErrorNote>{error}</ErrorNote>}
        </div>
      </main>
    </div>
  );
}
