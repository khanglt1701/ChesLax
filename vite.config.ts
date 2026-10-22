import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
    proxy: {
      '/socket.io': {
        target: 'http://127.0.0.1:3001',
        ws: true,
      },
      '/api': {
        target: 'http://127.0.0.1:3001',
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'server/src/**/*.test.ts'],
  },
});
