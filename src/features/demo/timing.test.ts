import { describe, expect, it } from 'vitest';
import { secondsBetween, summarize, TARGET_SECONDS } from './timing';

const T = '2026-11-15T09:30:00.000+00:00';
describe('handshake timing', () => {
  it('measures seconds with one decimal', () => {
    expect(secondsBetween(T, '2026-11-15T09:30:04.260+00:00')).toBe(4.3);
  });
  it('is null when an end is missing or not a date', () => {
    expect(secondsBetween(null, T)).toBeNull();
    expect(secondsBetween(T, null)).toBeNull();
    expect(secondsBetween(T, 'nope')).toBeNull();
  });
  it('never goes negative', () => {
    expect(secondsBetween('2026-11-15T09:30:05.000+00:00', T)).toBe(0);
  });
  it('reads the 15 second target from scan to open', () => {
    const base = { grant_id: 'g', scanned_at: T, approved_at: '2026-11-15T09:30:06.000+00:00' };
    const ok = summarize({ ...base, doctor_open_at: '2026-11-15T09:30:09.500+00:00' });
    expect(ok).toEqual({ scannedToApproved: 6, approvedToOpen: 3.5, scannedToOpen: 9.5, withinTarget: true });
    const slow = summarize({ ...base, doctor_open_at: `2026-11-15T09:30:${15 + 1}.000+00:00` });
    expect(slow.withinTarget).toBe(false);
    expect(TARGET_SECONDS).toBe(15);
    expect(summarize({ ...base, doctor_open_at: null }).withinTarget).toBeNull();
  });
});
