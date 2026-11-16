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

/** The words a reader sees: tags and SVG geometry removed. */
const words = (markup: string) => markup.replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const html = (state: PanelState) => renderToStaticMarkup(createElement(MatchesView, { state }));


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
    expect((simulationJson as { label: string }).label).toBe(COPY.simLabel);
  });
  it('no file in the matches folder loads a webfont from the network', () => {
    for (const f of readdirSync(__dirname)) {
      if (f.endsWith('.test.ts')) continue;
      expect(readFileSync(join(__dirname, f), 'utf8'), f).not.toMatch(/fonts\.googleapis|fonts\.gstatic/);
    }
  });
});

