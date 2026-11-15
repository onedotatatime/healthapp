import { test as base, expect, type BrowserContext, type Page } from '@playwright/test';

// MIN-4743 (one flow, MIN-4736). /doctor/simulate no longer calls any backend: "Search the records" replays the recorded boxd run
// (data/synthetic/recruit-50000.vm.json) and recruit() runs in the browser. Two layers keep it that way:
//   1. `test` (import it from here instead of '@playwright/test') aborts any request to the real healthapp-simulate-live
//      Edge Function (it creates a real boxd machine, MIN-4677) and fails the test after it ends if one was made.
//   2. `watchNoPost(page)` records every request after the call that is not a GET to the app's own origin (data: and blob: ignored).
//      Arm it after sign-in, which itself POSTs to the demo-login function.
const FN = /\/functions\/v1\/[^/?]*simulate-live(\?|$)/;

export async function guardSimulateLive(ctx: BrowserContext): Promise<{ leaks: string[] }> {
  const leaks: string[] = [];
  await ctx.route(FN, (route) => {
    if (route.request().method() !== 'OPTIONS') leaks.push(`${route.request().method()} ${new URL(route.request().url()).pathname}`);
    return route.abort('blockedbyclient');
  });
  return { leaks };
}

/** Requests made from now on that are a POST, or leave the app's origin. The list must stay empty. */
export function watchNoPost(page: Page, appOrigin: string): string[] {
  const bad: string[] = [];
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (u.protocol === 'data:' || u.protocol === 'blob:') return;
    if (r.method() !== 'GET' || u.origin !== appOrigin) bad.push(`${r.method()} ${u.origin}${u.pathname}`);
  });
  return bad;
}

export const test = base.extend<{ simulateLiveGuard: void }>({
  simulateLiveGuard: [
    async ({ context }, use) => {
      const { leaks } = await guardSimulateLive(context);
      await use();
      expect(leaks, 'the page reached the real healthapp-simulate-live (a real boxd machine)').toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };
