import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [angular({ tsconfig: 'src/cornerstone/tsconfig.spec.json' })],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/cornerstone/**/*.spec.ts'],
    setupFiles: ['./test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/cornerstone/**/*.ts'],
      exclude: ['src/cornerstone/**/*.spec.ts'],
      thresholds: { statements: 5, branches: 5, functions: 5, lines: 5 },
    },
  },
});
