import { Link, Navigate } from 'react-router';
import { extractToken } from './codes';
import { PENDING_TOKEN_KEY } from './DoctorConnect';
import './handshake.css';

/**
 * `/s#hs1.<token>`: the page a phone camera opens from the QR. The token is in the fragment, so it never reaches the
 * server or a log. It is moved to sessionStorage, the redirect replaces the address (fragment included), and the doctor goes to
 * the connect screen (signing in first if needed; `RequireRole` there handles that and the token waits).
 */
export function ClaimLink() {
  const token = extractToken(location.hash);
  // Idempotent, and done before the redirect so the connect screen finds it. The redirect replaces the URL, fragment included.
  if (token) sessionStorage.setItem(PENDING_TOKEN_KEY, token);
  if (!token) {
    return (
      <main className="page">
        <h1>This link has no code</h1>
        <p>Ask the patient to show their code again, then scan it.</p>
        <Link to="/">Back</Link>
      </main>
    );
  }
  return <Navigate to="/doctor/connect" replace />;
}

/** A bar fixed to the bottom of a home screen: the one big action. */
export function EntryBar({ to, label }: { to: string; label: string }) {
  return (
    <div className="hs-entry">
      <Link className="btn primary block" to={to} data-testid="entry-link">
        {label}
      </Link>
    </div>
  );
}
