import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/tests/performance",
  outputDir: "./test-results/performance",
  timeout: 180_000,
  workers: 1,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:4194",
    viewport: { width: 1440, height: 900 },
    trace: "off", screenshot: "off", video: "off"
  },
  webServer: [
    { command: "node e2e/fixtures/performanceApi.mjs", port: 4193 },
    { command: "npx vite preview --host 127.0.0.1 --port 4194 --strictPort", port: 4194,
      env: { QUARRY_API_PROXY: "http://127.0.0.1:4193" } }
  ]
});
