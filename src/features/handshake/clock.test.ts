import { describe, expect, it } from 'vitest';
import { localDeadlineIso, mmss, offsetFrom, secondsLeft } from './clock';

const SERVER = '2026-11-15T12:00:00.000Z';

describe('clock offset countdown', () => {
  it('reads the deadline on the server clock when the device clock is 90 s fast', () => {
    const deviceNow = Date.parse(SERVER) + 90_000; // the phone says 12:01:30 when the server says 12:00:00
    const offset = offsetFrom(SERVER, deviceNow);
    expect(offset).toBe(-90_000);
    // 120 s code, issued at server 12:00:00. A naive Date.now() countdown would already be 0 (deadline 12:02:00, device 12:01:30 -> 30 s).
    expect(secondsLeft('2026-11-15T12:02:00.000Z', offset, deviceNow)).toBe(120);
    expect(secondsLeft('2026-11-15T12:02:00.000Z', 0, deviceNow)).toBe(30); // what the offset prevents
  });
  it('reads it right when the device clock is slow', () => {
    const deviceNow = Date.parse(SERVER) - 45_000;
    expect(secondsLeft('2026-11-15T12:00:30.000Z', offsetFrom(SERVER, deviceNow), deviceNow)).toBe(30);
  });
  it('counts down with the device clock after the offset is taken, rounds up, and stops at 0', () => {
    const t0 = 1_000_000;
    const off = offsetFrom(SERVER, t0);
    expect(secondsLeft('2026-11-15T12:00:10.000Z', off, t0 + 2_300)).toBe(8); // 7.7 s left
    expect(secondsLeft('2026-11-15T12:00:10.000Z', off, t0 + 10_000)).toBe(0);
    expect(secondsLeft('2026-11-15T12:00:10.000Z', off, t0 + 99_000)).toBe(0);
  });
  it('turns a server deadline into the device time AccessTimer reads', () => {
    const deviceNow = Date.parse(SERVER) + 90_000;
    const offset = offsetFrom(SERVER, deviceNow);
    // AccessTimer compares with Date.now(): the deadline must sit 120 s after the device's "now", not 30 s.
    expect(Date.parse(localDeadlineIso('2026-11-15T12:02:00.000Z', offset)) - deviceNow).toBe(120_000);
  });
  it('a bad timestamp is 0 offset and 0 seconds, never NaN', () => {
    expect(offsetFrom('nope', 5)).toBe(0);
    expect(secondsLeft('nope', 0, 5)).toBe(0);
  });
  it('formats m:ss', () => {
    expect(mmss(120)).toBe('2:00');
    expect(mmss(58)).toBe('0:58');
    expect(mmss(-3)).toBe('0:00');
  });
});
