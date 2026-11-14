/**
 * Guards for the token layer (MIN-4587, CTO decision on MIN-4589). A custom property that is used and not defined fails
 * silently in a browser (no radius, no gap, no colour) and no other test sees it, so this reads the real files.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const walk = (d: string): string[] => readdirSync(d).flatMap((n) => {
  const p = join(d, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const src = walk('src').filter((f) => /\.(css|tsx?)$/.test(f) && !/\.test\.ts$/.test(f));
const text = (f: string) => readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''); // comments out: they name the rules they follow
const brand = readFileSync('docs/brand/tokens.css', 'utf8');
const app = readFileSync('src/styles/tokens.css', 'utf8');
const defined = (s: string) => new Set([...s.matchAll(/(?:^|[;{\s])(--[A-Za-z0-9_-]+)\s*:/g)].map((m) => m[1]));

describe('one token source', () => {
  it('every custom property used in src is defined in the brand file or the app role file', () => {
    const known = new Set([...defined(brand), ...defined(app)]);
    const local = new Set(src.flatMap((f) => [...text(f).matchAll(/(?:^|[;{\s"'])(--[A-Za-z0-9_-]+)\s*:/g)].map((m) => m[1])));
    const used = new Map<string, string>();
    for (const f of src) for (const m of text(f).matchAll(/var\((--[A-Za-z0-9_-]+)/g)) used.set(m[1]!, f);
    const missing = [...used].filter(([name]) => !known.has(name) && !local.has(name)).map(([name, f]) => `${name} (first seen in ${f})`);
    expect(missing, `used but undefined: ${missing.join(', ')}`).toEqual([]);
  });

  it('the app role file holds no colour value of its own: the brand file is the only place a brand value is defined', () => {
    const body = app.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(body.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g) ?? []).toEqual([]);
  });

  it('main.tsx imports the brand file before the app tokens', () => {
    const main = text('src/main.tsx');
    const brandAt = main.indexOf("../docs/brand/tokens.css");
    expect(brandAt).toBeGreaterThan(-1);
    expect(brandAt).toBeLessThan(main.indexOf("./styles/tokens.css"));
  });
});

describe('glass rules', () => {
  // Blur only on chrome: the surfaces content scrolls under. Cards and list rows have no blur.
  const CHROME = ['.navbar', '.tabbar', '.sheet', '.signin', '.timer', '.hs-entry'];
  const blurRules = src.filter((f) => f.endsWith('.css')).flatMap((f) =>
    [...text(f).matchAll(/([^{}]+)\{([^{}]*backdrop-filter[^{}]*)\}/g)].map((m) => ({ f, selector: m[1]!.trim(), body: m[2]! })),
  );

  it('backdrop-filter appears on chrome only', () => {
    expect(blurRules.length).toBeGreaterThan(0);
    for (const r of blurRules.filter((x) => !/(^|[;\s])backdrop-filter:none/.test(x.body))) expect(CHROME, `${r.selector} in ${r.f} has a backdrop-filter`).toContain(r.selector);
  });

  it('every backdrop-filter is written with the -webkit- prefix first, from the glass token, and never animated', () => {
    for (const r of blurRules) {
      const webkitAt = r.body.indexOf('-webkit-backdrop-filter:var(--glass-filter)');
      const plainAt = r.body.search(/(?<!-webkit-)backdrop-filter:var\(--glass-filter\)/);
      if (r.body.includes('backdrop-filter:none')) continue; // a rule that switches blur off
      expect(webkitAt, `${r.selector}: -webkit- missing`).toBeGreaterThan(-1);
      expect(plainAt, `${r.selector}: plain property missing`).toBeGreaterThan(webkitAt);
      expect(r.body, `${r.selector} transitions the blur`).not.toMatch(/transition:[^;]*(backdrop-filter|all)/);
    }
  });

  it('the ambient ground is a fixed layer, never background-attachment: fixed', () => {
    for (const f of src.filter((x) => x.endsWith('.css'))) expect(text(f), f).not.toMatch(/background-attachment:\s*fixed/);
  });

  it('nothing translucent is drawn over the camera, a photo or the QR card', () => {
    for (const f of src.filter((x) => x.endsWith('.css'))) {
      for (const m of text(f).matchAll(/([^{}]*(?:\.hs-scan video|\.thumb|\.photo img|\.hs-card)[^{}]*)\{([^{}]*)\}/g)) {
        expect(m[2], `${m[1]!.trim()} in ${f}`).not.toMatch(/--glass-|backdrop-filter|rgba\(/);
      }
    }
  });
});
