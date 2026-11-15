import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import runJson from '../../../data/synthetic/run-5000.json';
import { findMatches, parseRun, type RunFile } from './matcher';

const run = (): RunFile => structuredClone(parseRun(runJson));

describe('the matcher equals the Python matcher (the file\'s result block)', () => {
  it('returns the groups, the count, the matched rows and the funnel that match.py wrote', () => {
    const r = run();
    const out = findMatches(r);
    expect(out.match_count).toBe(r.result.match_count);
    expect(out.groups).toEqual(r.result.groups);
    expect(out.matched).toEqual(r.result.matched);
    expect({ ...out.funnel }).toEqual(r.result.funnel);
    // not a tautology: the numbers are the ones the CTO's decision names
    expect(out.funnel).toEqual({ opted_in: 4499, share_min: 6, exact: 5, shown: 5 });
    expect(out.groups[0].pattern).toEqual(['ACE_high', 'cough', 'dry_eyes', 'img_hilar_lymphadenopathy', 'spec_pulmonology']);
  });

  it('never reads the group index: scrambling that column changes nothing', () => {
    const r = run();
    r.records.forEach((rec, i) => { rec[3] = (i * 7) % r.groups.length; });
    expect(findMatches(r)).toEqual(findMatches(run()));
  });

  it('holds the dummy exams only for the matched rows', () => {
    const r = run();
    expect(Object.keys(r.detail).map(Number).sort((a, b) => a - b)).toEqual(r.result.matched);
  });
});

describe('k = 5 and the one empty answer', () => {
  it('a group of 4 gives the one empty answer', () => {
    const r = run();
    r.records[r.result.matched[0]][2] = 0; // one of the 5 withdraws its opt-in: the exact group is now 4
    const out = findMatches(r);
    expect(out.groups).toEqual([]);
    expect(out.match_count).toBe(0);
    expect(out.matched).toEqual([]);
    expect(out.funnel).toMatchObject({ exact: 4, shown: 0 });
  });

  it('is the same empty answer for a persona who has not opted in', () => {
    const r = run();
    r.persona.opt_in = false;
    const out = findMatches(r);
    expect(out).toMatchObject({ match_count: 0, groups: [], matched: [] });
  });

  it('k is the only reason: with k = 4 the group of 4 is shown', () => {
    const r = run();
    r.records[r.result.matched[0]][2] = 0;
    expect(findMatches(r, { k: 4 }).match_count).toBe(4);
  });

  it('needs at least 4 shared codes: with 5 required the sixth-record funnel shrinks', () => {
    const out = findMatches(run(), { minShared: 5 });
    expect(out.funnel.share_min).toBe(5);
    expect(out.match_count).toBe(5);
  });

  it('refuses a file that is not a synthetic run', () => {
    expect(() => parseRun({ synthetic: false })).toThrow();
    expect(() => parseRun(null)).toThrow();
  });
});

describe('the simulate module is offline, except live.ts (MIN-4594, MIN-4675)', () => {
  const dir = __dirname;
  const files = readdirSync(dir).filter((f) => /\.(ts|tsx)$/.test(f) && !f.endsWith('.test.ts'));
  const read = (f: string) => readFileSync(join(dir, f), 'utf8');
  const code = (f: string) => read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1'); // comments out
  const specifiers = (src: string) => [...src.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  const others = files.filter((f) => f !== 'live.ts');

  it('has the files it should', () => {
    expect(files).toEqual(expect.arrayContaining(['matcher.ts', 'Simulate.tsx', 'copy.ts', 'live.ts', 'MachineCard.tsx']));
  });

  it('imports nothing from supabase, matches/real or any URL, in any file', () => {
    for (const f of files) {
      for (const s of specifiers(read(f))) expect(s, `${f} imports ${s}`).not.toMatch(/matches\/real|supabase|^https?:/);
    }
  });

  it('live.ts is the only file that imports from src/api or src/lib/env, and it takes only the session and the env header', () => {
    for (const f of others) {
      for (const s of specifiers(read(f))) expect(s, `${f} imports ${s}`).not.toMatch(/(^|\/)api(\/|$)|lib\/env/);
    }
    expect(specifiers(read('live.ts')).filter((s) => /(^|\/)api(\/|$)|lib\/env/.test(s)).sort()).toEqual(['../../api/authed', '../../api/call', '../../lib/env']);
  });

  it('makes no network call and writes or sends nothing, in any file', () => {
    for (const f of files) {
      expect(code(f), f).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage|sessionStorage|indexedDB|\.rpc\(/);
    }
  });

  it('only live.ts reaches the function, and it reaches exactly one: simulate-live', () => {
    for (const f of others) expect(code(f), f).not.toMatch(/makeStream|authedCall|requestLive|simulate-live/);
    const live = code('live.ts');
    expect(live.match(/makeStream\(/g)).toHaveLength(1);
    expect(live.match(/['"`]simulate-live['"`]/g)).toHaveLength(1);
  });
});
