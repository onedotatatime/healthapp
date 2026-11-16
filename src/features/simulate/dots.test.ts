import { describe, expect, it } from 'vitest';
import recruitJson from '../../../data/synthetic/recruit-50000.json';
import {
  ELIGIBLE, OPTED, RING_MAX, SELECTED, STAGE_IDS, brightFraction, centres, geometryFor, groupAlpha, groupsFor, lookAt, pitchFor, seededRandom,
  sideOf, slotOrder, stageOfStep, type StageId,
} from './dots';
import { prepare, search, type OkRequest } from './flow';
import { ALPHA } from './motion';
import { parseRecruitFile, recruit } from './recruit';

const FILE = parseRecruitFile(structuredClone(recruitJson));
const N = FILE.n;

describe('the pitch table of the CTO', () => {
  it('1.5 px under 520, 2 px from 520 to 899, 3 px from 900', () => {
    expect([330, 519].map(pitchFor)).toEqual([1.5, 1.5]);
    expect([520, 768, 899].map(pitchFor)).toEqual([2, 2, 2]);
    expect([900, 1100, 1240].map(pitchFor)).toEqual([3, 3, 3]);
  });
  it('the field is about 400 px tall on a phone and about 460 px on a 1280 px window, and holds every dot', () => {
    const phone = geometryFor(330, N);
    const desktop = geometryFor(1040, N); // the page column at a 1280 px window
    expect(phone.height).toBeGreaterThan(330);
    expect(phone.height).toBeLessThan(420);
    expect(desktop.height).toBeGreaterThan(430);
    expect(desktop.height).toBeLessThan(500);
    for (const g of [phone, desktop]) expect(g.cols * g.rows).toBeGreaterThanOrEqual(N);
  });
});

describe('positions: seeded Fisher-Yates, so a dot\'s place means nothing', () => {
  const slot = slotOrder(N, FILE.seed);
  it('is a permutation of every cell, once each', () => {
    const seen = new Uint8Array(N);
    slot.forEach((s) => { seen[s]++; });
    expect(seen.every((x) => x === 1)).toBe(true);
  });
  it('is the same for the same seed and different for another', () => {
    expect([...slotOrder(N, FILE.seed).slice(0, 50)]).toEqual([...slot.slice(0, 50)]);
    expect([...slotOrder(N, FILE.seed + 1).slice(0, 50)]).not.toEqual([...slot.slice(0, 50)]);
  });
  it('is shuffled: file order does not follow the grid, and the seeded generator is stable', () => {
    let fixed = 0;
    slot.forEach((s, i) => { if (s === i) fixed++; });
    expect(fixed).toBeLessThan(20); // a random permutation of 50,000 has one fixed point on average
    const r = seededRandom(1);
    const first = [r(), r(), r()];
    const r2 = seededRandom(1);
    expect([r2(), r2(), r2()]).toEqual(first);
    expect(first.every((x) => x >= 0 && x < 1)).toBe(true);
  });
  it('no two records share a pixel, at every pitch and pixel ratio', () => {
    for (const [w, dpr] of [[330, 1], [330, 2], [700, 2], [1240, 1], [1240, 2]] as const) {
      const g = geometryFor(w, N);
      const { xs, ys } = centres(g, slot, dpr);
      const seen = new Set<number>();
      for (let i = 0; i < N; i++) seen.add(xs[i] * 100000 + ys[i]);
      expect(seen.size, `${w} px at ${dpr}x`).toBe(N);
      expect(Math.max(...xs)).toBeLessThan(Math.ceil(w * dpr));
    }
  });
  it('a dot is at least one pixel and the enlarged ones are bigger', () => {
    const g = geometryFor(330, N);
    expect(sideOf(g, 1, 1)).toBeGreaterThanOrEqual(1);
    expect(sideOf(g, 2, 2)).toBeGreaterThan(sideOf(g, 1, 2));
    expect(sideOf(g, 3, 2)).toBeGreaterThan(sideOf(g, 2, 2));
  });
});

const cond = (id: string) => FILE.conditions.find((c) => c.id === id)!;
const prep = (id: string, asked: number | null) => {
  const parsed: OkRequest = { kind: 'ok', condition: cond(id), asked, others: [] };
  return prepare(FILE, parsed, search(FILE, parsed));
};

describe('what a dot looks like at each stage', () => {
  it('all bright; opted in bright, the rest faded; fit bright and twice the size; selected bright, the rest of the fitting ones mid', () => {
    expect(lookAt('all', 0, false)).toEqual({ level: 0, size: 1 });
    expect(lookAt('opted', OPTED, false)).toEqual({ level: 0, size: 1 });
    expect(lookAt('opted', 0, false)).toEqual({ level: 2, size: 1 });
    expect(lookAt('fit', OPTED | ELIGIBLE, false)).toEqual({ level: 0, size: 2 });
    expect(lookAt('fit', OPTED, false)).toEqual({ level: 2, size: 1 });
    expect(lookAt('selected', OPTED | ELIGIBLE | SELECTED, false)).toEqual({ level: 0, size: 2 });
    expect(lookAt('selected', OPTED | ELIGIBLE | SELECTED, true)).toEqual({ level: 0, size: 3 });
    expect(lookAt('selected', OPTED | ELIGIBLE, false)).toEqual({ level: 1, size: 2 });
    expect(lookAt('selected', OPTED, false)).toEqual({ level: 2, size: 1 });
    expect([ALPHA[0], ALPHA[1], ALPHA[2]]).toEqual([1, 0.45, 0.1]);
  });

  it('the bright rows at every stage are the rows recruit() counted, for all 13 conditions', () => {
    for (const c of FILE.conditions) {
      const p = prep(c.id, 40);
      const fresh = recruit(FILE, c, 40);
      const bright = (stage: StageId) => groupsFor(stage, stage, p.cls, p.many).filter((g) => g.to === 0).flatMap((g) => g.rows).sort((a, b) => a - b);
      expect(bright('all'), c.id).toHaveLength(N);
      expect(bright('opted'), c.id).toHaveLength(p.optedIn);
      if (!fresh.shown) continue; // under 5 the later stages are never drawn
      expect(bright('fit'), c.id).toHaveLength(fresh.eligible);
      expect(bright('selected'), c.id).toEqual([...fresh.rows].sort((a, b) => a - b));
    }
  });

  it('a transition is at most three groups, so a fade frame is at most three drawImage calls, for every condition and every stage', () => {
    for (const c of FILE.conditions) {
      for (const asked of [40, null]) {
        const p = prep(c.id, asked);
        for (let i = 0; i < p.stages.length; i++) {
          const g = groupsFor(i === 0 ? null : p.stages[i - 1], p.stages[i], p.cls, p.many);
          expect(g.length, `${c.id} ${asked} -> ${p.stages[i]}`).toBeLessThanOrEqual(3);
          expect(g.reduce((n, x) => n + x.rows.length, 0)).toBe(N); // every dot is in exactly one group
        }
      }
    }
  });

  it('the dim dots are drawn first, so a bright one is never covered', () => {
    const p = prep('rheumatoid_arthritis', 40);
    const g = groupsFor('fit', 'selected', p.cls, p.many);
    expect(g[g.length - 1]).toMatchObject({ from: 0, to: 0 });
    expect(g[0].to).toBe(2);
  });

  it('a fade runs from the alpha of the old level to the alpha of the new one', () => {
    expect(groupAlpha({ from: 0, to: 2 }, 0)).toBe(1);
    expect(groupAlpha({ from: 0, to: 2 }, 1)).toBeCloseTo(0.1, 9);
    expect(groupAlpha({ from: 0, to: 1 }, 1)).toBeCloseTo(0.45, 9);
    expect(groupAlpha({ from: 0, to: 0 }, 0.5)).toBe(1);
  });
});

describe('stages and the bar', () => {
  it('step 0 and 1 show "all", then one stage per step', () => {
    expect([0, 1, 2, 3, 4, 5].map(stageOfStep)).toEqual(['all', 'all', 'opted', 'fit', 'selected', 'selected']);
    expect(STAGE_IDS).toEqual(['all', 'opted', 'fit', 'selected']);
  });
  it('the bar is the share still bright, from the counts of this search', () => {
    const p = prep('rheumatoid_arthritis', 40);
    const c = p.counts!;
    expect([...STAGE_IDS].map((s) => brightFraction(s, c, p.optedIn, N))).toEqual([1, c.optedIn / N, c.eligible / N, c.selected / N]);
    const w = [...STAGE_IDS].map((s) => brightFraction(s, c, p.optedIn, N));
    expect(w[0]).toBeGreaterThan(w[1]);
    expect(w[1]).toBeGreaterThan(w[2]);
    expect(w[2]).toBeGreaterThan(w[3]);
    // under 5 the bar stays at the opted-in width
    const few = prep('rare_myopathy', 40);
    expect(brightFraction('opted', null, few.optedIn, N)).toBe(few.optedIn / N);
  });
  it('rings are for 100 selected or fewer', () => {
    expect(RING_MAX).toBe(100);
  });
});
