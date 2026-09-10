import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { startDisplay, assertOwnedDatabase, runCommand } from './harness.mjs';

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
