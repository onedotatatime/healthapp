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
import { SimTimeline } from './SimTimeline';
import {
  TL_DASH, TL_KEY_GAP, buildLanes, firstMonthAbove, formatValue, labelledMonths, laneGeometry, pilotBand, placeKeys,
} from './timeline';
import { BUILD_CHUNK, DOT_R, FIELD_NARROW_MAX, FIELD_PITCH, TICK_EVERY, fieldGeometry, labelledTicks, pitchFor, rangeRects } from './field';
import {
  SIM_GROW_MS, SIM_LANDING_MS, SIM_LAND_FADE_MS, clockAt, decimalsOf, effectIndex, formatCount, formatEuro, formatPct, formatPerInhabitant, formatTotal, hasDropped, matchesAt, niceAxis, parseSimulation,
  TL_MONTHS, dropFromInputs, formatEuroCents, formatEuroK, formatEuroTick, formatEuroWhole, parseTimeline, type SimEuro, type SimTimeline as SimTimelineData,
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
    // A copy function takes numbers (matchTotal) or one object of values (simFieldLabel, simAssumption): try the first, then a catch-all object.
    const call = (f: (...a: unknown[]) => string) => {
      try { return f(1, 1); } catch { return f({ matched: 1, visible: 1, start: '1', ceiling: '1', amount: '1', geography: '1', year: 1, drop: '1', total: '1' }); }
    };
    const all = JSON.stringify(Object.values(COPY).map((v) => (typeof v === 'function' ? call(v as (...a: unknown[]) => string) : v)));
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
  it('counters never go down: the matches grow in hundreds per step, the dots only appear, the drop only grows', () => {
    let prev = { m: -1, v: -1, d: -1, e: -1, mio: -1 };
    for (let t = 0; t <= simDuration(n); t += 7) {
      const f = clockAt(t, n);
      const cur = {
        m: matchesAt(f, counts), v: visibleCells(f, d.x.values), d: shownDrop(euro.drop_pts, f.idx),
        e: effect[effectIndex(f)], mio: (shownDrop(euro.drop_pts, f.idx) / 100) * euro.total_mio_eur,
      };
      expect(cur.m).toBeGreaterThanOrEqual(prev.m);
      expect(cur.v).toBeGreaterThanOrEqual(prev.v);
      expect(cur.d).toBeGreaterThanOrEqual(prev.d);
      expect(cur.e).toBeGreaterThanOrEqual(prev.e);
      expect(cur.mio).toBeGreaterThanOrEqual(prev.mio);
      expect(cur.m).toBeLessThanOrEqual(cur.v); // a matched dot is a visible dot
      prev = cur;
    }
  });
  it('the matches of a step are M(i-1) + floor(DeltaM x g), g the same linear progress as the values (spec A12, step 3)', () => {
    for (let k = 1; k < n; k++) {
      const delta = counts[k] - counts[k - 1];
      for (const tau of [0, from - 1, from, from + 1, (from + to) / 2, to - 1, to, to + 1, SIM_STEP_MS - 1]) {
        const f = at(k, tau);
        const g = Math.min(Math.max((tau - from) / (to - from), 0), 1);
        expect(matchesAt(f, counts), `step ${k} tau ${tau}`).toBe(counts[k - 1] + Math.floor(delta * g));
        expect(f.g).toBeCloseTo(g);
      }
      expect(matchesAt(at(k, from), counts)).toBe(counts[k - 1]);
      expect(matchesAt(at(k, to), counts)).toBe(counts[k]);
    }
  });
  it('the moving front: the matched count SIM_LAND_FADE_MS ago is never ahead, and lags by at most the dots that land in that time', () => {
    expect(SIM_LAND_FADE_MS).toBe(160);
    for (let k = 1; k < n; k++) {
      const delta = counts[k] - counts[k - 1];
      const maxFront = Math.ceil((delta * SIM_LAND_FADE_MS) / (to - from)) + 1;
      for (let tau = 0; tau < SIM_STEP_MS; tau += 11) {
        const f = at(k, tau);
        const now = matchesAt(f, counts), tail = matchesAt(f, counts, SIM_LAND_FADE_MS);
        expect(tail, `step ${k} tau ${tau}`).toBeLessThanOrEqual(now);
        expect(now - tail, `step ${k} tau ${tau}`).toBeLessThanOrEqual(maxFront);
        expect(tail).toBeGreaterThanOrEqual(counts[k - 1]);
      }
      // 160 ms after the last landing nothing is left of the front
      expect(matchesAt(at(k, to + SIM_LAND_FADE_MS), counts, SIM_LAND_FADE_MS)).toBe(counts[k]);
      expect(matchesAt(at(k, from + 10), counts, SIM_LAND_FADE_MS)).toBe(counts[k - 1]);
    }
    // design for DeltaM up to 1,000 per interval: the front is then 100 dots at most
    expect(Math.ceil((1000 * SIM_LAND_FADE_MS) / (to - from)) + 1).toBeLessThanOrEqual(100);
  });
  it('the new records appear as one sweep in reading order over the first 400 ms: the previous count at 0, the data at 400, never ahead of it', () => {
    for (let k = 1; k < n; k++) {
      const xs = d.x.values;
      expect(visibleCells(at(k, 0), xs)).toBe(xs[k - 1]);
      expect(visibleCells(at(k, SIM_GROW_MS / 2), xs)).toBeGreaterThan(xs[k - 1]);
      expect(visibleCells(at(k, SIM_GROW_MS / 2), xs)).toBeLessThan(xs[k]);
      expect(visibleCells(at(k, SIM_GROW_MS), xs)).toBe(xs[k]);
      expect(visibleCells(at(k, SIM_STEP_MS - 1), xs)).toBe(xs[k]);
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
    expect(text(done, 'sim-matches')).toContain(`Matches so far: ${formatCount(d.matches!.count[last])}`);
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
  it('the start frame: the first step of the data, the field at its first count, nothing worked out', () => {
    const start = simAt(d, 0);
    expect(text(start, 'sim-euro-figure')).toBe(formatEuro(euro.drop_mio_eur[0]));
    expect(text(start, 'sim-matches')).toContain(`Matches so far: ${formatCount(d.matches!.count[0])}`);
    expect(text(start, 'sim-x-hero')).toContain(formatCount(d.x.values[0]));
    expect(start).toContain(`data-visible="${d.x.values[0]}"`);
    expect(start).toContain(`data-matched="${d.matches!.count[0]}"`);
  });
  it('the field is one canvas with the figures of the data: no DOM per dot, aria-label and caption in Anna\'s words, data-* at step edges', () => {
    const f0 = done.split('data-testid="sim-field"')[1].split('data-testid="sim-field-caption"')[0];
    expect(f0.match(/<canvas/g)).toHaveLength(1);
    expect(f0).not.toMatch(/<i[ >]/);
    expect(done.match(/<canvas/g)).toHaveLength(1);
    expect(f0).toContain('role="img"');
    const total = d.x.values[last], matched = d.matches!.count[last];
    expect(f0).toContain(`aria-label="${COPY.simFieldLabel({ matched, visible: total })}"`);
    expect(COPY.simFieldLabel({ matched, visible: total })).toMatch(/synthetic/);
    expect(done).toContain(`data-visible="${total}"`);
    expect(done).toContain(`data-matched="${matched}"`);
    expect(text(done, 'sim-field-caption')).toBe(COPY.simFieldCaption);
    // the caption is outside the element that animates opacity
    expect(done).toMatch(/<\/div><p class="sim-field-caption"/);
  });
  it('mid-step the figures about the field stay at the last step edge: only the dots and the counter move', () => {
    const k = 4;
    const t = SIM_ENTRY_MS + (k - 1) * SIM_STEP_MS;
    const early = simAt(d, t + 100), late = simAt(d, t + 1000), edge = simAt(d, t + SIM_STEP_MS - 1);
    for (const out of [early, late]) {
      expect(out).toContain(`data-visible="${d.x.values[k - 1]}"`);
      expect(out).toContain(`data-matched="${d.matches!.count[k - 1]}"`);
    }
    expect(edge).toContain(`data-visible="${d.x.values[k]}"`);
    expect(edge).toContain(`data-matched="${d.matches!.count[k]}"`);
  });
  it('reduced motion: the outcome frame at once, the field at all records and all matches, the figure included, no replay', () => {
    expect(done).toContain('data-state="done"');
    expect(done).toContain(`data-visible="${d.x.values[last]}"`);
    expect(done).toContain(`data-matched="${d.matches!.count[last]}"`);
    expect(done).not.toContain('sim-replay');
    expect(done).toContain('data-landed="true"');
  });
  it('the axis: a tick at every one of the data\'s values, a label at every third, ending on the last, written with the thousands comma', () => {
    const xs = d.x.values;
    expect(TICK_EVERY).toBe(3);
    expect(labelledTicks(xs.length)).toEqual([2, 5, 8, 11]);
    expect(labelledTicks(xs.length).map((i) => formatCount(xs[i]))).toEqual(['1,250', '2,500', '3,750', '5,000']);
    for (const id of [1, 2, 3]) {
      const chart = done.split(`data-testid="sim-series-${id}"`)[1].split('</figure>')[0];
      expect(chart.match(/class="tick"/g)).toHaveLength(xs.length);
      const labels = [...chart.matchAll(/data-testid="sim-tick-label">([^<]*)</g)].map((m) => m[1]);
      expect(labels).toEqual(labelledTicks(xs.length).map((i) => formatCount(xs[i])));
    }
  });
  it('the figure is never on screen without series 3 and never as a placeholder', () => {
    const noSeries3 = { ...d, series: d.series.filter((s) => s.id !== 3) };
    expect(sim(noSeries3)).not.toContain('sim-euro');
    const raw = clone(); delete raw.euro;
    const p = parseSimulation(raw);
    if (!p.ok) throw new Error('refused');
    const out = sim({ ...p.data, timeline: undefined }); // the timeline card states its own euro figures; this test is about the hero's
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

describe('the match field geometry (spec A12)', () => {
  it('the pitch is 3 px at 480 px and below, 5 px above', () => {
    expect(FIELD_PITCH).toEqual({ narrow: 3, wide: 5 });
    expect(FIELD_NARROW_MAX).toBe(480);
    expect([320, 390, 480].map(pitchFor)).toEqual([3, 3, 3]);
    expect([481, 768, 1280, 1440].map(pitchFor)).toEqual([5, 5, 5, 5]);
    expect(DOT_R.on).toBeGreaterThan(DOT_R.off);
  });
  it('sizes at the widths of the spec: 390, 768, 1280, 1440, from the records of the data', () => {
    const total = real().x.values.at(-1)!;
    expect(total).toBe(5000);
    const g = (w: number, vw: number) => fieldGeometry(w, total, pitchFor(vw));
    expect(g(326, 390)).toMatchObject({ cols: 108, rows: 47, height: 141 });
    expect(g(704, 768)).toMatchObject({ cols: 140, rows: 36, height: 180 });
    expect(g(593, 1280)).toMatchObject({ cols: 118, rows: 43, height: 215 });
    expect(g(628, 1440)).toMatchObject({ cols: 125, rows: 40, height: 200 });
    for (const w of [200, 326, 593, 900]) expect(g(w, 1280).cols * g(w, 1280).rows).toBeGreaterThanOrEqual(total);
  });
  it('a block of dots in reading order is at most three rectangles and covers exactly its dots', () => {
    for (const cols of [7, 108, 118]) {
      for (const [from, to] of [[0, 0], [0, 1], [0, cols], [3, cols + 2], [cols, 3 * cols], [5, 3 * cols + 4], [2, 2 * cols - 1], [0, 5 * cols + 3]]) {
        const rects = rangeRects(from, to, cols);
        expect(rects.length).toBeLessThanOrEqual(3);
        const cells = new Set<number>();
        for (const q of rects) for (let r = q.r0; r < q.r1; r++) for (let c = q.c0; c < q.c1; c++) {
          expect(cells.has(r * cols + c), `cell twice (${from}, ${to}, ${cols})`).toBe(false);
          cells.add(r * cols + c);
        }
        expect([...cells].sort((a, b) => a - b)).toEqual(Array.from({ length: Math.max(0, to - from) }, (_, i) => from + i));
      }
    }
  });
  it('the layers are built in chunks small enough to be no long task', () => {
    expect(BUILD_CHUNK).toBeLessThanOrEqual(1000);
    expect(Math.ceil(5000 / BUILD_CHUNK)).toBeGreaterThanOrEqual(5);
  });
  it('no 1,200-era figure is left in the simulation code or its fixtures', () => {
    for (const f of readdirSync(__dirname)) {
      if (f.endsWith('.test.ts')) continue;
      expect(readFileSync(join(__dirname, f), 'utf8'), f).not.toMatch(/\b(1,200|1200|473)\b/);
    }
  });
});

// ---------------------------------------------------------------------------------------------------------------------------
// The timeline diagram (MIN-4702; spec A13; contract MIN-4699 as the CEO seat's decision on MIN-4698 changed it). The fixture below is a
// TEST-ONLY copy of a local generator run (`simulate.py --ramp per_case_only --diagnoses --drop-method year_at_network_size`, Cron, MIN-4701).
// Synthetic records and a plan. It is not the committed file; a test at the end reads the committed file if it has the block.
// ---------------------------------------------------------------------------------------------------------------------------
const TLX = {
  patients: [0, 0, 0, 0, 0, 0, 0, 0, 24, 71, 143, 238, 357, 500, 643, 806, 988, 1189, 1410, 1651, 1910, 2189, 2488, 2806],
  matches: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 28, 78, 143, 222, 286, 374, 460, 563, 657, 761, 876, 1005, 1137],
  income: [0, 0, 0, 0, 0, 0, 0, 0, 14857, 29714, 44571, 59429, 74286, 89143, 103121, 117099, 131077, 145055, 159033, 173011, 186989, 200967, 214945, 228923],
  dropPts: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.03, 0.14, 0.28, 0.38, 0.47, 0.49, 0.55, 0.58, 0.62, 0.64, 0.67, 0.7, 0.73, 0.77],
  drop: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 175, 1358, 4073, 7742, 12315, 16093, 22143, 28101, 35623, 43057, 52146, 62439, 74010, 88043],
  dx: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.2, 0.5, 0.9, 1.4, 1.8, 2.5, 3.1, 3.9, 4.8, 5.7, 7.0, 8.2, 9.8],
};
/** The spending base is read from the committed euro block, never typed (a guard above forbids the value anywhere in this folder). */
const PER = (simulationJson as { euro: { total_eur_per_inhabitant: number } }).euro.total_eur_per_inhabitant;
const EURO = (simulationJson as unknown as { euro: SimEuro }).euro;
/** The hero's own figure, worked out from the file the way the screen does it (never typed). */
const TIE = { amount: formatEuro((shownDrop(EURO.drop_pts, EURO.drop_pts.length - 1) / 100) * EURO.total_mio_eur), geography: EURO.geography };
const MONTHS = Array.from({ length: 24 }, (_, i) => i + 1);
const CEO = "CEO on the founder's behalf, MIN-4698, 2026-11-15";
const tlRaw = () => ({
  label: 'Plan months on synthetic records. A plan and a model, not a measurement',
  x: { unit: 'plan month', values: MONTHS },
  plan: { name: 'Pathien funding model v4, conservative line', status: 'a plan, not a measurement (CEO seat, MIN-4503)', price_eur_per_case: 40 },
  patients: { unit: 'patients in the network, running total', ramp: 'per_case_only', values: TLX.patients },
  income_eur: { unit: 'EUR, running total, plan', values: TLX.income },
  matches: { definition: 'opted-in records with at least one match', network: TLX.patients, count: TLX.matches },
  income_run_rate_eur: { unit: "EUR a year, the plan's run rate at that month", status: 'a plan, not a measurement (CEO seat, MIN-4503)', values: TLX.income },
  diagnoses: { unit: "fewer wrong or missed diagnoses a year at that month's network size, in the model", status: CEO, method: 'year_at_network_size', assumption: 'one visit per patient a year', values: TLX.dx },
  drop_eur: {
    unit: 'EUR a year, modelled drop in cost for the patients in the network at that month', status: CEO, method: 'year_at_network_size',
    per_inhabitant_eur: PER, drop_pts: TLX.dropPts, values: TLX.drop,
  },
});
const tl = (mutate?: (r: ReturnType<typeof tlRaw>) => void): SimTimelineData => {
  const r = tlRaw();
  mutate?.(r);
  const t = parseTimeline(r);
  if (!t) throw new Error('the fixture did not parse');
  return t;
};
const CURVE = 'Assumption, not a finding: each match lowers the chance of a wrong or missed diagnosis by 10%, rising to 20% as matches accumulate.';
const card = (t: SimTimelineData, layout = { wide: true, width: 818 }, tie?: { amount: string; geography: string }) =>
  renderToStaticMarkup(createElement(SimTimeline, { timeline: t, curve: CURVE, layout, tie }));
/** textContent of the first element carrying this test id (any tag). */
const byId = (markup: string, id: string) => {
  const m = markup.match(new RegExp(`data-testid="${id}"[^>]*>([\\s\\S]*?)</(?:p|span|div|text|caption)>`));
  return m ? m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim() : null;
};
/** The points of a plotted line as [x, y] pairs, read from the markup. */
const linePoints = (markup: string, id: string): [number, number][] => {
  const m = markup.match(new RegExp(`<path[^>]*d="([^"]+)"[^>]*data-line="${id}"`));
  if (!m) throw new Error(`no line ${id}`);
  return m[1].split(/(?=[ML])/).map((c) => c.slice(1).trim().split(' ').map(Number) as [number, number]);
};
const rest = (data: SimulationData) => sim({ ...data, timeline: undefined });

describe('the timeline block parser (MIN-4702)', () => {
  it('reads the generator-shaped block: 24 plan months, three required measures, both optional ones', () => {
    const t = tl();
    expect(t.x).toEqual(MONTHS);
    expect(t.patients.values).toEqual(TLX.patients);
    expect(t.matches.values).toEqual(TLX.matches);
    expect(t.income.values).toEqual(TLX.income);
    expect(t.drop?.values).toEqual(TLX.drop);
    expect(t.diagnoses?.values).toEqual(TLX.dx);
    expect(t.plan.priceEurPerCase).toBe(40);
  });
  it('an invalid or missing block gives no timeline, and parseSimulation leaves everything else as it was', () => {
    const broken: [string, (r: ReturnType<typeof tlRaw>) => void][] = [
      ['x is not months 1 to 24', (r) => { r.x.values = MONTHS.map((m) => m + 1); }],
      ['x has 23 values', (r) => { r.x.values = MONTHS.slice(1); }],
      ['patients has 23 values', (r) => { r.patients.values = TLX.patients.slice(1); }],
      ['income has a negative value', (r) => { r.income_run_rate_eur.values = TLX.income.map((v, i) => (i === 3 ? -1 : v)); }],
      ['patients, a running total, falls', (r) => { r.patients.values = TLX.patients.map((v, i) => (i === 20 ? 5 : v)); }],
      ['matches, a running total, falls', (r) => { r.matches.count = TLX.matches.map((v, i) => (i === 20 ? 5 : v)); }],
      ['the ramp is not the per-case one the assumption line describes', (r) => { r.patients.ramp = 'all_revenue'; }],
      ['the plan has no price', (r) => { (r.plan as { price_eur_per_case?: number }).price_eur_per_case = undefined; }],
      ['income is a running total, not a yearly rate', (r) => { r.income_run_rate_eur.unit = 'EUR, running total, plan'; }],
      ['there is no free pilot (a patient in month 1)', (r) => { r.patients.values = TLX.patients.map((v) => v + 1); }],
    ];
    for (const [why, mutate] of broken) expect(parseTimeline((() => { const r = tlRaw(); mutate(r); return r; })()), why).toBeUndefined();
    expect(parseTimeline(undefined)).toBeUndefined();
    expect(parseTimeline('timeline')).toBeUndefined();
    expect(parseTimeline({})).toBeUndefined();
    // the three small charts, the hero and everything else parse identically with a missing or a broken block
    const none = clone(); delete none.timeline;
    const bad = clone(); bad.timeline = { x: 'nope' };
    const good = clone(); good.timeline = tlRaw();
    const parsed = (raw: unknown) => { const p = parseSimulation(raw); if (!p.ok) throw new Error('refused'); return p.data; };
    expect(parsed(none).timeline).toBeUndefined();
    expect(parsed(bad).timeline).toBeUndefined();
    expect(parsed(good).timeline).toBeDefined();
    expect(sim(parsed(bad))).toBe(sim(parsed(none)));
    expect(sim(parsed(none))).not.toContain('sim-timeline');
    expect({ ...parsed(good), timeline: undefined }).toEqual({ ...parsed(none), timeline: undefined });
  });
  it('an invalid optional measure leaves only its own line out', () => {
    const cases: [string, (r: ReturnType<typeof tlRaw>) => void, 'dx' | 'drop'][] = [
      ['diagnoses has 3 values', (r) => { r.diagnoses.values = [1, 2, 3]; }, 'dx'],
      ['diagnoses has no status', (r) => { r.diagnoses.status = ''; }, 'dx'],
      ['diagnoses has no stated assumption', (r) => { r.diagnoses.assumption = ''; }, 'dx'],
      ['diagnoses is a running total, not a yearly figure', (r) => { r.diagnoses.unit = 'diagnoses avoided, running total'; }, 'dx'],
      ['drop has a negative value', (r) => { r.drop_eur.values = TLX.drop.map((v, i) => (i === 2 ? -3 : v)); }, 'drop'],
      ['drop has no status', (r) => { r.drop_eur.status = ''; }, 'drop'],
      ['drop is on a running-total basis while income is a yearly rate (two bases, one axis)', (r) => { r.drop_eur.unit = 'EUR, running total, modelled drop'; }, 'drop'],
      ['drop has no base for its formula line', (r) => { (r.drop_eur as { per_inhabitant_eur?: number }).per_inhabitant_eur = undefined; }, 'drop'],
      ['drop formula does not give the figure at the precision shown', (r) => { r.drop_eur.drop_pts = TLX.dropPts.map((v, i) => (i === 23 ? 0.9 : v)); }, 'drop'],
    ];
    for (const [why, mutate, which] of cases) {
      const t = tl(mutate);
      expect(t.patients.values, why).toEqual(TLX.patients);
      if (which === 'dx') { expect(t.diagnoses, why).toBeUndefined(); expect(t.drop, why).toBeDefined(); }
      else { expect(t.drop, why).toBeUndefined(); expect(t.diagnoses, why).toBeDefined(); }
    }
    const none = tl((r) => { delete (r as { diagnoses?: unknown }).diagnoses; delete (r as { drop_eur?: unknown }).drop_eur; });
    expect(none.drop).toBeUndefined();
    expect(none.diagnoses).toBeUndefined();
  });
  it('the formula line gives its own figure at the precision shown, in every month of the file', () => {
    // points / 100 x the base x the patients, half-up to the euro, is the file's value (Python: floor(x + 0.5))
    for (let i = 0; i < 24; i++) {
      expect(Math.abs(dropFromInputs(TLX.dropPts[i], PER, TLX.patients[i]) - TLX.drop[i]), `month ${i + 1}`).toBeLessThanOrEqual(0.5);
    }
    expect(dropFromInputs(0.77, PER, 2806)).toBeCloseTo(88042.7, 1);
    expect(formatEuroCents((0.77 / 100) * PER)).toBe('€31.38');
    expect(formatEuroCents(PER)).toBe(`€${PER.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  });
});

describe('the timeline formatters mirror the arithmetic at the precision shown', () => {
  it('euros: whole thousands for the key, whole euros for the table, ticks never rounded up to a wrong figure', () => {
    expect(formatEuroK(228923)).toBe('€229k');
    expect(formatEuroK(88043)).toBe('€88k');
    expect(formatEuroK(164352)).toBe('€164k');
    expect(formatEuroK(61825)).toBe('€62k');
    expect(formatEuroK(500)).toBe('€500');
    expect(formatEuroK(999500)).toBe('€1m');
    expect(formatEuroWhole(228923)).toBe('€228,923');
    expect(formatEuroTick(0)).toBe('€0');
    expect(formatEuroTick(2500)).toBe('€2.5k');
    expect(formatEuroTick(100000)).toBe('€100k');
  });
  it('a value prints as the data prints it', () => {
    const lanes = buildLanes(tl());
    const find = (id: string) => lanes.flatMap((l) => l.measures).find((m) => m.id === id)!;
    expect(formatValue(find('patients'), 2806, 'key')).toBe('2,806');
    expect(formatValue(find('dx'), 9.8, 'key')).toBe('9.8');
    expect(formatValue(find('dx'), 7, 'exact')).toBe('7.0');
    expect(formatValue(find('drop'), 88043, 'exact')).toBe('€88,043');
  });
});

describe('the timeline geometry: every axis from zero, one linear y per lane, no second axis', () => {
  const t = tl();
  const lanes = buildLanes(t);
  it('three lanes in the fixed order; a lane with no measure is absent', () => {
    expect(lanes.map((l) => l.id)).toEqual(['people', 'euro', 'dx']);
    expect(buildLanes(tl((r) => { delete (r as { diagnoses?: unknown }).diagnoses; })).map((l) => l.id)).toEqual(['people', 'euro']);
    expect(buildLanes(tl((r) => { delete (r as { drop_eur?: unknown }).drop_eur; })).find((l) => l.id === 'euro')!.measures.map((m) => m.id)).toEqual(['income']);
  });
  for (const layout of [{ wide: true, width: 786 }, { wide: false, width: 324 }]) {
    it(`${layout.wide ? 'wide' : 'narrow'}: the bottom tick is 0 at the plot's bottom, the top tick is at or above the lane's maximum`, () => {
      lanes.forEach((lane, i) => {
        const g = laneGeometry(lane, layout, t.x, i === lanes.length - 1);
        const max = Math.max(...lane.measures.flatMap((m) => m.values));
        expect(g.axis.ticks[0]).toBe(0);
        expect(g.y(0)).toBeCloseTo(g.bottom, 9);
        expect(g.axis.ticks.at(-1)).toBe(g.axis.top);
        expect(g.axis.top).toBeGreaterThanOrEqual(max);
        expect(g.y(g.axis.top)).toBeCloseTo(g.T, 9);
      });
    });
    it(`${layout.wide ? 'wide' : 'narrow'}: all 24 points of every line are a linear function of the value alone, and invert to the data`, () => {
      const html = card(t, layout);
      lanes.forEach((lane, i) => {
        const g = laneGeometry(lane, layout, t.x, i === lanes.length - 1);
        for (const m of lane.measures) {
          const pts = linePoints(html, m.id);
          expect(pts).toHaveLength(24);
          pts.forEach(([px, py], k) => {
            expect(Math.abs(px - g.x(t.x[k])), `${m.id} x ${k}`).toBeLessThanOrEqual(0.05);
            const back = g.axis.top * (1 - (py - g.T) / g.plotH);
            expect(Math.abs(back - m.values[k]), `${m.id} month ${k + 1}`).toBeLessThanOrEqual((0.05 / g.plotH) * g.axis.top + 1e-9);
          });
        }
        // one y axis per lane: exactly one set of tick labels, one vertical axis line
        const svg = html.split('data-testid="sim-tl-plot-' + lane.id + '"')[1].split('</svg>')[0];
        expect((svg.match(/data-testid="sim-tl-ytick"/g) ?? []).length).toBe(g.axis.ticks.length);
        expect((svg.match(/<line class="axis" x1="(\d+)" x2="\1"/g) ?? []).length).toBe(1);
      });
    });
  }
  it('the month labels: every third month ending on the last; wide only on the last lane, narrow on every lane', () => {
    expect(labelledMonths(t.x)).toEqual([3, 6, 9, 12, 15, 18, 21, 24]);
    const count = (html: string) => (html.match(/data-testid="sim-tl-month"/g) ?? []).length;
    expect(count(card(t, { wide: true, width: 786 }))).toBe(8);
    expect(count(card(t, { wide: false, width: 324 }))).toBe(24);
  });
  it('the free pilot and the first paid month come from the data', () => {
    expect(pilotBand(TLX.patients, MONTHS)).toEqual({ from: 3, to: 8, firstPaid: 9 });
    expect(pilotBand(TLX.patients.map((v, i) => (i < 11 ? 0 : v + 1)), MONTHS)).toEqual({ from: 3, to: 11, firstPaid: 12 });
    expect(pilotBand(new Array(24).fill(0), MONTHS)).toBeNull();
    expect(firstMonthAbove(TLX.matches, MONTHS)).toBe(11);
    const g = laneGeometry(lanes[0], { wide: true, width: 786 }, t.x, false);
    // the band spans month cells 3 to 8 (x(2.5) to x(8.5)) and the first-paid line sits at x(9), in the markup
    const html = card(t, { wide: true, width: 786 });
    expect(g.x(8.5) - g.x(2.5)).toBeCloseTo(6 * ((786 - 44 - 12) / 23), 6);
    expect(html).toContain(`<rect class="band" x="${g.x(2.5)}"`);
    expect(html).toContain(`<line class="first" x1="${g.x(9)}" x2="${g.x(9)}"`);
  });
  it('keys in the wide column: none overlaps another, each starts near its tip, the stack stays in the lane', () => {
    expect(placeKeys([77, 157], [70, 70], TL_KEY_GAP, 214)).toEqual([37, 117]);
    // two keys of 90 px that would end below the lane are pulled up together, still 8 px apart
    expect(placeKeys([77, 157], [90, 90], TL_KEY_GAP, 214)).toEqual([26, 124]);
    // two tips close together: the lower one is pushed down by the first one's measured height plus the gap
    const close = placeKeys([60, 70], [100, 100], 8, 300);
    expect(close[1] - close[0]).toBeGreaterThanOrEqual(108);
    // a stack that would leave the lane is pulled back, never above 0 and never over the key above
    const low = placeKeys([210, 212], [90, 90], 8, 214);
    expect(low[0]).toBeGreaterThanOrEqual(0);
    expect(low[1] + 90).toBeLessThanOrEqual(214);
    expect(low[1] - (low[0] + 90)).toBeGreaterThanOrEqual(8 - 1e-9);
    // returned in the order of the tips given
    expect(placeKeys([157, 77], [70, 70], 8, 214)).toEqual([117, 37]);
  });
});

describe('the timeline card on the screen', () => {
  const t = tl();
  const wide = card(t, { wide: true, width: 786 }, TIE);
  it('every end value is the file\'s last value; the table holds the exact numbers', () => {
    expect(byId(wide, 'sim-tl-value-patients')).toBe(formatCount(TLX.patients[23]));
    expect(byId(wide, 'sim-tl-value-matches')).toBe(formatCount(TLX.matches[23]));
    expect(byId(wide, 'sim-tl-value-income')).toBe(formatEuroK(TLX.income[23]));
    expect(byId(wide, 'sim-tl-value-drop')).toBe(formatEuroK(TLX.drop[23]));
    expect(byId(wide, 'sim-tl-value-dx')).toBe(TLX.dx[23].toFixed(1));
    const row = (m: string) => (wide.match(new RegExp(`<tr data-measure="${m}">([\\s\\S]*?)</tr>`)) ?? [])[1]?.replace(/<[^>]+>/g, '|').replace(/\|+/g, '|');
    expect(row('income')).toBe(`|Our income|${formatEuroWhole(TLX.income[11])}|${formatEuroWhole(TLX.income[23])}|`);
    expect(row('drop')).toBe(`|Modelled drop in cost|${formatEuroWhole(TLX.drop[11])}|${formatEuroWhole(TLX.drop[23])}|`);
    expect(row('patients')).toBe(`|Patients in the network|${formatCount(TLX.patients[11])}|${formatCount(TLX.patients[23])}|`);
    expect(row('dx')).toBe(`|Fewer wrong or missed diagnoses|${TLX.dx[11].toFixed(1)}|${TLX.dx[23].toFixed(1)}|`);
    expect(wide).toContain('Plan months 12 and 24, the same figures as the chart.');
  });
  it('three kinds, told apart without colour: three dash patterns, three marker shapes, a tag on every key', () => {
    expect(new Set(Object.values(TL_DASH)).size).toBe(3);
    const dashOf = (id: string) => (wide.match(new RegExp(`data-line="${id}" data-dash="([^"]*)"`)) ?? [])[1];
    expect(dashOf('matches')).toBe('none');
    expect(dashOf('drop')).toBe('6 4');
    expect(dashOf('dx')).toBe('6 4');
    expect(dashOf('patients')).toBe('12 4 2 4');
    expect(dashOf('income')).toBe('12 4 2 4');
    expect(byId(wide, 'sim-tl-tag-patients')).toBe('Plan');
    expect(byId(wide, 'sim-tl-tag-income')).toBe('Plan');
    expect(byId(wide, 'sim-tl-tag-drop')).toBe('Model');
    expect(byId(wide, 'sim-tl-tag-dx')).toBe('Model');
    expect(byId(wide, 'sim-tl-tag-matches')).toBe('Computed on synthetic records');
    // end markers: one circle (computed), diamonds (rotated squares, model) and squares (plan) in the plots
    const plots = wide.split('class="tl-lines"').slice(1).map((x) => x.split('</g>')[0]).join('');
    expect((plots.match(/<circle/g) ?? []).length).toBe(1);
    expect((plots.match(/<rect[^>]*transform="rotate\(45/g) ?? []).length).toBe(2);
    expect((plots.match(/<rect(?![^>]*transform)/g) ?? []).length).toBe(2);
  });
  it('the assumption lines travel with their lane; income is marked a plan, the ramp an assumption, the diagnoses lane carries its own', () => {
    expect(byId(wide, 'sim-tl-ramp')).toBe('Assumption: each paid case is one new patient in the network, at €40 a case. Months 3 to 8 are a free pilot with no patients counted. Doctor-seat fees are income, not patients.');
    expect(byId(wide, 'sim-tl-income')).toBe('Income: our plan, not a measurement. Every price and volume is an assumption.');
    expect(byId(wide, 'sim-tl-dx-assumption')).toBe('Assumption: one visit per patient a year.');
    // each note is a sibling of its plot, in its own lane element
    for (const lane of ['people', 'euro', 'dx']) expect(wide).toContain(`data-testid="sim-tl-note-${lane}"`);
    expect(wide.split('data-testid="sim-tl-note-people"')[1]).toContain('sim-tl-ramp');
    expect(wide.split('data-testid="sim-tl-note-euro"')[1].split('data-testid="sim-tl-note-dx"')[0]).toContain('sim-tl-income');
    expect(wide.split('data-testid="sim-tl-note-dx"')[1]).toContain('sim-tl-dx-assumption');
  });
  it('the formula under the euro lane gives the figure on screen at the precision shown (points x base x patients)', () => {
    expect(byId(wide, 'sim-tl-formula')).toBe(`0.77 points × ${formatEuroCents(PER)} × 2,806 patients = €88k a year`);
    expect(byId(wide, 'sim-tl-drop-note')).toBe(
      'Each case is paid once, at €40. The modelled drop is a yearly figure for the patients in the network (€31.38 per patient a year at month 24). In this model it counts only the direct cost of wrong or missed diagnoses, on the EU-27 average spending per inhabitant.',
    );
    expect(wide).toContain(`>${formatEuroK(TLX.drop[23])}<`);
    expect(formatEuroK(dropFromInputs(0.77, PER, 2806))).toBe(byId(wide, 'sim-tl-value-drop'));
  });
  it('the tie to the hero is there with the drop line and leaves with it', () => {
    expect(byId(wide, 'sim-timeline-tie')).toBe(`The ${TIE.amount} a year above applies this same model to all ${TIE.geography} health spending. This chart counts only the patients in the network, so its figures are far smaller.`);
    const noDrop = card(tl((r) => { delete (r as { drop_eur?: unknown }).drop_eur; }), { wide: true, width: 786 }, TIE);
    expect(noDrop).not.toContain('sim-timeline-tie');
    expect(noDrop).not.toContain('sim-tl-formula');
    expect(noDrop).not.toContain('sim-tl-key-drop');
    expect(noDrop).toContain('sim-tl-key-income');
    expect(noDrop).not.toContain('Modelled drop');
    expect(card(t)).not.toContain('sim-timeline-tie');
  });
  it('without diagnoses: no third lane, no lane title, no assumption line, no diagnoses sentence in the description', () => {
    const noDx = card(tl((r) => { delete (r as { diagnoses?: unknown }).diagnoses; }));
    expect(noDx).not.toContain('sim-tl-lane-dx');
    expect(noDx).not.toContain('one visit per patient');
    expect(noDx).not.toContain('Fewer wrong or missed diagnoses');
    expect(byId(noDx, 'sim-timeline-desc')).not.toContain('diagnoses');
    // the month labels move to the last lane left
    expect((noDx.match(/data-testid="sim-tl-month"/g) ?? []).length).toBe(8);
  });
  it('the text alternative is real text, filled from the data, with no running total', () => {
    const d = byId(wide, 'sim-timeline-desc')!;
    expect(d).toBe(
      'Chart, plan months 1 to 24, synthetic model. Patients in the network: none until month 9, 2,806 at month 24. Records with a match: 1,137 at month 24. Modelled fewer wrong or missed diagnoses: 9.8 a year. Modelled drop in cost: €88,043 a year. Planned income: €228,923 a year, plan. A model and a plan, not a measurement.',
    );
    expect(d).not.toMatch(/so far|running|total/i);
    expect(wide).toMatch(/<section[^>]*aria-labelledby="[^"]+"[^>]*aria-describedby="[^"]+"/);
    expect((wide.match(/<svg class="tl-svg"[^>]*aria-hidden="true"/g) ?? []).length).toBe(3);
  });
  it('the unit lines say a year for every money and diagnoses figure, and one scale for both euro lines', () => {
    expect(byId(wide, 'sim-tl-unit-euro')).toBe('€ a year, one scale for both lines');
    expect(byId(wide, 'sim-tl-unit-dx')).toBe('A year, across these patients, in the model');
    expect(byId(wide, 'sim-tl-unit-people')).toBe('Patients and records, running total');
    expect(words(wide)).not.toMatch(/saved|saves|savings|\bwill\b|proves|anonymous|!/i);
  });
  it('the card is static: no animation or transition in its code or its CSS, so reduced motion shows the same finished state', () => {
    const css = readFileSync(join(__dirname, 'matches.css'), 'utf8');
    const tlCss = css.slice(css.indexOf('The timeline diagram (MIN-4702'));
    expect(tlCss.length).toBeGreaterThan(500);
    expect(tlCss).not.toMatch(/animation|transition|@keyframes/);
    for (const f of ['SimTimeline.tsx', 'timeline.ts']) expect(readFileSync(join(__dirname, f), 'utf8'), f).not.toMatch(/requestAnimationFrame|setInterval|setTimeout|animate/);
  });
});

describe('the timeline on /simulation', () => {
  const data = () => ({ ...real(), timeline: tl() });
  it('sits directly under the hero and above the three small charts; the hero, the charts and the clock are untouched', () => {
    const base = real();
    const withCard = sim(data());
    const heroAt = withCard.indexOf('data-testid="sim-hero"');
    const cardAt = withCard.indexOf('data-testid="sim-timeline"');
    const gridAt = withCard.indexOf('class="sim-grid"');
    expect(heroAt).toBeGreaterThan(-1);
    expect(cardAt).toBeGreaterThan(heroAt);
    expect(gridAt).toBeGreaterThan(cardAt);
    expect(withCard.indexOf('data-testid="sim-timeline"', cardAt + 1)).toBe(-1);
    // taking the card out leaves exactly the page without it
    const stripped = withCard.replace(/<section class="tl"[\s\S]*?<\/details><\/section>/, '');
    expect(stripped).toBe(rest(base));
    expect(SIM_DURATION_MS).toBe(30_000);
    expect(simDuration(base.x.values.length)).toBe(30_000);
  });
  it('the tie sentence carries the hero\'s own euro figure when the file has the euro block and the drop line', () => {
    const d = data();
    if (!d.euro) return;
    const out = sim(d);
    const hero = text(out, 'sim-euro-figure');
    expect(text(out, 'sim-timeline-tie') ?? byId(out, 'sim-timeline-tie')).toContain(hero ?? 'x');
  });
  it('at every moment of the run the card shows the same finished state (it is not on the clock)', () => {
    const d = data();
    const cardOf = (m: string) => m.match(/<section class="tl"[\s\S]*?<\/details><\/section>/)![0];
    const final = cardOf(sim(d));
    for (const at of [0, 700, 5_000, 15_000, 29_999]) expect(cardOf(simAt(d, at))).toBe(final);
  });
  it('the committed file, when it carries the block, parses with every measure the screen draws', () => {
    const raw = (simulationJson as { timeline?: unknown }).timeline;
    if (raw === undefined) return;
    const parsedTl = parseTimeline(raw);
    expect(parsedTl, 'the committed timeline block must parse').toBeDefined();
    expect(parsedTl!.x).toHaveLength(TL_MONTHS);
  });
});

describe('no figure of the timeline block is typed in the code', () => {
  const src = (f: string) => readFileSync(join(__dirname, f), 'utf8');
  it('no value of the fixture, and no month or euro figure, appears in the timeline code or its strings', () => {
    const files = ['SimTimeline.tsx', 'timeline.ts', 'copy.ts', 'Simulation.tsx'].map(src).join('\n');
    const figures = ['2806', '2,806', '1137', '1,137', '88043', '88,043', '228923', '228,923', String(PER), formatEuroCents(PER).slice(1), '0.77', '9.8', '31.38', '14857', '1189', '24 months'];
    for (const f of figures) expect(files, f).not.toContain(f);
  });
  it('the timeline strings hold no digit except through an argument', () => {
    const tlKeys = Object.keys(COPY).filter((k) => k.startsWith('tl'));
    expect(tlKeys.length).toBeGreaterThan(20);
    const flat = (v: unknown): string[] => (typeof v === 'string' ? [v] : typeof v === 'object' && v ? Object.values(v).flatMap(flat) : []);
    for (const k of tlKeys) {
      const v = (COPY as Record<string, unknown>)[k];
      if (typeof v === 'function') continue;
      for (const str of flat(v)) expect(str, k).not.toMatch(/\d/);
    }
    // the functions put the arguments in and nothing else: a sentinel in, a sentinel out
    expect(COPY.tlRampPerCase({ price: 'PRICE', from: 777, to: 888 })).toContain('PRICE a case. Months 777 to 888');
    expect(COPY.tlEuroNote({ price: 'PRICE', perPatient: 'PER', last: 999 })).toContain('at PRICE. The modelled drop');
    expect(COPY.tlCaption({ first: 111, last: 222 })).toContain('Plan months 111 to 222,');
  });
});
