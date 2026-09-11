import { execFileSync, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

export const root = resolve(import.meta.dirname, '../..');
export const repository = 'QuinntyneBrown/Cornerstone';
export const registry = 'https://registry.npmjs.org';
export const packages = [
  { name: '@quinntyne/cornerstone', directory: 'dist/cornerstone' },
  { name: '@quinntyne/cornerstone-design-system', directory: 'dist/design-system-tokens' },
];
export const run = (command, args, options = {}) =>
  execFileSync(command, args, { cwd: root, encoding: 'utf8', ...options })?.trim();
export const git = (...args) => run('git', args);
export const npm = (args, options = {}) =>
  run(process.execPath, [process.env.npm_execpath, ...args], options);
export const gh = (...args) => run('gh', args);
export const api = (endpoint, body, method) =>
  JSON.parse(
    run(
      'gh',
      ['api', endpoint, ...(body ? ['--method', method ?? 'POST', '--input', '-'] : [])],
      body ? { input: JSON.stringify(body) } : {},
    ),
  );
export const paginated = (endpoint) =>
  JSON.parse(gh('api', '--paginate', '--slurp', endpoint)).flat();
export const isAncestor = (ancestor, commit) => {
  const result = spawnSync('git', ['merge-base', '--is-ancestor', ancestor, commit], { cwd: root });
  if (result.status !== 0 && result.status !== 1)
    throw new Error(`Cannot check ancestry of ${ancestor}`);
  return result.status === 0;
};

export async function inspect(name, version) {
  const response = await fetch(`${registry}/${encodeURIComponent(name)}`, {
    signal: AbortSignal.timeout(30000),
    headers: { 'cache-control': 'no-cache' },
  });
  if (response.status === 404) return {};
  if (!response.ok) throw new Error(`npm metadata request failed: ${response.status} for ${name}`);
  const data = await response.json();
  return { manifest: data.versions?.[version], latest: data['dist-tags']?.latest };
}
