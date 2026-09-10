import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { randomBytes, createHmac } from 'node:crypto';
import assert from 'node:assert/strict';
import { runCommand, until, startDisplay, narrate, assertOwnedDatabase } from './harness.mjs';
import { apiStory, workerStory, quarryStory, previewStory } from './stories.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(new URL('../../frontend/package.json', import.meta.url));
const { chromium } = require('playwright');
const options = process.argv.slice(2);
const selected = options.find(x => x.startsWith('--app='))?.slice(6);
const rehearsal = options.includes('--rehearse');
const slugs = ['quarry-indexing-worker', 'quarry-api', 'quarry', 'quarry-previews'];
assert.ok(!selected || slugs.includes(selected), 'Unknown app slug');
const runId = Date.now().toString(36) + randomBytes(3).toString('hex');
const runDir = join(root, 'test-results', 'demo', runId);
const staging = join(runDir, 'staging');
await mkdir(staging, { recursive: true });
const database = `Quarry_Demo_${runId}_Evaluation`;
const connection = `Server=.\\SQLEXPRESS;Database=${database};Trusted_Connection=True;TrustServerCertificate=True;`;
const env = { ...process.env, DOTNET_ENVIRONMENT: 'Development', ASPNETCORE_ENVIRONMENT: 'Development', Catalog__SeedDevelopmentEvaluationData: 'false', Jwt__Issuer: 'Quarry', Jwt__Audience: 'Quarry.Maintenance', Jwt__SigningKey: randomBytes(32).toString('base64') };
for (const name of ['Quarry', 'QuarryRead', 'QuarryMaintenance', 'QuarryWorker', 'QuarryMigrations', 'QuarryEvaluation']) env['ConnectionStrings__' + name] = connection;
const children = [], logs = [], results = [];
let browser, display, databaseOwned = false, worker;
let shuttingDown = false;

async function port() {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const result = server.address().port; await new Promise(resolve => server.close(resolve)); return result;
}
function start(name, executable, args, cwd, childEnv = env) {
  const log = createWriteStream(join(runDir, name + '.log')); logs.push(log);
  const child = spawn(executable, args, { cwd, env: childEnv, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  children.push(child); child.stdout.pipe(log); child.stderr.pipe(log);
  child.on('error', error => log.write(error.message));
  return child;
}
async function stop(child) {
  if (!child?.pid || child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise(resolve => child.once('close', resolve)); child.kill();
  await Promise.race([exited, new Promise((_, reject) => setTimeout(() => reject(new Error(`Could not stop owned PID ${child.pid}`)), 10_000).unref())]);
}
function token() {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const unsigned = encode({ alg: 'HS256', typ: 'JWT' }) + '.' + encode({ iss: 'Quarry', aud: 'Quarry.Maintenance', sub: 'demo-operator', permission: 'maintenance', iat: now, nbf: now, exp: now + 900 });
  return unsigned + '.' + createHmac('sha256', env.Jwt__SigningKey).update(unsigned).digest('base64url');
}
async function cleanup() {
  if (shuttingDown) return;
  shuttingDown = true;
  const failures = [];
  if (browser) await browser.close().catch(e => failures.push(e.message));
  if (display) await display.close().catch(e => failures.push(e.message));
  for (const child of children.reverse()) await stop(child).catch(e => failures.push(e.message));
  for (const log of logs) log.end();
  if (databaseOwned) {
    assertOwnedDatabase(database, runId);
    await runCommand('dotnet', ['ef', 'database', 'drop', '--force', '--no-build', '--project', 'backend/src/Quarry.Infrastructure', '--startup-project', 'backend/src/Quarry.Api'], { cwd: root, env, timeout: 60_000 }).catch(e => failures.push(`Database ${database}: ${e.message}`));
  }
  await writeFile(join(runDir, 'cleanup.json'), JSON.stringify({ database, failures }, null, 2));
  if (failures.length) { console.error('CLEANUP FAILURES', failures); process.exitCode = 1; }
}
process.once('SIGINT', async () => { await cleanup(); process.exit(130); });
process.once('SIGTERM', async () => { await cleanup(); process.exit(143); });
const totalDeadline = setTimeout(async () => { console.error('Whole-run deadline exceeded'); await cleanup(); process.exit(1); }, 25 * 60_000);

try {
  console.log(`Run ${runId}: preparing isolated capture`);
  console.log(`RUN_DIR=${runDir}`);
  const setup = await Promise.allSettled([
    runCommand('dotnet', ['build', 'backend/Quarry.sln', '--nologo'], { cwd: root, env }),
    runCommand(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit', '-p', 'apps/quarry/tsconfig.json'], { cwd: join(root, 'frontend') })
  ]);
  for (let i = 0; i < setup.length; i++) { await writeFile(join(runDir, `build-${i}.log`), setup[i].status === 'fulfilled' ? setup[i].value : setup[i].reason.message); if (setup[i].status === 'rejected') throw setup[i].reason; }
  const previewPort = await port(), apiPort = await port(), appPort = await port();
  const apiUrl = `http://127.0.0.1:${apiPort}`, appUrl = `http://127.0.0.1:${appPort}`;
  display = await startDisplay({ previewUrl: `http://localhost:${previewPort}/bundles/illustrative-v1/index.html`, mediaDir: staging });
  browser = await chromium.launch();
  start('preview', process.execPath, ['server.mjs'], join(root, 'frontend/apps/quarry-preview'), { ...env, QUARRY_PREVIEW_PORT: String(previewPort), QUARRY_APP_ORIGINS: `${appUrl} ${display.url}` });
  await until(() => fetch(`http://127.0.0.1:${previewPort}/bundles/illustrative-v1/index.html`), x => x.ok);
  const stories = { 'quarry-indexing-worker': workerStory, 'quarry-api': apiStory, quarry: quarryStory, 'quarry-previews': previewStory };
  let request, startWorker;
  if (selected !== 'quarry-previews') {
    console.log('Migrating and seeding disposable SQL database');
    databaseOwned = true;
    await writeFile(join(runDir, 'migration.log'), await runCommand('dotnet', ['ef', 'database', 'update', '--no-build', '--project', 'backend/src/Quarry.Infrastructure', '--startup-project', 'backend/src/Quarry.Api'], { cwd: root, env }));
    await writeFile(join(runDir, 'seed.log'), await runCommand('dotnet', [join(root, 'backend/src/Quarry.Api/bin/Debug/net10.0/Quarry.Api.dll'), '--seed-evaluation=true'], { cwd: join(root, 'backend/src/Quarry.Api'), env }));
    start('api', 'dotnet', [join(root, 'backend/src/Quarry.Api/bin/Debug/net10.0/Quarry.Api.dll'), '--urls', apiUrl], join(root, 'backend/src/Quarry.Api'));
    await until(() => fetch(apiUrl + '/health/catalog', { signal: AbortSignal.timeout(5000) }), x => x.ok);
    request = async (path, { method = 'GET', body, auth = false } = {}) => {
      const response = await fetch(apiUrl + path, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(auth ? { Authorization: 'Bearer ' + token() } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15_000) });
      const text = await response.text(); const result = { status: response.status, body: text ? JSON.parse(text) : null };
      return result;
    };
    const tags = await (await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(10_000) })).json();
    assert.ok(tags.models.some(x => x.name === 'embeddinggemma:300m' && x.digest === '85462619ee721b466c5927d109d4cb765861907d5417b9109caebc4e614679f1'), 'Required Ollama model digest missing');
    const warm = await fetch('http://localhost:11434/api/embed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'embeddinggemma:300m', input: ['Quarry demonstration readiness'] }), signal: AbortSignal.timeout(120_000) });
    assert.equal(warm.status, 200);
    startWorker = async () => { if (!worker) worker = start('worker', 'dotnet', [join(root, 'backend/src/Quarry.Indexing.Worker/bin/Debug/net10.0/Quarry.Indexing.Worker.dll')], join(root, 'backend/src/Quarry.Indexing.Worker')); };
    if (selected && selected !== 'quarry-indexing-worker') {
      await startWorker();
      await until(() => request('/api/maintenance/diagnostics', { auth: true }), x => x.body?.health?.index?.searchableCount === 8, 120_000);
    }
    if (!selected || selected === 'quarry') {
      start('frontend', process.execPath, [join(root, 'frontend/node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', String(appPort)], join(root, 'frontend/apps/quarry'), { ...env, QUARRY_API_PROXY: apiUrl, VITE_PREVIEW_ORIGIN: `http://localhost:${previewPort}` });
      await until(() => fetch(appUrl), x => x.ok);
    }
  }
  for (const slug of selected ? [selected] : slugs) {
    console.log(`${rehearsal ? 'Rehearsing' : 'Recording'} ${slug}`);
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, ...(rehearsal ? {} : { recordVideo: { dir: join(runDir, 'raw', slug), size: { width: 1280, height: 720 } } }) });
    const page = await context.newPage(); page.setDefaultTimeout(30_000); page.setDefaultNavigationTimeout(30_000);
    const video = page.video(); const started = Date.now(), chapters = [];
    const pause = seconds => page.waitForTimeout(rehearsal ? 100 : seconds * 1000);
    const chapter = async (title, caption) => {
      await narrate(page, caption); chapters.push({ title, caption, seconds: (Date.now() - started) / 1000 });
      await pause(4);
    };
    const takeDeadline = setTimeout(() => context.close(), 8 * 60_000);
    try {
      await page.goto(display.url);
      await stories[slug]({ page, chapter, pause, request, startWorker, appUrl, displayUrl: display.url });
      await narrate(page, ''); await pause(2);
      await context.close();
      if (video) await video.saveAs(join(staging, slug + '.webm'));
      results.push({ slug, status: rehearsal ? 'rehearsed' : 'captured', chapters });
      console.log(`${slug}: assertions passed`);
    } catch (error) {
      await page.screenshot({ path: join(runDir, slug + '-failure.png') }).catch(() => {});
      await writeFile(join(runDir, slug + '-failure.txt'), error.stack ?? String(error));
      await context.close().catch(() => {});
      results.push({ slug, status: 'blocked', error: error.message });
      console.error(`${slug}: ${error.message}`); process.exitCode = 1;
      // Continue independent stories; API/UI may still succeed if indexing completed.
      if (slug === 'quarry-indexing-worker') await startWorker();
    } finally { clearTimeout(takeDeadline); }
  }
} catch (error) { console.error(error); process.exitCode = 1; await writeFile(join(runDir, 'failure.txt'), error.stack ?? String(error)); }
finally {
  await writeFile(join(runDir, 'manifest.json'), JSON.stringify({ runId, rehearsal, revision: (await runCommand('git', ['rev-parse', 'HEAD'], { cwd: root })).trim(), results }, null, 2));
  await cleanup(); clearTimeout(totalDeadline);
  console.log(`Artifacts and diagnostics: ${runDir}`);
}
