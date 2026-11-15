import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COPY } from './copy';
import { ALPHA, SM_FADE_MS, SM_RING_MS, SM_STAGE_MS, cubicBezier, easeInOut, easeOut, fadeAlpha, ringStagger, ringsTotal, stepAt } from './motion';

const read = (f: string) => readFileSync(join(__dirname, f), 'utf8');
const tokens = readFileSync(join(__dirname, '../../styles/tokens.css'), 'utf8');

describe('the step table of the motion spec, section B3 (ms after the dots finish filling in)', () => {
  it('reaches the four stages 1,500 apart, from 400', () => {
    expect([1, 2, 3, 4].map(stepAt)).toEqual([400, 1900, 3400, 4900]);
    expect(SM_STAGE_MS).toBe(1500);
  });
  it('a fade is 600, a ring 300', () => {
    expect(SM_FADE_MS).toBe(600);
    expect(SM_RING_MS).toBe(300);
  });
  it('staggers the rings by min(120, 600 / count) and lands the last one inside the spec window', () => {
    expect(ringStagger(5)).toBe(120);
    expect(ringStagger(10)).toBe(60);
    expect(ringStagger(100)).toBe(6);
    expect(ringStagger(0)).toBe(0);
    expect(ringsTotal(5)).toBeLessThanOrEqual(300 + 600);
    expect(ringsTotal(100)).toBeLessThanOrEqual(300 + 600);
    expect(ringsTotal(0)).toBe(0);
  });
});

describe('easing and alpha', () => {
  const bez = (x1: number, y1: number, x2: number, y2: number, t: number) => {
    const f = (a: number, b: number) => 3 * (1 - t) * (1 - t) * t * a + 3 * (1 - t) * t * t * b + t * t * t;
    return [f(x1, x2), f(y1, y2)] as const; // the parametric curve CSS draws
  };
  it('the JS curves are the CSS tokens: every point of the parametric curve is on the solved one', () => {
    for (const [fn, c] of [[easeInOut, [0.4, 0, 0.2, 1]], [easeOut, [0.22, 1, 0.36, 1]]] as const) {
      for (let t = 0.05; t < 1; t += 0.05) {
        const [x, y] = bez(c[0], c[1], c[2], c[3], t);
        expect(fn(x)).toBeCloseTo(y, 4);
      }
      expect(fn(0)).toBe(0);
      expect(fn(1)).toBe(1);
    }
    expect(tokens).toContain('--ease-inout:cubic-bezier(.4,0,.2,1)');
    expect(tokens).toContain('--ease-out:cubic-bezier(.22,1,.36,1)');
    expect(cubicBezier(0, 0, 1, 1)(0.3)).toBeCloseTo(0.3, 5);
  });
  it('a dot fades from the alpha of its old level to the alpha of its new one', () => {
    expect(fadeAlpha(0, 2, 0)).toBe(ALPHA[0]);
    expect(fadeAlpha(0, 2, 1)).toBeCloseTo(ALPHA[2], 9);
    expect(fadeAlpha(0, 1, 1)).toBeCloseTo(ALPHA[1], 9);
    expect(fadeAlpha(0, 0, 0.5)).toBe(1);
    expect(fadeAlpha(0, 2, 0.5)).toBeCloseTo(0.55, 9);
    expect(easeInOut(0.5)).toBeGreaterThan(0.5); // an ease-in-out that is quick through the middle, as the CSS token is
  });
});

describe('the fixed labels and the reduced-motion rules (MIN-4609, MIN-4736)', () => {
  it('the three labels that stay are word for word', () => {
    expect(COPY.pageLabel).toBe('Seeded synthetic data. Not real patients.');
    expect(COPY.machineLabel('T')).toBe('Recorded run on a boxd machine, T. Replayed here, not live.');
    expect(COPY.machineFallback).toBe('Generated with the same script and seed on a development machine.');
  });
  it('the canvas text changes with every stage, so a screen reader hears what the motion shows', () => {
    const t = [COPY.canvasStage.all, COPY.canvasStage.opted, COPY.canvasStage.fit, COPY.canvasStage.selected, COPY.canvasStage.selectedMany('100')];
    expect(new Set(t).size).toBe(t.length);
    expect(Object.keys(COPY.canvasStage)).toEqual(['all', 'opted', 'fit', 'selected', 'selectedMany']);
  });
  it('no fixed label, and no card that holds one, carries an entry animation', () => {
    const src = read('Simulate.tsx');
    for (const line of src.split('\n').filter((l) => l.includes('sm-fixed') || l.includes('sm-label'))) expect(line).not.toContain('sm-enter');
    for (const line of src.split('\n').filter((l) => l.includes('<section'))) expect(line).not.toContain('sm-enter');
    expect(read('simulate.css')).not.toMatch(/\.sm-(fixed|label|card)[^{]*\{[^}]*animation/);
  });
  it('the strip is an aria-hidden mirror and the tokens collapse the durations under reduced motion', () => {
    expect(read('Simulate.tsx')).toMatch(/className="sm-strip"[\s\S]{0,60}aria-hidden="true"/);
    expect(tokens).toMatch(/prefers-reduced-motion:reduce\)\{\s*:root\{[^}]*--dur-fade:\.01s/);
  });
  it('reduced motion sets the finished state at once and starts no timer', () => {
    const src = read('Simulate.tsx');
    const branch = src.slice(src.indexOf('if (red) {'), src.indexOf("setMachine(machineView(0, false));"));
    expect(branch).toContain('setStep(p.stages.length)');
    expect(branch).toContain("setPhase('done')");
    expect(branch).not.toMatch(/later\(|setTimeout|setInterval|requestAnimationFrame|scrollTo/);
    expect(src).toMatch(/phase !== 'dots' \|\| reduced/); // the page does not scroll by itself
    expect(read('DotCanvas.tsx')).not.toMatch(/setInterval/);
    expect(read('dotPaint.ts')).toMatch(/paintStatic[\s\S]*?cancelAnimationFrame/);
  });
  it('the canvas loop stops itself: a frame loop runs only while a transition or the rings run', () => {
    const src = read('dotPaint.ts');
    expect(src).toMatch(/if \(p < 1\) this\.raf = requestAnimationFrame\(step\)/);
    expect(src).not.toMatch(/setInterval/);
  });
});
