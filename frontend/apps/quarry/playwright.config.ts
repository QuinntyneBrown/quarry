import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/tests",
  use: { baseURL: "http://127.0.0.1:4173" },
  webServer: [{
    command: "npm run dev -- --port 4173",
    port: 4173,
    reuseExistingServer: !process.env.CI
  }, {
    command: "node ../quarry-preview/server.mjs",
    url: "http://localhost:4180/bundles/illustrative-v1/index.html",
    reuseExistingServer: !process.env.CI
  }]
});
