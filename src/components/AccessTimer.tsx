import { useEffect, useRef, useState } from 'react';
import { announcement, formatMmSs, remainingSeconds, timerState, trackFraction } from './timer';

interface Props {
  /** The grant's `expires_at`, as an ISO string. */
  expiresAt: string;
  /** Grant length in seconds, for the track. */
  totalSeconds: number;
  surface: 'patient' | 'doctor';
  /** Patient: who has access. Doctor: leave empty, "Access ends hh:mm" is used. */
  label?: string;
  /** Patient surface only: shows the End access button. */
  onEndAccess?: () => void;
  onEnded?: () => void;
  /** For the review page and tests: freezes the clock. */
  nowMs?: number;
}

function clock(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/** Sticky bar at the top of both surfaces. Time comes from `expiresAt`; a ticking `Date.now()` only repaints it. */
export function AccessTimer({ expiresAt, totalSeconds, surface, label, onEndAccess, onEnded, nowMs }: Props) {
  const expiresMs = Date.parse(expiresAt);
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    if (nowMs !== undefined) return;
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [nowMs]);
  const now = nowMs ?? tick;
  const remaining = remainingSeconds(expiresMs, now);
  const state = timerState(remaining);

  const [said, setSaid] = useState(announcement(state, remaining, totalSeconds));
  const last = useRef(state);
  useEffect(() => {
    if (last.current !== state) {
      last.current = state;
      setSaid(announcement(state, remaining, totalSeconds));
    }
  }, [state, remaining, totalSeconds]);

  const endedFired = useRef(false);
  useEffect(() => {
    if (state === 'ended' && !endedFired.current) {
      endedFired.current = true;
      onEnded?.();
    }
  }, [state, onEnded]);

  const baseLabel = state === 'ended' ? 'Access ended' : (label ?? `Access ends ${clock(expiresMs)}`);
  return (
    <div className={`timer ${surface} ${state}`} data-testid="access-timer" data-state={state}>
      <div className="timer-row">
        <span className="timer-label">{baseLabel}</span>
        {state !== 'ended' && (
          <span className="timer-right">
            <span className="timer-time" role="timer" aria-live="off">
              {state === 'soon' && 'ending soon '}
              {formatMmSs(remaining)}
            </span>
            {surface === 'patient' && onEndAccess && (
              <button type="button" className="btn" onClick={onEndAccess}>
                End access
              </button>
            )}
          </span>
        )}
      </div>
      <div className="timer-track" aria-hidden="true">
        {state !== 'ended' && <div className="timer-fill" style={{ width: `${trackFraction(remaining, totalSeconds) * 100}%` }} />}
      </div>
      <span className="sr-only" aria-live="polite">
        {said}
      </span>
    </div>
  );
}
