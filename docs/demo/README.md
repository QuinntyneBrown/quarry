# Quarry demo videos

<!-- quarry-demo:start -->
## Application inventory

| Application | Purpose | Status |
|---|---|---|
| [quarry](quarry.webm) | Public React discovery UI: search, filter, inspect, select, and reset. | recorded |
| [quarry-previews](quarry-previews.webm) | Isolated illustrative component bundle: edit, save, reset, and return keyboard focus. | recorded |
| [quarry-api](quarry-api.webm) | ASP.NET Core catalog, details, semantic search, and protected maintenance. | recorded |
| [quarry-indexing-worker](quarry-indexing-worker.webm) | Durable indexing jobs processed into SQL-backed Ollama vectors. | recorded |
| Design mock (`docs/mocks`) | Separate design artifact application | Excluded by requested scope |

Libraries, migration tooling, and test runners are not demo applications.

## quarry-indexing-worker

[Watch video](quarry-indexing-worker.webm) · [Poster](quarry-indexing-worker-poster.png)

Measured: **67.52 seconds**, **1280 × 720**, **3,355,441 bytes**. Continuous WebM with English voice narration.

Source revision: `b8ea3042aa03ebacf4374387dc204bbf3ae4fd72`; run `mtw370kb95d69c`. Capture used the working tree, including the user's existing uncommitted UI/performance changes and recording-tool development. No product files were changed for these demos.

| Time | Verified workflow |
|---|---|
| 0:00 | Queue durable indexing: The worker turns published descriptions into searchable vectors. |
| 0:14 | Observe pending work: Eight published evaluation frameworks are waiting for the real worker. |
| 0:25 | Process real embeddings: The indexing host reads durable jobs and stores Ollama vectors in SQL Server. |
| 0:35 | Verify persisted results: All eight source revisions now have matching searchable revisions; no jobs remain pending. |
| 0:49 | Use the completed index: A real semantic search now returns recommendations from the completed index. |

The encoded file was decoded from beginning to end at normal speed, with chapter frames inspected for readable captions and visible outcomes. Posters are decoded frames from the successful video. Chapter timestamps use the capture timeline and were checked against encoded playback.

## quarry-api

[Watch video](quarry-api.webm) · [Poster](quarry-api-poster.png)

Measured: **71.28 seconds**, **1280 × 720**, **3,245,877 bytes**. Continuous WebM with English voice narration.

Source revision: `b8ea3042aa03ebacf4374387dc204bbf3ae4fd72`; run `mtw3h2gl5f9dbb`. Capture used the working tree, including the user's existing uncommitted UI/performance changes and recording-tool development. No product files were changed for these demos.

| Time | Verified workflow |
|---|---|
| 0:00 | Browse the catalog: The public API serves eight explicitly labeled evaluation frameworks from SQL Server. |
| 0:13 | Filter by technology: Technology filtering returns only React frameworks. |
| 0:25 | Inspect capabilities: Details describe component capabilities and suitable use cases. |
| 0:40 | Search by project intent: Ollama embeddings rank frameworks for an animal-hospital project. |
| 0:54 | Protect maintenance: Public discovery needs no account. Index mutations require an authorized operator. |

The encoded file was decoded from beginning to end at normal speed, with chapter frames inspected for readable captions and visible outcomes. Posters are decoded frames from the successful video. Chapter timestamps use the capture timeline and were checked against encoded playback.

## quarry-previews

[Watch video](quarry-previews.webm) · [Poster](quarry-previews-poster.png)

Measured: **68.04 seconds**, **1280 × 720**, **3,809,485 bytes**. Continuous WebM with English voice narration.

Source revision: `5fe9e8dbed3529176c4ff8350b6dacf3f0ad8e9e`; run `mtw3n0sj1da236`. Capture used the working tree, including the user's existing uncommitted UI/performance changes and recording-tool development. No product files were changed for these demos.

| Time | Verified workflow |
|---|---|
| 0:04 | Load the real preview: The existing bundle activates after its parent handshake. This parent page is recording tooling. |
| 0:18 | Try the controls: Edit the profile and save. The feedback is produced by the shipped preview code. |
| 0:31 | Reset the example: Reset restores Jamie and the enabled notification preference. |
| 0:42 | Return to the host: Tab from the final control returns keyboard focus to the surrounding page. |
| 0:53 | Keep interaction contained: Escape also returns control. This illustrative preview does not save a user account. |

The encoded file was decoded from beginning to end at normal speed, with chapter frames inspected for readable captions and visible outcomes. Posters are decoded frames from the successful video. Chapter timestamps use the capture timeline and were checked against encoded playback.

## quarry

[Watch video](quarry.webm) · [Poster](quarry-poster.png)

Measured: **99.64 seconds**, **1280 × 720**, **5,874,078 bytes**. Continuous WebM with English voice narration.

Source revision: `5fe9e8dbed3529176c4ff8350b6dacf3f0ad8e9e`; run `mtw3mfa724707f`. Capture used the working tree, including the user's existing uncommitted UI/performance changes and recording-tool development. No product files were changed for these demos.

| Time | Verified workflow |
|---|---|
| 0:01 | Describe the project: Find a component framework by describing what you want to build. |
| 0:11 | Browse evaluation frameworks: These eight entries are illustrative evaluation data, not claims of released libraries. |
| 0:23 | Find relevant frameworks: The real search service ranks components for appointments and patient-record interfaces. |
| 0:35 | Narrow by technology: Keep the project description while narrowing the recommendations to Angular. |
| 0:46 | Inspect the framework: Review capabilities and suitable use cases before making a choice. |
| 1:04 | Keep one selection: The chosen framework stays available while you continue discovery. |
| 1:15 | Review the selection: Reopen the selected framework without losing the search or filter. |
| 1:25 | Start another discovery: Selection, search, and technology filter are cleared. The full catalog is available again. |

The encoded file was decoded from beginning to end at normal speed, with chapter frames inspected for readable captions and visible outcomes. Posters are decoded frames from the successful video. Chapter timestamps use the capture timeline and were checked against encoded playback.

## Voice narration

All four videos include an embedded English Opus voice track using Microsoft Zira Desktop. The narration reads each chapter title and caption at its recorded timestamp; the tables above provide the transcript. Each segment finishes before the next chapter. Video frames and resolution are unchanged. All four final files passed full audio/video decoding, with non-silent speech verified in every chapter.

The capture and promotion commands below produce silent source footage. Narration was added after promotion; rerunning those commands replaces it with silent footage and requires adding narration again.

## Setup and rerun

Run these commands from the repository root in PowerShell. Prerequisites: Node.js/npm, the .NET SDK pinned by `global.json`, .NET EF tooling, a running SQL Server Express instance at `.\SQLEXPRESS` with permission to create/drop this run’s database, and local Ollama. This run used Node 22.21.0, .NET SDK 10.0.401, EF 10.0.7, and Playwright 1.63.0.

```powershell
npm ci --prefix frontend
dotnet restore backend/Quarry.sln
# If dotnet ef is unavailable:
dotnet tool install --global dotnet-ef --version 10.0.7
Push-Location frontend
npx playwright install chromium
Pop-Location
ollama pull embeddinggemma:300m
node --test tools/demo/harness.test.mjs
node tools/demo/record.mjs --rehearse
node tools/demo/record.mjs
```

The model must have digest `85462619ee721b466c5927d109d4cb765861907d5417b9109caebc4e614679f1` and 768 dimensions. Existing SQL Server and Ollama infrastructure remains running after cleanup.

Each runner invocation prints `RUN_DIR`. Use that exact path for review and promotion:

```powershell
$runDir = 'C:\projects\quarry\test-results\demo\<printed-run-id>'
node tools/demo/review.mjs $runDir
# Inspect the complete encoded playback, review/*.png, and staged posters.
# Set this flag only after the visual review passes:
node tools/demo/promote.mjs $runDir --visual-review-complete
```

The review command plays every captured WebM at 1× speed and writes decoded chapter images and contact sheets to the ignored run directory. For visual playback, run `node tools/demo/watch.mjs $runDir` and open its printed URLs in a browser. Stop that server with Ctrl+C when finished; it also expires after 20 minutes. Visually inspect these alongside the encoded videos before promotion. No full FFmpeg installation is required; capture uses Playwright, and review/poster extraction uses Chromium’s video decoder.

Individual reruns prepare their own database and indexing prerequisites:

```powershell
node tools/demo/record.mjs --app=quarry
node tools/demo/record.mjs --app=quarry-previews
node tools/demo/record.mjs --app=quarry-api
node tools/demo/record.mjs --app=quarry-indexing-worker
```

## Isolation, sequence, and cleanup

- Full runs record worker → API → Quarry → previews. The worker establishes the indexed catalog used by the API and UI videos.
- Runs involving the backend create `Quarry_Demo_<run-id>_Evaluation`, apply existing migrations, and import the eight existing labeled fixtures. The preview-only rerun needs no .NET build, database, or Ollama. All six connection variables (`ConnectionStrings__Quarry`, `QuarryRead`, `QuarryMaintenance`, `QuarryWorker`, `QuarryMigrations`, and `QuarryEvaluation`, each with the `ConnectionStrings__` prefix) point to the disposable database in backend child processes.
- `DOTNET_ENVIRONMENT` and `ASPNETCORE_ENVIRONMENT` are Development. `Catalog__SeedDevelopmentEvaluationData=false` ensures real SQL reads. Temporary `Jwt__SigningKey`, `Jwt__Issuer`, and `Jwt__Audience` values authenticate the synthetic operator; credentials are never displayed or saved.
- Unused loopback ports are chosen per run. `QUARRY_API_PROXY`, `QUARRY_PREVIEW_PORT`, `QUARRY_APP_ORIGINS`, and `VITE_PREVIEW_ORIGIN` are supplied to the owned processes. Strict binding/readiness checks precede capture.
- Startup, actions, takes, and teardown have finite deadlines; automatic recording retries are disabled. The whole runner has a 25-minute deadline. Failures stay in ignored `test-results/demo/<run-id>/`; successful videos alone reach final paths.
- Background processes start hidden. Cleanup stops only tracked processes and drops only the database whose name exactly matches this run. Parent environment settings remain unchanged. `cleanup.json` reports any resources requiring attention.
- Promotion stages files, backs up the previous deliverables, and restores them if replacement fails. Existing unrelated demos and README text outside the managed markers are preserved.

## Presentation and limitations

Catalog entries and previews are explicitly illustrative. No released-framework claims or fabricated publication evidence are added. API and worker footage uses a recording-only browser display of real HTTP requests and responses executed during the take; the worker is a real child process, and completion is checked against persisted source/indexed revision identities. Credentials are omitted from the display.

The evaluation catalog has no preview manifests. The separate preview video therefore embeds the shipped bundle in a recording-only parent that implements its existing handshake. It does not claim that the current evaluation catalog exposes a preview inside Quarry. Save feedback is local to that component example, not account persistence. Quarry selection lasts for the current page session.

No product fixes were required. Recordings are kept as short as the useful workflows allow, without padding to two minutes. Videos cover the implemented desktop workflows, not the full acceptance suite.

Sources: [runner](../../tools/demo/record.mjs), [story assertions](../../tools/demo/stories.mjs), [capture helpers](../../tools/demo/harness.mjs), [harness checks](../../tools/demo/harness.test.mjs), [Quarry page object](../../frontend/apps/quarry/demo/QuarryDemoPage.mjs), [review](../../tools/demo/review.mjs), [promotion](../../tools/demo/promote.mjs), [local setup](../local-setup.md), [evaluation fixtures](../../backend/evaluation/catalog.json).

Machine-readable media measurements and chapters: [catalog.json](catalog.json).
<!-- quarry-demo:end -->
