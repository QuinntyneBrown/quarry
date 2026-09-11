# npm releases

The public packages are `@quinntyne/cornerstone` (Angular UI) and
`@quinntyne/cornerstone-design-system` (independent CSS/SCSS tokens). The UI package
includes the tokens it needs; installing the separate token package is optional.
Both packages use the same stable version and the `latest` npm tag.

## Release policy

Every passing push to `main`, including documentation-only changes, releases the
final commit in that push. The first release is `0.1.0`. Subsequent releases use
all commits since the previous completed release: a Conventional Commit `!` or
`BREAKING CHANGE:` footer selects major, `feat:` selects minor, and everything
else selects patch. The largest applicable bump wins. A rerun of an already
released commit verifies that release without creating another version.

`.github/workflows/validate.yml` is shared by CI and Release. It checks API
freshness, traceability, schematics, architecture, lint, types, formatting,
coverage, tokens, release behavior, all builds, package contents, bundle budgets,
an isolated Angular/Sass consumer, and Chromium, Firefox, and WebKit acceptance
tests. A publish dry run checks both final tarballs. Only its two validated package
directories are handed to the publisher; applications and the private workspace
are never published.

Earlier unfinished push runs finish before a later mainline commit can publish.
The publication job also holds one concurrency lock with `queue: max`, retaining
up to GitHub's limit of 100 pending jobs. Queue exhaustion, cancelled runs, and
five-hour ordering timeouts require rerunning the affected workflow. Validation
failures publish nothing. A subsequent passing push includes their commits.

## Records and recovery

The publisher stamps only built manifests with the version and `gitHead`.
It creates a draft GitHub release containing a machine-readable record of the
version, source commit, package names, filenames, and SHA-512 tarball integrities.
It uploads the exact tarballs to that draft before publishing either package.
After npm accepts each upload, the draft records its submission time. Retries
wait for accepted uploads instead of submitting them again while scanning is
pending. Registry verification polls every 15 seconds for up to 20 minutes per
package. If npm takes longer, the run fails with the draft intact for a later
retry. A crash between npm acceptance and recording the submission may require
waiting for registry visibility before rerunning.

The source manifests keep their development version; CI never commits generated
version or changelog changes back to `main`.

npm cannot publish two packages atomically. A failure after the first upload can
temporarily leave only one package at the new version. The draft blocks further
pairs until repaired. **Rerun the failed Release run at its original commit**:
it downloads the recorded tarballs, checks their hashes, skips matching versions
already on npm, and uploads the missing package. It refuses a different artifact
at an existing version or an incomplete release older than either current
`latest`. It never unpublishes or rolls back a distribution tag.

After both registry integrities and a fresh registry consumer pass, the publisher
creates an annotated `v<version>` tag and makes the draft release public. The
release body is the version's changelog. If tagging or finalization fails, rerun
the original workflow; already published packages will be verified and skipped.
Do not delete or edit a reservation or overwrite its tarball assets. If a crash
occurred before an asset upload, a retry may restore it only when its hash matches
the original reservation; otherwise recover it from the original validated build.

## Initial setup

The npm account `quinntyne` owns the user scope. Public packages need
`--access public`; no npm organization is required. Both source manifests include
the repository URL and their directory for provenance.

The first publication requires an authenticated maintainer because npm trusted
publishers can only be configured for an existing package. After all checks pass,
from a clean committed `main` checkout with current builds:

```sh
npm login --registry=https://registry.npmjs.org
npm run release:dry-run
npm run release:publish -- --bootstrap
```

This one-time local bootstrap cannot carry a GitHub Actions provenance statement.
Configure each package's trusted publisher afterward, using npm 11.15 or newer
and an account with 2FA enabled:

```sh
npm trust github @quinntyne/cornerstone --repo QuinntyneBrown/Cornerstone --file release.yml --env npm --allow-publish
npm trust github @quinntyne/cornerstone-design-system --repo QuinntyneBrown/Cornerstone --file release.yml --env npm --allow-publish
```

The same settings are available in each package's npm settings page. The workflow
runs on a GitHub-hosted runner with Node 22.22.0, npm 11.19.1, environment `npm`,
and `id-token: write`. Subsequent publications use OIDC and `--provenance`; no
long-lived `NPM_TOKEN` secret is needed. Keep publisher configuration matched to
the repository, workflow filename, and environment.

Verify a published pair with:

```sh
npm run verify:consumer -- --registry-version 0.1.0
npm view @quinntyne/cornerstone version dist.integrity dist.attestations
npm view @quinntyne/cornerstone-design-system version dist.integrity dist.attestations
```

This policy supersedes the original delivery design's single-package publisher,
non-release commit exclusions, generated changelog commits, and `next` branch.
See [npm scoped public packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/),
[trusted publishers](https://docs.npmjs.com/trusted-publishers/),
[npm trust](https://docs.npmjs.com/cli/v11/commands/npm-trust/), and
[GitHub concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).
See also [npm publication scanning and availability delays](https://github.blog/changelog/2026-07-28-npm-publish-time-malware-scanning-and-dual-use-metadata/).
