/**
 * The simulation (MIN-4507, motion and euro outcome MIN-4608). Reads `data/synthetic/simulation.json` (committed by Cron,
 * MIN-4505 and MIN-4607) and turns it into frames. No value shown on the screen is typed here: every number comes from the
 * JSON; the words are in copy.ts. Series 1 is always plotted; series 2 and 3 only when the JSON has them (and they have a
 * source). The euro block and the match counts are optional: a missing or invalid block means no element, never a placeholder.
 */
import { z } from 'zod';

// Playback, one linear clock for the whole screen (Pix's spec A3). These are time, not data.
export const SIM_ENTRY_MS = 600;
export const SIM_STEP_MS = 2600;
export const SIM_GROW_MS = 400;
/** Within one step: matches land and the values move between these two moments (ms into the step). */
export const SIM_MATCH_WINDOW: readonly [number, number] = [400, 2100];
export const SIM_LANDING_MS = 800;
/** One match dot landing (the --dur-land token): the dots that landed in the last 160 ms are the moving front. */
export const SIM_LAND_FADE_MS = 160;
/** Play time for a run of `steps` data points: entry, one step per interval, landing. */
export const simDuration = (steps: number) => SIM_ENTRY_MS + (steps - 1) * SIM_STEP_MS + SIM_LANDING_MS;
/** The whole run is 30 seconds (the CTO's decision on MIN-4505) for the 12 data points of the committed file. */
export const SIM_DURATION_MS = SIM_ENTRY_MS + 11 * SIM_STEP_MS + SIM_LANDING_MS;

const Source = z.object({ name: z.string(), url: z.string().url() });
const Series = z.object({
  id: z.number().int(),
  key: z.string(),
  label: z.string(),
  unit: z.string(),
  values: z.array(z.number()),
  /** Only the modelled series (2 and 3) carry a formula; series 1 is computed by running the matching logic. */
  formula: z.string().optional(),
  sources: z.array(Source).optional(),
});
export type SimSeries = z.infer<typeof Series>;

const Matches = z.object({
  label: z.string(),
  definition: z.string(),
  count: z.array(z.number().int().min(0)),
});
export type SimMatches = z.infer<typeof Matches>;

const Euro = z.object({
  currency: z.string(),
  geography: z.string(),
  year: z.number().int(),
  total_mio_eur: z.number().positive(),
  total_eur_per_inhabitant: z.number().positive(),
  drop_pts: z.array(z.number()),
  drop_mio_eur: z.array(z.number()),
  drop_eur_per_inhabitant: z.array(z.number()),
  loss_mio_eur: z.array(z.number()),
  formula: z.string(),
  source: z.object({ name: z.string(), url: z.string().url(), query_url: z.string().url(), opened: z.string() }),
});
export type SimEuro = z.infer<typeof Euro>;

/** `start` and `ceiling` are required: a file without them is the old model and must not show the new sentence. The rest of the new blocks is checked apart, below. */
const RawSimulation = z.object({
  label: z.string(),
  x: z.object({ label: z.string(), values: z.array(z.number()) }),
  assumption: z.object({
    value: z.number().min(0).max(1),
    start: z.number().min(0).max(1),
    ceiling: z.number().min(0).max(1),
    effect: z.unknown().optional(),
  }),
  matches: z.unknown().optional(),
  euro: z.unknown().optional(),
  /** Checked apart, like `euro` (CTO, MIN-4699): an invalid block means no diagram and nothing else changes. */
  timeline: z.unknown().optional(),
  series: z.array(Series),
});

export type SimulationData = {
  label: string;
  x: { label: string; values: number[] };
  assumption: { value: number; start: number; ceiling: number; effect?: number[] };
  series: SimSeries[];
  matches?: SimMatches;
  euro?: SimEuro;
  timeline?: SimTimeline;
};

export type SimParse = { ok: true; data: SimulationData } | { ok: false };

const nonDecreasing = (a: number[]) => a.every((v, i) => i === 0 || v >= a[i - 1]);

/**
 * Series 1 must exist and every series must have one value per x. A series with no values or no length match is dropped,
 * never padded. `matches`, `euro` and `assumption.effect` are optional and checked like a series (one value per x, finite
 * numbers, URLs that parse): when one fails it is left out, and the screen shows nothing in its place. The euro figure
 * needs series 3 (it is the drop of that series): without it the euro block is left out too.
 */
export function parseSimulation(raw: unknown): SimParse {
  const p = RawSimulation.safeParse(raw);
  if (!p.success) return { ok: false };
  const n = p.data.x.values.length;
  const series = p.data.series.filter((s) => s.values.length === n && n >= 2);
  if (!series.some((s) => s.id === 1)) return { ok: false };
  series.sort((a, b) => a.id - b.id);

  const effect = z.array(z.number().min(0).max(1)).length(n).safeParse(p.data.assumption.effect);
  const m = Matches.safeParse(p.data.matches);
  const matches = m.success && m.data.count.length === n && nonDecreasing(m.data.count) ? m.data : undefined;
  const e = Euro.safeParse(p.data.euro);
  const euroOk =
    e.success &&
    [e.data.drop_pts, e.data.drop_mio_eur, e.data.drop_eur_per_inhabitant, e.data.loss_mio_eur].every((a) => a.length === n) &&
    series.some((s) => s.id === 3 && isModel(s));
  const { value, start, ceiling } = p.data.assumption;
  const data: SimulationData = {
    label: p.data.label,
    x: p.data.x,
    assumption: effect.success ? { value, start, ceiling, effect: effect.data } : { value, start, ceiling },
    series,
  };
  if (matches) data.matches = matches;
  if (euroOk) data.euro = e.data;
  const timeline = parseTimeline(p.data.timeline);
  if (timeline) data.timeline = timeline;
  return { ok: true, data };
}

// ---------------------------------------------------------------------------------------------------------------------------
// The timeline (MIN-4696; contract: CTO, MIN-4699 comment 8b038e47; built by Cron on MIN-4701; spec A13 of docs/design/simulations-motion-spec.md).
// 24 plan months. Parsed apart from the three series: an invalid block means no diagram and nothing else on the page
// changes; an invalid OPTIONAL measure means only that line is left out. Nothing is padded and nothing is typed in the UI.
// ---------------------------------------------------------------------------------------------------------------------------

/** The plan has 24 months on the screen (CTO, MIN-4699 section 4: months 25 to 36 are out). */
export const TL_MONTHS = 24;
/** The free pilot starts in plan month 3 (docs/business/team-and-funding-plan.md section 3: "Months 3 to 8 ... free pilot"). It ends the month before the first paid case, which is read from the data. */
export const TL_PILOT_FROM = 3;
/** The x axis is labelled at every third month, ending on the last (spec A13 section 1). */
export const TL_LABEL_EVERY = 3;

/**
 * The free pilot band and the first-paid marker, derived from the data and never typed: the first paid month is the first month with a
 * patient; the band is the months from the plan's pilot start up to the month before it. No paid month after the pilot start means neither.
 */
export function pilotBand(patients: number[], months: number[]): { from: number; to: number; firstPaid: number } | null {
  const i = patients.findIndex((v) => v > 0);
  if (i < 0) return null;
  const firstPaid = months[i];
  if (firstPaid <= TL_PILOT_FROM) return null;
  return { from: TL_PILOT_FROM, to: firstPaid - 1, firstPaid };
}

const nonNegative = (n: number) => z.array(z.number().min(0)).length(n);
/** A count that only accumulates (patients, records with a match): 24 non-negative values that never fall. */
const runningTotal = (n: number) => nonNegative(n).refine(nonDecreasing, { message: 'a running total never falls' });
const Unit = z.string().min(1);

/**
 * The block as the CEO seat's decision on MIN-4698 fixed it: patients are the per-case ramp only, and the money and diagnoses measures
 * are YEARLY figures at that month's network size (never a running total of modelled money). Our income is the plan's yearly run rate
 * (`income_run_rate_eur`). The running income total (`income_eur`) stays in the file for the plan check and is not drawn.
 */
const RawTimeline = z.object({
  label: z.string().min(1),
  x: z.object({ unit: z.string(), values: z.array(z.number()).length(TL_MONTHS) }),
  plan: z.object({ name: z.string().min(1), status: z.string().min(1), price_eur_per_case: z.number().positive() }),
  patients: z.object({ unit: Unit, values: runningTotal(TL_MONTHS), ramp: z.string() }),
  matches: z.object({ count: runningTotal(TL_MONTHS) }),
  income_run_rate_eur: z.object({ unit: Unit, status: z.string().min(1), values: nonNegative(TL_MONTHS) }),
  /** Optional, each written only on the CEO seat's decision (`status` quotes it). Checked one by one below: an invalid one leaves only its own line out. */
  diagnoses: z.unknown().optional(),
  drop_eur: z.unknown().optional(),
});
const Diagnoses = z.object({ unit: Unit, status: z.string().min(1), method: z.string().min(1), assumption: z.string().min(1), values: nonNegative(TL_MONTHS) });
const Drop = z.object({
  unit: Unit, status: z.string().min(1), method: z.string().min(1), values: nonNegative(TL_MONTHS),
  /** The published two-decimal drop in points of spending, per month, and the spending base: the two inputs of the formula line. */
  drop_pts: nonNegative(TL_MONTHS), per_inhabitant_eur: z.number().positive(),
});

export type SimTimeline = {
  label: string;
  x: number[];
  plan: { name: string; status: string; priceEurPerCase: number };
  patients: { unit: string; values: number[] };
  matches: { values: number[] };
  /** Our income: the plan's yearly run rate at each month. A plan, not a measurement. */
  income: { unit: string; status: string; values: number[] };
  diagnoses?: { unit: string; status: string; method: string; assumption: string; values: number[] };
  drop?: { unit: string; status: string; method: string; values: number[]; points: number[]; perInhabitantEur: number };
};

/** Whether a unit string says a running total or a yearly rate. Money and diagnoses are shown only as yearly figures (CEO seat, MIN-4698 condition 10). */
export type MoneyBasis = 'running' | 'yearly';
export function basisOf(unit: string): MoneyBasis | null {
  if (/running|so far|cumulative/i.test(unit)) return 'running';
  if (/a year|per year|yearly|annual/i.test(unit)) return 'yearly';
  return null;
}

/** The drop at one month from its two published inputs: points / 100 x the spending base x the patients. The formula line on screen is this, so it must give the figure shown. */
export const dropFromInputs = (points: number, perInhabitantEur: number, patients: number) => (points / 100) * perInhabitantEur * patients;

/**
 * The `timeline` block, or `undefined`. Required: x = plan months 1 to 24; the plan's own status and price; patients and records with a
 * match (24 non-negative values that never fall; the patient ramp is the per-case one, the only one the assumption line describes);
 * our income as the plan's yearly run rate. Optional: diagnoses and drop_eur, each with a status that quotes the decision, and each only
 * as a YEARLY figure. A drop line whose formula does not give its own end value at the precision shown (whole thousands) is left out,
 * as is a line on a running-total basis: two bases on one euro axis would mislead, and a rescale is banned.
 */
export function parseTimeline(raw: unknown): SimTimeline | undefined {
  const t = RawTimeline.safeParse(raw);
  if (!t.success) return undefined;
  const d = t.data;
  if (!d.x.values.every((v, i) => v === i + 1)) return undefined;
  if (d.patients.ramp !== 'per_case_only') return undefined;
  if (!pilotBand(d.patients.values, d.x.values)) return undefined;   // the card's story is the free pilot and the first paid month: a block without them is not this plan
  if (basisOf(d.income_run_rate_eur.unit) !== 'yearly') return undefined;
  const out: SimTimeline = {
    label: d.label,
    x: d.x.values,
    plan: { name: d.plan.name, status: d.plan.status, priceEurPerCase: d.plan.price_eur_per_case },
    patients: { unit: d.patients.unit, values: d.patients.values },
    matches: { values: d.matches.count },
    income: { unit: d.income_run_rate_eur.unit, status: d.income_run_rate_eur.status, values: d.income_run_rate_eur.values },
  };
  const rec = (raw ?? {}) as Record<string, unknown>;
  const dx = Diagnoses.safeParse(rec.diagnoses);
  if (dx.success && basisOf(dx.data.unit) === 'yearly') out.diagnoses = { ...dx.data };
  const dr = Drop.safeParse(rec.drop_eur);
  if (dr.success && basisOf(dr.data.unit) === 'yearly') {
    const last = TL_MONTHS - 1;
    const given = dr.data.values[last];
    const formula = dropFromInputs(dr.data.drop_pts[last], dr.data.per_inhabitant_eur, d.patients.values[last]);
    if (formatEuroK(formula) === formatEuroK(given)) {
      out.drop = { unit: dr.data.unit, status: dr.data.status, method: dr.data.method, values: dr.data.values, points: dr.data.drop_pts, perInhabitantEur: dr.data.per_inhabitant_eur };
    }
  }
  return out;
}

export const isModel = (s: SimSeries) => s.id !== 1 && s.formula !== undefined;
/** Series 2 or 3 asked for by the design but not in the data: the screen says so in Anna's words. */
export const hasDropped = (d: SimulationData) => ![2, 3].every((id) => d.series.some((s) => s.id === id));

export type SimPhase = 'entry' | 'play' | 'landing' | 'done';
export type SimFrame = {
  phase: SimPhase;
  /** The interval being played, 1 to n - 1; 0 during the entry. In the landing and done it is the last. */
  interval: number;
  /** Milliseconds into that interval. */
  tau: number;
  /** Where the values are on the data's own steps: continuous, 0 to n - 1. Linear in the clock, no easing. */
  idx: number;
  /** Value progress inside the interval, 0 to 1. */
  g: number;
  /** From the start of the landing on (the baselines and the card edge). */
  landed: boolean;
  done: boolean;
};

/** The one clock: what the screen shows `t` milliseconds after the first frame, for a run of `n` data points. Every number on the screen is derived from this and the data. */
export function clockAt(t: number, n: number): SimFrame {
  const [from, to] = SIM_MATCH_WINDOW;
  const last = n - 1;
  const playEnd = SIM_ENTRY_MS + last * SIM_STEP_MS;
  const time = Math.max(0, t);
  if (time < SIM_ENTRY_MS) return { phase: 'entry', interval: 0, tau: 0, idx: 0, g: 0, landed: false, done: false };
  if (time < playEnd) {
    const interval = Math.floor((time - SIM_ENTRY_MS) / SIM_STEP_MS) + 1;
    const tau = time - SIM_ENTRY_MS - (interval - 1) * SIM_STEP_MS;
    const g = Math.min(Math.max((tau - from) / (to - from), 0), 1);
    return { phase: 'play', interval, tau, idx: interval - 1 + g, g, landed: false, done: false };
  }
  const done = time >= simDuration(n);
  return { phase: done ? 'done' : 'landing', interval: last, tau: SIM_STEP_MS, idx: last, g: 1, landed: true, done };
}

/** A value on a series at the clock's position: linear between the data's own steps, equal to the data at each step. */
export function valueAt(values: number[], idx: number): number {
  const k = Math.min(Math.floor(idx), values.length - 1);
  const next = Math.min(k + 1, values.length - 1);
  return values[k] + (values[next] - values[k]) * (idx - k);
}

/** Records in the network at this moment (the x value). It swaps at the start of each interval, with no animation. */
export const networkIndex = (f: SimFrame) => f.interval;

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
/** The ease of the dot sweep (stands for --ease-out in script, where a CSS curve cannot be used). */
const easeOut = (p: number) => 1 - (1 - p) ** 3;

/**
 * Dots visible (spec A12, step 2): the new records of an interval appear as one sweep in reading order over the first 400 ms,
 * no per-dot fade. At the start of an interval it is the previous step's count, at 400 ms it is the data's.
 */
export function visibleCells(f: SimFrame, xs: number[]): number {
  if (f.phase === 'entry') return xs[0];
  const from = xs[f.interval - 1] ?? xs[0];
  const to = xs[f.interval];
  if (f.phase !== 'play') return to;
  return from + Math.round((to - from) * easeOut(clamp01(f.tau / SIM_GROW_MS)));
}
/**
 * Matches counted so far (spec A12, step 3): `M(i-1) + floor(DeltaM x g)`, g the same linear progress that drives the values, so the
 * counter, the dots and the line tips cannot disagree. The matched dots are the first `m` in reading order. `lag` asks for the
 * count that long ago (ms): the dots between that and now are the moving front.
 */
export function matchesAt(f: SimFrame, counts: number[], lag = 0): number {
  if (f.phase === 'entry') return counts[0];
  if (f.phase !== 'play') return counts[f.interval];
  const prev = counts[f.interval - 1];
  const delta = counts[f.interval] - prev;
  const [from, to] = SIM_MATCH_WINDOW;
  const g = lag === 0 ? f.g : clamp01((f.tau - lag - from) / (to - from));
  return prev + Math.floor(delta * g);
}
/** A dot's radius as it lands: from FRONT_R_FROM of full to full, eased, over `SIM_LAND_FADE_MS`; `age` is 0 to 1 over that time. */
export const landingScale = (age: number, from: number) => from + (1 - from) * easeOut(clamp01(age));

/** The assumed effect shown: the value of the last completed step. */
export const effectIndex = (f: SimFrame) => (f.phase === 'entry' ? 0 : f.g >= 1 ? f.interval : f.interval - 1);

/** The one value the clock drives for the euro figure: the drop in points of health spending, at 2 decimals, linear between the file's values. */
export const shownDrop = (drop: number[], idx: number) => +valueAt(drop, idx).toFixed(2);

const grouped = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
/** A count of records or matches, with the thousands comma: 417, 1,250, 5,000. The axis and the figures write it the same way. */
export const formatCount = (n: number) => grouped.format(Math.round(n));
/** A euro amount given in millions, in Anna's written form: under one million in euros, then millions, then billions with one decimal. */
export function formatEuro(mio: number): string {
  if (mio === 0) return '€0';
  if (mio < 1) return `€${grouped.format(Math.round(mio * 1e6))}`;
  if (Math.round(mio) < 1e3) return `€${Math.round(mio)} million`;
  return `€${(mio / 1e3).toFixed(1)} billion`;
}
/** A euro amount per inhabitant, whole euros. */
export const formatPerInhabitant = (eur: number) => `€${Math.round(eur)}`;
/** The health-spending total in the formula line: billions, thousands comma. */
export const formatTotal = (mio: number) => `€${grouped.format(Math.round(mio / 1e3))} billion`;
/** A share of 0 to 1 as a percentage with one decimal and a trailing .0 dropped: 10%, 11.5%, 20%. */
export const formatPct = (share: number) => `${(share * 100).toFixed(1).replace(/\.0$/, '')}%`;

/** A euro amount in whole euros, thousands comma: the exact figure of the values table (€164,352). */
export const formatEuroWhole = (eur: number) => `€${grouped.format(Math.round(eur))}`;
/** A euro amount with cents, thousands comma: the per-inhabitant base and the per-patient figure (€4,074.88, €31.38). */
export const formatEuroCents = (eur: number) => `€${eur.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
/** A euro amount of the timeline, rounded to whole thousands from 1,000 up (€164k), whole euros below. */
export function formatEuroK(eur: number): string {
  const r = Math.round(eur);
  if (r >= 999_500) return `€${(r / 1e6).toFixed(1).replace(/\.0$/, '')}m`;
  return r >= 1000 ? `€${grouped.format(Math.round(r / 1000))}k` : `€${r}`;
}
/** A euro axis tick: thousands with at most one decimal, so 2,500 reads €2.5k and never a rounded €3k. */
export function formatEuroTick(eur: number): string {
  if (eur < 1000) return `€${+eur.toFixed(2)}`;
  const k = Math.round((eur / 1000) * 10) / 10;
  return `€${k}k`;
}
/** A tick of a unit-less axis (people, diagnoses): the value with at most two decimals, thousands comma. */
export const formatTick = (v: number) => (Number.isInteger(v) ? grouped.format(v) : String(+v.toFixed(2)));

/** Axis from zero to a round top at or above the data: 4 or 5 ticks. Never rescaled to make a curve steeper. */
export function niceAxis(max: number): { top: number; ticks: number[] } {
  const raw = max > 0 ? max / 4 : 1;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? pow * 10);
  const count = Math.max(1, Math.ceil(max / step - 1e-9));
  return { top: count * step, ticks: Array.from({ length: count + 1 }, (_, i) => +(i * step).toFixed(10)) };
}

/** Fraction digits to print: as many as the data itself has (at most 2), so 5 prints "5.00" next to "4.66" and 33.5 prints "33.5". */
export function decimalsOf(values: number[]): number {
  return Math.min(2, Math.max(0, ...values.map((v) => (String(v).split('.')[1] ?? '').length)));
}
