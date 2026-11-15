import { defineConfig, devices } from '@playwright/test';

// iOS glass redesign (MIN-4591): live scenarios against staging, env dev, synthetic data only. Not a PR gate.
// Run: HEALTHAPP_DEMO_PASSCODE=... npx playwright test -c playwright.glass.config.ts
export default defineConfig({
  testDir: 'e2e-live',
  testMatch: 'glass-redesign.spec.ts',
  timeout: 150_000,
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
