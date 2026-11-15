import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import recruitJson from '../../../data/synthetic/recruit-50000.json';
import { Records, Said, SimulateView } from './Simulate';
import { answerFor, prepare, search, type Answer, type OkRequest, type Prepared } from './flow';
import { parseRecruitFile, recruit } from './recruit';

const FILE = parseRecruitFile(structuredClone(recruitJson));
const nf = (n: number) => n.toLocaleString('en-US');
const ok = (sentence: string): OkRequest => {
  const a = answerFor(FILE, sentence);
  if (a.kind !== 'run') throw new Error(a.kind);
  return a.parsed;
};
const view = (sentence: string, step: number, done: boolean, rings = false) => {
  const request = ok(sentence);
  const prepared: Prepared = prepare(FILE, request, search(FILE, request));
  const field = { seed: FILE.seed, cls: prepared.cls, selected: prepared.selected, many: prepared.many, stages: prepared.stages };
  const html = renderToStaticMarkup(createElement(Records, { id: 1, file: FILE, request, prepared, field, step, rings, reduced: true, done, onRevealed: () => undefined }));
  return { html, prepared, request };
};
const text = (html: string, id: string) => html.match(new RegExp(`data-testid="${id}"[^>]*>([^<]*)<`))?.[1] ?? null;
const said = (a: Answer) => renderToStaticMarkup(createElement(Said, { file: FILE, ans: a, onPick: () => undefined }));
const FOUNDER = 'i want to recruit 40 people matching the rheumatoid arthritis desease for a trial';

describe('the page before the records are in', () => {
  const page = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(SimulateView, { load: () => new Promise(() => undefined) })));
  it('is one box and one button, with no removed string and no label pill', () => {
    expect(page).toContain('Search the records');
    expect(page.match(/<button/g)).toHaveLength(1);
    expect(page).not.toMatch(/Run the simulation|Run again|5,000|data-testid="sim-run"|recruit-understands|recruit-source|sim-legend|sim-matches/);
    expect(page).toContain('data-testid="recruit-loading"');
    expect(page).toContain('Loading the seeded synthetic records.');
  });
});

describe('the sentence that stops a search (nothing starts, nothing is left from an earlier run)', () => {
  it('empty box', () => expect(said({ kind: 'empty' })).toContain('The box is empty.'));
  it('a number above 50,000: the 50,000 comes from the file', () => expect(said({ kind: 'too_many' })).toContain(`more than the ${nf(FILE.n)} records`));
  it('an unknown condition: the sentence and 13 buttons, and a button does not start a run', () => {
    const html = said({ kind: 'no_condition' });
    expect(html).toContain('That condition is not in this search.');
    expect(html.match(/data-testid="recruit-pick-/g)).toHaveLength(13);
    expect(html.match(/type="button"/g)).toHaveLength(13);
    expect(html).not.toContain('type="submit"');
  });
  it('a run says what it read at once, and the two-conditions notice, and nothing of the result', () => {
    const request = ok('recruit 10 people matching gout and rheumatoid arthritis');
    const html = said({ kind: 'run', parsed: request });
    expect(text(html, 'recruit-read')).toBe('Read from your sentence: 10 records, Rheumatoid arthritis pattern.');
    expect(html).toContain('data-testid="recruit-two"');
    expect(html).not.toMatch(/recruit-line|recruit-countries|recruit-found/);
    expect(text(said({ kind: 'run', parsed: ok('recruit people matching gout') }), 'recruit-read')).toBe('Read from your sentence: no number, Gout pattern.');
  });
});

describe('the founder\'s sentence, stage by stage', () => {
  it('step 0: the dots are in, nothing lit, no count and no result', () => {
    const { html } = view(FOUNDER, 0, false);
    expect(html).toContain('<h2 id="sm-h2"><b>2</b> The 50,000 records</h2>');
    expect(html).toContain('One dot each. Country only, no names or ID. The place of a dot means nothing.');
    expect(html).toContain('aria-label="50,000 synthetic records, one dot each. All records shown."');
    expect(html).toContain('data-on="false"');
    expect(html.match(/<li class=""/g)).toHaveLength(4);
    expect(html).not.toMatch(/rc-num mono">\d|recruit-compared|recruit-line|recruit-countries/);
  });
  it('each step lights one row with its count, and the canvas says the stage in words', () => {
    const words = ['All records shown.', 'Records that did not opt in to matching are faded.', 'Only records that fit the criteria stay bright.', 'The selected records are highlighted and ringed.'];
    const { prepared } = view(FOUNDER, 1, false);
    const c = prepared.counts!;
    const counts = [c.records, c.optedIn, c.eligible, c.selected];
    for (let step = 1; step <= 4; step++) {
      const { html } = view(FOUNDER, step, false);
      expect(html, `step ${step}`).toContain(`one dot each. ${words[step - 1]}"`);
      expect(html.match(/<li class="show"/g), `step ${step}`).toHaveLength(step);
      counts.forEach((n, i) => {
        const row = html.match(new RegExp(`recruit-funnel-${['records', 'optedIn', 'eligible', 'selected'][i]}"><span class="rc-num mono">([^<]*)<`))![1];
        expect(row, `step ${step} row ${i}`).toBe(i < step ? nf(n) : '');
      });
      expect(html).not.toMatch(/recruit-line|recruit-countries/); // the result is after the last stage
    }
  });
  it('the counts on screen are recruit()\'s: 50,000, opted in, fit, 40', () => {
    const { html } = view(FOUNDER, 4, true);
    const fresh = recruit(FILE, ok(FOUNDER).condition, 40);
    expect(fresh.shown).toBe(true);
    if (!fresh.shown) return;
    expect(html).toContain(`mono">${nf(50_000)}<`);
    expect(html).toContain(`mono">${nf(fresh.optedIn)}<`);
    expect(html).toContain(`mono">${nf(fresh.eligible)}<`);
    expect(html).toContain('mono">40<');
  });
  it('the Compared line shows from the fit stage, and the result only after the last one', () => {
    expect(view(FOUNDER, 2, false).html).not.toContain('recruit-compared');
    const fit = view(FOUNDER, 3, false).html;
    expect(text(fit, 'recruit-compared')).toMatch(/^Compared: every one of /);
    expect(fit).not.toContain('recruit-line');
    const end = view(FOUNDER, 4, true).html;
    expect(text(end, 'recruit-line')).toBe('Asked 40. Found 40.');
    expect(text(end, 'recruit-more')).toMatch(/^[\d,]+ more records fit these criteria and were not selected\.$/);
    expect(text(end, 'recruit-countries')).toMatch(/^Countries of the selected records: /);
    expect(end).not.toMatch(/Nobody is contacted|recruit-simulated|Ask for an introduction/);
  });
});

describe('the other edge rows of the table, at their end state', () => {
  it('fewer fit than asked: the full flow and the shortfall sentence', () => {
    const { html } = view('recruit 40 people matching sarcoid', 4, true);
    expect(text(html, 'recruit-line')).toBe('Found 6 of the 40 asked. No other record fits these criteria.');
    expect(html.match(/<li class="show"/g)).toHaveLength(4);
    expect(html).not.toContain('recruit-more');
  });
  it('no number: every fitting record, over 100 enlarged, the canvas says so', () => {
    const { html, prepared } = view('recruit people matching rheumatoid arthritis', 4, true);
    expect(text(html, 'recruit-line')).toBe(`Found ${nf(prepared.counts!.eligible)} records that fit these criteria.`);
    expect(html).toContain('data-testid="recruit-no-number"');
    expect(html).toContain('More than 100 records are selected, so they are enlarged, not ringed.');
    expect(html).not.toContain('are highlighted and ringed');
  });
  it('under 5: the opted-in stage and one sentence; no fit stage, no count, no funnel, no countries', () => {
    for (const name of ['copper metabolism', 'myopathy']) {
      const stop = view(`recruit 40 people matching ${name}`, 2, true).html;
      expect(text(stop, 'recruit-few'), name).toBe('Fewer than 5 records fit these criteria, so nothing is shown.');
      expect(stop, name).not.toMatch(/recruit-funnel|recruit-line|recruit-countries|recruit-found|recruit-more|rc-num/);
      expect(stop, name).toContain('Records that did not opt in to matching are faded.');
      expect(stop, name).not.toContain('Only records that fit the criteria stay bright.');
      expect(stop, name).not.toContain('are highlighted');
      // before the end, no sentence yet and still no count
      const mid = view(`recruit 40 people matching ${name}`, 2, false).html;
      expect(mid, name).not.toMatch(/recruit-few|recruit-funnel|rc-num/);
    }
  });
});
