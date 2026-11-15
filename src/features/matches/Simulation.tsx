/**
 * The 30-second simulation screen (MIN-4507; motion and euro outcome MIN-4608, spec docs/design/simulations-motion-spec.md).
 * One linear clock drives the whole screen: matches land one at a time, the counters tick, the two rates and the euro figure
 * move with the data and hold on the outcome frame. The permanent label, the assumption and the sources are static and on
 * screen the whole run. The chart is a few lines of SVG, no library. Under `prefers-reduced-motion` it shows the finished
 * state, starts no timer and has no replay.
 */
import { Flask } from '@phosphor-icons/react';
import { memo, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import simulationJson from '../../../data/synthetic/simulation.json';
import { COPY } from './copy';
import {
  clockAt, decimalsOf, effectIndex, formatEuro, formatPct, formatPerInhabitant, formatTotal, hasDropped, isModel, matchesAt,
  networkIndex, niceAxis, parseSimulation, shownDrop, simDuration, valueAt, visibleCells,
  type SimEuro, type SimSeries, type SimulationData,
} from './simData';
import './matches.css';

const W = 320, H = 190, L = 38, R = 10, T = 10, B = 34;
const COLORS: Record<number, string> = { 1: 'var(--color-link)', 2: 'var(--color-info)', 3: 'var(--color-flag-text)' };
/** The entry stagger (Pix step 1): the position of an element in the order field, chart 1, chart 2, chart 3. */
const stagger = (i: number) => ({ '--i': i }) as CSSProperties;

/** One clock, in milliseconds from the first frame. Time based, so a hidden tab that comes back shows the state for the current time. */
function useClock(duration: number, run: number, still: boolean, at?: number) {
  const [t, setT] = useState(still ? duration : at ?? 0);
  useEffect(() => {
    if (still) return setT(duration);
    if (at !== undefined) return setT(at);
    let raf = 0;
    const t0 = performance.now();
    setT(0);
    // performance.now() and not the frame timestamp: that one can lag the real clock by hundreds of ms in a throttled or just-shown page.
    const tick = () => {
      const next = Math.min(Math.max(performance.now() - t0, 0), duration);
      setT(next);
      if (next < duration) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration, run, still, at]);
  return t;
}

/** The match field: a schematic of counts, one cell per synthetic record in the full network. It only changes at step edges, so it is memoised. */
const Field = memo(function Field({ total, visible, matched }: { total: number; visible: number; matched: number }) {
  const shown = Math.max(visible, matched);
  return (
    <div className="sim-field sim-enter" style={stagger(0)} aria-hidden="true" data-testid="sim-field">
      {Array.from({ length: total }, (_, i) => <i key={i} className={i < matched ? 'on m' : i < shown ? 'on' : undefined} />)}
    </div>
  );
});

function Chart({ s, xs, xLabel, idx, landed, order, assumption }: {
  s: SimSeries; xs: number[]; xLabel: string; idx: number; landed: boolean; order: number; assumption?: string;
}) {
  const n = xs.length;
  const axis = useMemo(() => niceAxis(Math.max(...s.values)), [s]);
  const x = (i: number) => L + (i * (W - L - R)) / (n - 1);
  const y = (v: number) => T + (H - T - B) * (1 - v / axis.top);
  const step = Math.min(Math.floor(idx), n - 1);
  const value = valueAt(s.values, idx);
  const pts: [number, number][] = s.values.slice(0, step + 1).map((v, i) => [x(i), y(v)]);
  if (idx > step) pts.push([x(idx), y(value)]);
  const d = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`).join(' ');
  const tip = pts[pts.length - 1];
  const dec = decimalsOf(s.values);
  const color = COLORS[s.id] ?? 'var(--color-text)';
  const delta = s.values[n - 1] - s.values[0];
  const model = isModel(s);
  return (
    <figure className="sim-chart" data-testid={`sim-series-${s.id}`}>
      <h2>{s.label}</h2>
      <p className="sim-unit">{s.unit}</p>
      <p className="sim-value" style={{ color }} data-testid={`sim-value-${s.id}`}>{value.toFixed(dec)}</p>
      <svg className="sim-svg sim-enter" style={stagger(order)} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${s.label}, ${s.unit}, over ${xLabel}`}>
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
        {model && landed && (
          <g data-testid={`sim-baseline-${s.id}`}>
            <rect className="baseline" x={L} y={y(s.values[0]) - 0.5} width={W - L - R} height={1} />
            <text className="delta" x={W - R} y={y(s.values[0]) - 6} textAnchor="end" data-testid={`sim-delta-${s.id}`}>
              {`${delta < 0 ? '−' : '+'}${Math.abs(delta).toFixed(dec)}`}
            </text>
          </g>
        )}
        <path className={model ? 'line model' : 'line'} d={d} stroke={color} />
        {tip && <circle className="tip" cx={tip[0]} cy={tip[1]} r={4} fill={color} />}
      </svg>
      {assumption && <p className="sim-assume" data-testid={`sim-assumption-${s.id}`}>{assumption}</p>}
    </figure>
  );
}

/** The euro outcome. Every amount is derived from one shown value, `drop` (points of health spending), and the file's totals, so the arithmetic on the screen checks out in every frame. */
function EuroOutcome({ euro, drop, assumption }: { euro: SimEuro; drop: number; assumption?: string }) {
  const amount = formatEuro((drop / 100) * euro.total_mio_eur);
  const { geography, year } = euro;
  return (
    <div className="sim-right" data-testid="sim-euro">
      <p className="sim-kicker">{COPY.simKicker}</p>
      <p className="sim-fig sim-enter" style={stagger(0)} data-testid="sim-euro-figure">{amount}</p>
      <p className="sim-year">{COPY.simUnitYear}</p>
      <p className="sim-perhab" data-testid="sim-euro-hab">
        {COPY.simPerInhabitant({ amount: formatPerInhabitant((drop / 100) * euro.total_eur_per_inhabitant) })}
      </p>
      <p className="sim-outcome" data-testid="sim-euro-outcome">{COPY.simOutcome({ amount, geography, year })}</p>
      <p className="sim-formula" data-testid="sim-euro-formula">
        {COPY.simFormula({ drop: drop.toFixed(2), total: formatTotal(euro.total_mio_eur), geography, year, amount })}
      </p>
      <p className="sim-source" data-testid="sim-euro-source">
        {COPY.simSourceLead}{' '}
        <a href={euro.source.url} target="_blank" rel="noreferrer noopener">{COPY.simSourceLink({ geography, year })}</a>.
      </p>
      {assumption && <p className="sim-assume" data-testid="sim-assumption">{assumption}</p>}
    </div>
  );
}

/** `at` freezes the clock at that many milliseconds (for tests and review); the screen itself never passes it. */
export function SimulationView({ data, run, reduced, onReplay, at }: { data: SimulationData; run: number; reduced: boolean; onReplay: () => void; at?: number }) {
  const n = data.x.values.length;
  const duration = simDuration(n);
  const t = useClock(duration, run, reduced, at);
  const frame = clockAt(t, n);
  const done = frame.done;
  const xs = data.x.values;
  const modelled = data.series.some(isModel);
  const sources = data.series.flatMap((s) => (isModel(s) ? s.sources ?? [] : []));
  const { matches } = data;
  // The euro figure is the drop of series 3: it is never on screen without that chart (CEO seat, condition 4).
  const euro = data.series.some((s) => s.id === 3 && isModel(s)) ? data.euro : undefined;
  const effect = data.assumption.effect;
  const hero = Boolean(matches || euro);
  const assumption = modelled ? COPY.simAssumption({ start: formatPct(data.assumption.start), ceiling: formatPct(data.assumption.ceiling) }) : undefined;
  const drop = euro ? shownDrop(euro.drop_pts, frame.idx) : 0;
  const network = xs[networkIndex(frame)];
  return (
    <main className="sim" data-testid="simulation" data-state={done ? 'done' : 'playing'}>
      <p className="sim-label" role="note" data-testid="sim-label">
        <Flask size={20} weight="bold" aria-hidden="true" />
        {COPY.simLabel}
      </p>
      <div className="sim-inner" key={run}>
      <header className="sim-head">
        <div>
          <h1>{COPY.simTitle}</h1>
          <p>{COPY.simCaption}</p>
        </div>
        <p className="sim-clock" data-testid="sim-x">
          <small>{data.x.label}</small>
          {network}
        </p>
      </header>
      {hero && (
        <div className="sim-hero" data-testid="sim-hero" data-landed={frame.landed} data-cols={matches && euro ? 2 : 1}>
          {matches && (
            <div className="sim-left">
              <div className="sim-stats">
                <p className="sim-stat sim-stat-net" data-testid="sim-x-hero">
                  <span className="sim-stat-label">{data.x.label}</span>
                  <span className="sim-stat-n">{network}</span>
                </p>
                <p className="sim-stat" data-testid="sim-matches">
                  <span className="sim-stat-label">{COPY.simMatchesSoFar}</span>{' '}
                  <span className="sim-stat-n sim-enter" style={stagger(0)}>{matchesAt(frame, matches.count)}</span>
                </p>
              </div>
              <Field total={xs[n - 1]} visible={visibleCells(frame, xs)} matched={matchesAt(frame, matches.count)} />
              {effect && (
                <p className="sim-effect" data-testid="sim-effect">
                  {COPY.simEffectOfMatch} <strong>{formatPct(effect[effectIndex(frame)])}</strong>
                </p>
              )}
              {!euro && assumption && <p className="sim-assume" data-testid="sim-assumption">{assumption}</p>}
            </div>
          )}
          {euro && <EuroOutcome euro={euro} drop={drop} assumption={assumption} />}
        </div>
      )}
      <div className="sim-grid" data-count={data.series.length}>
        {data.series.map((s, i) => (
          <Chart
            key={s.id} s={s} xs={xs} xLabel={data.x.label} idx={frame.idx} landed={frame.landed} order={i + 1}
            assumption={s.id !== 1 ? assumption : undefined}
          />
        ))}
      </div>
      <footer className="sim-foot">
        {!hero && assumption && <p data-testid="sim-assumption">{assumption}</p>}
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

/** The data could not be read: the label stays, one card with the existing sentence, no hero and no charts. */
export function SimulationUnavailable() {
  return (
    <main className="sim" data-testid="simulation">
      <p className="sim-label" role="note" data-testid="sim-label"><Flask size={20} weight="bold" aria-hidden="true" />{COPY.simLabel}</p>
      <div className="sim-inner">
        <p className="sim-error" role="alert">The simulation data could not be read.</p>
      </div>
    </main>
  );
}

export default function Simulation() {
  const [run, setRun] = useState(0);
  const reduced = useRef(reducedMotion()).current;
  if (!PARSED.ok) return <SimulationUnavailable />;
  return <SimulationView data={PARSED.data} run={run} reduced={reduced} onReplay={() => setRun((r) => r + 1)} />;
}
