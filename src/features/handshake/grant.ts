/**
 * The grant session as one pure reducer, shared by the patient screen and the doctor screen (MIN-4485).
 * Events come from three places that may repeat, arrive late or arrive out of order: Realtime, the 2 s poll of
 * `grant-status`, and the answers to claim, decide and revoke. The rules that make that safe:
 *  - a state only moves forward: pending < active < ended (ended is final for that grant);
 *  - an older grant never replaces a newer one, and nothing at or before `since` comes back after a reset;
 *  - a repeated event returns the SAME state object, so React does not repaint;
 *  - the clock never lives here: callers pass `serverNowMs` (see clock.ts), so every transition is testable.
 */
import type { GrantView } from './contract';

export type EndReason = 'refused' | 'expired' | 'revoked';

export type Session =
  | { phase: 'none'; since: number }
  | { phase: 'pending'; grant: GrantView; since: number }
  | { phase: 'active'; grant: GrantView; since: number }
  | { phase: 'ended'; reason: EndReason; grant: GrantView; since: number };

export type SessionEvent =
  | { type: 'grant'; grant: GrantView; serverNowMs: number }
  /** grant-status answered with no grant, or a read under RLS came back empty after data was shown. */
  | { type: 'empty' }
  | { type: 'tick'; serverNowMs: number }
  /** Start over (New code, Share again). Anything about the grant just ended is ignored from here on. */
  | { type: 'reset' };

export const initialSession: Session = { phase: 'none', since: 0 };

const requestedMs = (g: GrantView) => Date.parse(g.requested_at);

function rank(s: Session): number {
  return s.phase === 'none' ? -1 : s.phase === 'pending' ? 0 : s.phase === 'active' ? 1 : 2;
}

/** What the server says a grant is, as a session phase. */
function fromGrant(grant: GrantView, since: number): Session {
  switch (grant.status) {
    case 'pending':
      return { phase: 'pending', grant, since };
    case 'active':
      return { phase: 'active', grant, since };
    case 'refused':
    case 'expired':
    case 'revoked':
      return { phase: 'ended', reason: grant.status, grant, since };
  }
}

/** The countdown reaching 0 closes a pending request (it lapses) or a running grant, without waiting for the server. */
function endIfDue(s: Session, serverNowMs: number): Session {
  if ((s.phase === 'pending' || s.phase === 'active') && s.grant.expires_at !== null) {
    if (serverNowMs >= Date.parse(s.grant.expires_at)) return { phase: 'ended', reason: 'expired', grant: s.grant, since: s.since };
  }
  return s;
}

function sameGrant(a: GrantView, b: GrantView): boolean {
  return a.grant_id === b.grant_id && a.status === b.status && a.expires_at === b.expires_at && a.approved_at === b.approved_at && a.revoked_at === b.revoked_at;
}

export function sessionReducer(s: Session, e: SessionEvent): Session {
  switch (e.type) {
    case 'reset':
      return s.phase === 'none' ? s : { phase: 'none', since: Math.max(s.since, s.phase === 'ended' || s.phase === 'pending' || s.phase === 'active' ? requestedMs(s.grant) : 0) };
    case 'tick':
      return endIfDue(s, e.serverNowMs);
    case 'empty':
      return s.phase === 'pending' || s.phase === 'active' ? { phase: 'ended', reason: 'expired', grant: s.grant, since: s.since } : s;
    case 'grant': {
      if (requestedMs(e.grant) <= s.since) return s; // belongs to something already closed and reset away
      if (s.phase === 'none') return endIfDue(fromGrant(e.grant, s.since), e.serverNowMs);
      if (e.grant.grant_id !== s.grant.grant_id) {
        // Another grant: only a newer request replaces the one we hold.
        return requestedMs(e.grant) > requestedMs(s.grant) ? endIfDue(fromGrant(e.grant, s.since), e.serverNowMs) : s;
      }
      const next = fromGrant(e.grant, s.since);
      if (rank(next) < rank(s)) return s; // late or out of order
      if (rank(next) === 2 && rank(s) === 2) return s; // ended is final, first reason wins
      if (rank(next) === rank(s) && sameGrant(s.grant, e.grant)) return endIfDue(s, e.serverNowMs); // duplicate
      return endIfDue(next, e.serverNowMs);
    }
  }
}
