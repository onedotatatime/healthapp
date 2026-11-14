import { useCallback, useState, type FormEvent } from 'react';
import { ApiError } from '../../api/call';
import { useAuth } from '../../auth/AuthProvider';
import { ErrorNote, Spinner } from '../../components/Primitives';
import { checkPasscode, lastHandshake, resetDemo, type Unlocked } from './demoApi';
import { clearDoctorOpen, summarize, TARGET_SECONDS, type Handshake } from './timing';

function unlockMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 401 || e.status === 403) return 'That passcode is not accepted.';
    if (e.status === 429) return 'Too many tries. Wait a minute and try again.';
    if (e.status === 0) return e.message;
  }
  return 'The passcode could not be checked. Try again.';
}

function resetMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 404) return 'The reset is not deployed on this server yet (MIN-4514). Nothing was changed.';
    if (e.status === 401 || e.status === 403) return 'The server did not accept the passcode. Nothing was changed.';
    if (e.status === 0) return 'The reset could not be reached: it may not be deployed yet (MIN-4514), or the connection is down. Nothing was changed.';
  }
  return 'The reset failed. Nothing is known to have changed; try again.';
}

const fmt = (iso: string | null) => (iso ? new Date(iso).toISOString().replace('T', ' ').replace('Z', ' UTC') : 'not recorded');
const secs = (n: number | null) => (n === null ? 'n/a' : `${n.toFixed(1)} s`);

/** The demo controls page, linked from nowhere. The presenter types the passcode, resets between runs, and reads the handshake clock. */
export default function DemoPanel() {
  const { signOut } = useAuth();
  const [passcode, setPasscode] = useState('');
  const [unlocked, setUnlocked] = useState<{ u: Unlocked; passcode: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'unlock' | 'reset' | 'refresh' | null>(null);
  const [handshake, setHandshake] = useState<Handshake | null | undefined>(undefined);
  const [done, setDone] = useState<string | null>(null);

  const load = useCallback(async (u: Unlocked) => {
    try {
      setHandshake(await lastHandshake(u));
    } catch {
      setHandshake(undefined);
      setError('The handshake times could not be read. Try Refresh.');
    }
  }, []);

  async function unlock(e: FormEvent) {
    e.preventDefault();
    if (!passcode.trim()) return setError('Enter the demo passcode first.');
    setError(null);
    setBusy('unlock');
    try {
      const u = await checkPasscode(passcode.trim());
      setUnlocked({ u, passcode: passcode.trim() });
      await load(u);
    } catch (err) {
      setError(unlockMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function reset() {
    if (!unlocked) return;
    setError(null);
    setDone(null);
    setBusy('reset');
    try {
      await resetDemo(unlocked.passcode);
      clearDoctorOpen();
      await signOut(); // this browser; the server has ended every grant
      setDone('The demo is reset. Both roles start from the seeded record. Sign in again on each device.');
      setHandshake(null);
    } catch (err) {
      setError(resetMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function refresh() {
    if (!unlocked) return;
    setError(null);
    setBusy('refresh');
    await load(unlocked.u);
    setBusy(null);
  }

  if (!unlocked) {
    return (
      <main className="page" data-testid="demo-gate">
        <h1>Demo controls</h1>
        <form onSubmit={unlock} noValidate>
          <label className="field">
            <span>Demo passcode</span>
            <input type="password" name="passcode" autoComplete="off" autoCapitalize="none" spellCheck={false} value={passcode} onChange={(e) => setPasscode(e.target.value)} />
          </label>
          <div className="btn-stack">
            <button type="submit" className="btn primary block" disabled={busy !== null} data-testid="demo-unlock">
              Unlock
            </button>
          </div>
          <div style={{ marginTop: 'var(--space-4)' }}>
            {busy && <Spinner label="Checking" />}
            {error && <ErrorNote>{error}</ErrorNote>}
          </div>
        </form>
      </main>
    );
  }

  const s = handshake ? summarize(handshake) : null;
  return (
    <main className="page" data-testid="demo-panel">
      <h1>Demo controls</h1>
      <div className="btn-stack">
        <button type="button" className="btn primary block" onClick={() => void reset()} disabled={busy !== null} data-testid="demo-reset">
          Reset the demo
        </button>
      </div>
      <div style={{ marginTop: 'var(--space-4)' }}>
        {busy === 'reset' && <Spinner label="Resetting" />}
        {done && <p data-testid="demo-done">{done}</p>}
        {error && <ErrorNote>{error}</ErrorNote>}
      </div>
      <h2 style={{ marginTop: 'var(--space-5)' }}>Last handshake</h2>
      {handshake === undefined && <p className="muted">Not loaded.</p>}
      {handshake === null && <p className="muted" data-testid="demo-no-handshake">No handshake yet.</p>}
      {handshake && s && (
        <dl data-testid="demo-times">
          <dt>scanned_at</dt>
          <dd data-testid="t-scanned">{fmt(handshake.scanned_at)}</dd>
          <dt>approved_at</dt>
          <dd data-testid="t-approved">
            {fmt(handshake.approved_at)} ({secs(s.scannedToApproved)} after scan)
          </dd>
          <dt>doctor_open_at</dt>
          <dd data-testid="t-open">
            {fmt(handshake.doctor_open_at)} ({secs(s.approvedToOpen)} after approve)
          </dd>
          <dt>Scan to doctor open</dt>
          <dd data-testid="t-total">
            {secs(s.scannedToOpen)} (target {TARGET_SECONDS} s{s.withinTarget === null ? '' : s.withinTarget ? ', met' : ', missed'})
          </dd>
        </dl>
      )}
      <p className="muted" style={{ fontSize: 13 }}>
        doctor_open_at is recorded in the browser the doctor used. Open this page there to read it.
      </p>
      <div className="btn-stack">
        <button type="button" className="btn block" onClick={() => void refresh()} disabled={busy !== null} data-testid="demo-refresh">
          Refresh
        </button>
      </div>
    </main>
  );
}
