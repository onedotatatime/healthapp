import { defineConfig, devices } from '@playwright/test';

// Live doctor dashboard, slice 2: Related diagnoses (MIN-4668) on staging-dev (env dev, schema healthapp_dev, synthetic personas only).
// NEVER staging or production: since MIN-4658 those read healthapp_demo, the founder's real record. The spec aborts before sign-in unless /health says dev.
// Each press of "List related diagnoses" is a paid Gemini call (about 30-40 s): the spec makes 2 at 1280 and 1 at 390, and no more.
// Not a PR gate and not in the smoke job. Run: HEALTHAPP_DEMO_PASSCODE=... npx playwright test -c playwright.diagnoses.config.ts
export default defineConfig({
  testDir: 'e2e-live',
  testMatch: 'doctor-diagnoses.spec.ts',
  timeout: 240_000,
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
