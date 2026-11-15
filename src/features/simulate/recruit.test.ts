import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import recruitJson from '../../../data/synthetic/recruit-50000.json';
import { COPY, RECRUIT_CONDITION_NAMES, RECRUIT_COPY, recruitFill } from './copy';
import { normalise, parseRecruitFile, parseRequest, recruit, type RecruitCondition, type RecruitFile, type RecruitRow } from './recruit';

const file = (): RecruitFile => parseRecruitFile(structuredClone(recruitJson));
const REAL = file();
const cond = (id: string) => REAL.conditions.find((c) => c.id === id)!;
const parse = (text: string) => parseRequest(text, REAL.conditions, REAL.n);

/** A reader that does not share code with recruit(): plain Sets over the code names, so two copies of one mistake cannot agree. */
function naiveEligible(f: RecruitFile, c: RecruitCondition): number[] {
  const out: number[] = [];
  f.records.forEach(([, , opt, idx], i) => {
    const have = new Set(idx.map((x) => f.codes[x]));
    if (opt === 1 && c.must.every((m) => have.has(m)) && c.some.filter((s) => have.has(s)).length >= c.min_some) out.push(i);
  });
  return out;
}

describe('the file is the 50,000 seeded synthetic records', () => {
  it('holds exactly 50,000 records, labelled synthetic, with k = 5 and 13 conditions', () => {
    expect(REAL.records).toHaveLength(50_000);
    expect(REAL.n).toBe(50_000);
    expect(REAL.synthetic).toBe(true);
    expect(REAL.k).toBe(5);
    expect(REAL.conditions).toHaveLength(13);
    expect(REAL.label).toBe('Seeded synthetic data. Not real patients.');
  });

  it('has no group column and no code listed twice in a record (the search counts codes by position)', () => {
    for (const r of REAL.records) {
      expect(r).toHaveLength(4);
      expect(new Set(r[3]).size).toBe(r[3].length);
    }
  });

  it('refuses a file whose n does not match its records, and a file that is not synthetic', () => {
    const bad = structuredClone(recruitJson) as unknown as Record<string, unknown>;
    bad.n = 49_999;
    expect(() => parseRecruitFile(bad)).toThrow(/n does not match/);
    expect(() => parseRecruitFile({ ...(recruitJson as object), synthetic: false })).toThrow(/not a synthetic/);
    expect(() => parseRecruitFile(null)).toThrow();
  });
});

describe('recruit() equals the Python reference (the file\'s expected block), computed here at each call', () => {
  for (const c of recruitJson.conditions) {
    it(`${c.id}: eligible and countries equal the reference`, () => {
      const exp = REAL.expected[c.id];
      const out = recruit(REAL, cond(c.id), null);
      if (!exp.shown) {
        expect(out).toEqual({ shown: false });
        return;
      }
      expect(out.shown).toBe(true);
      if (!out.shown) return;
      expect(out.eligible).toBe(exp.eligible);
      expect(out.countries).toEqual(exp.countries);
      expect(out.selected).toBe(exp.eligible); // no number: every eligible record
      // independent of recruit(): a plain Set reader gives the same rows
      expect(out.rows).toEqual(naiveEligible(REAL, cond(c.id)));
    });
  }

  it('is not a tautology: the numbers are the ones the CTO named, and 13 conditions give 10 common + sarcoid shown + 2 empty', () => {
    const eligible = Object.fromEntries(REAL.conditions.map((c) => { const o = recruit(REAL, c, null); return [c.id, o.shown ? o.eligible : null]; }));
    expect(eligible).toMatchObject({ rheumatoid_arthritis: 2678, gout: 1236, rare_sarcoid_like: 6, rare_copper_metabolism: null, rare_myopathy: null });
  });

  it('the funnel is counted at the call and never grows: records >= opted in >= eligible >= selected', () => {
    for (const c of REAL.conditions) {
      const o = recruit(REAL, c, 40);
      if (!o.shown) continue;
      expect(o.records).toBe(50_000);
      expect(o.optedIn).toBe(REAL.opted_in);
      expect(o.optedIn).toBeLessThanOrEqual(o.records);
      expect(o.eligible).toBeLessThanOrEqual(o.optedIn);
      expect(o.selected).toBeLessThanOrEqual(o.eligible);
    }
  });

  it('the same request gives the same answer every time', () => {
    expect(recruit(REAL, cond('rheumatoid_arthritis'), 40)).toEqual(recruit(REAL, cond('rheumatoid_arthritis'), 40));
  });

  it('opt-in comes first: a record that withdraws leaves the funnel, and a group of 5 that loses one is below k', () => {
    const f = file();
    const c = f.conditions.find((x) => x.id === 'rare_sarcoid_like')!;
    const before = recruit(f, c, null);
    expect(before.shown && before.eligible).toBe(6);
    const rows = naiveEligible(f, c);
    f.records[rows[0]][2] = 0;
    const after = recruit(f, c, null);
    expect(after.shown && after.eligible).toBe(5);
    f.records[rows[1]][2] = 0;
    expect(recruit(f, c, null)).toEqual({ shown: false });
  });

  it('never reads a country or an age band to decide: scrambling both changes no count', () => {
    const f = file();
    f.records.forEach((r, i) => { r[0] = ['DE', 'FR'][i % 2]; r[1] = i % 6; });
    const a = recruit(f, f.conditions.find((x) => x.id === 'gout')!, null);
    const b = recruit(REAL, cond('gout'), null);
    expect(a.shown && b.shown && a.eligible === b.eligible).toBe(true);
  });
});

describe('the rule of five and the picking rule, on a small file whose answers are known by hand', () => {
  const rows: RecruitRow[] = [
    ['DE', 0, 1, [0, 1]], // 0 eligible
    ['FR', 0, 0, [0, 1]], // 1 did not opt in
    ['FR', 0, 1, [0]], // 2 no `some` code
    ['GR', 0, 1, [0, 2]], // 3 eligible
    ['IT', 0, 1, [0, 1, 2]], // 4 eligible
    ['NL', 0, 1, [0, 2, 3]], // 5 eligible
    ['SE', 0, 1, [0, 1]], // 6 eligible
    ['PT', 0, 1, [1, 2]], // 7 no `must` code
    ['ES', 0, 1, [0, 1]], // 8 eligible
  ];
  const c: RecruitCondition = { id: 'x', name: 'X', synonyms: ['x'], must: ['A'], some: ['B', 'C'], min_some: 1 };
  const small = (r: RecruitRow[]): RecruitFile => ({
    synthetic: true, label: 'l', seed: 1, n: r.length, k: 5, opted_in: r.filter((x) => x[2]).length,
    codes: ['A', 'B', 'C', 'D'], age_bands: ['18-29'], records: r, conditions: [c], expected: {}, made: { where: 'development machine' },
  });
  const ok = (o: ReturnType<typeof recruit>) => { if (!o.shown) throw new Error('expected shown'); return o; };

  it('6 eligible, no number: all 6 selected, countries of all 6', () => {
    const o = ok(recruit(small(rows), c, null));
    expect([o.eligible, o.selected, o.short, o.asked]).toEqual([6, 6, 0, null]);
    expect(o.rows).toEqual([0, 3, 4, 5, 6, 8]);
    expect(o.countries).toEqual(['DE', 'ES', 'GR', 'IT', 'NL', 'SE']);
    expect([o.records, o.optedIn]).toEqual([9, 8]);
  });

  it('zero counts as no number', () => {
    expect(ok(recruit(small(rows), c, 0)).selected).toBe(6);
  });

  it('asked below eligible: the FIRST X eligible rows in file order, and only their countries (ES is row 8, so it stays out)', () => {
    const o = ok(recruit(small(rows), c, 5));
    expect(o.rows).toEqual([0, 3, 4, 5, 6]);
    expect(o.countries).toEqual(['DE', 'GR', 'IT', 'NL', 'SE']);
    expect(o.short).toBe(0);
    const two = ok(recruit(small(rows), c, 2));
    expect(two.rows).toEqual([0, 3]);
    expect(two.countries).toEqual(['DE', 'GR']);
    expect(two.eligible).toBe(6); // the total stays visible for "3 more records fit"
  });

  it('asked above eligible: all 6 selected, the gap is named, no padding and no relaxed criteria', () => {
    const o = ok(recruit(small(rows), c, 9));
    expect([o.eligible, o.selected, o.short]).toEqual([6, 6, 3]);
    expect(o.rows).toEqual([0, 3, 4, 5, 6, 8]);
  });

  it('exactly 5 eligible is shown; 4 is the one empty answer with no count and no countries', () => {
    expect(ok(recruit(small(rows.slice(0, 8)), c, null)).eligible).toBe(5); // row 8 dropped
    const four = recruit(small(rows.slice(0, 6)), c, null); // rows 6 and 7 dropped: eligible are 0, 3, 4, 5
    expect(four).toEqual({ shown: false });
    expect(Object.keys(four)).toEqual(['shown']);
  });

  it('0 eligible is the same empty answer as 4', () => {
    expect(recruit(small(rows.map((r) => [r[0], r[1], 0, r[3]] as RecruitRow)), c, 3)).toEqual({ shown: false });
  });

  it('the under-5 answer on the real file carries no count either (copper metabolism, myopathy)', () => {
    for (const id of ['rare_copper_metabolism', 'rare_myopathy']) {
      for (const asked of [null, 1, 40]) {
        const o = recruit(REAL, cond(id), asked);
        expect(o).toEqual({ shown: false });
        expect(Object.keys(o)).toEqual(['shown']);
      }
    }
  });

  it('on the real file: asked 40 of rheumatoid arthritis picks the first 40 eligible rows; sarcoid asked 40 is 6 of 40; asked 3 of 6 is 3', () => {
    const ra = ok(recruit(REAL, cond('rheumatoid_arthritis'), 40));
    expect(ra.rows).toEqual(naiveEligible(REAL, cond('rheumatoid_arthritis')).slice(0, 40));
    expect([ra.eligible, ra.selected, ra.short]).toEqual([2678, 40, 0]);
    const sar = ok(recruit(REAL, cond('rare_sarcoid_like'), 40));
    expect([sar.eligible, sar.selected, sar.short]).toEqual([6, 6, 34]);
    const three = ok(recruit(REAL, cond('rare_sarcoid_like'), 3));
    expect([three.selected, three.short]).toEqual([3, 0]);
    expect(three.rows).toEqual(naiveEligible(REAL, cond('rare_sarcoid_like')).slice(0, 3));
  });

  it('is fast: one search over 50,000 records (loose bound; the phone measurement is on the issue)', () => {
    const t = performance.now();
    recruit(REAL, cond('type2_diabetes_metabolic'), 100);
    expect(performance.now() - t).toBeLessThan(500);
  });
});

describe('the parser reads a number and one condition', () => {
  const ok = (text: string) => {
    const p = parse(text);
    if (p.kind !== 'ok') throw new Error(`"${text}" read as ${p.kind}`);
    return p;
  };

  const table: [string, string, number | null][] = [
    ['I want to recruit 40 people matching rheumatoid arthritis for a trial', 'rheumatoid_arthritis', 40], // Anna's placeholder
    ['i want to recruit 40 people matching the rheumatoid arthritis desease for a trial', 'rheumatoid_arthritis', 40], // the founder's own spelling
    ['I want to recruit 1200 people matching gout for a trial', 'gout', 1200],
    ['I want to recruit 1,200 people matching gout for a trial', 'gout', 1200],
    ['RA 25', 'rheumatoid_arthritis', 25],
    ['recruit 25 RA patients', 'rheumatoid_arthritis', 25],
    ['type 2 diabetes', 'type2_diabetes_metabolic', null], // the digit in the name is not the number
    ['recruit type 2 diabetes', 'type2_diabetes_metabolic', null],
    ['50 people with type 2 diabetes', 'type2_diabetes_metabolic', 50],
    ['type 2 diabetes, 50 people', 'type2_diabetes_metabolic', 50],
    ['I want to recruit people matching lupus for a trial', 'lupus_like', null],
    ['I want 0 people for gout', 'gout', null], // zero is no number
    ["recruit 8 people with Wilson's disease", 'rare_copper_metabolism', 8],
    ['RECRUIT 12 PEOPLE MATCHING IRON DEFICIENCY ANAEMIA', 'iron_deficiency', 12],
    ['  recruit\t12   people  matching   osteoporosis!!  ', 'low_bone_density', 12],
  ];
  for (const [text, id, asked] of table) {
    it(`"${text}" -> ${id}, ${asked ?? 'no number'}`, () => {
      const p = ok(text);
      expect(p.condition.id).toBe(id);
      expect(p.asked).toBe(asked);
      expect(p.others).toEqual([]);
    });
  }

  it('"1200" and "1,200" read the same', () => {
    expect(ok('recruit 1200 for gout').asked).toBe(ok('recruit 1,200 for gout').asked);
    expect(normalise('1,000,000 and 3,5 and 1,00')).toBe('1000000 and 3 5 and 1 00');
    expect(parse('recruit 1,000,000 for gout').kind).toBe('too_many'); // a thousands mark is read, then the size is judged
  });

  it('"recruit" and "trial" are whole words that are not "ra": no condition is found in a sentence with none', () => {
    expect(parse('I want to recruit 40 people for a trial').kind).toBe('no_condition');
    expect(parse('extra grave trial').kind).toBe('no_condition'); // "ra" inside words, "grave" is not "graves"
  });

  it('an unknown condition ("asthma"), with or without a number, runs no search', () => {
    expect(parse('I want to recruit 40 people matching asthma for a trial').kind).toBe('no_condition');
    expect(parse('asthma').kind).toBe('no_condition');
    expect(parse('40').kind).toBe('no_condition');
  });

  it('an empty box, spaces and punctuation alone are empty', () => {
    for (const t of ['', '   ', '?!.,', '\n\t']) expect(parse(t).kind).toBe('empty');
  });

  it('a number above 50,000 is its own answer; 50,000 itself is fine', () => {
    const big = parse('recruit 60,000 people matching gout');
    expect(big).toMatchObject({ kind: 'too_many', asked: 60_000 });
    expect(parse('recruit 50001 gout').kind).toBe('too_many');
    expect(ok('recruit 50000 gout').asked).toBe(50_000);
    expect(parse('recruit 99999999999999999999999 gout').kind).toBe('too_many');
  });

  it('two conditions: the longest match is used and the other is named as not used', () => {
    const p = ok('recruit 10 people matching gout and rheumatoid arthritis');
    expect(p.condition.id).toBe('rheumatoid_arthritis');
    expect(p.others.map((c) => c.id)).toEqual(['gout']);
    // the same condition twice (two spellings) is one condition, not two
    expect(ok('recruit 10 type 2 diabetes t2d').others).toEqual([]);
  });

  it('longest match wins inside one condition: "iron deficiency anaemia" is not read twice', () => {
    expect(ok('iron deficiency anaemia 30').condition.id).toBe('iron_deficiency');
    expect(ok('underactive thyroid 30').condition.id).toBe('hypothyroid');
    expect(ok('overactive thyroid 30').condition.id).toBe('hyperthyroid');
  });

  it('one sentence for each of the 13 conditions, by every spelling in the file (and the name)', () => {
    for (const c of REAL.conditions) {
      for (const syn of [...c.synonyms, c.name]) {
        const p = ok(`I want to recruit 7 people matching ${syn} for a trial`);
        expect(p.condition.id, `${syn} -> ${c.id}`).toBe(c.id);
        expect(p.asked, syn).toBe(7);
        expect(p.others, syn).toEqual([]);
      }
    }
  });

  it('a sentence read this way finds what the reference found, for all 13 (the founder\'s shape)', () => {
    for (const c of REAL.conditions) {
      const p = ok(`i want to recruit 40 people matching the ${c.name} desease for a trial`);
      const out = recruit(REAL, p.condition, p.asked);
      const exp = REAL.expected[c.id];
      if (!exp.shown) {
        expect(out).toEqual({ shown: false });
      } else {
        expect(out.shown && out.eligible).toBe(exp.eligible);
        expect(out.shown && out.selected).toBe(Math.min(40, exp.eligible));
      }
    }
  });

  it('no synonym belongs to two conditions, and normalising a spelling changes nothing (the file already holds them normalised)', () => {
    const seen = new Map<string, string>();
    for (const c of REAL.conditions) {
      for (const s of c.synonyms) {
        expect(normalise(s)).toBe(s);
        expect(seen.get(s), s).toBeUndefined();
        seen.set(s, c.id);
      }
    }
  });
});

describe('the words and the buttons', () => {
  it('the 13 names are keyed by exactly the file\'s 13 condition ids', () => {
    expect(Object.keys(RECRUIT_CONDITION_NAMES).sort()).toEqual(REAL.conditions.map((c) => c.id).sort());
  });

  it('a button fills the box with a sentence that reads back as the same condition and number', () => {
    for (const c of REAL.conditions) {
      const p = parse(recruitFill(40, c.name));
      expect(p, c.id).toMatchObject({ kind: 'ok', asked: 40 });
      expect(p.kind === 'ok' && p.condition.id, c.id).toBe(c.id);
    }
  });

  it('the two label pills under the box are gone (founder, 2026-11-15: "also remove that"), the page label stays', () => {
    expect(RECRUIT_COPY).not.toHaveProperty('understandsLabel');
    expect(RECRUIT_COPY).not.toHaveProperty('sourceLabelDev');
    expect(RECRUIT_COPY).not.toHaveProperty('sourceLabelBoxd');
    expect(RECRUIT_COPY).not.toHaveProperty('simulatedNote');
    expect(COPY.pageLabel).toBe('Seeded synthetic data. Not real patients.');
  });

  it('the strings carry no number of their own: the same key answers 40 and 1,200', () => {
    expect(RECRUIT_COPY.resultEqual('40', '40')).toBe('Asked 40. Found 40.');
    expect(RECRUIT_COPY.resultShort('6', '40')).toBe('Found 6 of the 40 asked. No other record fits these criteria.');
    expect(RECRUIT_COPY.fewerThanK('5')).toBe('Fewer than 5 records fit these criteria, so nothing is shown.');
  });
});

describe('the search module stays pure', () => {
  const src = readFileSync(new URL('./recruit.ts', import.meta.url), 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  it('imports nothing from src/api or matches/real, makes no network call and loads no file', () => {
    expect(code).not.toMatch(/from\s+['"][^'"]*(\/api|matches\/real)/);
    expect(code).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|import\s*\(|localStorage|sessionStorage|console\./);
    expect(code).not.toMatch(/from\s+['"]\.\.?\//); // not even a sibling: it reads the file it is handed
  });
});
