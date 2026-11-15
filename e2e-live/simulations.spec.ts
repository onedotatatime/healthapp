import type { Page } from '@playwright/test';
import { expect, mockSimulateLive, test } from './helpers/simulate-live';

// /simulation and /doctor/simulate on staging after MIN-4603 (MIN-4612). Synthetic data only.
// Expected values come from data/synthetic/simulation.json (the file the build serves), formatted here by the written rule,
// not by importing the app's formatter, so a wrong formatter or a wrong deployed file fails.
// The Run click on /doctor/simulate calls healthapp-simulate-live (a real boxd machine): every Run in this file mocks that POST
// (MIN-4677, helpers/simulate-live.ts), and the helper fails the test if a click ever reaches the real function.
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

const FIXED = ['sim-page-label', 'sim-machine-label', 'sim-matching-label', 'sim-contact-label'];

/** Each fixed label that is in the DOM is fully opaque, with no faded or moving ancestor. */
const fixedLabelsSolid = (page: Page) =>
  page.evaluate((ids) => {
    const bad: string[] = [];
    for (const id of ids) {
      const el = document.querySelector(`[data-testid="${id}"]`);
      if (!el) continue;
      for (let n: Element | null = el; n && n !== document.documentElement; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (Number(cs.opacity) < 1 || cs.visibility === 'hidden' || cs.display === 'none') bad.push(`${id}: ${n.tagName}.${n.className} opacity ${cs.opacity}`);
      }
    }
    return bad;
  }, FIXED);

test.describe('/doctor/simulate (demo doctor)', () => {
  test.skip(!PASSCODE, 'HEALTHAPP_DEMO_PASSCODE not set');

  test('D1 one click runs machine, dots, filters, matches; the four fixed labels stay solid; a card unlocks', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop-1280', 'the full run is checked at desktop; W2 covers the phone');
    test.setTimeout(170_000);
    await signIn(page);
    await page.goto('/doctor/simulate');
    await mockSimulateLive(page);
    await expect(T(page, 'sim-page-label')).toBeVisible();
    expect(await fixedLabelsSolid(page)).toEqual([]);

    // sample the labels while the run plays, from the click to the matches
    const samples: string[] = [];
    let sampling = true;
    const sampler = (async () => {
      while (sampling) {
        samples.push(...(await fixedLabelsSolid(page).catch(() => [])));
        await page.waitForTimeout(250);
      }
    })();
    await T(page, 'sim-run').click();
    await expect(T(page, 'sim-machine-label')).toBeVisible();
    await expect(T(page, 'sim-dots')).toBeVisible({ timeout: 30_000 });
    await expect(T(page, 'sim-matching-label')).toBeVisible({ timeout: 60_000 });
    await expect(T(page, 'sim-step-5')).toContainText('5 is 5 or more', { timeout: 90_000 });
    await expect(T(page, 'sim-count-line')).toBeVisible({ timeout: 30_000 });
    await expect(T(page, 'sim-contact-label')).toBeVisible();
    sampling = false;
    await sampler;
    expect(samples, 'a fixed label was faded or hidden at some sample').toEqual([]);
    for (const id of FIXED) await expect(T(page, id)).toBeVisible();

    await expect(T(page, 'sim-growth-link')).toHaveAttribute('href', '/simulation');
    await expect(T(page, 'sim-unlocked-1')).toHaveCount(0);
    await T(page, 'sim-ask-1').click();
    await expect(T(page, 'sim-card-1')).toHaveAttribute('data-unlocked', 'true', { timeout: 30_000 });
    await expect(T(page, 'sim-unlocked-1')).toContainText('Dummy exams');
    expect(await fixedLabelsSolid(page)).toEqual([]);
  });

  test('D2 reduced motion: every stage shows its finished state and the card unlocks at once', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop-1280', 'desktop only');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await signIn(page);
    await page.goto('/doctor/simulate');
    await mockSimulateLive(page);
    await T(page, 'sim-run').click();
    await expect(T(page, 'sim-count-line')).toBeVisible({ timeout: 5_000 });
    for (let i = 1; i <= 5; i++) await expect(T(page, `sim-step-${i}`)).toBeVisible();
    for (const id of FIXED) await expect(T(page, id)).toBeVisible();
    expect(await fixedLabelsSolid(page)).toEqual([]);
    await T(page, 'sim-ask-1').click();
    await expect(T(page, 'sim-card-1')).toHaveAttribute('data-unlocked', 'true', { timeout: 2_000 });
  });

  test('W2 at 390 px, no horizontal overflow before, during and after the run', async ({ page }, info) => {
    test.skip(info.project.name !== 'phone-390', 'phone project only');
    test.setTimeout(170_000);
    await signIn(page);
    await page.goto('/doctor/simulate');
    await mockSimulateLive(page);
    expect(await overflow(page), 'px of sideways scroll before the run').toBeLessThanOrEqual(0);
    await T(page, 'sim-run').click();
    await expect(T(page, 'sim-dots')).toBeVisible({ timeout: 30_000 });
    expect(await overflow(page), 'px of sideways scroll during the run').toBeLessThanOrEqual(0);
    await expect(T(page, 'sim-count-line')).toBeVisible({ timeout: 120_000 });
    expect(await overflow(page), 'px of sideways scroll at the result').toBeLessThanOrEqual(0);
    await expect(T(page, 'sim-ask-1')).toBeVisible();
  });
});
