import { expect, test } from '@playwright/test';

// MIN-4752: the landing nav pill is centred from 768px up; below 768px it spans the viewport with 24px gaps.
// The landing is a separate app (landing/), not served by staging-dev (the product SPA). Static page, no backend, no data.
// Run: (cd landing && npm ci && npm run build && npx vite preview --port 4173) then
//      HEALTHAPP_LANDING_URL=http://127.0.0.1:4173 npx playwright test -c playwright.landing.config.ts
async function gaps(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const r = document.querySelector('nav.nav')!.getBoundingClientRect();
    const de = document.documentElement;
    return { left: r.left, right: de.clientWidth - r.right, scrollW: de.scrollWidth, clientW: de.clientWidth };
  });
}

for (const w of [768, 1180, 1440]) {
  test(`L1 nav pill is centred at ${w}px (left gap = right gap, no horizontal scroll)`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto('/');
    await expect(page.locator('nav.nav')).toBeVisible();
    const g = await gaps(page);
    expect(Math.abs(g.left - g.right), `left ${g.left} right ${g.right}`).toBeLessThanOrEqual(1);
    expect(g.left).toBeGreaterThan(24 - 1); // actually inset, not flush
    expect(g.scrollW).toBeLessThanOrEqual(g.clientW);
  });
}

test('L2 nav pill keeps 24px gaps both sides at 390px, no horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('nav.nav')).toBeVisible();
  const g = await gaps(page);
  expect(g.left).toBeCloseTo(24, 0);
  expect(g.right).toBeCloseTo(24, 0);
  expect(g.scrollW).toBeLessThanOrEqual(g.clientW);
});
