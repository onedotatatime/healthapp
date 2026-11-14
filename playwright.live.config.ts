import { defineConfig } from '@playwright/test';

// Live journey (MIN-4449 step 6): runs against a deployed or local build backed by healthapp_dev, synthetic data only.
// Not a PR gate and not in the smoke job. Run: HEALTHAPP_LIVE_URL=... HEALTHAPP_DEMO_PASSCODE=... npx playwright test -c playwright.live.config.ts
export default defineConfig({
  testDir: 'e2e-live',
  timeout: 150_000,
  retries: 0,
  workers: 1,
  reporter: 'list',
  // No trace, no video: the passcode is typed into a field and must not be recorded.
  use: {
    baseURL: process.env.HEALTHAPP_LIVE_URL ?? 'https://staging.healthapp-8ui.pages.dev',
    viewport: { width: 375, height: 812 },
    trace: 'off',
    video: 'off',
    screenshot: 'off',
  },
  projects: [{ name: 'phone', use: { browserName: 'chromium', hasTouch: true, isMobile: true } }],
});
