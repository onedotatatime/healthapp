import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Three HTML entries: the landing page at /, the pitch deck at /deck and the story deck at /story.
// The decks are built to dist/deck/index.html and dist/story/index.html, so Cloudflare Pages serves /deck and /story
// (and the trailing-slash forms) with no redirect file. The landing at / is unchanged.
export default defineConfig({
  plugins: [
    react(),
    {
      // Dev only: make /deck and /story behave like /deck/ and /story/ (the Vite SPA fallback would serve the landing).
      name: 'deck-dev-redirect',
      configureServer(server) {
        server.middlewares.use((req: { url?: string }, _res: unknown, next: () => void) => {
          if (req.url) req.url = req.url.replace(/^\/(deck|story)(?=\?|#|$)/, '/$1/');
          next();
        });
      },
    },
  ],
  build: {
    rollupOptions: {
      input: { main: 'index.html', deck: 'deck/index.html', story: 'story/index.html' },
    },
  },
});
