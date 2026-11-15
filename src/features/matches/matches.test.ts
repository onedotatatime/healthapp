import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import simulationJson from '../../../data/synthetic/simulation.json';
import { OptInState, PossibleMatches } from './contract';
import { COPY } from './copy';
import { createMockMatchesApi, EMPTY_RESULT, MARIA_RESULT } from './mock';
import { countryName, featureLabel } from './pattern';
import { MatchesContext } from './context';
import { isEmpty, MatchesView, PossibleMatchesPanel, type PanelState } from './PossibleMatchesPanel';
import { toApiError } from './real';
import { SimulationUnavailable, SimulationView } from './Simulation';
import {
  SIM_GROW_MS, SIM_LANDING_MS, clockAt, decimalsOf, effectIndex, formatEuro, formatPct, formatPerInhabitant, formatTotal, hasDropped, matchesAt, niceAxis, parseSimulation,
  shownDrop, SIM_DURATION_MS, SIM_ENTRY_MS, SIM_MATCH_WINDOW, SIM_STEP_MS, simDuration, valueAt, visibleCells, type SimulationData,
} from './simData';

/** The words a reader sees: tags and SVG geometry removed. */
const words = (markup: string) => markup.replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const html = (state: PanelState) => renderToStaticMarkup(createElement(MatchesView, { state }));
const sim = (data: SimulationData) => renderToStaticMarkup(createElement(SimulationView, { data, run: 0, reduced: true, onReplay: () => {} }));
/** The screen at a frozen moment of the play (ms from the first frame). */
const simAt = (data: SimulationData, at: number) => renderToStaticMarkup(createElement(SimulationView, { data, run: 0, reduced: false, onReplay: () => {}, at }));
const clone = () => JSON.parse(JSON.stringify(simulationJson));
const text = (markup: string, testid: string) => {
  const m = markup.match(new RegExp(`data-testid="${testid}"[^>]*>([\\s\\S]*?)</(?:p|div|text)>`));
  return m ? m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim() : null; // textContent: tags removed, no space added
};
const real = () => {
  const p = parseSimulation(simulationJson);
  if (!p.ok) throw new Error('simulation.json did not parse');
  return p.data;
};

describe('the real contract (answers copied from Cron\'s dev fixtures, MIN-4505)', () => {
  const CRON_MARIA = {
    match_count: 9,
    groups: [{ n: 9, pattern: ['CRP_high', 'RF_positive', 'anti_CCP_positive', 'joint_pain', 'morning_stiffness', 'spec_rheumatology'], countries: ['DE', 'FR', 'GR', 'IT', 'NL', 'SE'], label: 'seeded, synthetic' }],
  };
  it('parses the 9-record answer and shows the six chips, six countries and the permanent label, not the server label', () => {
    const r = PossibleMatches.parse(CRON_MARIA);
    const text = words(html({ status: 'ready', result: r }));
    for (const c of ['CRP high', 'RF positive', 'Anti-CCP positive', 'Joint pain', 'Morning stiffness', 'Rheumatology', 'Germany', 'France', 'Greece', 'Italy', 'Netherlands', 'Sweden']) expect(text).toContain(c);
    expect(text).toContain(COPY.panelLabel);
    expect(text).not.toContain('seeded, synthetic');
  });
  it('parses both opt-in answers', () => {
    expect(OptInState.parse({ matching_opt_in: false, matching_opt_in_at: null }).matching_opt_in).toBe(false);
    expect(OptInState.parse({ matching_opt_in: true, matching_opt_in_at: '2026-11-14T17:25:33.783784+00:00' }).matching_opt_in).toBe(true);
  });
  it('maps PostgREST 42501 / 403 to a 403 grant_expired, anything else to its status', () => {
    expect(toApiError({ code: '42501', message: 'no grant' }, 403)).toMatchObject({ status: 403, code: 'grant_expired' });
    expect(toApiError({ code: '42501', message: 'no grant' })).toMatchObject({ status: 403 });
    expect(toApiError({ code: 'PGRST301', message: 'x' }, 401)).toMatchObject({ status: 401, code: undefined });
    expect(toApiError({ message: 'x' })).toMatchObject({ status: 500 });
  });
});

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
    ['idle', { status: 'idle' }],
    ['running', { status: 'loading' }],
    ['access ended', { status: 'ended' }],
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
  it('the empty text is the same whatever the cause: it names all three causes and never which one it was', () => {
    const zero = html({ status: 'ready', result: { match_count: 0, groups: [] } });
    const noGroups = html({ status: 'ready', result: { match_count: 3, groups: [] } });
    expect(isEmpty({ match_count: 3, groups: [] })).toBe(true);
    expect(zero).toBe(noGroups); // the markup cannot depend on the count or the cause
    expect(zero).toContain('No matches in the seeded data.');
    expect(words(zero)).toContain('Shown when the patient has not turned matching on, when no pattern is shared, or when fewer than 5 records share it.');
    expect(words(zero)).not.toMatch(/\b3\b/); // the real count the server sent is never shown
  });
  it('idle: the run button and the sentence, no group and no count; running: the button is disabled and busy', () => {
    const idle = html({ status: 'idle' });
    expect(idle).toContain('data-state="idle"');
    expect(words(idle)).toContain('Run the matching');
    expect(idle).not.toContain('data-testid="match-group"');
    const running = html({ status: 'loading' });
    expect(running).toContain('data-state="running"');
    expect(running).toMatch(/<button[^>]*disabled=""[^>]*aria-busy="true"/);
  });
  it('populated: the total line and Run again; error: Try again; access ended: a plain sentence', () => {
    const out = html({ status: 'ready', result: MARIA_RESULT });
    expect(words(out)).toContain(COPY.matchTotal(MARIA_RESULT.match_count, MARIA_RESULT.groups.length));
    expect(words(out)).toContain('Run again');
    expect(words(html({ status: 'error' }))).toContain('Try again');
    expect(words(html({ status: 'ended' }))).toContain('Access to this record has ended. Nothing was compared.');
    expect(COPY.matchTotal(1, 1)).toBe('1 seeded synthetic records share a pattern with this record, in 1 group.');
  });
  it('a workspace that opens makes no call: the first state is idle and the mock server has been asked nothing', () => {
    let calls = 0;
    const api = { ...createMockMatchesApi(true), possibleMatches: async () => { calls++; return MARIA_RESULT; } };
    const markup = renderToStaticMarkup(createElement(MatchesContext.Provider, { value: api }, createElement(PossibleMatchesPanel, { patientId: 'x' })));
    expect(markup).toContain('data-state="idle"');
    expect(calls).toBe(0);
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
    const all = JSON.stringify(Object.values(COPY).map((v) => (typeof v === 'function' ? (v as (...a: number[]) => string)(1, 1) : v)));
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
  it('plays in 30 seconds: 600 entry, 11 steps of 2.6 s, 800 landing', () => {
    expect(SIM_DURATION_MS).toBe(30_000);
    expect(simDuration(real().x.values.length)).toBe(30_000);
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
    // MIN-4605 replaced the sentence approved on MIN-4506: the rising effect, start and ceiling from the file.
    expect(out).toContain(`Assumption, not a finding: each match lowers the chance of a wrong or missed diagnosis by ${formatPct(d.assumption.start)}, rising to ${formatPct(d.assumption.ceiling)} as matches accumulate.`);
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

describe('simulation data, the new blocks (MIN-4608)', () => {
  it('parses the committed file with every block: effect, matches and euro, one value per x', () => {
    const d = real();
    const n = d.x.values.length;
    expect(d.assumption.effect).toHaveLength(n);
    expect(d.matches?.count).toHaveLength(n);
    expect(d.euro?.drop_pts).toHaveLength(n);
    expect(d.assumption.ceiling).toBe(d.assumption.value);
    expect(d.euro?.source.url).toMatch(/^https:\/\//);
  });
  it('a file without start or ceiling is the old model: it is refused, never shown with the new sentence', () => {
    for (const key of ['start', 'ceiling']) {
      const raw = clone();
      delete raw.assumption[key];
      expect(parseSimulation(raw).ok).toBe(false);
    }
  });
  it('without the euro block, without the matches block, or with either invalid: the rest parses and the block is left out', () => {
    const noEuro = clone(); delete noEuro.euro;
    const noMatches = clone(); delete noMatches.matches;
    const shortEuro = clone(); shortEuro.euro.drop_pts = shortEuro.euro.drop_pts.slice(0, 3);
    const badUrl = clone(); badUrl.euro.source.url = 'not a url';
    const fallingCount = clone(); fallingCount.matches.count[5] = 0;
    const noEffect = clone(); delete noEffect.assumption.effect;
    const noSeries3 = clone(); noSeries3.series = noSeries3.series.filter((s: { id: number }) => s.id !== 3);
    const parsed = (raw: unknown) => { const p = parseSimulation(raw); if (!p.ok) throw new Error('refused'); return p.data; };
    expect(parsed(noEuro).euro).toBeUndefined();
    expect(parsed(noEuro).matches).toBeDefined();
    expect(parsed(noMatches).matches).toBeUndefined();
    expect(parsed(noMatches).euro).toBeDefined();
    expect(parsed(shortEuro).euro).toBeUndefined();
    expect(parsed(badUrl).euro).toBeUndefined();
    expect(parsed(fallingCount).matches).toBeUndefined();
    expect(parsed(noEffect).assumption.effect).toBeUndefined();
    // the euro figure is the drop of series 3: no series 3, no euro
    expect(parsed(noSeries3).euro).toBeUndefined();
    expect(parsed(noSeries3).series.map((s) => s.id)).toEqual([1, 2]);
  });
});

describe('the clock: one linear clock, every number derived from it', () => {
  const d = real();
  const n = d.x.values.length;
  const euro = d.euro!;
  const counts = d.matches!.count;
  const effect = d.assumption.effect!;
  const at = (k: number, tau: number) => clockAt(SIM_ENTRY_MS + (k - 1) * SIM_STEP_MS + tau, n);
  const [from, to] = SIM_MATCH_WINDOW;

  it('the timings are the spec\'s (Pix A3), pinned so a change of one goes red', () => {
    expect([SIM_ENTRY_MS, SIM_STEP_MS, SIM_GROW_MS, SIM_LANDING_MS]).toEqual([600, 2600, 400, 800]);
    expect(SIM_MATCH_WINDOW).toEqual([400, 2100]);
  });
  it('the shown drop is always at 2 decimals, in every frame, so the figure and the formula line agree', () => {
    for (let t = 0; t <= simDuration(n); t += 13) {
      const v = shownDrop(euro.drop_pts, clockAt(t, n).idx) * 100;
      expect(Math.abs(v - Math.round(v)), `t=${t}`).toBeLessThan(1e-6);
    }
  });
  it('starts on step 0 (entry), plays 11 intervals, lands, then is done and holds', () => {
    expect(clockAt(0, n)).toMatchObject({ phase: 'entry', idx: 0, landed: false, done: false });
    expect(at(1, 0)).toMatchObject({ phase: 'play', interval: 1, idx: 0 });
    expect(at(n - 1, SIM_STEP_MS - 1)).toMatchObject({ phase: 'play', interval: n - 1 });
    const landing = clockAt(simDuration(n) - 1, n);
    expect(landing).toMatchObject({ phase: 'landing', idx: n - 1, landed: true, done: false });
    expect(clockAt(simDuration(n), n)).toMatchObject({ phase: 'done', idx: n - 1, done: true });
    expect(clockAt(simDuration(n) * 3, n)).toMatchObject({ phase: 'done', idx: n - 1 });
  });
  it('the values equal the data at every step boundary, and move linearly between (no easing)', () => {
    for (let k = 1; k < n; k++) {
      expect(at(k, to).idx).toBeCloseTo(k);
      for (const s of d.series) expect(valueAt(s.values, at(k, to).idx)).toBeCloseTo(s.values[k]);
      expect(shownDrop(euro.drop_pts, at(k, to).idx)).toBe(euro.drop_pts[k]);
      expect(at(k, from).idx).toBeCloseTo(k - 1);
      const mid = at(k, (from + to) / 2).idx;
      expect(mid).toBeCloseTo(k - 0.5);
    }
  });
  it('read pause: from the end of the match window to the end of the step nothing moves', () => {
    for (let k = 1; k < n; k++) {
      for (const tau of [to, to + 1, SIM_STEP_MS - 1]) {
        const f = at(k, tau);
        expect(f.idx, `step ${k} tau ${tau}`).toBe(k);
        expect(matchesAt(f, counts)).toBe(counts[k]);
        expect(shownDrop(euro.drop_pts, f.idx)).toBe(euro.drop_pts[k]);
      }
    }
  });
  it('the euro figure, the per-inhabitant line and the matches equal the file at every step boundary', () => {
    for (let k = 1; k < n; k++) {
      const f = at(k, to);
      const drop = shownDrop(euro.drop_pts, f.idx);
      expect(formatEuro((drop / 100) * euro.total_mio_eur)).toBe(formatEuro(euro.drop_mio_eur[k]));
      expect(formatPerInhabitant((drop / 100) * euro.total_eur_per_inhabitant)).toBe(formatPerInhabitant(euro.drop_eur_per_inhabitant[k]));
      expect(matchesAt(f, counts)).toBe(counts[k]);
      expect(visibleCells(f, d.x.values)).toBe(d.x.values[k]);
      expect(effect[effectIndex(f)]).toBe(effect[k]);
    }
  });
  it('condition 6 at all steps: the arithmetic on screen checks out with the total as it is printed', () => {
    const printed = Number(formatTotal(euro.total_mio_eur).replace(/[^0-9]/g, '')) * 1e3; // "€N billion" as a reader multiplies it
    for (let k = 0; k < n; k++) {
      expect(formatEuro((euro.drop_pts[k] / 100) * printed), `step ${k}`).toBe(formatEuro(euro.drop_mio_eur[k]));
    }
  });
  it('counters never go down and never skip: matches land one at a time, cells only appear, the drop only grows', () => {
    let prev = { m: -1, v: -1, d: -1, e: -1, mio: -1 };
    for (let t = 0; t <= simDuration(n); t += 7) {
      const f = clockAt(t, n);
      const cur = {
        m: matchesAt(f, counts), v: visibleCells(f, d.x.values), d: shownDrop(euro.drop_pts, f.idx),
        e: effect[effectIndex(f)], mio: (shownDrop(euro.drop_pts, f.idx) / 100) * euro.total_mio_eur,
      };
      expect(cur.m).toBeGreaterThanOrEqual(prev.m);
      expect(cur.m - Math.max(prev.m, 0)).toBeLessThanOrEqual(1);
      expect(cur.v).toBeGreaterThanOrEqual(prev.v);
      expect(cur.d).toBeGreaterThanOrEqual(prev.d);
      expect(cur.e).toBeGreaterThanOrEqual(prev.e);
      expect(cur.mio).toBeGreaterThanOrEqual(prev.mio);
      expect(cur.m).toBeLessThanOrEqual(cur.v);
      prev = cur;
    }
  });
  it('each landing is at the instant the spec gives: evenly spread over the match window, in the same order as the data', () => {
    for (let k = 1; k < n; k++) {
      const delta = counts[k] - counts[k - 1];
      for (let j = 0; j < delta; j++) {
        const when = from + ((j + 0.5) * (to - from)) / delta;
        expect(matchesAt(at(k, when - 1), counts)).toBe(counts[k - 1] + j);
        expect(matchesAt(at(k, when + 1), counts)).toBe(counts[k - 1] + j + 1);
      }
    }
  });
  it('the cells of the new records are all in by the end of the 400 ms window, the first one at the start', () => {
    for (let k = 1; k < n; k++) {
      expect(visibleCells(at(k, 0), d.x.values)).toBe(d.x.values[k - 1] + 1);
      expect(visibleCells(at(k, 400), d.x.values)).toBe(d.x.values[k]);
    }
  });
});

describe('the euro outcome on the screen', () => {
  const d = real();
  const euro = d.euro!;
  const last = d.x.values.length - 1;
  const drop = euro.drop_pts[last];
  const amount = formatEuro(euro.drop_mio_eur[last]);
  const done = sim(d);

  it('formatter: under a million in euros, then millions, then billions with one decimal; per inhabitant and the total as written', () => {
    expect(formatEuro(0)).toBe('€0');
    expect(formatEuro(0.25)).toBe('€250,000');
    expect(formatEuro(147.04)).toBe('€147 million');
    expect(formatEuro(2500)).toBe('€2.5 billion');
    expect(formatEuro(999.6)).toBe('€1.0 billion');
    expect(formatPerInhabitant(30.15)).toBe('€30');
    expect(formatTotal(euro.total_mio_eur)).toBe(`€${Math.round(euro.total_mio_eur / 1e3).toLocaleString('en-US')} billion`);
    expect(formatPct(0.1)).toBe('10%');
    expect(formatPct(0.115)).toBe('11.5%');
    expect(formatPct(0.2)).toBe('20%');
  });
  it('the figure on screen is the last euro value of the file, written the way Anna writes it', () => {
    expect(text(done, 'sim-euro-figure')).toBe(amount);
    expect(amount).toMatch(/^€\d[\d,.]* (million|billion)$|^€[\d,]+$/);
    expect(text(done, 'sim-euro-hab')).toBe(`${formatPerInhabitant(euro.drop_eur_per_inhabitant[last])} per inhabitant a year`);
  });
  it('the sentence, the formula and the source line use the data and the written templates, with the link from the file', () => {
    expect(text(done, 'sim-euro-outcome')).toBe(
      `In this model, the cost of wrong or missed diagnoses is ${amount} a year lower for ${euro.geography}, on ${euro.year} spending.`,
    );
    expect(text(done, 'sim-euro-formula')).toBe(
      `${drop.toFixed(2)} points of health spending × ${formatTotal(euro.total_mio_eur)} (${euro.geography}, ${euro.year}) = ${amount} a year`,
    );
    expect(text(done, 'sim-euro-source')).toBe(`Health spending total: Eurostat, current health expenditure, ${euro.geography}, ${euro.year}.`);
    expect(done).toContain(`href="${euro.source.url}"`);
    expect(text(done, 'sim-matches')).toContain(`Matches so far: ${d.matches!.count[last]}`);
    expect(text(done, 'sim-effect')).toBe(`Assumed effect of a match: ${formatPct(d.assumption.effect![last])}`);
  });
  it('the assumption line is on the hero and on chart 2 and chart 3, not on chart 1', () => {
    const line = `Assumption, not a finding: each match lowers the chance of a wrong or missed diagnosis by ${formatPct(d.assumption.start)}, rising to ${formatPct(d.assumption.ceiling)} as matches accumulate.`;
    for (const id of ['sim-assumption', 'sim-assumption-2', 'sim-assumption-3']) expect(text(done, id)).toBe(line);
    expect(done).not.toContain('sim-assumption-1');
    expect(done.match(/data-testid="sim-assumption"/g)).toHaveLength(1);
  });
  it('words: every euro sentence says model or assumption; nothing says saved, savings or will', () => {
    for (const s of [text(done, 'sim-euro-outcome'), text(done, 'sim-assumption'), COPY.simKicker]) expect(s).toMatch(/model|Modelled|assum/i);
    expect(words(done)).not.toMatch(/sav(e|ed|es|ings)|\bwill\b|anonym|!/i);
  });
  it('series 3 axis and series 2 axis start at zero in the rendered SVG', () => {
    for (const id of [1, 2, 3]) {
      const chart = done.split(`data-testid="sim-series-${id}"`)[1].split('</figure>')[0];
      const axes = [...chart.matchAll(/<line class="axis" x1="([\d.]+)" x2="([\d.]+)" y1="([\d.]+)" y2="([\d.]+)"/g)].map((m) => m.slice(1).map(Number));
      const vertical = axes.find((a) => a[0] === a[1])!;
      const horizontal = axes.find((a) => a[2] === a[3])!;
      expect(horizontal[2], `chart ${id}`).toBe(vertical[3]); // the x axis sits at the bottom of the y axis: the domain starts at 0
      expect(chart).toMatch(/text-anchor="end">0<\/text>/);
    }
  });
  it('label, assumption and sources are in the DOM at the start, mid-play and the end; the screen is "playing" until the last frame', () => {
    for (const t of [0, 400, 5000, 15000, 29200, 29999, 30000]) {
      const out = simAt(d, t);
      expect(out, `t=${t}`).toContain('Simulation on synthetic data. A model, not a measurement');
      expect(out, `t=${t}`).toContain('data-testid="sim-assumption"');
      expect(out, `t=${t}`).toContain('data-testid="sim-assumption-2"');
      expect(out, `t=${t}`).toContain('data-testid="sim-assumption-3"');
      expect(out, `t=${t}`).toContain('data-testid="sim-sources"');
      expect(out, `t=${t}`).toContain(`href="${euro.source.url}"`);
      expect(out, `t=${t}`).toContain(`data-state="${t >= 30000 ? 'done' : 'playing'}"`);
    }
  });
  it('the baselines and the delta labels exist from the landing on, not before; the card edge turns at the landing', () => {
    expect(simAt(d, 29199)).not.toContain('sim-baseline-3');
    expect(simAt(d, 29199)).toContain('data-landed="false"');
    expect(simAt(d, 29200)).toContain('sim-baseline-3');
    expect(simAt(d, 29200)).toContain('data-landed="true"');
    const s3 = d.series.find((s) => s.id === 3)!;
    expect(text(simAt(d, 30000), 'sim-delta-3')).toBe(`−${Math.abs(s3.values[last] - s3.values[0]).toFixed(decimalsOf(s3.values))}`);
    expect(simAt(d, 30000)).not.toContain('sim-baseline-1');
  });
  it('the start frame: 0 euros, no matches yet, the cells of the first step', () => {
    const start = simAt(d, 0);
    expect(text(start, 'sim-euro-figure')).toBe('€0');
    expect(text(start, 'sim-matches')).toContain(`Matches so far: ${d.matches!.count[0]}`);
    expect(start.match(/<i( class="on")?\/?>/g)).toHaveLength(d.x.values[last]);
    expect(start.match(/<i class="on"/g)).toHaveLength(d.x.values[0]);
    expect(start).not.toContain('class="on m"');
  });
  it('reduced motion: the outcome frame at once, all cells, all matches, the figure included, no replay', () => {
    expect(done).toContain('data-state="done"');
    expect(done.match(/<i class="on m"/g)).toHaveLength(d.matches!.count[last]);
    expect(done.match(/<i class="on"/g)?.length ?? 0).toBe(d.x.values[last] - d.matches!.count[last]);
    expect(done).not.toContain('sim-replay');
    expect(done).toContain('data-landed="true"');
  });
  it('the figure is never on screen without series 3 and never as a placeholder', () => {
    const noSeries3 = { ...d, series: d.series.filter((s) => s.id !== 3) };
    expect(sim(noSeries3)).not.toContain('sim-euro');
    const raw = clone(); delete raw.euro;
    const p = parseSimulation(raw);
    if (!p.ok) throw new Error('refused');
    const out = sim(p.data);
    expect(out).not.toContain('sim-euro');
    expect(out).not.toContain('€');
    expect(out).toContain('sim-hero'); // the field and the counters still play
    for (const id of [1, 2, 3]) expect(out).toContain(`sim-series-${id}`);
    expect(out).toContain('data-testid="sim-assumption"');
    expect(words(out)).not.toMatch(/NaN|undefined|--|n\/a/i);
  });
  it('without the match counts there is no field and no counters, and the count is never worked out from series 1', () => {
    const raw = clone(); delete raw.matches;
    const p = parseSimulation(raw);
    if (!p.ok) throw new Error('refused');
    const out = sim(p.data);
    expect(out).not.toContain('sim-field');
    expect(out).not.toContain('sim-matches');
    expect(out).not.toContain('sim-effect');
    expect(out).toContain('sim-euro');
  });
  it('data error: the permanent label and one alert, no hero, no charts, no figure', () => {
    const out = renderToStaticMarkup(createElement(SimulationUnavailable));
    expect(out).toContain('Simulation on synthetic data. A model, not a measurement');
    expect(out).toContain('role="alert"');
    expect(out).toContain('The simulation data could not be read.');
    expect(out).not.toMatch(/sim-hero|sim-series|sim-euro|€/);
    const noStart = clone(); delete noStart.assumption.start;
    expect(parseSimulation(noStart).ok).toBe(false);
  });
  it('no euro value, total or year of the file is typed anywhere in the matches folder, tests included', () => {
    const forbidden = [
      String(euro.total_mio_eur), String(euro.total_eur_per_inhabitant), String(euro.year), String(Math.round(euro.total_mio_eur / 1e3)),
      formatEuro(euro.drop_mio_eur[last]).replace(/^€/, '').replace(/ .*/, ''), euro.drop_pts[last].toFixed(2), String(euro.drop_mio_eur[last]),
    ];
    for (const f of readdirSync(__dirname)) {
      const src = readFileSync(join(__dirname, f), 'utf8');
      for (const v of forbidden) expect(src, `${f} contains ${v}`).not.toContain(v);
    }
  });
});
