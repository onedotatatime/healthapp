/**
 * Pure helpers for the two doctor panels (MIN-4550 "About this file", MIN-4552 "Over time"): words, copy and the chart
 * geometry. No React. The words are the product's here: no word about health, no direction ("rising", "improving"), no
 * colour for good or bad (CTO decision on MIN-4548, section 2). `analysis.test.ts` scans the rendered text for them.
 */
import type { FileAnalysisRow, FileDocType, OverTimeSeries } from './analysis.contract';
import { formatDate, formatTime } from './record';

// ---- About this file ------------------------------------------------------------------------------------------

export const FILE_DOC_TYPE_LABEL: Record<FileDocType, string> = {
  blood_test: 'Blood test',
  imaging_report: 'Imaging report',
  doctor_letter: "Doctor's letter",
  other: 'Other document',
};

/** The quality flags as words. Empty when the model flagged none. */
export function qualityWords(r: Pick<FileAnalysisRow, 'readable' | 'blurred' | 'cropped' | 'rotated' | 'handwriting'>): string[] {
  const out: string[] = [];
  if (r.blurred) out.push('Blurred');
  if (r.cropped) out.push('Cropped');
  if (r.rotated) out.push('Rotated');
  if (r.handwriting) out.push('Handwriting present');
  return out;
}

export const presenceWord = (v: boolean | null) => (v === null ? 'not checked' : v ? 'present' : 'absent');

/** The first 8 hex characters of the SHA-256: enough to compare by eye, short enough to read. */
export const shortHash = (sha: string | null) => (sha ? sha.slice(0, 8) : null);

export function formatBytes(n: number | null): string | null {
  if (n === null) return null;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export const itemsLine = (n: number) => (n === 0 ? 'No item on this file is missing from the record.' : n === 1 ? '1 item on this file is not in the record' : `${n} items on this file are not in the record`);

export const uploadedLine = (ts: string | null) => (ts ? `${formatDate(ts)}, ${formatTime(ts)}` : 'not recorded');

export function hashCheckWord(v: boolean | null): string {
  if (v === null) return 'Not re-checked after the analysis.';
  return v ? 'Re-checked after the analysis: the stored file matches this fingerprint.' : 'Re-checked after the analysis: the stored file does NOT match this fingerprint.';
}

// ---- Over time ------------------------------------------------------------------------------------------------

export const NOT_ENOUGH = 'Not enough results for a projection';
/** The CTO's permanent label (MIN-4548 section 2). It sits next to the dashed line in every state that draws one. */
export const projectionLabel = (n: number, first: string, last: string) =>
  `Straight line through ${n} results, ${formatDate(first)} to ${formatDate(last)}. Arithmetic, not a prediction and not a diagnosis.`;

export function outOfRangeLine(s: OverTimeSeries): string {
  const { count, first_date, latest_date } = s.out_of_range;
  if (count === 0 || !first_date || !latest_date) return 'Never outside the printed range.';
  return `Outside the printed range ${count} ${count === 1 ? 'time' : 'times'}, first ${formatDate(first_date)}, latest ${formatDate(latest_date)}.`;
}

/** Numbers as printed in the response, to at most four significant digits (14.2 stays 14.2). */
export const fmtNum = (n: number) => String(Number(n.toPrecision(4)));

export const rangeWords = (p: { ref_low: number | null; ref_high: number | null }): string =>
  p.ref_low !== null && p.ref_high !== null ? `${fmtNum(p.ref_low)} to ${fmtNum(p.ref_high)}` : p.ref_high !== null ? `below ${fmtNum(p.ref_high)}` : p.ref_low !== null ? `above ${fmtNum(p.ref_low)}` : 'none printed';

export const FLAG_WORDS = { low: 'below range', high: 'above range', normal: 'within range', unknown: 'no range printed' } as const;

const DAY = 86_400_000;
export const dayOf = (d: string) => Date.parse(`${d}T00:00:00Z`) / DAY;
const addDays = (d: string, n: number) => new Date((dayOf(d) + n) * DAY).toISOString().slice(0, 10);

export interface ChartPoint { cite: string; x: number; y: number; date: string; value: number; outside: boolean }
export interface Chart {
  w: number;
  h: number;
  plot: { x0: number; x1: number; y0: number; y1: number };
  points: ChartPoint[];
  /** The printed range of the latest result, clipped to the plot. null when it printed none. */
  band: { y1: number; y2: number } | null;
  rangesDiffer: boolean;
  /** The one dashed straight line, from the first result's date to the horizon. null when the series has no projection. */
  line: { x1: number; y1: number; x2: number; y2: number } | null;
  /** Value to pixel, so a test can place a number from the response on the plot. */
  yOf(v: number): number;
  yTicks: { y: number; text: string }[];
  xTicks: { x: number; text: string; anchor: 'start' | 'end' }[];
}

/**
 * The geometry of one series. The line is rebuilt from the three numbers the server returns: its value at the horizon
 * and its slope per day, so it is exactly the server's line and this code fits nothing itself.
 */
export function buildChart(s: OverTimeSeries, w = 560, h = 260): Chart {
  const pad = { l: 46, r: 14, t: 14, b: 28 };
  const plot = { x0: pad.l, x1: w - pad.r, y0: pad.t, y1: h - pad.b };
  const first = s.points[0].date;
  const lastPoint = s.points[s.points.length - 1].date;
  const proj = s.projection;
  const endDate = proj && dayOf(proj.horizon_date) > dayOf(lastPoint) ? proj.horizon_date : lastPoint;
  const d0 = dayOf(first);
  const span = Math.max(dayOf(endDate) - d0, 1);
  const lineAt = (date: string) => (proj ? proj.value_at_horizon + proj.slope_per_day * (dayOf(date) - dayOf(proj.horizon_date)) : 0);

  const latest = s.points[s.points.length - 1];
  const ys = [...s.points.map((p) => p.value)];
  if (latest.ref_low !== null) ys.push(latest.ref_low);
  if (latest.ref_high !== null) ys.push(latest.ref_high);
  if (proj) ys.push(proj.value_at_horizon, lineAt(first));
  let lo = Math.min(...ys);
  let hi = Math.max(...ys);
  if (hi === lo) { lo -= 1; hi += 1; }
  const padY = (hi - lo) * 0.08;
  lo -= padY; hi += padY;

  const X = (date: string) => plot.x0 + ((dayOf(date) - d0) / span) * (plot.x1 - plot.x0);
  const Y = (v: number) => plot.y1 - ((v - lo) / (hi - lo)) * (plot.y1 - plot.y0);

  const bandLow = latest.ref_low ?? lo;
  const bandHigh = latest.ref_high ?? hi;
  const hasBand = latest.ref_low !== null || latest.ref_high !== null;
  const key = (p: { ref_low: number | null; ref_high: number | null }) => `${p.ref_low}|${p.ref_high}`;
  return {
    w, h, plot,
    points: s.points.map((p) => ({ cite: p.cite, x: X(p.date), y: Y(p.value), date: p.date, value: p.value, outside: p.flag === 'low' || p.flag === 'high' })),
    band: hasBand ? { y1: Y(Math.min(bandHigh, hi)), y2: Y(Math.max(bandLow, lo)) } : null,
    rangesDiffer: s.points.some((p) => key(p) !== key(latest)),
    line: proj ? { x1: X(first), y1: Y(lineAt(first)), x2: X(proj.horizon_date), y2: Y(proj.value_at_horizon) } : null,
    yOf: Y,
    yTicks: [hi - padY, lo + padY].map((v) => ({ y: Y(v), text: fmtNum(v) })),
    xTicks: [{ x: plot.x0, text: formatDate(first), anchor: 'start' as const }, { x: plot.x1, text: formatDate(endDate), anchor: 'end' as const }],
  };
}

/** The same horizon rule the CTO set, for the mock only: one point as far ahead as the series is long, 180 days at most. */
export const horizonFor = (first: string, last: string) => addDays(last, Math.min(Math.round(dayOf(last) - dayOf(first)), 180));
