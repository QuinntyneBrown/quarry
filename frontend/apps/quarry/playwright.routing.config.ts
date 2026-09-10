import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/tests/routing",
  outputDir: "./test-results/routing",
  workers: 1,
  use: { trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "development", use: { baseURL: "http://127.0.0.1:4190" } },
    { name: "production-build", use: { baseURL: "http://127.0.0.1:4192" } }
  ],
  webServer: [
    { command: "node e2e/fixtures/routingApi.mjs", port: 4191 },
    { command: "npm run dev -- --port 4190 --strictPort", port: 4190, env: { QUARRY_API_PROXY: "http://127.0.0.1:4191" } },
    { command: "npx vite preview --host 127.0.0.1 --port 4192 --strictPort", port: 4192, env: { QUARRY_API_PROXY: "http://127.0.0.1:4191" } }
  ]
});
