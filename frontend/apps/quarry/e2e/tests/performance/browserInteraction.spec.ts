import { expect, test } from "@playwright/test";
import { cpus, platform, release, totalmem, arch } from "node:os";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { InteractionPerformancePage } from "../../pages/InteractionPerformancePage";

// L2-032.3, L2-032.4: loaded interaction latency with a mock API and real illustrative preview.
test("loaded tabs, preview controls and selection meet the 100 ms input budget", async ({ page, context, browser, baseURL }, testInfo) => {
  const profile = { downloadBitsPerSecond: 10_000_000, uploadBitsPerSecond: 2_000_000, roundTripMilliseconds: 100, cpuSlowdown: 4 };
  const session = await context.newCDPSession(page);
  await session.send("Network.enable");
  await session.send("Network.setBypassServiceWorker", { bypass: true });
  await session.send("Network.emulateNetworkConditions", { offline: false,
    latency: profile.roundTripMilliseconds, downloadThroughput: profile.downloadBitsPerSecond / 8,
    uploadThroughput: profile.uploadBitsPerSecond / 8, connectionType: "cellular4g" });
  await session.send("Emulation.setCPUThrottlingRate", { rate: profile.cpuSlowdown });
  const failures: string[] = [];
  context.on("serviceworker", () => failures.push("Unexpected service worker registration."));
  page.on("pageerror", error => failures.push(error.message));
  page.on("response", response => { if (response.status() >= 400) failures.push(`HTTP ${response.status()}: ${response.url()}`); });
  page.on("request", request => {
    if (![baseURL, "http://localhost:4180"].includes(new URL(request.url()).origin)) failures.push(`Unexpected external request: ${request.url()}`);
    if (request.method() !== "GET") failures.push(`Unexpected mutation: ${request.url()}`);
  });
  const model = new InteractionPerformancePage(page);
  await model.open();
  const tabs = await model.measureTabs();
  const frame = await model.readyPreview();
  let previewTarget = "separate frame target";
  const previewSession = await context.newCDPSession(frame).catch(error => {
    // Chromium may keep an opaque sandbox frame in its parent's renderer.
    // In that case Playwright explicitly identifies the parent session as owner.
    if (!(error instanceof Error) || !error.message.includes("This frame does not have a separate CDP session, it is a part of the parent frame's session")) throw error;
    previewTarget = "parent target (Playwright verified shared renderer)";
    return session;
  });
  await previewSession.send("Emulation.setCPUThrottlingRate", { rate: profile.cpuSlowdown });
  await previewSession.send("Network.enable");
  await previewSession.send("Network.setBypassServiceWorker", { bypass: true });
  await previewSession.send("Network.emulateNetworkConditions", { offline: false,
    latency: profile.roundTripMilliseconds, downloadThroughput: profile.downloadBitsPerSecond / 8,
    uploadThroughput: profile.uploadBitsPerSecond / 8, connectionType: "cellular4g" });
  const preview = await model.measurePreview(frame);
  const traceEvents: unknown[] = [];
  if (process.env.QUARRY_PERFORMANCE_TRACE === "1") {
    session.on("Tracing.dataCollected", event => traceEvents.push(...event.value));
    await session.send("Tracing.start", { categories: "devtools.timeline", transferMode: "ReportEvents" });
  }
  const selection = await model.measureSelection();
  if (process.env.QUARRY_PERFORMANCE_TRACE === "1") {
    const complete = new Promise<void>(resolve => session.once("Tracing.tracingComplete", () => resolve()));
    await session.send("Tracing.end");
    await complete;
    await writeFile(testInfo.outputPath("selection-trace.json"), JSON.stringify({ traceEvents }));
  }
  const categories = { tabs, ...preview, selection };
  const p95 = Object.fromEntries(Object.entries(categories).map(([name, samples]) =>
    [name, [...samples].sort((a, b) => a - b)[Math.ceil(samples.length * 0.95) - 1]]));
  const report = {
    measuredAtUtc: new Date().toISOString(), commit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    workingTreeDirty: execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim().length > 0,
    buildIndexSha256: createHash("sha256").update(await readFile("dist/index.html")).digest("hex"),
    requirement: "L2-032.3", productionBuild: true, browser: browser.version(), profile,
    diagnosticTracing: process.env.QUARRY_PERFORMANCE_TRACE === "1",
    host: { platform: platform(), release: release(), architecture: arch(), cpu: cpus()[0]?.model, logicalProcessors: cpus().length, memoryBytes: totalmem() },
    viewport: { width: 1440, height: 900 }, previewCpuSlowdown: 4, previewTarget,
    serviceWorkers: "Network bypass on both targets; registrations fail the benchmark",
    backend: "HTTP mock; 1,000 synthetic frameworks; 2,000-character descriptions and 20 tags; no database or embeddings",
    preview: "Real isolated illustrative-v1 bundle; not a released framework",
    embeddingConfiguration: "Not invoked; this report cannot satisfy the real semantic-search budget.",
    timing: "Trusted pointerdown/keydown timestamp to changed visible feedback plus a paint opportunity; nearest-rank p95; setup excluded",
    samplesMilliseconds: categories, p95Milliseconds: p95, successfulChanges: Object.values(categories).reduce((sum, samples) => sum + samples.length, 0),
    failures, budgetMilliseconds: 100, passed: failures.length === 0 && Object.values(p95).every(value => value <= 100)
  };
  const path = testInfo.outputPath("browser-interaction.json");
  await writeFile(path, JSON.stringify(report, null, 2));
  await testInfo.attach("browser-interaction", { path, contentType: "application/json" });
  expect(failures).toEqual([]);
  for (const [name, samples] of Object.entries(categories)) {
    expect(samples, name).toHaveLength(20);
    expect(samples.every(sample => Number.isFinite(sample) && sample > 0), name).toBe(true);
    expect(p95[name], name).toBeLessThanOrEqual(100);
  }
});
