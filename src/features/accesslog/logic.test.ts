import { describe, expect, it } from 'vitest';
import { describe as say, outcomeOf, type GrantLogRow } from './logic';

const base: GrantLogRow = {
  id: '11111111-1111-4111-8111-111111111111',
  status: 'active',
  requested_at: '2026-11-14T09:00:00.000Z',
  approved_at: '2026-11-14T09:01:00.000Z',
  expires_at: '2026-11-14T09:16:00.000Z',
  revoked_at: null,
};
const at = (iso: string) => Date.parse(iso);

describe('access log outcomes', () => {
  it('an active grant is open until expires_at, then ended by time (lazy expiry)', () => {
    expect(outcomeOf(base, at('2026-11-14T09:10:00.000Z'))).toBe('open');
    expect(outcomeOf(base, at('2026-11-14T09:16:00.000Z'))).toBe('ended_time');
  });
  it('maps every stored status', () => {
    const now = at('2026-11-14T12:00:00.000Z');
    expect(outcomeOf({ ...base, status: 'revoked', revoked_at: '2026-11-14T09:05:00.000Z' }, now)).toBe('ended_you');
    expect(outcomeOf({ ...base, status: 'refused', approved_at: null }, now)).toBe('declined');
    expect(outcomeOf({ ...base, status: 'expired' }, now)).toBe('ended_time');
    expect(outcomeOf({ ...base, status: 'expired', approved_at: null }, now)).toBe('asked_lapsed');
    expect(outcomeOf({ ...base, status: 'pending', approved_at: null, expires_at: '2026-11-14T09:02:00.000Z' }, now)).toBe('asked_lapsed');
    expect(outcomeOf({ ...base, status: 'pending', approved_at: null, expires_at: '2026-11-14T13:00:00.000Z' }, now)).toBe('asked');
  });
  it('says what happened without interpreting', () => {
    const t = say({ ...base, status: 'revoked', revoked_at: '2026-11-14T09:05:00.000Z' }, at('2026-11-14T12:00:00.000Z'));
    expect(t).toContain('Approved');
    expect(t).toContain('You ended access');
    expect(say({ ...base, status: 'refused', approved_at: null }, 0)).toContain('You declined');
  });
});
