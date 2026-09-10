import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { QuarryDemoPage } from '../../frontend/apps/quarry/demo/QuarryDemoPage.mjs';
import { until } from './harness.mjs';

const require = createRequire(new URL('../../frontend/package.json', import.meta.url));
const { expect } = require('@playwright/test');
expect.configure({ timeout: 30_000 });
const query = 'Animal hospital appointments and patient records';

async function show(page, request, result, projection = value => value) {
  const output = result.body === null ? '(empty response body)' : JSON.stringify(projection(result.body), null, 2);
  await page.evaluate(({ request, status, output }) => window.showResult(request, `HTTP ${status}`, output), { request, status: result.status, output });
}

export async function workerStory({ page, chapter, pause, request, startWorker }) {
  await page.locator('#title').evaluate(el => { el.textContent = 'From published catalog to searchable index'; });
  await chapter('Queue durable indexing', 'The worker turns published descriptions into searchable vectors.');
  const rebuild = await request('/api/maintenance/search-index/rebuild', { method: 'POST', auth: true });
  assert.equal(rebuild.status, 202);
  await show(page, 'POST /api/maintenance/search-index/rebuild   [authenticated]', rebuild);
  await pause(7);
  const before = await request('/api/maintenance/diagnostics', { auth: true });
  assert.equal(before.status, 200);
  assert.equal(before.body.health.index.publishedCount, 8);
  assert.equal(before.body.health.index.searchableCount, 0);
  assert.equal(before.body.health.index.pendingCount, 8);
  const revisions = before.body.health.index.revisions.map(x => `${x.frameworkId}:${x.sourceRevision}`).sort();
  await show(page, 'GET /api/maintenance/diagnostics   [authenticated]', before, x => ({ ...x.health.index, revisions: '(8 published revision identities captured for verification)' }));
  await chapter('Observe pending work', 'Eight published evaluation frameworks are waiting for the real worker.');
  await pause(7);
  await page.evaluate(() => window.showResult('dotnet backend/src/Quarry.Indexing.Worker/bin/Debug/net10.0/Quarry.Indexing.Worker.dll', 'Starting the real worker', 'SQL Server Express + Ollama embeddinggemma:300m'));
  await startWorker();
  await chapter('Process real embeddings', 'The indexing host reads durable jobs and stores Ollama vectors in SQL Server.');
  const after = await until(() => request('/api/maintenance/diagnostics', { auth: true }), x => x.status === 200 && x.body.health.index.searchableCount === 8 && x.body.health.index.pendingCount === 0, 120_000);
  assert.equal(after.body.health.index.failureCount, 0);
  assert.deepEqual(after.body.health.index.revisions.map(x => `${x.frameworkId}:${x.indexedRevision}`).sort(), revisions);
  await show(page, 'GET /api/maintenance/diagnostics   [authenticated]', after, x => ({ publishedCount: x.health.index.publishedCount, searchableCount: x.health.index.searchableCount, pendingCount: x.health.index.pendingCount, failureCount: x.health.index.failureCount, exampleRevision: x.health.index.revisions[0] }));
  await chapter('Verify persisted results', 'All eight source revisions now have matching searchable revisions; no jobs remain pending.');
  await pause(10);
  const search = await request('/api/framework-searches', { method: 'POST', body: { query } });
  assert.equal(search.status, 200); assert.ok(search.body.items.length > 0); assert.equal(search.body.isIndexIncomplete, false);
  await show(page, `POST /api/framework-searches\n${JSON.stringify({ query })}`, search, x => ({ isIndexIncomplete: x.isIndexIncomplete, frameworks: x.items.slice(0, 3).map(y => y.name) }));
  await chapter('Use the completed index', 'A real semantic search now returns recommendations from the completed index.');
  await pause(10);
}

export async function apiStory({ page, chapter, pause, request }) {
  await page.locator('#title').evaluate(el => { el.textContent = 'A catalog API built for discovery'; });
  const catalog = await request('/api/frameworks');
  assert.equal(catalog.status, 200); assert.equal(catalog.body.total, 8);
  await show(page, 'GET /api/frameworks', catalog, x => ({ total: x.total, catalogRevision: x.catalogRevision, frameworks: x.items.slice(0, 4).map(y => ({ name: y.name, technology: y.technology })) }));
  await chapter('Browse the catalog', 'The public API serves eight explicitly labeled evaluation frameworks from SQL Server.');
  await pause(9);
  const filtered = await request('/api/frameworks?technology=React');
  assert.equal(filtered.status, 200); assert.ok(filtered.body.items.length > 0); assert.ok(filtered.body.items.every(x => x.technology === 'React'));
  await show(page, 'GET /api/frameworks?technology=React', filtered, x => ({ total: x.total, frameworks: x.items.map(y => ({ name: y.name, technology: y.technology })) }));
  await chapter('Filter by technology', 'Technology filtering returns only React frameworks.'); await pause(8);
  const details = await request('/api/frameworks/' + filtered.body.items[0].id);
  assert.equal(details.status, 200); assert.equal(details.body.summary.id, filtered.body.items[0].id); assert.ok(details.body.capabilities.length > 0);
  await show(page, `GET /api/frameworks/${filtered.body.items[0].id}`, details, x => ({ name: x.summary.name, capabilities: x.capabilities.map(y => y.description), useCases: x.useCases }));
  await chapter('Inspect capabilities', 'Details describe component capabilities and suitable use cases.'); await pause(10);
  const search = await request('/api/framework-searches', { method: 'POST', body: { query } });
  assert.equal(search.status, 200); assert.ok(search.body.items.length > 0); assert.equal(search.body.isIndexIncomplete, false);
  await show(page, `POST /api/framework-searches\n${JSON.stringify({ query })}`, search, x => ({ isIndexIncomplete: x.isIndexIncomplete, frameworks: x.items.slice(0, 3).map(y => ({ name: y.name, technology: y.technology })) }));
  await chapter('Search by project intent', 'Ollama embeddings rank frameworks for an animal-hospital project.'); await pause(10);
  const denied = await request('/api/maintenance/search-index/rebuild', { method: 'POST' });
  assert.equal(denied.status, 401);
  await show(page, 'POST /api/maintenance/search-index/rebuild   [no credentials]', denied);
  await chapter('Protect maintenance', 'Public discovery needs no account. Index mutations require an authorized operator.'); await pause(9);
}

export async function quarryStory({ page, chapter, pause, appUrl }) {
  const ui = new QuarryDemoPage(page);
  await page.goto(appUrl);
  await expect(page.getByRole('article')).toHaveCount(8);
  await chapter('Describe the project', 'Find a component framework by describing what you want to build.'); await pause(6);
  await page.getByRole('article').first().scrollIntoViewIfNeeded();
  await chapter('Browse evaluation frameworks', 'These eight entries are illustrative evaluation data, not claims of released libraries.'); await pause(7);
  await page.getByLabel('What are you building?').scrollIntoViewIfNeeded();
  await ui.search(query);
  await expect(page.getByRole('heading', { name: `Frameworks for ${query}`, exact: true })).toBeVisible();
  await expect(page.getByRole('article').first()).toBeVisible();
  await page.getByRole('article').first().scrollIntoViewIfNeeded();
  await chapter('Find relevant frameworks', 'The real search service ranks components for appointments and patient-record interfaces.'); await pause(8);
  await ui.filter('Angular');
  await expect(page.getByLabel('Technology', { exact: true })).toHaveValue('Angular');
  await expect(page.getByRole('article').first()).toContainText('Angular');
  await chapter('Narrow by technology', 'Keep the project description while narrowing the recommendations to Angular.'); await pause(7);
  await ui.openFirst();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Capabilities', exact: true })).toBeVisible();
  await chapter('Inspect the framework', 'Review capabilities and suitable use cases before making a choice.'); await pause(9);
  await ui.select();
  await expect(dialog.getByRole('button', { name: 'Selected', exact: true })).toBeVisible();
  await ui.close();
  await expect(page.getByLabel('Selected framework', { exact: true })).toContainText('selected');
  await chapter('Keep one selection', 'The chosen framework stays available while you continue discovery.'); await pause(7);
  await ui.review(); await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Selected', exact: true })).toBeVisible();
  await chapter('Review the selection', 'Reopen the selected framework without losing the search or filter.'); await pause(6);
  await ui.close(); await ui.clearSelection();
  await expect(page.getByLabel('Selected framework', { exact: true })).toHaveCount(0);
  await ui.clearSearch(); await ui.filter('All technologies');
  await expect(page.getByRole('article')).toHaveCount(8);
  await page.evaluate(() => window.scrollTo(0, 0));
  await chapter('Start another discovery', 'Selection, search, and technology filter are cleared. The full catalog is available again.'); await pause(7);
}

export async function previewStory({ page, chapter, pause, displayUrl }) {
  await page.goto(displayUrl + '/preview');
  const frame = page.frameLocator('iframe');
  await expect(page.locator('#feedback')).toHaveText('Preview ready');
  await expect(frame.getByLabel('Display name')).toBeEnabled();
  await chapter('Load the real preview', 'The existing bundle activates after its parent handshake. This parent page is recording tooling.'); await pause(7);
  await frame.getByLabel('Display name').fill('Morgan');
  await frame.getByRole('switch', { name: 'Email notifications' }).uncheck();
  await frame.getByRole('button', { name: 'Save changes' }).click();
  await expect(frame.getByRole('status')).toHaveText('Saved for Morgan in this preview.');
  await chapter('Try the controls', 'Edit the profile and save. The feedback is produced by the shipped preview code.'); await pause(8);
  await frame.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(frame.getByLabel('Display name')).toHaveValue('Jamie');
  await expect(frame.getByRole('switch')).toBeChecked();
  await expect(frame.getByRole('status')).toHaveText('Preview reset.');
  await chapter('Reset the example', 'Reset restores Jamie and the enabled notification preference.'); await pause(7);
  await frame.getByRole('button', { name: 'Reset', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#after')).toBeFocused();
  await expect(page.locator('#feedback')).toHaveText('Keyboard focus returned to the host');
  await chapter('Return to the host', 'Tab from the final control returns keyboard focus to the surrounding page.'); await pause(7);
  await frame.getByLabel('Display name').focus(); await page.keyboard.press('Escape');
  await expect(page.locator('#feedback')).toHaveText('Escape returned control to the host');
  await expect(page.locator('#after')).toBeFocused();
  await chapter('Keep interaction contained', 'Escape also returns control. This illustrative preview does not save a user account.'); await pause(7);
}
