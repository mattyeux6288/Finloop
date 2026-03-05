import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// Plugin custom pour forcer la résolution des workspace packages
// depuis les sources TypeScript (Vite gère le TS nativement).
// Nécessaire car les packages compilés en CJS (dist/index.js)
// ne sont pas compatibles avec l'import ESM de Rollup.
function resolveMonorepo() {
  const packages: Record<string, string> = {
    '@finthesis/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    '@finthesis/engine': path.resolve(__dirname, '../engine/src/index.ts'),
  };

  return {
    name: 'resolve-monorepo-packages',
    enforce: 'pre' as const,
    resolveId(source: string) {
      if (packages[source]) {
        console.log(`[resolve-monorepo] ${source} → ${packages[source]}`);
        return packages[source];
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [resolveMonorepo(), react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
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
