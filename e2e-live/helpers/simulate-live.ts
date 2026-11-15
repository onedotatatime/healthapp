import { test as base, expect, type BrowserContext, type Page, type Route } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// MIN-4677. The Run click on /doctor/simulate POSTs to the Edge Function `healthapp-simulate-live`, which creates a REAL boxd
// machine (MIN-4674, MIN-4675). No browser spec may ever reach it. Two layers:
//   1. `test` (import it from here instead of '@playwright/test') installs a guard on every test: any request to
//      simulate-live that no `mockSimulateLive` answered is aborted, recorded, and fails the test after it ends.
//   2. `mockSimulateLive(page, ...)` answers the POST with an NDJSON stream that follows the contract on MIN-4670:
//      start, four phase lines (done carries the run), end. The run is the recorded file the page already ships, so the
//      funnel the specs assert (4,499 / 6 / 5 / 5) is unchanged.
// A real machine is only ever created by hand, on staging-dev, and counted in the daily cap (MIN-4670 section 4).
const FN = /\/functions\/v1\/[^/?]*simulate-live(\?|$)/;
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
};

export const MOCK_START_AT = '2026-11-15T09:30:12Z'; // formatRunTime -> "15 Nov 2026, 09:30 UTC"
export const MOCK_LIVE_LABEL = 'Live run on a boxd machine, started 15 Nov 2026, 09:30 UTC. Not a replay. Synthetic data.';

export type SimulateLiveMode = 'live' | 'off' | 'busy' | 'cap' | 'timeout' | 'error' | 'http500';

let runFile: { vm: unknown } | null = null;
const recorded = () => (runFile ??= JSON.parse(readFileSync(path.resolve('data/synthetic/run-5000.json'), 'utf8')));

/** The NDJSON body for one mode. Pure, so a spec can read what the mock sent. */
export function simulateLiveBody(mode: SimulateLiveMode): string {
  const at = (s: number) => new Date(Date.parse(MOCK_START_AT) + s * 1000).toISOString().replace('.000Z', 'Z');
  const line = (o: unknown) => JSON.stringify(o) + '\n';
  if (mode === 'live') {
    const run = recorded();
    return (
      line({ t: 'start', machine: 'healthapp-sim-20261115-093012', at: MOCK_START_AT }) +
      line({ t: 'phase', id: 'created', at: at(0.5), seconds: 0.5 }) +
      line({ t: 'phase', id: 'running', at: at(1) }) +
      line({ t: 'phase', id: 'done', at: at(2.4), seconds: 1.4, sha256: 'mock', run }) +
      line({ t: 'phase', id: 'deleted', at: at(2.7), seconds: 0.3 }) +
      line({ t: 'end', live: true, vm: run.vm })
    );
  }
  return line({ t: 'end', live: false, reason: mode });
}

export interface SimulateLiveMock {
  /** POSTs the mock answered. One per Run click. */
  calls: () => number;
}

/** Answers every simulate-live request of this page with the mock. Register before the Run click. */
export async function mockSimulateLive(page: Page, mode: SimulateLiveMode = 'live'): Promise<SimulateLiveMock> {
  let n = 0;
  await page.route(FN, async (route: Route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    n++;
    if (mode === 'http500') return route.fulfill({ status: 500, headers: { ...CORS, 'content-type': 'application/json' }, body: '{"error":"mock"}' });
    return route.fulfill({ status: 200, headers: { ...CORS, 'content-type': 'application/x-ndjson' }, body: simulateLiveBody(mode) });
  });
  return { calls: () => n };
}

/** Aborts and records any simulate-live request that reaches it. Page routes (the mock) win over this context route. */
export async function guardSimulateLive(ctx: BrowserContext): Promise<{ leaks: string[] }> {
  const leaks: string[] = [];
  await ctx.route(FN, (route) => {
    if (route.request().method() !== 'OPTIONS') leaks.push(`${route.request().method()} ${new URL(route.request().url()).pathname}`);
    return route.abort('blockedbyclient');
  });
  return { leaks };
}

export const test = base.extend<{ simulateLiveGuard: void }>({
  simulateLiveGuard: [
    async ({ context }, use) => {
      const { leaks } = await guardSimulateLive(context);
      await use();
      expect(leaks, 'a Run click reached the real healthapp-simulate-live (a real boxd machine): mock it with mockSimulateLive').toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };
