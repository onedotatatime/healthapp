/**
 * The 50,000 dots of /doctor/simulate, as numbers (MIN-4736). Pure: no DOM, no canvas. dotPaint.ts draws what this module decides,
 * and the unit tests read it. One dot per record, one colour, positions shuffled with the file's seed (Fisher-Yates): the place of a
 * dot means nothing, and picking the selected records stays "first in file order" (recruit.ts), never by place.
 *
 * Stages: all records; opted in to matching (the others fade); fit the criteria (those stay bright and twice the size); selected
 * (bright, ringed when there are 100 or fewer, enlarged above that; the rest of the fitting ones at mid brightness).
 */
import { ALPHA } from './motion';

export type StageId = 'all' | 'opted' | 'fit' | 'selected';
export const STAGE_IDS: readonly StageId[] = ['all', 'opted', 'fit', 'selected'];
/** At most this many selected records are ringed. Above it they are enlarged and the canvas label says so. */
export const RING_MAX = 100;

/** Bits of one record's class: what the search found about it at this click. */
export const OPTED = 1;
export const ELIGIBLE = 2;
export const SELECTED = 4;

/** Brightness level, an index into ALPHA: 0 bright, 1 mid, 2 faded. Size is a multiple of the base dot. */
export type Level = 0 | 1 | 2;
export type Size = 1 | 2 | 3;
export interface Look { level: Level; size: Size }

/** CTO's pitch table: the distance between two dots, in CSS px, from the width of the field. */
export const pitchFor = (width: number): number => (width < 520 ? 1.5 : width < 900 ? 2 : 3);
/** The dot itself is this share of the pitch (a gap stays between two dots). */
export const DOT_SHARE = 0.7;
const PAD = 10; // CSS px kept free round the field, so a ring at the edge is not cut

export interface Geometry { width: number; pitch: number; pad: number; cols: number; rows: number; height: number }

export function geometryFor(width: number, n: number): Geometry {
  const pitch = pitchFor(width);
  const cols = Math.max(1, Math.floor((width - 2 * PAD) / pitch));
  const rows = Math.ceil(n / cols);
  return { width, pitch, pad: PAD, cols, rows, height: Math.ceil(rows * pitch + 2 * PAD) };
}

/** A small seeded generator (mulberry32). The same seed gives the same sequence in every browser. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** `slot[i]` is the grid cell of record i: a Fisher-Yates shuffle of 0..n-1 driven by the file's seed. */
export function slotOrder(n: number, seed: number): Uint32Array {
  const slot = new Uint32Array(n);
  for (let i = 0; i < n; i++) slot[i] = i;
  const rnd = seededRandom(seed);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = slot[i];
    slot[i] = slot[j];
    slot[j] = t;
  }
  return slot;
}

/** Centre of every dot in device pixels, snapped to whole pixels so a 1.5 px pitch stays crisp. */
export function centres(geo: Geometry, slot: Uint32Array, dpr: number): { xs: Int32Array; ys: Int32Array } {
  const n = slot.length;
  const xs = new Int32Array(n);
  const ys = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    const s = slot[i];
    xs[i] = Math.round((geo.pad + ((s % geo.cols) + 0.5) * geo.pitch) * dpr);
    ys[i] = Math.round((geo.pad + (Math.floor(s / geo.cols) + 0.5) * geo.pitch) * dpr);
  }
  return { xs, ys };
}

/** Side of a dot in device pixels, whole and at least 1. */
export const sideOf = (geo: Geometry, size: Size, dpr: number): number => Math.max(1, Math.round(geo.pitch * DOT_SHARE * size * dpr));

/** What a record with class `cls` looks like at `stage`. `many`: more than RING_MAX are selected, so they are enlarged. */
export function lookAt(stage: StageId, cls: number, many: boolean): Look {
  switch (stage) {
    case 'all':
      return { level: 0, size: 1 };
    case 'opted':
      return cls & OPTED ? { level: 0, size: 1 } : { level: 2, size: 1 };
    case 'fit':
      return cls & ELIGIBLE ? { level: 0, size: 2 } : { level: 2, size: 1 };
    case 'selected':
      if (cls & SELECTED) return { level: 0, size: many ? 3 : 2 };
      return cls & ELIGIBLE ? { level: 1, size: 2 } : { level: 2, size: 1 };
  }
}

/** The dots that move together in one transition: same brightness before, same brightness after, same size after. */
export interface Group { from: Level; to: Level; size: Size; rows: number[] }

/**
 * `from` null is the fill-in (every dot appears at the look of `to`). At most three groups for any search, so a fade frame is at most
 * three drawImage calls: (not opted | not fit | not selected) stays faded, the dots that leave fade, the dots that stay stay.
 */
export function groupsFor(from: StageId | null, to: StageId, cls: Uint8Array, many: boolean): Group[] {
  const map = new Map<number, Group>();
  for (let i = 0; i < cls.length; i++) {
    const b = lookAt(to, cls[i], many);
    const a = from === null ? b : lookAt(from, cls[i], many);
    const key = a.level * 9 + b.level * 3 + (b.size - 1);
    let g = map.get(key);
    if (!g) map.set(key, (g = { from: a.level, to: b.level, size: b.size, rows: [] }));
    g.rows.push(i);
  }
  // Drawn from the dimmest to the brightest, so a bright dot is never covered by a faded one.
  return [...map.values()].sort((x, y) => Math.max(y.from, y.to) - Math.max(x.from, x.to) || y.to - x.to);
}

/** Alpha of a group `e` (0..1) of the way through its fade. */
export const groupAlpha = (g: { from: Level; to: Level }, e: number): number => ALPHA[g.from] + (ALPHA[g.to] - ALPHA[g.from]) * e;

/** The stage the canvas shows once `step` stages have been reached (step 0 = the dots are in, nothing lit yet). */
export const stageOfStep = (step: number): StageId => STAGE_IDS[Math.min(Math.max(step, 1), STAGE_IDS.length) - 1];

/** Fraction of the records that are bright at a stage, for the bar under the dots. Never below one record. */
export function brightFraction(stage: StageId, counts: { records: number; optedIn: number; eligible: number; selected: number } | null, optedIn: number, records: number): number {
  if (records <= 0) return 0;
  switch (stage) {
    case 'all': return 1;
    case 'opted': return optedIn / records;
    case 'fit': return counts ? counts.eligible / records : optedIn / records;
    case 'selected': return counts ? counts.selected / records : optedIn / records;
  }
}
