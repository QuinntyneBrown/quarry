import assert from 'node:assert/strict';
import { test } from 'node:test';
import { nextVersion, publishPair, predecessors, waitForManifest } from './policy.mjs';
import { run } from './io.mjs';

test('release subprocesses support both captured and inherited output and propagate failure', () => {
  assert.equal(run(process.execPath, ['-e', 'process.stdout.write("ok")']), 'ok');
  assert.equal(run(process.execPath, ['-e', 'process.exit(0)'], { stdio: 'inherit' }), undefined);
  assert.throws(() => run(process.execPath, ['-e', 'process.exit(2)']));
});

test('initial release is 0.1.0; every subsequent push gets a semantic bump', () => {
  assert.equal(nextVersion(null, ['feat!: initial']), '0.1.0');
  for (const message of [
    'docs: readme',
    'ci: workflow',
    'test: coverage',
    'fix: bug',
    'misc change',
  ]) {
    assert.equal(nextVersion('1.2.3', [message]), '1.2.4');
  }
  assert.equal(nextVersion('1.2.3', ['fix: bug', 'feat(button): new input']), '1.3.0');
  assert.equal(nextVersion('1.2.3', ['feat: input', 'refactor(api)!: remove old input']), '2.0.0');
  assert.equal(nextVersion('0.1.2', ['refactor: api\n\nBREAKING CHANGE: removed input']), '1.0.0');
  assert.throws(() => nextVersion('latest', []), /version/);
});

function fixture() {
  const record = {
    version: '0.1.0',
    commit: 'a'.repeat(40),
    packages: [
      { name: '@quinntyne/cornerstone', integrity: 'sha512-ui' },
      { name: '@quinntyne/cornerstone-design-system', integrity: 'sha512-tokens' },
    ],
  };
  const registry = new Map();
  const tags = new Map();
  let finished = false;
  let verified = false;
  const ports = {
    inspect: async (name) => ({ manifest: registry.get(name), latest: tags.get(name) }),
    publish: async (pkg) => {
      assert.ok(!registry.has(pkg.name), 'must never republish an existing version');
      registry.set(pkg.name, {
        version: record.version,
        gitHead: record.commit,
        dist: { integrity: pkg.integrity },
      });
      tags.set(pkg.name, record.version);
    },
    submitted: async (pkg) => {
      pkg.submittedAt = '2026-09-09T09:00:00.000Z';
    },
    waitForManifest: async (name) => registry.get(name),
    verifyConsumer: async () => {
      verified = true;
    },
    complete: async () => {
      assert.ok(verified);
      finished = true;
    },
  };
  return { record, registry, tags, ports, finished: () => finished };
}

test('both packages must publish and verify before completion', async () => {
  const f = fixture();
  await publishPair(f.record, f.ports);
  assert.equal(f.registry.size, 2);
  assert.ok(f.finished());
  await publishPair(f.record, f.ports);
  assert.equal(f.registry.size, 2);
});

test('accepted uploads waiting for npm scanning are not submitted again on recovery', async () => {
  const f = fixture();
  for (const pkg of f.record.packages) pkg.submittedAt = '2026-09-09T09:00:00.000Z';
  f.ports.publish = async () => {
    throw new Error('must not resubmit accepted uploads');
  };
  f.ports.waitForManifest = async (name) => ({
    version: f.record.version,
    gitHead: f.record.commit,
    dist: { integrity: f.record.packages.find((pkg) => pkg.name === name).integrity },
  });
  await publishPair(f.record, f.ports);
  assert.ok(f.finished());
});

test('registry visibility polling tolerates scanning delays but remains bounded', async () => {
  let attempts = 0;
  const manifest = { version: '0.1.0' };
  const sleep = async () => {};
  assert.equal(
    await waitForManifest(async () => (++attempts < 3 ? undefined : manifest), {
      attempts: 3,
      sleep,
    }),
    manifest,
  );
  await assert.rejects(
    waitForManifest(async () => undefined, { attempts: 3, sleep }),
    /not available/,
  );
  await assert.rejects(
    waitForManifest(
      async () => {
        throw new Error('401');
      },
      { sleep },
    ),
    /401/,
  );
});

test('partial failure resumes the exact version without re-uploading the first package', async () => {
  const f = fixture();
  const publish = f.ports.publish;
  f.ports.publish = async (pkg) => {
    if (pkg.name.endsWith('design-system')) throw new Error('network failure');
    return publish(pkg);
  };
  await assert.rejects(publishPair(f.record, f.ports), /network failure/);
  assert.equal(f.registry.size, 1);
  assert.equal(f.finished(), false);
  f.ports.publish = publish;
  await publishPair(f.record, f.ports);
  assert.equal(f.registry.size, 2);
  assert.ok(f.finished());
});

test('collision in either package fails before publishing anything', async () => {
  const f = fixture();
  f.registry.set('@quinntyne/cornerstone-design-system', {
    gitHead: 'different',
    dist: { integrity: 'different' },
  });
  await assert.rejects(publishPair(f.record, f.ports), /conflict/);
  assert.equal(f.registry.size, 1);
  assert.equal(f.finished(), false);
});

test('a finalization failure can be retried after both uploads without publishing twice', async () => {
  const f = fixture();
  const complete = f.ports.complete;
  f.ports.complete = async () => {
    throw new Error('GitHub unavailable');
  };
  await assert.rejects(publishPair(f.record, f.ports), /GitHub unavailable/);
  assert.equal(f.registry.size, 2);
  assert.equal(f.finished(), false);
  f.ports.complete = complete;
  await publishPair(f.record, f.ports);
  assert.ok(f.finished());
});

test('registry errors and consumer failures never finalize a release', async () => {
  const f = fixture();
  await assert.rejects(
    publishPair(f.record, {
      ...f.ports,
      inspect: async () => {
        throw new Error('401');
      },
    }),
    /401/,
  );
  assert.equal(f.registry.size, 0);
  f.ports.verifyConsumer = async () => {
    throw new Error('broken export');
  };
  await assert.rejects(publishPair(f.record, f.ports), /broken export/);
  assert.equal(f.finished(), false);
});

test('stale incomplete releases cannot downgrade latest; complete retries leave tags alone', async () => {
  const f = fixture();
  f.tags.set('@quinntyne/cornerstone', '0.2.0');
  await assert.rejects(publishPair(f.record, f.ports), /newer/);
  assert.equal(f.registry.size, 0);
  f.tags.clear();
  await publishPair(f.record, f.ports);
  f.tags.set('@quinntyne/cornerstone', '0.2.0');
  f.tags.set('@quinntyne/cornerstone-design-system', '0.2.0');
  await publishPair(f.record, f.ports);
  assert.equal(f.tags.get('@quinntyne/cornerstone'), '0.2.0');
});

test('bursts wait for earlier unfinished push heads, excluding duplicates and finished runs', () => {
  const runs = [
    { id: 1, head_sha: 'a', status: 'queued' },
    { id: 2, head_sha: 'b', status: 'in_progress' },
    { id: 3, head_sha: 'c', status: 'in_progress' },
    { id: 4, head_sha: 'd', status: 'completed' },
    { id: 5, head_sha: 'z', status: 'in_progress' },
  ];
  assert.deepEqual(
    predecessors(runs, 'c', (sha) => ['a', 'b', 'd'].includes(sha)).map((run) => run.id),
    [1, 2],
  );
});
