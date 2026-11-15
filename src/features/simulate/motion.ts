/**
 * The motion of /doctor/simulate (MIN-4609, one flow since MIN-4736), every number in one place. Source: docs/design/simulations-motion-spec.md section B.
 * Times in ms. `R` in the comments is the moment the dots have filled in. The CSS durations are the tokens in
 * src/styles/tokens.css (--dur-fade, --dur-step, --ease-out, --ease-inout); the JS values below mirror them for the canvas.
 */
export const SM_REVEAL_MS = 1400; // the dots fill in (quadratic ease-out, unchanged)
export const SM_SETTLE_MS = 400; // R to the first step row lighting
export const SM_STAGE_MS = 1500; // one narrowing, from the start of one step to the start of the next (was 900)
export const SM_FADE_MS = 600; // the dots that leave fade over this long, --dur-fade
export const SM_RING_MS = 300; // one ring landing
export const SM_RING_STAGGER_MAX = 120;
export const SM_RING_SPREAD_MS = 600; // stagger = min(120, 600 / count)

/** Start of stage `s` (1 = all records, 2 = opted in, 3 = fit the criteria, 4 = selected), ms after R. */
export const stepAt = (s: number) => SM_SETTLE_MS + (s - 1) * SM_STAGE_MS;

export const ringStagger = (count: number) => (count > 0 ? Math.min(SM_RING_STAGGER_MAX, SM_RING_SPREAD_MS / count) : 0);
/** When the last ring has landed, ms after the rings start. */
export const ringsTotal = (count: number) => (count > 0 ? (count - 1) * ringStagger(count) + SM_RING_MS : 0);

/** Brightness of a dot: 0 bright, 1 mid (shares the codes, outside the group), 2 faded. Canvas alpha per level. */
export const ALPHA = [1, 0.45, 0.1] as const;
export const lerp = (a: number, b: number, e: number) => a + (b - a) * e;
export const fadeAlpha = (from: 0 | 1 | 2, to: 0 | 1 | 2, e: number) => lerp(ALPHA[from], ALPHA[to], e);
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** CSS `cubic-bezier(x1,y1,x2,y2)` evaluated in JS, so the canvas follows the same curve as the CSS tokens. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 12; i++) {
      const err = ((ax * t + bx) * t + cx) * t - x;
      if (Math.abs(err) < 1e-7) break;
      const d = (3 * ax * t + 2 * bx) * t + cx;
      if (Math.abs(d) < 1e-6) break;
      t = clamp01(t - err / d);
    }
    return ((ay * t + by) * t + cy) * t;
  };
}
export const easeInOut = cubicBezier(0.4, 0, 0.2, 1); // --ease-inout
export const easeOut = cubicBezier(0.22, 1, 0.36, 1); // --ease-out
