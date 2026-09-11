import angular from '@analogjs/vite-plugin-angular';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: projectRoot,
  publicDir: resolve(projectRoot, 'public'),
  plugins: [angular({ tsconfig: resolve(projectRoot, 'tsconfig.app.json') })],
  resolve: {
    alias: {
      '@quinntyne/cornerstone': resolve(projectRoot, '../cornerstone/public-api.ts'),
    },
  },
  build: {
    outDir: resolve(projectRoot, '../../dist/e2e-app/browser'),
    emptyOutDir: true,
    sourcemap: false,
  },
});
