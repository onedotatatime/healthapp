// Typed props for every slide template. A deck is an array of `Slide`.
// Text fields accept **bold** markers. Apostrophes are typeset automatically.

/** Every product or demo visual must carry one of these two tags. */
export type DemoTag = 'Mock-up' | 'Working demo · synthetic data';

/** A Hero slide shows an image of something that does not exist yet, so when it carries a tag it is one of these two. The tag is optional. */
export type HeroTag = 'Concept render' | 'Mock-up';

export type Theme = 'air' | 'mist' | 'night';

export interface SlideBase {
  /** Stable id, used in the URL hash (#1 ... #16). */
  id: string;
  /** Eyebrow number, e.g. "02". Omit on the cover. Use "Appendix A" style text for backups. */
  no?: string;
  /** Eyebrow label, e.g. "Problem". */
  kicker?: string;
  theme: Theme;
  /** Small line at the bottom-left of the slide. */
  footer?: string;
  /** Speaker notes, one string per paragraph. Shown with N. */
  notes: string[];
  /** Explicit counter label (e.g. "6b") for an inserted slide. It is not counted in "n / total" and the others keep their numbers. */
  counter?: string;
  /** Backup slides show "Backup" instead of n / total and are not counted. */
  backup?: boolean;
}

export interface Rich { text: string }

/* ---------- Hero (full-bleed image, text column, optional concept tag) ---------- */
export interface HeroSlide extends SlideBase {
  template: 'hero';
  headline: string;
  body: string;
  /** Text supports **bold** and [[accent]] (teal bold, e.g. "(assumption)"). */
  points: string[];
  /** Optional "how it's used" list: a small heading and numbered steps (numbers in teal). */
  stepsTitle?: string;
  steps?: string[];
  image: { src: string; alt: string };
  /** Optional. Placed on the image, same size as the demo tags. Without it the slide must say concept or mock-up elsewhere (kicker, footer). */
  tag?: HeroTag;
  /** Word set beside the lockup, bottom-right (e.g. "Vault"). */
  lockupSuffix?: string;
}

/* ---------- Cover ---------- */
export interface CoverSlide extends SlideBase {
  template: 'cover';
  eyebrow: string;
  headline: string;
  tagline: string;
  background: string;
  photo: { src: string; alt: string };
}

/* ---------- Stats (three source-tagged numbers) ---------- */
export interface StatCard { pre?: string; number: string; text: string; source: string }
export interface StatsSlide extends SlideBase {
  template: 'stats';
  headline: string;
  groups: { label: string; tone: 'deep' | 'light'; cards: StatCard[] }[];
  chips: string[];
  closing: string;
}

/* ---------- Statement (headline + points + optional side panel) ---------- */
export type StatementSide =
  | {
      kind: 'compare';
      title: string;
      bars: { label: string; value: string; tone: 'deep' | 'mint'; gap?: string }[];
      clockTitle: string;
      clock: { when: string; what: string }[];
    }
  | { kind: 'notice'; tag: DemoTag; blocks: { label: string; text: string }[] }
  | { kind: 'phone'; caption: string; tag: DemoTag; crossed?: string }
  | { kind: 'matches'; pattern: { title: string; sub: string }; optIn: string; tag: DemoTag; contact: string };

export interface StatementSlide extends SlideBase {
  template: 'statement';
  headline: string;
  pointStyle: 'plain' | 'numbered' | 'bar';
  points: { lead?: string; text: string; source?: string }[];
  callout?: { number: string; text: string; source: string };
  side?: StatementSide;
}

/* ---------- Funnel (big number + funnel) ---------- */
export interface FunnelSlide extends SlideBase {
  template: 'funnel';
  headline: string;
  big: { number: string; label: string };
  points: string[];
  muted: string;
  funnelTitle: string;
  steps: { value: string; text: string; tag?: string; tone: 'deep' | 'mint' | 'coral' }[];
}

/* ---------- Chart (stacked bars from data) ---------- */
export interface ChartSlide extends SlideBase {
  template: 'chart';
  headline: string;
  chartTitle: string;
  /** Legend and stack order, bottom to top. */
  series: { key: string; label: string }[];
  /** Each group has bars; each bar has a total label and one value per series. */
  groups: { label: string; bars: { label: string; total: string; values: number[] }[] }[];
  callout: { title: string; items: { number: string; label: string }[]; note: string };
  strip: { caption: string; value: string; tag: string }[];
  stripNote: string;
}

/* ---------- Table ---------- */
export interface TableSlide extends SlideBase {
  template: 'table';
  headline: string;
  intro?: string;
  /** CSS grid-template-columns for header and rows, in slide pixels. */
  cols: string;
  head: string[];
  rows: { cells: string[]; emphasis?: 'wedge' | 'muted' }[];
  /** Index of a column rendered in the accent colour. */
  accentCol?: number;
  bar?: { title: string; parts: { pct: number; value: string; label: string; tone: 'deep' | 'soft' | 'quiet' | 'outline' }[] };
}

/* ---------- Product (phone frames, each tagged) ---------- */
export interface ProductSlide extends SlideBase {
  template: 'product';
  headline: string;
  steps: { n: number; title: string; icon: 'photo' | 'match' | 'timeline' | 'helix' | 'ask'; tag: DemoTag; text: string }[];
  under: { label: string; badges?: string[]; lines: string[] }[];
}

/* ---------- Compare (positioning map + cards) ---------- */
export interface CompareSlide extends SlideBase {
  template: 'compare';
  headline: string;
  map: {
    top: string;
    boxes: { name: string; sub: string; x: number; y: number; w: number; h: number; hero?: boolean }[];
    axisY: string;
    axisX: string;
    low: string;
    high: string;
    note: string;
  };
  rows: { name: string; well: string; not: string; hero?: boolean }[];
}

/* ---------- Steps (timeline or ascending cards) ---------- */
export interface StepsSlide extends SlideBase {
  template: 'steps';
  variant: 'path' | 'ascend' | 'flow';
  headline: string;
  /** flow variant only: one short paragraph under the headline. */
  body?: string;
  steps: {
    title: string;
    text?: string;
    ships?: string;
    applies?: string;
    badges?: string[];
    seal?: string;
  }[];
  /** path variant only */
  places?: { name: string; x: number; y: number; cx: number; cy: number }[];
  order?: { label: string; text: string };
  banner?: string;
}

/* ---------- TwoColumnRevenue (two titled columns of points + a full-width revenue strip) ---------- */
export interface RevenueCell {
  /** Small lead line above the number (optional). */
  lead?: string;
  /** The big figures, one or two. Each has the figure and its short label. */
  figures: { value: string; label?: string }[];
  /** Line under the figures. */
  text?: string;
  /** Honesty tag, same size as the figures: "(assumption)", "(our estimate)". */
  tag?: string;
  /** Source, small, e.g. "(Tufts CSDD, 2024)". */
  source?: string;
}
export interface TwoColumnRevenueSlide extends SlideBase {
  template: 'twocol';
  headline: string;
  columns: { title: string; points: string[] }[];
  revenue: RevenueCell[];
}

/* ---------- Team and ask ---------- */
export interface TeamAskSlide extends SlideBase {
  template: 'teamask';
  headline: string;
  team: { label: string; name: string; role: string; agents: string; partner: { title: string; text: string } };
  ask: { label: string; amount: string; line: string; sub: string };
  gates: { head: string[]; rows: { gate: string; amount: string; buys: string }[] };
  contact: { label: string; link: string; email: string; qr: string };
}

/* ---------- Appendix (nested circles + table) ---------- */
export interface AppendixSlide extends SlideBase {
  template: 'appendix';
  headline: string;
  tam: { label: string; value: string; tag: string };
  sam: { label: string; value: string; tag: string };
  head: string[];
  rows: { cells: string[]; total?: boolean }[];
  lines: string[];
}

export type Slide =
  | CoverSlide
  | HeroSlide
  | StatsSlide
  | StatementSlide
  | FunnelSlide
  | ChartSlide
  | TableSlide
  | ProductSlide
  | CompareSlide
  | StepsSlide
  | TwoColumnRevenueSlide
  | TeamAskSlide
  | AppendixSlide;
