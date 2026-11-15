import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { expect, mockSimulateLive, test } from './helpers/simulate-live';

// Trial recruitment search, first section of /doctor/simulate (MIN-4706, built in MIN-4711; scenarios MIN-4712).
// Synthetic data only: the 50,000 records are seeded and committed (data/synthetic/recruit-50000.json). Target: staging-dev / dev.
// Every number below is read from that file's `expected` block, never typed. The search runs in the browser and calls no backend;
// the 5,000 flow below it still POSTs simulate-live, which is mocked (MIN-4677) so no boxd machine starts.
// Sign-in as in e2e-live/simulate.spec.ts: the dev demo passcode from HEALTHAPP_DEMO_PASSCODE, never logged, no trace/video.
// Run: set -a; . ~/.config/healthapp/demo-login.env; set +a; npx playwright test -c playwright.simulation.config.ts e2e-live/recruit.spec.ts
const PASSCODE = process.env.HEALTHAPP_DEMO_PASSCODE ?? '';

type Expected = { shown: true; eligible: number; countries: string[] } | { shown: false };
const file = JSON.parse(readFileSync(path.resolve('data/synthetic/recruit-50000.json'), 'utf8')) as {
  n: number;
  opted_in: number;
  records: unknown[];
  expected: Record<string, Expected>;
};
const nf = (n: number) => n.toLocaleString('en-US');
const exp = (id: string) => file.expected[id] as { shown: true; eligible: number; countries: string[] };

async function signInDoctor(page: Page) {
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

/** Requests that are not the app's own GET assets. The only allowed POST is the mocked simulate-live one (the 5,000 flow). */
function watchNetwork(page: Page, appOrigin: string) {
  const bad: string[] = [];
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (u.protocol === 'data:' || u.protocol === 'blob:') return;
    if (r.method() === 'POST' && u.pathname.endsWith('/functions/v1/healthapp-simulate-live')) return;
    if (u.origin !== appOrigin || r.method() !== 'GET') bad.push(`${r.method()} ${u.origin}${u.pathname}`);
  });
  return bad;
}

async function search(page: Page, sentence: string) {
  await page.getByTestId('recruit-input').fill(sentence);
  await page.getByTestId('recruit-submit').click();
}
const funnel = async (page: Page) => {
  const out: number[] = [];
  for (const k of ['records', 'optedIn', 'eligible', 'selected']) {
    const t = await page.getByTestId(`recruit-funnel-${k}`).locator('.rc-num').innerText();
    out.push(Number(t.replace(/,/g, '')));
  }
  return out;
};

test.describe('recruitment search (doctor, staging-dev)', () => {
  test.skip(!PASSCODE, 'HEALTHAPP_DEMO_PASSCODE not set');
  test.use({ viewport: { width: 1280, height: 900 }, hasTouch: false, isMobile: false });

  let bad: string[];
  test.beforeEach(async ({ page, baseURL }) => {
    await signInDoctor(page);
    await page.goto('/doctor/simulate');
    await expect(page.getByTestId('recruit')).toBeVisible();
    await expect(page.getByTestId('recruit-source')).toBeVisible({ timeout: 30_000 }); // the file has loaded
    bad = watchNetwork(page, new URL(baseURL!).origin);
  });
  test.afterEach(() => {
    expect(bad, 'requests beyond the app GET assets (the search must call no backend)').toEqual([]);
  });

  test('R1 the founder sentence: read 40 + RA, Asked 40 Found 40, funnel from the file, countries, simulated note', async ({ page }) => {
    await expect(page.getByTestId('sim-page-label')).toHaveText('Seeded synthetic data. Not real patients.');
    expect(file.records.length, 'the file holds exactly 50,000 records').toBe(50_000);
    await search(page, 'i want to recruit 40 people matching the rheumatoid arthritis desease for a trial');
    const e = exp('rheumatoid_arthritis');
    await expect(page.getByTestId('recruit-result')).toHaveAttribute('data-condition', 'rheumatoid_arthritis');
    await expect(page.getByTestId('recruit-read')).toContainText('40 records, Rheumatoid arthritis');
    await expect(page.getByTestId('recruit-line')).toHaveText('Asked 40. Found 40.');
    await expect(page.getByTestId('recruit-more')).toContainText(`${nf(e.eligible - 40)} more records`);
    expect(await funnel(page)).toEqual([50_000, file.opted_in, e.eligible, 40]);
    await expect(page.getByTestId('recruit-compared')).toContainText('Compared:');
    await expect(page.getByTestId('recruit-countries')).toContainText('Greece');
    await expect(page.getByTestId('recruit-simulated')).toContainText('Nothing is saved or sent from this page.');
    await expect(page.getByTestId('sim-page-label')).toBeVisible();
  });

  test('R2 fewer found than asked (sarcoid, 40): one sentence with both numbers, funnel still shows', async ({ page }) => {
    const e = exp('rare_sarcoid_like');
    await search(page, 'I want to recruit 40 people matching sarcoidosis for a trial');
    await expect(page.getByTestId('recruit-line')).toHaveText(`Found ${e.eligible} of the 40 asked. No other record fits these criteria.`);
    expect(await funnel(page)).toEqual([50_000, file.opted_in, e.eligible, e.eligible]);
    await expect(page.getByTestId('recruit-more')).toHaveCount(0);
  });

  for (const [id, word] of [['rare_copper_metabolism', 'wilson disease'], ['rare_myopathy', 'myopathy']] as const) {
    test(`R3 under 5 (${id}): one sentence, no count, no funnel, no countries`, async ({ page }) => {
      expect(file.expected[id].shown).toBe(false);
      await search(page, `I want to recruit 10 people matching ${word} for a trial`);
      await expect(page.getByTestId('recruit-few')).toHaveText('Fewer than 5 records fit these criteria, so nothing is shown.');
      for (const t of ['recruit-funnel', 'recruit-line', 'recruit-countries', 'recruit-found']) await expect(page.getByTestId(t)).toHaveCount(0);
    });
  }

  test('R4 unknown condition (asthma): sentence + 13 buttons, a button fills the box, search then works', async ({ page }) => {
    await search(page, 'I want to recruit 40 people matching asthma for a trial');
    await expect(page.getByTestId('recruit-unknown')).toBeVisible();
    await expect(page.locator('[data-testid^="recruit-pick-"]')).toHaveCount(Object.keys(file.expected).length);
    await expect(page.getByTestId('recruit-result')).toHaveCount(0);
    await page.getByTestId('recruit-pick-gout').click();
    await expect(page.getByTestId('recruit-input')).not.toHaveValue('');
    await page.getByTestId('recruit-input').press('Enter');
    await expect(page.getByTestId('recruit-result')).toHaveAttribute('data-condition', 'gout');
    await expect(page.getByTestId('recruit-loading')).toHaveCount(0);
  });

  test('R5 bad requests each get their own sentence: empty box, above 50,000, no number, zero', async ({ page }) => {
    await page.getByTestId('recruit-submit').click();
    await expect(page.getByTestId('recruit-empty')).toBeVisible();

    await search(page, 'I want to recruit 60,000 people matching gout for a trial');
    await expect(page.getByTestId('recruit-too-many')).toContainText('more than the 50,000 records');
    await expect(page.getByTestId('recruit-funnel')).toHaveCount(0);

    const gout = exp('gout').eligible;
    for (const s of ['I want to recruit gout people for a trial', 'I want to recruit 0 people matching gout for a trial']) {
      await search(page, s);
      await expect(page.getByTestId('recruit-no-number')).toBeVisible();
      await expect(page.getByTestId('recruit-line')).toHaveText(`Found ${nf(gout)} records that fit these criteria.`);
    }
    await expect(page.getByTestId('recruit-loading')).toHaveCount(0);
  });

  test('R6 funnel never grows and the same search gives the same numbers, for 10 common conditions typed by name', async ({ page }) => {
    const names: Record<string, string> = {
      inflammatory_back_pain: 'inflammatory back pain', hypothyroid: 'hypothyroidism', type2_diabetes_metabolic: 'type 2 diabetes',
      iron_deficiency: 'iron deficiency anaemia', lupus_like: 'lupus', gout: 'gout', hyperthyroid: 'hyperthyroidism',
      reduced_kidney_function: 'chronic kidney disease', low_bone_density: 'osteoporosis', rheumatoid_arthritis: 'rheumatoid arthritis',
    };
    for (const [id, word] of Object.entries(names)) {
      await search(page, `I want to recruit 25 people matching ${word} for a trial`);
      await expect(page.getByTestId('recruit-result')).toHaveAttribute('data-condition', id);
      const f = await funnel(page);
      expect(f, id).toEqual([50_000, file.opted_in, exp(id).eligible, 25]);
      expect(f[0] >= f[1] && f[1] >= f[2] && f[2] >= f[3], `${id} funnel does not grow`).toBe(true);
    }
  });

  test('R7 the 5,000 demo-patient flow below still runs (simulate-live mocked), after a search', async ({ page }) => {
    test.setTimeout(150_000);
    const live = await mockSimulateLive(page);
    await search(page, 'I want to recruit 40 people matching rheumatoid arthritis for a trial');
    await expect(page.getByTestId('recruit-line')).toHaveText('Asked 40. Found 40.');
    await page.getByTestId('sim-run').click();
    await expect(page.getByTestId('sim-count-line')).toHaveText('5 seeded synthetic records share this pattern.', { timeout: 90_000 });
    await expect(page.getByTestId('recruit-line')).toHaveText('Asked 40. Found 40.'); // the search result is untouched by the run
    expect(live.calls(), 'one mocked POST per Run click, none from the search').toBe(1);
  });
});
