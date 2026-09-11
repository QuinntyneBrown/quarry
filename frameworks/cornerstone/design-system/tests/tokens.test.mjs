import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolve } from 'node:path';
import { compile, compileString } from 'sass';

const root = resolve(import.meta.dirname, '..');

test('tokens compile independently with light and dark theme values', () => {
  const css = compile(resolve(root, 'styles/tokens.scss')).css;
  assert.match(css, /\.cs-theme-light/);
  assert.match(css, /\.cs-theme-dark/);
  assert.match(css, /--cs-paper:\s*#fffef7/);
  assert.match(css, /--cs-paper:\s*#16160c/);
  assert.match(css, /--cs-focus:/);
  assert.match(css, /--cs-space-2:/);
});

test('Sass consumers can load tokens once through the public entry point', () => {
  const css = compileString('@use "tokens"; @use "tokens" as another;', {
    loadPaths: [resolve(root, 'styles')],
  }).css;
  assert.equal((css.match(/\.cs-theme-light/g) ?? []).length, 1);
});
