/**
 * Build-output check (MIN-4488, PRD 12.6 layer 1): the patient's entry chunks hold no assistant module. It builds the
 * app for real into a temp folder and reads what the entry page loads. The sentinels are strings only the doctor's
 * assistant UI contains; the test also asserts they ARE in some other chunk, so it cannot pass on an empty build.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

const SENTINELS = ['Ask about this patient', 'Not in this record.', 'General medical knowledge, not from this record', 'Could not confirm a source for one statement', 'Straight line through', 'About this file',
  // MIN-4665 Related diagnoses: the fixed banner, the AI line and two state lines only the doctor's view holds
  'For the doctor to evaluate. Not a diagnosis.', 'This list comes from an AI reading this record.', 'Related diagnoses is switched off in this environment.', 'List related diagnoses'];
/** The function name, as the one place that calls it writes it (real.ts: `callFunction('diagnoses', ...)`). It must be in a lazy chunk and in no entry chunk. */
const FN_NAME = /["'`]diagnoses["'`]/;
const out = mkdtempSync(join(tmpdir(), 'healthapp-bundle-'));
afterAll(() => rmSync(out, { recursive: true, force: true }));

describe('patient chunks hold no assistant module (and no Related diagnoses view, MIN-4665)', () => {
  it('keeps the assistant in a lazy chunk, away from every chunk the entry page loads', () => {
    execFileSync('npx', ['vite', 'build', '--outDir', out, '--emptyOutDir', '--logLevel', 'error'], { stdio: 'pipe' });
    const html = readFileSync(join(out, 'index.html'), 'utf8');
    const entry = [...html.matchAll(/(?:src|href)="\/(assets\/[^"]+\.js)"/g)].map((m) => m[1]); // script + modulepreload
    expect(entry.length).toBeGreaterThan(0);
    const all = readdirSync(join(out, 'assets')).filter((f) => f.endsWith('.js'));
    const read = (f: string) => readFileSync(join(out, f.startsWith('assets/') ? f : `assets/${f}`), 'utf8');
    for (const s of SENTINELS) {
      for (const f of entry) expect(read(f).includes(s), `"${s}" found in entry chunk ${f}`).toBe(false);
      const holders = all.filter((f) => read(f).includes(s));
      expect(holders.length, `${s} is in no chunk: the sentinel is stale`).toBeGreaterThan(0);
      expect(holders.every((f) => !entry.includes(`assets/${f}`))).toBe(true);
    }
    // MIN-4665: the function name is called from one lazy chunk (the doctor's), never from an entry chunk
    for (const f of entry) expect(FN_NAME.test(read(f)), `the function name "diagnoses" is called from entry chunk ${f}`).toBe(false);
    const callers = all.filter((f) => FN_NAME.test(read(f)));
    expect(callers.length, 'the function name is in no chunk: the check is stale').toBeGreaterThan(0);
    expect(callers.every((f) => !entry.includes(`assets/${f}`))).toBe(true);
    // the synthetic record stays out of the entry chunk too
    for (const f of entry) expect(read(f).includes('Synthetic Diagnostic Lab'), `synthetic record in entry chunk ${f}`).toBe(false);
  }, 120_000);
});
