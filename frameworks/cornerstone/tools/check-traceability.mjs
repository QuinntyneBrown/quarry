import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const spec = readFileSync(resolve(root, 'docs/specs/L2.md'), 'utf8');
const valid = new Set([...spec.matchAll(/^## (L2-\d{3}):/gm)].map((match) => match[1]));
const tests = [];
function visit(directory) {
  for (const name of readdirSync(directory)) {
    const path = resolve(directory, name);
    if (statSync(path).isDirectory()) visit(path);
    else if (name.endsWith('.spec.ts')) tests.push(path);
  }
}
visit(resolve(root, 'src/cornerstone'));
let failed = false;
for (const test of tests) {
  const first = readFileSync(test, 'utf8').split(/\r?\n/, 1)[0];
  const ids = [...first.matchAll(/L2-\d{3}/g)].map((match) => match[0]);
  if (!first.startsWith('// Traces to:') || ids.length === 0) {
    console.error(`Missing trace header: ${test}`);
    failed = true;
  }
  for (const id of ids)
    if (!valid.has(id)) {
      console.error(`Unknown requirement ${id}: ${test}`);
      failed = true;
    }
}
if (failed) process.exitCode = 1;
else console.log(`${tests.length} acceptance suites reference valid L2 requirements.`);
