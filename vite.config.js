import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { store } from './config/store.config.js';

const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** Inyecta el nombre y la descripción de la tienda en index.html */
const storeMeta = () => ({
  name: 'store-meta',
  transformIndexHtml(html) {
    return html
      .replace(/%STORE_NAME%/g, escapeHtml(store.name))
      .replace(/%STORE_TAGLINE%/g, escapeHtml(store.tagline))
      .replace(/%STORE_DESCRIPTION%/g, escapeHtml(store.description))
      .replace(/%STORE_ACCENT%/g, escapeHtml(store.accent));
  },
});

export default defineConfig({
  plugins: [react(), storeMeta()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3001' },
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
  },
});
