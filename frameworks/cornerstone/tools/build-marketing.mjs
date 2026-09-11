// Publishes the static brochure site.
//
// "Building" means copying the hand-written files and validating the small
// runtime surface. One dependency-free WebGPU module is deliberately allowed;
// every other script, inline handler, and source-module type remains rejected.
import { cp, mkdir, readFile, readdir, rm, stat } from 'node:fs/promises';
import { basename, join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const source = resolve(root, 'src/marketing');
const target = resolve(root, 'dist/marketing/browser');

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const found = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...(await walk(path)));
    else found.push(path);
  }
  return found;
}

const files = await walk(source);
const failures = [];
const allowedScripts = new Set(['scripts/foundation-field.js']);
let approvedScriptTags = 0;
let scriptFiles = 0;

for (const file of files) {
  const name = basename(file);
  const path = relative(source, file).replaceAll('\\', '/');

  if (/\.(ts|tsx|jsx|mjs|cjs)$/.test(name)) {
    failures.push(`${name} is a source module; the brochure site ships no build step.`);
    continue;
  }

  if (name.endsWith('.js')) {
    if (!allowedScripts.has(path)) failures.push(`${path} is not an approved runtime module.`);
    else scriptFiles += 1;
    continue;
  }

  if (!name.endsWith('.html')) continue;

  const html = await readFile(file, 'utf8');
  const scriptStarts = html.match(/<script\b/gi) ?? [];
  const scriptTags = html.match(/<script\b[\s\S]*?<\/script\s*>/gi) ?? [];
  if (scriptStarts.length !== scriptTags.length) {
    failures.push(`${path} contains a malformed or unclosed script tag.`);
  }
  for (const tag of scriptTags) {
    const normalized = tag.replace(/\s+/g, ' ').trim();
    const approved = '<script type="module" src="scripts/foundation-field.js"></script>';
    if (path === 'index.html' && normalized === approved) approvedScriptTags += 1;
    else failures.push(`${path} contains an unapproved script tag.`);
  }
  if (/\son[a-z]+\s*=/i.test(html)) failures.push(`${name} contains an inline event handler.`);
  if (!/<title>/.test(html)) failures.push(`${name} has no title.`);
  if (!/<html lang="[a-z-]+"/.test(html)) failures.push(`${name} has no language declared.`);
}

if (scriptFiles !== allowedScripts.size) {
  failures.push(`Expected ${allowedScripts.size} approved runtime module; found ${scriptFiles}.`);
}
if (approvedScriptTags !== 1) {
  failures.push(`Expected one approved module script tag; found ${approvedScriptTags}.`);
}

if (failures.length > 0) {
  console.error('The marketing site failed validation:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });

let bytes = 0;
for (const file of files) bytes += (await stat(file)).size;

console.log(
  `Marketing site published: ${files.length} files, ${(bytes / 1024).toFixed(1)} KiB, ${scriptFiles} approved script.`,
);
