/**
 * The timeline diagram's measures and geometry (MIN-4702, spec A13 of docs/design/simulations-motion-spec.md). No DOM, no words and no data
 * figure here: SimTimeline.tsx draws it, the tests read it. Every plotted y is a linear function of the value alone, from a zero baseline:
 * no second axis, no log, no index, no crop (CTO, MIN-4699 section 6).
 */
import {
  TL_LABEL_EVERY, decimalsOf, formatCount, formatEuroK, formatEuroTick, formatEuroWhole, formatTick, niceAxis,
  type SimTimeline,
} from './simData';

export type TlKind = 'computed' | 'model' | 'plan';
export type TlMeasureId = 'patients' | 'matches' | 'income' | 'drop' | 'dx';
export type TlLaneId = 'people' | 'euro' | 'dx';
export type TlMeasure = { id: TlMeasureId; kind: TlKind; values: number[]; unit: 'count' | 'euro' | 'decimal'; decimals: number };
export type TlLane = { id: TlLaneId; measures: TlMeasure[] };

/** Which of the three kinds each measure is (spec A13 section 2): computed on synthetic records, a model, or the plan. Told apart by pattern, marker and tag. */
export const TL_KIND: Record<TlMeasureId, TlKind> = { patients: 'plan', matches: 'computed', income: 'plan', drop: 'model', dx: 'model' };
/** The stroke pattern of each kind (spec A13 section 7: three different `stroke-dasharray` values). */
export const TL_DASH: Record<TlKind, string> = { computed: 'none', model: '6 4', plan: '12 4 2 4' };
export const TL_MARKER_R = 5;

/** Plot heights at wide (1280) and narrow (390), per lane (spec A13 section 1). */
export const TL_LANE_H = { people: [200, 150], euro: [200, 150], dx: [130, 110] } as const;
export const TL_INSETS = { wide: { L: 44, R: 12, T: 14 }, narrow: { L: 40, R: 12, T: 14 } } as const;
/** The gap between two keys in the wide right column. */
export const TL_KEY_GAP = 8;
/** A key's offset above its line's tip, and the height assumed for it until it is measured. */
export const TL_KEY_LIFT = 40;
export const TL_KEY_EST_H = 88;
/** The plot width used before the first measure (server render, tests that pass none). Layout only. */
export const TL_FALLBACK_W = { wide: 818, narrow: 324 } as const;
/** From this viewport width up the keys sit in a right column (the page's own desktop break). */
export const TL_WIDE_MIN = 900;

/** The lanes that have a measure, in the fixed order of the spec. A lane with no measure is absent. */
export function buildLanes(t: SimTimeline): TlLane[] {
  const m = (id: TlMeasureId, values: number[], unit: TlMeasure['unit']): TlMeasure => ({
    id, kind: TL_KIND[id], values, unit, decimals: unit === 'decimal' ? decimalsOf(values) : 0,
  });
  const euro: TlMeasure[] = [m('income', t.income.values, 'euro')];
  if (t.drop) euro.push(m('drop', t.drop.values, 'euro'));
  const lanes: TlLane[] = [
    { id: 'people', measures: [m('patients', t.patients.values, 'count'), m('matches', t.matches.values, 'count')] },
    { id: 'euro', measures: euro },
  ];
  if (t.diagnoses) lanes.push({ id: 'dx', measures: [m('dx', t.diagnoses.values, 'decimal')] });
  return lanes;
}

export type TlLayout = { wide: boolean; width: number };
export type TlLaneGeometry = {
  id: TlLaneId; L: number; R: number; T: number; B: number; plotH: number; width: number; height: number; bottom: number;
  axis: { top: number; ticks: number[] };
  x: (month: number) => number;
  y: (value: number) => number;
};

/** One lane's frame. The last lane carries the x axis title; at wide only it carries the month labels, at narrow every lane does (the keys sit between the lanes). */
export function laneGeometry(lane: TlLane, layout: TlLayout, months: number[], last: boolean): TlLaneGeometry {
  const ins = layout.wide ? TL_INSETS.wide : TL_INSETS.narrow;
  const plotH = TL_LANE_H[lane.id][layout.wide ? 0 : 1];
  const B = last ? 44 : layout.wide ? 10 : 24;
  const axis = niceAxis(Math.max(...lane.measures.flatMap((s) => s.values)));
  const first = months[0], end = months[months.length - 1];
  const { L, R, T } = ins;
  const x = (month: number) => L + ((month - first) * (layout.width - L - R)) / (end - first);
  const y = (value: number) => T + plotH * (1 - value / axis.top);
  return { id: lane.id, L, R, T, B, plotH, width: layout.width, height: T + plotH + B, bottom: T + plotH, axis, x, y };
}

/** The months that get a label: every third, as the data's own month numbers. */
export const labelledMonths = (months: number[]) => months.filter((m) => m % TL_LABEL_EVERY === 0);

export { pilotBand } from './simData';

/** The first month a count is above zero, or null. */
export const firstMonthAbove = (values: number[], months: number[]) => {
  const i = values.findIndex((v) => v > 0);
  return i < 0 ? null : months[i];
};

/**
 * Tops of the keys in the wide right column: each starts `TL_KEY_LIFT` above its line's tip, and no key starts less than `gap` px below the
 * previous one's measured end. Returned in the order of `tips`. Keys are placed in tip order; a stack that would end below the lane is pulled back up.
 */
export function placeKeys(tips: number[], heights: number[], gap: number, laneHeight: number): number[] {
  const order = tips.map((_, i) => i).sort((a, b) => tips[a] - tips[b]);
  const tops = new Array<number>(tips.length).fill(0);
  let prevEnd = -Infinity;
  for (const i of order) {
    const top = Math.max(0, tips[i] - TL_KEY_LIFT, prevEnd);
    tops[i] = top;
    prevEnd = top + heights[i] + gap;
  }
  let limit = laneHeight;
  for (const i of [...order].reverse()) {
    const maxTop = limit - heights[i];
    if (tops[i] > maxTop) tops[i] = Math.max(0, maxTop);
    limit = tops[i] - gap;
  }
  return tops;
}

/** The one formatter of the page for an end value or a table cell: counts with the thousands comma, euros rounded to thousands (key) or whole (table), the data's own decimals. */
export function formatValue(m: TlMeasure, v: number, style: 'key' | 'exact'): string {
  if (m.unit === 'count') return formatCount(v);
  if (m.unit === 'euro') return style === 'key' ? formatEuroK(v) : formatEuroWhole(v);
  return v.toFixed(m.decimals);
}
export const formatAxisTick = (m: TlMeasure, v: number): string => (m.unit === 'euro' ? formatEuroTick(v) : formatTick(v));
