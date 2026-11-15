/**
 * The layout constants and the pure geometry of the /simulation match field (MIN-4682, spec docs/design/simulations-motion-spec.md A12).
 * No DOM here: the canvas (Field.tsx) and the tests both read these. Nothing in this folder imports from src/features/simulate.
 */

/** Dot pitch in CSS pixels: 5 from 481 px up, 3 at 480 px and below (5 at 390 would be 385 px tall and push the euro figure out of the first screen). */
export const FIELD_PITCH = { narrow: 3, wide: 5 } as const;
export const FIELD_NARROW_MAX = 480;
/** Dot radius as a share of the pitch: a matched dot is slightly larger, so the two states still read at a 3 px pitch. */
export const DOT_R = { off: 0.36, on: 0.46 } as const;
/** The charts label every third value of the x axis, ending on the last. */
export const TICK_EVERY = 3;
/** A dot that has just landed grows from this share of its radius to full over --dur-land. */
export const FRONT_R_FROM = 0.6;
/** How many dots one build step draws into the two layers, so that no single step is a long task. */
export const BUILD_CHUNK = 1000;
/** Layers are drawn at most at this device pixel ratio (a 3x phone has 3x the pixels of the field and nothing to gain beyond). */
export const MAX_DPR = 3;

export const pitchFor = (viewportWidth: number): number => (viewportWidth <= FIELD_NARROW_MAX ? FIELD_PITCH.narrow : FIELD_PITCH.wide);

export type FieldGeometry = { pitch: number; cols: number; rows: number; width: number; height: number };

/** cols = floor(W / pitch), rows = ceil(total / cols), height = rows x pitch. The last row is partial: dots fill in reading order. */
export function fieldGeometry(width: number, total: number, pitch: number): FieldGeometry {
  const cols = Math.max(1, Math.floor(width / pitch));
  const rows = Math.max(1, Math.ceil(total / cols));
  return { pitch, cols, rows, width: cols * pitch, height: rows * pitch };
}

/** A block of whole or partial rows: cells `c0..c1` of rows `r0..r1`, ends excluded. */
export type CellRect = { c0: number; c1: number; r0: number; r1: number };

/** The dots `from` to `to` (to excluded) in reading order, as at most three rectangles: the rest of the first row, the full rows, the start of the last row. */
export function rangeRects(from: number, to: number, cols: number): CellRect[] {
  if (to <= from) return [];
  const r0 = Math.floor(from / cols);
  const r1 = Math.floor((to - 1) / cols);
  const c0 = from - r0 * cols;
  const c1 = to - r1 * cols;
  if (r0 === r1) return [{ c0, c1, r0, r1: r0 + 1 }];
  const out: CellRect[] = [{ c0, c1: cols, r0, r1: r0 + 1 }];
  const fullFrom = c0 === 0 ? r0 : r0 + 1;
  if (c0 === 0) out.length = 0;
  const fullTo = c1 === cols ? r1 + 1 : r1;
  if (fullTo > fullFrom) out.push({ c0: 0, c1: cols, r0: fullFrom, r1: fullTo });
  if (c1 !== cols) out.push({ c0: 0, c1, r0: r1, r1: r1 + 1 });
  return out;
}

/** The positions of the x values that get a label: every TICK_EVERY-th one, ending on the last. Nothing is typed here; the values are the data's. */
export function labelledTicks(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i).filter((i) => (n - 1 - i) % TICK_EVERY === 0);
}
