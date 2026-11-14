import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// One real journey on a phone viewport: sign in, add a synthetic exam from the gallery, confirm the draft, see it in the record.
// Synthetic image only (tests/synthetic/docs). The passcode comes from the environment and is never logged or screenshotted.
const PASSCODE = process.env.HEALTHAPP_DEMO_PASSCODE ?? '';
const DOC = path.resolve('tests/synthetic/docs/01-blood-el-2025-05-14.jpg');
const OUT = path.resolve('test-results/live');

test('patient signs in, adds a synthetic exam from the gallery, confirms, and sees it in the record', async ({ page }) => {
  test.skip(!PASSCODE, 'HEALTHAPP_DEMO_PASSCODE not set');
  mkdirSync(OUT, { recursive: true });
  const timings: Record<string, number> = {};
  let t0 = Date.now();
  const lap = (k: string) => { timings[k] = Date.now() - t0; t0 = Date.now(); };

  // 0. refuse to run anywhere but the dev environment: /health must report env = dev before any passcode is typed
  await page.goto('/health');
  await expect(page.getByTestId('env'), 'target is not the dev environment: aborting before sign-in').toHaveText('dev', { timeout: 15_000 });

  // 1. sign in as the patient persona
  await page.goto('/login');
  const field = page.getByLabel('Demo passcode');
  // Playwright writes an accessibility snapshot into test-results/**/error-context.md when a step fails, and
  // that snapshot includes field values. So the passcode must leave the field the moment the click has submitted
  // it (the click handler reads it synchronously), and again on any error, before anything can fail with it on screen.
  const clearPasscode = () => field.fill('', { timeout: 2_000 }).catch(() => {});
  try {
    await field.fill(PASSCODE);
    await page.getByTestId('login-patient').click();
    await clearPasscode();
    await page.waitForURL(/\/patient$/, { timeout: 30_000 });
  } catch {
    await clearPasscode();
    throw new Error('sign-in did not reach /patient (wrong or rotated demo passcode, or the sign-in call failed)');
  }
  await expect(page.getByTestId('records')).toBeVisible();
  lap('1_sign_in_ms');
  await page.screenshot({ path: path.join(OUT, '1-patient-home.png') });
  // the list loads after the container shows: take the count only once it has stopped changing
  let before = -1;
  await expect.poll(async () => { const n = await page.getByTestId('record-row').count(); const stable = n === before; before = n; return stable; }, { intervals: [1500], timeout: 20_000 }).toBe(true);

  // 2. add one synthetic exam from the gallery input; the read runs on the server
  await page.getByTestId('add-exam-link').click();
  await page.getByTestId('input-gallery').setInputFiles(DOC);
  await expect(page.getByTestId('reading')).toBeVisible();
  lap('2_upload_to_reading_ms');

  // 3. the draft appears beside the photo with values; confirm
  await expect(page.getByTestId('review')).toBeVisible({ timeout: 120_000 });
  lap('3_read_to_draft_ms');
  const rows = await page.getByTestId('result-row').count();
  expect(rows, 'the draft has extracted values').toBeGreaterThan(0);
  await expect(page.getByTestId('printed-name')).not.toContainText('Not read');
  await page.screenshot({ path: path.join(OUT, '3-draft.png') });
  await page.getByTestId('save').click();
  await expect(page.getByTestId('saved')).toBeVisible({ timeout: 30_000 });
  lap('3b_confirm_ms');

  // 4. the exam shows in the records list
  await page.goto('/patient');
  await expect(page.getByTestId('record-row')).toHaveCount(before + 1, { timeout: 30_000 });
  lap('4_records_list_ms');
  await page.screenshot({ path: path.join(OUT, '4-records.png') });

  writeFileSync(path.join(OUT, 'timings.json'), JSON.stringify({ result_rows: rows, records_before: before, ...timings }, null, 2));
  console.log('timings', JSON.stringify({ result_rows: rows, ...timings }));
});
