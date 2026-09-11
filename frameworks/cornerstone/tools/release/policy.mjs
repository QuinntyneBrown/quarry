import { setTimeout } from 'node:timers/promises';

export async function waitForManifest(read, { attempts = 80, sleep = setTimeout } = {}) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const manifest = await read();
    if (manifest) return manifest;
    if (attempt + 1 < attempts) await sleep(15000);
  }
  throw new Error(
    'Accepted package is not available after 20 minutes; leave the draft and retry after npm scanning completes',
  );
}

export function compareVersions(left, right) {
  const parse = (value) => {
    if (!/^\d+\.\d+\.\d+$/.test(value)) throw new Error(`Invalid stable version: ${value}`);
    return value.split('.').map(Number);
  };
  const a = parse(left);
  const b = parse(right);
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

export function nextVersion(previous, messages) {
  if (!previous) return '0.1.0';
  compareVersions(previous, previous);
  const [major, minor, patch] = previous.split('.').map(Number);
  if (
    messages.some(
      (message) =>
        /^[a-z]+(?:\([^\r\n]*\))?!:/m.test(message) || /^BREAKING[ -]CHANGE:\s*\S/m.test(message),
    )
  ) {
    return `${major + 1}.0.0`;
  }
  if (messages.some((message) => /^feat(?:\([^\r\n]*\))?:/.test(message)))
    return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

export function predecessors(runs, commit, isAncestor) {
  return runs.filter(
    (run) => run.head_sha !== commit && run.status !== 'completed' && isAncestor(run.head_sha),
  );
}

export async function publishPair(record, ports) {
  // Preflight the entire pair before making any registry mutation.
  const states = await Promise.all(
    record.packages.map((pkg) => ports.inspect(pkg.name, record.version)),
  );
  for (const [index, state] of states.entries()) {
    const pkg = record.packages[index];
    if (
      state.manifest &&
      (state.manifest.version !== record.version ||
        state.manifest.gitHead !== record.commit ||
        state.manifest.dist?.integrity !== pkg.integrity)
    ) {
      throw new Error(`Registry conflict for ${pkg.name}@${record.version}`);
    }
  }
  if (
    states.some((state) => !state.manifest) &&
    states.some((state) => state.latest && compareVersions(state.latest, record.version) > 0)
  ) {
    throw new Error('A newer latest exists; refusing to publish a stale incomplete release');
  }
  for (const [index, pkg] of record.packages.entries()) {
    if (!states[index].manifest && !pkg.submittedAt) {
      await ports.publish(pkg);
      await ports.submitted(pkg);
    }
  }
  for (const pkg of record.packages) {
    const manifest = await ports.waitForManifest(pkg.name, record.version);
    if (
      manifest?.version !== record.version ||
      manifest?.gitHead !== record.commit ||
      manifest?.dist?.integrity !== pkg.integrity
    ) {
      throw new Error(`Published artifact verification failed for ${pkg.name}`);
    }
  }
  await ports.verifyConsumer();
  await ports.complete();
}
