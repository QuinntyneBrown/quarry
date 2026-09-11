// Traces to: L2-184, L2-185
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { HostTree } = require('@angular-devkit/schematics');
const { SchematicTestRunner } = require('@angular-devkit/schematics/testing');

const collection = resolve(import.meta.dirname, '../src/cornerstone/schematics/collection.json');
const runner = new SchematicTestRunner('@quinntyne/cornerstone', collection);
const tree = new HostTree();
tree.create(
  '/angular.json',
  JSON.stringify({
    version: 1,
    projects: { demo: { architect: { build: { options: { styles: [] } } } } },
  }),
);
tree.create('/package.json', JSON.stringify({ dependencies: {} }));

const result = await runner.runSchematic(
  'ng-add',
  { project: 'demo', compatibilityStyles: true, skipInstall: true },
  tree,
);
const workspace = JSON.parse(result.readContent('/angular.json'));
const manifest = JSON.parse(result.readContent('/package.json'));
assert.deepEqual(workspace.projects.demo.architect.build.options.styles, [
  '@quinntyne/cornerstone/styles/theme.scss',
  '@quinntyne/cornerstone/styles/compat.scss',
]);
assert.equal(manifest.dependencies['@angular/cdk'], '^21.0.0');

const second = await runner.runSchematic(
  'ng-add',
  { project: 'demo', compatibilityStyles: true, skipInstall: true },
  result,
);
assert.deepEqual(
  JSON.parse(second.readContent('/angular.json')).projects.demo.architect.build.options.styles,
  workspace.projects.demo.architect.build.options.styles,
);
console.log('ng-add schematic is idempotent and configures theme, compatibility, and CDK.');
