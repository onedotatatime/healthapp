import type { Page } from '@playwright/test';
import { expect, test } from './helpers/no-post';

// /doctor/simulate on staging-dev: the sign-in and role gate (MIN-4592, kept by MIN-4743). The one-flow page itself is covered in
// e2e-live/recruit.spec.ts (R1 to R7), simulations.spec.ts (W2, 390 px) and glass-redesign.spec.ts (G2). The page calls no backend.
// Sign-in: the real dev demo login, as e2e-live/exam-journey.spec.ts does. The passcode comes from HEALTHAPP_DEMO_PASSCODE,
// is cleared from the field right after submit, and is never logged. No trace/video/screenshot (see playwright.live.config.ts).
// Run: HEALTHAPP_DEMO_PASSCODE=... npx playwright test -c playwright.simulation.config.ts e2e-live/simulate.spec.ts
const PASSCODE = process.env.HEALTHAPP_DEMO_PASSCODE ?? '';

async function signIn(page: Page, persona: 'doctor' | 'patient') {
  await page.goto('/health');
  await expect(page.getByTestId('env'), 'target is not the dev environment').toHaveText('dev', { timeout: 15_000 });
  await page.goto('/login');
  const field = page.getByLabel('Demo passcode');
  const clear = () => field.fill('', { timeout: 2_000 }).catch(() => {});
  try {
    await field.fill(PASSCODE);
    await page.getByTestId(`login-${persona}`).click();
    await clear();
    await page.waitForURL(new RegExp(`/${persona}$`), { timeout: 30_000 });
  } catch {
    await clear();
    throw new Error(`sign-in as ${persona} did not land on /${persona}`);
  }
}

test.describe('signed out and wrong role', () => {
  test('S1 signed-out visitor is sent to /login', async ({ page }) => {
    await page.goto('/doctor/simulate');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('doctor-simulate')).toHaveCount(0);
  });

  test('S2 a patient is sent away from the page', async ({ page }) => {
    test.skip(!PASSCODE, 'HEALTHAPP_DEMO_PASSCODE not set');
    await signIn(page, 'patient');
    await page.goto('/doctor/simulate');
    await expect(page).toHaveURL(/\/patient$/);
    await expect(page.getByTestId('doctor-simulate')).toHaveCount(0);
  });
});
