import { defineConfig } from '@playwright/test';

// smoke: one journey, Chromium only, every backend call mocked (testing-strategy.md section 2).
export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4173' },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    // Fake values only: nothing here reaches a real project (the test mocks the call).
    command: 'npm run build && npx vite preview --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      VITE_SUPABASE_URL: 'https://smoke.invalid',
      VITE_SUPABASE_ANON_KEY: 'smoke-anon-key',
      VITE_HEALTHAPP_ENV: 'dev',
    },
  },
});
