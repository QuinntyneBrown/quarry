import { setTimeout } from 'node:timers/promises';
import { git, isAncestor, paginated, repository } from './io.mjs';
import { predecessors } from './policy.mjs';

// Wait outside the publication lock so an earlier run can still acquire it.
const commit = process.env.GITHUB_SHA;
if (!commit || process.env.GITHUB_REF !== 'refs/heads/main')
  throw new Error('Release requires main');
const deadline = Date.now() + 5 * 60 * 60 * 1000;
while (true) {
  git('fetch', 'origin', 'main');
  const pages = paginated(
    `repos/${repository}/actions/workflows/release.yml/runs?branch=main&event=push&per_page=100`,
  );
  const pending = predecessors(
    pages.flatMap((page) => page.workflow_runs),
    commit,
    (sha) => isAncestor(sha, commit),
  );
  if (!pending.length) break;
  if (Date.now() > deadline)
    throw new Error('Earlier release runs did not finish; rerun this workflow after recovery');
  console.log(`Waiting for earlier push runs: ${pending.map((run) => run.id).join(', ')}`);
  await setTimeout(15000);
}
