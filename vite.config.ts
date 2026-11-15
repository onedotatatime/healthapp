import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { buildEnv } from './src/lib/buildEnv';

// Cloudflare Pages provides CF_PAGES_COMMIT_SHA at build time. No variable to set.
const commitSha = (process.env.CF_PAGES_COMMIT_SHA ?? process.env.GITHUB_SHA ?? 'local').slice(0, 7);

// MIN-4658: the branch named `staging` builds as `demo`. Any other branch (or none) gets no override, so its output is unchanged.
const branch = process.env.CF_PAGES_BRANCH;
const healthappEnv = buildEnv(branch, process.env.VITE_HEALTHAPP_ENV);
const envOverride = branch === 'staging' ? { 'import.meta.env.VITE_HEALTHAPP_ENV': JSON.stringify(healthappEnv) } : {};

export default defineConfig({
  plugins: [react()],
  // Cron's contract.ts is written for Deno (`npm:zod@4.6.7`). The drift test imports it as is.
  resolve: { alias: { 'npm:zod@4.6.7': 'zod' } },
  define: { __COMMIT_SHA__: JSON.stringify(commitSha), ...envOverride },
  build: { outDir: 'dist', sourcemap: false },
  test: { include: ['src/**/*.test.ts'] },
});
