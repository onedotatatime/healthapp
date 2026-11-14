/**
 * The one handshake hook (MIN-4485), used by both screens. It keeps the grant `Session` (grant.ts) fed from:
 *  1. Realtime on `grants`: any change is a nudge, answered by one `grant-status` call (which carries `server_now`);
 *  2. a 2 s poll of `grant-status` once the channel has been silent for 3 s (it is silent whenever nothing changes,
 *     so this polls every 2 s while a grant is open; it stops when the grant ends);
 *  3. the answers to claim, decide and revoke, passed in through `accept`.
 * Time: every answer updates the server/device clock offset; the 0.5 s tick closes a grant when ITS countdown reaches 0
 * on the server's clock, without waiting for a poll.
 */
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { ApiError } from '../../api/call';
import type { HandshakeApi } from './api';
import { offsetFrom } from './clock';
import type { GrantEnvelope, GrantStatusResponse } from './contract';
import { initialSession, sessionReducer, type Session } from './grant';

export const SILENT_MS = 3000;
export const POLL_MS = 2000;

export interface GrantFeed {
  session: Session;
  /** server minus device, ms, from the latest answer */
  offsetMs: number;
  /** Device clock, repainted twice a second (drives the visible countdowns). */
  nowMs: number;
  /** Pass the answer of claim, decide or revoke here. */
  accept(env: GrantEnvelope | GrantStatusResponse): void;
  /** Start over (New code, Share again). The grant just closed is ignored from here on. */
  reset(): void;
  /**
   * For the workspace: an RLS read came back empty AFTER data was shown. Calls `grant-status` at once and closes the
   * session unless the server says the grant is still running (CTO review §3 row 10).
   */
  onEmptyRead(): void;
}

export function useGrantSession(api: HandshakeApi, opts: { pollWhenNone: boolean }): GrantFeed {
  const [session, dispatch] = useReducer(sessionReducer, initialSession);
  const [offsetMs, setOffsetMs] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const offsetRef = useRef(0);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const lastSignal = useRef(Date.now());
  const lastPoll = useRef(0);
  const inFlight = useRef(false);
  const pollWhenNone = useRef(opts.pollWhenNone);
  pollWhenNone.current = opts.pollWhenNone;

  const accept = useCallback((env: GrantEnvelope | GrantStatusResponse) => {
    const at = Date.now();
    const off = offsetFrom(env.server_now, at);
    offsetRef.current = off;
    setOffsetMs((prev) => (Math.abs(prev - off) > 250 ? off : prev)); // ignore jitter, keep the countdown steady
    if (env.grant) dispatch({ type: 'grant', grant: env.grant, serverNowMs: at + off });
    else dispatch({ type: 'empty' });
  }, []);

  const poll = useCallback(
    async (closeOnLost = false) => {
      if (inFlight.current) return;
      inFlight.current = true;
      lastPoll.current = Date.now();
      try {
        const s = sessionRef.current;
        accept(await api.status(s.phase === 'none' ? undefined : s.grant.grant_id));
      } catch (e) {
        // `grant_expired` (403): the function refuses once the grant has ended. Closing is the answer.
        if (e instanceof ApiError && (e.code === 'grant_expired' || e.code === 'not_found')) dispatch({ type: 'empty' });
        else if (closeOnLost && e instanceof ApiError && e.status === 403) dispatch({ type: 'empty' });
        // anything else (offline, 5xx): keep what is on screen and try again on the next poll
      } finally {
        inFlight.current = false;
      }
    },
    [api, accept],
  );

  const ended = session.phase === 'ended';

  useEffect(() => {
    if (ended) return;
    void poll(); // resume a grant that already exists (a reload mid-handshake)
    const stop = api.subscribe(() => {
      lastSignal.current = Date.now();
      void poll();
    });
    const id = setInterval(() => {
      const now = Date.now();
      setNowMs(now);
      dispatch({ type: 'tick', serverNowMs: now + offsetRef.current });
      const s = sessionRef.current;
      const wanted = s.phase !== 'none' || pollWhenNone.current;
      if (wanted && now - lastSignal.current >= SILENT_MS && now - lastPoll.current >= POLL_MS) void poll();
    }, 500); // half a second: a poll due at 2 s is never later than 2.5 s, so a change shows within 3 s
    return () => {
      stop();
      clearInterval(id);
    };
  }, [api, poll, ended]);

  const reset = useCallback(() => {
    lastSignal.current = Date.now();
    dispatch({ type: 'reset' });
  }, []);

  const onEmptyRead = useCallback(() => void poll(true), [poll]);

  return useMemo(() => ({ session, offsetMs, nowMs, accept, reset, onEmptyRead }), [session, offsetMs, nowMs, accept, reset, onEmptyRead]);
}
