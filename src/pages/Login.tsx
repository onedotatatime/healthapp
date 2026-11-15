import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router';
import { ApiError } from '../api/call';
import type { DemoPersona } from '../api/contract';
import { useAuth } from '../auth/AuthProvider';
import { homeFor } from '../auth/guard';
import { ErrorNote, Spinner } from '../components/Primitives';
import { envState } from '../lib/env';

/** Demo sign-in. No password is in the bundle: the presenter types the passcode, the server signs the persona in. */
function message(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 401 || e.status === 403) return 'That passcode is not accepted.';
    if (e.status === 429) return 'Too many tries. Wait a minute and try again.';
    if (e.status === 404) return 'Demo sign-in is not available here yet.';
    if (e.status === 0) return e.message;
    return `Sign-in failed (${e.message}).`;
  }
  return 'Sign-in failed.';
}

export function Login() {
  const { state, signInDemo, sessionEnded } = useAuth();
  const [passcode, setPasscode] = useState('');
  const [busy, setBusy] = useState<DemoPersona | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (state.status === 'in') return <Navigate to={homeFor(state.role)} replace />;

  async function go(persona: DemoPersona, e?: FormEvent) {
    e?.preventDefault();
    if (!passcode.trim()) return setError('Enter the demo passcode first.');
    setError(null);
    setBusy(persona);
    try {
      await signInDemo(persona, passcode.trim());
    } catch (err) {
      setError(message(err));
      setBusy(null);
    }
  }

  return (
    <main className="page">
      <div className="signin">
        <img className="lockup" src="/brand/pathien-lockup.svg" alt="Pathien" width={150} height={40} />
        <h1>Sign in to the demo</h1>
        {sessionEnded && (
          <ErrorNote>
            <strong>Your session ended.</strong> Sign in again to continue.
          </ErrorNote>
        )}
        <p className="muted">Synthetic people only. Type the demo passcode, then choose who to sign in as.</p>
        {envState.status === 'error' ? (
          <ErrorNote>{envState.message}</ErrorNote>
        ) : (
          <form onSubmit={(e) => go('patient', e)} noValidate>
            <label className="field">
              <span>Demo passcode</span>
              <input
                type="password"
                name="passcode"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                aria-describedby={error ? 'login-error' : undefined}
              />
            </label>
            <div className="btn-stack">
              <button type="button" className="btn primary block" data-testid="login-patient" disabled={busy !== null} onClick={() => go('patient')}>
                Sign in as the patient
              </button>
              <button type="button" className="btn block" data-testid="login-doctor" disabled={busy !== null} onClick={() => go('doctor')}>
                Sign in as the doctor
              </button>
              {envState.status === 'ok' && envState.env === 'demo' && (
                <button type="button" className="btn block" data-testid="login-founder" disabled={busy !== null} onClick={() => go('founder')}>
                  Sign in as the founder
                </button>
              )}
            </div>
            <div style={{ marginTop: 'var(--space-4)' }} id="login-error">
              {busy && <Spinner label="Signing in" />}
              {error && <ErrorNote>{error}</ErrorNote>}
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
