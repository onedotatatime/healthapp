import { describe, expect, it } from 'vitest';
import { announcement, formatMmSs, remainingSeconds, timerState, trackFraction } from './timer';

describe('access timer maths', () => {
  it('reads the remaining time from expires_at and never goes below zero', () => {
    const exp = Date.parse('2026-11-14T12:15:00Z');
    expect(remainingSeconds(exp, Date.parse('2026-11-14T12:00:00Z'))).toBe(900);
    expect(remainingSeconds(exp, exp + 5000)).toBe(0);
  });
  it('switches at 120 seconds: 120 still runs, 119 is ending soon, 0 is ended', () => {
    expect(timerState(120)).toBe('running');
    expect(timerState(119)).toBe('soon');
    expect(timerState(1)).toBe('soon');
    expect(timerState(0)).toBe('ended');
  });
  it('formats m:ss', () => {
    expect(formatMmSs(872)).toBe('14:32');
    expect(formatMmSs(65)).toBe('1:05');
    expect(formatMmSs(-3)).toBe('0:00');
  });
  it('the track shrinks from full to empty and stays inside 0..1', () => {
    expect(trackFraction(900, 900)).toBe(1);
    expect(trackFraction(450, 900)).toBe(0.5);
    expect(trackFraction(0, 900)).toBe(0);
    expect(trackFraction(2000, 900)).toBe(1);
    expect(trackFraction(10, 0)).toBe(0);
  });
  it('announces start, ending soon and ended in words', () => {
    expect(announcement('running', 900, 900)).toBe('Access started, 15 minutes');
    expect(announcement('soon', 95, 900)).toBe('Access ends in 2 minutes');
    expect(announcement('ended', 0, 900)).toBe('Access ended');
  });
});
