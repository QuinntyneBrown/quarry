import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/specs',
  outputDir: './verification/playwright-results',
  snapshotDir: './verification/baselines',
  snapshotPathTemplate: '{snapshotDir}/{testFilePath}/{arg}-{platform}{ext}',
  fullyParallel: true,
  retries: process.env['CI'] ? 2 : 0,
  reporter: process.env['CI']
    ? [['html', { outputFolder: 'verification/playwright-report', open: 'never' }], ['github']]
    : 'list',
  use: { baseURL: 'http://127.0.0.1:4175', trace: 'on-first-retry' },
  expect: {
    timeout: 15_000,
    toHaveScreenshot: { animations: 'disabled', maxDiffPixelRatio: 0.01 },
  },
  webServer: [
    {
      command:
        'npm run build:docs && vite preview --config src/docs-app/vite.config.ts --host 127.0.0.1 --port 4175',
      url: 'http://127.0.0.1:4175',
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command:
        'npm run build:e2e-app && vite preview --config src/e2e-app/vite.config.ts --host 127.0.0.1 --port 4176',
      url: 'http://127.0.0.1:4176',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
  projects: [
    { name: 'chromium', testMatch: 'docs.spec.ts', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', testMatch: 'docs.spec.ts', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', testMatch: 'docs.spec.ts', use: { ...devices['Desktop Safari'] } },
    {
      name: 'components-chromium',
      testMatch: ['components.spec.ts', 'event-components.spec.ts'],
      use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:4176' },
    },
    {
      name: 'components-firefox',
      testMatch: ['components.spec.ts', 'event-components.spec.ts'],
      use: { ...devices['Desktop Firefox'], baseURL: 'http://127.0.0.1:4176' },
    },
    {
      name: 'components-webkit',
      testMatch: ['components.spec.ts', 'event-components.spec.ts'],
      use: { ...devices['Desktop Safari'], baseURL: 'http://127.0.0.1:4176' },
    },
  ],
});
