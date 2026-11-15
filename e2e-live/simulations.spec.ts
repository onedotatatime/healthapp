import type { Page } from '@playwright/test';
import { expect, test, watchNoPost } from './helpers/no-post';

// /simulation and /doctor/simulate on staging after MIN-4603 (MIN-4612). Synthetic data only.
// Expected values come from data/synthetic/simulation.json (the file the build serves), formatted here by the written rule,
// not by importing the app's formatter, so a wrong formatter or a wrong deployed file fails.
// /doctor/simulate is one flow since MIN-4736: "Search the records" replays the recorded run and calls no backend. Its end states are
// in e2e-live/recruit.spec.ts; this file keeps only the 390 px check (W2). helpers/no-post.ts fails any POST after sign-in.
// Run: see playwright.simulation.config.ts. Passcode comes from HEALTHAPP_DEMO_PASSCODE, is never logged.
const PASSCODE = process.env.HEALTHAPP_DEMO_PASSCODE ?? '';

const T = (page: Page, id: string) => page.getByTestId(id);

const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

// The /simulation scenarios of this file (P1 to P4, W1, T1, T2) tested the animated page of MIN-4608 to MIN-4724 (hero card, dot field, 30 s clock, three charts,
// timeline card, Replay). MIN-4749 replaced that page with ONE diagram and a plan-month slider, so those tests and their test ids are removed here and the file
// stays green. The new /simulation scenarios (slider at three months against ten_years, keyboard, 390 px, nothing moves) are E2E's, written against staging
// after the merge. Test ids on the new page: sim-diagram, sim-slider, sim-year, sim-value-{money,income,patients,matches,dx}, sim-formula, sim-plateau, sim-label.

async function signIn(page: Page) {
  await page.goto('/health');
  await expect(page.getByTestId('env'), 'target is not the dev environment').toHaveText('dev', { timeout: 15_000 });
  await page.goto('/login');
  const field = page.getByLabel('Demo passcode');
  const clear = () => field.fill('', { timeout: 2_000 }).catch(() => {});
  try {
    await field.fill(PASSCODE);
    await page.getByTestId('login-doctor').click();
    await clear();
    await page.waitForURL(/\/doctor$/, { timeout: 30_000 });
  } catch {
    await clear();
    throw new Error('sign-in as doctor did not land on /doctor');
  }
}

test.describe('/doctor/simulate (demo doctor)', () => {
  test.skip(!PASSCODE, 'HEALTHAPP_DEMO_PASSCODE not set');

  test('W2 at 390 px, no horizontal overflow before, during and after a full-motion search; no POST', async ({ page, baseURL }, info) => {
    test.skip(info.project.name !== 'phone-390', 'phone project only');
    test.setTimeout(90_000);
    await signIn(page);
    await page.goto('/doctor/simulate');
    await expect(T(page, 'recruit-intro')).toContainText('50,000', { timeout: 30_000 });
    const bad = watchNoPost(page, new URL(baseURL!).origin);
    expect(await overflow(page), 'px of sideways scroll before the search').toBeLessThanOrEqual(0);
    await T(page, 'recruit-input').fill('I want to recruit 40 people matching rheumatoid arthritis for a trial');
    await T(page, 'recruit-submit').click();
    await expect(T(page, 'sim-dots')).toBeVisible({ timeout: 30_000 });
    expect(await overflow(page), 'px of sideways scroll during the search').toBeLessThanOrEqual(0);
    await expect(T(page, 'recruit-line')).toHaveText('Asked 40. Found 40.', { timeout: 60_000 });
    expect(await overflow(page), 'px of sideways scroll at the result').toBeLessThanOrEqual(0);
    expect(bad, 'the page called no backend').toEqual([]);
  });
});
