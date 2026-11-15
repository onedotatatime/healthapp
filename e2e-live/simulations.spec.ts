import { readFileSync } from 'node:fs';
import path from 'node:path';
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

// The /simulation scenarios of this file (P1 to P4, W1, T1, T2) tested the animated page of MIN-4608 to MIN-4724; MIN-4749 replaced it with a plan-month slider
// diagram, and MIN-4774 replaced that with ONE loss card (Greece / Europe (EU-27) / Global switch, a 0 to 100% share slider in 0.1% steps, data: the `reach` block).
// None of those tests remains here. The /simulation scenarios below (S1 to S10) are E2E's, written against staging-dev after the merge (MIN-4776). Test ids on the card: sim-loss-card, sim-switch, sim-geo-{greece,eu27,world}, sim-slider, sim-share,
// sim-value-{loss,drop,matches,dx,plan}, sim-drop-pct, sim-state, sim-plan-line, sim-straight, sim-assumption, sim-fx, sim-formula, sim-label.

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

// ---- /simulation: ONE loss card (MIN-4774), scenarios S1 to S10 of MIN-4776 ----------------------------------------------------------------
// Every expected figure is read from the `reach` block of data/synthetic/simulation.json (the file the build serves) and formatted here by the
// written rule (spec A16 section 3: 3 significant figures with the unit word from a million, whole under 1,000), never by the app's formatter.
// Words come from docs/simulation-copy.md (Anna, MIN-4770) and the CTO's fixed label. Test ids: see the comment above.
type CheckPoint = { share_pct: number; loss_eur: number; drop_eur: number; matched: number; fewer_dx: number };
type Geo = {
  id: string; name: string; year: number; population: number; spend_total_eur: number; loss0_eur: number; drop_at_100_eur: number; loss_at_100_eur: number;
  plan_share_pct: number; check_points: CheckPoint[];
  spend_source: { name: string; url: string }; population_source: { name: string; url: string };
  original: { currency: string; total: number; fx: null | { usd_per_eur: number; year: number } };
};
type ReachBlock = { slider: { min_pct: number; max_pct: number; step_pct: number }; plan: { patients: number; month: number }; geographies: Geo[] };
const REACH = (JSON.parse(readFileSync(path.resolve('data/synthetic/simulation.json'), 'utf8')) as { reach: ReachBlock }).reach;
const GEOS = REACH.geographies;
const SHARES = [0, 1, 10, 50, 100];
const point = (g: Geo, share: number) => {
  const p = g.check_points.find((c) => c.share_pct === share);
  if (!p) throw new Error(`no check point at ${share}% for ${g.id} in the reach block`);
  return p;
};
const UNITS = [[1e12, 'trillion'], [1e9, 'billion'], [1e6, 'million']] as const;
const sig3 = (x: number) => String(Number(x.toPrecision(3)));
/** Spec A16 section 3: from 1 million, 3 significant figures and the word; under 1 million in thousands ("€201k"); under 1,000 whole. */
function money(v: number, sym = '€'): string {
  const n = Math.abs(v);
  if (n < 1000) return `${sym}${Math.round(n)}`;
  const u = UNITS.find(([m]) => Number((n / m).toPrecision(3)) >= 1);
  return u ? `${sym}${sig3(n / u[0])} ${u[1]}` : `${sym}${Math.round(n / 1000).toLocaleString('en-US')}k`;
}
function count(v: number): string {
  const n = Math.round(v);
  if (n < 999_500) return n.toLocaleString('en-US');
  const u = UNITS.find(([m]) => Number((n / m).toPrecision(3)) >= 1)!;
  return `${sig3(n / u[0])} ${u[1]}`;
}
/** The share of the loss that is gone: whole from 10, one decimal from 1, one significant figure below 1. */
const lossPct = (p: number) => (p >= 10 ? `${Math.round(p)}%` : p >= 1 ? `${p.toFixed(1)}%` : `${Number(p.toPrecision(1))}%`);
const smallShare = (p: number) => `${p >= 10 ? Math.round(p) : Number(p.toPrecision(2))}%`;
const planYear = REACH.plan.month / 12;
const OLD_IDS = /^sim-(diagram|hero|timeline|income|band|year|plateau|total-money|value-money|markers|fact|scale|caption|line-matches)/;
const MINUS = /[−-]/;

const card = (page: Page) => T(page, 'sim-loss-card');
const shareOf = async (page: Page) => Number(await card(page).getAttribute('data-share'));
/** "€2.19 billion" or the axis' "€2.5 bn" -> a number (for the order checks only; equality checks compare text). */
const SCALE: Record<string, number> = { trillion: 1e12, tn: 1e12, billion: 1e9, bn: 1e9, million: 1e6, m: 1e6, k: 1e3 };
const euros = (t: string) => {
  const m = /€([\d.,]+)\s*(trillion|billion|million|tn|bn|m|k)?\b/.exec(t);
  if (!m) throw new Error(`no euro figure in "${t}"`);
  return Number(m[1].replace(/,/g, '')) * (m[2] ? SCALE[m[2]] : 1);
};

async function openCard(page: Page) {
  await page.goto('/simulation');
  await expect(card(page)).toBeVisible({ timeout: 30_000 });
}
async function pickGeo(page: Page, g: Geo) {
  await page.locator(`label[for="${await T(page, `sim-geo-${g.id}`).getAttribute('id')}"]`).click();
  await expect(card(page)).toHaveAttribute('data-geo', g.id);
}
/** Puts the slider on `share` with the keyboard where the brief names a key (Home, End, arrows), else by value. */
async function setShare(page: Page, share: number) {
  const s = T(page, 'sim-slider');
  if (share === 0) { await s.focus(); await page.keyboard.press('Home'); }
  else if (share === 100) { await s.focus(); await page.keyboard.press('End'); }
  else await s.fill(String(share));
  await expect(card(page)).toHaveAttribute('data-share', String(share));
}
async function expectReadout(page: Page, g: Geo, share: number) {
  const p = point(g, share);
  const where = `${g.id} at ${share}%`;
  await expect(T(page, 'sim-value-loss'), `loss, ${where}`).toHaveText(money(p.loss_eur));
  await expect(T(page, 'sim-value-drop'), `"Lower by", ${where}`).toHaveText(share === 0 ? '€0' : money(p.drop_eur));
  await expect(T(page, 'sim-value-drop'), `"Lower by" carries no minus, ${where}`).not.toHaveText(MINUS);
  await expect(T(page, 'sim-drop-pct'), `drop as a share of the loss, ${where}`).toHaveText(share === 0 ? '' : `(${lossPct((p.drop_eur / g.loss0_eur) * 100)})`);
  await expect(T(page, 'sim-value-matches'), `records with a match, ${where}`).toHaveText(count(p.matched));
  // fewer_dx is stored to one decimal (370894.5 for 370894.476...), so a whole count on screen is within half a diagnosis of it, not its re-rounding.
  const dx = (await T(page, 'sim-value-dx').textContent())!;
  if (p.fewer_dx < 999_000) expect(Math.abs(Number(dx.replace(/,/g, '')) - p.fewer_dx), `correct diagnoses gained, ${where}: ${dx}`).toBeLessThanOrEqual(0.5);
  else expect(dx, `correct diagnoses gained, ${where}`).toBe(count(p.fewer_dx));
  // The title is the loss with nobody in the network; the slider never changes it.
  await expect(T(page, 'sim-title'), `title, ${where}`).toContainText(money(g.loss0_eur));
}
const bodyText = (page: Page) => page.locator('body').innerText();

test.describe('/simulation, one loss card (MIN-4776)', () => {
  test('S1 one card, none of the old page, opens on Greece at 0% with the Greece title', async ({ page }) => {
    await openCard(page);
    await expect(card(page)).toHaveCount(1);
    await expect(page.locator('input[type=range]')).toHaveCount(1);
    const ids = await page.evaluate(() => [...document.querySelectorAll('[data-testid]')].map((e) => (e as HTMLElement).dataset.testid!));
    expect(ids.filter((i) => OLD_IDS.test(i)), 'test ids of the plan-month or animated page').toEqual([]);
    const greece = GEOS[0];
    expect(greece.id, 'the first geography in the file is Greece').toBe('greece');
    await expect(card(page)).toHaveAttribute('data-geo', 'greece');
    await expect(card(page)).toHaveAttribute('data-share', '0');
    await expect(T(page, 'sim-geo-greece')).toBeChecked();
    await expect(T(page, 'sim-title')).toHaveText(new RegExp(`^${greece.name}'s health system loses about ${money(greece.loss0_eur).replace(/[.$]/g, '\\$&')} a year`));
    await expect(T(page, 'sim-label')).toContainText('synthetic');
    await expect(T(page, 'sim-money')).toContainText('Lower by');
    await expectReadout(page, greece, 0);
    await expect(T(page, 'sim-state')).toContainText('the loss is unchanged');
  });

  for (const g of GEOS) {
    test(`S2 ${g.id}: loss and "Lower by" equal the reach block at ${SHARES.join(', ')}%`, async ({ page }) => {
      await openCard(page);
      await pickGeo(page, g);
      for (const s of SHARES) {
        await setShare(page, s);
        await expectReadout(page, g, s);
      }
      // The plan line is the block's plan point.
      const plan = g.check_points.find((c) => c.share_pct === g.plan_share_pct)!;
      await expect(T(page, 'sim-plan-marker')).toContainText(`Our plan, year ${planYear}: ${smallShare(g.plan_share_pct)}`);
      await expect(T(page, 'sim-plan-line')).toContainText(`${count(REACH.plan.patients)} patients is ${smallShare(g.plan_share_pct)}`);
      await expect(T(page, 'sim-plan-line')).toContainText(`falls by ${money(plan.drop_eur)} a year`);
      // The € axis starts at €0 and its top is at or above the loss.
      await expect(T(page, 'sim-tick-0')).toHaveText('€0');
      expect(euros((await T(page, 'sim-tick-2').textContent())!), 'top of the € axis').toBeGreaterThanOrEqual(g.loss0_eur);
      // Source line, spending base, the share caveat.
      const src = T(page, 'sim-sources');
      await expect(src).toContainText(g.spend_source.name);
      await expect(src).toContainText(g.population_source.name);
      await expect(src.locator(`a[href="${g.spend_source.url}"]`)).toHaveCount(1);
      await expect(src.locator(`a[href="${g.population_source.url}"]`)).toHaveCount(1);
      await expect(T(page, 'sim-base')).toContainText(`${g.name}, ${g.year}, ${money(g.spend_total_eur)} a year`);
      await expect(T(page, 'sim-formula')).toContainText(money(g.drop_at_100_eur));
      await expect(T(page, 'sim-share-note')).toContainText('OECD model estimate');
    });
  }

  test('S3 the switch by click and by keyboard changes title, figures and source line; the share is kept', async ({ page }) => {
    await openCard(page);
    const titles = new Set<string>();
    for (const g of GEOS) {
      await pickGeo(page, g);
      titles.add((await T(page, 'sim-title').textContent())!);
      await expect(T(page, 'sim-title')).toContainText(money(g.loss0_eur));
      await expect(T(page, 'sim-sources')).toContainText(g.spend_source.name);
    }
    expect(titles.size, 'one title per geography').toBe(GEOS.length);
    // Keyboard: the radios are one group; arrows move the choice.
    await setShare(page, 100);
    await T(page, 'sim-geo-greece').focus();
    await page.keyboard.press('Space');
    await expect(card(page)).toHaveAttribute('data-geo', GEOS[0].id);
    for (const g of GEOS.slice(1)) {
      await page.keyboard.press('ArrowRight');
      await expect(card(page)).toHaveAttribute('data-geo', g.id);
      await expect(card(page), 'the share stays when the geography changes').toHaveAttribute('data-share', '100');
      await expectReadout(page, g, 100);
    }
  });

  test('S4 the slider: 0 to 100% in 0.1% steps, Home, End and arrows, aria-valuetext, 44 px', async ({ page }) => {
    await openCard(page);
    const s = T(page, 'sim-slider');
    await expect(s).toHaveAttribute('min', String(REACH.slider.min_pct));
    await expect(s).toHaveAttribute('max', String(REACH.slider.max_pct));
    await expect(s).toHaveAttribute('step', String(REACH.slider.step_pct));
    const box = (await s.boundingBox())!;
    expect(box.height, 'slider touch height in px').toBeGreaterThanOrEqual(44);
    await s.focus();
    await page.keyboard.press('End');
    expect(await shareOf(page)).toBe(100);
    await page.keyboard.press('Home');
    expect(await shareOf(page)).toBe(0);
    for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowRight');
    expect(await shareOf(page), 'ten arrow presses from 0').toBe(1);
    await expectReadout(page, GEOS[0], 1);
    await page.keyboard.press('ArrowLeft');
    expect(await shareOf(page), 'one step is 0.1%').toBe(0.9);
    await page.keyboard.press('ArrowRight');
    const p = point(GEOS[0], 1);
    await expect(s).toHaveAttribute('aria-valuetext', `1% of ${GEOS[0].name}'s patients in the network. The loss falls by ${money(p.drop_eur)} a year.`);
  });

  test('S5 a pointer drag from 0 to 100%: the loss never rises and ends at the block\'s 100% value', async ({ page }) => {
    await openCard(page);
    const g = GEOS[0];
    const box = (await T(page, 'sim-slider').boundingBox())!;
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + 2, y);
    await page.mouse.down();
    let last = Infinity;
    let lastShare = -1;
    const seen: number[] = [];
    for (let i = 0; i <= 24; i++) {
      await page.mouse.move(box.x + 2 + ((box.width + 10) * i) / 24, y);
      const share = await shareOf(page);
      const loss = euros((await T(page, 'sim-value-loss').textContent())!);
      expect(share, `share after step ${i}`).toBeGreaterThanOrEqual(lastShare);
      expect(loss, `loss after step ${i} (share ${share}%)`).toBeLessThanOrEqual(last);
      last = loss;
      lastShare = share;
      seen.push(share);
    }
    await page.mouse.up();
    expect(new Set(seen).size, 'the drag moved the share through many values').toBeGreaterThan(10);
    expect(await shareOf(page)).toBe(100);
    await expectReadout(page, g, 100);
    await expect(T(page, 'sim-state')).toHaveText(/at the synthetic match rate/);
  });

  test('S6 Global shows 2023, the ECB rate and the caveat without a tap', async ({ page }) => {
    const w = GEOS.find((x) => x.id === 'world')!;
    expect(w.original.fx, 'the Global view converts from US$ in the file').not.toBeNull();
    await openCard(page);
    await pickGeo(page, w);
    const fx = T(page, 'sim-fx');
    await expect(fx).toBeVisible();
    await expect(fx).toContainText(String(w.year));
    await expect(fx).toContainText(`ECB's ${w.original.fx!.year} average rate, US$${w.original.fx!.usd_per_eur.toFixed(4)} per €1`);
    await expect(fx).toContainText(money(w.original.total, 'US$'));
    await expect(T(page, 'sim-share-note')).toBeVisible();
    await expect(T(page, 'sim-share-note')).toContainText('Low- and middle-income countries differ widely');
    await expect(T(page, 'sim-share-note')).toContainText('Read it as a scale, not a measurement');
    // Only the converted view names a rate.
    await pickGeo(page, GEOS[0]);
    await expect(T(page, 'sim-fx')).toHaveCount(0);
  });

  test('S7 words: no standalone "saved", no drop as a headline, no income figure', async ({ page }) => {
    const eu = GEOS.find((x) => x.id === 'eu27')!;
    await openCard(page);
    for (const g of GEOS) {
      await pickGeo(page, g);
      for (const s of [0, 100]) {
        await setShare(page, s);
        const text = await bodyText(page);
        expect(text, `"saved", ${g.id} at ${s}%`).not.toMatch(/\bsaved\b/i);
        expect(text, `revenue or our income, ${g.id} at ${s}%`).not.toMatch(/\brevenue\b|\bour income\b|\bincome\s*(of|:)?\s*(€|US\$)/i);
        await expect(T(page, 'sim-title'), 'the title is the loss, never the drop').not.toContainText(money(g.drop_at_100_eur));
        await expect(T(page, 'sim-title')).not.toContainText(money(eu.drop_at_100_eur));
      }
    }
    // Europe's drop at 100% is shown where it belongs, in the "Lower by" readout.
    await pickGeo(page, eu);
    await expect(T(page, 'sim-value-drop')).toHaveText(money(eu.drop_at_100_eur));
    await pickGeo(page, GEOS[0]);
    await setShare(page, 0);
    expect(await bodyText(page), 'the Europe 100% drop on the Greece opening view').not.toContain(money(eu.drop_at_100_eur).slice(1));
  });

  test('S8 nothing animates: no running animation, no SMIL, the plot is still when nobody touches it', async ({ page }) => {
    await openCard(page);
    for (const g of GEOS) {
      await pickGeo(page, g);
      await setShare(page, 100);
      const a = await T(page, 'sim-svg').evaluate((e) => e.outerHTML);
      await page.waitForTimeout(800);
      const b = await T(page, 'sim-svg').evaluate((e) => e.outerHTML);
      expect(b, `the plot changed with nobody touching it (${g.id})`).toBe(a);
      expect(await page.evaluate(() => document.getAnimations().length), `running animations (${g.id})`).toBe(0);
      expect(await page.locator('animate, animateTransform, animateMotion, set').count(), 'SMIL elements').toBe(0);
    }
  });

  test('S9 no horizontal scroll in any view at 0 and 100%', async ({ page }) => {
    await openCard(page);
    for (const g of GEOS) {
      await pickGeo(page, g);
      for (const s of [0, 100]) {
        await setShare(page, s);
        expect(await overflow(page), `px of sideways scroll, ${g.id} at ${s}%`).toBeLessThanOrEqual(0);
      }
    }
  });

  test('S10 the page calls no backend', async ({ page, baseURL }) => {
    const bad = watchNoPost(page, new URL(baseURL!).origin);
    await openCard(page);
    for (const g of GEOS) { await pickGeo(page, g); await setShare(page, 100); }
    expect(bad).toEqual([]);
  });
});
