import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Cloudflare Pages provides CF_PAGES_COMMIT_SHA at build time. No variable to set.
const commitSha = (process.env.CF_PAGES_COMMIT_SHA ?? process.env.GITHUB_SHA ?? 'local').slice(0, 7);

export default defineConfig({
  plugins: [react()],
  // Cron's contract.ts is written for Deno (`npm:zod@4.6.7`). The drift test imports it as is.
  resolve: { alias: { 'npm:zod@4.6.7': 'zod' } },
  define: { __COMMIT_SHA__: JSON.stringify(commitSha) },
  build: { outDir: 'dist', sourcemap: false },
  test: { include: ['src/**/*.test.ts'] },
});
