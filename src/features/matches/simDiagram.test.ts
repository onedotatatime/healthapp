/**
 * The ten-year Greece diagram (MIN-4749). The expected values are read straight from data/synthetic/simulation.json and formatted here by
 * the written rule (spec A15 section 4), not through the app's formatter, so a wrong formatter, a wrong block or a typed number goes red.
 * There is no jsdom in this repo: the screen is checked as server markup at chosen slider months (`initialMonth`), and the slider's own
 * arithmetic as pure functions.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import simulationJson from '../../../data/synthetic/simulation.json';
import { COPY } from './copy';
import { SimDiagram } from './SimDiagram';
import { SimulationUnavailable, SimulationView } from './Simulation';
import {
  DIAGRAM, LINES, afterPlan, kindAt, lineValues, monthInYear, parseSimulation, plotGeometry, plotted, polylinePoints, readoutAt, shareFromFormula, unitRefs, yearOf,
  type TenYears,
} from './tenYears';

const RAW = simulationJson as unknown as {
  ten_years: {
    patients: { values: number[] }; matches: { values: number[] };
    diagnoses: { yearly: { values: number[] }; total: { values: number[] } };
    saved_eur: { yearly: { values: number[] }; total: { values: number[] }; drop_pts: number[]; per_inhabitant_eur: number; total_mio_eur: number };
    income_eur: { yearly: { values: number[] }; total: { values: number[] } };
    plan: { yearly_k_eur: number[] }; measured_until_month: number; plateau: { from_month: number; records: number };
  };
  assumption: { start: number; ceiling: number };
};
const T = RAW.ten_years;
const model = (): TenYears => {
  const p = parseSimulation(simulationJson);
  if (!p.ok) throw new Error('simulation.json did not parse');
  return p.data;
};
const grouped = (n: number) => Math.round(n).toLocaleString('en-US');
// the written rule, independent of the app's formatter
const eur = (v: number) => {
  const r = Math.round(v);
  return r < 1000 ? `€${r}` : r < 999_500 ? `€${grouped(r / 1000)}k` : `€${(r / 1e6).toFixed(1)} million`;
};
const dx = (v: number) => (v >= 9.95 ? grouped(v) : v.toFixed(1));
const render = (m: TenYears, initialMonth?: number, config?: { plot: 'five' | 'euro'; basis: 'yearly' | 'total'; money: 'drop' | 'saved' }) =>
  renderToStaticMarkup(createElement(SimDiagram, { model: m, initialMonth, config }));
/** The text of the first element with this test id (tags removed). */
const text = (markup: string, id: string) => {
  const m = markup.match(new RegExp(`data-testid="${id}"[^>]*>([\\s\\S]*?)</(?:p|span|output|li|div|h1)>`));
  return m ? m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/\s+/g, ' ').trim() : null;
};
const attr = (markup: string, id: string, name: string) => {
  const tag = markup.match(new RegExp(`<[^>]*data-testid="${id}"[^>]*>`));
  const a = tag?.[0].match(new RegExp(`${name}="([^"]*)"`));
  return a ? a[1] : null;
};

describe('the ten_years block parses and lines up', () => {
  it('reads 120 months, plan years 1 to 3, the Greek base and the matches kind change', () => {
    const m = model();
    expect(m.months).toBe(120);
    expect(m.years).toBe(10);
    expect(m.planYears).toBe(T.plan.yearly_k_eur.length);
    expect(m.planLastMonth).toBe(T.plan.yearly_k_eur.length * 12);
    expect(m.measuredUntil).toBe(T.measured_until_month);
    expect(m.geography).toBe('Greece');
    expect(m.perInhabitantEur).toBe(T.saved_eur.per_inhabitant_eur);
    for (const a of [m.patients, m.matches, m.dx.yearly, m.dx.total, m.money.yearly, m.money.total, m.income.yearly, m.income.total, m.dropPts]) expect(a).toHaveLength(120);
  });
  it('reads the cost share from the file\'s own formula and says nothing when it cannot', () => {
    expect(model().costShare).toBeCloseTo(0.11, 10);
    expect(shareFromFormula('11 x (1 - effect x match_rate), effect = ...')).toBeCloseTo(0.11, 10);
    expect(shareFromFormula('something else')).toBeUndefined();
    expect(shareFromFormula(undefined)).toBeUndefined();
  });
  it('refuses a block that is missing, short, mis-numbered or whose running totals fall', () => {
    const base = () => JSON.parse(JSON.stringify(simulationJson));
    expect(parseSimulation({ ...base(), ten_years: undefined }).ok).toBe(false);
    const short = base(); short.ten_years.patients.values = short.ten_years.patients.values.slice(0, 100);
    expect(parseSimulation(short).ok).toBe(false);
    const odd = base(); odd.ten_years.x.values = odd.ten_years.x.values.map((v: number) => v + 1);
    expect(parseSimulation(odd).ok).toBe(false);
    const falling = base(); falling.ten_years.income_eur.total.values[50] = 0;
    expect(parseSimulation(falling).ok).toBe(false);
    const noPlan = base(); noPlan.ten_years.plan.yearly_k_eur = [];
    expect(parseSimulation(noPlan).ok).toBe(false);
    expect(parseSimulation(base()).ok).toBe(true);
  });
});

describe('the slider: month 1 to 120, year n month m', () => {
  it('maps a month to year and month, month 120 being year 10, month 12', () => {
    expect([1, 12, 13, 36, 37, 119, 120].map((x) => [yearOf(x), monthInYear(x)])).toEqual([[1, 1], [1, 12], [2, 1], [3, 12], [4, 1], [10, 11], [10, 12]]);
  });
  it('the thumb centre sits exactly on the plot\'s x of every month, at 1280 and 390', () => {
    for (const [W, wide] of [[726, true], [324, false]] as const) {
      const g = plotGeometry(W, wide, 'five', 120);
      for (let month = 1; month <= 120; month++) {
        // a native range's thumb centre: half a thumb in from the input's edge, then linear over the rest of the input's width
        const centre = g.slider.marginLeft + 16 + ((month - 1) / 119) * (g.slider.width - 32);
        expect(Math.abs(centre - g.x(month)), `W ${W} month ${month}`).toBeLessThan(1e-9);
      }
    }
  });
  it('year ticks 0 to 10 sit on whole years: x(0) is the axis, x(120) the right end', () => {
    const g = plotGeometry(726, true, 'five', 120);
    expect(g.x(0)).toBe(g.L);
    expect(g.x(120)).toBe(g.W - g.R);
    expect(g.x(60) - g.x(0)).toBeCloseTo(g.x(120) - g.x(60), 9);
  });
});

describe('the plot: one scale per unit, from zero, fixed over all 120 months', () => {
  it('euro lines share one reference, people lines another, diagnoses their own', () => {
    const v = lineValues(model(), 'yearly');
    const ref = unitRefs(v);
    expect(ref.euro).toBe(Math.max(...T.saved_eur.yearly.values, ...T.income_eur.yearly.values));
    expect(ref.people).toBe(Math.max(...T.patients.values, ...T.matches.values));
    expect(ref.dx).toBe(Math.max(...T.diagnoses.yearly.values));
  });
  it('every point inverts to value / reference within half a pixel, and every line starts at the axis', () => {
    const m = model();
    const g = plotGeometry(726, true, 'five', 120);
    const v = lineValues(m, 'yearly');
    const ref = unitRefs(v);
    for (const l of LINES) {
      const pts = polylinePoints(g, v[l.id], ref[l.unit]).split(' ').map((p) => p.split(',').map(Number));
      expect(pts).toHaveLength(121);
      expect(pts[0][1]).toBeCloseTo(g.y(0), 0);
      pts.slice(1).forEach(([, y], i) => expect(Math.abs((g.y(0) - y) / g.H - v[l.id][i] / ref[l.unit]) * g.H).toBeLessThan(0.5));
    }
  });
  it('the plot is identical for every slider month: only the cursor, the markers, the readout and the state differ', () => {
    const m = model();
    const strip = (s: string) => s
      .replace(/<line class="cur"[^>]*\/>/, '').replace(/<g data-testid="sim-markers">[\s\S]*?<\/g>/, '')
      .replace(/data-month="\d+"/, '').replace(/>[^<>]*</g, '><');
    const a = strip(render(m, 3)), b = strip(render(m, 120)), c = strip(render(m, 37));
    // the polylines, band and grid are the same markup at every month
    const lines = (s: string) => (s.match(/<polyline[^>]*>/g) ?? []).join('');
    expect(lines(render(m, 3))).toBe(lines(render(m, 120)));
    expect(lines(render(m, 3))).toBe(lines(render(m, 37)));
    expect(a === b && b === c).toBe(false); // the card does change with the slider
  });
  it('the matches line is solid up to the last measured month and dashed (a model) after it', () => {
    const html = render(model(), 120);
    const poly = html.match(/<g data-testid="sim-line-matches">([\s\S]*?)<\/g>/)![1];
    const lines = poly.match(/<polyline[^>]*>/g)!;
    expect(lines).toHaveLength(2);
    expect(lines[0]).not.toContain('stroke-dasharray');
    expect(lines[1]).toContain('stroke-dasharray="6 4"');
    expect(kindAt(model(), 'matches', T.measured_until_month)).toBe('computed');
    expect(kindAt(model(), 'matches', T.measured_until_month + 1)).toBe('model');
  });
});

describe('the readout equals the file at every slider month (read from the JSON, formatted by the written rule)', () => {
  for (const month of [1, 12, 29, 30, 36, 37, 60, 120]) {
    it(`month ${month}: patients, matches, correct diagnoses, money in Greece and our income`, () => {
      const html = render(model(), month);
      const i = month - 1;
      expect(text(html, 'sim-value-patients')).toBe(grouped(T.patients.values[i]));
      expect(text(html, 'sim-value-matches')).toBe(grouped(T.matches.values[i]));
      expect(text(html, 'sim-value-dx')).toBe(dx(T.diagnoses.yearly.values[i]));
      expect(text(html, 'sim-value-money')).toBe(eur(T.saved_eur.yearly.values[i]));
      expect(text(html, 'sim-value-income')).toBe(eur(T.income_eur.yearly.values[i]));
      expect(text(html, 'sim-year')).toBe(`Year ${Math.ceil(month / 12)}, month ${((month - 1) % 12) + 1}`);
      expect(attr(html, 'sim-diagram', 'data-month')).toBe(String(month));
    });
  }
  it('the formula line is the file\'s published points x the Greek base x the patients, and gives the money shown', () => {
    for (const month of [12, 36, 120]) {
      const i = month - 1;
      const html = render(model(), month);
      const pts = T.saved_eur.drop_pts[i];
      const formula = text(html, 'sim-formula')!;
      expect(formula).toBe(`${pts.toFixed(2)} points × €${T.saved_eur.per_inhabitant_eur.toLocaleString('en-US', { minimumFractionDigits: 2 })} × ${grouped(T.patients.values[i])} patients = ${eur(T.saved_eur.yearly.values[i])} a year`);
      // the arithmetic on the screen checks out to the euro the file holds
      expect(Math.abs((pts / 100) * T.saved_eur.per_inhabitant_eur * T.patients.values[i] - T.saved_eur.yearly.values[i])).toBeLessThan(1);
    }
  });
  it('opens on month 120 (year 10), so the ten-year answer shows first', () => {
    const html = render(model());
    expect(attr(html, 'sim-diagram', 'data-month')).toBe('120');
    expect(attr(html, 'sim-slider', 'value')).toBe('120');
  });
});

describe('the slider element: native range, labelled, value announced', () => {
  const html = render(model(), 37);
  it('is a native range 1 to 120 step 1, named, with the value text year n month m', () => {
    const tag = html.match(/<input[^>]*data-testid="sim-slider"[^>]*>/)![0];
    expect(tag).toContain('type="range"');
    expect(tag).toContain('min="1"');
    expect(tag).toContain('max="120"');
    expect(tag).toContain('step="1"');
    expect(tag).toContain('value="37"');
    expect(tag).toContain(`aria-label="${COPY.gSliderAria({ first: 1, last: 10 })}"`);
    expect(attr(html, 'sim-slider', 'aria-valuetext')).toContain('Year 4, month 1');
    expect(html).toContain('for="sim-slider"'); // the visible label and the output both point at it
  });
  it('the readout of the year is an output element tied to the slider; no custom live region and no other aria-live', () => {
    expect(html).toMatch(/<output[^>]*for="sim-slider"/);
    expect(html).not.toContain('aria-live');
  });
  it('past the plan the state line and the value text say income is held flat; inside the plan they say it is in the plan', () => {
    const m = model();
    expect(afterPlan(m, m.planLastMonth)).toBe(false);
    expect(afterPlan(m, m.planLastMonth + 1)).toBe(true);
    expect(text(render(m, 12), 'sim-state')).toBe(COPY.gStatePlan);
    expect(text(render(m, 90), 'sim-state')).toBe(COPY.gStateAssumed);
    expect(attr(render(m, 90), 'sim-slider', 'aria-valuetext')).toContain(COPY.gStateAssumed);
    expect(attr(render(m, 12), 'sim-slider', 'aria-valuetext')).toBe('Year 1, month 12');
  });
});

describe('the page: one diagram, nothing from the old page, the words and the labels', () => {
  const page = renderToStaticMarkup(createElement(SimulationView, { model: model() }));
  it('has the permanent label and exactly one diagram, and no old chart, hero, clock or replay', () => {
    expect(text(page, 'sim-label')).toBe(COPY.simLabel);
    expect(page.match(/data-testid="sim-diagram"/g)).toHaveLength(1);
    expect(page.match(/<svg[^>]*data-testid="sim-svg"/g)).toHaveLength(1);
    for (const gone of ['sim-hero', 'sim-grid', 'sim-chart', 'sim-timeline', 'sim-replay', 'sim-field', 'sim-euro', 'sim-x']) expect(page, gone).not.toContain(`data-testid="${gone}"`);
    expect(page).not.toMatch(/<canvas/);
  });
  it('shows no EU-27 figure and no 18.5 billion', () => {
    const w = page.replace(/<[^>]+>/g, ' ');
    expect(w).not.toMatch(/EU-27|EU27|18\.5|1,834/);
    expect(w).toContain('€19.9 billion'); // Greece's own total, the scale fact
    expect(w).toContain('Greece');
  });
  it('the CTO\'s plateau line is on the page word for word, numbers from the file', () => {
    expect(text(page, 'sim-plateau')).toBe(
      `Past ${grouped(T.plateau.records)} records (month ${T.plateau.from_month}) the matches and their effect are held at the ${grouped(T.plateau.records)}-record values; past year ${T.plan.yearly_k_eur.length} the plan's revenue is held flat.`,
    );
  });
  it('carries the assumption, the visits assumption, the share, the income note, the base and the sources, all always on screen', () => {
    expect(text(page, 'sim-assumption')).toBe(
      `Assumption, not a finding: each match lowers the chance of a wrong or missed diagnosis by ${+(RAW.assumption.start * 100).toFixed(1)}%, rising to ${+(RAW.assumption.ceiling * 100).toFixed(1)}% as matches accumulate.`,
    );
    expect(text(page, 'sim-visits')).toBe('Assumption: one visit per patient a year.');
    expect(text(page, 'sim-share')).toContain('about 11% of health spending');
    expect(text(page, 'sim-income-plan')).toBe(COPY.gIncomePlan);
    expect(text(page, 'sim-base')).toBe(`Spending base: Greece, 2024, €${T.saved_eur.per_inhabitant_eur.toLocaleString('en-US', { minimumFractionDigits: 2 })} per inhabitant, €${(T.saved_eur.total_mio_eur / 1000).toFixed(1)} billion a year in all.`);
    const sources = page.slice(page.indexOf('data-testid="sim-sources"'), page.indexOf('</p>', page.indexOf('data-testid="sim-sources"'))).replace(/<[^>]+>/g, ' ');
    for (const name of ['Eurostat', 'OECD', 'WHO']) expect(sources, name).toContain(name);
    expect(page).toContain('href="https://ec.europa.eu/eurostat/');
  });
  it('the values table has one row per plan year, equal to the file at that year\'s last month', () => {
    for (let y = 1; y <= 10; y++) {
      const row = text(page, `sim-values-row-${y}`)!;
      const i = y * 12 - 1;
      expect(row).toContain(grouped(T.patients.values[i]));
      expect(row).toContain(grouped(T.matches.values[i]));
      expect(row).toContain(`€${grouped(T.saved_eur.yearly.values[i])}`);
      expect(row).toContain(`€${grouped(T.income_eur.yearly.values[i])}`);
    }
  });
  it('an unreadable block shows the label and one sentence, no diagram', () => {
    const none = renderToStaticMarkup(createElement(SimulationUnavailable));
    expect(none).toContain(COPY.simLabel);
    expect(none).toContain('could not be read');
    expect(none).not.toContain('sim-diagram');
  });
});

describe('the three open rulings are constants and each one changes what it says it changes', () => {
  const m = model();
  it('default: five lines, a year at network size, the modelled-drop wording', () => {
    expect(DIAGRAM).toEqual({ plot: 'five', basis: 'yearly', money: 'drop' });
    expect(plotted('five')).toHaveLength(5);
    expect(text(render(m, 120), 'sim-title')).toBe('What matching could change in Greece, year by year');
    expect(render(m, 120)).toContain('Modelled drop in cost in Greece');
  });
  it('plot "euro": only money and income are drawn, on a true euro axis with tick values; the other three stay in the readout', () => {
    const html = render(m, 120, { plot: 'euro', basis: 'yearly', money: 'drop' });
    expect(html.match(/<polyline/g)).toHaveLength(2);
    expect(html).toContain('€0');
    expect(html).toContain(eur(Math.max(...T.saved_eur.yearly.values, ...T.income_eur.yearly.values)));
    for (const id of ['patients', 'matches', 'dx']) expect(text(html, `sim-value-${id}`)).not.toBeNull();
    expect(text(html, 'sim-scale')).toBe(COPY.gScaleEuro);
    expect(plotGeometry(726, true, 'euro', 120).L).toBeGreaterThan(plotGeometry(726, true, 'five', 120).L);
  });
  it('basis "total": every flow is the running total since the start, and the scale is the total\'s', () => {
    const html = render(m, 120, { plot: 'five', basis: 'total', money: 'drop' });
    expect(text(html, 'sim-value-money')).toBe(eur(T.saved_eur.total.values[119]));
    expect(text(html, 'sim-value-income')).toBe(eur(T.income_eur.total.values[119]));
    expect(text(html, 'sim-value-dx')).toBe(dx(T.diagnoses.total.values[119]));
    expect(readoutAt(m, 'total', 120).money).toBe(T.saved_eur.total.values[119]);
    expect(unitRefs(lineValues(m, 'total')).euro).toBe(Math.max(T.saved_eur.total.values[119], T.income_eur.total.values[119]));
    expect(html).toContain('in total since the start');
  });
  it('money "saved": the founder\'s word in the title, the caption and the head, and nowhere in the default', () => {
    const saved = render(m, 120, { plot: 'five', basis: 'yearly', money: 'saved' });
    expect(text(saved, 'sim-title')).toBe('What matching could save Greece, year by year');
    expect(saved).toContain('Money saved in Greece');
    expect(render(m, 120).replace(/<[^>]+>/g, ' ')).not.toMatch(/\bsaved?\b|\bsaves\b|\bsavings\b/i);
  });
});

describe('nothing moves, and no figure is typed in the code (the repo has no jsdom, so the source is read)', () => {
  const src = (f: string) => readFileSync(join(__dirname, f), 'utf8');
  const noComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');
  const code = ['SimDiagram.tsx', 'Simulation.tsx', 'tenYears.ts'].map((f) => noComments(src(f))).join('\n');
  const css = readFileSync(join(__dirname, 'matches.css'), 'utf8');
  it('the card and the page have no timer, no frame loop, no observer that moves a value, no intersection observer, no animation or transition', () => {
    for (const banned of ['requestAnimationFrame', 'setInterval', 'setTimeout', 'IntersectionObserver', 'cancelAnimationFrame', 'performance.now', 'useClock', 'animation', 'transition']) {
      expect(code, banned).not.toContain(banned);
    }
    const dg = css.slice(css.indexOf('.dg{'));
    expect(dg).not.toMatch(/transition|animation|@keyframes/);
    expect(css).not.toMatch(/@keyframes|animation\s*:/);
  });
  it('no value of the block, no Greek figure and no month or year count appears in the code or the strings', () => {
    const files = [code, noComments(src('copy.ts'))].join('\n');
    const figures = [
      '1915', '1,915', '19,869', '19.9', '91205', '91,205', '1764318', '1,764,318', '816487', '816,487', '37777', '37,777', '2071', '2,071', '5000', '5,000',
      '0.46', '1.01', '4074', '18.5', '1834', 'EU-27', 'EU27',
    ];
    for (const f of figures) expect(files, f).not.toContain(f);
  });
  it('the diagram strings hold no digit except through an argument', () => {
    const flat = (v: unknown): string[] => (typeof v === 'string' ? [v] : typeof v === 'object' && v ? Object.values(v).flatMap(flat) : []);
    const keys = Object.keys(COPY).filter((k) => k.startsWith('g'));
    expect(keys.length).toBeGreaterThan(30);
    for (const k of keys) {
      if (k === 'gScaleTop') continue;
      for (const str of flat((COPY as Record<string, unknown>)[k])) expect(str, k).not.toMatch(/\d/);
    }
    expect(COPY.gPlateau({ records: 'R', month: 777, planYears: 888 })).toBe("Past R records (month 777) the matches and their effect are held at the R-record values; past year 888 the plan's revenue is held flat.");
    expect(COPY.gSliderValue({ year: 777, month: 888 })).toBe('Year 777, month 888');
    expect(COPY.gBandPlan({ planYears: 777 })).toBe('Plan: years 1 to 777');
  });
  it('no em dash and no "anonymous" in the diagram strings', () => {
    const all = JSON.stringify(Object.entries(COPY).filter(([k]) => k.startsWith('g')).map(([, v]) => (typeof v === 'function' ? String(v) : v)));
    expect(all).not.toMatch(/—|–/);
    expect(all).not.toMatch(/anonym/i);
  });
});
