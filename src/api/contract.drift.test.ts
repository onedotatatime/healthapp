/**
 * Drift guard (MIN-4515): the frontend keeps three copies of Cron's wire shapes (`src/api/contract.ts`,
 * `features/handshake/contract.ts`, `features/assistant/contract.ts`). Cron's file on this branch,
 * `supabase/functions/_shared/contract.ts`, is the source. Every schema a copy shares with it must describe the same
 * JSON (compared as JSON Schema, so formatting and quote style do not matter), and the version string must match.
 * A name that is in a copy but not in Cron's file must be listed in LOCAL_ONLY, so a typo or a stale shape goes red.
 */
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import * as cron from '../../supabase/functions/_shared/contract';
import * as api from './contract';
import * as assistant from '../features/assistant/contract';
import * as handshake from '../features/handshake/contract';

/** Frontend-only shapes (a profiles row read under RLS). */
const LOCAL_ONLY = new Set(['Profile']);
const isSchema = (v: unknown): v is z.ZodType => !!v && typeof v === 'object' && '_zod' in (v as object);
const json = (s: z.ZodType) => z.toJSONSchema(s, { unrepresentable: 'any', io: 'input' });

const copies = { 'src/api/contract.ts': api, 'handshake/contract.ts': handshake, 'assistant/contract.ts': assistant };

describe('frontend contract copies match Cron\'s contract.ts', () => {
  it('has a CONTRACT_VERSION to compare', () => {
    expect(typeof (cron as Record<string, unknown>).CONTRACT_VERSION).toBe('string');
  });
  for (const [file, mod] of Object.entries(copies)) {
    it(`${file}: same schemas, no stale names`, () => {
      const stale: string[] = [];
      const differs: string[] = [];
      let compared = 0;
      for (const [name, value] of Object.entries(mod as Record<string, unknown>)) {
        if (!isSchema(value)) continue;
        const theirs = (cron as Record<string, unknown>)[name];
        if (!isSchema(theirs)) {
          if (!LOCAL_ONLY.has(name)) stale.push(name);
          continue;
        }
        compared++;
        if (JSON.stringify(json(value)) !== JSON.stringify(json(theirs))) differs.push(name);
      }
      expect(compared, `${file} shares no schema with Cron's file: the test is not comparing anything`).toBeGreaterThan(0);
      expect(stale, `in ${file} but not in supabase/functions/_shared/contract.ts: remove, or add to LOCAL_ONLY`).toEqual([]);
      expect(differs, `${file} differs from Cron's contract.ts: copy his shape, do not edit the copy`).toEqual([]);
    });
  }
  it('every copy states the same CONTRACT_VERSION as Cron\'s file', async () => {
    const { readFileSync } = await import('node:fs');
    const v = (cron as unknown as Record<string, string>).CONTRACT_VERSION;
    for (const f of ['src/api/contract.ts', 'src/features/handshake/contract.ts', 'src/features/assistant/contract.ts']) {
      const t = readFileSync(f, 'utf8');
      const m = t.match(/CONTRACT_VERSION[\s*]+(\d{4}-\d{2}-\d{2}\.\d+)/);
      expect(m?.[1], `${f} names the version it was copied from`).toBe(v);
    }
  });
});
