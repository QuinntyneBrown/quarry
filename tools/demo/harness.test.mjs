import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { startDisplay, assertOwnedDatabase, runCommand, narrate } from './harness.mjs';

const require = createRequire(new URL('../../frontend/package.json', import.meta.url));
const { chromium } = require('playwright');

test('cleanup rejects development databases and other demo runs', () => {
  assert.throws(() => assertOwnedDatabase('Quarry', 'abc'));
  assert.throws(() => assertOwnedDatabase('Quarry_Demo_other_Evaluation', 'abc'));
  assert.equal(assertOwnedDatabase('Quarry_Demo_abc_Evaluation', 'abc'), 'Quarry_Demo_abc_Evaluation');
});

test('commands preserve actual output and reject failures and timeouts', async () => {
  assert.match(await runCommand(process.execPath, ['-e', 'console.log("actual-result")']), /actual-result/);
  await assert.rejects(runCommand(process.execPath, ['-e', 'process.exit(7)']), /7/);
  await assert.rejects(runCommand(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { timeout: 150 }), /timed out/);
});

test('recording display renders literal output and exposes no execution endpoint', async () => {
  const display = await startDisplay();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(display.url);
    await page.evaluate(() => window.showResult('GET /actual', 200, '<script>bad()</script>'));
    assert.equal(await page.locator('#output').textContent(), '<script>bad()</script>');
    assert.equal((await fetch(display.url + '/execute', { method: 'POST' })).status, 404);
  } finally { await browser.close(); await display.close(); }
});

test('captions remain beside an open product dialog without covering its controls', async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.setContent('<dialog style="width:640px;height:650px">Framework details<button>Select framework</button></dialog>');
    await narrate(page, 'Initial caption');
    await page.locator('dialog').evaluate(dialog => dialog.showModal());
    await narrate(page, 'Review capabilities and suitable use cases before making a choice.');
    const caption = await page.locator('#demo-caption').boundingBox();
    const dialog = await page.locator('dialog').boundingBox();
    assert.ok(caption.x + caption.width < dialog.x, 'Caption must stay outside the product dialog');
    assert.ok(caption.y >= 0 && caption.y + caption.height <= 720);
  } finally { await browser.close(); }
});
