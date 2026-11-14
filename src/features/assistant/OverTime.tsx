/**
 * MIN-4552, direction 4: the "Over time" panel, in the doctor's workspace next to the overview. Everything shown comes
 * from `healthapp-over-time` (calculated in code, no model, nothing stored). One row per value that has a series; opening
 * it shows the results in date order, the printed range as a band, results outside it marked by a shape (diamond), an
 * icon and a word, and the one dashed straight line with its permanent label. Doctor view only: this file is in the lazy
 * assistant chunk, so no patient screen can render it. No direction words, no score, no colour for good or bad.
 */
import { Circle, Diamond } from '@phosphor-icons/react';
import { CitationChip } from '../../components/CitationChip';
import { EmptyState, Spinner } from '../../components/Primitives';
import type { OverTimeResponse, OverTimeSeries } from './analysis.contract';
import { flagWord, NOT_ENOUGH, buildChart, fmtNum, outOfRangeLine, projectionLabel, rangeWords, type Chart } from './analysis';
import { formatDate, type RecordIndex } from './record';

export type OverTimeState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: OverTimeResponse };

interface ViewProps {
  state: OverTimeState;
  index: Pick<RecordIndex, 'resolve'>;
  openCite: string | null;
  onOpenCite(cite: string): void;
  onRetry?(): void;
}

/** Presentational and pure, so every state can be rendered in a test. */
export function OverTimeView({ state, index, openCite, onOpenCite, onRetry }: ViewProps) {
  const tag = state.status === 'ready' ? (state.data.series.length ? 'series' : 'empty') : state.status;
  return (
    <section className="ot-panel" aria-labelledby="ot-title" data-testid="over-time" data-state={tag}>
      <h2 id="ot-title">Over time</h2>
      {state.status === 'loading' && <p data-testid="over-time-loading"><Spinner label="Loading the results over time" /></p>}
      {state.status === 'error' && (
        <div data-testid="over-time-error">
          <p className="muted">The results over time could not be loaded.</p>
          {onRetry && <button type="button" className="btn as-btn" onClick={onRetry} data-testid="over-time-retry">Try again</button>}
        </div>
      )}
      {state.status === 'ready' && state.data.series.length === 0 && (
        <EmptyState><span data-testid="over-time-empty">No value in this record has two or more dated results, so there is no series to show.</span></EmptyState>
      )}
      {state.status === 'ready' && state.data.series.length > 0 && (
        <>
          <ul className="ot-list">
            {state.data.series.map((s) => <li key={s.key + (s.unit ?? '')}><SeriesRow s={s} index={index} openCite={openCite} onOpenCite={onOpenCite} /></li>)}
          </ul>
          <p className="ot-counts mono" data-testid="over-time-counts">
            Records read {state.data.counts.records_read}, values with a series {state.data.counts.values_with_series}, projections {state.data.counts.projections_computed}, series excluded {state.data.counts.series_excluded}, errors {state.data.counts.errors}.
          </p>
        </>
      )}
    </section>
  );
}

function SeriesRow({ s, index, openCite, onOpenCite }: { s: OverTimeSeries; index: ViewProps['index']; openCite: string | null; onOpenCite(c: string): void }) {
  const chart = buildChart(s);
  const proj = s.projection;
  const first = s.points[0].date;
  const last = s.points[s.points.length - 1].date;
  return (
    <details className="ot-series" data-testid="ot-series" data-analyte={s.key}>
      <summary>
        <span className="ot-name">{s.analyte}</span>
        <span className="ot-sub">{s.unit ? s.unit + ', ' : ''}{s.points.length} results, {formatDate(first)} to {formatDate(last)}</span>
      </summary>
      <div className="ot-body">
        <ChartSvg chart={chart} s={s} onOpenCite={onOpenCite} />
        <p className="ot-key muted">Circle: a result within the printed range, or with none printed. Diamond: a result outside its printed range.{chart.band ? ' Shaded band: the range printed on the latest result.' : ''}{chart.rangesDiffer ? ' The printed range differs between documents.' : ''}{proj ? ' Open circle: where the dashed line ends.' : ''}</p>
        <p className="ot-out" data-testid="ot-out-of-range">{outOfRangeLine(s)}</p>
        {proj ? (
          <div className="ot-proj" data-testid="ot-projection">
            <svg className="ot-swatch" width="36" height="8" viewBox="0 0 36 8" aria-hidden="true"><line x1="0" y1="4" x2="36" y2="4" stroke="currentColor" strokeWidth="2" strokeDasharray="5 4" /></svg>
            <div>
              <p data-testid="ot-projection-label">{projectionLabel(proj.n, first, last)}</p>
              <p className="ot-horizon">The line ends at {fmtNum(proj.value_at_horizon)}{s.unit ? ' ' + s.unit : ''} on {formatDate(proj.horizon_date)}.</p>
            </div>
          </div>
        ) : (
          <p className="muted" data-testid="ot-no-projection">{NOT_ENOUGH}</p>
        )}
        <table className="as-table ot-table" data-testid="ot-table">
          <thead><tr><th scope="col">Date</th><th scope="col">Result</th><th scope="col">Printed range</th><th scope="col">Source</th></tr></thead>
          <tbody>
            {s.points.map((p, i) => {
              const src = index.resolve(p.cite);
              const outside = p.out_of_range === true;
              return (
                <tr key={p.cite} data-outside={outside ? 'true' : undefined}>
                  <th scope="row">{formatDate(p.date)}</th>
                  <td className="mono">
                    {fmtNum(p.value)}{s.unit ? ' ' + s.unit : ''}
                    <span className="as-flag ot-flag">{outside ? <Diamond size={12} weight="fill" aria-hidden="true" /> : <Circle size={12} weight="bold" aria-hidden="true" />} {flagWord(p.out_of_range)}</span>
                  </td>
                  <td className="mono">{rangeWords(p)}</td>
                  <td>{src ? <CitationChip n={i + 1} record={{ name: src.name, date: src.date, provenance: src.provenance }} open={openCite === p.cite} onOpen={() => onOpenCite(p.cite)} /> : <span className="muted">not available</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/** The chart is a picture of the table below it (which has the same points, with sources): the screen reader reads the table. */
function ChartSvg({ chart: c, s, onOpenCite }: { chart: Chart; s: OverTimeSeries; onOpenCite(c: string): void }) {
  return (
    <svg className="ot-chart" viewBox={`0 0 ${c.w} ${c.h}`} role="img" aria-label={`${s.analyte}, ${s.points.length} results in date order, with the printed range and the straight line. The table below lists them.`} data-testid="ot-chart">
      {c.band && <rect className="ot-band" x={c.plot.x0} y={Math.min(c.band.y1, c.band.y2)} width={c.plot.x1 - c.plot.x0} height={Math.abs(c.band.y2 - c.band.y1)} data-testid="ot-band" />}
      <line className="ot-axis" x1={c.plot.x0} y1={c.plot.y1} x2={c.plot.x1} y2={c.plot.y1} />
      <line className="ot-axis" x1={c.plot.x0} y1={c.plot.y0} x2={c.plot.x0} y2={c.plot.y1} />
      {c.yTicks.map((t) => <text key={t.text} className="ot-tick" x={c.plot.x0 - 6} y={t.y + 4} textAnchor="end">{t.text}</text>)}
      {c.xTicks.map((t) => <text key={t.text + t.x} className="ot-tick" x={t.x} y={c.h - 8} textAnchor={t.anchor}>{t.text}</text>)}
      {c.line && <line className="ot-line" x1={c.line.x1} y1={c.line.y1} x2={c.line.x2} y2={c.line.y2} data-testid="ot-line" />}
      {c.line && <circle className="ot-end" cx={c.line.x2} cy={c.line.y2} r="4" data-testid="ot-horizon-point" />}
      {c.points.map((p) => p.outside
        ? <rect key={p.cite} className="ot-pt ot-pt-out" x={p.x - 5} y={p.y - 5} width="10" height="10" transform={`rotate(45 ${p.x} ${p.y})`} onClick={() => onOpenCite(p.cite)} data-testid="ot-point" data-outside="true" />
        : <circle key={p.cite} className="ot-pt" cx={p.x} cy={p.y} r="4.5" onClick={() => onOpenCite(p.cite)} data-testid="ot-point" />)}
    </svg>
  );
}
