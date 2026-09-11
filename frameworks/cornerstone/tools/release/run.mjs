import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { compareVersions, nextVersion, publishPair, waitForManifest } from './policy.mjs';
import {
  api,
  gh,
  git,
  inspect,
  isAncestor,
  npm,
  packages,
  paginated,
  registry,
  repository,
  root,
  run,
} from './io.mjs';

const dryRun = process.argv.includes('--dry-run');
const bootstrap = process.argv.includes('--bootstrap');
const commit = git('rev-parse', 'HEAD');
const marker = '<!-- cornerstone-paired-release-v1 -->';
if (!dryRun) {
  assert.equal(git('status', '--porcelain'), '', 'Commit all changes before publishing');
  assert.equal(
    process.env.GITHUB_REF ?? `refs/heads/${git('branch', '--show-current')}`,
    'refs/heads/main',
  );
  if (process.env.GITHUB_ACTIONS) {
    assert.equal(process.env.GITHUB_SHA, commit);
    assert.equal(process.env.GITHUB_REPOSITORY, repository);
    assert.ok(!bootstrap, 'Bootstrap is only for the first local publication');
  } else {
    assert.ok(bootstrap, 'Publish from release.yml; local execution requires --bootstrap');
  }
}
const releases = paginated(`repos/${repository}/releases?per_page=100`)
  .filter((release) => release.body?.startsWith(marker))
  .map((release) => ({
    ...release,
    record: JSON.parse(release.body.split('```json\n')[1].split('\n```')[0]),
  }));
for (const release of releases) {
  const record = release.record;
  assert.match(record.commit, /^[a-f0-9]{40}$/);
  compareVersions(record.version, record.version);
  assert.equal(release.tag_name, `v${record.version}`);
  assert.deepEqual(
    record.packages.map((pkg) => pkg.name),
    packages.map((pkg) => pkg.name),
  );
  for (const pkg of record.packages) {
    assert.match(pkg.filename, /^[a-z0-9.-]+\.tgz$/);
    assert.match(pkg.integrity, /^sha512-[A-Za-z0-9+/]+={0,2}$/);
    if (pkg.submittedAt) assert.ok(Number.isFinite(Date.parse(pkg.submittedAt)));
  }
}
let existing = releases.find((release) => release.record.commit === commit);
const unfinished = releases.filter((release) => release.draft && release.record.commit !== commit);
if (!dryRun && unfinished.length)
  throw new Error(
    `Repair unfinished release ${unfinished[0].tag_name} at ${unfinished[0].record.commit} before publishing another pair`,
  );
const completed = releases
  .filter((release) => !release.draft && (!dryRun || isAncestor(release.record.commit, commit)))
  .sort((a, b) => compareVersions(b.record.version, a.record.version));
const previous = completed[0]?.record;
if (!existing && previous)
  assert.ok(
    isAncestor(previous.commit, commit),
    'The latest release must be an ancestor; refusing an out-of-order release',
  );
if (bootstrap)
  assert.ok(!previous || existing, 'Local bootstrap is only allowed for the first release');
const messages = git('log', '--format=%B%x00', previous ? `${previous.commit}..${commit}` : commit)
  .split('\0')
  .map((message) => message.trim())
  .filter(Boolean);
const version = existing?.record.version ?? nextVersion(previous?.version, messages);
mkdirSync(resolve(root, 'dist/releases'), { recursive: true });
const directory = mkdtempSync(resolve(root, 'dist/releases/run-'));
const digest = (path) =>
  `sha512-${createHash('sha512').update(readFileSync(path)).digest('base64')}`;

function pack(pkg) {
  const manifestPath = resolve(root, pkg.directory, 'package.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.name, pkg.name);
  assert.ok(!manifest.private);
  manifest.version = version;
  manifest.gitHead = commit;
  manifest.publishConfig = { access: 'public', registry };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const [packed] = JSON.parse(
    npm(['pack', `./${pkg.directory}`, '--json', '--pack-destination', directory]),
  );
  const integrity = digest(resolve(directory, packed.filename));
  assert.equal(packed.integrity, integrity);
  return { name: pkg.name, filename: packed.filename, integrity };
}

let record = dryRun ? undefined : existing?.record;
if (record) {
  for (const [index, pkg] of record.packages.entries()) {
    if (existing.assets.some((asset) => asset.name === pkg.filename)) {
      gh(
        'release',
        'download',
        existing.tag_name,
        '--repo',
        repository,
        '--pattern',
        pkg.filename,
        '--dir',
        directory,
      );
    } else {
      assert.deepEqual(
        pack(packages[index]),
        { name: pkg.name, filename: pkg.filename, integrity: pkg.integrity },
        'Missing reserved asset differs from rebuilt artifact; recover the original validated artifact',
      );
    }
    assert.equal(
      digest(resolve(directory, pkg.filename)),
      pkg.integrity,
      'Recorded asset integrity mismatch',
    );
  }
} else {
  record = { version, commit, packages: packages.map(pack) };
}
const recordPath = resolve(directory, 'release-record.json');
writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`);
const archives = record.packages.map((pkg) => resolve(directory, pkg.filename));
run(process.execPath, [resolve(root, 'tools/verify-consumer.mjs'), '--archives', ...archives], {
  stdio: 'inherit',
});
if (dryRun) {
  for (const archive of archives)
    npm(
      [
        'publish',
        archive,
        '--dry-run',
        '--ignore-scripts',
        '--access',
        'public',
        '--tag',
        'latest',
        '--registry',
        registry,
      ],
      { stdio: 'inherit' },
    );
  console.log(`Dry run: ${version} from ${commit}. Record: ${recordPath}`);
} else {
  if (!existing) {
    const notes = git(
      'log',
      '--format=- %s (%h)',
      previous ? `${previous.commit}..${commit}` : commit,
    );
    existing = api(`repos/${repository}/releases`, {
      tag_name: `v${version}`,
      target_commitish: commit,
      name: `v${version}`,
      draft: true,
      body: `${marker}\n\nRelease record (do not edit):\n\n\`\`\`json\n${JSON.stringify(record, null, 2)}\n\`\`\`\n\nBoth packages use version ${version}.\n\n${notes}`,
    });
  }
  // The durable reservation and exact tarballs exist before any npm publication.
  for (const pkg of record.packages) {
    if (!existing.assets.some((asset) => asset.name === pkg.filename))
      gh(
        'release',
        'upload',
        existing.tag_name,
        resolve(directory, pkg.filename),
        '--repo',
        repository,
      );
  }
  await publishPair(record, {
    inspect,
    submitted: async (pkg) => {
      pkg.submittedAt = new Date().toISOString();
      const body = existing.body.replace(
        /```json\n[\s\S]*?\n```/,
        () => `\`\`\`json\n${JSON.stringify(record, null, 2)}\n\`\`\``,
      );
      existing = api(
        `repos/${repository}/releases/${existing.id}`,
        { body, tag_name: `v${version}`, target_commitish: commit },
        'PATCH',
      );
      assert.equal(existing.tag_name, `v${version}`, 'GitHub changed the reserved release tag');
    },
    waitForManifest: async (name, version) => {
      console.log(`Waiting for npm to make ${name}@${version} available after scanning`);
      return waitForManifest(async () => (await inspect(name, version)).manifest);
    },
    publish: async (pkg) => {
      npm(
        [
          'publish',
          resolve(directory, pkg.filename),
          '--ignore-scripts',
          '--access',
          'public',
          '--tag',
          'latest',
          '--registry',
          registry,
          ...(bootstrap ? [] : ['--provenance']),
        ],
        { stdio: 'inherit' },
      );
    },
    verifyConsumer: async () =>
      run(
        process.execPath,
        [resolve(root, 'tools/verify-consumer.mjs'), '--registry-version', version],
        { stdio: 'inherit' },
      ),
    complete: async () => {
      if (!existing.draft) return;
      const refs = api(`repos/${repository}/git/matching-refs/tags/v${version}`);
      const ref = refs.find((item) => item.ref === `refs/tags/v${version}`);
      if (ref) {
        const sha =
          ref.object.type === 'tag'
            ? api(`repos/${repository}/git/tags/${ref.object.sha}`).object.sha
            : ref.object.sha;
        assert.equal(sha, commit, 'Release tag points to another commit');
      } else {
        const tag = api(`repos/${repository}/git/tags`, {
          tag: `v${version}`,
          message: `Release v${version}`,
          object: commit,
          type: 'commit',
        });
        api(`repos/${repository}/git/refs`, { ref: `refs/tags/v${version}`, sha: tag.sha });
      }
      const finalized = api(
        `repos/${repository}/releases/${existing.id}`,
        {
          draft: false,
          tag_name: `v${version}`,
          target_commitish: commit,
          make_latest:
            !previous || compareVersions(version, previous.version) >= 0 ? 'true' : 'false',
        },
        'PATCH',
      );
      assert.equal(finalized.tag_name, `v${version}`, 'GitHub finalized an unexpected release tag');
      assert.equal(finalized.draft, false);
    },
  });
  console.log(
    `Verified paired release v${version}: https://github.com/${repository}/releases/tag/v${version}`,
  );
}
