import { expect, test, type Page } from '@playwright/test';

// /doctor/simulate on staging (MIN-4592, MIN-4594). Replay of a recorded run, fully offline after the page loads.
// Sign-in: the real dev demo login, as e2e-live/exam-journey.spec.ts does. The passcode comes from HEALTHAPP_DEMO_PASSCODE,
// is cleared from the field right after submit, and is never logged. No trace/video/screenshot (see playwright.live.config.ts).
// Run: HEALTHAPP_DEMO_PASSCODE=... npx playwright test -c playwright.live.config.ts e2e-live/simulate.spec.ts
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

/** Requests made from now on that are not the app's own GET assets. */
function watchNetwork(page: Page, appOrigin: string) {
  const bad: string[] = [];
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (u.protocol === 'data:' || u.protocol === 'blob:') return;
    if (u.origin !== appOrigin || r.method() !== 'GET') bad.push(`${r.method()} ${u.origin}${u.pathname}`);
  });
  return bad;
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

test.describe('doctor', () => {
  test.skip(!PASSCODE, 'HEALTHAPP_DEMO_PASSCODE not set');
  test.use({ viewport: { width: 1280, height: 900 }, hasTouch: false, isMobile: false });

  test('S3 full run: fixed labels, funnel, matches, introduction, run again, no network', async ({ page, baseURL }) => {
    test.setTimeout(150_000);
    await signIn(page, 'doctor');
    await page.goto('/doctor/simulate');
    await expect(page.getByTestId('doctor-simulate')).toBeVisible();
    await expect(page.getByTestId('sim-page-label')).toHaveText('Seeded synthetic data. Not real patients.');
    const bad = watchNetwork(page, new URL(baseURL!).origin);

    await page.getByTestId('sim-run').click();
    await expect(page.getByTestId('sim-machine-label')).toHaveText('Recorded run on a boxd machine, 14 Nov 2026, 21:25 UTC. Replayed here, not live.');
    await expect(page.getByTestId('sim-matching-label')).toContainText('runs now, in this browser, on the 5,000 synthetic records', { timeout: 60_000 });

    // funnel 4,499 / 6 / 5 / 5
    await expect(page.getByTestId('sim-step-5')).toContainText('5 is 5 or more', { timeout: 90_000 });
    await expect(page.getByTestId('sim-step-2')).toContainText('4,499 of 5,000 records opted in');
    await expect(page.getByTestId('sim-step-3')).toContainText('6 records share 4 or more');
    await expect(page.getByTestId('sim-step-4')).toContainText('5 share exactly the same set');

    await expect(page.getByTestId('sim-count-line')).toHaveText('5 seeded synthetic records share this pattern.');
    await expect(page.getByTestId('sim-seeded-line')).toHaveText('The generator seeded this rare pattern in 6 of 5,000 records.');
    const matches = page.getByTestId('sim-matches');
    for (const c of ['Spain', 'France', 'Greece', 'Netherlands']) await expect(matches).toContainText(c);

    // before asking: country only, no exams, no other-doctor line
    await expect(page.getByTestId('sim-card-1')).toContainText('Country');
    await expect(page.getByTestId('sim-unlocked-1')).toHaveCount(0);
    await expect(page.getByTestId('sim-other-doctor-1')).toHaveCount(0);

    await page.getByTestId('sim-ask-1').click();
    await expect(page.getByTestId('sim-card-1')).toContainText('Request sent, without name or ID');
    await expect(page.getByTestId('sim-card-1')).toHaveAttribute('data-unlocked', 'true', { timeout: 30_000 });
    await expect(page.getByTestId('sim-unlocked-1')).toContainText('Dummy exams');
    await expect(page.getByTestId('sim-other-doctor-1')).toContainText('The other treating doctor:');
    await expect(page.getByTestId('sim-other-doctor-1')).toContainText('No name.');
    await expect(page.getByTestId('sim-sent-1')).toHaveText('Message sent (simulated)');
    await expect(matches).toContainText('Nothing is saved or sent from this page.');

    // run again restarts the replay
    await page.getByTestId('sim-run').click();
    await expect(page.getByTestId('sim-card-1')).toHaveCount(0);
    await expect(page.getByTestId('sim-step-5')).toContainText('5 is 5 or more', { timeout: 90_000 });

    expect(bad, 'requests beyond the app GET assets').toEqual([]);
  });

  test('S4 reduced motion jumps straight to the result', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await signIn(page, 'doctor');
    await page.goto('/doctor/simulate');
    await page.getByTestId('sim-run').click();
    await expect(page.getByTestId('sim-count-line')).toBeVisible({ timeout: 5_000 }); // the animated run takes far longer
    await page.getByTestId('sim-ask-1').click();
    await expect(page.getByTestId('sim-card-1')).toHaveAttribute('data-unlocked', 'true', { timeout: 2_000 });
  });
});

test.describe('phone width', () => {
  test.skip(!PASSCODE, 'HEALTHAPP_DEMO_PASSCODE not set');
  test.use({ viewport: { width: 375, height: 812 } });

  test('S5 at 375 px the page does not scroll sideways and the run reaches the result', async ({ page }) => {
    test.setTimeout(150_000);
    await signIn(page, 'doctor');
    await page.goto('/doctor/simulate');
    await page.getByTestId('sim-run').click();
    await expect(page.getByTestId('sim-count-line')).toBeVisible({ timeout: 90_000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(0);
    await expect(page.getByTestId('sim-ask-1')).toBeVisible();
  });
});
