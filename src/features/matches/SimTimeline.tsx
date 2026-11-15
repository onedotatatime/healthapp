/**
 * The timeline diagram of /simulation (MIN-4702, spec A13 of docs/design/simulations-motion-spec.md, mock docs/design/min-4700/timeline-mock.html).
 * Founder, 2026-11-15: "maybe to have one diagram with all the numbers inside showing how having onboard patients and growing our model and getting
 * everyday more and more correct diagnoses how the money saved and our income grow".
 * One card, up to three stacked lanes on one shared month scale. Each lane has its own y axis from zero in its own unit (people, euros, diagnoses);
 * measures that share a unit share a lane. Inline SVG built at its measured width (1 unit = 1 CSS px), no chart library, no second y axis, no index,
 * no log, no crop. Static: it is painted finished and does not run on the 30-second clock; there is no motion to reduce. Every number comes from
 * the `timeline` block (simData.ts parses it); every word is in copy.ts.
 */
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { COPY } from './copy';
import { formatCount, formatEuroCents, formatEuroK, formatEuroWhole, type SimTimeline } from './simData';
import {
  TL_DASH, TL_FALLBACK_W, TL_KEY_EST_H, TL_KEY_GAP, TL_MARKER_R, TL_WIDE_MIN, buildLanes, firstMonthAbove, formatAxisTick, formatValue, labelledMonths,
  laneGeometry, pilotBand, placeKeys, type TlKind, type TlLane, type TlLaneGeometry, type TlLayout, type TlMeasure,
} from './timeline';

const KIND_COLOR: Record<TlKind, string> = { computed: 'var(--tl-computed)', model: 'var(--tl-model)', plan: 'var(--tl-plan)' };
const isWide = () => typeof matchMedia !== 'undefined' && matchMedia(`(min-width:${TL_WIDE_MIN}px)`).matches;

/** The end marker of a kind: circle (computed), diamond (model), square (plan). The same shape is in the key's glyph. */
function Marker({ kind, cx, cy, className }: { kind: TlKind; cx: number; cy: number; className?: string }) {
  const r = TL_MARKER_R;
  const common = { className, fill: KIND_COLOR[kind], stroke: 'var(--color-surface)', strokeWidth: 2 };
  if (kind === 'computed') return <circle {...common} cx={cx} cy={cy} r={r} />;
  return <rect {...common} x={cx - r} y={cy - r} width={2 * r} height={2 * r} transform={kind === 'model' ? `rotate(45 ${cx} ${cy})` : undefined} />;
}

/** 36 x 14: the line pattern for 24 px, then the end marker. */
function Glyph({ kind }: { kind: TlKind }) {
  return (
    <svg className="tl-glyph" width={36} height={14} aria-hidden="true" focusable="false" data-kind={kind}>
      <line x1={0} y1={7} x2={24} y2={7} stroke={KIND_COLOR[kind]} strokeWidth={3} strokeDasharray={TL_DASH[kind]} />
      <Marker kind={kind} cx={29} cy={7} />
    </svg>
  );
}

type Band = ReturnType<typeof pilotBand>;

function Plot({ lane, geo, months, last, first, monthLabels, band }: {
  lane: TlLane; geo: TlLaneGeometry; months: number[]; last: boolean; first: boolean; monthLabels: boolean; band: Band;
}) {
  const { x, y, L, R, T, bottom, width, height } = geo;
  const ticks = labelledMonths(months);
  return (
    <svg
      className="tl-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false"
      data-testid={`sim-tl-plot-${lane.id}`} data-top={geo.axis.top}
    >
      {band && <rect className="band" x={x(band.from - 0.5)} y={T} width={x(band.to + 0.5) - x(band.from - 0.5)} height={geo.plotH} data-testid="sim-tl-band-rect" />}
      {ticks.map((m) => <line key={m} className="grid" x1={x(m)} x2={x(m)} y1={T} y2={bottom} />)}
      {geo.axis.ticks.map((t) => (
        <g key={t}>
          <line className={t === 0 ? 'axis' : 'grid'} x1={L} x2={width - R} y1={y(t)} y2={y(t)} data-tick={t} />
          <text x={L - 6} y={y(t) + 4} textAnchor="end" data-testid="sim-tl-ytick">{formatAxisTick(lane.measures[0], t)}</text>
        </g>
      ))}
      <line className="axis" x1={L} x2={L} y1={T} y2={bottom} />
      {band && <line className="first" x1={x(band.firstPaid)} x2={x(band.firstPaid)} y1={T} y2={bottom} data-testid="sim-tl-first-line" />}
      {months.map((m) => <line key={m} className="tick" x1={x(m)} x2={x(m)} y1={bottom} y2={bottom + 4} />)}
      {monthLabels && ticks.map((m) => <text key={m} x={x(m)} y={bottom + 16} textAnchor="middle" data-testid="sim-tl-month">{m}</text>)}
      {last && <text x={(L + width - R) / 2} y={height - 4} textAnchor="middle">{COPY.tlXAxis}</text>}
      {first && band && <text className="mk" x={x(band.firstPaid) + 6} y={T + 12} data-testid="sim-tl-first-label">{COPY.tlFirstPaid}</text>}
      <g className="tl-lines">
        {lane.measures.map((s) => {
          const d = s.values.map((v, i) => `${i ? 'L' : 'M'}${x(months[i]).toFixed(1)} ${y(v).toFixed(1)}`).join('');
          return <path key={s.id} className="line" d={d} stroke={KIND_COLOR[s.kind]} strokeDasharray={TL_DASH[s.kind]} data-line={s.id} data-dash={TL_DASH[s.kind]} />;
        })}
        {lane.measures.map((s) => <Marker key={s.id} kind={s.kind} cx={x(months[months.length - 1])} cy={y(s.values[s.values.length - 1])} className="tip" />)}
      </g>
    </svg>
  );
}

export function SimTimeline({ timeline, tie, curve, layout: forced }: {
  timeline: SimTimeline;
  /** The hero's euro figure and geography, for the sentence that ties this card to it. Absent when the hero has no euro figure. */
  tie?: { amount: string; geography: string };
  /** The learning-curve assumption line (COPY.simAssumption, filled from the file). */
  curve: string;
  /** Tests and review freeze the layout; the screen measures its own. */
  layout?: TlLayout;
}) {
  const id = useId();
  const root = useRef<HTMLElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState<TlLayout>(() => ({ wide: isWide(), width: isWide() ? TL_FALLBACK_W.wide : TL_FALLBACK_W.narrow }));
  const [heights, setHeights] = useState<Record<string, number>>({});
  const layout = forced ?? measured;

  // The plot is drawn at the width it is given (1 unit = 1 CSS px), so 11 px text stays 11 px. One redraw per resize, no animation.
  useLayoutEffect(() => {
    if (forced) return;
    const el = plotRef.current;
    if (!el) return;
    const read = () => {
      const w = Math.floor(el.getBoundingClientRect().width);
      const wide = isWide();
      setMeasured((m) => (m.width === w && m.wide === wide ? m : { width: w, wide }));
    };
    read();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [forced]);

  // Wide: the keys stand in the right column at their line's tip and must not overlap, so each one's measured height is read (a name can wrap to two lines).
  useLayoutEffect(() => {
    if (!layout.wide) {
      if (Object.keys(heights).length) setHeights({});
      return;
    }
    const next: Record<string, number> = {};
    root.current?.querySelectorAll<HTMLElement>('.tl-key[data-measure]').forEach((k) => { next[k.dataset.measure ?? ''] = k.offsetHeight; });
    const same = Object.keys(next).length === Object.keys(heights).length && Object.entries(next).every(([k, v]) => heights[k] === v);
    if (!same) setHeights(next);
  });

  const months = timeline.x;
  const lanes = buildLanes(timeline);
  const band = pilotBand(timeline.patients.values, months);
  if (!band) return null; // parseTimeline never lets this happen; a hand-built block without a pilot draws nothing
  const lastMonth = months[months.length - 1];
  const priceText = formatEuroWhole(timeline.plan.priceEurPerCase);
  const { drop } = timeline;
  const at = (v: number[]) => v[v.length - 1];
  // Under lane 2: how the drop is made, and the formula for the last month. The formula uses the published points and the month's patients (never a rounded per-patient figure), so it gives the figure on screen.
  const dropLines = drop
    ? [
        COPY.tlEuroNote({ price: priceText, perPatient: formatEuroCents((at(drop.points) / 100) * drop.perInhabitantEur), last: lastMonth }),
        COPY.tlFormula({
          points: at(drop.points).toFixed(2), perInhabitant: formatEuroCents(drop.perInhabitantEur), patients: formatCount(at(timeline.patients.values)), amount: formatEuroK(at(drop.values)),
        }),
        curve,
      ]
    : [];
  const note = (l: TlLane): { text: string; testid?: string }[] => {
    if (l.id === 'people') return [{ text: COPY.tlRampPerCase({ price: priceText, from: band.from, to: band.to }), testid: 'ramp' }];
    if (l.id === 'euro') return [{ text: COPY.tlIncomePlan, testid: 'income' }, ...dropLines.map((text, i) => ({ text, testid: ['drop-note', 'formula', 'curve'][i] }))];
    return [{ text: COPY.tlAssumeDx, testid: 'dx-assumption' }, { text: curve, testid: 'curve' }];
  };
  const unitLine = (l: TlLane) => (l.id === 'people' ? COPY.tlUnitPeople : l.id === 'euro' ? COPY.tlUnitEuro : COPY.tlUnitDx);

  const allMeasures = lanes.flatMap((l) => l.measures);
  const end = (m: TlMeasure) => at(m.values);
  const byId = (mid: TlMeasure['id']) => allMeasures.find((m) => m.id === mid);
  const exact = (mid: TlMeasure['id']) => { const m = byId(mid); return m ? formatValue(m, end(m), 'exact') : ''; };
  const desc = [
    COPY.tlDescLead({ first: months[0], last: lastMonth }),
    COPY.tlDescPatients({ paid: firstMonthAbove(timeline.patients.values, months), last: lastMonth, n: exact('patients') }),
    COPY.tlDescMatches({ n: exact('matches'), last: lastMonth }),
    byId('dx') ? COPY.tlDescDx({ n: exact('dx') }) : null,
    byId('drop') ? COPY.tlDescDrop({ amount: exact('drop') }) : null,
    COPY.tlDescIncome({ amount: exact('income') }),
    COPY.tlDescClose,
  ].filter(Boolean).join(' ');

  // The values table: the ends of plan years 1 and 2 (every 12th month in the data), the exact numbers behind the rounded keys.
  const yearEnds = months.filter((m) => m % 12 === 0);

  return (
    <section ref={root} className="tl" data-testid="sim-timeline" data-wide={layout.wide} aria-labelledby={`${id}-h`} aria-describedby={`${id}-d`}>
      <h2 id={`${id}-h`}>{COPY.tlTitle}</h2>
      <p className="tl-cap">{COPY.tlCaption({ first: months[0], last: lastMonth })}</p>
      {tie && timeline.drop && <p className="tl-cap" data-testid="sim-timeline-tie">{COPY.tlTie(tie)}</p>}
      <p className="tl-sr" id={`${id}-d`} data-testid="sim-timeline-desc">{desc}</p>
      {lanes.map((lane, li) => {
        const isLast = li === lanes.length - 1;
        const geo = laneGeometry(lane, layout, months, isLast);
        const tips = lane.measures.map((s) => geo.y(end(s)));
        const tops = layout.wide ? placeKeys(tips, lane.measures.map((s) => heights[s.id] ?? TL_KEY_EST_H), TL_KEY_GAP, geo.height) : [];
        return (
          <div className="tl-lane" data-lane={lane.id} data-testid={`sim-tl-lane-${lane.id}`} key={lane.id}>
            <div className="tl-head">
              <h3 className="tl-lane-title">{COPY.tlLaneTitle[lane.id]}</h3>
              <p className="tl-lane-unit" data-testid={`sim-tl-unit-${lane.id}`}>{unitLine(lane)}</p>
            </div>
            <div className="tl-keys" style={layout.wide ? { height: geo.height } : undefined}>
              {lane.measures.map((s, i) => (
                <div
                  className="tl-key" key={s.id} data-measure={s.id} data-kind={s.kind} data-testid={`sim-tl-key-${s.id}`}
                  style={layout.wide ? { top: tops[i] } : undefined}
                >
                  <Glyph kind={s.kind} />
                  <span className="tl-key-name">{COPY.tlName[s.id]}</span>
                  <span className="tl-key-fig" data-testid={`sim-tl-value-${s.id}`}>{formatValue(s, end(s), 'key')}</span>
                  <span className="tl-key-tag" data-testid={`sim-tl-tag-${s.id}`}>{COPY.tlTag[s.kind]}</span>
                </div>
              ))}
            </div>
            <div className="tl-plot" ref={li === 0 ? plotRef : undefined}>
              <Plot lane={lane} geo={geo} months={months} last={isLast} first={li === 0} monthLabels={isLast || !layout.wide} band={band} />
              {li === 0 && (
                <p className="tl-band" data-testid="sim-tl-band" style={{ left: geo.x(band.from - 0.5), top: geo.T, width: geo.x(band.to + 0.5) - geo.x(band.from - 0.5) }}>
                  {COPY.tlBand}
                </p>
              )}
            </div>
            <div className="tl-notes" data-testid={`sim-tl-note-${lane.id}`}>
              {note(lane).map((line) => <p className="tl-note" key={line.testid} data-testid={`sim-tl-${line.testid}`}>{line.text}</p>)}
            </div>
          </div>
        );
      })}
      <details className="tl-values" data-testid="sim-tl-values">
        <summary>{COPY.tlShowValues}</summary>
        <table>
          {yearEnds.length === 2 && <caption>{COPY.tlTableCaption({ first: yearEnds[0], second: yearEnds[1] })}</caption>}
          <thead>
            <tr><th scope="col">{COPY.tlColMeasure}</th>{yearEnds.map((m) => <th scope="col" key={m}>{COPY.tlColMonth(m)}</th>)}</tr>
          </thead>
          <tbody>
            {allMeasures.map((s) => (
              <tr key={s.id} data-measure={s.id}>
                <th scope="row">{COPY.tlName[s.id]}</th>
                {yearEnds.map((m) => <td key={m}>{formatValue(s, s.values[months.indexOf(m)], 'exact')}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
