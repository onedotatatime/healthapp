/**
 * MIN-4552 direction 4, as the dashboard of MIN-4664: one chart card per value that has a series, from the one
 * `healthapp-over-time` answer (calculated in code, no model, nothing stored). Each card: the printed range as a band,
 * results outside it marked by a shape (diamond), an icon and a word, the one dashed straight line with its permanent
 * label, and the results as a table (the text alternative, with a source chip per row). Doctor view only: this file is in
 * the lazy assistant chunk, so no patient screen can render it. No direction words, no score, no colour for good or bad.
 */
import { Circle, Diamond, Info, Table } from '@phosphor-icons/react';
import { CitationChip } from '../../components/CitationChip';
import { EmptyState, Spinner } from '../../components/Primitives';
import type { OverTimeResponse, OverTimeSeries } from './analysis.contract';
import { CAP_NOTICE, CARDS_SHOWN, RECORD_ROW_CAP, flagChips, flagWord, NOT_ENOUGH, buildChart, fmtNum, orderSeries, outOfRangeLine, projectionLabel, rangeWords } from './analysis';
import { CHART_H, ChartSvg, useWidth } from './ChartSvg';
import { formatDate, type RecordIndex } from './record';

export type OverTimeState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: OverTimeResponse };

interface ViewProps {
  state: OverTimeState;
  index: Pick<RecordIndex, 'resolve'>;
  openCite: string | null;
  onOpenCite(cite: string): void;
  onRetry?(): void;
  /** "Show all N values" is open. Controlled by the board so a flag chip can open it. */
  expanded?: boolean;
  onToggleExpanded?(): void;
}

/** Presentational and pure, so every state can be rendered in a test. */
export function OverTimeView({ state, index, openCite, onOpenCite, onRetry, expanded = false, onToggleExpanded }: ViewProps) {
  const tag = state.status === 'ready' ? (state.data.series.length ? 'series' : 'empty') : state.status;
  const ordered = state.status === 'ready' ? orderSeries(state.data.series) : [];
  const shown = expanded ? ordered : ordered.slice(0, CARDS_SHOWN);
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
      {state.status === 'ready' && ordered.length > 0 && (
        <>
          <Legend />
          <ul className="cc-grid" data-testid="chart-grid">
            {shown.map((s) => <li key={s.key + (s.unit ?? '')} id={`chart-${s.key}`}><ChartCard s={s} index={index} openCite={openCite} onOpenCite={onOpenCite} /></li>)}
          </ul>
          {ordered.length > CARDS_SHOWN && (
            <div className="show-all">
              {!expanded && <p data-testid="show-all-line">Showing {CARDS_SHOWN} of {ordered.length} values with two or more dated results.</p>}
              <button type="button" className="btn as-btn" onClick={onToggleExpanded} aria-expanded={expanded} data-testid="show-all">{expanded ? 'Show fewer' : `Show all ${ordered.length} values`}</button>
            </div>
          )}
          <p className="ot-counts footer-counts" data-testid="over-time-counts">
            Records read {state.data.counts.records_read}, values with a series {state.data.counts.values_with_series}, projections {state.data.counts.projections_computed}, series excluded {state.data.counts.series_excluded}, errors {state.data.counts.errors}.
          </p>
        </>
      )}
      {state.status === 'ready' && state.data.counts.records_read >= RECORD_ROW_CAP && <p className="cap-notice" role="note" data-testid="cap-notice"><Info size={18} weight="bold" aria-hidden="true" /> {CAP_NOTICE}</p>}
    </section>
  );
}

/** The key, once above the grid. */
function Legend() {
  return (
    <ul className="legend" data-testid="chart-key">
      <li><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="var(--color-link)" /></svg>Within the printed range, or none printed</li>
      <li><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><polygon points="8,1.5 14.5,8 8,14.5 1.5,8" fill="var(--color-flag-text)" /></svg>Outside the printed range</li>
      <li><svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true"><rect x="0" y="2" width="22" height="10" fill="var(--color-surface-quiet)" stroke="var(--color-border-strong)" /></svg>The range printed on the latest result</li>
      <li><svg width="26" height="6" viewBox="0 0 26 6" aria-hidden="true"><line x1="0" y1="3" x2="26" y2="3" stroke="var(--color-link)" strokeWidth="2" strokeDasharray="5 4" /></svg>Straight line</li>
    </ul>
  );
}

function ChartCard({ s, index, openCite, onOpenCite }: { s: OverTimeSeries; index: ViewProps['index']; openCite: string | null; onOpenCite(c: string): void }) {
  const [plotRef, width] = useWidth<HTMLDivElement>();
  const chart = buildChart(s);
  const proj = s.projection;
  const first = s.points[0].date;
  const last = s.points[s.points.length - 1].date;
  const latest = s.points[s.points.length - 1];
  const printed = latest.ref_low !== null || latest.ref_high !== null;
  return (
    <article className="cc" data-testid="chart-card" data-analyte={s.key} aria-label={s.analyte}>
      <div className="cc-head">
        <h3>{s.analyte}</h3>
        <span className="cc-latest mono" data-testid="cc-latest">{fmtNum(latest.value)}{s.unit && <small>{s.unit}</small>}</span>
      </div>
      <p className="cc-sub">{s.points.length} results, {formatDate(first)} to {formatDate(last)}</p>
      {latest.out_of_range === true && <p className="cc-flag"><span className="flag-chip" data-testid="cc-flag"><Diamond size={12} weight="fill" aria-hidden="true" /> Outside the printed range</span></p>}
      <div className="cc-plot" ref={plotRef}><ChartSvg s={s} width={width} height={CHART_H} onOpenCite={onOpenCite} /></div>
      <p className="cc-range" data-testid="cc-range">{printed ? `Printed range on the latest result: ${rangeWords(latest)}.` : 'No printed range on these documents.'}{chart.rangesDiffer ? ' The printed range differs between documents.' : ''}</p>
      <p className="cc-out" data-testid="ot-out-of-range">{outOfRangeLine(s)}</p>
      {proj ? (
        <div className="cc-proj" data-testid="ot-projection">
          <svg className="ot-swatch" width="36" height="8" viewBox="0 0 36 8" aria-hidden="true"><line x1="0" y1="4" x2="36" y2="4" stroke="currentColor" strokeWidth="2" strokeDasharray="5 4" /></svg>
          <div>
            <p data-testid="ot-projection-label">{projectionLabel(proj.n, first, last)}</p>
            <p className="ot-horizon">The line ends at {fmtNum(proj.value_at_horizon)}{s.unit ? ' ' + s.unit : ''} on {formatDate(proj.horizon_date)}.</p>
          </div>
        </div>
      ) : (
        <p className="cc-noproj" data-testid="ot-no-projection">{NOT_ENOUGH}</p>
      )}
      <details data-testid="ot-series">
        <summary><Table size={18} aria-hidden="true" /> Results as a table</summary>
        <table className="as-table cc-table" data-testid="ot-table">
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
      </details>
    </article>
  );
}

/** Flags: chips that name data and nothing else, computed in the browser from the same answer (no model). A chip goes to its card. */
export function FlagsRow({ state, expandedChips = false, onToggleChips, onGoTo }: { state: OverTimeState; expandedChips?: boolean; onToggleChips?(): void; onGoTo?(key: string): void }) {
  if (state.status !== 'ready') return null;
  const chips = flagChips(state.data.series);
  const MAX = 8;
  const shown = expandedChips ? chips : chips.slice(0, MAX);
  return (
    <section className="dash-sec" aria-labelledby="flags-title" data-testid="flags">
      <h2 id="flags-title">Flags</h2>
      {chips.length === 0 ? <p className="muted" data-testid="flags-none">No value is outside its printed range.</p> : (
        <ul className="flags">
          {shown.map((c) => (
            <li key={c.key}><button type="button" className="flag-chip" onClick={() => onGoTo?.(c.key)} data-testid="flag-chip" data-analyte={c.key}><Diamond size={12} weight="fill" aria-hidden="true" /> {c.text}</button></li>
          ))}
          {chips.length > MAX && <li><button type="button" className="flag-more" onClick={onToggleChips} aria-expanded={expandedChips} data-testid="flags-more">{expandedChips ? 'Show fewer' : `${chips.length - MAX} more`}</button></li>}
        </ul>
      )}
    </section>
  );
}
