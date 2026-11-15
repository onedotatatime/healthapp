/**
 * The 5,000 records as dots on ONE canvas (not 5,000 elements). Dot colour is the generator's seeded group, for looks only:
 * the matcher never reads it. Drawing is batched per group and brightness level, so a frame is about 42 fills.
 * A stage change fades the dots that leave over SM_FADE_MS and the rings land one by one (MIN-4609); a frame is drawn only while that runs.
 * Tapping a dot is out of scope (MIN-4594); the canvas is an image with a text label.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { COPY } from './copy';
import type { RunFile } from './matcher';
import { SM_FADE_MS, SM_REVEAL_MS, SM_RING_MS, clamp01, easeInOut, easeOut, fadeAlpha, lerp, ringStagger, ringsTotal } from './motion';

export type Stage = keyof typeof COPY.canvasStage;

/** One colour per seeded group, same hues as the How it works prototype. Canvas cannot read CSS variables per dot. */
const GROUP_COLORS: Record<string, string> = {
  type2_diabetes_metabolic: '#0E7C86', inflammatory_back_pain: '#3E5C8A', hypothyroid: '#B4531A', rheumatoid_arthritis: '#7A4EA3',
  iron_deficiency: '#B02A5B', low_bone_density: '#2F7D3A', lupus_like: '#8A6D00', gout: '#1F6FB5', hyperthyroid: '#C2410C',
  reduced_kidney_function: '#5B6B70', rare_myopathy: '#A21CAF', rare_sarcoid_like: '#0F766E', rare_copper_metabolism: '#92400E',
  noise: '#B9C4C3',
};
export const colorOfGroup = (g: string) => GROUP_COLORS[g] ?? '#B9C4C3';

const PAD = 12; // room for the rings at the edges

interface Props {
  run: RunFile;
  stage: Stage;
  /** Becomes true once; the dots then fill in, and `onRevealed` fires when all 5,000 are drawn. */
  reveal: boolean;
  reduced: boolean;
  shareRows: number[];
  matched: number[];
  onRevealed: () => void;
}

const cssVar = (name: string, fallback: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
type Level = 0 | 1 | 2;
interface Bucket { g: number; from: Level; to: Level; path: Path2D }
const NEVER = -1e9; // a start time so far back that a transition has finished

export function DotCanvas({ run, stage, reveal, reduced, shareRows, matched, onRevealed }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const visible = useRef(0);
  const latest = useRef({ stage, shareRows, matched });
  latest.current = { stage, shareRows, matched };
  // The one transition in flight: dots go from the level of `from` to the level of `to` over SM_FADE_MS; rings start at ringT0.
  const anim = useRef<{ from: Stage; to: Stage; t0: number; ringT0: number }>({ from: stage, to: stage, t0: NEVER, ringT0: NEVER });
  const raf = useRef(0);
  const cache = useRef<{ key: string; buckets: Bucket[] } | null>(null);
  const n = run.records.length;
  const cell = width < 520 ? 5 : 8;
  const cols = Math.max(1, Math.floor((width - 2 * PAD) / cell));
  const rows = Math.ceil(n / cols);
  const height = rows * cell + 2 * PAD;

  const byGroup = useRef<number[][]>([]);
  if (byGroup.current.length === 0) {
    byGroup.current = run.groups.map(() => []);
    run.records.forEach((r, i) => byGroup.current[r[3]].push(i)); // colour only
  }

  /** Dots per (colour group, level before, level after): at most 14 x 9 fills a frame, whatever moves. */
  const buckets = (limit: number, from: Stage, to: Stage): Bucket[] => {
    const key = `${from}|${to}|${cols}|${cell}`;
    if (limit >= n && cache.current?.key === key) return cache.current.buckets;
    const { shareRows: share, matched: hit } = latest.current;
    const shareSet = new Set(share);
    const hitSet = new Set(hit);
    const levelOf = (st: Stage) => (i: number): Level => {
      if (st === 'all') return 0;
      if (st === 'opted') return run.records[i][2] ? 0 : 2;
      if (st === 'share') return shareSet.has(i) ? 0 : 2;
      const focus = hit.length > 0 ? hitSet : shareSet; // exact and shown: the group, or where the search stopped
      return focus.has(i) ? 0 : shareSet.has(i) ? 1 : 2;
    };
    const lf = levelOf(from);
    const lt = levelOf(to);
    const r = cell * 0.36;
    const out: Bucket[] = [];
    byGroup.current.forEach((rowsOfGroup, g) => {
      const paths = new Map<number, Path2D>();
      for (const i of rowsOfGroup) {
        if (i >= limit) continue;
        const a = lf(i), b = lt(i);
        const k = a * 3 + b;
        let p = paths.get(k);
        if (!p) paths.set(k, (p = new Path2D()));
        const x = PAD + (i % cols) * cell + cell / 2;
        const y = PAD + Math.floor(i / cols) * cell + cell / 2;
        p.moveTo(x + r, y);
        p.arc(x, y, r, 0, Math.PI * 2);
      }
      paths.forEach((path, k) => out.push({ g, from: Math.floor(k / 3) as Level, to: (k % 3) as Level, path }));
    });
    if (limit >= n) cache.current = { key, buckets: out };
    return out;
  };

  const draw = useCallback((now: number) => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || width === 0) return;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const { from, to, t0, ringT0 } = anim.current;
    const limit = visible.current;
    const e = easeInOut(clamp01((now - t0) / SM_FADE_MS));
    for (const b of buckets(limit, from, to)) {
      ctx.fillStyle = colorOfGroup(run.groups[b.g]);
      ctx.globalAlpha = fadeAlpha(b.from, b.to, e);
      ctx.fill(b.path);
    }
    ctx.globalAlpha = 1;
    const hit = latest.current.matched;
    if (to === 'shown' && limit >= n) {
      const ink = cssVar('--ink', '#12303A');
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = ink;
      ctx.fillStyle = ink;
      ctx.font = `600 12px ${cssVar('--font-sans', 'system-ui, sans-serif')}`;
      ctx.textAlign = 'center';
      const gap = ringStagger(hit.length);
      hit.forEach((i, k) => {
        const q = easeOut(clamp01((now - ringT0 - k * gap) / SM_RING_MS));
        if (q <= 0) return;
        const x = PAD + (i % cols) * cell + cell / 2;
        const y = PAD + Math.floor(i / cols) * cell + cell / 2;
        ctx.globalAlpha = q;
        ctx.beginPath();
        ctx.arc(x, y, 9 * lerp(0.4, 1, q), 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillText(String(k + 1), x, Math.max(10, y - 13));
      });
      ctx.globalAlpha = 1;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, cols, cell, n, run]);

  /** Draws every frame while a transition runs, then stops: no idle loop. */
  const play = useCallback(() => {
    cancelAnimationFrame(raf.current);
    const tick = (now: number) => {
      draw(now);
      const a = anim.current;
      const rings = a.to === 'shown' ? ringsTotal(latest.current.matched.length) : 0;
      if (now - a.t0 < SM_FADE_MS || now - a.ringT0 < rings) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, [draw]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    setWidth(Math.floor(el.clientWidth));
    const ro = new ResizeObserver(() => setWidth(Math.floor(el.clientWidth)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The fill-in. Under reduced motion all 5,000 are there at once.
  useEffect(() => {
    if (!reveal || width === 0) return;
    if (reduced) {
      visible.current = n;
      draw(performance.now());
      onRevealed();
      return;
    }
    let id = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / SM_REVEAL_MS, 1);
      visible.current = Math.round(n * (1 - (1 - p) * (1 - p)));
      draw(now);
      if (p < 1) id = requestAnimationFrame(tick);
      else onRevealed();
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reveal, width > 0]);

  // A new stage: the dots that leave fade (SM_FADE_MS), the rings land. A resize redraws what is already there.
  useEffect(() => {
    if (visible.current === 0) return;
    const a = anim.current;
    if (a.to !== stage) {
      if (reduced || visible.current < n) anim.current = { from: stage, to: stage, t0: NEVER, ringT0: NEVER };
      else {
        const now = performance.now();
        anim.current = { from: a.to, to: stage, t0: now, ringT0: stage === 'shown' ? now : a.ringT0 };
      }
      cache.current = null;
    }
    if (reduced || performance.now() - anim.current.t0 >= SM_FADE_MS) draw(performance.now());
    else play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, shareRows, matched, draw]);

  return (
    <div ref={wrap} className="sm-dots" data-testid="sim-dots">
      <canvas
        ref={ref}
        role="img"
        aria-label={COPY.canvasLabel(COPY.canvasStage[stage])}
        style={{ width: '100%', height }}
        data-testid="sim-canvas"
      />
    </div>
  );
}
