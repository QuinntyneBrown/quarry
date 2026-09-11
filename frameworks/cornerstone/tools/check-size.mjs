// Traces to: L2-159, L2-160
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = resolve(import.meta.dirname, '..');
const budgets = JSON.parse(readFileSync(resolve(root, 'perf/size-budgets.json'), 'utf8'));
const measure = (path) => gzipSync(readFileSync(resolve(root, path))).byteLength / 1024;
const fesm = measure('dist/cornerstone/fesm2022/quinntyne-cornerstone.mjs');
const theme = measure('dist/cornerstone/styles/theme.scss');

assert.ok(
  fesm <= budgets.fullFesmGzipKb,
  `FESM is ${fesm.toFixed(2)} KiB gzip; budget is ${budgets.fullFesmGzipKb} KiB.`,
);
assert.ok(
  theme <= budgets.themeGzipKb,
  `Theme is ${theme.toFixed(2)} KiB gzip; budget is ${budgets.themeGzipKb} KiB.`,
);
console.log(
  `Size budgets passed: FESM ${fesm.toFixed(2)} KiB gzip; theme ${theme.toFixed(2)} KiB gzip.`,
);
