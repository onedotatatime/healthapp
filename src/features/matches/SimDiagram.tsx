/**
 * The one diagram of /simulation (MIN-4749; spec A15 of docs/design/simulations-motion-spec.md; contract: CTO, MIN-4744).
 * One card, one SVG plot (no library), five readout values and a native range slider over the plan's months 1 to 120.
 * Nothing in it moves unless the viewer drags the slider: there is no timer, no requestAnimationFrame, no CSS transition or animation,
 * no observer that changes a value. The `input` event sets one state value; the lines are memoised on the data and the width, so only the
 * cursor, the five markers and the readout are redrawn. No number is typed here: every value is read from `ten_years` (tenYears.ts).
 */
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { COPY } from './copy';
import {
  DASH, DIAGRAM, LINES, afterPlan, clampMonth, formatBillions, formatCount, formatDx, formatEuro, formatEuroCents, formatEuroWhole, formatPct, formatPerInhabitant,
  formatPoints, kindAt, lineValues, monthInYear, plotGeometry, plotted, polylinePoints, readoutAt, totalsAt, unitRefs, yearOf,
  type Basis, type Geometry, type Kind, type LineDef, type LineId, type MoneyWording, type PlotMode, type Shape, type TenYears,
} from './tenYears';

const COLOR: Record<Kind, string> = { computed: 'var(--color-link)', model: 'var(--color-flag-text)', plan: 'var(--color-info)' };

function Shaped({ shape, x, y, a, color }: { shape: Shape; x: number; y: number; a: number; color: string }) {
  if (shape === 'circle') return <circle className="shape" cx={x} cy={y} r={a} fill={color} />;
  if (shape === 'square') return <rect className="shape" x={x - a * 0.9} y={y - a * 0.9} width={a * 1.8} height={a * 1.8} fill={color} />;
  const d =
    shape === 'diamond' ? `M${x} ${y - a * 1.3}L${x + a * 1.3} ${y}L${x} ${y + a * 1.3}L${x - a * 1.3} ${y}Z`
    : shape === 'up' ? `M${x} ${y - a * 1.2}L${x + a * 1.2} ${y + a * 0.9}L${x - a * 1.2} ${y + a * 0.9}Z`
    : `M${x} ${y + a * 1.2}L${x + a * 1.2} ${y - a * 0.9}L${x - a * 1.2} ${y - a * 0.9}Z`;
  return <path className="shape" d={d} fill={color} />;
}

/** The line's glyph in the readout: its pattern and its marker, so the readout is the legend. */
function Glyph({ line, kind }: { line: LineDef; kind: Kind }) {
  return (
    <svg width="36" height="14" viewBox="0 0 36 14" aria-hidden="true" focusable="false">
      <line x1="0" y1="7" x2="24" y2="7" stroke={COLOR[kind]} strokeWidth="3" strokeDasharray={DASH[kind] === 'none' ? undefined : DASH[kind]} strokeDashoffset={line.offset} />
      <Shaped shape={line.shape} x={29} y={7} a={4.2} color={COLOR[kind]} />
    </svg>
  );
}

const lineOf = (id: LineId) => LINES.find((l) => l.id === id) as LineDef;

/** Everything that does not depend on the slider: the band, the grid, the axes and the polylines. Memoised on the data, the width and the modes. */
function Plot({ model, g, basis, mode }: { model: TenYears; g: Geometry; basis: Basis; mode: PlotMode }) {
  const values = useMemo(() => lineValues(model, basis), [model, basis]);
  const refs = useMemo(() => unitRefs(values), [values]);
  const bx = g.x(model.planLastMonth);
  const years = Array.from({ length: model.years + 1 }, (_, k) => k);
  const euro = mode === 'euro';
  return (
    <>
      <defs>
        <pattern id="sim-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="9" height="9" style={{ fill: 'var(--color-surface-quiet)' }} />
          <line x1="0" y1="0" x2="0" y2="9" style={{ stroke: 'var(--color-border-strong)' }} strokeWidth="1.5" opacity=".55" />
        </pattern>
      </defs>
      <rect x={bx} y={g.T} width={g.W - g.R + 8 - bx} height={g.H} fill="url(#sim-hatch)" data-testid="sim-band" />
      <line className="edge" x1={bx} x2={bx} y1={g.T} y2={g.T + g.H} />
      {years.map((k) => <line key={k} className="grid" x1={g.x(k * 12)} x2={g.x(k * 12)} y1={g.T} y2={g.T + g.H} />)}
      <line className="gridtop" x1={g.L} x2={g.W - g.R} y1={g.y(1)} y2={g.y(1)} />
      <line className="grid" x1={g.L} x2={g.W - g.R} y1={g.y(0.5)} y2={g.y(0.5)} />
      <line className="axis" x1={g.L} x2={g.W - g.R} y1={g.y(0)} y2={g.y(0)} />
      {euro ? (
        <>
          <text x={g.L - 6} y={g.y(0) + 4} textAnchor="end">€0</text>
          <text x={g.L - 6} y={g.y(0.5) + 4} textAnchor="end">{formatEuro(refs.euro / 2)}</text>
          <text x={g.L - 6} y={g.y(1) + 4} textAnchor="end">{formatEuro(refs.euro)}</text>
        </>
      ) : (
        <>
          <text x={g.L} y={g.T - 9}>{COPY.gScaleTop}</text>
          <text x={g.L - 6} y={g.y(0) + 4} textAnchor="end">0</text>
        </>
      )}
      {years.map((k) => (
        <g key={k}>
          <line className="tick" x1={g.x(k * 12)} x2={g.x(k * 12)} y1={g.y(0)} y2={g.y(0) + 4} />
          <text x={g.x(k * 12)} y={g.y(0) + 18} textAnchor="middle">{k}</text>
        </g>
      ))}
      <text x={(g.L + g.W - g.R) / 2} y={g.y(0) + 34} textAnchor="middle">{COPY.gAxisTitle}</text>
      {[...plotted(mode)].reverse().map((l) => {
        const ref = refs[l.unit];
        const common = { className: 'line', stroke: COLOR[l.kind], strokeWidth: l.stroke, strokeDashoffset: l.offset } as const;
        if (l.id === 'matches' && model.measuredUntil > 0 && model.measuredUntil < model.months) {
          // computed on the records up to measuredUntil (solid), a model after it (dashed): the pattern is the kind
          return (
            <g key={l.id} data-testid={`sim-line-${l.id}`}>
              <polyline {...common} points={polylinePoints(g, values.matches, ref, 0, model.measuredUntil)} strokeDasharray={undefined} />
              <polyline {...common} stroke={COLOR.model} points={polylinePoints(g, values.matches, ref, model.measuredUntil, model.months)} strokeDasharray={DASH.model} />
            </g>
          );
        }
        return <polyline key={l.id} {...common} data-testid={`sim-line-${l.id}`} points={polylinePoints(g, values[l.id], ref)} strokeDasharray={DASH[l.kind] === 'none' ? undefined : DASH[l.kind]} />;
      })}
    </>
  );
}

type Config = { plot: PlotMode; basis: Basis; money: MoneyWording };

export function SimDiagram({ model, initialMonth, config = DIAGRAM }: { model: TenYears; initialMonth?: number; config?: Config }) {
  const { plot, basis, money } = config;
  // The 10-year answer shows first (CTO): the slider starts on the last month, and a server render shows the same.
  const [month, setMonth] = useState(clampMonth(initialMonth ?? model.months, model.months));
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ W: 726, wide: true });
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const mq = matchMedia('(min-width: 900px)');
    const read = () => {
      const W = Math.round(el.clientWidth);
      setSize((s) => (W > 0 && (s.W !== W || s.wide !== mq.matches) ? { W, wide: mq.matches } : s));
    };
    read();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const g = useMemo(() => plotGeometry(size.W, size.wide, plot, model.months), [size, plot, model.months]);
  const values = useMemo(() => lineValues(model, basis), [model, basis]);
  const refs = useMemo(() => unitRefs(values), [values]);
  const staticPlot = useMemo(() => <Plot model={model} g={g} basis={basis} mode={plot} />, [model, g, basis, plot]);

  const r = readoutAt(model, basis, month);
  const tot = totalsAt(model, month);
  const showTotals = basis === 'yearly';
  const year = yearOf(month), inYear = monthInYear(month);
  const after = afterPlan(model, month);
  const cx = g.x(month);
  const per = basis === 'yearly' ? 'a year' : 'in total';
  const suf = COPY.gSuffix[basis];
  const kinds = { money: kindAt(model, 'money', month), income: kindAt(model, 'income', month), patients: kindAt(model, 'patients', month), matches: kindAt(model, 'matches', month), dx: kindAt(model, 'dx', month) };
  const valueText = COPY.gSliderValue({ year, month: inYear });
  const moneyHead = COPY.gHead.money[money];
  const text: Record<LineId, string> = { money: formatEuro(r.money), income: formatEuro(r.income), patients: formatCount(r.patients), matches: formatCount(r.matches), dx: formatDx(r.dx) };
  const moneyLine = lineOf('money');
  const rows = LINES.filter((l) => l.id !== 'money');
  const bx = g.x(model.planLastMonth);
  const desc = COPY.gDesc({
    year, month: inYear, patients: text.patients, matches: text.matches, dx: text.dx, moneyHead, money: text.money, income: text.income, per,
  });
  // The formula line is always the yearly figure at the month's network size, whichever basis the readout shows.
  const points = model.dropPts[month - 1];
  const formula = COPY.gFormula({
    points: formatPoints(points), perInhabitant: formatEuroCents(model.perInhabitantEur), patients: formatCount(model.patients[month - 1]), amount: formatEuro(model.money.yearly[month - 1]),
  });
  const spend = { total: formatBillions(model.spendTotalMio), year: model.spendYear, perInhabitant: formatPerInhabitant(model.perInhabitantEur), geography: model.geography };
  const showEuro = plot === 'euro';
  const yearEnds = Array.from({ length: model.years }, (_, k) => (k + 1) * 12);

  return (
    <section className="dg" aria-labelledby="sim-diagram-title" aria-describedby="sim-diagram-desc" data-testid="sim-diagram" data-month={month} data-plot={plot} data-basis={basis}>
      <h1 id="sim-diagram-title" data-testid="sim-title">{COPY.gTitle[money]}</h1>
      <p className="dg-cap" data-testid="sim-caption">{COPY.gCaption[money]({ first: 1, last: model.years })}</p>
      <p className="sr-only" id="sim-diagram-desc" data-testid="sim-desc">{desc}</p>
      <div className="dg-main">
        <div className="dg-money">
          <div className="dg-hero" data-testid="sim-money">
            <div className="hn"><Glyph line={moneyLine} kind={kinds.money} /><span>{moneyHead}</span></div>
            <p className="hv">
              <span data-testid="sim-value-money">{text.money}</span> <small>{suf.money}</small>
            </p>
            {showTotals && <p className="ht" data-testid="sim-total-money">{COPY.gTotal.money({ value: formatEuro(tot.money), first: 1 })}</p>}
            <p className="hk">{COPY.gTag[kinds.money]}</p>
            <p className="hh">{COPY.gHelp.money({ year: model.spendYear })}</p>
          </div>
        </div>
        <div className="dg-plot">
          <div className="dg-box" ref={boxRef}>
            <svg width={g.W} height={g.Ht} aria-hidden="true" focusable="false" data-testid="sim-svg">
              {staticPlot}
              <line className="cur" data-testid="sim-cursor" x1={cx} x2={cx} y1={g.T} y2={g.T + g.H} />
              <g data-testid="sim-markers">
                {[...plotted(plot)].reverse().map((l) => {
                  const k = kinds[l.id];
                  return <Shaped key={l.id} shape={l.shape} x={cx} y={g.y(refs[l.unit] > 0 ? readoutValue(r, l.id) / refs[l.unit] : 0)} a={l.r} color={COLOR[k]} />;
                })}
              </g>
            </svg>
            <p className="dg-band" style={{ left: g.L, width: bx - g.L }} data-testid="sim-band-plan">{COPY.gBandPlan({ planYears: model.planYears })}</p>
            <p className="dg-band" style={{ left: bx, width: g.W - g.R - bx }} data-testid="sim-band-after">{COPY.gBandAssumed({ planYears: model.planYears })}</p>
          </div>
          <div className="dg-ctl">
            <label htmlFor="sim-slider">{COPY.gSliderLabel}</label>
            <output id="sim-year" htmlFor="sim-slider" className="dg-yr" data-testid="sim-year">{valueText}</output>
          </div>
          <p className="dg-state" data-testid="sim-state">
            {after ? <span className="chip">{COPY.gStateAssumed}</span> : COPY.gStatePlan}
          </p>
          <input
            id="sim-slider" type="range" min={1} max={model.months} step={1} value={month} data-testid="sim-slider"
            aria-label={COPY.gSliderAria({ first: 1, last: model.years })}
            aria-valuetext={after ? `${valueText}, ${COPY.gStateAssumed}` : valueText}
            style={{ marginLeft: g.slider.marginLeft, width: g.slider.width }}
            onChange={(e) => setMonth(clampMonth(Number(e.currentTarget.value), model.months))}
          />
        </div>
        <div className="dg-list">
          <ul className="dg-rows">
            {rows.map((l) => (
              <li key={l.id} className="dg-row" data-testid={`sim-row-${l.id}`}>
                <span><Glyph line={l} kind={kinds[l.id]} /></span>
                <span>
                  <span className="n">{COPY.gHead[l.id as 'patients' | 'matches' | 'dx' | 'income']}</span>
                  <span className="k">{COPY.gTag[kinds[l.id]]}</span>
                </span>
                <span className="v">
                  <span data-testid={`sim-value-${l.id}`}>{text[l.id]}</span>
                  {l.id === 'income' || l.id === 'dx' ? <small>{suf[l.id]}</small> : null}
                </span>
                {showTotals && (l.id === 'dx' || l.id === 'income') && (
                  <p className="h ht" data-testid={`sim-total-${l.id}`}>{COPY.gTotal[l.id]({ value: l.id === 'dx' ? formatDx(tot.dx) : formatEuro(tot.income), first: 1 })}</p>
                )}
                {l.id === 'dx' && <p className="h">{COPY.gHelp.dx[basis]}</p>}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="dg-notes">
        {showEuro ? (
          <p data-testid="sim-scale">{COPY.gScaleEuro}</p>
        ) : (
          <>
            <p data-testid="sim-scale">{COPY.gScale}</p>
            <p className="f">{COPY.gScaleMore}</p>
          </>
        )}
        <p className="fact" data-testid="sim-fact">{COPY.gFact(spend)}</p>
        <p data-testid="sim-assumption">{COPY.simAssumption({ start: formatPct(model.assumption.start), ceiling: formatPct(model.assumption.ceiling) })}</p>
        <p data-testid="sim-visits">{COPY.gAssumeVisits}</p>
        <p data-testid="sim-stay">{COPY.gAssumeStay}</p>
        {model.costShare !== undefined && <p data-testid="sim-share">{COPY.gAssumeShare({ share: formatPct(model.costShare) })}</p>}
        <p data-testid="sim-plateau">{COPY.gPlateau({ records: formatCount(model.plateau.records), month: model.plateau.fromMonth, planYears: model.planYears })}</p>
        <p data-testid="sim-income-plan">{COPY.gIncomePlan({ planYears: model.planYears })}</p>
        <p data-testid="sim-base">{COPY.gBase({ geography: model.geography, year: model.spendYear, perInhabitant: formatEuroCents(model.perInhabitantEur), total: formatBillions(model.spendTotalMio) })}</p>
        <p className="ff" data-testid="sim-formula">{formula}</p>
        <p className="m" data-testid="sim-sources">
          {COPY.gSourceLead} <a href={model.spendSource.url} target="_blank" rel="noreferrer noopener">{model.spendSource.name}</a>.{' '}
          {model.sources.length > 0 && (
            <>
              {COPY.gBaselines}{' '}
              {model.sources.map((s, i) => (
                <span key={s.url}>{i > 0 && '; '}<a href={s.url} target="_blank" rel="noreferrer noopener">{s.name}</a></span>
              ))}
              .
            </>
          )}
        </p>
      </div>
      <details data-testid="sim-values">
        <summary>{COPY.gShowValues}</summary>
        <div className="tw" tabIndex={0} role="region" aria-label={COPY.gTableCaption}>
          <table>
            <caption>{COPY.gTableCaption}</caption>
            <thead>
              <tr>
                <th>{COPY.gColYear}</th><th>{COPY.gColPatients}</th><th>{COPY.gColMatches}</th><th>{COPY.gColDx[basis]}</th>
                <th>{COPY.gColMoney[money][basis]}</th><th>{COPY.gColIncome[basis]}</th>
                {showTotals && <><th>{COPY.gColDxTotal}</th><th>{COPY.gColMoneyTotal}</th><th>{COPY.gColIncomeTotal}</th></>}
              </tr>
            </thead>
            <tbody>
              {yearEnds.map((m) => {
                const t = readoutAt(model, basis, m);
                const tt = totalsAt(model, m);
                return (
                  <tr key={m} data-testid={`sim-values-row-${yearOf(m)}`}>
                    <td>{yearOf(m)}{afterPlan(model, m) ? ` ${COPY.gTableAfter}` : ''}</td>
                    <td>{formatCount(t.patients)}</td><td>{formatCount(t.matches)}</td><td>{formatDx(t.dx)}</td>
                    <td>{formatEuroWhole(t.money)}</td><td>{formatEuroWhole(t.income)}</td>
                    {showTotals && <><td>{formatDx(tt.dx)}</td><td>{formatEuroWhole(tt.money)}</td><td>{formatEuroWhole(tt.income)}</td></>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

const readoutValue = (r: Record<LineId, number>, id: LineId) => r[id];
