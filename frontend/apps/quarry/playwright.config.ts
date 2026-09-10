import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/tests",
  outputDir: "./test-results/browser",
  workers: process.env.CI ? 2 : undefined,
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    ...[
      { name: "XS", width: 320, height: 740 },
      { name: "SM", width: 576, height: 800 },
      { name: "MD", width: 768, height: 1024 },
      { name: "LG", width: 992, height: 800 },
      { name: "XL", width: 1440, height: 900 }
    ].map(({ name, width, height }) => ({ name, use: { viewport: { width, height } }, testIgnore: ["**/layout.spec.ts", "**/zoom.spec.ts", "**/routing/**", "**/performance/**"] })),
    { name: "layout-boundaries", testMatch: "**/layout.spec.ts" },
    { name: "browser-zoom", testIgnore: ["**/layout.spec.ts", "**/routing/**", "**/performance/**"], use: { viewport: null } }
  ],
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
