import { describe, expect, it } from 'vitest';
import { isTimeEdited, toLocalInput } from './format';

describe('diary time', () => {
  it('formats local minute precision', () => {
    expect(toLocalInput(new Date(2026, 10, 14, 9, 5))).toBe('2026-11-14T09:05');
  });
  it('marks the entry only when the time differs from the default', () => {
    expect(isTimeEdited('2026-11-14T09:05', '2026-11-14T09:05')).toBe(false);
    expect(isTimeEdited('2026-11-13T21:00', '2026-11-14T09:05')).toBe(true);
  });
});
