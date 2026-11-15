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
/** One match cell landing, and one new cell fading in (the --dur-land token). */
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
  series: z.array(Series),
});

export type SimulationData = {
  label: string;
  x: { label: string; values: number[] };
  assumption: { value: number; start: number; ceiling: number; effect?: number[] };
  series: SimSeries[];
  matches?: SimMatches;
  euro?: SimEuro;
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
  return { ok: true, data };
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

/** Cells visible: the cells of the new records fade in one after the other over the first 400 ms of an interval. */
export function visibleCells(f: SimFrame, xs: number[]): number {
  if (f.phase === 'entry') return xs[0];
  const from = xs[f.interval - 1] ?? xs[0];
  const to = xs[f.interval];
  const added = to - from;
  if (f.phase !== 'play' || added <= 0) return to;
  const window = SIM_GROW_MS - SIM_LAND_FADE_MS;
  return from + Math.min(added, Math.floor((f.tau * (added - 1)) / window) + 1);
}
/** Matches counted so far: the matches of an interval land one at a time, evenly over the match window, in reading order. */
export function matchesAt(f: SimFrame, counts: number[]): number {
  if (f.phase === 'entry') return counts[0];
  if (f.phase !== 'play') return counts[f.interval];
  const prev = counts[f.interval - 1];
  const delta = counts[f.interval] - prev;
  const [from, to] = SIM_MATCH_WINDOW;
  const landed = Math.floor(((f.tau - from) * delta) / (to - from) + 0.5);
  return prev + Math.min(delta, Math.max(0, landed));
}

/** The assumed effect shown: the value of the last completed step. */
export const effectIndex = (f: SimFrame) => (f.phase === 'entry' ? 0 : f.g >= 1 ? f.interval : f.interval - 1);

/** The one value the clock drives for the euro figure: the drop in points of health spending, at 2 decimals, linear between the file's values. */
export const shownDrop = (drop: number[], idx: number) => +valueAt(drop, idx).toFixed(2);

const grouped = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
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
