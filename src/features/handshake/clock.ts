/**
 * Server-clock countdowns (CTO review §3 row 10; contract: every grant answer carries `server_now`).
 * The device clock may be wrong, so a deadline is never compared with `Date.now()` alone: the offset between
 * the server's clock and this device's is taken from every answer, and the deadline is read on the server's clock.
 */

/** server minus device, in ms, from one answer received at `clientNowMs`. Round-trip time is ignored (under a second). */
export function offsetFrom(serverNowIso: string, clientNowMs: number): number {
  const s = Date.parse(serverNowIso);
  return Number.isFinite(s) ? s - clientNowMs : 0;
}

/** Whole seconds left until a server-stamped deadline, never below 0. */
export function secondsLeft(expiresIso: string, offsetMs: number, clientNowMs: number): number {
  const end = Date.parse(expiresIso);
  if (!Number.isFinite(end)) return 0;
  return Math.max(0, Math.ceil((end - (clientNowMs + offsetMs)) / 1000));
}

/** The same deadline on this device's own clock, for parts that read `Date.now()` themselves (AccessTimer). */
export function localDeadlineIso(expiresIso: string, offsetMs: number): string {
  return new Date(Date.parse(expiresIso) - offsetMs).toISOString();
}

/** "1:58" style, for the code countdown. */
export function mmss(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
