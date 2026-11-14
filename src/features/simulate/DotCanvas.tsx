/**
 * The 5,000 records as dots on ONE canvas (not 5,000 elements). Dot colour is the generator's seeded group, for looks only:
 * the matcher never reads it. Drawing is batched per group and brightness level, so a frame is about 42 fills.
 * Tapping a dot is out of scope (MIN-4594); the canvas is an image with a text label.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { COPY } from './copy';
import type { RunFile } from './matcher';

export type Stage = keyof typeof COPY.canvasStage;

/** One colour per seeded group, same hues as the How it works prototype. Canvas cannot read CSS variables per dot. */
const GROUP_COLORS: Record<string, string> = {
  type2_diabetes_metabolic: '#0E7C86', inflammatory_back_pain: '#3E5C8A', hypothyroid: '#B4531A', rheumatoid_arthritis: '#7A4EA3',
  iron_deficiency: '#B02A5B', low_bone_density: '#2F7D3A', lupus_like: '#8A6D00', gout: '#1F6FB5', hyperthyroid: '#C2410C',
  reduced_kidney_function: '#5B6B70', rare_myopathy: '#A21CAF', rare_sarcoid_like: '#0F766E', rare_copper_metabolism: '#92400E',
  noise: '#B9C4C3',
};
export const colorOfGroup = (g: string) => GROUP_COLORS[g] ?? '#B9C4C3';

const REVEAL_MS = 1400;
const PAD = 12; // room for the rings at the edges
const ALPHA = [1, 0.45, 0.1] as const; // bright, mid, faded

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

export function DotCanvas({ run, stage, reveal, reduced, shareRows, matched, onRevealed }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const visible = useRef(0);
  const latest = useRef({ stage, shareRows, matched });
  latest.current = { stage, shareRows, matched };
  const n = run.records.length;
  const cell = width < 520 ? 6 : 8;
  const cols = Math.max(1, Math.floor((width - 2 * PAD) / cell));
  const rows = Math.ceil(n / cols);
  const height = rows * cell + 2 * PAD;

  const byGroup = useRef<number[][]>([]);
  if (byGroup.current.length === 0) {
    byGroup.current = run.groups.map(() => []);
    run.records.forEach((r, i) => byGroup.current[r[3]].push(i)); // colour only
  }

  const draw = useCallback(() => {
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
    const { stage: st, shareRows: share, matched: hit } = latest.current;
    const shareSet = new Set(share);
    const hitSet = new Set(hit);
    const limit = visible.current;
    const level = (i: number): 0 | 1 | 2 => {
      if (st === 'all') return 0;
      if (st === 'opted') return run.records[i][2] ? 0 : 2;
      if (st === 'share') return shareSet.has(i) ? 0 : 2;
      const focus = hit.length > 0 ? hitSet : shareSet; // exact and shown: the group, or where the search stopped
      return focus.has(i) ? 0 : shareSet.has(i) ? 1 : 2;
    };
    const r = cell * 0.36;
    byGroup.current.forEach((rowsOfGroup, g) => {
      const paths = [new Path2D(), new Path2D(), new Path2D()];
      for (const i of rowsOfGroup) {
        if (i >= limit) continue;
        const x = PAD + (i % cols) * cell + cell / 2;
        const y = PAD + Math.floor(i / cols) * cell + cell / 2;
        const p = paths[level(i)];
        p.moveTo(x + r, y);
        p.arc(x, y, r, 0, Math.PI * 2);
      }
      ctx.fillStyle = colorOfGroup(run.groups[g]);
      paths.forEach((p, l) => {
        ctx.globalAlpha = ALPHA[l];
        ctx.fill(p);
      });
    });
    ctx.globalAlpha = 1;
    if (st === 'shown' && limit >= n) {
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = cssVar('--ink', '#12303A');
      ctx.fillStyle = cssVar('--ink', '#12303A');
      ctx.font = `600 12px ${cssVar('--font-sans', 'system-ui, sans-serif')}`;
      ctx.textAlign = 'center';
      hit.forEach((i, k) => {
        const x = PAD + (i % cols) * cell + cell / 2;
        const y = PAD + Math.floor(i / cols) * cell + cell / 2;
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillText(String(k + 1), x, Math.max(10, y - 13));
      });
    }
  }, [width, height, cols, cell, n, run]);

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
      draw();
      onRevealed();
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / REVEAL_MS, 1);
      visible.current = Math.round(n * (1 - (1 - p) * (1 - p)));
      draw();
      if (p < 1) raf = requestAnimationFrame(tick);
      else onRevealed();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reveal, width > 0]);

  // A new stage or a resize redraws what is already there.
  useEffect(() => {
    if (visible.current > 0) draw();
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
