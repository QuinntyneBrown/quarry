import { readFile, writeFile, mkdir, copyFile, rm, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../../', import.meta.url));
const runDir = resolve(process.argv[2] ?? '');
assert.ok(process.argv.includes('--visual-review-complete'), 'Inspect encoded playback, chapter frames, and posters before promotion');
const manifest = JSON.parse(await readFile(join(runDir, 'reviewed-manifest.json'), 'utf8'));
const cleanup = JSON.parse(await readFile(join(runDir, 'cleanup.json'), 'utf8'));
assert.deepEqual(cleanup.failures, [], 'Resolve cleanup failures before publishing the run');
const excluded = process.argv.find(x => x.startsWith('--exclude='))?.slice(10).split(',') ?? [];
const records = manifest.results.filter(x => x.status === 'captured' && !excluded.includes(x.slug));
assert.ok(records.length > 0);
for (const record of records) {
  assert.equal(record.playback?.normalSpeed, true);
  assert.deepEqual(record.playback.errors, []);
  assert.equal(record.media.width, 1280); assert.equal(record.media.height, 720);
  for (const chapter of record.chapters) assert.ok(chapter.seconds >= 0 && chapter.sampleSeconds < record.media.duration);
  assert.ok((await stat(join(runDir, 'staging', record.slug + '-poster.png'))).size > 0);
}
const destination = join(root, 'docs/demo');
await mkdir(destination, { recursive: true });
const oldCatalog = await readFile(join(destination, 'catalog.json'), 'utf8').then(JSON.parse).catch(error => { if (error.code === 'ENOENT') return {}; throw error; });
for (const record of records) oldCatalog[record.slug] = { ...record, status: 'recorded', runId: manifest.runId, revision: manifest.revision };
const descriptions = {
  'quarry': 'Public React discovery UI: search, filter, inspect, select, and reset.',
  'quarry-previews': 'Isolated illustrative component bundle: edit, save, reset, and return keyboard focus.',
  'quarry-api': 'ASP.NET Core catalog, details, semantic search, and protected maintenance.',
  'quarry-indexing-worker': 'Durable indexing jobs processed into SQL-backed Ollama vectors.'
};
const stamp = value => { const seconds = Math.floor(value); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; };
const lines = ['<!-- quarry-demo:start -->', '## Application inventory', '', '| Application | Purpose | Status |', '|---|---|---|'];
for (const [slug, purpose] of Object.entries(descriptions)) lines.push(`| [${slug}](${slug}.webm) | ${purpose} | ${oldCatalog[slug]?.status ?? 'Not recorded'} |`);
lines.push('| Design mock (`docs/mocks`) | Separate design artifact application | Excluded by requested scope |', '', 'Libraries, migration tooling, and test runners are not demo applications.', '');
for (const [slug, item] of Object.entries(oldCatalog)) {
  lines.push(`## ${slug}`, '', `[Watch video](${slug}.webm) · [Poster](${slug}-poster.png)`, '',
    `Measured: **${item.media.duration.toFixed(2)} seconds**, **${item.media.width} × ${item.media.height}**, **${item.media.bytes.toLocaleString('en-US')} bytes**. Silent, continuous WebM.`, '',
    `Source revision: \`${item.revision}\`; run \`${item.runId}\`. Capture used the working tree, including the user's existing uncommitted UI/performance changes and recording-tool development. No product files were changed for these demos.`, '',
    '| Time | Verified workflow |', '|---|---|');
  for (const chapter of item.chapters) lines.push(`| ${stamp(chapter.seconds)} | ${chapter.title}: ${chapter.caption} |`);
  lines.push('', 'The encoded file was decoded from beginning to end at normal speed, with chapter frames inspected for readable captions and visible outcomes. Posters are decoded frames from the successful video. Chapter timestamps use the capture timeline and were checked against encoded playback.', '');
}
lines.push('## Setup and rerun', '', 'Run these commands from the repository root in PowerShell. Prerequisites: Node.js/npm, the .NET SDK pinned by `global.json`, .NET EF tooling, a running SQL Server Express instance at `.\\SQLEXPRESS` with permission to create/drop this run’s database, and local Ollama. This run used Node 22.21.0, .NET SDK 10.0.401, EF 10.0.7, and Playwright 1.63.0.', '',
  '```powershell', 'npm ci --prefix frontend', 'dotnet restore backend/Quarry.sln', '# If dotnet ef is unavailable:', 'dotnet tool install --global dotnet-ef --version 10.0.7', 'Push-Location frontend', 'npx playwright install chromium', 'Pop-Location', 'ollama pull embeddinggemma:300m', 'node --test tools/demo/harness.test.mjs', 'node tools/demo/record.mjs --rehearse', 'node tools/demo/record.mjs', '```', '',
  'The model must have digest `85462619ee721b466c5927d109d4cb765861907d5417b9109caebc4e614679f1` and 768 dimensions. Existing SQL Server and Ollama infrastructure remains running after cleanup.', '',
  'Each runner invocation prints `RUN_DIR`. Use that exact path for review and promotion:', '',
  '```powershell', "$runDir = 'C:\\projects\\quarry\\test-results\\demo\\<printed-run-id>'", 'node tools/demo/review.mjs $runDir', '# Inspect the complete encoded playback, review/*.png, and staged posters.', '# Set this flag only after the visual review passes:', 'node tools/demo/promote.mjs $runDir --visual-review-complete', '```', '',
  'The review command plays every captured WebM at 1× speed and writes decoded chapter images and contact sheets to the ignored run directory. For visual playback, run `node tools/demo/watch.mjs $runDir` and open its printed URLs in a browser. Stop that server with Ctrl+C when finished; it also expires after 20 minutes. Visually inspect these alongside the encoded videos before promotion. No full FFmpeg installation is required; capture uses Playwright, and review/poster extraction uses Chromium’s video decoder.', '',
  'Individual reruns prepare their own database and indexing prerequisites:', '', '```powershell', ...Object.keys(descriptions).map(slug => `node tools/demo/record.mjs --app=${slug}`), '```', '',
  '## Isolation, sequence, and cleanup', '',
  '- Full runs record worker → API → Quarry → previews. The worker establishes the indexed catalog used by the API and UI videos.',
  '- Runs involving the backend create `Quarry_Demo_<run-id>_Evaluation`, apply existing migrations, and import the eight existing labeled fixtures. The preview-only rerun needs no .NET build, database, or Ollama. All six connection variables (`ConnectionStrings__Quarry`, `QuarryRead`, `QuarryMaintenance`, `QuarryWorker`, `QuarryMigrations`, and `QuarryEvaluation`, each with the `ConnectionStrings__` prefix) point to the disposable database in backend child processes.',
  '- `DOTNET_ENVIRONMENT` and `ASPNETCORE_ENVIRONMENT` are Development. `Catalog__SeedDevelopmentEvaluationData=false` ensures real SQL reads. Temporary `Jwt__SigningKey`, `Jwt__Issuer`, and `Jwt__Audience` values authenticate the synthetic operator; credentials are never displayed or saved.',
  '- Unused loopback ports are chosen per run. `QUARRY_API_PROXY`, `QUARRY_PREVIEW_PORT`, `QUARRY_APP_ORIGINS`, and `VITE_PREVIEW_ORIGIN` are supplied to the owned processes. Strict binding/readiness checks precede capture.',
  '- Startup, actions, takes, and teardown have finite deadlines; automatic recording retries are disabled. The whole runner has a 25-minute deadline. Failures stay in ignored `test-results/demo/<run-id>/`; successful videos alone reach final paths.',
  '- Background processes start hidden. Cleanup stops only tracked processes and drops only the database whose name exactly matches this run. Parent environment settings remain unchanged. `cleanup.json` reports any resources requiring attention.',
  '- Promotion stages files, backs up the previous deliverables, and restores them if replacement fails. Existing unrelated demos and README text outside the managed markers are preserved.', '',
  '## Presentation and limitations', '',
  'Catalog entries and previews are explicitly illustrative. No released-framework claims or fabricated publication evidence are added. API and worker footage uses a recording-only browser display of real HTTP requests and responses executed during the take; the worker is a real child process, and completion is checked against persisted source/indexed revision identities. Credentials are omitted from the display.', '',
  'The evaluation catalog has no preview manifests. The separate preview video therefore embeds the shipped bundle in a recording-only parent that implements its existing handshake. It does not claim that the current evaluation catalog exposes a preview inside Quarry. Save feedback is local to that component example, not account persistence. Quarry selection lasts for the current page session.', '',
  'No product fixes were required. Recordings are kept as short as the useful workflows allow, without padding to two minutes. Videos cover the implemented desktop workflows, not the full acceptance suite.', '',
  'Sources: [runner](../../tools/demo/record.mjs), [story assertions](../../tools/demo/stories.mjs), [capture helpers](../../tools/demo/harness.mjs), [harness checks](../../tools/demo/harness.test.mjs), [Quarry page object](../../frontend/apps/quarry/demo/QuarryDemoPage.mjs), [review](../../tools/demo/review.mjs), [promotion](../../tools/demo/promote.mjs), [local setup](../local-setup.md), [evaluation fixtures](../../backend/evaluation/catalog.json).', '',
  'Machine-readable media measurements and chapters: [catalog.json](catalog.json).', '<!-- quarry-demo:end -->');
const existingReadme = await readFile(join(destination, 'README.md'), 'utf8').catch(error => { if (error.code === 'ENOENT') return '# Quarry demo videos\n\n'; throw error; });
const managed = lines.join('\n');
const readme = existingReadme.includes('<!-- quarry-demo:start -->') ? existingReadme.replace(/<!-- quarry-demo:start -->[\s\S]*?<!-- quarry-demo:end -->/, managed) : existingReadme.trimEnd() + '\n\n' + managed + '\n';
const staged = join(runDir, 'promotion'); await mkdir(staged, { recursive: true });
await writeFile(join(staged, 'README.md'), readme); await writeFile(join(staged, 'catalog.json'), JSON.stringify(oldCatalog, null, 2));
const names = ['README.md', 'catalog.json'];
for (const item of records) for (const suffix of ['.webm', '-poster.png']) { const name = item.slug + suffix; await copyFile(join(runDir, 'staging', name), join(staged, name)); names.push(name); }
const backup = join(runDir, 'previous-deliverables'); await mkdir(backup, { recursive: true });
const replaced = [];
try {
  for (const name of names) {
    const target = join(destination, name);
    let existed = true;
    try { await copyFile(target, join(backup, name)); } catch (error) { if (error.code === 'ENOENT') existed = false; else throw error; }
    replaced.push({ name, existed });
    await copyFile(join(staged, name), target);
  }
} catch (error) {
  for (const { name, existed } of replaced.reverse()) { if (existed) await copyFile(join(backup, name), join(destination, name)); else await rm(join(destination, name), { force: true }); }
  throw error;
}
console.log(`Promoted ${records.length} reviewed recordings to ${destination}`);
