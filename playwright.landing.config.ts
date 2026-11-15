import { defineConfig } from '@playwright/test';

// Landing layout checks (MIN-4752): static page, no data. Not a PR gate, not in smoke.
// Target: a build of landing/ served with `vite preview`, or any deployed landing URL.
export default defineConfig({
  testDir: 'e2e-live',
  testMatch: 'landing-nav.spec.ts',
  timeout: 30_000,
  retries: 0,
  reporter: 'list',
  use: { baseURL: process.env.HEALTHAPP_LANDING_URL ?? 'http://127.0.0.1:4173', trace: 'off', video: 'off', screenshot: 'off' },
  projects: [{ name: 'desktop', use: { browserName: 'chromium' } }],
});
