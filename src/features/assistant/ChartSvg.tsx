/**
 * The chart of one series (MIN-4664, moved out of OverTime.tsx so the card and any list share it). Inline SVG, drawn from
 * `buildChart`, which rebuilds the dashed line from the server's numbers. Circle: within the printed range or none printed.
 * Diamond: outside the printed range (a shape, never a colour for good or bad). Every result has a 44 x 44 hit target that
 * opens its source. The chart is a picture of the table beside it: the screen reader reads the table.
 */
import { useEffect, useRef, useState } from 'react';
import type { OverTimeSeries } from './analysis.contract';
import { buildChart, fmtNum } from './analysis';
import { formatDate } from './record';

export const CHART_H = 176;
const PAD = { l: 38, r: 10, t: 10, b: 26 };
const DEFAULT_W = 440;

/** The inner width of an element, so the plot is computed at its real size and the tap targets are not scaled down with it. */
export function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T | null>(null);
  const [w, setW] = useState(DEFAULT_W);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setW((prev) => { const n = Math.round(el.clientWidth); return n >= 200 && n !== prev ? n : prev; });
    read();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

export function ChartSvg({ s, width = DEFAULT_W, height = CHART_H, onOpenCite }: { s: OverTimeSeries; width?: number; height?: number; onOpenCite(cite: string): void }) {
  const c = buildChart(s, width, height, PAD);
  const path = c.points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  return (
    <svg className="ot-chart" width={c.w} height={c.h} viewBox={`0 0 ${c.w} ${c.h}`} role="img" aria-label={`${s.analyte}, ${s.points.length} results in date order, with the printed range and the straight line. The table below lists them.`} data-testid="ot-chart">
      {c.yTicks.map((t) => <line key={'g' + t.text} className="ot-grid" x1={c.plot.x0} y1={t.y} x2={c.plot.x1} y2={t.y} />)}
      {c.band && <rect className="ot-band" x={c.plot.x0} y={Math.min(c.band.y1, c.band.y2)} width={c.plot.x1 - c.plot.x0} height={Math.abs(c.band.y2 - c.band.y1)} data-testid="ot-band" />}
      {c.bandEdges.map((y, i) => <line key={'e' + i} className="ot-band-edge" x1={c.plot.x0} y1={y} x2={c.plot.x1} y2={y} />)}
      {c.yTicks.map((t) => <text key={t.text} className="ot-tick" x={c.plot.x0 - 6} y={t.y + 4} textAnchor="end">{t.text}</text>)}
      {c.xTicks.map((t) => <text key={t.text + t.x} className="ot-tick" x={t.x} y={c.h - 6} textAnchor={t.anchor}>{t.text}</text>)}
      <path className="ot-join" d={path} fill="none" data-testid="ot-join" />
      {c.line && <line className="ot-line" x1={c.line.x1} y1={c.line.y1} x2={c.line.x2} y2={c.line.y2} data-testid="ot-line" />}
      {c.line && <circle className="ot-end" cx={c.line.x2} cy={c.line.y2} r="4.5" data-testid="ot-horizon-point" />}
      {c.points.map((p, i) => {
        const open = () => onOpenCite(p.cite);
        const pt = s.points[i];
        const label = `${s.analyte} ${fmtNum(p.value)}${s.unit ? ' ' + s.unit : ''}, ${formatDate(p.date)}${p.outside ? ', outside the printed range' : ''}. Open source`;
        return (
          <g key={p.cite} className="ot-point" role="button" tabIndex={0} aria-label={label} onClick={open} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } }} data-testid="ot-point" data-outside={p.outside ? 'true' : undefined} data-cite={pt.cite}>
            <circle className="ot-hit" cx={p.x} cy={p.y} r="22" />
            {p.outside
              ? <polygon className="ot-pt ot-pt-out" points={`${p.x},${p.y - 6.5} ${p.x + 6.5},${p.y} ${p.x},${p.y + 6.5} ${p.x - 6.5},${p.y}`} />
              : <circle className="ot-pt" cx={p.x} cy={p.y} r="5" />}
          </g>
        );
      })}
    </svg>
  );
}
