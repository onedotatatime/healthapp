import { describe, expect, it } from 'vitest';
import type { GrantView } from './contract';
import { initialSession, sessionReducer, type Session, type SessionEvent } from './grant';

const T0 = Date.parse('2026-11-15T12:00:00.000Z');
const iso = (s: number) => new Date(T0 + s * 1000).toISOString();
const party = (n: number, name: string) => ({ id: `00000000-0000-4000-8000-00000000000${n}`, full_name: name, specialty: null });
const view = (o: Partial<GrantView> = {}): GrantView => ({
  grant_id: '11111111-1111-4111-8111-111111111111',
  status: 'pending',
  requested_at: iso(0),
  approved_at: null,
  expires_at: iso(60),
  revoked_at: null,
  patient: party(1, 'Maria Papadopoulou'),
  doctor: party(2, 'Dr. Eleni Raptis'),
  ...o,
});
const grant = (g: GrantView, atS = 1): SessionEvent => ({ type: 'grant', grant: g, serverNowMs: T0 + atS * 1000 });
const run = (events: SessionEvent[], from: Session = initialSession) => events.reduce(sessionReducer, from);
const ACTIVE = view({ status: 'active', approved_at: iso(5), expires_at: iso(905) });

describe('grant session: every transition', () => {
  it('none -> pending', () => expect(run([grant(view())])).toMatchObject({ phase: 'pending' }));
  it('none -> active (a screen that opens mid-grant)', () => expect(run([grant(ACTIVE, 6)])).toMatchObject({ phase: 'active' }));
  it('pending -> active', () => expect(run([grant(view()), grant(ACTIVE, 6)])).toMatchObject({ phase: 'active' }));
  it('pending -> ended(refused)', () => expect(run([grant(view()), grant(view({ status: 'refused' }), 6)])).toMatchObject({ phase: 'ended', reason: 'refused' }));
  it('active -> ended(revoked)', () =>
    expect(run([grant(ACTIVE, 6), grant(view({ status: 'revoked', revoked_at: iso(30), expires_at: iso(905), approved_at: iso(5) }), 31)])).toMatchObject({ phase: 'ended', reason: 'revoked' }));
  it('active -> ended(expired) when the server says so', () =>
    expect(run([grant(ACTIVE, 6), grant({ ...ACTIVE, status: 'expired' }, 906)])).toMatchObject({ phase: 'ended', reason: 'expired' }));
  it('active -> ended(expired) when the countdown reaches 0, with no server event', () => {
    const a = run([grant(ACTIVE, 6)]);
    expect(sessionReducer(a, { type: 'tick', serverNowMs: T0 + 904_999 })).toBe(a);
    expect(sessionReducer(a, { type: 'tick', serverNowMs: T0 + 905_000 })).toMatchObject({ phase: 'ended', reason: 'expired' });
  });
  it('pending lapses at its own deadline', () => {
    const p = run([grant(view())]);
    expect(sessionReducer(p, { type: 'tick', serverNowMs: T0 + 59_000 })).toBe(p);
    expect(sessionReducer(p, { type: 'tick', serverNowMs: T0 + 60_000 })).toMatchObject({ phase: 'ended', reason: 'expired' });
  });
  it('an empty answer after data closes a pending or running session; before data it does nothing', () => {
    expect(run([{ type: 'empty' }])).toBe(initialSession);
    expect(run([grant(ACTIVE, 6), { type: 'empty' }])).toMatchObject({ phase: 'ended', reason: 'expired' });
    expect(run([grant(view()), { type: 'empty' }])).toMatchObject({ phase: 'ended' });
  });
  it('a grant that arrives already past its end is closed at once', () =>
    expect(run([grant(ACTIVE, 906)])).toMatchObject({ phase: 'ended', reason: 'expired' }));
});

describe('grant session: duplicates and out-of-order events', () => {
  it('a repeated event returns the same object (no repaint)', () => {
    const a = run([grant(view())]);
    expect(sessionReducer(a, grant(view(), 2))).toBe(a);
    const b = run([grant(ACTIVE, 6)]);
    expect(sessionReducer(b, grant(ACTIVE, 7))).toBe(b);
  });
  it('a late pending after active is ignored', () => {
    const a = run([grant(ACTIVE, 6)]);
    expect(sessionReducer(a, grant(view(), 7))).toBe(a);
  });
  it('a late active after revoked is ignored: ended is final', () => {
    const ended = run([grant(ACTIVE, 6), grant({ ...ACTIVE, status: 'revoked', revoked_at: iso(30) }, 31)]);
    expect(sessionReducer(ended, grant(ACTIVE, 32))).toBe(ended);
    expect(sessionReducer(ended, grant(view(), 32))).toBe(ended);
  });
  it('the first end reason wins (a local expiry is not overwritten by a later revoke)', () => {
    const ended = run([grant(ACTIVE, 6), { type: 'tick', serverNowMs: T0 + 905_000 }]);
    expect(sessionReducer(ended, grant({ ...ACTIVE, status: 'revoked' }, 906))).toMatchObject({ reason: 'expired' });
  });
  it('an older grant never replaces a newer one; a newer one does', () => {
    const current = run([grant(view({ grant_id: '22222222-2222-4222-8222-222222222222', requested_at: iso(100), expires_at: iso(160) }), 101)]);
    expect(sessionReducer(current, grant(view({ status: 'revoked' }), 102))).toBe(current);
    const newer = view({ grant_id: '33333333-3333-4333-8333-333333333333', requested_at: iso(200), expires_at: iso(260) });
    expect(sessionReducer(current, grant(newer, 201))).toMatchObject({ phase: 'pending', grant: { grant_id: newer.grant_id } });
  });
  it('after a reset the grant just closed does not come back from a slow poll', () => {
    const ended = run([grant(view()), grant(view({ status: 'refused' }), 6)]);
    const fresh = sessionReducer(ended, { type: 'reset' });
    expect(fresh).toMatchObject({ phase: 'none' });
    expect(sessionReducer(fresh, grant(view({ status: 'refused' }), 7))).toBe(fresh);
    expect(sessionReducer(fresh, grant(view(), 7))).toBe(fresh);
    // ...but a new request does open.
    expect(sessionReducer(fresh, grant(view({ grant_id: '44444444-4444-4444-8444-444444444444', requested_at: iso(50) }), 51))).toMatchObject({ phase: 'pending' });
  });
});
