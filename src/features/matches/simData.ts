/**
 * The simulation (MIN-4507). Reads `data/synthetic/simulation.json` (committed by Cron, MIN-4505) and turns it into
 * frames. No value shown on the screen is typed here: every number comes from the JSON; the words are in copy.ts.
 * Series 1 is always plotted; series 2 and 3 only when the JSON has them (and they have a source).
 */
import { z } from 'zod';

/** The whole run is 30 seconds (the CTO's decision on MIN-4505). Playback time, not a data value. */
export const SIM_DURATION_MS = 30_000;

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

export const SimulationData = z.object({
  label: z.string(),
  x: z.object({ label: z.string(), values: z.array(z.number()) }),
  assumption: z.object({ value: z.number().min(0).max(1) }),
  series: z.array(Series),
});
export type SimulationData = z.infer<typeof SimulationData>;

export type SimParse = { ok: true; data: SimulationData } | { ok: false };

/** Series 1 must exist and every series must have one value per x. A series with no values or no length match is dropped, never padded. */
export function parseSimulation(raw: unknown): SimParse {
  const p = SimulationData.safeParse(raw);
  if (!p.success) return { ok: false };
  const n = p.data.x.values.length;
  const series = p.data.series.filter((s) => s.values.length === n && n >= 2);
  if (!series.some((s) => s.id === 1)) return { ok: false };
  return { ok: true, data: { ...p.data, series: series.sort((a, b) => a.id - b.id) } };
}

export const isModel = (s: SimSeries) => s.id !== 1 && s.formula !== undefined;
/** Series 2 or 3 asked for by the design but not in the data: the screen says so in Anna's words. */
export const hasDropped = (d: SimulationData) => ![2, 3].every((id) => d.series.some((s) => s.id === id));

/** Where the playback is at progress p in [0, 1]: the last completed step and how far toward the next one. */
export function frameAt(p: number, n: number): { step: number; frac: number; idx: number } {
  const idx = Math.min(Math.max(p, 0), 1) * (n - 1);
  const step = Math.min(Math.floor(idx), n - 1);
  return { step, frac: step >= n - 1 ? 0 : idx - step, idx };
}

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

export const assumptionPct = (d: SimulationData) => `${Math.round(d.assumption.value * 100)}%`;
