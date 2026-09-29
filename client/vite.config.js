// Vite configuration for the React client.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Every request that starts with /api is forwarded to the Express server,
    // so the React code can simply call fetch('/api/status').
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
