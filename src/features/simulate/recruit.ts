/**
 * The recruitment search of /doctor/simulate (MIN-4706, built under MIN-4711). Pure: no network, no import from src/api, no model.
 * Synthetic data only. The sentence a doctor types is read by a fixed parser (a number and one condition from a list of 13) and the
 * search runs over the 50,000 seeded synthetic records of data/synthetic/recruit-50000.json, made ahead of time by Python.
 *
 * The recruitment rule (CTO, MIN-4706 section 3): eligible = opted in + every `must` code + at least `min_some` of the `some` codes.
 * Codes only: the search never reads a name, an ID or a group (the file has no group column).
 *   - Rule of five: 0 to 4 eligible records answer `{ shown: false }`. No count, no countries, one answer for "none" and "fewer than 5".
 *   - Picking rule: the first min(asked, eligible) eligible rows in FILE ORDER. The generator shuffled the rows, so this is a seeded
 *     sample, never a random pick. No number (or 0) selects every eligible record. Asked above eligible selects all of them, no padding.
 * scripts/synthetic/recruit.py `recruit()` is the reference. recruit.test.ts holds this module to the file's `expected` block.
 */

/** The file's row: [country, index into `age_bands`, opted in 0|1, indexes into `codes`]. */
export type RecruitRow = [string, number, number, number[]];

export interface RecruitCondition {
  id: string;
  name: string;
  /** Already normalised (lower case, no punctuation). The name is also one of them. */
  synonyms: string[];
  must: string[];
  some: string[];
  min_some: number;
}

export type RecruitExpected = { shown: true; eligible: number; countries: string[] } | { shown: false };

export interface RecruitFile {
  synthetic: true;
  label: string;
  seed: number;
  n: number;
  k: number;
  opted_in: number;
  codes: string[];
  age_bands: string[];
  records: RecruitRow[];
  conditions: RecruitCondition[];
  expected: Record<string, RecruitExpected>;
  made: { where: string; script_sha256?: Record<string, string> };
}

const isStrings = (x: unknown): x is string[] => Array.isArray(x) && x.every((s) => typeof s === 'string');

/** Checks the shape the search relies on. Throws on anything else, so the page shows one error sentence instead of a wrong count. */
export function parseRecruitFile(json: unknown): RecruitFile {
  const f = json as Partial<RecruitFile> | null;
  if (!f || typeof f !== 'object' || f.synthetic !== true) throw new Error('recruit file: not a synthetic file');
  if (typeof f.n !== 'number' || typeof f.k !== 'number' || !isStrings(f.codes) || !isStrings(f.age_bands)) throw new Error('recruit file: bad header');
  if (!Array.isArray(f.records) || f.records.length !== f.n) throw new Error('recruit file: n does not match the records');
  if (!Array.isArray(f.conditions) || f.conditions.length === 0) throw new Error('recruit file: no conditions');
  if (!f.made || typeof f.made.where !== 'string') throw new Error('recruit file: no made block');
  const known = new Set(f.codes);
  for (const c of f.conditions) {
    if (!c || typeof c.id !== 'string' || !isStrings(c.synonyms) || !isStrings(c.must) || !isStrings(c.some) || typeof c.min_some !== 'number') throw new Error('recruit file: bad condition');
    if (![...c.must, ...c.some].every((code) => known.has(code))) throw new Error(`recruit file: unknown code in ${c.id}`);
  }
  return f as RecruitFile;
}

// ---------------------------------------------------------------------------------------------------------------- the sentence

/** Step 1: lower case, apostrophes and punctuation out, spaces collapsed. A comma between digit groups ("1,000") is a thousands mark and goes first. */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/(?<=\d),(?=\d{3}(?!\d))/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export type ParsedRequest =
  | { kind: 'empty' }
  | { kind: 'no_condition' }
  /** A number above the records in the file. No search runs. */
  | { kind: 'too_many'; condition: RecruitCondition; asked: number }
  /** `asked` is null for no number and for 0. `others` are conditions of the same sentence that were not used (one condition per search). */
  | { kind: 'ok'; condition: RecruitCondition; asked: number | null; others: RecruitCondition[] };

interface Hit { cond: RecruitCondition; len: number; start: number; end: number }

/**
 * Steps 2 to 5 of the CTO's parser. Whole-word match of every synonym; the longest match wins, then the earliest. The matched span is
 * cut out and the first integer of the rest is the number ("type 2 diabetes" carries a digit, so the condition goes first).
 * No condition: no guess and no fuzzy match. `max` is the number of records in the file; a larger number is `too_many`.
 */
export function parseRequest(text: string, conditions: RecruitCondition[], max = Infinity): ParsedRequest {
  const norm = normalise(text);
  if (!norm) return { kind: 'empty' };
  const padded = ` ${norm} `;
  const hits: Hit[] = [];
  for (const cond of conditions) {
    for (const raw of cond.synonyms) {
      const syn = normalise(raw);
      if (!syn) continue;
      const needle = ` ${syn} `;
      for (let at = padded.indexOf(needle); at !== -1; at = padded.indexOf(needle, at + 1)) {
        hits.push({ cond, len: syn.length, start: at + 1, end: at + 1 + syn.length });
      }
    }
  }
  if (hits.length === 0) return { kind: 'no_condition' };
  const win = hits.reduce((best, h) => (h.len > best.len || (h.len === best.len && h.start < best.start) ? h : best));
  const others: RecruitCondition[] = [];
  for (const h of hits) {
    const overlaps = h.start < win.end && win.start < h.end;
    if (h.cond.id !== win.cond.id && !overlaps && !others.some((o) => o.id === h.cond.id)) others.push(h.cond);
  }
  const rest = `${padded.slice(0, win.start)} ${padded.slice(win.end)}`;
  const digits = /\d+/.exec(rest)?.[0];
  const n = digits === undefined ? 0 : Number(digits);
  if (n > max) return { kind: 'too_many', condition: win.cond, asked: n };
  return { kind: 'ok', condition: win.cond, asked: n > 0 ? n : null, others };
}

// ---------------------------------------------------------------------------------------------------------------- the search

export type RecruitResult =
  | { shown: false }
  | {
      shown: true;
      /** Records that fit the criteria (opted in, every must, enough of some). The funnel's third count. */
      eligible: number;
      asked: number | null;
      /** The funnel's fourth count: min(asked, eligible), or every eligible record when no number was asked. */
      selected: number;
      /** asked - eligible when the request is larger than what exists, else 0. */
      short: number;
      /** Sorted codes of the selected rows. */
      countries: string[];
      /** The selected rows, as indexes into `records`, in file order. */
      rows: number[];
      /** The funnel's first two counts, counted at this search: every record, and the ones that opted in. */
      records: number;
      optedIn: number;
    };

/** `asked` null or 0 = no number. Computed at every call: nothing here is cached, typed or read from the file's `expected`. */
export function recruit(file: RecruitFile, cond: RecruitCondition, asked: number | null, k: number = file.k): RecruitResult {
  const index = new Map(file.codes.map((c, i) => [c, i]));
  const idx = (c: string) => {
    const i = index.get(c);
    if (i === undefined) throw new Error(`unknown code ${c}`);
    return i;
  };
  const must = cond.must.map(idx);
  const isSome = new Uint8Array(file.codes.length);
  for (const c of cond.some) isSome[idx(c)] = 1;
  const isMust = new Uint8Array(file.codes.length);
  for (const m of must) isMust[m] = 1;
  const rows: number[] = [];
  let optedIn = 0;
  for (let i = 0; i < file.records.length; i++) {
    const rec = file.records[i];
    if (!rec[2]) continue; // opt-in first: a record that did not opt in is never compared
    optedIn++;
    let m = 0;
    let s = 0;
    for (const c of rec[3]) {
      if (isMust[c]) m++;
      if (isSome[c]) s++;
    }
    if (m === must.length && s >= cond.min_some) rows.push(i);
  }
  if (rows.length < k) return { shown: false };
  const take = asked ? rows.slice(0, asked) : rows;
  return {
    shown: true,
    eligible: rows.length,
    asked: asked || null,
    selected: take.length,
    short: asked ? Math.max(0, asked - rows.length) : 0,
    countries: [...new Set(take.map((i) => file.records[i][0]))].sort(),
    rows: take,
    records: file.records.length,
    optedIn,
  };
}
