import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Cloudflare Pages provides CF_PAGES_COMMIT_SHA at build time. No variable to set.
const commitSha = (process.env.CF_PAGES_COMMIT_SHA ?? process.env.GITHUB_SHA ?? 'local').slice(0, 7);

export default defineConfig({
  plugins: [react()],
  define: { __COMMIT_SHA__: JSON.stringify(commitSha) },
  build: { outDir: 'dist', sourcemap: false },
  test: { include: ['src/**/*.test.ts'] },
});
