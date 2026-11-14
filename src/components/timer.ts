export type TimerState = 'running' | 'soon' | 'ended';
export const SOON_SECONDS = 120;

/** Remaining whole seconds, from the grant's own `expires_at` (CTO item 10), never below 0. */
export function remainingSeconds(expiresAtMs: number, nowMs: number): number {
  return Math.max(0, Math.ceil((expiresAtMs - nowMs) / 1000));
}

export function timerState(remaining: number): TimerState {
  if (remaining <= 0) return 'ended';
  return remaining < SOON_SECONDS ? 'soon' : 'running';
}

export function formatMmSs(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Share of the track still filled, 0..1. The fill shrinks left to right. */
export function trackFraction(remaining: number, totalSeconds: number): number {
  if (totalSeconds <= 0) return 0;
  return Math.min(1, Math.max(0, remaining / totalSeconds));
}

export function announcement(state: TimerState, remaining: number, totalSeconds: number): string {
  if (state === 'ended') return 'Access ended';
  if (state === 'soon') return `Access ends in ${Math.ceil(remaining / 60)} minutes`;
  return `Access started, ${Math.round(totalSeconds / 60)} minutes`;
}
