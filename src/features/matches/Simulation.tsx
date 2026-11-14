/**
 * The 30-second simulation screen (MIN-4507): plays `simulation.json` once, on load, with one "Play again" control.
 * The permanent label, the assumption and the sources are static and on screen the whole run. The chart is a few lines of
 * SVG, no library. Under `prefers-reduced-motion` it shows the finished state and has no replay.
 */
import { Flask } from '@phosphor-icons/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import simulationJson from '../../../data/synthetic/simulation.json';
import { COPY } from './copy';
import {
  SIM_DURATION_MS, assumptionPct, decimalsOf, frameAt, hasDropped, isModel, niceAxis, parseSimulation,
  type SimSeries, type SimulationData,
} from './simData';
import './matches.css';

const W = 320, H = 190, L = 38, R = 10, T = 10, B = 34;
const COLORS: Record<number, string> = { 1: 'var(--teal)', 2: 'var(--slate)', 3: 'var(--amber-ink)' };

function useProgress(duration: number, run: number, still: boolean) {
  const [p, setP] = useState(still ? 1 : 0);
  useEffect(() => {
    if (still) return setP(1);
    let raf = 0;
    const t0 = performance.now();
    setP(0);
    const tick = (now: number) => {
      const next = Math.min((now - t0) / duration, 1);
      setP(next);
      if (next < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration, run, still]);
  return p;
}

function Chart({ s, xs, xLabel, p }: { s: SimSeries; xs: number[]; xLabel: string; p: number }) {
  const n = xs.length;
  const { step, frac } = frameAt(p, n);
  const axis = useMemo(() => niceAxis(Math.max(...s.values)), [s]);
  const x = (i: number) => L + (i * (W - L - R)) / (n - 1);
  const y = (v: number) => T + (H - T - B) * (1 - v / axis.top);
  const pts: [number, number][] = s.values.slice(0, step + 1).map((v, i) => [x(i), y(v)]);
  if (frac > 0) pts.push([x(step + frac), y(s.values[step] + (s.values[step + 1] - s.values[step]) * frac)]);
  const d = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`).join(' ');
  const tip = pts[pts.length - 1];
  const dec = decimalsOf(s.values);
  const color = COLORS[s.id] ?? 'var(--color-text)';
  return (
    <figure className="sim-chart" data-testid={`sim-series-${s.id}`}>
      <h2>{s.label}</h2>
      <p className="sim-unit">{s.unit}</p>
      <p className="sim-value" style={{ color }} data-testid={`sim-value-${s.id}`}>{s.values[step].toFixed(dec)}</p>
      <svg className="sim-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${s.label}, ${s.unit}, over ${xLabel}`}>
        {axis.ticks.map((t) => (
          <g key={t}>
            <line className={t === 0 ? 'axis' : 'grid'} x1={L} x2={W - R} y1={y(t)} y2={y(t)} />
            <text x={L - 6} y={y(t) + 4} textAnchor="end">{t}</text>
          </g>
        ))}
        <line className="axis" x1={L} x2={L} y1={T} y2={H - B} />
        <text x={L} y={H - B + 16} textAnchor="start">{xs[0]}</text>
        <text x={W - R} y={H - B + 16} textAnchor="end">{xs[n - 1]}</text>
        <text x={(L + W - R) / 2} y={H - 4} textAnchor="middle">{xLabel}</text>
        <path className={isModel(s) ? 'line model' : 'line'} d={d} stroke={color} />
        {tip && <circle className="tip" cx={tip[0]} cy={tip[1]} r={4} fill={color} />}
      </svg>
    </figure>
  );
}

export function SimulationView({ data, run, reduced, onReplay }: { data: SimulationData; run: number; reduced: boolean; onReplay: () => void }) {
  const p = useProgress(SIM_DURATION_MS, run, reduced);
  const done = p >= 1;
  const n = data.x.values.length;
  const { step } = frameAt(p, n);
  const modelled = data.series.some(isModel);
  const sources = data.series.flatMap((s) => (isModel(s) ? s.sources ?? [] : []));
  return (
    <main className="sim" data-testid="simulation" data-state={done ? 'done' : 'playing'}>
      <p className="sim-label" role="note" data-testid="sim-label">
        <Flask size={20} weight="bold" aria-hidden="true" />
        {COPY.simLabel}
      </p>
      <div className="sim-inner">
      <header className="sim-head">
        <div>
          <h1>{COPY.simTitle}</h1>
          <p>{COPY.simCaption}</p>
        </div>
        <p className="sim-clock" data-testid="sim-x">
          <small>{data.x.label}</small>
          {data.x.values[step]}
        </p>
      </header>
      <div className="sim-grid" data-count={data.series.length}>
        {data.series.map((s) => <Chart key={s.id} s={s} xs={data.x.values} xLabel={data.x.label} p={p} />)}
      </div>
      <footer className="sim-foot">
        {modelled && <p data-testid="sim-assumption"><strong>{COPY.simAssumption(assumptionPct(data))}</strong></p>}
        {sources.length > 0 && (
          <p data-testid="sim-sources">
            {COPY.simSourcesPrefix}{' '}
            {sources.map((src, i) => (
              <span key={src.url}>
                {i > 0 && '; '}
                <a href={src.url} target="_blank" rel="noreferrer noopener">{src.name}</a>
              </span>
            ))}
          </p>
        )}
        {hasDropped(data) && <p className="muted" data-testid="sim-dropped">{COPY.simDropped}</p>}
      </footer>
      {!reduced && (
        <p className="sim-actions">
          <button type="button" className="btn" disabled={!done} onClick={onReplay} data-testid="sim-replay">{COPY.simReplay}</button>
        </p>
      )}
      </div>
    </main>
  );
}

const PARSED = parseSimulation(simulationJson);
const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Simulation() {
  const [run, setRun] = useState(0);
  const reduced = useRef(reducedMotion()).current;
  if (!PARSED.ok) {
    return (
      <main className="sim" data-testid="simulation">
        <p className="sim-label" role="note" data-testid="sim-label"><Flask size={20} weight="bold" aria-hidden="true" />{COPY.simLabel}</p>
        <p className="muted" role="alert">The simulation data could not be read.</p>
      </main>
    );
  }
  return <SimulationView data={PARSED.data} run={run} reduced={reduced} onReplay={() => setRun((n) => n + 1)} />;
}
