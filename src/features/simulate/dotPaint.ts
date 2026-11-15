/**
 * Draws the 50,000 dots on one canvas (MIN-4736). dots.ts decides what every dot looks like; this file only paints it.
 *
 * Why it does not stall at 50,000: the squares of each stage are rasterised ONCE into offscreen layers (one layer per group of dots
 * that move together, at most three), in small slices that each stay under a few milliseconds, during the 1.5 s the previous stage
 * holds. A fade frame is then at most three drawImage calls, the fill-in is a wipe of one layer, and no frame touches a single dot.
 * Under reduced motion nothing is animated: the final state of the stage is painted in one pass, with no timer.
 */
import { RING_MAX, centres, geometryFor, groupsFor, groupAlpha, sideOf, slotOrder, type Geometry, type Group, type StageId } from './dots';
import { SM_FADE_MS, SM_REVEAL_MS, SM_RING_MS, clamp01, easeInOut, easeOut, lerp, ringStagger, ringsTotal } from './motion';

export interface FieldInput {
  seed: number;
  cls: Uint8Array;
  /** The selected rows, in file order. */
  selected: number[];
  many: boolean;
  /** The stages this search draws, in order. */
  stages: readonly StageId[];
}

interface Layer { from: Group['from']; to: Group['to']; canvas: HTMLCanvasElement }

const SLICE_MS = 6; // the longest a slice of rasterising may run before it yields to the browser
const RING_RADIUS = 6; // CSS px, the CTO's number

const cssVar = (name: string, fallback: string) => (typeof document === 'undefined' ? fallback : getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback);
const tick = () => new Promise<void>((r) => setTimeout(r, 0));

export class DotPainter {
  readonly geo: Geometry;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly dpr: number;
  private readonly xs: Int32Array;
  private readonly ys: Int32Array;
  private readonly color = cssVar('--color-link', '#0E7C86');
  private readonly ink = cssVar('--ink', '#12303A');
  private readonly cache = new Map<string, Promise<Layer[]>>();
  private current: StageId | null = null;
  /** The layers of the last finished transition: the rings are drawn over them. */
  private final: Layer[] | null = null;
  private raf = 0;
  private flight: StageId | null = null;
  private dead = false;
  /** The transition in progress (or the last one): the rings wait for it. */
  private pending: Promise<void> = Promise.resolve();

  constructor(private readonly canvas: HTMLCanvasElement, width: number, private readonly input: FieldInput) {
    const n = input.cls.length;
    this.geo = geometryFor(width, n);
    this.dpr = Math.min(Math.max(1, window.devicePixelRatio || 1), 2);
    const c = centres(this.geo, slotOrder(n, input.seed), this.dpr);
    this.xs = c.xs;
    this.ys = c.ys;
    canvas.width = Math.round(this.geo.width * this.dpr);
    canvas.height = Math.round(this.geo.height * this.dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas: no 2d context');
    this.ctx = ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  get stage(): StageId | null { return this.current; }

  dispose() {
    this.dead = true;
    cancelAnimationFrame(this.raf);
    for (const p of this.cache.values()) void p.then((ls) => this.free(ls));
    this.cache.clear();
    this.final = null;
  }

  // ------------------------------------------------------------------------------------------------------------ layers

  private free(ls: Layer[]) {
    for (const l of ls) { l.canvas.width = 0; l.canvas.height = 0; }
  }

  private newCanvas(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = this.canvas.width;
    c.height = this.canvas.height;
    return c;
  }

  private square(ctx: CanvasRenderingContext2D, row: number, side: number) {
    ctx.fillRect(this.xs[row] - (side >> 1), this.ys[row] - (side >> 1), side, side);
  }

  /** Rasterises the groups of one transition into layers, in slices. `from` null is the fill-in. Resolves once, cached by its key. */
  private layers(from: StageId | null, to: StageId): Promise<Layer[]> {
    const key = `${from ?? '-'}>${to}`;
    let p = this.cache.get(key);
    if (!p) {
      p = this.build(from, to);
      this.cache.set(key, p);
    }
    return p;
  }

  private async build(from: StageId | null, to: StageId): Promise<Layer[]> {
    const groups = groupsFor(from, to, this.input.cls, this.input.many);
    const out: Layer[] = [];
    for (const g of groups) {
      const canvas = this.newCanvas();
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas: no 2d context');
      ctx.fillStyle = this.color;
      const side = sideOf(this.geo, g.size, this.dpr);
      let t0 = performance.now();
      for (let k = 0; k < g.rows.length; k++) {
        this.square(ctx, g.rows[k], side);
        if ((k & 1023) === 1023 && performance.now() - t0 > SLICE_MS) {
          await tick();
          if (this.dead) return out;
          t0 = performance.now();
        }
      }
      out.push({ from: g.from, to: g.to, canvas });
      await tick();
      if (this.dead) return out;
    }
    return out;
  }

  /** Builds the layers of the transition into `stage` ahead of time, while the previous stage is on screen. */
  private warm(after: StageId | null) {
    if (after === null) return;
    const i = this.input.stages.indexOf(after);
    const next = this.input.stages[i + 1];
    if (i >= 0 && next) void this.layers(after, next);
  }

  private evict(keep: string[]) {
    for (const [k, p] of [...this.cache]) {
      if (!keep.includes(k)) {
        this.cache.delete(k);
        void p.then((ls) => this.free(ls));
      }
    }
  }

  // ------------------------------------------------------------------------------------------------------------ frames

  private clear() {
    this.ctx.globalAlpha = 1;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private paintLayers(ls: Layer[], e: number) {
    this.clear();
    for (const l of ls) {
      this.ctx.globalAlpha = groupAlpha(l, e);
      this.ctx.drawImage(l.canvas, 0, 0);
    }
    this.ctx.globalAlpha = 1;
  }

  private paintRings(now: number, t0: number, instant: boolean) {
    const rows = this.input.selected;
    if (rows.length === 0 || rows.length > RING_MAX) return;
    const ctx = this.ctx;
    const gap = ringStagger(rows.length);
    ctx.strokeStyle = this.ink;
    ctx.lineWidth = Math.max(1, 1.5 * this.dpr);
    for (let k = 0; k < rows.length; k++) {
      const q = instant ? 1 : easeOut(clamp01((now - t0 - k * gap) / SM_RING_MS));
      if (q <= 0) continue;
      ctx.globalAlpha = q;
      ctx.beginPath();
      ctx.arc(this.xs[rows[k]] + 0.5, this.ys[rows[k]] + 0.5, RING_RADIUS * this.dpr * lerp(0.4, 1, q), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  private frames(ms: number, draw: (p: number, now: number) => void): Promise<void> {
    return new Promise((resolve) => {
      const t0 = performance.now();
      const step = (now: number) => {
        if (this.dead) return resolve();
        const p = clamp01((now - t0) / ms);
        draw(p, now);
        if (p < 1) this.raf = requestAnimationFrame(step);
        else resolve();
      };
      this.raf = requestAnimationFrame(step);
    });
  }

  // ------------------------------------------------------------------------------------------------------------ the three things the page asks for

  /** Reduced motion, a resize, or the first paint of a finished state: the stage as it ends, in one pass. No timer, no frame loop. */
  paintStatic(stage: StageId, rings: boolean) {
    cancelAnimationFrame(this.raf);
    this.flight = null;
    this.clear();
    const ctx = this.ctx;
    ctx.fillStyle = this.color;
    for (const g of groupsFor(stage, stage, this.input.cls, this.input.many)) {
      ctx.globalAlpha = groupAlpha(g, 1);
      const side = sideOf(this.geo, g.size, this.dpr);
      for (let k = 0; k < g.rows.length; k++) this.square(ctx, g.rows[k], side);
    }
    ctx.globalAlpha = 1;
    if (rings && stage === 'selected') this.paintRings(0, 0, true);
    this.current = stage;
    this.final = null;
  }

  /** The fill-in: all the dots wipe in from the top over SM_REVEAL_MS. */
  async fill(): Promise<void> {
    const [layer] = await this.layers(null, 'all');
    if (this.dead || !layer) return;
    const h = this.canvas.height;
    await this.frames(SM_REVEAL_MS, (p) => {
      const rows = Math.min(h, Math.ceil(h * (1 - (1 - p) * (1 - p))));
      this.clear();
      this.ctx.drawImage(layer.canvas, 0, 0, this.canvas.width, rows, 0, 0, this.canvas.width, rows);
    });
    if (this.dead) return;
    this.current = 'all';
    this.evict([]);
    this.warm('all');
  }

  /** A new stage: the dots that leave fade over SM_FADE_MS. At most three drawImage calls a frame. */
  go(to: StageId): Promise<void> {
    const run = this.play(to);
    this.pending = run;
    return run;
  }

  private async play(to: StageId): Promise<void> {
    if (this.flight) {
      // a stage arrived while the last fade was still running: that one ends where it was going
      cancelAnimationFrame(this.raf);
      this.current = this.flight;
      this.flight = null;
    }
    const from = this.current;
    if (from === null || from === to) return;
    const ls = await this.layers(from, to);
    if (this.dead) return;
    this.flight = to;
    await this.frames(SM_FADE_MS, (p) => this.paintLayers(ls, easeInOut(p)));
    if (this.dead || this.flight !== to) return;
    this.flight = null;
    this.current = to;
    this.final = ls;
    this.evict([`${from}>${to}`]);
    this.warm(to);
  }

  /** The rings land one by one over the finished selected stage. */
  async rings(): Promise<void> {
    await this.pending;
    if (this.dead || this.current !== 'selected' || !this.final) return;
    const ls = this.final;
    const total = ringsTotal(this.input.selected.length);
    if (total === 0) return;
    const t0 = performance.now();
    await this.frames(total, (_p, now) => {
      this.paintLayers(ls, 1);
      this.paintRings(now, t0, false);
    });
  }
}
