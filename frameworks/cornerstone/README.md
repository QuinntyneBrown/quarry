# Cornerstone

FaithTech's `@quinntyne/cornerstone` Angular CDK component library: accessible behavior, a disciplined FaithTech visual
language, and a practical migration bridge for [Liturgy](https://github.com/QuinntyneBrown/Liturgy)
and [Word Up](https://github.com/QuinntyneBrown/word-up).

Explore the library at the
[Cornerstone marketing site](https://lemon-plant-044de2c0f.7.azurestaticapps.net).

## Workspace

```text
src/cornerstone/      @quinntyne/cornerstone library, with direct component feature folders
src/docs-app/         published interactive documentation (Angular)
src/dev-app/          independent manual component harness
src/e2e-app/          deterministic acceptance-test application
src/marketing/        static HTML/CSS brochure and optional WebGPU enhancement
design-system/        independent @quinntyne/cornerstone-design-system token package
e2e/                  browser page objects and specifications
tools/                repository builds, generation, and verification
docs/                 requirements, API inventory, and detailed designs
```

The documentation application is a static Angular build. The brochure site is plain HTML and CSS
with one dependency-free WebGPU enhancement module; `npm run build:marketing` copies it to
`dist/marketing/browser` and rejects every script outside that explicit allowlist. Both ship Azure
Static Web Apps route configuration, and GitHub Actions deploys each from `main` when its Azure
deployment token is configured. See [`docs/marketing-site.md`](docs/marketing-site.md) for the
brochure site's design and content rationale.

## Start locally

```bash
npm install
npm start                 # component documentation on :5173
npm run start:marketing   # brochure site on :5174
npm run start:dev-app     # manual component harness on :5176
npm run start:e2e-app     # acceptance harness on :5177
```

## Build and test

```bash
npm test
npm run test:coverage
npm run lint
npm run e2e
npm run build
npm run pack:check
npm run test:tokens
npm run verify:consumer
npm run format:check
```

## Frontend file organization

Frontend code follows a strict file-per-type convention. Each TypeScript file contains at most one
top-level declaration, and every Angular component uses colocated external `.html` and `.scss`
resources. See [`AGENTS.md`](AGENTS.md) for project boundaries and placement rules, and run
`npm run architecture:check` to verify the invariant. Use `npm run build:library` to create
the distributable library with authoritative token assets; a bare Angular build omits that
final packaging step. The token package builds independently with `npm run build:tokens`.

## Install in an Angular application

Both packages publish together on every passing push to `main`. See
[`docs/npm-releases.md`](docs/npm-releases.md) for versioning, setup, and recovery.

```bash
npm install @quinntyne/cornerstone @angular/cdk@^21
```

The component library supports Angular 21. The independent token package can be
used without Angular: `npm install @quinntyne/cornerstone-design-system`.

Add the base theme to the application's `angular.json` styles array:

```json
"styles": ["@quinntyne/cornerstone/styles/theme.scss", "src/styles.scss"]
```

Then import only the standalone pieces a screen uses:

```ts
import { CsButtonDirective, CardComponent } from '@quinntyne/cornerstone';

@Component({
  imports: [CsButtonDirective, CardComponent],
  template: `<cs-card><button csButton>Continue</button></cs-card>`,
})
export class ExampleComponent {}
```

For a best-effort drop-in migration from Liturgy or Word Up, load the compatibility layer after
the theme:

```json
"styles": [
  "@quinntyne/cornerstone/styles/theme.scss",
  "@quinntyne/cornerstone/styles/compat.scss",
  "src/styles.scss"
]
```

This preserves Liturgy's existing generic product primitives and Word Up's complete `wu-*`
vocabulary while templates move incrementally to the `cs-*` Angular API. See
[`docs/specs/migration.md`](docs/specs/migration.md) for the audited component mapping.

## Theme customization

See [event component examples](docs/event-components.md) for countdowns, review
dialogs, team assignment boards, and raffle presentations.

All decisions are CSS custom properties. Override tokens on `:root` or a subtree:

```scss
:root {
  --cs-font-display: 'Your licensed FaithTech display face', sans-serif;
  --cs-container: 76rem;
}
```

Apply `.cs-theme-dark` to any ancestor for the supplied dark theme. Motion durations collapse
automatically for `prefers-reduced-motion`.

## License

MIT
