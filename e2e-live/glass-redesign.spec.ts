import type { Browser, Page } from '@playwright/test';
import { expect, test } from './helpers/no-post';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

// MIN-4591: the iOS glass redesign on staging (env dev, synthetic data). Journeys and the two fallbacks only: no pixel or copy checks.
// The passcode comes from the environment, is cleared from the field right after submit, and is never logged or screenshotted.
const PASSCODE = process.env.HEALTHAPP_DEMO_PASSCODE ?? '';
const OUT = path.resolve('test-results/glass');

async function signIn(page: Page, persona: 'patient' | 'doctor') {
  await page.goto('/health');
  await expect(page.getByTestId('env'), 'target is not dev: aborting before sign-in').toHaveText('dev', { timeout: 15_000 });
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
    throw new Error(`sign-in did not reach /${persona}`);
  }
}

async function shot(page: Page, name: string, testInfo: { project: { name: string } }) {
  mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: path.join(OUT, `${testInfo.project.name}-${name}.png`) });
}

test.beforeEach(() => test.skip(!PASSCODE, 'HEALTHAPP_DEMO_PASSCODE not set'));

test('G1 patient: sign in, home tiles, tab bar reaches every patient route, scan screen opens, record list, profile and sign out', async ({ page }, ti) => {
  await signIn(page, 'patient');
  await expect(page.getByTestId('patient-home')).toBeVisible();
  await expect(page.getByTestId('add-exam-link')).toBeVisible();
  await expect(page.getByTestId('records')).toBeVisible();
  await shot(page, 'g1-home', ti);

  const tabs = page.getByRole('navigation', { name: 'Patient' });
  await tabs.getByRole('link', { name: 'Add symptom' }).click();
  await expect(page).toHaveURL(/\/patient\/diary$/);
  await expect(page.getByTestId('diary-form')).toBeVisible();
  await tabs.getByRole('link', { name: 'Who had access' }).click();
  await expect(page).toHaveURL(/\/patient\/access$/);
  await tabs.getByRole('link', { name: 'Your record' }).click();
  await expect(page).toHaveURL(/\/patient$/);

  await page.getByTestId('add-exam-link').click();
  await expect(page).toHaveURL(/\/patient\/exams\/add$/);
  await expect(page.getByTestId('input-gallery')).toBeAttached();
  await page.goBack();
  await expect(page.getByTestId('records')).toBeVisible();

  await page.getByTestId('profile-tab').click();
  await expect(page).toHaveURL(/\/patient\/profile$/);
  await expect(page.getByTestId('profile-photo')).toBeVisible();
  expect(await page.getByTestId('profile-photo').evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0), 'profile photo loaded').toBe(true);
  await expect(page.getByTestId('profile-name')).not.toBeEmpty();
  await shot(page, 'g1-profile', ti);
  await page.getByTestId('sign-out').click();
  await expect(page).toHaveURL(/\/login$/);
});

test('G2 doctor: profile, sign out, and /doctor/simulate renders and searches', async ({ page }, ti) => {
  await signIn(page, 'doctor');
  await expect(page.getByTestId('doctor-home')).toBeVisible();
  await page.getByTestId('simulate-link').click();
  await expect(page).toHaveURL(/\/doctor\/simulate$/);
  await expect(page.getByTestId('sim-page-label')).toBeVisible();
  // MIN-4743: one flow. Search runs in the browser (reduced motion shows the end state at once); the page calls no backend.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByTestId('recruit-input').fill('I want to recruit 40 people matching rheumatoid arthritis for a trial');
  await page.getByTestId('recruit-submit').click();
  await expect(page.getByTestId('recruit-result'), 'the search read the sentence in the browser').toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('recruit-line')).toHaveText('Asked 40. Found 40.');
  await shot(page, 'g2-simulate', ti);

  await page.goto('/doctor');
  await page.getByTestId('profile-link').click();
  await expect(page).toHaveURL(/\/doctor\/profile$/);
  await expect(page.getByTestId('profile-photo')).toBeVisible();
  await expect(page.getByTestId('profile-name')).not.toBeEmpty();
  await page.getByTestId('sign-out').click();
  await expect(page).toHaveURL(/\/login$/);
});

async function endAccessIfRunning(patient: Page) {
  const end = patient.getByRole('button', { name: 'End access' });
  const running = await end.or(patient.getByTestId('share-short-code')).first().waitFor({ timeout: 20_000 }).then(() => end.isVisible()).catch(() => false);
  if (running) {
    await end.click();
    await expect(patient.getByTestId('share-ended').or(patient.getByTestId('share-scene'))).toBeVisible({ timeout: 15_000 });
    await patient.goto('/patient/share');
  }
}

async function openPair(browser: Browser, ti: { project: { use: object } }) {
  const opts = { ...(ti.project.use as object) } as Parameters<Browser['newContext']>[0];
  const pctx = await browser.newContext(opts);
  const dctx = await browser.newContext(opts);
  return { pctx, dctx, patient: await pctx.newPage(), doctor: await dctx.newPage() };
}

test('G3 handshake: doctor connects with the patient share code, patient approves, workspace panels, sheet, timer', async ({ browser }, ti) => {
  const { pctx, dctx, patient, doctor } = await openPair(browser, ti);
  try {
    await signIn(patient, 'patient');
    await signIn(doctor, 'doctor');
    await patient.goto('/patient/share');
    await endAccessIfRunning(patient); // a grant left by an earlier run would hide the code
    const codeEl = patient.getByTestId('share-short-code');
    await expect(codeEl).toBeVisible({ timeout: 30_000 });
    const code = ((await codeEl.textContent()) ?? '').replace(/\s/g, '');
    expect(code).toMatch(/^[A-Z0-9]{8}$/);

    await doctor.goto('/doctor/connect');
    await doctor.getByTestId('scan-typed-input').fill(code);
    await doctor.getByTestId('scan-submit').click();
    await expect(doctor.getByTestId('doctor-waiting')).toBeVisible({ timeout: 30_000 });

    await expect(patient.getByTestId('share-asking')).toBeVisible({ timeout: 30_000 });
    await shot(patient, 'g3-share-asking', ti);
    await patient.getByTestId('ask-approve').click();

    await expect(doctor.getByTestId('doctor-workspace')).toBeVisible({ timeout: 30_000 });
    await expect(doctor.getByTestId('access-timer')).toBeVisible();
    await expect(doctor.getByTestId('access-timer')).toHaveAttribute('data-state', /.+/);
    await expect(doctor.getByTestId('assistant-workspace')).toBeVisible({ timeout: 30_000 });
    await expect(doctor.getByTestId('overview')).toBeVisible();
    await expect(doctor.getByTestId('over-time')).toBeVisible({ timeout: 30_000 });
    await expect(doctor.getByTestId('matches-panel')).toBeVisible();
    // From 900 px the dashboard shows one view at a time (MIN-4664): Ask is behind its nav item, the overview is behind the other.
    await doctor.getByTestId('nav-ask').click();
    await expect(doctor.getByTestId('ask-input')).toBeVisible();
    await doctor.getByTestId('ask-input').fill('What is in this record?');
    await doctor.getByTestId('ask-submit').click();
    await expect(doctor.getByTestId('turn').first()).toBeVisible({ timeout: 90_000 });
    await shot(doctor, 'g3-workspace', ti);
    await doctor.getByTestId('nav-overview').click();

    // the sheet: open a source from the timeline, see the "About this file" block, close it
    const open = doctor.getByTestId('overview').getByRole('button', { name: /^Source \d+: Blood test/ }).first(); // a document source (a diary entry has no file block)
    if (await open.count()) {
      await open.click();
      await expect(doctor.getByTestId('source-viewer')).toBeVisible();
      await shot(doctor, 'g3-source-sheet', ti);
      await expect(doctor.getByTestId('about-file')).toBeVisible({ timeout: 30_000 });
      await doctor.getByTestId('source-close').click();
      await expect(doctor.getByTestId('source-viewer')).toHaveCount(0);
    } else {
      test.info().annotations.push({ type: 'uncovered', description: 'no document source in the overview of this dev patient: source sheet not opened' });
    }
  } finally {
    await patient.goto('/patient/share').catch(() => {});
    await endAccessIfRunning(patient).catch(() => {}); // leave no open grant on dev
    await pctx.close();
    await dctx.close();
  }
});

test('G4 reduced transparency: chrome and ground turn solid (Chromium only: WebKit cannot emulate the media feature)', async ({ browser, browserName }, ti) => {
  test.skip(browserName !== 'chromium', 'prefers-reduced-transparency cannot be emulated in WebKit');
  const ctx = await browser.newContext(ti.project.use as Parameters<Browser['newContext']>[0]);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  const surfaces = async () => page.evaluate(() => {
    const out: Record<string, { blur: string; alpha: number }> = {};
    for (const sel of ['.tabbar', '.navbar', '.timer', '.sheet', '.signin']) {
      const el = document.querySelector(sel);
      if (!el) continue;
      const cs = getComputedStyle(el);
      const m = cs.backgroundColor.match(/rgba?\(([^)]+)\)/);
      const a = m ? (m[1].split(',').length > 3 ? parseFloat(m[1].split(',')[3]) : 1) : 0;
      out[sel] = { blur: cs.backdropFilter || (cs as unknown as { webkitBackdropFilter: string }).webkitBackdropFilter || 'none', alpha: a };
    }
    return out;
  });
  try {
    await page.goto('/login');
    await page.getByLabel('Demo passcode').waitFor();
    const before = await surfaces();
    expect(before['.signin']?.blur, 'baseline: sign-in card is glass').not.toBe('none');
    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }, { name: 'prefers-reduced-motion', value: 'reduce' }] });
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-transparency: reduce)').matches), 'emulation took effect').toBe(true);
    const after = await surfaces();
    for (const [sel, v] of Object.entries(after)) {
      expect(v.blur, `${sel} has no blur`).toBe('none');
      expect(v.alpha, `${sel} is opaque`).toBe(1);
    }
    expect(await page.evaluate(() => { const a = getComputedStyle(document.querySelector('.app-bg')!).backgroundImage; return a; }), '.app-bg is a flat colour').toBe('none');
    await signIn(page, 'patient');
    const home = await surfaces();
    expect(Object.keys(home)).toContain('.tabbar');
    for (const [sel, v] of Object.entries(home)) { expect(v.blur, `${sel} no blur on home`).toBe('none'); expect(v.alpha, `${sel} opaque on home`).toBe(1); }
    await expect(page.getByTestId('records')).toBeVisible();
    await page.getByTestId('profile-tab').click();
    await page.getByTestId('sign-out').click();
    await expect(page).toHaveURL(/\/login$/);
    await shot(page, 'g4-reduced', ti);
  } finally {
    await ctx.close();
  }
});
