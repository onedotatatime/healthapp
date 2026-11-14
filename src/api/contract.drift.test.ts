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
 * Frontend-only shapes (a profiles row read under RLS), plus the ones I wrote from the CTO decision on MIN-4548 before
 * Cron posted his (MIN-4549 `file_analysis`, MIN-4551 `healthapp-over-time`). When his `contract.ts` has a name below it is
 * compared like every other shape, and a difference goes red: then copy his shape and delete the name from this list.
 */
const LOCAL_ONLY = new Set([
  'Profile',
  'FileDocType', 'FileItem', 'FileAnalysisRow',
  'OverTimeRequest', 'OverTimePoint', 'Projection', 'OverTimeSeries', 'OverTimeCounts', 'OverTimeResponse',
]);
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
});
