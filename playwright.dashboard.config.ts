import { defineConfig, devices } from '@playwright/test';

// Live doctor dashboard, slice 1 (MIN-4668): scenarios against staging-dev (env dev, schema healthapp_dev, synthetic data only).
// NEVER staging or production: since MIN-4658 those read healthapp_demo, the founder's real record. The spec aborts before sign-in unless /health says dev.
// Not a PR gate and not in the smoke job. Run: HEALTHAPP_DEMO_PASSCODE=... npx playwright test -c playwright.dashboard.config.ts
export default defineConfig({
  testDir: 'e2e-live',
  testMatch: 'doctor-dashboard.spec.ts',
  timeout: 180_000,
  retries: 0,
  workers: 1,
  reporter: 'list',
  // No trace, no video: the passcode is typed into a field and must not be recorded.
  use: { baseURL: process.env.HEALTHAPP_LIVE_URL ?? 'https://staging-dev.healthapp-8ui.pages.dev', trace: 'off', video: 'off', screenshot: 'off' },
  projects: [
    { name: 'phone-390', use: { ...devices['iPhone 14'], viewport: { width: 390, height: 844 }, browserName: 'webkit' } },
    { name: 'desktop-1280', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } } },
  ],
});
