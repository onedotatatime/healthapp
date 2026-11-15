/**
 * The loss card's data and arithmetic (MIN-4774; contract: CTO, MIN-4769 comment 1178f99e; block built by Cron on MIN-4773; spec A16 of
 * docs/design/simulations-motion-spec.md). Reads the additive `reach` block of `data/synthetic/simulation.json`.
 * No value shown on the page is typed here: every number is read from the file, and the words are in copy.ts. No DOM, no React, no timer.
 * An invalid block means no card (the label and one sentence stay), never a placeholder. A geography that cannot be read is left out of the switch.
 *
 * The five formulas (CTO section 1), at a share s of 0 to 1 of a geography's residents in the network:
 *   residents(s) = s x population          loss(s) = L0 - s x D100          drop(s) = s x D100
 *   matched(s)   = half-up(residents x matched / records)                   fewer_dx(s) = residents x drop_per_100 / 100  (a year)
 * L0, D100 and the rest come from the file. The line is straight because the match rate and its effect are held at the 5,000-record values:
 * a consequence of the assumptions, not a finding (the page says so).
 */
import { z } from 'zod';

/**
 * The slider's start: a share in percent, or 'plan' for the plan's own share (rounded to the step). One constant, the CEO seat's call (MIN-4771 ruling 1:
 * the page opens on 0%, so the first thing on screen is the loss and moving the slider is how it is decreased).
 */
export const DEFAULT_SHARE: number | 'plan' = 0;
/** The slider works in tenths of a percent (integers), so no float drift reaches the state: 0 to 1000 in steps of 1 is 0 to 100% in steps of 0.1%. */
export const TENTHS_MAX = 1000;
export const STEP_PCT = 0.1;
export const THUMB_HALF = 16;

const Source = z.object({ name: z.string().min(1), url: z.string().url(), year: z.number().int().optional() });
const CheckPoint = z.object({
  share_pct: z.number().min(0).max(100),
  loss_eur: z.number(),
  drop_eur: z.number(),
  residents: z.number(),
  matched: z.number(),
  fewer_dx: z.number(),
});
const RawGeo = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  year: z.number().int(),
  population: z.number().int().positive(),
  population_source: Source,
  spend_total_eur: z.number().positive(),
  spend_per_inhabitant_eur: z.number().positive(),
  spend_source: Source,
  original: z.object({
    currency: z.enum(['EUR', 'USD']),
    total: z.number().positive(),
    fx: z.object({ usd_per_eur: z.number().positive(), year: z.number().int(), source: z.object({ name: z.string().min(1), url: z.string().url() }) }).nullable(),
  }),
  loss0_eur: z.number().positive(),
  drop_at_100_eur: z.number().positive(),
  loss_at_100_eur: z.number().positive(),
  plan_share_pct: z.number().positive().max(100),
  check_points: z.array(CheckPoint),
});
const RawReach = z.object({
  label: z.string().min(1),
  status: z.string().min(1),
  inputs: z.object({
    baseline_pct: z.number().positive(),
    drop_pts: z.number().positive(),
    drop_per_100: z.number().positive(),
    matched: z.number().int().positive(),
    records: z.number().int().positive(),
    match_rate_opted_in_pct: z.number().positive().max(100),
    effect: z.number().positive().max(1),
  }),
  slider: z.object({ min_pct: z.number(), max_pct: z.number(), step_pct: z.number() }),
  plan: z.object({ patients: z.number().int().positive(), month: z.number().int().positive() }),
  geographies: z.array(z.unknown()).min(1),
});
const RawFile = z.object({
  series: z.array(z.object({ id: z.number(), sources: z.array(z.object({ name: z.string(), url: z.string().url() })).optional() })).optional(),
  reach: z.unknown(),
});

export type Source = z.infer<typeof Source>;
export type CheckPoint = z.infer<typeof CheckPoint>;
export type Geo = {
  id: string;
  name: string;
  year: number;
  population: number;
  populationSource: Source;
  spendTotalEur: number;
  spendPerInhabitantEur: number;
  spendSource: Source;
  original: { currency: 'EUR' | 'USD'; total: number; fx: { usdPerEur: number; year: number; source: { name: string; url: string } } | null };
  /** What the geography loses a year at 0% in the network, what the model removes at 100%, and what is left. */
  loss0: number;
  drop100: number;
  loss100: number;
  /** Where our plan's 91,205 patients sit as a share of the population, in percent (2 significant figures on screen). */
  planSharePct: number;
  checkPoints: CheckPoint[];
};
export type Reach = {
  label: string;
  status: string;
  baselinePct: number;
  dropPts: number;
  dropPer100: number;
  matched: number;
  records: number;
  matchRateOptedInPct: number;
  effect: number;
  planPatients: number;
  planYear: number;
  geos: Geo[];
  /** The baselines the model applies (WHO error rate, OECD cost share), from the file's series sources. */
  sources: { name: string; url: string }[];
};
export type ReachParse = { ok: true; data: Reach } | { ok: false };

const close = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;

function readGeo(raw: unknown): Geo | undefined {
  const r = RawGeo.safeParse(raw);
  if (!r.success) return undefined;
  const g = r.data;
  // The three euro figures must agree, and the drop must be a real drop: otherwise this geography is not drawn.
  if (!close(g.loss0_eur - g.drop_at_100_eur, g.loss_at_100_eur, 1) || g.drop_at_100_eur >= g.loss0_eur) return undefined;
  return {
    id: g.id,
    name: g.name,
    year: g.year,
    population: g.population,
    populationSource: g.population_source,
    spendTotalEur: g.spend_total_eur,
    spendPerInhabitantEur: g.spend_per_inhabitant_eur,
    spendSource: g.spend_source,
    original: { currency: g.original.currency, total: g.original.total, fx: g.original.fx ? { usdPerEur: g.original.fx.usd_per_eur, year: g.original.fx.year, source: g.original.fx.source } : null },
    loss0: g.loss0_eur,
    drop100: g.drop_at_100_eur,
    loss100: g.loss_at_100_eur,
    planSharePct: g.plan_share_pct,
    checkPoints: g.check_points,
  };
}

/** The switch has every geography the file carries and can be read, in file order. No readable geography, or a slider the page does not implement, means no card. */
export function parseReach(raw: unknown): ReachParse {
  const f = RawFile.safeParse(raw);
  if (!f.success) return { ok: false };
  const r = RawReach.safeParse(f.data.reach);
  if (!r.success) return { ok: false };
  const d = r.data;
  if (d.slider.min_pct !== 0 || d.slider.max_pct !== 100 || d.slider.step_pct !== STEP_PCT) return { ok: false };
  const geos = d.geographies.map(readGeo).filter((g): g is Geo => g !== undefined);
  if (geos.length === 0) return { ok: false };
  const sources = (f.data.series ?? []).filter((s) => s.id === 2 || s.id === 3).flatMap((s) => s.sources ?? []);
  return {
    ok: true,
    data: {
      label: d.label,
      status: d.status,
      baselinePct: d.inputs.baseline_pct,
      dropPts: d.inputs.drop_pts,
      dropPer100: d.inputs.drop_per_100,
      matched: d.inputs.matched,
      records: d.inputs.records,
      matchRateOptedInPct: d.inputs.match_rate_opted_in_pct,
      effect: d.inputs.effect,
      planPatients: d.plan.patients,
      planYear: Math.round(d.plan.month / 12),
      geos,
      sources,
    },
  };
}

// ---- the arithmetic ---------------------------------------------------------------------------------------------------------------

export type Point = { sharePct: number; residents: number; loss: number; drop: number; matched: number; fewerDx: number };
/** One point of the model at a share in percent (0 to 100). Euros are not rounded here; the file's check points are half-up to the euro and the test allows 1. */
export function pointAt(r: Reach, g: Geo, sharePct: number): Point {
  const s = sharePct / 100;
  const residents = Math.round(s * g.population);
  return {
    sharePct,
    residents,
    loss: g.loss0 - s * g.drop100,
    drop: s * g.drop100,
    matched: Math.round((residents * r.matched) / r.records),
    fewerDx: (residents * r.dropPer100) / 100,
  };
}
/** The slider's value in percent from its integer tenths. */
export const pctOfTenths = (tenths: number) => Math.min(Math.max(Math.round(tenths), 0), TENTHS_MAX) / 10;
export const tenthsOfPct = (pct: number) => Math.min(Math.max(Math.round(pct * 10), 0), TENTHS_MAX);
export const startTenths = (g: Geo, start: number | 'plan' = DEFAULT_SHARE) => tenthsOfPct(start === 'plan' ? g.planSharePct : start);
/** The drop as a share of the loss today, in percent. The same in every geography by construction (drop_pts / baseline_pct). */
export const dropShare = (g: Geo) => (g.drop100 / g.loss0) * 100;
/** The US$ per head of a converted geography (the file's own total over its own population), for the source line. */
export const originalPerInhabitant = (g: Geo) => g.original.total / g.population;

// ---- the plot (spec A16 section 4): one € axis from zero --------------------------------------------------------------------------

const NICE = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
/** A round top for the € axis, at least `v`. Each geography gets its own and it never changes while the slider moves. */
export function niceMax(v: number): number {
  if (!(v > 0)) return 1;
  const base = 10 ** Math.floor(Math.log10(v));
  for (const m of NICE) if (m * base >= v) return m * base;
  return 10 * base;
}

export type Geometry = {
  W: number; H: number; T: number; B: number; L: number; R: number; Ht: number;
  yMax: number;
  /** A share in percent, 0 to 100. */
  x: (pct: number) => number;
  /** Euros, 0 to `yMax`. */
  y: (eur: number) => number;
  /** The slider's margin-left and width in px, so the thumb's centre is exactly x(share). */
  slider: { marginLeft: number; width: number };
};
export function plotGeometry(W: number, wide: boolean, yMax: number): Geometry {
  const T = 34, H = wide ? 320 : 200, B = 58, L = wide ? 64 : 68, R = 16;
  const span = W - L - R;
  return {
    W, H, T, B, L, R, Ht: T + H + B, yMax,
    x: (pct) => L + (pct / 100) * span,
    y: (eur) => T + H * (1 - eur / yMax),
    slider: { marginLeft: L - THUMB_HALF, width: span + 2 * THUMB_HALF },
  };
}

// ---- formatters (one set for the page; spec A16 section 3) -----------------------------------------------------------------------

const grouped = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const sig3 = (x: number) => String(Number(x.toPrecision(3)));
const BIG = [
  [1e12, 'trillion', 'tn'],
  [1e9, 'billion', 'bn'],
  [1e6, 'million', 'm'],
] as const;
/** From 1 million, 3 significant figures with the unit word ("€201 million", "€2.19 billion", "€1.04 trillion"); under 1 million in thousands; under 1,000 whole. */
export function formatMoney(v: number, symbol = '€'): string {
  const n = Math.abs(v);
  if (n < 1000) return `${symbol}${Math.round(n)}`;
  const big = BIG.find(([m]) => Number((n / m).toPrecision(3)) >= 1);
  if (!big) return n < 999_500 ? `${symbol}${grouped.format(Math.round(n / 1000))}k` : `${symbol}1 million`;
  return `${symbol}${sig3(n / big[0])} ${big[1]}`;
}
export const formatEuro = (v: number) => formatMoney(v, '€');
export const formatUsd = (v: number) => formatMoney(v, 'US$');
/** Whole units with separators ("€1,915", "US$1,317"): the per-head figures, which the thousands form would blur ("€1.92k"). */
export const formatWhole = (v: number, symbol = '€') => `${symbol}${grouped.format(Math.round(v))}`;
/** The axis ticks' short form ("€2.19 bn", "€93.5 bn", "€1.04 tn", "€121k"). */
export function formatEuroShort(v: number): string {
  if (v === 0) return '€0';
  if (v < 1e6) return `€${grouped.format(Math.round(v / 1000))}k`;
  const big = BIG.find(([m]) => Number((v / m).toPrecision(3)) >= 1) ?? BIG[2];
  return `€${sig3(v / big[0])} ${big[2]}`;
}
/** Counts: with separators under a million, then 3 significant figures with the word ("4.15 million"). */
export function formatCount(v: number): string {
  const n = Math.round(v);
  if (n < 999_500) return grouped.format(n);
  const big = BIG.find(([m]) => Number((n / m).toPrecision(3)) >= 1) ?? BIG[2];
  return `${sig3(n / big[0])} ${big[1]}`;
}
/** The slider's own value: whole when whole, else one decimal ("40%", "40.5%", "0.1%"). */
export const formatStep = (pct: number) => `${Number.isInteger(Math.round(pct * 10) / 10) ? Math.round(pct) : (Math.round(pct * 10) / 10).toFixed(1)}%`;
/** A share that can be tiny, to 2 significant figures so it is never rounded to 0 ("0.88%", "0.02%", "0.0011%"); whole from 10. */
export const formatSmallShare = (pct: number) => `${pct >= 10 ? Math.round(pct) : Number(pct.toPrecision(2))}%`;
/** How much of the loss is gone, in percent: whole from 10, one decimal from 1, one significant figure below 1. */
export function formatLossPct(pct: number): string {
  if (pct >= 10) return `${Math.round(pct)}%`;
  if (pct >= 1) return `${pct.toFixed(1)}%`;
  return `${Number(pct.toPrecision(1))}%`;
}
/** A plain percentage from the inputs: 11%, 46%, 20%. */
export const formatPlain = (pct: number) => `${Number(pct.toFixed(1))}%`;
export const formatRate = (r: number) => r.toFixed(4);
export const MINUS = '−';
