import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Health } from './Health';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Health />
  </StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
