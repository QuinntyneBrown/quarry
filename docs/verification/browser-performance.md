# Production browser startup performance

The dedicated browser benchmark covers **L2-032.2** and the browser-report portion of **L2-032.4**. It serves the production Vite build through real HTTP and uses a separate HTTP mock API. The fixture contains 1,000 synthetic frameworks, each with a 2,000-character description and 20 tags. Before measurement, the test walks every 24-entry page and verifies all 1,000 unique records and payload sizes. These are illustrative fixtures, not released frameworks or persisted/indexed catalog entries.

Each of 20 measurements uses a fresh Chromium context, disabled browser cache, blocked service workers, and a 1440 × 900 viewport. [DevTools network emulation](https://chromedevtools.github.io/devtools-protocol/tot/Network/#method-emulateNetworkConditions) applies 10 Mbps download, 2 Mbps upload, and 100 ms latency; CPU throttling is fourfold. API responses travel over the same throttled connection as assets. There is no Playwright request fulfillment bypassing that connection. Traces, videos, screenshots, retries, and parallel workers are disabled during measurement.

A Page Object installs its observer before application scripts. Timing starts at the navigation performance time origin and ends when the enabled search controls and all 24 first-page cards have layout boxes, followed by two animation frames to allow painting. This is a conservative upper-bound proxy for visible readiness, not a raw DOM-insertion timestamp. The p95 uses nearest rank: sample 19 of 20 sorted durations. Page errors, failed HTTP requests, external requests, missing cards, or fewer than 20 completed measurements fail the gate. All individual durations, navigation timings, success counts, host hardware/OS, browser version, profile, commit, dirty-worktree status, and build-index hash are retained in JSON.

The initial workload check failed against the existing one-entry routing fixture (`expected 1000, received 1`). The dedicated 1,000-entry fixture was then implemented. The final measurement passed all 20 loads with p95 **1,104 ms**, below the **3,000 ms** limit, using Chromium **153.0.8010.12**, Windows **10.0.26200 ARM64**, a **Snapdragon X1E80100**, 12 logical processors, and 16,757,260,288 bytes of host RAM. The initial full run also passed at 1,859 ms. The final run includes navigation response-completion timings showing the injected latency (the first three were 119, 111, and 115 ms); raw response-header timestamps alone exclude that delay in this browser. Both workspace builds and final type checking passed. Normal test discovery still contains 390 tests, without including the separate benchmark.

Run from the repository root, with ports 4193 and 4194 free:

```powershell
npm run build --workspaces --prefix frontend
$env:PLAYWRIGHT_JUNIT_OUTPUT_FILE = 'test-results/browser-performance.xml'
npm run test:performance --workspace=@quarry/app --prefix frontend -- --reporter=line,junit
```

The latest JSON is under `frontend/apps/quarry/test-results/performance/`; generated reports remain ignored. The manual `.github/workflows/browser-performance.yml` job runs these build and benchmark steps and uploads JSON plus JUnit evidence. The hosted workflow has not been dispatched; local measurements do not prove hosted results. The normal responsive/zoom acceptance matrix excludes this separate benchmark.

This is browser startup evidence with a mock backend. It does **not** establish the 1,000-entry persisted and fully indexed API workload, the combined 4-vCPU/8-GiB API/database allocation, real semantic latency, loaded interaction p95, overload memory recovery, freshness, or full rebuild time. Those remain separate completion gates. No embedding model is invoked by this browser test.
