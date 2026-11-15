/**
 * The ten-year Greece diagram's data and arithmetic (MIN-4749; contract: CTO, MIN-4744 comment fee57739; block built by Cron on MIN-4748;
 * spec A15 of docs/design/simulations-motion-spec.md). Reads the `ten_years` block of `data/synthetic/simulation.json`.
 * No value shown on the page is typed here: every number is read from the file, and the words are in copy.ts. No DOM, no React, no timer.
 * An invalid block means no diagram (the label and one sentence stay), never a placeholder.
 */
import { z } from 'zod';

export const MONTHS_PER_YEAR = 12;

export type Basis = 'yearly' | 'total';
export type PlotMode = 'five' | 'euro';
export type MoneyWording = 'drop' | 'saved';

/**
 * The three open rulings, one constant each, so the answer is a one-word change (CTO MIN-4744, CEO seat MIN-4746):
 *  - `plot`: 'five' is Pix's default (five lines, one scale per unit, real values only in the readout); 'euro' draws money and income on a true
 *    euro axis and leaves the other three as readout rows only (Pix's recommendation, open question 1).
 *  - `basis`: 'yearly' is "a year at that month's network size"; 'total' is the running total since month 1. One basis for all three flows.
 *  - `money`: 'drop' is "Modelled drop in cost in Greece" (the standing rule); 'saved' is the founder's word.
 */
export const DIAGRAM: { plot: PlotMode; basis: Basis; money: MoneyWording } = { plot: 'five', basis: 'yearly', money: 'drop' };

export type Kind = 'plan' | 'model' | 'computed';
export type LineId = 'money' | 'income' | 'patients' | 'matches' | 'dx';
export type Unit = 'euro' | 'people' | 'dx';
export type Shape = 'diamond' | 'up' | 'square' | 'circle' | 'down';

export type LineDef = { id: LineId; unit: Unit; kind: Kind; shape: Shape; stroke: number; r: number; offset: number };
/** The readout order is the order of this list after `money` (the money block comes first): euros, then people, then diagnoses. Draw order is the reverse, so money is on top. */
export const LINES: readonly LineDef[] = [
  { id: 'money', unit: 'euro', kind: 'model', shape: 'diamond', stroke: 4.5, r: 7.5, offset: 0 },
  { id: 'income', unit: 'euro', kind: 'plan', shape: 'up', stroke: 3, r: 6, offset: 11 },
  { id: 'patients', unit: 'people', kind: 'plan', shape: 'square', stroke: 3, r: 6, offset: 0 },
  { id: 'matches', unit: 'people', kind: 'computed', shape: 'circle', stroke: 3, r: 6, offset: 0 },
  { id: 'dx', unit: 'dx', kind: 'model', shape: 'down', stroke: 3, r: 6, offset: 0 },
];
export const DASH: Record<Kind, string> = { computed: 'none', model: '6 4', plan: '12 4 2 4' };

const Values = (n: number) => z.array(z.number().min(0)).length(n);
const RawTenYears = z.object({
  label: z.string().min(1),
  geography: z.string().min(1),
  x: z.object({ unit: z.string(), values: z.array(z.number().int()).min(MONTHS_PER_YEAR) }),
  plan: z.object({ yearly_k_eur: z.array(z.number().positive()).min(1) }),
  measured_until_month: z.number().int().min(0),
  plateau: z.object({ from_month: z.number().int().min(1), records: z.number().int().positive() }),
  patients: z.object({ values: z.unknown() }),
  matches: z.object({ values: z.unknown() }),
  diagnoses: z.object({ yearly: z.object({ values: z.unknown() }), total: z.object({ values: z.unknown() }) }),
  saved_eur: z.object({
    per_inhabitant_eur: z.number().positive(),
    total_mio_eur: z.number().positive(),
    drop_pts: z.unknown(),
    source: z.object({ name: z.string().min(1), url: z.string().url(), year: z.number().int() }),
    yearly: z.object({ values: z.unknown() }),
    total: z.object({ values: z.unknown() }),
  }),
  income_eur: z.object({ yearly: z.object({ values: z.unknown() }), total: z.object({ values: z.unknown() }) }),
});
const RawFile = z.object({
  assumption: z.object({ start: z.number().min(0).max(1), ceiling: z.number().min(0).max(1) }),
  series: z.array(z.object({ id: z.number(), formula: z.string().optional(), sources: z.array(z.object({ name: z.string(), url: z.string().url() })).optional() })).optional(),
  ten_years: z.unknown(),
});

export type Pair = { yearly: number[]; total: number[] };
export type TenYears = {
  label: string;
  geography: string;
  /** Months on the slider: 1 to `months`. */
  months: number;
  years: number;
  /** Plan years the plan itself covers (the file's `plan.yearly_k_eur`), and its last month. */
  planYears: number;
  planLastMonth: number;
  /** Months 1 to this are the real matching on the synthetic records; after it the matches are a model. */
  measuredUntil: number;
  plateau: { fromMonth: number; records: number };
  patients: number[];
  matches: number[];
  dx: Pair;
  money: Pair;
  income: Pair;
  /** The published drop in points of health spending, per month, and the Greek spending base: the inputs of the formula line. */
  dropPts: number[];
  perInhabitantEur: number;
  spendTotalMio: number;
  spendYear: number;
  spendSource: { name: string; url: string };
  assumption: { start: number; ceiling: number };
  /** The OECD share of health spending (the 11%), read from the file's own formula for series 3; undefined when it cannot be read. */
  costShare?: number;
  /** The baselines the model applies (WHO error rate, OECD cost share), from the file's series sources. */
  sources: { name: string; url: string }[];
};

export type TenParse = { ok: true; data: TenYears } | { ok: false };

const nonDecreasing = (a: number[]) => a.every((v, i) => i === 0 || v >= a[i - 1]);
const numbers = (n: number, v: unknown): number[] | undefined => {
  const r = Values(n).safeParse(v);
  return r.success ? r.data : undefined;
};

/** The share in "11 x (1 - effect x match_rate), ..." (the file's formula for series 3), as a 0 to 1 share. */
export function shareFromFormula(formula: string | undefined): number | undefined {
  const m = formula?.match(/^\s*(\d+(?:\.\d+)?)\s*x\s*\(/);
  return m ? Number(m[1]) / 100 : undefined;
}

/**
 * Required: the plan's months 1 to N (N a whole number of years), patients and records with a match (running totals that never fall),
 * both bases of diagnoses, Greek money and income, and the Greek spending base. Anything else invalid leaves the whole block out: the page
 * shows no diagram, not a partial one.
 */
export function parseSimulation(raw: unknown): TenParse {
  const f = RawFile.safeParse(raw);
  if (!f.success) return { ok: false };
  const t = RawTenYears.safeParse(f.data.ten_years);
  if (!t.success) return { ok: false };
  const d = t.data;
  const n = d.x.values.length;
  if (n % MONTHS_PER_YEAR !== 0 || !d.x.values.every((v, i) => v === i + 1)) return { ok: false };
  const patients = numbers(n, d.patients.values);
  const matches = numbers(n, d.matches.values);
  const dxY = numbers(n, d.diagnoses.yearly.values);
  const dxT = numbers(n, d.diagnoses.total.values);
  const moneyY = numbers(n, d.saved_eur.yearly.values);
  const moneyT = numbers(n, d.saved_eur.total.values);
  const incomeY = numbers(n, d.income_eur.yearly.values);
  const incomeT = numbers(n, d.income_eur.total.values);
  const dropPts = numbers(n, d.saved_eur.drop_pts);
  if (!patients || !matches || !dxY || !dxT || !moneyY || !moneyT || !incomeY || !incomeT || !dropPts) return { ok: false };
  if (![patients, matches, dxT, moneyT, incomeT].every(nonDecreasing)) return { ok: false };
  const planYears = d.plan.yearly_k_eur.length;
  if (planYears * MONTHS_PER_YEAR >= n || d.measured_until_month > n) return { ok: false };
  const s3 = f.data.series?.find((s) => s.id === 3);
  const sources = (f.data.series ?? []).filter((s) => s.id === 2 || s.id === 3).flatMap((s) => s.sources ?? []);
  const costShare = shareFromFormula(s3?.formula);
  return {
    ok: true,
    data: {
      label: d.label,
      geography: d.geography,
      months: n,
      years: n / MONTHS_PER_YEAR,
      planYears,
      planLastMonth: planYears * MONTHS_PER_YEAR,
      measuredUntil: d.measured_until_month,
      plateau: { fromMonth: d.plateau.from_month, records: d.plateau.records },
      patients,
      matches,
      dx: { yearly: dxY, total: dxT },
      money: { yearly: moneyY, total: moneyT },
      income: { yearly: incomeY, total: incomeT },
      dropPts,
      perInhabitantEur: d.saved_eur.per_inhabitant_eur,
      spendTotalMio: d.saved_eur.total_mio_eur,
      spendYear: d.saved_eur.source.year,
      spendSource: { name: d.saved_eur.source.name, url: d.saved_eur.source.url },
      assumption: f.data.assumption,
      ...(costShare !== undefined ? { costShare } : {}),
      sources,
    },
  };
}

// ---- the slider's month ---------------------------------------------------------------------------------------------------------

/** Plan year of a month (1 to 10) and the month inside that year (1 to 12). Month 120 is year 10, month 12. */
export const yearOf = (month: number) => Math.ceil(month / MONTHS_PER_YEAR);
export const monthInYear = (month: number) => ((month - 1) % MONTHS_PER_YEAR) + 1;
export const clampMonth = (month: number, months: number) => Math.min(Math.max(Math.round(month), 1), months);
/** Past the plan's own years: the readout says income is held flat (a state, not colour alone). */
export const afterPlan = (m: TenYears, month: number) => month > m.planLastMonth;

/** The value of one line at one month on the chosen basis. `month` is 1 to `months`. */
export function lineValues(m: TenYears, basis: Basis): Record<LineId, number[]> {
  return { money: m.money[basis], income: m.income[basis], patients: m.patients, matches: m.matches, dx: m.dx[basis] };
}
/** The kind of a line at a month: the matches are computed on the synthetic records up to `measuredUntil` and a model after it (CTO MIN-4744 section 1). */
export const kindAt = (m: TenYears, id: LineId, month: number): Kind =>
  id === 'matches' ? (month <= m.measuredUntil ? 'computed' : 'model') : (LINES.find((l) => l.id === id) as LineDef).kind;

/** The scale of a unit: the largest value of its lines over every month. It never changes with the slider (CTO MIN-4720 section 1). */
export function unitRefs(values: Record<LineId, number[]>, lines: readonly LineDef[] = LINES): Record<Unit, number> {
  const ref: Record<Unit, number> = { euro: 0, people: 0, dx: 0 };
  for (const l of lines) ref[l.unit] = Math.max(ref[l.unit], ...values[l.id]);
  return ref;
}
/** The lines the plot draws: all five, or the euro two when the plot is a true euro axis. */
export const plotted = (mode: PlotMode): LineDef[] => LINES.filter((l) => mode === 'five' || l.unit === 'euro');

export type Readout = Record<LineId, number>;
export function readoutAt(m: TenYears, basis: Basis, month: number): Readout {
  const v = lineValues(m, basis);
  const i = clampMonth(month, m.months) - 1;
  return { money: v.money[i], income: v.income[i], patients: v.patients[i], matches: v.matches[i], dx: v.dx[i] };
}

// ---- the plot's geometry (spec A15 section 2) -----------------------------------------------------------------------------------

export type Geometry = {
  W: number; H: number; T: number; B: number; L: number; R: number; Ht: number;
  /** A month 0 to `months` (0 is the start of the plan, where every line is 0). */
  x: (month: number) => number;
  /** A share of the unit's reference, 0 to 1. */
  y: (share: number) => number;
  /** The slider's margin-left and width in px, so the thumb's centre is exactly x(month) for month 1 to `months`. */
  slider: { marginLeft: number; width: number };
};
/** Half the thumb in px; Firefox's thumb is 26 wide (13). One constant, used for the CSS too. */
export const THUMB_HALF = 16;
export function plotGeometry(W: number, wide: boolean, mode: PlotMode, months: number): Geometry {
  const T = wide ? 46 : 54, H = wide ? 320 : 160, B = 40, L = mode === 'euro' ? 64 : 28, R = 20;
  const span = W - L - R;
  return {
    W, H, T, B, L, R, Ht: T + H + B,
    x: (month) => L + (month * span) / months,
    y: (share) => T + H * (1 - share),
    // month 1's centre is at L + span / months and the last month's at L + span: the track between them is (months - 1) / months of the span.
    slider: { marginLeft: L + span / months - THUMB_HALF, width: (span * (months - 1)) / months + 2 * THUMB_HALF },
  };
}
/** One polyline for a line: the origin (month 0, value 0) then every month. Matches are split at `measuredUntil` so the pattern says the kind. */
export function polylinePoints(g: Geometry, values: number[], ref: number, from = 0, to = values.length): string {
  const pts: string[] = [];
  if (from === 0) pts.push(`${g.x(0).toFixed(1)},${g.y(0).toFixed(1)}`);
  for (let k = Math.max(from, 1); k <= to; k++) pts.push(`${g.x(k).toFixed(1)},${g.y(ref > 0 ? values[k - 1] / ref : 0).toFixed(1)}`);
  return pts.join(' ');
}

// ---- formatters (one set for the page; spec A15 section 4) ----------------------------------------------------------------------

const grouped = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
export const formatCount = (n: number) => grouped.format(Math.round(n));
/** Euros: under 1,000 whole ("€640"), under 1 million in thousands ("€121k"), from 1 million one decimal ("€1.8 million"). */
export function formatEuro(eur: number): string {
  const r = Math.round(eur);
  if (r < 1000) return `€${r}`;
  if (r < 999_500) return `€${grouped.format(Math.round(r / 1000))}k`;
  return `€${(r / 1e6).toFixed(1)} million`;
}
/** Diagnoses: one decimal under 10, whole from 10 (with the thousands comma). */
export const formatDx = (v: number) => (v >= 9.95 ? grouped.format(Math.round(v)) : v.toFixed(1));
/** Euros in whole units for the values table and the exact figure. */
export const formatEuroWhole = (eur: number) => `€${grouped.format(Math.round(eur))}`;
export const formatEuroCents = (eur: number) => `€${eur.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
/** A share of 0 to 1 as a percentage with a trailing .0 dropped: 10%, 11.5%, 20%. */
export const formatPct = (share: number) => `${(share * 100).toFixed(1).replace(/\.0$/, '')}%`;
/** The health-spending total: billions with one decimal ("€19.9 billion"). */
export const formatBillions = (mio: number) => `€${(mio / 1000).toFixed(1)} billion`;
/** The per-inhabitant base in the "for scale" sentence: whole euros. */
export const formatPerInhabitant = (eur: number) => `€${grouped.format(Math.round(eur))}`;
export const formatPoints = (p: number) => p.toFixed(2);
