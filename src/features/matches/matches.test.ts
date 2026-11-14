import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import simulationJson from '../../../data/synthetic/simulation.json';
import { COPY } from './copy';
import { createMockMatchesApi, EMPTY_RESULT, MARIA_RESULT } from './mock';
import { countryName, featureLabel } from './pattern';
import { isEmpty, MatchesView, type PanelState } from './PossibleMatchesPanel';
import { SimulationView } from './Simulation';
import { assumptionPct, decimalsOf, frameAt, hasDropped, niceAxis, parseSimulation, SIM_DURATION_MS, type SimulationData } from './simData';

/** The words a reader sees: tags and SVG geometry removed. */
const words = (markup: string) => markup.replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const html = (state: PanelState) => renderToStaticMarkup(createElement(MatchesView, { state }));
const sim = (data: SimulationData) => renderToStaticMarkup(createElement(SimulationView, { data, run: 0, reduced: true, onReplay: () => {} }));
const real = () => {
  const p = parseSimulation(simulationJson);
  if (!p.ok) throw new Error('simulation.json did not parse');
  return p.data;
};

describe('pattern words', () => {
  it('turns coded features into words', () => {
    expect(featureLabel('CRP_high')).toBe('CRP high');
    expect(featureLabel('anti_CCP_positive')).toBe('Anti-CCP positive');
    expect(featureLabel('morning_stiffness')).toBe('Morning stiffness');
    expect(featureLabel('spec_rheumatology')).toBe('Rheumatology');
  });
  it('names countries, and falls back to the code', () => {
    expect(countryName('GR')).toBe('Greece');
    expect(countryName('ZZZZ')).toBe('ZZZZ');
  });
});

describe('F2 panel: the permanent label is in every state', () => {
  const states: [string, PanelState][] = [
    ['loading', { status: 'loading' }],
    ['error', { status: 'error' }],
    ['empty', { status: 'ready', result: EMPTY_RESULT }],
    ['populated', { status: 'ready', result: MARIA_RESULT }],
  ];
  for (const [name, state] of states) {
    it(`shows "${COPY.panelLabel}" when ${name}`, () => {
      expect(html(state)).toContain('Seeded synthetic data. Not real patients.');
    });
  }
  it('populated: count line, pattern and countries only', () => {
    const out = html({ status: 'ready', result: MARIA_RESULT });
    expect(out).toContain('9 seeded synthetic records share this pattern.');
    expect(out).toContain('Anti-CCP positive');
    expect(out).toContain('Greece');
    expect(out).not.toMatch(/name|birth|age|sex/i);
  });
  it('the empty text is the same whatever the cause, and carries no count or hint', () => {
    const zero = html({ status: 'ready', result: { match_count: 0, groups: [] } });
    const noGroups = html({ status: 'ready', result: { match_count: 3, groups: [] } });
    expect(isEmpty({ match_count: 3, groups: [] })).toBe(true);
    expect(zero).toBe(noGroups);
    expect(zero).toContain('No matches in the seeded data.');
    expect(words(zero)).not.toMatch(/fewer|too few|opt|consent|\d/i);
  });
  it('the mock behaves like the server: off gives the empty answer, on gives Maria, for the same call', async () => {
    const api = createMockMatchesApi(false);
    expect(await api.possibleMatches('x')).toEqual(EMPTY_RESULT);
    expect(await api.setOptIn(true)).toBe(true);
    expect(await api.possibleMatches('x')).toEqual(MARIA_RESULT);
    expect(await api.setOptIn(false)).toBe(false);
    expect(await api.possibleMatches('x')).toEqual(EMPTY_RESULT);
  });
});

describe('wording rules', () => {
  it('never says "anonymous" anywhere in the matches copy', () => {
    const all = JSON.stringify(Object.values(COPY).map((v) => (typeof v === 'function' ? v(1 as never) : v)));
    expect(all).not.toMatch(/anonym/i);
  });
  it('the simulation label in the JSON is the CTO\'s wording, word for word', () => {
    expect(real().label).toBe(COPY.simLabel);
  });
  it('no file in the matches folder loads a webfont from the network', () => {
    for (const f of readdirSync(__dirname)) {
      if (f.endsWith('.test.ts')) continue;
      expect(readFileSync(join(__dirname, f), 'utf8'), f).not.toMatch(/fonts\.googleapis|fonts\.gstatic/);
    }
  });
});

describe('simulation data', () => {
  it('reads the committed JSON: series 1, 2 and 3 with one value per x', () => {
    const d = real();
    expect(d.series.map((s) => s.id)).toEqual([1, 2, 3]);
    for (const s of d.series) expect(s.values).toHaveLength(d.x.values.length);
    expect(hasDropped(d)).toBe(false);
  });
  it('plays in 30 seconds', () => expect(SIM_DURATION_MS).toBe(30_000));
  it('frames: starts on step 0, ends on the last step, halfway is between', () => {
    expect(frameAt(0, 12)).toMatchObject({ step: 0, frac: 0 });
    expect(frameAt(1, 12)).toMatchObject({ step: 11, frac: 0 });
    const mid = frameAt(0.5, 12);
    expect(mid.step).toBe(5);
    expect(mid.frac).toBeCloseTo(0.5);
    expect(frameAt(7, 12).step).toBe(11);
  });
  it('axes start at zero and reach at least the data', () => {
    for (const s of real().series) {
      const a = niceAxis(Math.max(...s.values));
      expect(a.ticks[0]).toBe(0);
      expect(a.top).toBeGreaterThanOrEqual(Math.max(...s.values));
      expect(a.ticks.at(-1)).toBe(a.top);
    }
  });
  it('prints as many decimals as the data has', () => {
    expect(decimalsOf([5, 4.99, 4.9])).toBe(2);
    expect(decimalsOf([0, 33.5])).toBe(1);
    expect(decimalsOf([1, 2])).toBe(0);
  });
  it('drops a series that does not line up with x, and refuses data with no series 1', () => {
    const base = JSON.parse(JSON.stringify(simulationJson));
    base.series[1].values = base.series[1].values.slice(0, 3);
    const p = parseSimulation(base);
    expect(p.ok && p.data.series.map((s) => s.id)).toEqual([1, 3]);
    base.series = base.series.filter((s: { id: number }) => s.id !== 1);
    expect(parseSimulation(base).ok).toBe(false);
  });
});

describe('simulation screen', () => {
  it('finished state: label, assumption, sources and all three charts, values from the JSON', () => {
    const d = real();
    const out = sim(d);
    expect(out).toContain('Simulation on synthetic data. A model, not a measurement');
    expect(out).toContain(`Assumption, not a finding: a match lowers the chance of a wrong or missed diagnosis by ${assumptionPct(d)}.`);
    expect(out).toContain('https://www.who.int/news-room/fact-sheets/detail/patient-safety');
    expect(out).toContain('oecd.org');
    for (const id of [1, 2, 3]) expect(out).toContain(`sim-series-${id}`);
    // last step of each series, printed as the data prints it
    for (const s of d.series) expect(out).toContain(`>${s.values.at(-1)!.toFixed(decimalsOf(s.values))}<`);
    expect(out).not.toMatch(/NaN|undefined/);
  });
  it('series 1 alone: no empty chart, no placeholder number, no assumption, the dropped line instead', () => {
    const d = real();
    const alone = { ...d, series: d.series.filter((s) => s.id === 1) };
    const out = sim(alone);
    expect(out).toContain('sim-series-1');
    expect(out).not.toContain('sim-series-2');
    expect(out).not.toContain('sim-series-3');
    expect(out).not.toContain('sim-assumption');
    expect(out).toContain('Series not shown: no solid source.');
    expect(out).toContain('Simulation on synthetic data. A model, not a measurement');
    expect(words(out)).not.toMatch(/NaN|undefined|--|n\/a/i);
  });
});
