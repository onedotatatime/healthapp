import { QrCode } from '@phosphor-icons/react';
import { Link, Navigate, useLocation } from 'react-router';
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

/** The second tile on the patient home. The same link and test id the entry bar had (MIN-4587). */
export function ShareTile() {
  return (
    <Link className="tile" to="/patient/share" data-testid="entry-link">
      <QrCode size={26} weight="bold" aria-hidden="true" />
      Share with a doctor
    </Link>
  );
}

/** A glass bar floating at the bottom of the doctor home: the one big action. On the patient home the same link is a tile at
 *  the top of the screen, so the bar renders nothing there and the page keeps one `entry-link`. */
export function EntryBar({ to, label }: { to: string; label: string }) {
  const { pathname } = useLocation();
  if (to === '/patient/share' && pathname === '/patient') return null;
  return (
    <div className="hs-entry">
      <Link className="btn primary block" to={to} data-testid="entry-link">
        {label}
      </Link>
    </div>
  );
}
