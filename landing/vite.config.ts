import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Two HTML entries: the landing page at / and the pitch deck at /deck.
// The deck is built to dist/deck/index.html, so Cloudflare Pages serves /deck
// (and /deck/) with no redirect file. The landing at / is unchanged.
export default defineConfig({
  plugins: [
    react(),
    {
      // Dev only: make /deck behave like /deck/ (the Vite SPA fallback would serve the landing).
      name: 'deck-dev-redirect',
      configureServer(server) {
        server.middlewares.use((req: { url?: string }, _res: unknown, next: () => void) => {
          if (req.url && /^\/deck(\?|#|$)/.test(req.url)) req.url = req.url.replace(/^\/deck/, '/deck/');
          next();
        });
      },
    },
  ],
  build: {
    rollupOptions: {
      input: { main: 'index.html', deck: 'deck/index.html' },
    },
  },
});
