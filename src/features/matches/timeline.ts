/**
 * The timeline plot: one scale per unit, the card's clock, and every frame as pure arithmetic (MIN-4724; contract: CTO, MIN-4720 comment 6fba2571;
 * CEO seat conditions 9 to 16, MIN-4721; spec A14 of docs/design/simulations-motion-spec.md). No DOM, no words and no data figure here:
 * SimTimeline.tsx draws it, timelinePaint.ts moves it, the tests read it.
 *
 * The scale rule (CTO, MIN-4720 section 1): each unit (people, euros, diagnoses) has ONE reference, the largest value over all months of all the
 * lines that share the unit, computed from the file. A line is drawn as a share of that reference, linear from zero, fixed from the first frame.
 * Banned and absent on purpose: a second y axis with unit ticks, a log or cropped axis, indexing to the first month, per-line scaling inside a
 * unit, smoothing between months.
 */
import { decimalsOf, formatCount, formatEuroK, formatEuroWhole, TL_LABEL_EVERY, TL_MS_PER_MONTH, TL_VIEW_START, type SimTimeline } from './simData';

export type TlKind = 'computed' | 'model' | 'plan';
export type TlMeasureId = 'patients' | 'matches' | 'income' | 'drop' | 'dx';
export type TlUnit = 'people' | 'euro' | 'dx';
export type TlShape = 'square' | 'circle' | 'up' | 'down' | 'diamond';
export type TlLine = { id: TlMeasureId; kind: TlKind; unit: TlUnit; shape: TlShape; values: number[]; decimals: number };

/** Which kind each line is (spec A14 section 2): computed on synthetic records, a model, or the plan. Pattern says the kind, the marker shape says the line. */
export const TL_KIND: Record<TlMeasureId, TlKind> = { patients: 'computed', matches: 'computed', income: 'plan', drop: 'model', dx: 'model' };
export const TL_UNIT: Record<TlMeasureId, TlUnit> = { patients: 'people', matches: 'people', income: 'euro', drop: 'euro', dx: 'dx' };
export const TL_SHAPE: Record<TlMeasureId, TlShape> = { patients: 'square', matches: 'circle', income: 'up', dx: 'down', drop: 'diamond' };
/** The stroke pattern of each kind: three different `stroke-dasharray` values. */
export const TL_DASH: Record<TlKind, string> = { computed: 'none', model: '6 4', plan: '12 4 2 4' };
/** The fixed order of the lines: the label stack's tie-break (spec A14 section 4). */
export const TL_LINE_ORDER: readonly TlMeasureId[] = ['patients', 'income', 'dx', 'matches', 'drop'];
/** The phone readout and the values table: people, then euros, then diagnoses, so rows of one unit sit together. */
export const TL_ROW_ORDER: readonly TlMeasureId[] = ['patients', 'matches', 'income', 'drop', 'dx'];
/** The months that carry a small marker in the middle of the plot, so a line can be told apart away from its head (spec A14 section 2). */
export const TL_MARKER_MONTHS: readonly number[] = [12, 18];

/** Layout constants (spec A14 sections 3 and 4), in CSS px. Layout, not data. */
export const TL_GEOM = {
  wide: { L: 24, R: 12, T: 26, H: 340, B: 44, labelCol: 260 },
  narrow: { L: 24, R: 12, T: 24, H: 240, B: 40, labelCol: 0 },
} as const;
export const TL_LABEL_H = 68;
export const TL_LABEL_GAP = 6;
/** A label starts this far above its head. */
export const TL_LABEL_LIFT = 14;
export const TL_HEAD_R = 6;
export const TL_MARK_R = 3.6;
/** The leader runs this far past the plot before it turns to its label. */
export const TL_LEADER_ELBOW = 10;
/** The plot width used before the first measure (server render, tests that pass none). */
export const TL_FALLBACK_W = { wide: 1072, narrow: 324 } as const;
/** From this viewport width up the heads' labels stand in a right column (the page's own desktop break). */
export const TL_WIDE_MIN = 900;
/** On a screen too short for `TL_VIEW_START` of the card, the run starts once the card fills this share of the viewport's height instead. */
export const TL_VIEW_FILL = 0.6;

export type TlModel = { months: number[]; lines: TlLine[]; refs: Record<TlUnit, number> };

/** The reference of one unit: the largest value, over all months, of all the lines that share it (CTO, MIN-4720 section 1, rule 2). */
export function unitReference(lines: TlLine[], unit: TlUnit): number {
  return Math.max(0, ...lines.filter((l) => l.unit === unit).flatMap((l) => l.values));
}

/** The lines the file has, in the fixed order, with each unit's reference. An absent optional line is simply not here, and its unit's reference is the maximum of what remains. */
export function buildModel(t: SimTimeline): TlModel {
  const make = (id: TlMeasureId, values: number[]): TlLine => ({
    id, kind: TL_KIND[id], unit: TL_UNIT[id], shape: TL_SHAPE[id], values, decimals: TL_UNIT[id] === 'dx' ? decimalsOf(values) : 0,
  });
  const present: Partial<Record<TlMeasureId, number[]>> = {
    patients: t.patients.values, matches: t.matches.values, income: t.income.values, drop: t.drop?.values, dx: t.diagnoses?.values,
  };
  const lines = TL_LINE_ORDER.flatMap((id) => { const v = present[id]; return v ? [make(id, v)] : []; });
  return { months: t.x, lines, refs: { people: unitReference(lines, 'people'), euro: unitReference(lines, 'euro'), dx: unitReference(lines, 'dx') } };
}

/** A line's value at one month as a share (0 to 1) of its unit's reference. */
export const shareOf = (m: TlModel, l: TlLine, i: number): number => (m.refs[l.unit] > 0 ? l.values[i] / m.refs[l.unit] : 0);

export type TlLayout = { wide: boolean; width: number };
export type TlGeom = {
  wide: boolean; L: number; R: number; T: number; H: number; B: number; labelCol: number;
  /** The SVG's width and height; `Wp` is the plot's right edge before the label column. */
  width: number; height: number; Wp: number; bottom: number;
  /** Month number to x; `px` takes a position on the data's own steps (0 to months - 1). */
  x: (month: number) => number;
  px: (pos: number) => number;
  /** A share of the unit's reference (0 to 1) to y: the one scale, from zero at the bottom. */
  y: (share: number) => number;
};

export function tlGeometry(layout: TlLayout, months: number[]): TlGeom {
  const g = layout.wide ? TL_GEOM.wide : TL_GEOM.narrow;
  const width = Math.max(layout.width, g.labelCol + g.L + g.R + 1);
  const Wp = width - g.labelCol;
  const span = Wp - g.L - g.R;
  const steps = months.length - 1;
  const px = (pos: number) => g.L + (pos * span) / steps;
  return {
    wide: layout.wide, ...g, width, height: g.T + g.H + g.B, Wp, bottom: g.T + g.H,
    x: (month) => px(month - months[0]), px, y: (share) => g.T + g.H * (1 - share),
  };
}

/** How long the run is: every month takes the same time, then the card holds the finished chart for the last half month. */
export const tlRunMs = (months: number[]) => months.length * TL_MS_PER_MONTH;

export type TlHead = { id: TlMeasureId; x: number; y: number; share: number; value: number };
export type TlFrame = {
  t: number;
  /** The position on the data's own steps, 0 to months - 1, linear in the clock. */
  pos: number;
  /** The month shown: the numbers change at month edges only, to that month's value in the file. */
  month: number;
  /** The index of that month. */
  index: number;
  done: boolean;
  clipW: number;
  playX: number;
  showPlay: boolean;
  heads: TlHead[];
  /** The tops of the labels and the leaders' paths, parallel to `heads`; null on a phone. */
  tops: number[] | null;
  leaders: string[] | null;
};

/**
 * Where the label tops go (spec A14 section 4), by arithmetic only: sort the heads by y (ties by the fixed line order, which is the order given),
 * each label's top is max(head y - lift, 0, previous top + label height + gap); then a back pass pulls the stack up so the last label stays inside.
 * Returned in the order of `ys`.
 */
export function placeLabels(ys: number[], labelH: number, gap: number, lift: number, limit: number): number[] {
  const order = ys.map((_, i) => i).sort((a, b) => ys[a] - ys[b] || a - b);
  const tops = new Array<number>(ys.length).fill(0);
  let prev = -Infinity;
  for (const i of order) { tops[i] = Math.max(ys[i] - lift, 0, prev + labelH + gap); prev = tops[i]; }
  const max = limit - labelH;
  for (let k = order.length - 1; k >= 0; k--) {
    const cap = k === order.length - 1 ? max : tops[order[k + 1]] - labelH - gap;
    if (tops[order[k]] > cap) tops[order[k]] = cap;
  }
  return tops;
}

/** The leader from a head to its label: horizontally past the plot, then diagonally to the label's first line. */
export const leaderPath = (h: { x: number; y: number }, top: number, g: TlGeom): string =>
  `M${(h.x + TL_HEAD_R + 2).toFixed(1)} ${h.y.toFixed(1)}H${(g.Wp - g.R + TL_LEADER_ELBOW).toFixed(1)}L${(g.Wp + TL_LEADER_ELBOW).toFixed(1)} ${(top + TL_LABEL_LIFT).toFixed(1)}`;

/** Everything the screen shows `t` ms after the card's run starts. The scale is the same at every `t`; only the position and the month move. */
export function tlFrame(t: number, m: TlModel, g: TlGeom): TlFrame {
  const run = tlRunMs(m.months);
  const time = Math.min(Math.max(t, 0), run);
  const last = m.months.length - 1;
  const pos = Math.min(last, time / TL_MS_PER_MONTH);
  const index = Math.min(last, Math.floor(pos));
  const next = Math.min(last, index + 1);
  const frac = pos >= last ? 0 : pos - index;
  const x = g.px(pos);
  const heads: TlHead[] = m.lines.map((l) => {
    const a = shareOf(m, l, index);
    const b = shareOf(m, l, next);
    const share = a + (b - a) * frac;
    return { id: l.id, x, y: g.y(share), share, value: l.values[index] };
  });
  let tops: number[] | null = null;
  let leaders: string[] | null = null;
  if (g.wide) {
    const placed = placeLabels(heads.map((h) => h.y), TL_LABEL_H, TL_LABEL_GAP, TL_LABEL_LIFT, g.height);
    tops = placed;
    leaders = heads.map((h, i) => leaderPath(h, placed[i], g));
  }
  return {
    t: time, pos, month: m.months[index], index, done: time >= run, clipW: x + 1, playX: x, showPlay: pos < last, heads, tops, leaders,
  };
}

/** Whether the card has come into view enough to start: 40% of it, or on a screen too short for that, most of the screen's height. */
export function shouldStartRun(ratio: number, visibleH: number, viewportH: number): boolean {
  return ratio >= TL_VIEW_START || (viewportH > 0 && visibleH >= TL_VIEW_FILL * viewportH);
}

/** The months that get a label: every third, as the data's own month numbers. */
export const labelledMonths = (months: number[]) => months.filter((m) => m % TL_LABEL_EVERY === 0);

export { pilotBand } from './simData';

/** The first month a count is above zero, or null. */
export const firstMonthAbove = (values: number[], months: number[]) => {
  const i = values.findIndex((v) => v > 0);
  return i < 0 ? null : months[i];
};

/** The one formatter of the page for a head value, a readout row or a table cell: counts with the thousands comma, euros rounded to thousands (head) or whole (table), the data's own decimals. */
export function formatValue(l: TlLine, v: number, style: 'head' | 'exact'): string {
  if (l.unit === 'people') return formatCount(v);
  if (l.unit === 'euro') return style === 'head' ? formatEuroK(v) : formatEuroWhole(v);
  return v.toFixed(l.decimals);
}
