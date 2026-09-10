import { expect, test } from "@playwright/test";
import { cpus, platform, release, totalmem, arch } from "node:os";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { BrowserPerformancePage } from "../../pages/BrowserPerformancePage";

// L2-032.2, L2-032.4: production browser startup, explicitly using a mock API.
test("20 fresh production loads meet the throttled browse startup budget", async ({ browser, request, baseURL }, testInfo) => {
  const catalog = await request.get("/api/frameworks");
  expect(catalog.ok()).toBe(true);
  const firstPage = await catalog.json();
  expect(firstPage.total).toBe(1000);
  expect(firstPage.items).toHaveLength(24);
  // Validate the actual workload rather than trusting the mock's total field.
  const ids = new Set<string>();
  let batch = firstPage;
  while (true) {
    expect(batch.items.length).toBeGreaterThan(0);
    expect(batch.items.length).toBeLessThanOrEqual(24);
    for (const item of batch.items) {
      expect(ids.has(item.id)).toBe(false);
      ids.add(item.id);
      expect(item.description).toHaveLength(2000);
      expect(item.tags).toHaveLength(20);
    }
    if (!batch.hasNextPage) break;
    const next = await request.get(`/api/frameworks?cursor=${encodeURIComponent(batch.nextCursor)}`);
    expect(next.ok()).toBe(true);
    batch = await next.json();
  }
  expect(ids.size).toBe(1000);

  const samples: number[] = [];
  const failures: string[] = [];
  const navigationTimings: Record<string, number>[] = [];
  let successfulLoads = 0;
  const profile = { downloadBitsPerSecond: 10_000_000, uploadBitsPerSecond: 2_000_000, roundTripMilliseconds: 100, cpuSlowdown: 4 };
  for (let attempt = 0; attempt < 20; attempt++) {
    const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 900 }, serviceWorkers: "block" });
    try {
      const page = await context.newPage();
      const session = await context.newCDPSession(page);
      await session.send("Network.enable");
      await session.send("Network.setCacheDisabled", { cacheDisabled: true });
      await session.send("Network.emulateNetworkConditions", { offline: false,
        latency: profile.roundTripMilliseconds, downloadThroughput: profile.downloadBitsPerSecond / 8,
        uploadThroughput: profile.uploadBitsPerSecond / 8, connectionType: "cellular4g" });
      await session.send("Emulation.setCPUThrottlingRate", { rate: profile.cpuSlowdown });
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      page.on("requestfailed", request => errors.push(`Failed request: ${request.url()}`));
      page.on("response", response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`); });
      page.on("request", request => {
        if (new URL(request.url()).origin !== baseURL) errors.push(`Unexpected external request: ${request.url()}`);
      });
      samples.push(await new BrowserPerformancePage(page).measureFreshBrowse());
      navigationTimings.push(await page.evaluate(() => {
        const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
        return { timeOrigin: performance.timeOrigin, responseHeaderMilliseconds: navigation.responseStart - navigation.requestStart,
          responseCompleteMilliseconds: navigation.responseEnd - navigation.requestStart,
          transferBytes: navigation.transferSize, domContentLoadedMilliseconds: navigation.domContentLoadedEventEnd };
      }));
      failures.push(...errors.map(error => `Load ${attempt + 1}: ${error}`));
      if (errors.length === 0) successfulLoads++;
    } catch (error) {
      failures.push(`Load ${attempt + 1}: ${String(error)}`);
    } finally { await context.close(); }
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const p95 = sorted.length === 20 ? sorted[Math.ceil(sorted.length * 0.95) - 1] : null;
  const report = {
    measuredAtUtc: new Date().toISOString(), commit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    workingTreeDirty: execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim().length > 0,
    buildIndexSha256: createHash("sha256").update(await readFile("dist/index.html")).digest("hex"),
    requirement: "L2-032.2", productionBuild: true, browser: browser.version(), profile,
    host: { platform: platform(), release: release(), architecture: arch(), cpu: cpus()[0]?.model, logicalProcessors: cpus().length, memoryBytes: totalmem() },
    viewport: { width: 1440, height: 900 }, freshContexts: 20, cacheDisabled: true, serviceWorkers: "blocked",
    backend: "HTTP mock; 1,000 synthetic frameworks; no database or embedding provider",
    embeddingConfiguration: "Not invoked; this report cannot satisfy the real semantic-search budget.",
    descriptionCharacters: 2000, tagsPerFramework: 20, firstPageSize: 24,
    timing: "Navigation performance time origin to usable controls and 24 rendered cards, plus two animation frames; nearest-rank p95",
    samplesMilliseconds: samples, navigationTimings, successfulLoads, failures, p95Milliseconds: p95,
    budgetMilliseconds: 3000, passed: failures.length === 0 && p95 !== null && p95 <= 3000
  };
  const reportPath = testInfo.outputPath("browser-load.json");
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  await testInfo.attach("browser-load", { path: reportPath, contentType: "application/json" });
  expect(failures).toEqual([]);
  expect(samples).toHaveLength(20);
  expect(p95).toBeLessThanOrEqual(3000);
});
