// Typed props for every slide template. A deck is an array of `Slide`.
// Text fields accept **bold** markers. Apostrophes are typeset automatically.

/** The only demo tag in use. It is optional on every product or demo visual: the founder waived the concept and mock-up labels (14 and 15 Nov 2026), but a working pipeline on synthetic data still says so (slide 5). */
export type DemoTag = 'Working demo · synthetic data';

/** A Hero slide may carry a tag when it shows something that does not exist yet. The tag is optional and no slide uses it since 15 Nov 2026. */
export type HeroTag = 'Concept render';

export type Theme = 'air' | 'mist' | 'night';

export interface SlideBase {
  /** Stable id, used in the URL hash (#1 ... #14, #5b, #6b, #6c, #A1 ... #A9). */
  id: string;
  /** Eyebrow number, e.g. "02". Omit on the cover. Appendix slides use "Appendix A2" style text. */
  no?: string;
  /** Eyebrow label, e.g. "Problem". */
  kicker?: string;
  theme: Theme;
  /** Required statement at the bottom-left of the slide, body-adjacent size (24px). Rules that must stay readable, e.g. "Named organisations are targets". */
  footer?: string;
  /** The one small footnote line (about 19px, ink-soft) that carries the "*" of an estimate: what the number is, and that it is not a result. Replaces the old same-size "(our estimate)" label. */
  note?: string;
  /** "Details → A_" links, bottom-right. `to` is a slide id; the link is a hash link (#A2) and works with the keyboard. */
  links?: DeckLink[];
  /** Appendix slides: "Back to slide N" links, top-right. */
  back?: DeckLink[];
  /** Speaker notes, one string per paragraph. Shown with N. */
  notes: string[];
  /** Explicit counter label ("5b", "6b", "6c", "A1", "A3b") for an inserted or appendix slide. It is not counted in "n / total" and the others keep their numbers. */
  counter?: string;
}

export interface DeckLink { to: string; label: string }

export interface Rich { text: string }

/* ---------- Hero (full-bleed image, text column, optional concept tag) ---------- */
export interface HeroSlide extends SlideBase {
  template: 'hero';
  headline: string;
  body: string;
  /** Text supports **bold** and [[accent]] (teal bold, e.g. "(assumption)"). */
  points?: string[];
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
  /** Optional pill row under the cards (slide 2 dropped it on 15 Nov 2026). */
  chips?: string[];
  /** Optional closing line under the chips. */
  closing?: string;
}

/* ---------- Statement (headline + points + optional side panel) ---------- */
export type StatementSide =
  | {
      kind: 'compare';
      title: string;
      bars: { label: string; value: string; tone: 'deep' | 'mint'; gap?: string }[];
      clockTitle?: string;
      clock?: { when: string; what: string }[];
    }
  | { kind: 'notice'; tag?: DemoTag; blocks: { label: string; text: string }[] }
  | { kind: 'phone'; caption: string; tag?: DemoTag; crossed?: string }
  | { kind: 'matches'; pattern: { title: string; sub: string }; optIn: string; tag?: DemoTag; contact: string };

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
  muted?: string;
  funnelTitle: string;
  steps: { value: string; text: string; tone: 'deep' | 'mint' | 'coral' }[];
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
  callout: { title: string; items: { number: string; label: string }[] };
  /** One second number under the chart, with its explanation. */
  strip: { value: string; text: string };
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
  /** One small line under the rows (e.g. "Also: ..."). */
  after?: string;
  /** Taller, larger rows for a table with only a few rows. */
  roomy?: boolean;
  bar?: { title: string; parts: { pct: number; value: string; label: string; tone: 'deep' | 'soft' | 'quiet' | 'outline' }[] };
}

/* ---------- Product (phone frames, each tagged) ---------- */
export interface ProductSlide extends SlideBase {
  template: 'product';
  headline: string;
  steps: { n: number; title: string; icon: 'photo' | 'match' | 'timeline' | 'helix' | 'ask'; tag?: DemoTag; text: string }[];
  under?: { label: string; badges?: string[]; lines: string[] }[];
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
    /** Optional small line under the map. */
    note?: string;
  };
  rows: { name: string; line?: string; well?: string; not?: string; hero?: boolean }[];
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

/* ---------- TwoColumn (two titled columns of numbered lines, an optional pointer line) ---------- */
export interface TwoColumnSlide extends SlideBase {
  template: 'twocol';
  headline: string;
  columns: { title: string; points: string[] }[];
  /** Optional small line under the columns, e.g. a pointer to the next slide. */
  pointer?: string;
}

/* ---------- ThreeCards (three equal cards: title, short lines, one big number; the last can be accented) ---------- */
export interface ThreeCard {
  title: string;
  /** The big figure. `mark` is a small "*" or "†" set on the number (an estimate); the one footnote line is `note` on the slide. `unit` is the one explanation line. */
  figure: { value: string; mark?: string; unit?: string };
  /** Optional extra short lines. **bold** and [[teal label]] markers work. */
  lines?: string[];
  /** Accent the card (light teal band, teal outline). */
  accent?: boolean;
}
export interface ThreeCardsSlide extends SlideBase {
  template: 'threecards';
  headline: string;
  cards: [ThreeCard, ThreeCard, ThreeCard];
}

/* ---------- Team and ask ---------- */
export interface TeamAskSlide extends SlideBase {
  template: 'teamask';
  headline: string;
  team: { label: string; name: string; role: string; agents: string; partner: { title: string; text: string } };
  ask: { label: string; amount: string; mark?: string; line: string; sub?: string };
  gates: { head: string[]; rows: { gate: string; amount: string; buys?: string }[] };
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

/* ---------- Spend (one big bar in four parts, the contact line) ---------- */
export interface SpendSlide extends SlideBase {
  template: 'spend';
  headline: string;
  /** One line under the headline. */
  line: string;
  parts: { pct: number; value: string; label: string; accent?: boolean }[];
  contact: { label: string; link: string; email: string; qr: string };
}

/* ---------- Detail (appendix page: columns of small markdown, tables where the content is tabular) ---------- */
export interface DetailSlide extends SlideBase {
  template: 'detail';
  headline: string;
  /** CSS grid-template-columns for the columns, e.g. "1fr 1fr". */
  grid: string;
  /** Body type size in px (default 19). Pages with room get a larger size; tables use size minus 2. */
  fs?: number;
  /** One markdown string per column: **bold**, *label*, - and 1. lists, | tables |, a lone **bold line** as a sub-heading. */
  columns: string[];
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
  | TwoColumnSlide
  | ThreeCardsSlide
  | TeamAskSlide
  | SpendSlide
  | DetailSlide
  | AppendixSlide;
