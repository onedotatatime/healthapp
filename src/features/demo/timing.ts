/**
 * The handshake clock the demo panel shows (PRD 12.4, M7: the 15-second target is read from timestamps, not a stopwatch).
 * `scanned_at` is the grant row's `requested_at` (the doctor's claim creates it) and `approved_at` is the row's own column.
 * The server records no "doctor opened the workspace" moment yet (the access log is P1), so the doctor's screen writes
 * `doctor_open_at` into this browser (server clock, estimated from the answers it already gets). Read it on the same
 * browser the doctor used; MIN-4515 notes the interim.
 */
export const TARGET_SECONDS = 15;
const KEY = 'healthapp-demo-doctor-open';

export interface Handshake {
  grant_id: string;
  scanned_at: string;
  approved_at: string | null;
  doctor_open_at: string | null;
}

/** Whole seconds with one decimal, or null when either end is missing. Never negative (clock jitter reads as 0). */
export function secondsBetween(from: string | null, to: string | null): number | null {
  if (!from || !to) return null;
  const a = Date.parse(from);
  const b = Date.parse(to);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.max(0, Math.round((b - a) / 100) / 10);
}

export function summarize(h: Handshake) {
  const approve = secondsBetween(h.scanned_at, h.approved_at);
  const open = secondsBetween(h.approved_at, h.doctor_open_at);
  const total = secondsBetween(h.scanned_at, h.doctor_open_at);
  return { scannedToApproved: approve, approvedToOpen: open, scannedToOpen: total, withinTarget: total === null ? null : total <= TARGET_SECONDS };
}

/** Doctor side: first call per grant wins. Storage can be blocked (private mode): then the panel just shows "not recorded". */
export function recordDoctorOpen(grantId: string, serverNowMs: number): void {
  try {
    const old = JSON.parse(localStorage.getItem(KEY) ?? 'null') as { grant_id?: string } | null;
    if (old?.grant_id === grantId) return;
    localStorage.setItem(KEY, JSON.stringify({ grant_id: grantId, at: new Date(serverNowMs).toISOString() }));
  } catch {
    /* ignore */
  }
}

export function readDoctorOpen(grantId: string): string | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as { grant_id?: string; at?: string } | null;
    return v?.grant_id === grantId && typeof v.at === 'string' ? v.at : null;
  } catch {
    return null;
  }
}

export function clearDoctorOpen(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
