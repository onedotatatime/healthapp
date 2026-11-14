/** MIN-4516: no patient or doctor screen links to /demo. The only mention of the path in `src` is the route in App.tsx. */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const walk = (d: string): string[] => readdirSync(d).flatMap((n) => {
  const p = join(d, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

describe('/demo is linked from nowhere', () => {
  const files = walk('src').filter((f) => /\.(tsx?|css)$/.test(f) && !f.endsWith('.test.ts'));
  const hits = files.filter((f) => /["'`]\/demo(?:["'`/?#])/.test(readFileSync(f, 'utf8')));
  it('appears only in the route table', () => {
    expect(hits).toEqual(['src/App.tsx']);
  });
  it('the route is a path, never a Link or an anchor', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    expect(app).toMatch(/<Route path="\/demo"/);
    expect(app).not.toMatch(/(?:to|href)=["'{`]*\/demo/);
  });
});
