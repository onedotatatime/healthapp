/**
 * The loss card (MIN-4774). The expected values are the block's own check points (written by the generator with Decimal, half-up to the euro) and the
 * written format rule of spec A16 section 3, restated here, not the app's formatter: a wrong formula, a wrong formatter or a typed number goes red.
 * There is no jsdom in this repo: the screen is checked as server markup at a chosen geography and share, the slider's arithmetic as pure functions.
 * Data: the `reach` block of data/synthetic/simulation.json (Cron, MIN-4773; built with Decimal in scripts/synthetic/reach.py, so the check points it carries
 * are independent of the TypeScript formulas here). The page was first built on a local fixture of the CTO's contract; the block matched it and the fixture is gone.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import simulationJson from '../../../data/synthetic/simulation.json';
import { COPY } from './copy';
import { SimulationUnavailable, SimulationView } from './Simulation';
import {
  DEFAULT_SHARE, THUMB_HALF, TENTHS_MAX, dropShare, formatCount, formatEuro, formatEuroShort, formatLossPct, formatSmallShare, formatStep, niceMax, parseReach, pctOfTenths,
  plotGeometry, pointAt, startTenths, tenthsOfPct, type Geo, type Reach,
} from './reach';

const RAW: unknown = simulationJson;
const model = (): Reach => {
  const p = parseReach(RAW);
  if (!p.ok) throw new Error('the reach block did not parse');
  return p.data;
};
const M = model();
const geo = (id: string): Geo => M.geos.find((g) => g.id === id) as Geo;
type Raw = { reach: { geographies: { id: string; check_points: { share_pct: number; loss_eur: number; drop_eur: number; residents: number; matched: number; fewer_dx: number }[] }[] } };
const RAW_POINTS = (RAW as Raw).reach.geographies;

// the written rule (spec A16 section 3), independent of the app's formatter
const sig = (v: number) => String(Number(v.toPrecision(3)));
const rule = (v: number) => (v < 1e6 ? `€${Math.round(v / 1e3)}k` : v < 1e9 ? `€${sig(v / 1e6)} million` : v < 1e12 ? `€${sig(v / 1e9)} billion` : `€${sig(v / 1e12)} trillion`);
const count = (v: number) => (v < 1e6 ? Math.round(v).toLocaleString('en-US') : v < 1e9 ? `${sig(v / 1e6)} million` : `${sig(v / 1e9)} billion`);

const render = (geoId?: string, share?: number) => renderToStaticMarkup(createElement(SimulationView, { model: M, initialGeo: geoId, initialShare: share }));
const text = (markup: string, id: string) => {
  const m = markup.match(new RegExp(`data-testid="${id}"[^>]*>([\\s\\S]*?)</(?:p|span|output|li|div|h1|small|text)>`));
  return m ? m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/\s+/g, ' ').trim() : null;
};
const attr = (markup: string, id: string, name: string) => {
  const tag = markup.match(new RegExp(`<[^>]*data-testid="${id}"[^>]*>`));
  const a = tag?.[0].match(new RegExp(`${name}="([^"]*)"`));
  return a ? a[1].replace(/&#x27;/g, "'") : null;
};
const cp = (id: string, share: number) => {
  const found = RAW_POINTS.find((g) => g.id === id)!.check_points.find((c) => c.share_pct === share);
  if (!found) throw new Error(`no check point ${id} ${share}`);
  return found;
};

describe('the reach block parses and the model reproduces its own check points', () => {
  it('reads the three geographies in switch order with their years', () => {
    expect(M.geos.map((g) => [g.id, g.name, g.year])).toEqual([['greece', 'Greece', 2024], ['eu27', 'Europe (EU-27)', 2024], ['world', 'Global', 2023]]);
    expect([M.baselinePct, M.dropPts, M.dropPer100, M.matched, M.records, M.planPatients, M.planYear]).toEqual([11, 1.01, 0.46, 2071, 5000, 91205, 10]);
  });

  it('every check point of every geography is reproduced: euros to 1, people to 1', () => {
    let n = 0;
    for (const g of M.geos) {
      expect(g.checkPoints.length, g.id).toBeGreaterThanOrEqual(7); // 0, 0.1, 1, 10, 50, 100 and the plan share
      for (const c of g.checkPoints) {
        const p = pointAt(M, g, c.share_pct);
        const tag = `${g.id} ${c.share_pct}%`;
        expect(Math.abs(Math.round(p.loss) - c.loss_eur), `${tag} loss`).toBeLessThanOrEqual(1);
        expect(Math.abs(Math.round(p.drop) - c.drop_eur), `${tag} drop`).toBeLessThanOrEqual(1);
        expect(Math.abs(p.residents - c.residents), `${tag} residents`).toBeLessThanOrEqual(1);
        expect(Math.abs(p.matched - c.matched), `${tag} matched`).toBeLessThanOrEqual(1);
        expect(Math.abs(p.fewerDx - c.fewer_dx), `${tag} fewer diagnoses`).toBeLessThanOrEqual(1);
        n++;
      }
    }
    expect(n).toBeGreaterThanOrEqual(21);
  });

  it("the CTO's worked line for Greece holds, and the EU-27 limit equals the euro block's drop", () => {
    const gr = geo('greece');
    expect([gr.loss0, gr.drop100, gr.loss100]).toEqual([2_185_630_700, 200_680_637, 1_984_950_063]);
    expect(dropShare(gr)).toBeCloseTo((1.01 / 11) * 100, 6); // 9.18%
    // the euro block is rounded to 0.01 million, so the two agree to 5,000 euros
    expect(Math.abs(geo('eu27').drop100 - (simulationJson as { euro: { drop_mio_eur: number[] } }).euro.drop_mio_eur.at(-1)! * 1e6)).toBeLessThanOrEqual(5000);
    expect(pointAt(M, gr, M.geos[0].planSharePct).drop).toBeCloseTo(1_764_022, -1); // the plan marker's figure, within 10 euros of the CTO's
  });

  it('the same percentage falls in every geography, only the spending differs', () => {
    for (const g of M.geos) {
      expect(dropShare(g), g.id).toBeCloseTo((1.01 / 11) * 100, 4);
      expect(g.drop100 / g.loss0, g.id).toBeCloseTo(M.dropPts / M.baselinePct, 6);
    }
  });

  it('the loss never rises between two slider steps, never goes below the loss at 100%, the drop never goes above the drop at 100%', () => {
    for (const g of M.geos) {
      let prev = Infinity;
      for (let t = 0; t <= TENTHS_MAX; t++) {
        const p = pointAt(M, g, pctOfTenths(t));
        expect(p.loss, `${g.id} ${t}`).toBeLessThanOrEqual(prev);
        expect(p.loss, `${g.id} ${t} floor`).toBeGreaterThanOrEqual(g.loss100 - 1e-3);
        expect(p.drop, `${g.id} ${t} ceiling`).toBeLessThanOrEqual(g.drop100 + 1e-3);
        prev = p.loss;
      }
      expect(pointAt(M, g, 0).drop).toBe(0);
      expect(pointAt(M, g, 0).loss).toBe(g.loss0);
    }
  });

  it('the plan marker sits at the file\'s share: 91,205 of the population', () => {
    for (const g of M.geos) expect(g.planSharePct, g.id).toBeCloseTo((M.planPatients / g.population) * 100, 9);
    expect(formatSmallShare(geo('greece').planSharePct)).toBe('0.88%');
    expect(formatSmallShare(geo('eu27').planSharePct)).toBe('0.02%');
    expect(formatSmallShare(geo('world').planSharePct)).toBe('0.0011%');
  });

  it('refuses what it cannot draw: no block, a slider it does not implement, no readable geography; a broken geography leaves the switch', () => {
    const clone = () => JSON.parse(JSON.stringify(RAW));
    expect(parseReach({}).ok).toBe(false);
    expect(parseReach({ reach: null }).ok).toBe(false);
    const step = clone(); step.reach.slider.step_pct = 1;
    expect(parseReach(step).ok).toBe(false);
    const none = clone(); none.reach.geographies = [{ id: 'x' }];
    expect(parseReach(none).ok).toBe(false);
    const broken = clone(); broken.reach.geographies[2].loss_at_100_eur += 1000; // the three euro figures disagree
    const p = parseReach(broken);
    expect(p.ok && p.data.geos.map((g) => g.id)).toEqual(['greece', 'eu27']);
  });
});

describe('the slider arithmetic and the axis', () => {
  it('works in tenths of a percent without drift', () => {
    expect(pctOfTenths(0)).toBe(0);
    expect(pctOfTenths(1)).toBe(0.1);
    expect(pctOfTenths(3)).toBe(0.3);
    expect(pctOfTenths(1000)).toBe(100);
    expect(pctOfTenths(1500)).toBe(100);
    expect(tenthsOfPct(40.5)).toBe(405);
    expect(tenthsOfPct(0.879)).toBe(9);
  });

  it('DEFAULT_SHARE is one valid constant, and the card opens on it', () => {
    expect(DEFAULT_SHARE === 'plan' || (DEFAULT_SHARE >= 0 && DEFAULT_SHARE <= 100)).toBe(true);
    const start = startTenths(geo('greece'));
    expect(attr(render(), 'sim-slider', 'value')).toBe(String(pctOfTenths(start)));
    expect(startTenths(geo('greece'), 'plan')).toBe(9);
    expect(startTenths(geo('world'), 'plan')).toBe(0);
  });

  it('the euro axis starts at zero and tops at a round number at least today\'s loss', () => {
    expect(niceMax(2_185_630_700)).toBe(2_500_000_000);
    expect(niceMax(1_080_493_002_367)).toBe(1_200_000_000_000);
    expect(niceMax(201_737_065_200)).toBe(250_000_000_000);
    for (const g of M.geos) expect(niceMax(g.loss0), g.id).toBeGreaterThanOrEqual(g.loss0);
    const g = plotGeometry(726, true, niceMax(geo('greece').loss0));
    expect(g.y(0)).toBe(g.T + g.H);
    expect(g.y(g.yMax)).toBe(g.T);
  });

  it('the thumb\'s centre is exactly x(share) at 1280 and 390 (spec A16 section 5)', () => {
    for (const [W, wide] of [[726, true], [324, false]] as const) {
      const g = plotGeometry(W, wide, 1e9);
      const span = g.W - g.L - g.R;
      for (const pct of [0, 0.1, 0.9, 50, 99.9, 100]) {
        const thumbCentre = g.slider.marginLeft + THUMB_HALF + ((g.slider.width - 2 * THUMB_HALF) * pct) / 100;
        expect(thumbCentre, `${W} ${pct}`).toBeCloseTo(g.x(pct), 9);
        expect(g.x(pct), `${W} ${pct} span`).toBeCloseTo(g.L + (span * pct) / 100, 9);
      }
    }
  });
});

describe('the formatters follow the written rule', () => {
  it('euros', () => {
    expect(formatEuro(200_680_637)).toBe('€201 million');
    expect(formatEuro(2_185_630_700)).toBe('€2.19 billion');
    expect(formatEuro(1_040_000_000_000)).toBe('€1.04 trillion');
    expect(formatEuro(1_800_000)).toBe('€1.8 million');
    expect(formatEuro(121_000)).toBe('€121k');
    expect(formatEuro(640)).toBe('€640');
    expect(formatEuro(0)).toBe('€0');
    expect(formatEuro(999_600_000)).toBe('€1 billion'); // 999.6 million does not read "€1000 million"
    expect(formatEuroShort(2_500_000_000)).toBe('€2.5 bn');
    expect(formatEuroShort(1_250_000_000)).toBe('€1.25 bn');
    expect(formatEuroShort(1_200_000_000_000)).toBe('€1.2 tn');
    expect(formatEuroShort(0)).toBe('€0');
  });
  it('counts and shares', () => {
    expect(formatCount(91_205)).toBe('91,205');
    expect(formatCount(4_150_000)).toBe('4.15 million');
    expect(formatCount(8_062_923_417)).toBe('8.06 billion');
    expect(formatStep(40)).toBe('40%');
    expect(formatStep(40.5)).toBe('40.5%');
    expect(formatStep(0.1)).toBe('0.1%');
    expect(formatStep(0)).toBe('0%');
    expect(formatStep(100)).toBe('100%');
    expect(formatLossPct(9.18)).toBe('9.2%');
    expect(formatLossPct(0.081)).toBe('0.08%');
    expect(formatLossPct(42)).toBe('42%');
  });
});

describe('the card, as markup', () => {
  it('opens on Greece with the yearly loss as the first figure: the title carries today\'s loss, the headline the loss at the slider', () => {
    const html = render('greece', 0);
    expect(attr(html, 'sim-loss-card', 'data-geo')).toBe('greece');
    expect(text(html, 'sim-title')).toBe(`Greece's health system loses about ${rule(geo('greece').loss0)} a year to wrong or missed diagnoses, in this model`);
    expect(text(html, 'sim-value-loss')).toBe(rule(cp('greece', 0).loss_eur));
    expect(text(html, 'sim-value-drop')).toBe('€0');
    expect(html.indexOf('data-testid="sim-money"')).toBeLessThan(html.indexOf('data-testid="sim-slider"'));
  });

  it('every figure at 100% is the block\'s check point, formatted by the rule', () => {
    for (const [id, title] of [['greece', 'Greece'], ['eu27', 'Europe (EU-27)'], ['world', 'Global']] as const) {
      const html = render(id, 100);
      const c = cp(id, 100);
      expect(text(html, 'sim-value-loss'), `${title} loss`).toBe(rule(c.loss_eur));
      expect(text(html, 'sim-value-drop'), `${title} drop`).toBe(`−${rule(c.drop_eur)}`);
      expect(text(html, 'sim-drop-pct'), `${title} drop pct`).toBe('(−9.2%)');
      expect(text(html, 'sim-value-matches'), `${title} matches`).toBe(count(c.matched));
      expect(text(html, 'sim-value-dx'), `${title} dx`).toBe(count(c.fewer_dx));
      expect(text(html, 'sim-state'), title).toBe(COPY.rState.full);
    }
    expect(text(render('greece', 100), 'sim-value-drop')).toBe('−€201 million');
  });

  it('at 50% and 0.1% too, and the plan row and marker carry the plan\'s own figures', () => {
    const half = render('greece', 50);
    expect(text(half, 'sim-value-loss')).toBe(rule(cp('greece', 50).loss_eur));
    expect(text(half, 'sim-share')).toBe('50% of Greece');
    expect(text(render('greece', 0.1), 'sim-value-drop')).toBe(`−${rule(cp('greece', 0.1).drop_eur)}`);
    for (const g of M.geos) {
      const html = render(g.id, 0);
      const plan = cp(g.id, g.planSharePct);
      expect(text(html, 'sim-value-plan'), g.id).toBe('91,205');
      expect(text(html, 'sim-plan-line'), g.id).toContain(`At that size the loss falls by ${rule(plan.drop_eur)} a year.`);
      expect(text(html, 'sim-plan-line'), g.id).toContain(formatSmallShare(g.planSharePct));
    }
  });

  it('the switch is a labelled group of radios in file order that keeps the share; the slider has a label, a value text and 0.1% steps', () => {
    const html = render('eu27', 40);
    expect(html).toContain('<fieldset');
    expect(html).toContain('<legend>Health system</legend>');
    expect([...html.matchAll(/<label for="[^"]*sim-geo-[^"]*-(\w+)">([^<]+)<\/label>/g)].map((m) => [m[1], m[2]])).toEqual([['greece', 'Greece'], ['eu27', 'Europe (EU-27)'], ['world', 'Global']]);
    expect(html.match(/type="radio"[^>]*checked=""/g)).toHaveLength(1);
    expect(html).toMatch(/data-testid="sim-geo-eu27"[^>]*checked=""|checked=""[^>]*data-testid="sim-geo-eu27"/);
    const tag = html.match(/<input[^>]*data-testid="sim-slider"[^>]*>/)![0];
    expect(tag).toContain('type="range"');
    expect(tag).toContain('min="0"');
    expect(tag).toContain('max="100"');
    expect(tag).toContain('step="0.1"');
    expect(tag).toContain('value="40"');
    expect(tag).toContain(`aria-label="${COPY.rSliderAria}"`);
    expect(attr(html, 'sim-slider', 'aria-valuetext')).toBe(`40% of the EU-27's patients in the network. The loss falls by ${rule(cp('eu27', 50).drop_eur * 0.8)} a year.`);
    expect(html).toMatch(/<label for="[^"]*-slider">Patients in the network<\/label>/);
    expect(text(html, 'sim-share')).toBe('40% of the EU-27');
  });

  it('says what is assumed and why the line is straight, never 41.4% beside euros, never "saved"', () => {
    for (const g of M.geos) {
      const html = render(g.id, 25);
      expect(text(html, 'sim-straight'), g.id).toBe('A straight line because the match rate and its effect are held at the 5,000-record values (synthetic). They are not measured at this size.');
      expect(text(html, 'sim-assumption'), g.id).toContain('46% of opted-in synthetic records found a match');
      expect(text(html, 'sim-help-loss'), g.id).toContain('11% of');
      expect(text(html, 'sim-same-rates'), g.id).toContain('Only the spending differs');
      expect(html, g.id).not.toContain('41.4');
      expect(html, g.id).not.toMatch(/saved|savings|\bwill\b/i);
      expect(html, g.id).toContain('Simulation on synthetic data. A model, not a measurement');
    }
  });

  it('shows the year, the conversion and the caveat for Global without a tap, and no conversion line for the euro geographies', () => {
    const w = render('world', 50);
    expect(text(w, 'sim-title')).toContain('Health systems worldwide lose about');
    expect(text(w, 'sim-base')).toContain('Global, 2023');
    expect(text(w, 'sim-fx')).toBe(
      `Converted from US$${sig(geo('world').original.total / 1e12)} trillion (US$1,317 a head, 8.06 billion people, 2023) at the ECB's 2023 average, US$ 1.0813 per €1.`,
    );
    expect(text(w, 'sim-share-note')).toContain('applied here to the world as an assumption');
    expect(text(w, 'sim-share-note')).toContain('Read it as a scale, not a measurement.');
    expect(render('greece', 50)).not.toContain('data-testid="sim-fx"');
    expect(text(render('eu27', 50), 'sim-share-note')).toContain('applied here to the EU-27');
  });

  it('the formula line gives the figure at the precision shown, and sources are links', () => {
    const gr = render('greece', 0);
    expect(text(gr, 'sim-formula')).toBe('1.01 points × €19.9 billion (Greece, 2024) = €201 million a year');
    expect(text(render('eu27', 0), 'sim-formula')).toBe('1.01 points × €1.83 trillion (Europe (EU-27), 2024) = €18.5 billion a year');
    expect(text(gr, 'sim-base')).toBe('Spending base: Greece, 2024, €19.9 billion a year in all, €1,915 for each inhabitant.');
    expect(gr).toContain('href="https://ec.europa.eu/eurostat/databrowser/view/hlth_sha11_hf/default/table"');
    expect(gr).toMatch(/Population: <a href="https:\/\/ec\.europa\.eu[^"]*demo_pjan/);
  });

  it('the values table has 0 to 100% in tens and every row is the block\'s figure', () => {
    const html = render('greece', 0);
    expect([...html.matchAll(/data-testid="sim-values-row-(\d+)"/g)].map((m) => Number(m[1]))).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    expect(text(html, 'sim-values-row-50')).toContain(rule(cp('greece', 50).loss_eur));
    expect(text(html, 'sim-values-row-100')).toContain('−€201 million');
  });

  it('the plot is one SVG that starts at zero: three ticks, today\'s loss on the top of the line, no second axis', () => {
    const html = render('greece', 50);
    expect(text(html, 'sim-tick-0')).toBe('€0');
    expect(text(html, 'sim-tick-1')).toBe('€1.25 bn');
    expect(text(html, 'sim-tick-2')).toBe('€2.5 bn');
    expect(html.match(/<svg[^>]*data-testid="sim-svg"/g)).toHaveLength(1);
    expect(html.match(/data-testid="sim-line"/g)).toHaveLength(1);
    expect(html).toContain('data-testid="sim-plan-marker"');
    expect(attr(html, 'sim-svg', 'aria-hidden')).toBe('true');
  });

  it('says so in one sentence, with the label, when the data cannot be read', () => {
    const html = renderToStaticMarkup(createElement(SimulationUnavailable));
    expect(html).toContain(COPY.simUnavailable);
    expect(html).toContain('data-testid="sim-label"');
    expect(html).not.toContain('sim-loss-card');
  });
});

describe('the sources: nothing moves, nothing is typed', () => {
  const src = (f: string) => readFileSync(join(__dirname, f), 'utf8');
  const css = readFileSync(join(__dirname, 'matches.css'), 'utf8');
  const bare = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');
  const code = ['SimReach.tsx', 'Simulation.tsx', 'reach.ts'].map((f) => bare(src(f))).join('\n');
  it('has no timer, no frame loop, no intersection observer, no animation or transition', () => {
    for (const banned of ['requestAnimationFrame', 'setInterval', 'setTimeout', 'IntersectionObserver', 'cancelAnimationFrame', 'performance.now', 'animation', 'transition']) {
      expect(code, banned).not.toContain(banned);
    }
    const lc = css.split('\n').filter((l) => /^\.lc/.test(l)).join('\n');
    expect(lc.length).toBeGreaterThan(1000);
    expect(lc).not.toMatch(/transition|animation|@keyframes/);
  });
  it('types no euro amount, no patient count and no rate in the card or the strings', () => {
    const strings = src('copy.ts').slice(src('copy.ts').lastIndexOf('\n', src('copy.ts').indexOf('ONE loss card')));
    for (const body of [bare(src('SimReach.tsx')), bare(strings).replace('per €1', 'per one euro')]) {
      expect(body).not.toMatch(/€\s?[1-9]/);
      expect(body).not.toMatch(/\b91,?205\b/);
      expect(body).not.toMatch(/\b2071\b|\b46\.0\b|1\.01\b|\b10375764\b/);
    }
  });
  it('the strings have no em or en dash, no "anonymous", no exclamation mark', () => {
    const strings = src('copy.ts').slice(src('copy.ts').indexOf('ONE loss card'));
    const quoted = [...strings.matchAll(/(['`])((?:\\.|(?!\1).)*)\1/g)].map((m) => m[2]).join('\n');
    expect(quoted).not.toMatch(/—|–/);
    expect(quoted).not.toMatch(/anonymous|!/i);
  });
  it("uses no class name another screen styles globally (exams.css animates a bare .bar; the card's bars are .lc-bar)", () => {
    expect(src('SimReach.tsx')).not.toMatch(/className="bar"/);
    expect(css).toMatch(/\.lc \.ro \.lc-bar\{/);
  });
  it('the money label is one constant', () => {
    expect(COPY.rMoneyLabel[COPY.rMoneyWording]).toBe('Lower by');
  });
});
