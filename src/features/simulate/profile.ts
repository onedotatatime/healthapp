/**
 * The profiles of the selected records and what they have in common (MIN-4756, CTO decision on MIN-4737). Pure: no DOM, no network.
 * Synthetic data only. Everything here is computed from `res.rows`, the rows recruit() selected at this click, never typed, never read
 * from the file's `expected` block.
 *
 * A record is shown as "Record n": n is its position in this selection. The file's row index is never printed, never an attribute,
 * never a test id; it is read here to find the row and goes no further.
 */
import { RECRUIT_COPY as T } from './copy';
import { codeLabel, countryName } from './format';
import type { RecruitCondition, RecruitFile } from './recruit';

/** The first cards shown, and how many one click adds. */
export const CARDS_FIRST = 20;
export const CARDS_STEP = 100;

export const isSpecialty = (code: string) => code.startsWith('spec_');

/** The one place a code becomes words on a profile or in the common lines. A specialty reads as a field on the record, never as a finding. */
export const codeText = (code: string) => (isSpecialty(code) ? T.specialtyOn(codeLabel(code)) : codeLabel(code));

/**
 * The order of a record's codes, as a rank per code index of the file: the criteria first (every `must` in the condition's order, then
 * every `some`), then the other codes in the file's order, the specialty codes last.
 */
export function rankOf(file: RecruitFile, cond: RecruitCondition): Int32Array {
  const rank = new Int32Array(file.codes.length);
  const index = new Map(file.codes.map((c, i) => [c, i]));
  file.codes.forEach((code, i) => { rank[i] = 2_000 + i + (isSpecialty(code) ? 1_000 : 0); });
  [...cond.must, ...cond.some].forEach((code, k) => {
    const i = index.get(code);
    if (i !== undefined) rank[i] = k;
  });
  return rank;
}

export interface Profile {
  /** The position in this selection, from 1. Not the file's row. */
  position: number;
  country: string;
  ageBand: string;
  /** Every code of the record, in the order above. Raw codes: the view turns each into words with `codeText`. */
  codes: string[];
}

/** One function per search: it turns a (position, file row) into a profile. */
export function profileBuilder(file: RecruitFile, cond: RecruitCondition): (position: number, row: number) => Profile {
  const rank = rankOf(file, cond);
  return (position, row) => {
    const rec = file.records[row];
    const idx = [...rec[3]].sort((a, b) => rank[a] - rank[b]);
    return { position, country: countryName(rec[0]), ageBand: file.age_bands[rec[1]], codes: idx.map((i) => file.codes[i]) };
  };
}

/** Every selected record's profile, in picking order (`rows` is recruit()'s order). */
export function profiles(file: RecruitFile, cond: RecruitCondition, rows: number[]): Profile[] {
  const build = profileBuilder(file, cond);
  return rows.map((row, i) => build(i + 1, row));
}

export interface Common {
  /** The number of selected records the counts are over. */
  n: number;
  /** Codes held by every selected record, the criteria first. */
  all: string[];
  /** Codes held by at least half of them but not all, most first, ties in the file's code order. */
  half: { code: string; count: number }[];
  /** How many selected records sit in each age band, in the file's band order. Bands with none are left out. */
  bands: { band: string; count: number }[];
}

/**
 * What the selected records share. Counted once, over every selected row (not only the cards on screen). Null under two records:
 * one record has nothing to share with itself. "At least half" is count*2 >= n, so a code held by exactly half counts.
 */
export function commonOf(file: RecruitFile, cond: RecruitCondition, rows: number[]): Common | null {
  const n = rows.length;
  if (n < 2) return null;
  const count = new Int32Array(file.codes.length);
  const band = new Int32Array(file.age_bands.length);
  for (const row of rows) {
    const rec = file.records[row];
    band[rec[1]]++;
    for (const c of rec[3]) count[c]++;
  }
  const rank = rankOf(file, cond);
  const all: number[] = [];
  const half: number[] = [];
  count.forEach((c, i) => {
    if (c === n) all.push(i);
    else if (c * 2 >= n) half.push(i);
  });
  all.sort((a, b) => rank[a] - rank[b]);
  half.sort((a, b) => count[b] - count[a] || a - b);
  return {
    n,
    all: all.map((i) => file.codes[i]),
    half: half.map((i) => ({ code: file.codes[i], count: count[i] })),
    bands: file.age_bands.map((b, i) => ({ band: b, count: band[i] })).filter((b) => b.count > 0),
  };
}

/** The next click adds this many: a hundred, or what is left. 0 when every card is already shown. */
export const moreStep = (shown: number, total: number) => Math.max(0, Math.min(CARDS_STEP, total - shown));
