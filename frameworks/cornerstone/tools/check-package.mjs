// Traces to: L2-001, L2-002, L2-003, L2-004, L2-160
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const output = execFileSync('npm', ['pack', '--dry-run', '--json', './dist/cornerstone'], {
  cwd: root,
  encoding: 'utf8',
  shell: process.platform === 'win32',
});
const [pack] = JSON.parse(output);
const files = new Set(pack.files.map((file) => file.path.replaceAll('\\', '/')));
const manifest = JSON.parse(readFileSync(resolve(root, 'dist/cornerstone/package.json'), 'utf8'));

assert.equal(manifest.name, '@quinntyne/cornerstone');
assert.deepEqual(Object.keys(manifest.dependencies ?? {}), ['tslib']);
for (const peer of [
  '@angular/cdk',
  '@angular/common',
  '@angular/core',
  '@angular/forms',
  '@angular/router',
])
  assert.ok(manifest.peerDependencies?.[peer], `Missing peer dependency ${peer}`);
for (const style of ['theme.scss', 'tokens.scss', 'compat.scss']) {
  assert.ok(files.has(`styles/${style}`), `Missing packaged stylesheet styles/${style}`);
  assert.ok(manifest.exports?.[`./styles/${style}`], `Missing export for styles/${style}`);
}
assert.ok(files.has('fesm2022/quinntyne-cornerstone.mjs'));
assert.ok(files.has('types/quinntyne-cornerstone.d.ts'));
assert.ok(![...files].some((file) => file.endsWith('.spec.ts')));
console.log(`Package contract verified: ${pack.entryCount} files, ${pack.size} bytes packed.`);
