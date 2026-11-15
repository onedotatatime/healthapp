/**
 * Drift guard (MIN-4515): the frontend keeps three copies of Cron's wire shapes (`src/api/contract.ts`,
 * `features/handshake/contract.ts`, `features/assistant/contract.ts`). Cron's file on this branch,
 * `supabase/functions/_shared/contract.ts`, is the source. Every schema a copy shares with it must describe the same
 * JSON (compared as JSON Schema, so formatting and quote style do not matter). The CONTRACT_VERSION named in a copy's
 * header is a label, not a gate: a bump that changes no shape must not block a build.
 * A name that is in a copy but not in Cron's file must be listed in LOCAL_ONLY, so a typo or a stale shape goes red.
 */
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import * as cron from '../../supabase/functions/_shared/contract';
import * as api from './contract';
import * as analysis from '../features/assistant/analysis.contract';
import * as assistant from '../features/assistant/contract';
import * as handshake from '../features/handshake/contract';

/**
 * Frontend-only shapes (a profiles row read under RLS).
 */
const LOCAL_ONLY = new Set(['Profile']);
/**
 * MIN-4665: the diagnoses block is copied from the CTO's decision (MIN-4660 section 5) before Cron's function (MIN-4662)
 * is on this branch. A name listed here that is not yet in his file is skipped; the moment his file has it, it is compared
 * like every other name (and the test below says which are still pending). Remove this set when MIN-4662 has merged.
 */
const PENDING_FROM_CRON = new Set(['DiagnosesRequest', 'DiagnosisStatement', 'DiagnosisItem', 'DiagnosesCounts', 'DiagnosesResponse']);
const isSchema = (v: unknown): v is z.ZodType => !!v && typeof v === 'object' && '_zod' in (v as object);
const json = (s: z.ZodType) => z.toJSONSchema(s, { unrepresentable: 'any', io: 'input' });

const copies = { 'src/api/contract.ts': api, 'handshake/contract.ts': handshake, 'assistant/contract.ts': assistant, 'assistant/analysis.contract.ts': analysis };

describe('frontend contract copies match Cron\'s contract.ts', () => {
  for (const [file, mod] of Object.entries(copies)) {
    it(`${file}: same schemas, no stale names`, () => {
      const stale: string[] = [];
      const differs: string[] = [];
      let compared = 0;
      for (const [name, value] of Object.entries(mod as Record<string, unknown>)) {
        if (!isSchema(value)) continue;
        const theirs = (cron as Record<string, unknown>)[name];
        if (!isSchema(theirs)) {
          if (!LOCAL_ONLY.has(name) && !PENDING_FROM_CRON.has(name)) stale.push(name);
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
});

describe('MIN-4665 diagnoses block', () => {
  it('is compared against Cron\'s file as soon as his file has it', () => {
    const pending = [...PENDING_FROM_CRON].filter((n) => !isSchema((cron as Record<string, unknown>)[n]));
    const present = [...PENDING_FROM_CRON].filter((n) => isSchema((cron as Record<string, unknown>)[n]));
    // Either none of the names is in his file yet (MIN-4662 not merged), or all of them are: half a block is drift.
    expect(pending.length === 0 || present.length === 0, `half of the diagnoses block is in Cron's file: ${present.join()} present, ${pending.join()} missing`).toBe(true);
  });
  it('is strict: an extra key (score, rank, probability) fails the parse', () => {
    const item = { name: 'X', fits: [{ text: 't', cites: ['r:00000000-0000-4000-8000-000000000001'] }], does_not_explain: [], not_in_record: [] };
    expect(analysis.DiagnosisItem.safeParse(item).success).toBe(true);
    for (const k of ['score', 'rank', 'probability']) expect(analysis.DiagnosisItem.safeParse({ ...item, [k]: 1 }).success, k).toBe(false);
  });
});
