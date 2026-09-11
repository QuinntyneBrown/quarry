# Cornerstone component library

Cornerstone is an Angular component library and the applications that exercise it.
The repository follows the project roles and feature folders of
[`qbc-grid`](https://github.com/QuinntyneBrown/qbc-grid/blob/main/AGENTS.md), following
the library-oriented layout of [`angular/components`](https://github.com/angular/components).

## Repository structure

```text
src/
  cornerstone/                 published @quinntyne/cornerstone package
    card/                      a component feature, including its owned helpers
    calendar/
    .../                       other component features, directly under the package
    core/<concern>/            shared primitives, types, directives, and services
    testing/                   internal test hosts; excluded from the published API
    styles/                    public theme, tokens, and legacy compatibility styles
    schematics/                ng add implementation and collection
    migrations/                ng update collection
    public-api.ts              explicit public exports, including compatibility aliases
    package.json
    ng-package.json
  docs-app/                    published interactive component documentation
  dev-app/                     independent manual component harness
  e2e-app/                     deterministic acceptance-test application
  marketing/                   static brochure site and its optional WebGPU module
design-system/                 independent @quinntyne/cornerstone-design-system token package
  styles/                      authoritative token sources
  tests/                       token behavior tests
  tools/                       independent token build
e2e/
  page-objects/                browser selectors and interactions
  specs/                       acceptance and documentation scenarios
tools/                         repository builds, generation, and verification
docs/
  specs/                       requirements and acceptance criteria
  detailed-designs/            architecture and diagrams
perf/                          existing performance budgets
verification/                  approved baselines and ignored runtime reports
```

Every Angular project owns its configuration and source directly in its directory:
there is no nested `src/lib` or `projects` layer. New projects belong under `src/`.
The root design-system is the intentional exception: it is independent of Angular.

## Where code belongs

- A component and its owned declarations belong in `src/cornerstone/<component>/`.
  For example, `card.component.ts`, its HTML and SCSS, card slot directives, and
  card-only types belong in `card/`. Names and folders agree.
- Shared library primitives belong in `core/<concern>/`, retaining the established
  concerns such as `platform`, `foundations`, and `forms`. A declaration consumed by
  only one component belongs beside that component instead.
- Import internal library declarations directly from their owning files. Consumers
  import `@quinntyne/cornerstone`; the library must not import its own public barrel.
- Apps depend on the library. The library imports no app code, fixture data, routes,
  storage adapters, or documentation metadata. Apps never import one another.
- Library-owned UI services such as dialogs, themes, and announcements remain in
  the library. Application persistence and data fetching belong in their app.
- The docs app owns the public catalog and playground. The dev app is a small manual
  composition harness; acceptance tests do not drive it. The e2e app owns fixed
  fixtures and test routes. Its fixtures may evolve independently of docs examples.
- Keep unit tests beside the code they cover. Put browser scenarios in `e2e/specs`
  and their selectors/interactions in `e2e/page-objects`. Playwright runs docs tests
  against docs-app and library acceptance tests against e2e-app in all three browsers.

## Design tokens and package compatibility

- Edit tokens only in `design-system/styles/_token-values.scss`. The independent
  package builds CSS and SCSS without importing Angular or any application.
- `src/cornerstone/styles/_token-values.scss` is a workspace bridge. The library build
  replaces it in `dist/cornerstone` with the authoritative source. Use
  `npm run build:library` or `npm run watch`, which perform this packaging step;
  a bare `ng build cornerstone` does not produce the final distributable.
- Keep existing `@quinntyne/cornerstone/styles/theme`, `tokens`, and `compat` imports working,
  with and without `.scss`. Consumers of the UI package need no separate token install.
- The token package also exposes `@quinntyne/cornerstone-design-system/tokens.css` and
  `@quinntyne/cornerstone-design-system/tokens.scss`. Component theme rules and legacy migration
  styles remain owned by the UI package.
- Preserve public TypeScript names, compatibility aliases, and `cs-` selectors during
  structural changes. Do not add another package entry point just to mirror a folder.

## Generated files and tooling

- `tools/generate-api.mjs` owns documentation metadata/source bundles and the registries
  in docs-app and e2e-app. Edit source declarations, then run `npm run api:generate`.
  Never hand-edit generated files. Commit these generated artifacts with their sources.
- `tools/component-categories.json` explicitly assigns public symbols to catalog
  categories. Update it when adding a symbol; directory moves must not change categories.
- Generation uses the repository formatter. `api:check` and `format:check` must agree.
- Repository scripts belong in `tools/`. Token-only build scripts belong in
  `design-system/tools/`. The marketing runtime module remains inside its own app.
- `dist`, compiler output, caches, packed consumer fixtures, and browser reports are
  generated artifacts. Do not commit them or edit approved visual baselines merely
  to make a test pass.

The frontend rules below apply to all Angular source under `src/`. Static marketing
HTML is outside the Angular template rules; see [`docs/marketing-site.md`](docs/marketing-site.md).

## File-per-type organization

- A TypeScript source file may declare at most one top-level class, interface, type alias, enum,
  function, or variable.
- Name the file for its declaration and role: `.component.ts`, `.directive.ts`, `.service.ts`,
  `.pipe.ts`, `.interface.ts`, `.type.ts`, `.enum.ts`, `.function.ts`, `.token.ts`, `.constant.ts`,
  or `.class.ts`.
- A barrel may re-export any number of files, but it must not contain a declaration.
- Do not place helper types, configuration interfaces, injection tokens, constants, or functions in
  a component, directive, service, or other declaration file. Give each one its own file.
- Test host components follow the same rules as production components and live in their own files.

## No single-file components

- Every Angular component consists of three colocated files: `name.component.ts`,
  `name.component.html`, and `name.component.scss`.
- Component decorators must use `templateUrl` and `styleUrl`.
- Inline `template`, `styles`, or style arrays are prohibited, including for empty and test-only
  components.
- Directives, pipes, and services remain TypeScript-only unless their own role requires another
  resource.

## Enforcement

Run `npm run architecture:check` before committing. CI runs the same check and rejects multiple
top-level declarations, inline component resources, missing component resources, and filenames
that do not match the declared type.

## Commands and verification

Release automation lives in `tools/release/`; its policy and recovery procedure are
in [`docs/npm-releases.md`](docs/npm-releases.md). Both npm packages publish together
after shared CI validation on every push to `main`, including documentation changes.
Keep source package versions unchanged during releases. Never remove an unfinished
release record, overwrite reserved tarballs, or bypass validation to publish.

- `npm start` / `npm run start:docs`: documentation on port 5173.
- `npm run start:marketing`: marketing on port 5174.
- `npm run start:dev-app`: manual harness on port 5176.
- `npm run start:e2e-app`: acceptance harness on port 5177.
- `npm run build`: tokens, library, all Angular apps, and marketing. Existing deployed
  docs and marketing outputs stay at `dist/design-system/browser` and `dist/marketing/browser`.
- `npm run build:tokens` and `npm run test:tokens`: independent token package checks.
- Before finishing a migration, run `api:check`, `trace:check`, `schematics:test`,
  `architecture:check`, `lint`, `typecheck:e2e`, `format:check`, `test:coverage`, `build`, `pack:check`,
  `size:check`, `verify:consumer`, and `e2e` through `npm run`.
- `verify:consumer` installs packed packages into an isolated consumer, compiles Angular
  templates, and resolves every public stylesheet entry point. Do not lower budgets,
  coverage thresholds, browser coverage, or assertion strength to pass verification.
