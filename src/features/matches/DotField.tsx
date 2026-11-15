/**
 * The /simulation match field at 5,000 records (MIN-4682; spec docs/design/simulations-motion-spec.md A12; CTO go on MIN-4684).
 * One <canvas>, no DOM per dot. All dots are drawn once per width into two off-screen layers (unmatched, matched), in chunks of
 * BUILD_CHUNK dots a frame so no chunk is a long task. After that a paint is a few drawImage calls of the visible block and the
 * matched block, plus the few dots of the moving front as arcs, and it happens only when a count changes (this component is
 * memoised on the three counts). Nothing here is imported from src/features/simulate.
 */
import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BUILD_CHUNK, DOT_R, FRONT_R_FROM, MAX_DPR, fieldGeometry, pitchFor, rangeRects, type FieldGeometry } from './field';
import { landingScale } from './simData';


type Engine = {
  geo: FieldGeometry;
  dpr: number;
  off: HTMLCanvasElement;
  on: HTMLCanvasElement;
  /** How many dots the two layers hold so far. */
  built: number;
  colorOn: string;
};

/** The computed colour of a token, resolved once per mount (a canvas cannot read var()). */
function resolveColor(host: HTMLElement, token: string): string {
  const probe = document.createElement('span');
  probe.style.color = `var(${token})`;
  probe.style.display = 'none';
  host.appendChild(probe);
  const c = getComputedStyle(probe).color;
  host.removeChild(probe);
  return c;
}

function drawDots(ctx: CanvasRenderingContext2D, geo: FieldGeometry, from: number, to: number, r: number) {
  ctx.beginPath();
  for (let i = from; i < to; i++) {
    const cx = ((i % geo.cols) + 0.5) * geo.pitch;
    const cy = (Math.floor(i / geo.cols) + 0.5) * geo.pitch;
    ctx.moveTo(cx + r, cy);
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  }
  ctx.fill();
}

export const DotField = memo(function DotField({ total, visible, matched, tail, still, label }: {
  /** Records in the full network (the last x value). */
  total: number;
  /** Dots shown, in reading order. */
  visible: number;
  /** Matched dots: the first `matched` in reading order. */
  matched: number;
  /** The matched count SIM_LAND_FADE_MS ago: the dots between it and `matched` are the moving front. */
  tail: number;
  /** Reduced motion: build the layers, then draw once. */
  still: boolean;
  /** The aria-label, written at step edges only. */
  label: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<Engine | null>(null);
  const counts = useRef({ visible, matched, tail });
  const [geo, setGeo] = useState<FieldGeometry | null>(null);
  counts.current = { visible, matched, tail };

  const paint = () => {
    const e = engine.current;
    const el = canvas.current;
    const ctx = el?.getContext('2d');
    if (!e || !el || !ctx) return;
    if (still && e.built < total) return; // reduced motion draws once, when everything is ready
    const c = counts.current;
    const k = e.dpr;
    const cell = e.geo.pitch * k;
    const shown = Math.min(Math.max(c.visible, c.matched), total, e.built);
    const m = Math.min(c.matched, shown);
    const solid = Math.min(c.tail, m);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, el.width, el.height);
    const blit = (layer: HTMLCanvasElement, from: number, to: number) => {
      for (const q of rangeRects(from, to, e.geo.cols)) {
        const x = q.c0 * cell, y = q.r0 * cell, w = (q.c1 - q.c0) * cell, h = (q.r1 - q.r0) * cell;
        ctx.drawImage(layer, x, y, w, h, x, y, w, h);
      }
    };
    blit(e.on, 0, solid);
    blit(e.off, m, shown);
    if (m > solid) {
      // The moving front: the dots that landed in the last SIM_LAND_FADE_MS, each a little smaller the later it landed.
      ctx.fillStyle = e.colorOn;
      for (let j = solid; j < m; j++) {
        const age = (m - j - 0.5) / (m - solid);
        const r = DOT_R.on * cell * landingScale(age, FRONT_R_FROM);
        const cx = ((j % e.geo.cols) + 0.5) * cell;
        const cy = (Math.floor(j / e.geo.cols) + 0.5) * cell;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // The width of the column decides the grid; a resize measures again.
  useLayoutEffect(() => {
    const host = canvas.current?.parentElement;
    if (!host) return;
    const measure = () => {
      const w = host.clientWidth;
      if (w <= 0) return;
      const next = fieldGeometry(w, total, pitchFor(window.innerWidth));
      setGeo((g) => (g && g.pitch === next.pitch && g.cols === next.cols && g.rows === next.rows ? g : next));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    return () => ro.disconnect();
  }, [total]);

  // Once per width: size the canvas, then draw all the dots into the two layers, a chunk a frame.
  useEffect(() => {
    const el = canvas.current;
    if (!el || !geo) return;
    const dpr = Math.min(MAX_DPR, Math.max(1, Math.round(window.devicePixelRatio || 1)));
    el.width = geo.width * dpr;
    el.height = geo.height * dpr;
    const mk = () => {
      const c = document.createElement('canvas');
      c.width = el.width;
      c.height = el.height;
      return c;
    };
    const off = mk(), on = mk();
    const offCtx = off.getContext('2d'), onCtx = on.getContext('2d');
    if (!offCtx || !onCtx || !el.getContext('2d')) return;
    const colorOff = resolveColor(el.parentElement ?? el, '--field-border');
    const colorOn = resolveColor(el.parentElement ?? el, '--color-link');
    offCtx.scale(dpr, dpr);
    onCtx.scale(dpr, dpr);
    offCtx.fillStyle = colorOff;
    offCtx.globalAlpha = 0.4; // unmatched = --field-border at 40% on the card
    onCtx.fillStyle = colorOn;
    const e: Engine = { geo, dpr, off, on, built: 0, colorOn };
    engine.current = e;
    let raf = 0;
    let live = true;
    const step = () => {
      if (!live) return;
      const to = Math.min(total, e.built + BUILD_CHUNK);
      drawDots(offCtx, geo, e.built, to, DOT_R.off * geo.pitch);
      drawDots(onCtx, geo, e.built, to, DOT_R.on * geo.pitch);
      e.built = to;
      paint();
      if (to < total) raf = requestAnimationFrame(step);
    };
    step();
    return () => {
      live = false;
      cancelAnimationFrame(raf);
      if (engine.current === e) engine.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo, total, still]);

  // A count changed: paint once.
  useEffect(() => { paint(); });

  return (
    <canvas
      ref={canvas}
      role="img"
      aria-label={label}
      style={geo ? { width: geo.width, height: geo.height } : undefined}
      data-pitch={geo?.pitch}
    />
  );
});
