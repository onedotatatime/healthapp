/**
 * The one card of /simulation (MIN-4774; spec A16 of docs/design/simulations-motion-spec.md; contract: CTO, MIN-4769).
 * The yearly loss first, a switch (Greece / Europe (EU-27) / Global), one native range slider over the share of that geography's residents in the
 * network, one SVG plot with a euro axis that starts at zero, readout rows. Nothing moves unless the viewer moves the slider or the switch:
 * there is no timer, no requestAnimationFrame, no CSS transition or animation. The `input` event sets one integer (tenths of a percent).
 * No number is typed here: every value is read from the `reach` block (reach.ts) and the words are in copy.ts.
 */
import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { COPY } from './copy';
import {
  DEFAULT_SHARE, MINUS, TENTHS_MAX, dropShare, formatCount, formatEuro, formatEuroShort, formatLossPct, formatPlain, formatRate, formatSmallShare, formatStep, formatUsd, formatWhole,
  niceMax, originalPerInhabitant, pctOfTenths, plotGeometry, pointAt, startTenths, tenthsOfPct, type Geo, type Geometry, type Reach,
} from './reach';

const MODEL = 'var(--color-flag-text)';
const PLAN = 'var(--color-info)';
const DASH_MODEL = '6 4';
const DASH_PLAN = '12 4 2 4';

const subject = (g: Geo) => COPY.rSubject[g.id] ?? { of: g.name, adj: g.name };
const moneyLabel = COPY.rMoneyLabel[COPY.rMoneyWording];
const titleOf = (g: Geo, amount: string) =>
  g.id === 'greece' || g.id === 'eu27' || g.id === 'world' ? COPY.rTitle[g.id]({ amount }) : COPY.rTitle.other({ name: g.name, amount });
const shareAssumption = (r: Reach, g: Geo) => {
  const share = formatPlain(r.baselinePct);
  return g.id === 'greece' || g.id === 'eu27' || g.id === 'world' ? COPY.rAssumeShare[g.id]({ share }) : COPY.rAssumeShare.other({ share, of: subject(g).of });
};

function Glyph({ kind, width = 30, stroke = 3 }: { kind: 'model' | 'plan'; width?: number; stroke?: number }) {
  return (
    <svg width={width} height="14" viewBox={`0 0 ${width} 14`} aria-hidden="true" focusable="false">
      <line x1="0" y1="7" x2={width} y2="7" stroke={kind === 'model' ? MODEL : PLAN} strokeWidth={stroke} strokeDasharray={kind === 'model' ? DASH_MODEL : DASH_PLAN} />
    </svg>
  );
}

/** Everything that does not depend on the slider: the grid, the axes, the loss line and the plan marker. Memoised on the geography and the width. */
function Plot({ model, geo, g }: { model: Reach; geo: Geo; g: Geometry }) {
  const of = subject(geo).of;
  const ticks = [0, g.yMax / 2, g.yMax];
  const pcts = [0, 25, 50, 75, 100];
  const xp = g.x(geo.planSharePct);
  const planLabel = COPY.rPlanMarker({ year: model.planYear, share: formatSmallShare(geo.planSharePct) });
  // The label starts 8 px right of the line; when it would not fit the plot it ends 8 px left of it.
  const labelRight = xp + 8 + planLabel.length * 6.6 > g.W;
  return (
    <>
      {pcts.map((p) => <line key={p} className="grid" x1={g.x(p)} x2={g.x(p)} y1={g.T} y2={g.T + g.H} />)}
      <line className="gridtop" x1={g.L} x2={g.W - g.R} y1={g.y(geo.loss0)} y2={g.y(geo.loss0)} data-testid="sim-today" />
      <line className="grid" x1={g.L} x2={g.W - g.R} y1={g.y(g.yMax / 2)} y2={g.y(g.yMax / 2)} />
      <line className="axis" x1={g.L} x2={g.W - g.R} y1={g.y(0)} y2={g.y(0)} />
      {ticks.map((v, i) => <text key={i} x={g.L - (g.W > 520 ? 6 : 14)} y={g.y(v) + 4} textAnchor="end" data-testid={`sim-tick-${i}`}>{formatEuroShort(v)}</text>)}
      {pcts.map((p) => (
        <g key={p}>
          <line className="tick" x1={g.x(p)} x2={g.x(p)} y1={g.y(0)} y2={g.y(0) + 4} />
          <text x={g.x(p)} y={g.y(0) + 19} textAnchor={p === 0 ? 'start' : p === 100 ? 'end' : 'middle'}>{p}%</text>
        </g>
      ))}
      <text x={(g.L + g.W - g.R) / 2} y={g.y(0) + 40} textAnchor="middle">{COPY.rAxisTitle({ of })}</text>
      <polyline className="line" data-testid="sim-line" points={`${g.x(0).toFixed(1)},${g.y(geo.loss0).toFixed(1)} ${g.x(100).toFixed(1)},${g.y(geo.loss100).toFixed(1)}`} stroke={MODEL} strokeWidth={4} strokeDasharray={DASH_MODEL} />
      <g data-testid="sim-plan-marker" aria-label={COPY.rPlanMarkerAria({ year: model.planYear, share: formatSmallShare(geo.planSharePct) })}>
        <line x1={xp} x2={xp} y1={g.T - 6} y2={g.y(0)} stroke={PLAN} strokeWidth={2} strokeDasharray={DASH_PLAN} />
        <rect className="shape" x={xp - 6} y={g.y(0) - 6} width={12} height={12} fill={PLAN} />
        <text className="pl" x={xp + (labelRight ? -8 : 8)} y={g.T - 12} textAnchor={labelRight ? 'end' : 'start'}>{planLabel}</text>
      </g>
    </>
  );
}

export type SimReachProps = {
  model: Reach;
  /** Freeze the geography (an id from the file) and the share (percent) for tests and review; the screen itself never passes them. */
  initialGeo?: string;
  initialShare?: number;
};

export function SimReach({ model, initialGeo, initialShare }: SimReachProps) {
  const id = useId();
  const first = Math.max(0, model.geos.findIndex((x) => x.id === initialGeo));
  const [geoIdx, setGeoIdx] = useState(first);
  const [tenths, setTenths] = useState(() => (initialShare !== undefined ? tenthsOfPct(initialShare) : startTenths(model.geos[first], DEFAULT_SHARE)));
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

  const geo = model.geos[geoIdx];
  const g = useMemo(() => plotGeometry(size.W, size.wide, niceMax(geo.loss0)), [size, geo]);
  const staticPlot = useMemo(() => <Plot model={model} geo={geo} g={g} />, [model, geo, g]);

  const sub = subject(geo);
  const share = pctOfTenths(tenths);
  const p = pointAt(model, geo, share);
  const full = pointAt(model, geo, 100);
  const plan = pointAt(model, geo, geo.planSharePct);
  const planStop = Math.round(geo.planSharePct * 10) === tenths && tenths > 0;
  const cx = g.x(share);
  const cy = g.y(p.loss);
  const lowered = share === 0 ? '€0' : `${MINUS}${formatEuro(p.drop)}`;
  const loweredPct = share === 0 ? '' : `(${MINUS}${formatLossPct(dropShare(geo) * (share / 100))})`;
  const state = tenths === 0 ? COPY.rState.zero : tenths === TENTHS_MAX ? COPY.rState.full : planStop ? COPY.rState.plan : '';
  const shareText = formatStep(share);
  const valueText = COPY.rSliderValue({ share: shareText, of: sub.of });
  const lossText = formatEuro(p.loss);
  const desc = COPY.rDesc({
    name: geo.name, year: geo.year, share: shareText, loss: lossText, drop: formatEuro(p.drop), matches: formatCount(p.matched), dx: formatCount(p.fewerDx), dropHead: moneyLabel,
  });
  const spend = { total: formatEuro(geo.spendTotalEur), perInhabitant: formatWhole(geo.spendPerInhabitantEur) };
  const fx = geo.original.fx;
  const tableRows = Array.from({ length: 11 }, (_, k) => k * 10);
  const bar = (v: number, v100: number) => `${v100 > 0 ? Math.min(100, (v / v100) * 100) : 0}%`;
  const radioName = `sim-geo-${id}`;

  return (
    <section className="lc" aria-labelledby="sim-title" aria-describedby="sim-desc" data-testid="sim-loss-card" data-geo={geo.id} data-share={share}>
      <h1 id="sim-title" data-testid="sim-title">{titleOf(geo, formatEuro(geo.loss0))}</h1>
      <p className="lc-lead" data-testid="sim-lead">{COPY.rLead}</p>
      <fieldset className="lc-sw" data-testid="sim-switch">
        <legend>{COPY.rSwitchAria}</legend>
        <div className="seg">
          {model.geos.map((x, i) => (
            <span key={x.id} className="opt">
              <input type="radio" name={radioName} id={`${radioName}-${x.id}`} value={x.id} checked={i === geoIdx} onChange={() => setGeoIdx(i)} data-testid={`sim-geo-${x.id}`} />
              <label htmlFor={`${radioName}-${x.id}`}>{x.name}</label>
            </span>
          ))}
        </div>
      </fieldset>
      <p className="sr-only" id="sim-desc" data-testid="sim-desc">{desc}</p>
      <div className="lc-main">
        <div className="a-money">
          <div className="hero" data-testid="sim-money">
            <p className="hn"><Glyph kind="model" width={30} stroke={4} /><span>{COPY.rHead.loss}</span></p>
            <p className="hv"><span data-testid="sim-value-loss">{lossText}</span> <small>{COPY.rUnit.year}</small></p>
            <p className="hk">{COPY.rTag.model}</p>
            <div className="low">
              <p className="hn">{moneyLabel}</p>
              <p className="lw"><span data-testid="sim-value-drop">{lowered}</span><small><span data-testid="sim-drop-pct">{loweredPct}</span>{share === 0 ? '' : ` ${COPY.rUnit.year}`}</small></p>
              <p className="hk">{COPY.rTag.model}</p>
            </div>
            <p className="hh" data-testid="sim-help-loss">{COPY.rHelpLoss({ share: formatPlain(model.baselinePct), adj: sub.adj, year: geo.year })}</p>
          </div>
        </div>
        <div className="a-plot">
          <ul className="key" data-testid="sim-key">
            <li><Glyph kind="model" stroke={4} /><span>{COPY.rKey.loss}</span></li>
            <li>
              <svg width="24" height="14" viewBox="0 0 24 14" aria-hidden="true" focusable="false"><rect x="0.5" y="0.5" width="23" height="13" rx="2" style={{ fill: 'var(--color-caution-bg)', stroke: MODEL }} /></svg>
              <span>{COPY.rKey.drop}</span>
            </li>
            <li><Glyph kind="plan" /><span>{COPY.rPlanName({ year: model.planYear })}</span></li>
          </ul>
          <div className="svgbox" ref={boxRef}>
            <svg width={g.W} height={g.Ht} viewBox={`0 0 ${g.W} ${g.Ht}`} aria-hidden="true" focusable="false" data-testid="sim-svg">
              <polygon data-testid="sim-lowered" points={`${g.x(0)},${g.y(geo.loss0)} ${cx},${cy} ${cx},${g.y(geo.loss0)}`} fill="var(--color-caution-bg)" />
              {staticPlot}
              <line className="cur" data-testid="sim-cursor" x1={cx} x2={cx} y1={g.y(geo.loss0)} y2={g.y(0)} />
              <path className="shape" data-testid="sim-diamond" d={`M${cx} ${cy - 9.5}L${cx + 9.5} ${cy}L${cx} ${cy + 9.5}L${cx - 9.5} ${cy}Z`} fill={MODEL} />
            </svg>
          </div>
          <div className="ctlbox">
            <div className="ctl">
              <label htmlFor={`${id}-slider`}>{size.wide ? COPY.rSliderLabel : COPY.rSliderLabelShort}</label>
              <output htmlFor={`${id}-slider`} className="pc" data-testid="sim-share">{valueText}</output>
            </div>
            <input
              id={`${id}-slider`} type="range" min={0} max={100} step={0.1} value={share} data-testid="sim-slider"
              aria-label={COPY.rSliderAria}
              aria-valuetext={COPY.rSliderText({ share: shareText, of: sub.of, amount: formatEuro(p.drop) })}
              style={size.wide ? { marginLeft: g.slider.marginLeft, width: g.slider.width } : undefined}
              onChange={(e) => setTenths(Math.round(Number(e.currentTarget.value) * 10))}
            />
            <p className="state" data-testid="sim-state">{state}</p>
          </div>
        </div>
        <div className="a-list">
          <ul className="ro-list">
            <li className="ro" data-testid="sim-row-matches">
              <div className="t"><span><span className="n">{COPY.rHead.matches}</span><span className="k">{COPY.rTag.model}</span></span><span className="v" data-testid="sim-value-matches">{formatCount(p.matched)}</span></div>
              <div className="lc-bar" aria-hidden="true"><i style={{ width: bar(p.matched, full.matched) }} /></div>
              <p className="h">{COPY.rAt100({ value: formatCount(full.matched) })}</p>
            </li>
            <li className="ro" data-testid="sim-row-dx">
              <div className="t"><span><span className="n">{COPY.rHead.dx}</span><span className="k">{COPY.rTag.model}</span></span><span className="v"><span data-testid="sim-value-dx">{formatCount(p.fewerDx)}</span> <small>{COPY.rUnit.year}</small></span></div>
              <div className="lc-bar" aria-hidden="true"><i style={{ width: bar(p.fewerDx, full.fewerDx) }} /></div>
              <p className="h">{COPY.rAt100({ value: formatCount(full.fewerDx) })}</p>
            </li>
            <li className="ro plan" data-testid="sim-row-plan">
              <div className="t">
                <span><span className="n"><Glyph kind="plan" />{COPY.rPlanName({ year: model.planYear })}</span><span className="k">{COPY.rTag.plan}</span></span>
                <span className="v" data-testid="sim-value-plan">{formatCount(model.planPatients)}</span>
              </div>
              <p className="h" data-testid="sim-plan-line">
                {COPY.rPlanRow({ patients: formatCount(model.planPatients), share: formatSmallShare(geo.planSharePct), of: sub.of, amount: formatEuro(plan.drop) })}
              </p>
            </li>
          </ul>
        </div>
      </div>
      <div className="lc-notes">
        <p className="m" data-testid="sim-note-axis">{COPY.rNoteAxis}</p>
        <p data-testid="sim-straight">{COPY.rStraight({ records: formatCount(model.records) })}</p>
        <p data-testid="sim-assumption">{COPY.rAssume({ rate: formatPlain(model.matchRateOptedInPct), effect: formatPlain(model.effect * 100) })}</p>
        <p data-testid="sim-visits">{COPY.rAssumeVisits}</p>
        <p data-testid="sim-stay">{COPY.rAssumeStay}</p>
        <p data-testid="sim-share-note">{shareAssumption(model, geo)}</p>
        <p data-testid="sim-same-rates">{COPY.rSameRates}</p>
        <p data-testid="sim-base">{COPY.rBase({ geography: geo.name, year: geo.year, ...spend })}</p>
        <p className="ff" data-testid="sim-formula">
          {COPY.rFormula({ points: String(model.dropPts), total: spend.total, geography: geo.name, year: geo.year, amount: formatEuro(geo.drop100) })}
        </p>
        {fx && (
          <p data-testid="sim-fx">
            {COPY.rFx({ total: formatUsd(geo.original.total), perHead: formatWhole(originalPerInhabitant(geo), 'US$'), people: formatCount(geo.population), year: fx.year, rate: formatRate(fx.usdPerEur) })}
          </p>
        )}
        <p className="m" data-testid="sim-sources">
          {COPY.rSourceLead} <a href={geo.spendSource.url} target="_blank" rel="noreferrer noopener">{geo.spendSource.name}</a>. {COPY.rPopulationLead}{' '}
          <a href={geo.populationSource.url} target="_blank" rel="noreferrer noopener">{geo.populationSource.name}</a>.{' '}
          {model.sources.length > 0 && (
            <>
              {COPY.rBaselines}{' '}
              {model.sources.map((s, i) => (
                <span key={s.url}>{i > 0 && '; '}<a href={s.url} target="_blank" rel="noreferrer noopener">{s.name}</a></span>
              ))}
              .
            </>
          )}
        </p>
      </div>
      <details data-testid="sim-values">
        <summary>{COPY.rShowValues}</summary>
        <div className="tw" tabIndex={0} role="region" aria-label={COPY.rTableCaption({ name: geo.name })}>
          <table>
            <caption>{COPY.rTableCaption({ name: geo.name })}</caption>
            <thead>
              <tr><th>{COPY.rColShare}</th><th>{COPY.rColLoss}</th><th>{moneyLabel}</th><th>{COPY.rHead.matches}</th><th>{COPY.rColDx}</th></tr>
            </thead>
            <tbody>
              {tableRows.map((s) => {
                const t = pointAt(model, geo, s);
                return (
                  <tr key={s} data-testid={`sim-values-row-${s}`}>
                    <td>{s}%</td><td>{formatEuro(t.loss)}</td><td>{s === 0 ? '€0' : `${MINUS}${formatEuro(t.drop)}`}</td><td>{formatCount(t.matched)}</td><td>{formatCount(t.fewerDx)}</td>
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
