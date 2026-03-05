import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Résoudre les workspace packages depuis les sources TS (Vite gère le TS nativement)
      // Évite les problèmes d'import CJS ← ESM avec dist/index.js
      '@finthesis/shared': path.resolve(__dirname, '../shared/src/index.ts'),
      '@finthesis/engine': path.resolve(__dirname, '../engine/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
