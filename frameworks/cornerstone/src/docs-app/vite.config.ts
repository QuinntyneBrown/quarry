import angular from '@analogjs/vite-plugin-angular';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: projectRoot,
  // Overridable so this vendored copy can build for hosting under a subpath (Quarry's
  // /design-systems/cornerstone/ embed) without changing Cornerstone's own root-hosted default.
  base: process.env.QUARRY_DESIGN_SYSTEM_BASE ?? '/',
  publicDir: resolve(projectRoot, 'public'),
  plugins: [angular({ tsconfig: resolve(projectRoot, 'tsconfig.app.json') })],
  resolve: {
    alias: {
      '@quinntyne/cornerstone': resolve(projectRoot, '../cornerstone/public-api.ts'),
    },
  },
  build: {
    outDir: resolve(projectRoot, '../../dist/design-system/browser'),
    emptyOutDir: true,
    sourcemap: false,
  },
});
