import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { expect, mockSimulateLive, test } from './helpers/simulate-live';

// /simulation and /doctor/simulate on staging after MIN-4603 (MIN-4612). Synthetic data only.
// Expected values come from data/synthetic/simulation.json (the file the build serves), formatted here by the written rule,
// not by importing the app's formatter, so a wrong formatter or a wrong deployed file fails.
// The Run click on /doctor/simulate calls healthapp-simulate-live (a real boxd machine): every Run in this file mocks that POST
// (MIN-4677, helpers/simulate-live.ts), and the helper fails the test if a click ever reaches the real function.
// Run: see playwright.simulation.config.ts. Passcode comes from HEALTHAPP_DEMO_PASSCODE, is never logged.
const PASSCODE = process.env.HEALTHAPP_DEMO_PASSCODE ?? '';
const SIM = JSON.parse(readFileSync('data/synthetic/simulation.json', 'utf8'));
const last = <T,>(a: T[]) => a[a.length - 1];
const commas = (n: number) => Math.round(n).toLocaleString('en-US');

const euro = SIM.euro;
const dropLast: number = last(euro.drop_pts);
const amountLast = `€${(last(euro.drop_mio_eur) as number / 1000).toFixed(1)} billion`;
const pct = (v: number) => `${+(v * 100).toFixed(1)}%`;
const fmtAmount = (mio: number) => (mio === 0 ? '€0' : mio < 1 ? `€${commas(mio * 1e6)}` : mio < 1000 ? `€${commas(mio)} million` : `€${(mio / 1000).toFixed(1)} billion`);
const totalText = `€${commas(euro.total_mio_eur / 1000)} billion`;
const ASSUMPTION = `Assumption, not a finding: each match lowers the chance of a wrong or missed diagnosis by ${pct(SIM.assumption.start)}, rising to ${pct(SIM.assumption.ceiling)} as matches accumulate.`;
const END = {
  records: last(SIM.x.values as number[]),
  matches: last(SIM.matches.count as number[]),
  rate: (last(SIM.series[0].values) as number).toFixed(1),
  wrong: (last(SIM.series[1].values) as number).toFixed(2),
  cost: (last(SIM.series[2].values) as number).toFixed(2),
  perHab: `€${Math.round(last(euro.drop_eur_per_inhabitant) as number)} per inhabitant a year`,
  formula: `${dropLast.toFixed(2)} points of health spending × ${totalText} (${euro.geography}, ${euro.year}) = ${amountLast} a year`,
  effect: pct(last(SIM.assumption.effect) as number),
};

const T = (page: Page, id: string) => page.getByTestId(id);

/** The euro block is never on screen without its formula, source and the assumption; the fixed label is always there. */
async function expectEuroComplete(page: Page) {
  await expect(T(page, 'sim-label')).toHaveText(SIM.label);
  await expect(T(page, 'sim-euro-formula')).toBeVisible();
  await expect(T(page, 'sim-euro-source')).toContainText(euro.geography);
  await expect(T(page, 'sim-euro-source').getByRole('link')).toHaveAttribute('href', euro.source.url);
  await expect(T(page, 'sim-euro-source')).toContainText(String(euro.year));
  await expect(T(page, 'sim-assumption')).toHaveText(ASSUMPTION);
  await expect(T(page, 'sim-assumption-2')).toHaveText(ASSUMPTION);
  await expect(T(page, 'sim-assumption-3')).toHaveText(ASSUMPTION);
}

async function expectEnd(page: Page) {
  await expect(T(page, 'simulation')).toHaveAttribute('data-state', 'done');
  await expect(T(page, 'sim-euro-figure')).toHaveText(amountLast);
  await expect(T(page, 'sim-euro-hab')).toHaveText(END.perHab);
  await expect(T(page, 'sim-euro-formula')).toHaveText(END.formula);
  await expect(T(page, 'sim-matches')).toContainText(commas(END.matches));
  await expect(T(page, 'sim-x-hero')).toContainText(commas(END.records));
  // One canvas, no cell per dot (MIN-4682): the counts live in data-* and the aria-label, written at step edges.
  await expect(T(page, 'sim-field')).toHaveAttribute('data-visible', String(END.records));
  await expect(T(page, 'sim-field')).toHaveAttribute('data-matched', String(END.matches));
  await expect(T(page, 'sim-field').locator('canvas')).toHaveCount(1);
  await expect(T(page, 'sim-field').locator('i')).toHaveCount(0);
  const fieldLabel = T(page, 'sim-field').getByRole('img');
  await expect(fieldLabel).toHaveAttribute('aria-label', new RegExp(commas(END.matches) + ' of ' + commas(END.records)));
  await expect(T(page, 'sim-effect')).toContainText(END.effect);
  await expect(T(page, 'sim-value-1')).toHaveText(END.rate);
  await expect(T(page, 'sim-value-2')).toHaveText(END.wrong);
  await expect(T(page, 'sim-value-3')).toHaveText(END.cost);
  await expectEuroComplete(page);
}

const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.describe('/simulation (public)', () => {
  test('P1 plays to the end; label, assumption, formula and source on screen at start, mid-play and end; mid-run arithmetic holds', async ({ page, baseURL }) => {
    test.setTimeout(120_000);
    const bad: string[] = [];
    const origin = new URL(baseURL!).origin;
    page.on('request', (r) => {
      const u = new URL(r.url());
      if (u.protocol === 'data:' || u.protocol === 'blob:') return;
      if (u.origin !== origin || r.method() !== 'GET') bad.push(`${r.method()} ${u.origin}${u.pathname}`);
    });
    await page.goto('/simulation');
    const root = T(page, 'simulation');
    // start
    await expect(root).toHaveAttribute('data-state', 'playing');
    await expect(T(page, 'sim-label')).toHaveText(SIM.label);
    await expect(T(page, 'sim-assumption')).toHaveText(ASSUMPTION);
    if (await T(page, 'sim-euro-figure').isVisible()) await expectEuroComplete(page);

    // mid-play: still playing, the counter is between zero and the end, and the formula arithmetic checks out
    await expect.poll(async () => Number(await T(page, 'sim-matches').locator('.sim-stat-n').innerText()), { timeout: 30_000 }).toBeGreaterThan(0);
    await page.waitForTimeout(3_000);
    await expect(root).toHaveAttribute('data-state', 'playing');
    const midMatches = Number(await T(page, 'sim-matches').locator('.sim-stat-n').innerText());
    expect(midMatches).toBeGreaterThan(0);
    expect(midMatches).toBeLessThan(END.matches);
    await expectEuroComplete(page);
    // one read, so the three lines come from the same frame
    const mid = await page.evaluate(() => {
      const t = (id: string) => document.querySelector(`[data-testid="${id}"]`)?.textContent ?? '';
      return { formula: t('sim-euro-formula'), figure: t('sim-euro-figure') };
    });
    const m = /^(\d+\.\d{2}) points of health spending × (.+?) \(/.exec(mid.formula);
    expect(m, `formula line read: ${mid.formula}`).not.toBeNull();
    const drop = Number(m![1]);
    expect(drop).toBeGreaterThan(0);
    expect(drop).toBeLessThan(dropLast);
    expect(mid.formula).toContain(`= ${fmtAmount((drop / 100) * euro.total_mio_eur)} a year`);
    expect(mid.figure).toBe(fmtAmount((drop / 100) * euro.total_mio_eur));

    // end: holds
    await expect(root).toHaveAttribute('data-state', 'done', { timeout: 45_000 });
    await expectEnd(page);
    await page.waitForTimeout(2_000);
    await expectEnd(page);
    expect(bad, 'requests beyond the app GET assets').toEqual([]);
  });

  test('P2 the last frame equals the data file (its record count, its match count, the three end values, the euro figure)', async ({ page }) => {
    // Reduced motion reaches the finished state at once, so this check does not wait 30 s.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/simulation');
    await expectEnd(page);
    // The file itself is the source: a stale or truncated file fails here, not a number typed in this spec.
    expect(SIM.x.values.length).toBe(SIM.matches.count.length);
    expect(END.records).toBeGreaterThanOrEqual(5000);
    expect(END.matches).toBeGreaterThan(0);
    expect(END.matches).toBeLessThan(END.records);
  });

  test('P3 reduced motion: finished state at once, no replay, nothing moves on', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/simulation');
    await expect(T(page, 'simulation')).toHaveAttribute('data-state', 'done', { timeout: 3_000 });
    await expect(T(page, 'sim-replay')).toHaveCount(0);
    const before = await T(page, 'sim-euro-formula').innerText();
    await page.waitForTimeout(3_000);
    await expect(T(page, 'simulation')).toHaveAttribute('data-state', 'done');
    expect(await T(page, 'sim-euro-formula').innerText()).toBe(before);
    await expectEnd(page);
  });

  test('P4 Play again replays and lands on the same outcome', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop-1280', 'one viewport is enough for the replay');
    test.setTimeout(120_000);
    await page.goto('/simulation');
    await expect(T(page, 'simulation')).toHaveAttribute('data-state', 'done', { timeout: 45_000 });
    await expect(T(page, 'sim-replay')).toBeEnabled();
    await T(page, 'sim-replay').click();
    await expect(T(page, 'simulation')).toHaveAttribute('data-state', 'playing');
    await expect(T(page, 'sim-label')).toHaveText(SIM.label);
    await expect(T(page, 'simulation')).toHaveAttribute('data-state', 'done', { timeout: 45_000 });
    await expectEnd(page);
  });

  test('W1 at 390 px, no horizontal overflow at start, mid-play and end', async ({ page }, info) => {
    test.skip(info.project.name !== 'phone-390', 'phone project only');
    test.setTimeout(120_000);
    await page.goto('/simulation');
    await expect(T(page, 'simulation')).toHaveAttribute('data-state', 'playing');
    expect(await overflow(page), 'px of sideways scroll at start').toBeLessThanOrEqual(0);
    await page.waitForTimeout(12_000);
    expect(await overflow(page), 'px of sideways scroll mid-play').toBeLessThanOrEqual(0);
    await expect(T(page, 'simulation')).toHaveAttribute('data-state', 'done', { timeout: 45_000 });
    expect(await overflow(page), 'px of sideways scroll at end').toBeLessThanOrEqual(0);
    await expectEnd(page);
  });
});

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
