import { defineConfig } from '@playwright/test';

// Simulations story (MIN-4612): live scenarios against staging, synthetic data only. Not a PR gate, not in the smoke job.
// Run: set -a; . ~/.config/healthapp/demo-login.env; set +a; npx playwright test -c playwright.simulation.config.ts
// /simulation is public. /doctor/simulate needs HEALTHAPP_DEMO_PASSCODE (dev demo login); those tests skip without it.
export default defineConfig({
  testDir: 'e2e-live',
  timeout: 120_000,
  retries: 0,
  workers: 1,
  reporter: 'list',
  // No trace, no video: the passcode is typed into a field and must not be recorded.
  use: { baseURL: process.env.HEALTHAPP_LIVE_URL ?? 'https://staging-dev.healthapp-8ui.pages.dev', trace: 'off', video: 'off', screenshot: 'off' },
  projects: [
    { name: 'desktop-1280', testMatch: /simulat(e|ions)\.spec\.ts/, use: { browserName: 'chromium', viewport: { width: 1280, height: 900 } } },
    { name: 'phone-390', testMatch: /simulations\.spec\.ts/, use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
  ],
});
