import { copyFileSync, cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { compile } from 'sass';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, '../dist/design-system-tokens');
mkdirSync(output, { recursive: true });
cpSync(resolve(root, 'styles'), resolve(output, 'styles'), { recursive: true });
for (const file of ['README.md', 'LICENSE'])
  copyFileSync(resolve(root, file), resolve(output, file));
const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
delete manifest.scripts;
delete manifest.devDependencies;
writeFileSync(resolve(output, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(resolve(output, 'tokens.css'), compile(resolve(root, 'styles/tokens.scss')).css);
console.log('Built @quinntyne/cornerstone-design-system in dist/design-system-tokens.');
