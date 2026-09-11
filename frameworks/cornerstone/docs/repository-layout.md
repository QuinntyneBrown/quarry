# Library repository layout

Cornerstone follows the separate library, manual app, acceptance app, and token project
roles in [qbc-grid](https://github.com/QuinntyneBrown/qbc-grid/blob/main/AGENTS.md).
The authoritative folder tree and contributor rules live in [AGENTS.md](../AGENTS.md).

The migration places the published UI package directly in `src/cornerstone`, flattens
component features, and collects shared declarations in `core/<concern>`. The public
API retains its existing 491 symbols, including compatibility aliases. Component
selectors, package names, and consumer stylesheet paths are unchanged.

Documentation now lives in `src/docs-app`; the root `design-system` owns only the
independent token package. `src/dev-app` provides a manual composition harness.
`src/e2e-app` owns deterministic component fixtures with no imports from docs or dev-app.
Catalog categories are explicit generator metadata rather than a consequence of paths.

The library build compiles Angular first and then copies the authoritative token
source into the distribution. This avoids ng-packagr's prohibition on copying assets
from outside the library project and keeps consumer Sass imports self-contained.
Watch mode repeats the copy after library builds and token edits. The source bridge
exists only to let workspace apps compile against the same authoritative tokens.

Existing Azure deployment destinations and secrets are retained. Documentation still
builds to `dist/design-system/browser`; marketing builds to `dist/marketing/browser`.
The token package builds to `dist/design-system-tokens` and is locally packable. This
migration does not publish a new npm package or provision a token website.
