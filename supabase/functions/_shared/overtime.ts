// healthapp-over-time (MIN-4551; CTO decision on MIN-4548): the doctor's numbers over time. Pure functions,
// no I/O, no model. The record's confirmed results go in; series, out-of-range counts and at most one
// straight line per series come out. Nothing here writes, ranks, scores, words a direction or names a cause.
//
// A series: one value (analyte_key, else the printed name) with 2+ dated numeric results in ONE unit. A value
// with 2+ numeric results that has mixed units, or fewer than 2 dated ones, is excluded and counted, never
// guessed. A value with a single result is not a series and is not counted.
// A projection: 3+ results on 3+ different dates, one least-squares line, one point as far ahead as the data
// is long and never more than 180 days. No date where the line crosses a range limit (CTO: that is a forecast
// of an abnormal result). If every result is 0 or above, the horizon stops before the line would go below 0
// (a concentration cannot be negative); if that leaves less than a day, there is no projection.
// The same value printed twice for one date (a document uploaded twice) counts once.
import type { ResultFact } from "./assistant.ts";
import type { CiteId } from "./contract.ts";

export const MAX_HORIZON_DAYS = 180;
export const MIN_PROJECTION_RESULTS = 3;
export const MIN_PROJECTION_DATES = 3;

export interface Point {
  date: string;
  value: number;
  cite: CiteId;
  ref_low: number | null;
  ref_high: number | null;
  out_of_range: boolean | null;
}
export interface Projection {
  n: number;
  first_date: string;
  last_date: string;
  slope_per_day: number;
  horizon_days: number;
  horizon_date: string;
  value_at_horizon: number;
}
export interface Series {
  key: string;
  analyte: string;
  unit: string | null;
  points: Point[];
  out_of_range: { count: number; first_date: string | null; latest_date: string | null };
  projection: Projection | null;
}
export interface Counts {
  records_read: number;
  values_with_series: number;
  projections_computed: number;
  series_excluded: number;
  errors: number;
}
export interface OverTime {
  series: Series[];
  counts: Counts;
}

const DAY_MS = 86_400_000;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
/** Whole days since 1970-01-01 for a YYYY-MM-DD, or null if it is not a real calendar date. */
function dayNumber(iso: string): number | null {
  const m = DATE.exec(iso);
  if (!m) return null;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  const d = new Date(t);
  if (d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) return null;
  return t / DAY_MS;
}
const isoOf = (day: number) => new Date(day * DAY_MS).toISOString().slice(0, 10);
/** Six significant digits: a straight line through a handful of printed values claims no more than that. */
const sig = (x: number) => Number(x.toPrecision(6));

const strip = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
/** analyte_key when the extractor coded the value, else the printed name, lower-cased and de-accented. */
export function keyOf(r: Pick<ResultFact, "analyte" | "analyte_key">): string {
  if (r.analyte_key && r.analyte_key.trim()) return r.analyte_key.trim().toLowerCase();
  return strip(r.analyte.toLowerCase()).replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
const unitKey = (u: string | null) => (u ?? "").trim().toLowerCase();

/** One least-squares straight line through (day, value). Null unless 3+ results on 3+ different dates. */
export function project(pts: { day: number; value: number }[]): Projection | null {
  const days = new Set(pts.map((p) => p.day));
  if (pts.length < MIN_PROJECTION_RESULTS || days.size < MIN_PROJECTION_DATES) return null;
  const sorted = [...pts].sort((a, b) => a.day - b.day);
  const d0 = sorted[0].day;
  const last = sorted[sorted.length - 1].day;
  const n = sorted.length;
  const xs = sorted.map((p) => p.day - d0);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = sorted.reduce((a, p) => a + p.value, 0) / n;
  let sxx = 0;
  let sxy = 0;
  sorted.forEach((p, i) => {
    sxx += (xs[i] - mx) ** 2;
    sxy += (xs[i] - mx) * (p.value - my);
  });
  const slope = sxy / sxx; // sxx > 0: three different dates
  const span = last - d0;
  let horizon = Math.min(MAX_HORIZON_DAYS, span);
  if (slope < 0 && sorted.every((p) => p.value >= 0)) {
    const atLast = my + slope * (span - mx);
    if (atLast <= 0) return null;
    horizon = Math.min(horizon, Math.floor(atLast / -slope));
  }
  if (horizon < 1) return null;
  const atHorizon = my + slope * (span + horizon - mx);
  return {
    n,
    first_date: isoOf(d0),
    last_date: isoOf(last),
    slope_per_day: sig(slope),
    horizon_days: horizon,
    horizon_date: isoOf(last + horizon),
    value_at_horizon: sig(atHorizon),
  };
}

export function overTime(results: ResultFact[]): OverTime {
  const groups = new Map<string, ResultFact[]>();
  for (const r of results) {
    if (r.value_num === null || !Number.isFinite(r.value_num)) continue;
    const k = keyOf(r);
    if (!k) continue;
    const rows = groups.get(k) ?? groups.set(k, []).get(k)!;
    if (!rows.some((x) => x.exam_date === r.exam_date && x.value_num === r.value_num && unitKey(x.unit) === unitKey(r.unit))) rows.push(r);
  }
  const series: Series[] = [];
  let excluded = 0;
  for (const [key, rows] of [...groups].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    if (rows.length < 2) continue; // one result is not a series
    if (new Set(rows.map((r) => unitKey(r.unit))).size > 1) {
      excluded++;
      continue;
    }
    const dated = rows
      .map((r, i) => ({ r, i, day: dayNumber(r.exam_date) }))
      .filter((x): x is { r: ResultFact; i: number; day: number } => x.day !== null)
      .sort((a, b) => a.day - b.day || a.i - b.i);
    if (dated.length < 2) {
      excluded++;
      continue;
    }
    const points: Point[] = dated.map(({ r }) => {
      const value = r.value_num as number;
      const hasLimit = r.ref_low !== null || r.ref_high !== null;
      return {
        date: r.exam_date,
        value,
        cite: `r:${r.id}` as CiteId,
        ref_low: r.ref_low,
        ref_high: r.ref_high,
        out_of_range: hasLimit ? (r.ref_low !== null && value < r.ref_low) || (r.ref_high !== null && value > r.ref_high) : null,
      };
    });
    const out = points.filter((p) => p.out_of_range === true);
    const latest = dated[dated.length - 1].r;
    series.push({
      key,
      analyte: latest.analyte,
      unit: latest.unit && latest.unit.trim() ? latest.unit.trim() : null,
      points,
      out_of_range: { count: out.length, first_date: out[0]?.date ?? null, latest_date: out[out.length - 1]?.date ?? null },
      projection: project(dated.map(({ r, day }) => ({ day, value: r.value_num as number }))),
    });
  }
  return {
    series,
    counts: {
      records_read: results.length,
      values_with_series: series.length,
      projections_computed: series.filter((s) => s.projection).length,
      series_excluded: excluded,
      errors: 0,
    },
  };
}
