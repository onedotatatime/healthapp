/**
 * The timeline of /simulation: ONE plot, five lines, animated (MIN-4724; spec A14 of docs/design/simulations-motion-spec.md, mock docs/design/min-4722/timeline-mock.html;
 * contract: CTO, MIN-4720 comment 6fba2571; CEO seat conditions 9 to 16, MIN-4721).
 * Founder, 2026-11-15: "We said one diagram with all the lines on the same showing how while the users are growing so as the matches how the other numbers
 * are growing", then "animated".
 *
 * Inline SVG at its measured width (1 unit = 1 CSS px), no chart library. One scale per unit, linear from zero, fixed from the first frame (timeline.ts).
 * The card has its own clock: 500 ms a month, started once when 40% of it is in view, with a Replay. The hero's 30-second clock is untouched.
 * Cost of a frame: React state changes at month edges only (the month and the done flag); per frame, the clip width, the playhead, the five head
 * transforms and (wide) the five label transforms and leader paths are written through refs (timelinePaint.ts). The static layers are memoised on
 * the data and the width. The numbers change only at month edges and are always a month's value from the file, never a tween.
 * Reduced motion, a server render and `at` past the end show the finished chart at once: no timer and no Replay. Every number comes from the `timeline`
 * block (simData.ts parses it); every word is in copy.ts.
 */
import { memo, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { COPY } from './copy';
import { formatCount, formatEuroCents, formatEuroK, formatEuroWhole, type SimTimeline as SimTimelineData } from './simData';
import { emptyEls, paintFrame } from './timelinePaint';
import {
  TL_DASH, TL_FALLBACK_W, TL_HEAD_R, TL_LABEL_H, TL_MARK_R, TL_MARKER_MONTHS, TL_ROW_ORDER, TL_WIDE_MIN,
  buildModel, firstMonthAbove, formatValue, labelledMonths, pilotBand, shareOf, shouldStartRun, tlFrame, tlGeometry, tlRunMs,
  type TlGeom, type TlKind, type TlLayout, type TlLine, type TlModel, type TlShape,
} from './timeline';

const KIND_COLOR: Record<TlKind, string> = { computed: 'var(--tl-computed)', model: 'var(--tl-model)', plan: 'var(--tl-plan)' };
const isWide = () => typeof matchMedia !== 'undefined' && matchMedia(`(min-width:${TL_WIDE_MIN}px)`).matches;
const canAnimate = () => typeof window !== 'undefined' && typeof matchMedia !== 'undefined' && !matchMedia('(prefers-reduced-motion: reduce)').matches;
const STARTS = Array.from({ length: 21 }, (_, i) => i / 20);
type Band = ReturnType<typeof pilotBand>;

/** The marker of a line: square, circle, triangle up, triangle down or diamond. The shape says which line it is; the kind says the pattern. */
function Shape({ shape, cx, cy, r, kind }: { shape: TlShape; cx: number; cy: number; r: number; kind: TlKind }) {
  const common = { fill: KIND_COLOR[kind], stroke: 'var(--color-surface)', strokeWidth: 2 };
  switch (shape) {
    case 'circle': return <circle {...common} cx={cx} cy={cy} r={r} />;
    case 'square': return <rect {...common} x={cx - r * 0.9} y={cy - r * 0.9} width={r * 1.8} height={r * 1.8} />;
    case 'diamond': return <path {...common} d={`M${cx} ${cy - r * 1.3}L${cx + r * 1.3} ${cy}L${cx} ${cy + r * 1.3}L${cx - r * 1.3} ${cy}Z`} />;
    case 'up': return <path {...common} d={`M${cx} ${cy - r * 1.2}L${cx + r * 1.2} ${cy + r * 0.9}L${cx - r * 1.2} ${cy + r * 0.9}Z`} />;
    default: return <path {...common} d={`M${cx} ${cy + r * 1.2}L${cx + r * 1.2} ${cy - r * 0.9}L${cx - r * 1.2} ${cy - r * 0.9}Z`} />;
  }
}

/** 36 x 14: the line's pattern for 24 px, then its marker (the phone rows). */
function PatternGlyph({ l }: { l: TlLine }) {
  return (
    <svg className="tl-glyph" width={36} height={14} aria-hidden="true" focusable="false" data-kind={l.kind}>
      <line x1={0} y1={7} x2={24} y2={7} stroke={KIND_COLOR[l.kind]} strokeWidth={3} strokeDasharray={TL_DASH[l.kind]} />
      <Shape shape={l.shape} cx={29} cy={7} r={4.2} kind={l.kind} />
    </svg>
  );
}
/** 22 x 14: the marker alone (a head's label; the leader carries the line to it). */
function MarkGlyph({ l }: { l: TlLine }) {
  return (
    <svg className="tl-glyph" width={22} height={14} aria-hidden="true" focusable="false" data-kind={l.kind}>
      <Shape shape={l.shape} cx={11} cy={7} r={5} kind={l.kind} />
    </svg>
  );
}

/** The layers under the lines that never change after the width does: the pilot band, the month hairlines and the three gridlines (0, half, the unit's top). */
const PlotBase = memo(function PlotBase({ g, months, band }: { g: TlGeom; months: number[]; band: Band }) {
  const { L, R, T, Wp } = g;
  return (
    <>
      {band && <rect className="band" x={g.x(band.from - 0.5)} y={T} width={g.x(band.to + 0.5) - g.x(band.from - 0.5)} height={g.H} data-testid="sim-tl-band-rect" />}
      {labelledMonths(months).map((m) => <line key={m} className="grid" x1={g.x(m)} x2={g.x(m)} y1={T} y2={g.bottom} />)}
      <line className="gridtop" x1={L} x2={Wp - R} y1={g.y(1)} y2={g.y(1)} data-grid="1" />
      <line className="grid" x1={L} x2={Wp - R} y1={g.y(0.5)} y2={g.y(0.5)} data-grid="0.5" />
      <line className="axis" x1={L} x2={Wp - R} y1={g.y(0)} y2={g.y(0)} data-grid="0" />
      <text x={L} y={T - 8} data-testid="sim-tl-scale-top">{COPY.tlScaleTop}</text>
      <text x={L - 6} y={g.y(0) + 4} textAnchor="end" data-testid="sim-tl-scale-base">{COPY.tlScaleBase}</text>
    </>
  );
});

/** The layers over the playhead: the first-paid line, the month axis, and the five lines (straight segments between monthly points, drawn behind the clip). */
const PlotTop = memo(function PlotTop({ g, model, band, clipId }: { g: TlGeom; model: TlModel; band: Band; clipId: string }) {
  const { months } = model;
  return (
    <>
      {band && <line className="first" x1={g.x(band.firstPaid)} x2={g.x(band.firstPaid)} y1={g.T} y2={g.bottom} data-testid="sim-tl-first-line" />}
      {band && <text className="mk" x={g.x(band.firstPaid) + 6} y={g.T + 14} data-testid="sim-tl-first-label">{COPY.tlFirstPaid}</text>}
      {months.map((m) => <line key={m} className="tick" x1={g.x(m)} x2={g.x(m)} y1={g.bottom} y2={g.bottom + 4} />)}
      {labelledMonths(months).map((m) => <text key={m} x={g.x(m)} y={g.bottom + 18} textAnchor="middle" data-testid="sim-tl-month-label">{m}</text>)}
      <text x={(g.L + g.Wp - g.R) / 2} y={g.bottom + 34} textAnchor="middle">{COPY.tlXAxis}</text>
      <g clipPath={`url(#${clipId})`} data-testid="sim-tl-lines">
        {[...model.lines].reverse().map((l) => (
          <g key={l.id}>
            <polyline
              className="line" fill="none" stroke={KIND_COLOR[l.kind]} strokeDasharray={TL_DASH[l.kind]} data-line={l.id} data-dash={TL_DASH[l.kind]}
              points={l.values.map((_, i) => `${g.x(months[i]).toFixed(1)},${g.y(shareOf(model, l, i)).toFixed(1)}`).join(' ')}
            />
            {TL_MARKER_MONTHS.filter((m) => months.includes(m) && m !== months[months.length - 1]).map((m) => (
              <Shape key={m} shape={l.shape} cx={g.x(m)} cy={g.y(shareOf(model, l, months.indexOf(m)))} r={TL_MARK_R} kind={l.kind} />
            ))}
          </g>
        ))}
      </g>
    </>
  );
});

type Props = {
  timeline: SimTimelineData;
  /** The hero's euro figure and geography, for the sentence that ties this card to it. Absent when the hero has no euro figure. Keep it stable between renders: this component is memoised. */
  tie?: { amount: string; geography: string };
  /** `euro.geography` of the file ("EU-27" today), for the euro note's "average spending per inhabitant for ...". */
  geography?: string;
  /** The learning-curve assumption line (COPY.simAssumption, filled from the file). */
  curve: string;
  /** Tests and review freeze the layout; the screen measures its own. */
  layout?: TlLayout;
  /** The page's reduced-motion choice; left out, the card reads the media query itself (and a server render counts as reduced). */
  reduced?: boolean;
  /** Freeze the card's own clock at this many ms (tests and review); the screen never passes it. */
  at?: number;
};

function SimTimelineImpl({ timeline, tie, geography, curve, layout: forced, reduced, at }: Props) {
  const id = useId();
  const clipId = `tlclip${id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const root = useRef<HTMLElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const [autoStill] = useState(() => !canAnimate());
  const still = reduced ?? autoStill;
  const [measured, setMeasured] = useState<TlLayout>(() => ({ wide: isWide(), width: isWide() ? TL_FALLBACK_W.wide : TL_FALLBACK_W.narrow }));
  const layout = forced ?? measured;

  const months = timeline.x;
  const model = useMemo(() => buildModel(timeline), [timeline]);
  const geom = useMemo(() => tlGeometry({ wide: layout.wide, width: layout.width }, months), [layout.wide, layout.width, months]);
  const band = useMemo(() => pilotBand(timeline.patients.values, months), [timeline, months]);
  const runMs = tlRunMs(months);
  const startT = still ? runMs : at ?? 0;
  // The frame the markup is drawn in: the start of the run, or the finished chart. Everything after is written through refs.
  const first = useMemo(() => tlFrame(startT, model, geom), [startT, model, geom]);

  // React state: the month shown (changes 23 times in a run) and whether the run is over (once). Nothing else is state.
  const [index, setIndex] = useState(first.index);
  const [done, setDone] = useState(first.done);
  const [replays, setReplays] = useState(0);
  const els = useRef(emptyEls());
  const ctx = useRef({ model, geom });
  const tRef = useRef(startT);
  const idxRef = useRef(first.index);
  const doneRef = useRef(first.done);

  const paint = useCallback((t: number) => {
    const f = tlFrame(t, ctx.current.model, ctx.current.geom);
    tRef.current = f.t;
    paintFrame(els.current, f);
    if (f.index !== idxRef.current) { idxRef.current = f.index; setIndex(f.index); }
    if (f.done !== doneRef.current) { doneRef.current = f.done; setDone(f.done); }
  }, []);

  // The plot is drawn at the width it is given. The width is read on resize only (never in the frame loop); a new width redraws the current frame at once.
  useLayoutEffect(() => {
    if (forced) return;
    const el = plotRef.current;
    if (!el) return;
    const read = () => {
      const w = Math.floor(el.getBoundingClientRect().width);
      const wide = isWide();
      setMeasured((m) => (m.width === w && m.wide === wide ? m : { width: w > 0 ? w : m.width, wide }));
    };
    read();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [forced]);
  useLayoutEffect(() => {
    ctx.current = { model, geom };
    paintFrame(els.current, tlFrame(tRef.current, model, geom));
  }, [model, geom]);

  // The card's own clock. It starts once, when enough of the card is in view; Replay starts it again at once. Time based: a hidden tab that comes back shows the state for the current time.
  useEffect(() => {
    if (still) return;
    if (at !== undefined) { paint(at); return; }
    let raf = 0;
    let io: IntersectionObserver | undefined;
    const run = () => {
      const t0 = performance.now();
      const tick = () => {
        const t = Math.min(Math.max(performance.now() - t0, 0), runMs);
        paint(t);
        if (t < runMs) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    paint(0);
    const el = root.current;
    if (replays === 0 && el && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting && shouldStartRun(e.intersectionRatio, e.intersectionRect.height, e.rootBounds?.height ?? window.innerHeight))) {
          io?.disconnect();
          run();
        }
      }, { threshold: STARTS });
      io.observe(el);
    } else run();
    return () => { cancelAnimationFrame(raf); io?.disconnect(); };
  }, [still, at, replays, runMs, paint]);

  if (!band) return null; // parseTimeline never lets this happen; a hand-built block without a pilot draws nothing
  const lastMonth = months[months.length - 1];
  const priceText = formatEuroWhole(timeline.plan.priceEurPerCase);
  const { drop, diagnoses } = timeline;
  const at24 = (v: number[]) => v[v.length - 1];
  const lineOf = (lid: TlLine['id']) => model.lines.find((l) => l.id === lid);
  const exact = (lid: TlLine['id']) => { const l = lineOf(lid); return l ? formatValue(l, at24(l.values), 'exact') : ''; };
  const desc = [
    COPY.tlDescLead({ first: months[0], last: lastMonth, lines: model.lines.length }),
    COPY.tlDescPatients({ paid: firstMonthAbove(timeline.patients.values, months), last: lastMonth, n: exact('patients') }),
    COPY.tlDescMatches({ n: exact('matches'), last: lastMonth }),
    diagnoses ? COPY.tlDescDx({ n: exact('dx') }) : null,
    drop ? COPY.tlDescDrop({ amount: exact('drop') }) : null,
    COPY.tlDescIncome({ amount: exact('income') }),
    COPY.tlDescClose,
  ].filter(Boolean).join(' ');
  // The formula uses the published points and the month's patients (never a rounded per-patient figure), so it gives the figure on screen. It is the last month's: its three numbers are one month's and the euro note above it names that month.
  const euroLines = drop
    ? [
        { testid: 'drop-note', text: COPY.tlEuroNote({ price: priceText, perPatient: formatEuroCents((at24(drop.points) / 100) * drop.perInhabitantEur), last: lastMonth, geography }) },
        { testid: 'formula', text: COPY.tlFormula({ points: at24(drop.points).toFixed(2), perInhabitant: formatEuroCents(drop.perInhabitantEur), patients: formatCount(at24(timeline.patients.values)), amount: formatEuroK(at24(drop.values)) }) },
      ]
    : [];
  const yearEnds = months.filter((m) => m % 12 === 0);
  const rows = TL_ROW_ORDER.flatMap((lid) => { const l = lineOf(lid); return l ? [l] : []; });
  const valueText = (l: TlLine) => (
    <>
      <span className="tl-num" data-testid={`sim-tl-value-${l.id}`}>{formatValue(l, l.values[index], 'head')}</span>
      {l.unit !== 'people' && <small>{COPY.tlPerYear}</small>}
    </>
  );

  return (
    <section
      ref={root} className="tl" data-testid="sim-timeline" data-wide={geom.wide} data-month={months[index]} data-done={done}
      aria-labelledby={`${id}-h`} aria-describedby={`${id}-d`}
    >
      <div className="tl-top">
        <div>
          <h2 id={`${id}-h`}>{COPY.tlTitle}</h2>
          <p className="tl-cap">{COPY.tlCaption({ first: months[0], last: lastMonth })}</p>
        </div>
        <div className="tl-ctl">
          <span className="tl-month" data-testid="sim-tl-month">{COPY.tlMonth({ n: months[index], last: lastMonth })}</span>
          {!still && (
            <button type="button" className="tl-replay" disabled={!done} onClick={() => setReplays((r) => r + 1)} aria-label={COPY.tlReplayAria({ first: months[0] })} data-testid="sim-tl-replay">
              {COPY.tlReplay}
            </button>
          )}
        </div>
      </div>
      <p className="tl-sr" id={`${id}-d`} data-testid="sim-timeline-desc">{desc}</p>
      <div className="tl-plot" ref={plotRef}>
        <svg className="tl-svg" width={geom.width} height={geom.height} viewBox={`0 0 ${geom.width} ${geom.height}`} aria-hidden="true" focusable="false" data-testid="sim-tl-plot">
          <defs>
            <clipPath id={clipId}><rect ref={(el) => { els.current.clip = el; }} x={0} y={0} width={first.clipW} height={geom.height} /></clipPath>
          </defs>
          <PlotBase g={geom} months={months} band={band} />
          <line ref={(el) => { els.current.play = el; }} className="play" x1={first.playX} x2={first.playX} y1={geom.T} y2={geom.bottom} style={first.showPlay ? undefined : { display: 'none' }} />
          <PlotTop g={geom} model={model} band={band} clipId={clipId} />
          {geom.wide && model.lines.map((l, i) => (
            <path key={l.id} ref={(el) => { els.current.leaders[l.id] = el; }} className="lead" stroke={KIND_COLOR[l.kind]} d={first.leaders![i]} />
          ))}
          {model.lines.map((l, i) => (
            <g key={l.id} ref={(el) => { els.current.heads[l.id] = el; }} transform={`translate(${first.heads[i].x.toFixed(2)} ${first.heads[i].y.toFixed(2)})`} data-head={l.id}>
              <Shape shape={l.shape} cx={0} cy={0} r={TL_HEAD_R} kind={l.kind} />
            </g>
          ))}
        </svg>
        <p className="tl-band" data-testid="sim-tl-band" style={{ left: geom.x(band.from - 0.5), top: geom.T, width: geom.x(band.to + 0.5) - geom.x(band.from - 0.5) }}>
          {COPY.tlBand}
        </p>
        {geom.wide && (
          <div className="tl-heads" style={{ height: geom.height }}>
            {model.lines.map((l, i) => (
              <div
                key={l.id} ref={(el) => { els.current.labels[l.id] = el; }} className="tl-head" data-measure={l.id} data-kind={l.kind} data-testid={`sim-tl-head-${l.id}`}
                style={{ height: TL_LABEL_H, transform: `translateY(${first.tops![i].toFixed(1)}px)` }}
              >
                <span className="g"><MarkGlyph l={l} /></span>
                <span className="v">{valueText(l)}</span>
                <span className="n">{COPY.tlHead[l.id]}</span>
                <span className="k" data-testid={`sim-tl-tag-${l.id}`}>{COPY.tlTag[l.kind]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {!geom.wide && (
        <ul className="tl-rows" data-testid="sim-tl-rows">
          {rows.map((l) => (
            <li className="tl-row" key={l.id} data-measure={l.id} data-kind={l.kind}>
              <PatternGlyph l={l} />
              <span>
                <span className="n">{COPY.tlHead[l.id]}</span>
                <span className="k" data-testid={`sim-tl-tag-${l.id}`}>{COPY.tlTag[l.kind]}</span>
              </span>
              <span className="v">{valueText(l)}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="tl-scale" data-testid="sim-tl-scale">{COPY.tlScale}</p>
      <p className="tl-more" data-testid="sim-tl-scale-more">{COPY.tlScaleMore}</p>
      <div className="tl-notes" data-testid="sim-tl-notes">
        <p className="tl-note" data-testid="sim-tl-ramp">{COPY.tlRampPerCase({ price: priceText, from: band.from, to: band.to })}</p>
        {diagnoses && <p className="tl-note" data-testid="sim-tl-dx-assumption">{COPY.tlAssumeDx}</p>}
        <p className="tl-note" data-testid="sim-tl-income">{COPY.tlIncomePlan}</p>
        {euroLines.map((l) => <p className="tl-note" key={l.testid} data-testid={`sim-tl-${l.testid}`}>{l.text}</p>)}
        {(drop || diagnoses) && <p className="tl-note" data-testid="sim-tl-curve">{curve}</p>}
        {tie && drop && <p className="tl-note muted" data-testid="sim-timeline-tie">{COPY.tlTie(tie)}</p>}
      </div>
      <details className="tl-values" data-testid="sim-tl-values">
        <summary>{COPY.tlShowValues}</summary>
        <table>
          {yearEnds.length === 2 && <caption>{COPY.tlTableCaption({ first: yearEnds[0], second: yearEnds[1] })}</caption>}
          <thead>
            <tr><th scope="col">{COPY.tlColMeasure}</th>{yearEnds.map((m) => <th scope="col" key={m}>{COPY.tlColMonth(m)}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id} data-measure={l.id}>
                <th scope="row">{COPY.tlName[l.id]}<span className="tl-unit">{COPY.tlUnit[l.id]}</span></th>
                {yearEnds.map((m) => <td key={m}>{formatValue(l, l.values[months.indexOf(m)], 'exact')}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}

/** Memoised: with a stable `tie` and `curve` it does not render on the page clock's frames, only when its own month changes. */
export const SimTimeline = memo(SimTimelineImpl);
