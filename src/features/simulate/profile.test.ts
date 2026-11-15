/**
 * MIN-4756: the profiles of the selected records and "What they have in common". Synthetic: does not count toward the goal.
 * The common counts are held to a reader that shares no code with profile.ts: plain Maps over the code NAMES, from the file's rows.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import recruitJson from '../../../data/synthetic/recruit-50000.json';
import { RECRUIT_COPY as T } from './copy';
import { prepare, search, type OkRequest, type Prepared } from './flow';
import { codeLabel, countryName } from './format';
import { CARDS_FIRST, CARDS_STEP, codeText, commonOf, moreStep, profiles } from './profile';
import { CommonView, Profiles } from './Profiles';
import { parseRecruitFile, recruit, type RecruitCondition, type RecruitFile } from './recruit';
import { Records } from './Simulate';

const FILE: RecruitFile = parseRecruitFile(structuredClone(recruitJson));
const nf = (n: number) => n.toLocaleString('en-US');
const cond = (id: string) => FILE.conditions.find((c) => c.id === id)!;
const request = (c: RecruitCondition, asked: number | null): OkRequest => ({ kind: 'ok', condition: c, asked, others: [] });
const prep = (c: RecruitCondition, asked: number | null): Prepared => prepare(FILE, request(c, asked), search(FILE, request(c, asked)));

/** Independent of recruit(): the fitting rows by code name, in file order, cut to `asked`. */
function naiveRows(c: RecruitCondition, asked: number | null): number[] {
  const out: number[] = [];
  FILE.records.forEach(([, , opt, idx], i) => {
    const have = new Set(idx.map((x) => FILE.codes[x]));
    if (opt === 1 && c.must.every((m) => have.has(m)) && c.some.filter((s) => have.has(s)).length >= c.min_some) out.push(i);
  });
  return out.length < FILE.k ? [] : asked ? out.slice(0, asked) : out;
}

function naiveCounts(rows: number[]) {
  const code = new Map<string, number>();
  const band = new Map<string, number>();
  for (const r of rows) {
    for (const x of FILE.records[r][3]) code.set(FILE.codes[x], (code.get(FILE.codes[x]) ?? 0) + 1);
    const b = FILE.age_bands[FILE.records[r][1]];
    band.set(b, (band.get(b) ?? 0) + 1);
  }
  return { code, band };
}

const view = (c: RecruitCondition, asked: number | null, step = 4, done = true) => {
  const p = prep(c, asked);
  const field = { seed: FILE.seed, cls: p.cls, selected: p.selected, many: p.many, stages: p.stages };
  return renderToStaticMarkup(createElement(Records, { id: 1, file: FILE, request: request(c, asked), prepared: p, field, step, rings: false, reduced: true, done, onRevealed: () => undefined }));
};

describe('what they have in common equals a plain count, for 13 conditions at no number, 10 and 40', () => {
  for (const c of FILE.conditions) {
    for (const asked of [null, 10, 40]) {
      it(`${c.id}, ${asked ?? 'no number'}`, () => {
        const rows = naiveRows(c, asked);
        const p = prep(c, asked);
        if (rows.length === 0) {
          // fewer than 5 fit: nothing is shown, nothing is held
          expect(p.shown).toBe(false);
          expect(p.common).toBeNull();
          return;
        }
        expect(p.selected).toEqual(rows);
        const common = p.common!;
        const n = rows.length;
        const { code, band } = naiveCounts(rows);
        expect(common.n).toBe(n);
        // every must code is in "all", and "all" holds exactly the codes every record has
        for (const m of c.must) expect(common.all, m).toContain(m);
        expect(new Set(common.all)).toEqual(new Set([...code].filter(([, k]) => k === n).map(([k]) => k)));
        // "half" holds exactly the codes at count*2 >= n and < n, each with the count a plain count gives, most first
        const wantHalf = [...code].filter(([, k]) => k * 2 >= n && k < n);
        expect(new Map(common.half.map((h) => [h.code, h.count]))).toEqual(new Map(wantHalf));
        expect(common.half).toHaveLength(wantHalf.length);
        common.half.forEach((h, i) => {
          expect(h.count * 2, `${h.code} is at least half`).toBeGreaterThanOrEqual(n);
          expect(h.count).toBeLessThan(n);
          if (i > 0) expect(common.half[i - 1].count).toBeGreaterThanOrEqual(h.count);
        });
        // nothing under half is listed anywhere
        for (const k of [...common.all, ...common.half.map((h) => h.code)]) expect((code.get(k) ?? 0) * 2, k).toBeGreaterThanOrEqual(n);
        // age bands: the plain count, in the file's band order
        expect(new Map(common.bands.map((b) => [b.band, b.count]))).toEqual(band);
        expect(common.bands.map((b) => b.band)).toEqual(FILE.age_bands.filter((b) => band.has(b)));
        // computed, not typed: the same search gives the same lines
        expect(prep(c, asked).common).toEqual(common);
      });
    }
  }

  it('is null under two selected records, and not under two', () => {
    const rows = naiveRows(cond('rheumatoid_arthritis'), 2);
    expect(commonOf(FILE, cond('rheumatoid_arthritis'), rows.slice(0, 1))).toBeNull();
    expect(commonOf(FILE, cond('rheumatoid_arthritis'), [])).toBeNull();
    expect(commonOf(FILE, cond('rheumatoid_arthritis'), rows)?.n).toBe(2);
    expect(prep(cond('rheumatoid_arthritis'), 1).common).toBeNull();
    expect(prep(cond('rheumatoid_arthritis'), 2).common?.n).toBe(2);
  });

  it('counts over every selected record, not the cards on screen: no number selects them all', () => {
    const c = cond('hypothyroid');
    const p = prep(c, null);
    expect(p.common!.n).toBe(p.res.shown ? p.res.selected : -1);
    expect(p.common!.n).toBeGreaterThan(CARDS_FIRST);
    const html = view(c, null);
    expect(html).toContain(`Counted over the ${nf(p.common!.n)} selected records.`);
    expect(html).toContain(`All ${nf(p.common!.n)} have`);
  });
});

describe('a profile holds the record\'s own codes, criteria first, specialty last', () => {
  for (const c of FILE.conditions) {
    it(c.id, () => {
      const rows = naiveRows(c, 10);
      if (rows.length === 0) return;
      const list = profiles(FILE, c, rows);
      expect(list).toHaveLength(rows.length);
      list.forEach((pr, i) => {
        const rec = FILE.records[rows[i]];
        expect(pr.position).toBe(i + 1);
        expect(pr.country).toBe(countryName(rec[0]));
        expect(pr.ageBand).toBe(FILE.age_bands[rec[1]]);
        const own = rec[3].map((x) => FILE.codes[x]);
        expect([...pr.codes].sort()).toEqual([...own].sort()); // the same codes, none added, none dropped
        const rank = (code: string) => (c.must.includes(code) ? 0 : c.some.includes(code) ? 1 : code.startsWith('spec_') ? 3 : 2);
        pr.codes.forEach((code, j) => { if (j > 0) expect(rank(pr.codes[j - 1]), `${code} after ${pr.codes[j - 1]}`).toBeLessThanOrEqual(rank(code)); });
        // criteria in the condition's own order
        const musts = pr.codes.filter((x) => c.must.includes(x));
        expect(musts).toEqual(c.must.filter((m) => musts.includes(m)));
      });
    });
  }
});

describe('the cards on screen are the selected rows, in picking order', () => {
  it('card i shows the values of row rows[i] (RA, 40): number of cards, country, age band, codes in words', () => {
    const c = cond('rheumatoid_arthritis');
    const rows = naiveRows(c, 40);
    const html = renderToStaticMarkup(createElement(Profiles, { file: FILE, cond: c, rows }));
    const cards = html.split('data-testid="recruit-profile" ').slice(1);
    expect(cards).toHaveLength(CARDS_FIRST);
    cards.forEach((card, i) => {
      const rec = FILE.records[rows[i]];
      expect(card).toContain(`data-record="${i + 1}"`);
      expect(card).toContain(`<strong class="pf-rec">${T.recordLabel(String(i + 1))}</strong>`);
      expect(card).toContain(`<span>Country: ${countryName(rec[0])}</span>`);
      expect(card).toContain(`<span>Age band: ${FILE.age_bands[rec[1]]}</span>`);
      const text = card.match(/recruit-profile-codes">([^<]*)</)![1].replace(/&#x27;/g, "'");
      expect(new Set(text.split(', ')), `card ${i + 1}`).toEqual(new Set(rec[3].map((x) => codeText(FILE.codes[x]))));
    });
    expect(html).toContain(`Showing 20 of 40`);
    expect(html).toContain('Show 20 more');
  });

  it('never prints the file row index: not in text, an attribute, a test id or a key-like value', () => {
    const c = cond('rheumatoid_arthritis');
    const rows = naiveRows(c, null).filter((r) => r > 5_000).slice(0, 30);
    expect(rows.length).toBe(30);
    const html = renderToStaticMarkup(createElement(Profiles, { file: FILE, cond: c, rows }));
    for (const r of rows) expect(html, `row ${r}`).not.toContain(String(r));
    // the whole result block, not only the list
    const page = view(c, null);
    for (const r of naiveRows(c, null).filter((x) => x > 5_000).slice(0, 200)) expect(page, `row ${r}`).not.toContain(`"${r}"`);
  });

  it('a card is read only: no button, no link, no name, no ID, no photo, no avatar, no word of a trial agreed or a contact', () => {
    const html = renderToStaticMarkup(createElement(Profiles, { file: FILE, cond: cond('gout'), rows: naiveRows(cond('gout'), 40) }));
    const cards = html.match(/<li class="pf-card".*?<\/li>/g)!;
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) expect(card).not.toMatch(/<button|<a |<img|<svg|href|initials|avatar/i);
    expect(html).not.toMatch(/anonymous|agreed to|contact|invite|introduc|\bpeople\b|\bpatients?\b/i);
  });
});

describe('Show more: 20 first, then 100 at a time, with no cap', () => {
  const rowsOf = (n: number) => Array.from({ length: n }, (_, i) => 5_000 + i);
  const html = (n: number) => renderToStaticMarkup(createElement(Profiles, { file: FILE, cond: cond('hypothyroid'), rows: rowsOf(n) }));
  const cardsIn = (h: string) => (h.match(/data-testid="recruit-profile" /g) ?? []).length;

  it('the step: a hundred, or what is left, and nothing at the end', () => {
    expect([CARDS_FIRST, CARDS_STEP]).toEqual([20, 100]);
    expect(moreStep(20, 20)).toBe(0);
    expect(moreStep(20, 21)).toBe(1);
    expect(moreStep(20, 120)).toBe(100);
    expect(moreStep(20, 121)).toBe(100);
    expect(moreStep(120, 121)).toBe(1);
    expect(moreStep(120, 120)).toBe(0);
    expect(moreStep(20, 2_618)).toBe(100);
    expect(moreStep(2_620, 2_618)).toBe(0);
  });

  it('the clicks from 20 reach every record, the last one short, then the button is gone', () => {
    for (const total of [21, 120, 121, 220, 2_618]) {
      let shown = CARDS_FIRST;
      const steps: number[] = [];
      for (let k = moreStep(shown, total); k > 0; k = moreStep(shown, total)) { steps.push(k); shown += k; }
      expect(shown, String(total)).toBe(total);
      expect(steps.slice(0, -1).every((k) => k === 100), String(total)).toBe(true);
      expect(steps[steps.length - 1], String(total)).toBe(((total - CARDS_FIRST - 1) % 100) + 1);
    }
  });

  it('first paint of 19, 20, 21, 120, 121 selected: the cards, the line and the button', () => {
    for (const [n, cards, button] of [[19, 19, null], [20, 20, null], [21, 20, 'Show 1 more'], [120, 20, 'Show 100 more'], [121, 20, 'Show 100 more']] as const) {
      const h = html(n);
      expect(cardsIn(h), String(n)).toBe(cards);
      expect(h, String(n)).toContain(`Showing ${cards} of ${n}`);
      if (button) expect(h, String(n)).toContain(`>${button}</button>`);
      else expect(h, String(n)).not.toContain('<button');
    }
    expect(html(2_618)).toContain('Showing 20 of 2,618');
    expect(html(2_618)).toContain('The 2,618 selected records, one by one');
  });

  it('the button is a button of the page\'s own size, and the list sits outside any live region', () => {
    const h = html(60);
    expect(h).toContain('<button type="button" class="btn pf-more"');
    expect(h.match(/aria-live/g)).toHaveLength(1); // the "Showing" line only
    expect(h.indexOf('aria-live')).toBeLessThan(h.indexOf('<ul'));
    expect(h).toContain('<ul class="pf-list" role="list"');
  });
});

describe('where the sections sit in the result block', () => {
  const FOUNDER = cond('rheumatoid_arthritis');
  it('after "Asked XX. Found XX." and the countries line, profiles, then common, then the group note', () => {
    const h = view(FOUNDER, 40);
    const at = (s: string) => h.indexOf(s);
    expect(at('recruit-found')).toBeGreaterThan(-1);
    const order = ['data-testid="recruit-line"', 'data-testid="recruit-countries"', 'data-testid="recruit-profiles"', 'data-testid="recruit-common"', T.groupNote];
    order.forEach((s, i) => { expect(at(s), s).toBeGreaterThan(-1); if (i > 0) expect(at(s), s).toBeGreaterThan(at(order[i - 1])); });
    expect(h.match(/data-testid="recruit-found"/g)).toHaveLength(1);
    expect(at('data-testid="recruit-profiles"')).toBeGreaterThan(at('data-testid="recruit-found"'));
    expect(h).toContain('Asked 40. Found 40.');
    expect(h).toContain('The 40 selected records, one by one');
    expect(h).toContain(T.profilesNote);
    expect(h).toContain('What they have in common');
    // the fixed note is plain small text, not a pill
    expect(h).toContain(`<p class="muted sm-small" data-testid="recruit-profiles-note">${T.profilesNote}</p>`);
  });

  it('RA at 40: "All 40 have" holds the must code, and a count reads "x of 40"', () => {
    const h = view(FOUNDER, 40);
    expect(h).toContain('All 40 have');
    expect(h).toContain('data-code="joint_pain"');
    expect(h).toMatch(/At least half have/);
    expect(h).toMatch(/data-code="[a-zA-Z_]+" data-count="\d+">[^<]+: \d+ of 40</);
    expect(h).toMatch(/Age bands: (\d\d(-\d\d|\+): \d+(, )?)+\./);
  });

  it('neither section is in the DOM before the last stage, at any step', () => {
    for (let step = 0; step <= 4; step++) {
      const h = view(FOUNDER, 40, step, false);
      expect(h, `step ${step}`).not.toMatch(/recruit-profiles|recruit-common|recruit-profile"|pf-|The 40 selected records|What they have in common/);
    }
  });

  it('under 5 fit: nothing new, only the one sentence (copper metabolism, myopathy)', () => {
    for (const id of ['rare_copper_metabolism', 'rare_myopathy']) {
      const h = view(cond(id), 40, 2, true);
      expect(h, id).toContain('Fewer than 5 records fit these criteria, so nothing is shown.');
      expect(h, id).not.toMatch(/recruit-profiles|recruit-common|recruit-profile"|pf-|selected records, one by one|What they have in common|Record \d/);
    }
  });

  it('sarcoid, 40 asked, 6 fit: six profiles, no "Show more", "of 6"', () => {
    const h = view(cond('rare_sarcoid_like'), 40);
    expect((h.match(/data-testid="recruit-profile" /g) ?? []).length).toBe(6);
    expect(h).toContain('The 6 selected records, one by one');
    expect(h).toContain('Showing 6 of 6');
    expect(h).not.toContain('recruit-profiles-more');
    expect(h).toContain('All 6 have');
    expect(h).toContain('Counted over the 6 selected records.');
  });

  it('asked 3 while many fit: three profiles and the common lines over 3; asked 1: one profile and no common section', () => {
    const three = view(FOUNDER, 3);
    expect((three.match(/data-testid="recruit-profile" /g) ?? []).length).toBe(3);
    expect(three).toContain('Counted over the 3 selected records.');
    expect(three).toContain('data-testid="recruit-countries"');
    const one = view(FOUNDER, 1);
    expect((one.match(/data-testid="recruit-profile" /g) ?? []).length).toBe(1);
    expect(one).not.toContain('recruit-common');
    expect(one).not.toContain('What they have in common');
    expect(one).toContain('The 1 selected record<');
    expect(one).not.toContain('The 1 selected records');
  });

  it('no number (RA): every fitting record is a card source; 20 on screen; "of N" over all of them', () => {
    const p = prep(FOUNDER, null);
    const n = p.counts!.eligible;
    const h = view(FOUNDER, null);
    expect(h).toContain(`The ${nf(n)} selected records, one by one`);
    expect(h).toContain(`Showing 20 of ${nf(n)}`);
    expect(h).toContain(`All ${nf(n)} have`);
    expect((h.match(/data-testid="recruit-profile" /g) ?? []).length).toBe(20);
  });

  it('the common view alone: the criteria "all" are the must codes (every condition that shows)', () => {
    for (const c of FILE.conditions) {
      const res = recruit(FILE, c, 40);
      if (!res.shown) continue;
      const common = commonOf(FILE, c, res.rows)!;
      const h = renderToStaticMarkup(createElement(CommonView, { common }));
      for (const m of c.must) expect(h, `${c.id} ${m}`).toContain(`data-code="${m}"`);
      expect(h).toContain(`All ${common.n} have`);
    }
  });
});

describe('the words', () => {
  it('a specialty reads as a field on the record, never as a bare word', () => {
    expect(codeText('spec_rheumatology')).toBe('Rheumatology (specialty on the record)');
    expect(codeText('joint_pain')).toBe(codeLabel('joint_pain'));
    const rows = naiveRows(cond('rheumatoid_arthritis'), 40);
    const h = renderToStaticMarkup(createElement(Profiles, { file: FILE, cond: cond('rheumatoid_arthritis'), rows }));
    expect(h).toContain('(specialty on the record)');
    expect(h).not.toMatch(/(^|[>,] )(Rheumatology|Cardiology|Gp|Endocrinology)(,|<)/);
  });
  it('every code of the file reads as words: no "Gp", no "HLA B27", no "VitD" (MIN-4757)', () => {
    expect(codeText('spec_gp')).toBe('General practice (specialty on the record)');
    expect(codeLabel('HLA_B27_positive')).toBe('HLA-B27 positive');
    expect(codeLabel('vitD_low')).toBe('Vitamin D low');
    for (const c of FILE.codes) expect(codeText(c), c).not.toMatch(/^Gp\b|HLA B27|VitD|_/);
  });
  it('no string says the machine produced the profiles or the counts, and the old "Country only" claim is gone', () => {
    const h = view(cond('rheumatoid_arthritis'), 40);
    expect(h).not.toMatch(/Country only/);
    expect(h).toContain('One dot each, without name or ID. The place of a dot means nothing.');
  });
});
