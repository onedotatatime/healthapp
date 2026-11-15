import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { AccessTimer } from '../../components/AccessTimer';
import { ErrorNote, Spinner } from '../../components/Primitives';
import { recordDoctorOpen } from '../demo/timing';
import { claimErrorMessage } from './api';
import { localDeadlineIso, mmss, secondsLeft } from './clock';
import { parseShortCode, typedCode } from './codes';
import type { HandshakeClaimRequest } from './contract';
import { ActiveGrantContext, useHandshake } from './context';
import { grantSeconds, doctorEnded, whoLine } from './messages';
import { Scanner } from './Scanner';
import { useGrantSession } from './useGrantSession';
import './handshake.css';

/** The doctor's overview and assistant (MIN-4488). Lazy on purpose: the patient bundle must not contain it (PRD 12.6, checked over the build). */
const AssistantWorkspace = lazy(() => import('../assistant/AssistantWorkspace'));

/** A scanned link (`/s#hs1.<token>`) lands here through sessionStorage: the token never goes in a URL path or query. */
export const PENDING_TOKEN_KEY = 'healthapp-pending-token';

/** Doctor: scan or type a code, wait for the patient, open the workspace, close it when access ends. */
export function DoctorConnect() {
  const { api, home } = useHandshake();
  const feed = useGrantSession(api, { pollWhenNone: false });
  const { session } = feed;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const claiming = useRef(false);

  const claim = useCallback(
    async (input: HandshakeClaimRequest) => {
      if (claiming.current) return;
      claiming.current = true;
      setBusy(true);
      setError(null);
      try {
        feed.accept(await api.claim(input));
      } catch (e) {
        setError(claimErrorMessage(e));
      } finally {
        claiming.current = false;
        setBusy(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [api, feed.accept],
  );

  // A link opened from the patient's phone (or a pasted one): the token waits in sessionStorage until this screen is open.
  useEffect(() => {
    const t = sessionStorage.getItem(PENDING_TOKEN_KEY);
    if (t) {
      sessionStorage.removeItem(PENDING_TOKEN_KEY);
      void claim({ token: t } as HandshakeClaimRequest);
    }
  }, [claim]);

  if (session.phase === 'none') {
    return <Connect busy={busy} error={error} onToken={(token) => void claim({ token } as HandshakeClaimRequest)} onCode={(short_code) => void claim({ short_code } as HandshakeClaimRequest)} home={home} />;
  }
  if (session.phase === 'pending') {
    const g = session.grant;
    const lapse = g.expires_at ? secondsLeft(g.expires_at, feed.offsetMs, feed.nowMs) : null;
    return (
      <main className="page doctor" data-testid="doctor-waiting">
        <h1>Waiting for {g.patient.full_name}</h1>
        <p>
          <Spinner label="They are being asked to approve" />
        </p>
        {lapse !== null && <p className="muted">The request ends in {mmss(lapse)}.</p>}
      </main>
    );
  }
  if (session.phase === 'active') {
    return <DoctorWorkspace feed={feed} />;
  }
  const { title, body } = doctorEnded(session.reason, session.grant);
  return (
    <div data-testid="doctor-ended" data-reason={session.reason}>
      {/* The timer bar says "Access ended"; the workspace is gone from the DOM, not blurred (Pix, section 4). */}
      {session.reason !== 'refused' && session.grant.approved_at && <AccessTimer surface="doctor" expiresAt={new Date(0).toISOString()} totalSeconds={900} />}
      <main className="page doctor">
        <h1>{title}</h1>
        <p>{body}</p>
        <div className="btn-stack hs-doctor-actions">
          <button type="button" className="btn primary" onClick={feed.reset} data-testid="doctor-again">
            Connect to another patient
          </button>
          <Link className="btn" to={home}>
            Back
          </Link>
        </div>
      </main>
    </div>
  );
}

function Connect({ busy, error, onToken, onCode, home }: { busy: boolean; error: string | null; onToken(t: string): void; onCode(c: string): void; home: string }) {
  const [typed, setTyped] = useState('');
  const [typedError, setTypedError] = useState<string | null>(null);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const c = parseShortCode(typed);
    if (!c) return setTypedError('The code has 8 letters and numbers, for example K7MQ 4RXD.');
    setTypedError(null);
    onCode(c);
  };
  return (
    <main className="page doctor hs-connect" data-testid="doctor-connect">
      <h1>Connect to a patient</h1>
      <p className="muted">Scan the code on the patient's phone, or type it.</p>
      <Scanner active={!busy} onToken={onToken} />
      <form onSubmit={submit} className="hs-typed">
        <label className="field">
          <span>Or type the code</span>
          <input value={typed} onChange={(e) => setTyped(typedCode(e.target.value))} inputMode="text" autoCapitalize="characters" autoComplete="off" spellCheck={false} placeholder="K7MQ 4RXD" aria-describedby="typed-help" data-testid="scan-typed-input" className="mono" />
        </label>
        <button type="submit" className="btn primary" disabled={busy || typed.replace(' ', '').length < 8} data-testid="scan-submit">
          {busy ? 'Checking' : 'Connect'}
        </button>
      </form>
      <p id="typed-help" className="muted" style={{ fontSize: 13 }}>The code works once and lasts two minutes.</p>
      {(error || typedError) && <ErrorNote>{error ?? typedError}</ErrorNote>}
      <p>
        <Link to={home} className="back">Back</Link>
      </p>
    </main>
  );
}

/**
 * The workspace shell, open while the grant runs. It holds the overview and the ask box (MIN-4488, lazy), or `children`
 * when a caller passes its own (tests). Whatever it shows is removed when access ends (the whole
 * component unmounts), and a read that comes back empty after data calls `useActiveGrant().onEmptyRead()`.
 */
export function DoctorWorkspace({ feed, children }: { feed: ReturnType<typeof useGrantSession>; children?: React.ReactNode }) {
  const grantId = feed.session.phase === 'active' ? feed.session.grant.grant_id : null;
  const offsetMs = feed.offsetMs;
  // The demo panel reads this to show the scan-to-open time (the server logs no such moment yet).
  useEffect(() => {
    if (grantId) recordDoctorOpen(grantId, Date.now() + offsetMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grantId]);
  if (feed.session.phase !== 'active' || !feed.session.grant.expires_at) return null;
  const g = feed.session.grant;
  return (
    <ActiveGrantContext.Provider value={{ grant: g, onEmptyRead: feed.onEmptyRead }}>
      <div data-testid="doctor-workspace">
        <AccessTimer surface="doctor" expiresAt={localDeadlineIso(g.expires_at!, feed.offsetMs)} totalSeconds={grantSeconds(g)} />
        <main className="page doctor dash">
          <h1>{whoLine(g.patient)}</h1>
          {children ?? (
            <Suspense fallback={<Spinner label="Loading the record" />}>
              <AssistantWorkspace />
            </Suspense>
          )}
        </main>
      </div>
    </ActiveGrantContext.Provider>
  );
}
