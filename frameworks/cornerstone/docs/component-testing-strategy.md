# Component testing strategy

> Repository-layout update: the host-sharing and folder suggestions in this proposal
> are superseded by [the implemented repository layout](repository-layout.md).
> Documentation now lives in `src/docs-app`, acceptance fixtures in the independent
> `src/e2e-app`, and manual development in `src/dev-app`. The root `design-system`
> contains tokens only. The remaining proposals below describe future testing work;
> they do not override the application boundaries documented in `AGENTS.md`.

**Status:** Proposed  
**Scope:** Every public UI component and directive in `@quinntyne/cornerstone`  
**Primary tools:** Playwright Test, the `design-system` Angular application, Component Object Models,
Vitest/TestBed, and axe-core

## Decision

Cornerstone should test every public UI component in a real browser with Playwright Test. Playwright
should drive small, deterministic examples hosted by the existing `design-system` Angular
application. The examples should also supply the live examples and variant galleries required by the
documentation site.

The decisions are:

| Question                                         | Decision                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Do component tests need a host application?      | **Yes, but not a new product application.** Playwright Test needs a browser-rendered URL because Playwright's native component-test runner does not support Angular. Extend the existing `design-system` application with a frameless test-canvas route.                                                         |
| Should Cornerstone add Storybook?                | **Not now.** It would duplicate the already-specified documentation application and scenario inventory. The Angular/Vite Storybook framework is currently preview, requires Vite 8, and this workspace currently resolves Vite 7.3.6. Reassess after that integration is stable and the workspace adopts Vite 8. |
| Should the team design interactive design pages? | **Yes.** Build one component contract page per public component and composition pages for multi-component patterns. Render the same registered scenarios in the human-facing docs and the frameless Playwright canvas.                                                                                           |
| Is Playwright the only test technology?          | **No.** Keep Vitest/TestBed for fast class, signal, forms, service, and edge-case tests. Use Playwright for browser behavior, accessibility, responsive behavior, and visual contracts. Use axe-core within Playwright and retain manual screen-reader verification.                                             |
| How should Playwright tests be structured?       | Give each public component family a Component Object Model. It exposes user-facing operations and semantic locators scoped to that component, while a separate host model opens scenarios and reads host-recorded outputs.                                                                                       |

This approach meets the intent of the existing detailed designs for
[documenting the library](detailed-designs/delivery/document-the-library/README.md),
[verifying every change](detailed-designs/delivery/verify-every-change/README.md),
[accessibility](detailed-designs/platform/operate-without-a-mouse/README.md), and
[responsive behavior](detailed-designs/platform/adapt-to-viewport/README.md) without maintaining a
second catalogue of examples.

## Why this fits Cornerstone

The current workspace already has most of the foundation:

- `design-system/` is a Vite-powered Angular 21 documentation application consuming
  `@quinntyne/cornerstone` through the public import path.
- `playwright.config.ts` already starts that application and runs Chromium, Firefox, and WebKit.
- `@axe-core/playwright` is installed and the existing docs smoke test runs an accessibility scan.
- Playwright screenshots and repository baselines are already configured under `verification/`.
- Vitest, Angular TestBed, jsdom, and V8 coverage already cover the fast unit-test layer.
- The generated API manifest currently contains 490 exported symbols, including 150 classes named
  `*Component` and 55 named `*Directive`. The manifest generator is currently syntactic, so the
  future coverage gate must inspect Angular metadata rather than rely only on name suffixes.

The gap is not another runner. The gap is a component scenario contract, isolated routes, reusable
Component Object Models, and an automated coverage check that joins those pieces to the public API.

## Test architecture

```text
public Angular API
       |
       +--> scenario registry -------------------------+
       |      component, initial inputs, projected      |
       |      content, providers, theme, viewport,      |
       |      expected outputs, tags                    |
       |                                                |
       +--> documentation component page                |
       |      overview + controls + variants + source   |
       |                                                |
       +--> /__test/components/:component/:scenario <---+
                    frameless deterministic canvas
                              |
                       Playwright Test
                              |
             host model + Component Object Model
                              |
          behavior + accessibility + responsive + visual
```

There are three deliberately separate concepts:

1. A **scenario** is an Angular example with a stable initial state. It is production code for the
   documentation application, not test code.
2. A **Component Object Model** is a Playwright adapter around the component's public browser
   contract. It knows how a user finds and operates the component.
3. A **specification** states the expected behavior. It uses the object model but owns the
   assertions and requirement traceability.

Keeping them separate prevents docs, selectors, and expectations from becoming one large brittle
abstraction.

## The host application

### Use `design-system`; do not create a second host

Playwright's experimental `mount` fixture is officially supplied for React and Vue, not Angular.
Cornerstone should therefore use regular `@playwright/test` against Angular rendered by a web
server. The host is necessary build infrastructure, but it should contain no product routing,
authentication, network calls, or domain state.

Add two render surfaces to `design-system`:

- `/components/:component` is the human-facing interactive documentation page. It includes the
  overview, interactive example, variant/state gallery, API table, accessibility notes, responsive
  notes, theming tokens, and source.
- `/__test/components/:component/:scenario` renders exactly one scenario without the docs shell.
  This is the stable automation and screenshot surface.

Both routes resolve the same scenario registry entry. The test route is not a second implementation;
it is a different frame around the same Angular example component.

### Test-canvas contract

The frameless route should provide only these host-level facilities:

- A root element identified by a stable scenario id, for example
  `data-testid="component-canvas"`. Test ids are acceptable at this host boundary.
- The real Cornerstone theme stylesheet, application providers, locale, direction, and deterministic
  fonts used by consumers.
- A small output recorder that serializes component output payloads to a host-owned event log.
  Playwright reads the log instead of reaching into Angular component instances.
- Explicit scenario status: ready, render error, and missing scenario. Playwright waits for `ready`
  rather than using sleeps.
- Stable clock, random seed, animation policy, reduced-motion setting, and network stubs where the
  component contract needs them.
- No docs navigation, controls, headings, or other focusable chrome inside the canvas.

The route must fail visibly when a scenario cannot render. A blank canvas must never count as a
successful render test.

### Scenario records

Each component gets a typed scenario set. A conceptual record is:

```ts
interface CsComponentScenario {
  readonly id: string;
  readonly component: string;
  readonly title: string;
  readonly example: Type<unknown>;
  readonly source: string;
  readonly kind: 'default' | 'variant' | 'state' | 'interaction' | 'responsive';
  readonly themes: readonly ('light' | 'dark')[];
  readonly viewports: readonly CsViewportClass[];
  readonly tags: readonly ('visual' | 'a11y' | 'keyboard' | 'forms' | 'overlay')[];
}
```

Do not attempt to serialize arbitrary Angular inputs or callbacks across a Node/browser boundary.
Each example component should own its typed view model and bind outputs to the host recorder. This is
especially important for projected content, dependency injection, forms, overlays, and rich workflow
view models.

## Component Object Model pattern

Page Object Model is a useful Playwright pattern, but these tests operate on reusable components.
Use the narrower name **Component Object Model (COM)** and scope every locator to a supplied root.

### Responsibilities

A Component Object Model should:

- expose the component root and semantic child locators;
- use role, accessible name, label, placeholder, and visible text in preference to CSS classes;
- expose meaningful user actions such as `choose`, `dismiss`, `moveNext`, or `submit`;
- handle component-owned overlays through the page when they render outside the root;
- provide small state readers where Playwright has no direct semantic matcher;
- avoid Angular internals, private CSS classes, DOM-shape selectors, and assertions about unrelated
  components.

A Component Object Model should not:

- navigate to the scenario route;
- configure inputs or providers;
- hide all assertions inside methods;
- use `waitForTimeout`;
- take screenshots implicitly;
- duplicate business rules from the component.

Navigation and output capture belong to `ComponentTestHost`. Expected outcomes belong to the spec.

### Example

```ts
// component-tests/models/checkbox.model.ts
import type { Locator } from '@playwright/test';

export class CheckboxModel {
  readonly control: Locator;

  constructor(
    readonly root: Locator,
    name: string,
  ) {
    this.control = root.getByRole('checkbox', { name });
  }

  async toggle(): Promise<void> {
    await this.control.click();
  }
}
```

```ts
// component-tests/models/component-test-host.ts
import { expect, type Locator, type Page } from '@playwright/test';

export class ComponentTestHost {
  readonly canvas: Locator;

  constructor(private readonly page: Page) {
    this.canvas = page.getByTestId('component-canvas');
  }

  async open(component: string, scenario: string): Promise<void> {
    await this.page.goto(`/__test/components/${component}/${scenario}`);
    await expect(this.canvas).toHaveAttribute('data-status', 'ready');
  }

  event(name: string): Locator {
    return this.page.getByTestId(`event-${name}`);
  }
}
```

```ts
// component-tests/specs/checkbox.spec.ts
// Traces to: L2-029, L2-051, L2-154, L2-156
import { expect, test } from '../fixtures';
import { CheckboxModel } from '../models/checkbox.model';

test('toggles through its accessible control and reports the form value', async ({ host }) => {
  await host.open('checkbox', 'unchecked');
  const checkbox = new CheckboxModel(host.canvas, 'Accept terms');

  await expect(checkbox.control).not.toBeChecked();
  await checkbox.toggle();

  await expect(checkbox.control).toBeChecked();
  await expect(host.event('valueChange')).toHaveText('true');
});
```

The exact output name will follow the component's public Angular forms contract. The important
boundary is that the model operates through the rendered accessibility surface and the host exposes
only test-fixture state.

### Model granularity

Create one model per behaviorally distinct public component, with shared primitives when useful:

- `ButtonModel`, `CheckboxModel`, and `TabsModel` model individual controls.
- `DialogModel`, `MenuModel`, and `ComboboxModel` share an `OverlayModel` for overlay roots and focus
  restoration.
- `PeopleDirectoryModel` can compose `SearchFieldModel`, `TableModel`, and `PaginatorModel` rather
  than reproducing those locators.
- CSS-only layout directives do not need empty models. Test them through a purpose-built host model
  whose name states the rendered contract, such as `ResponsiveRegionModel`.
- Services without a user-visible DOM contract remain Vitest/TestBed tests; a service such as toast
  that produces UI is tested through its outlet component model.

## What to test for every component

Every public UI component must have a registry entry, a browser contract spec, and a documented
definition of done. Not every permutation belongs in Playwright.

| Concern                                                     | Vitest/TestBed      | Playwright Chromium                        | Playwright Firefox/WebKit             | Manual                                       |
| ----------------------------------------------------------- | ------------------- | ------------------------------------------ | ------------------------------------- | -------------------------------------------- |
| Pure functions, signal derivation, service policy           | Primary             | No                                         | No                                    | No                                           |
| Input defaults, invalid inputs, output payload construction | Primary             | Representative public path                 | Contract smoke                        | No                                           |
| Native semantics and accessible name/state                  | Supporting          | Every documented state                     | Default plus browser-sensitive states | Screen-reader verification for ARIA patterns |
| Pointer and keyboard behavior                               | Limited             | Every documented interaction               | Primary interaction path              | Complex assistive-technology behavior        |
| Forms integration                                           | Detailed CVA cases  | Real focus, typing, disabled, validation   | Primary path                          | As needed                                    |
| Overlay, focus trap, focus return, stacking                 | Limited             | Every path                                 | Primary path                          | Dialog/menu screen-reader behavior           |
| Responsive structural changes                               | No                  | All five published viewport classes        | Browser-sensitive cases               | 400% zoom/reflow review                      |
| Themes and visual variants                                  | Token logic only    | Locator screenshot in light and dark       | No baseline                           | Design review                                |
| Automated accessibility                                     | No substitute       | axe scan for each registered variant/state | Default contract scenario             | Required because axe is incomplete           |
| SSR and hydration                                           | Server test harness | Hydration smoke in a real browser          | Representative smoke                  | No                                           |

The minimum browser contract for every component or directive is:

1. The default scenario renders and has its expected accessible role/name or semantic structure.
2. Its primary pointer and keyboard path works and emits the documented intent or form value.
3. Disabled, loading, empty, error, or read-only behavior is exercised when the API exposes it.
4. Every documented variant and state receives an axe scan.
5. Every documented visual variant receives a component-scoped Chromium screenshot in light and
   dark themes.
6. Every documented responsive transformation is asserted at the applicable XS, SM, MD, LG, and XL
   viewports. Rendering at a width without asserting the structural contract is insufficient.
7. The default contract scenario runs in Chromium, Firefox, and WebKit from `support-matrix.json`.
   Browser-sensitive behavior runs in all three; exhaustive visual permutations remain Chromium-only.

Use pairwise scenarios for large independent input sets. Reserve the full Cartesian product for
inputs whose interaction is itself part of the contract. This keeps the suite diagnostic without
pretending that one enormous gallery screenshot proves behavior.

## Interactive design pages

Interactive pages should be the design review and documentation surface, not free-form mock pages.
There are two useful levels:

- **Component contract pages** show a single public API, all variants and states, live controls,
  source, key bindings, responsive notes, tokens, and the results of outputs. These scenarios are the
  direct subjects of component tests.
- **Composition pages** show reusable patterns such as a validated form, shell with responsive
  navigation, filterable directory, or dialog workflow. They test integration boundaries and visual
  rhythm but do not replace the component-level contracts.

Do not build application-specific design pages merely to give Playwright something to visit. Product
pages introduce routing, authorization, data loading, and copy that make failures harder to attribute.
Liturgy and Word Up keep their own end-to-end tests for those concerns.

Controls are useful for human exploration, but automated tests should navigate directly to named,
immutable scenarios. A test must not depend on clicking a series of docs controls to establish its
initial state.

## Storybook decision

Storybook is a capable component workshop, and its stories, interaction tests, controls, and docs
would solve a similar problem. However, adopting it now would create two ways to describe a
Cornerstone example:

1. the `CsDocsExampleRegistry` and component pages already required by L2-149 through L2-153; and
2. Storybook CSF stories and generated docs.

That duplication is more significant than the package installation. It creates drift in variants,
source examples, routes, screenshots, accessibility scans, and contributor expectations. In
addition, Storybook's Angular/Vite integration is currently marked preview and requires Vite 8,
while Cornerstone currently uses Angular 21 with Vite 7.3.6 through AnalogJS.

Therefore:

- do not add Storybook during the initial component-test rollout;
- borrow its best idea—a named scenario/story as the shared unit of documentation and testing;
- reassess when `@storybook/angular-vite` is stable and Cornerstone is on Vite 8;
- if Storybook is adopted later, make CSF stories the scenario registry and render/embed those in the
  docs site. Do not keep both hand-authored scenario systems.

Storybook's Vitest addon uses Playwright as a browser provider, but that is not the same as
`@playwright/test` or Playwright's `mount` fixture. It may eventually replace part of the scenario
runner, but it does not remove the need to decide which system owns examples and documentation.

## Supporting technology

### Keep

- **Vitest + Angular TestBed:** fast unit, forms, service, input/output, and edge-case verification.
- **Playwright Test:** browser contracts, cross-browser interaction, responsive assertions, traces,
  and visual comparisons.
- **`@axe-core/playwright`:** automated checks on the isolated canvas. Scan all violations unless a
  documented temporary exception has an owner and expiry; do not silently filter to serious and
  critical forever.
- **Angular CDK test harness ideas:** use the same public, semantic philosophy, but do not couple
  Playwright tests to TestBed-only harness environments.

### Add with the implementation

- A typed component scenario registry and generated registry index.
- A frameless test-canvas route and host output recorder.
- Playwright fixtures for `ComponentTestHost`, theme, direction, viewport class, reduced motion, and
  deterministic time.
- A public-API coverage script that maps Angular components/directives to docs scenarios, Component
  Object Models or host models, behavior specs, accessibility scenarios, and visual scenarios.
- A separate `playwright.component.config.ts` or shared base config so component contracts and product
  end-to-end tests have distinct test directories, reports, and commands.

### Do not add initially

- A second Angular host application.
- Storybook, Chromatic, or another hosted visual-review service.
- A custom Angular implementation of Playwright's experimental `mount` protocol.
- Broad network mocking. Cornerstone presentation components should receive view models and emit
  intents; examples can use in-memory providers. Add MSW only if a future public component truly owns
  a browser network boundary.

## Proposed repository layout

```text
src/docs-app/app/
  component-pages/              human-facing pages
  examples/
    checkbox/
      unchecked.example.ts
      disabled.example.ts
      scenarios.ts
    ...
  scenario-registry.ts           generated from scenario modules
  test-canvas/                   frameless route and output recorder

component-tests/
  fixtures.ts
  models/
    component-test-host.ts
    checkbox.model.ts
    dialog.model.ts
    ...
  specs/
    checkbox.spec.ts
    dialog.spec.ts
    ...
  contracts/
    component-coverage.json      generated/auditable mapping

verification/
  baselines/components/
  playwright-results/components/
  playwright-report/components/

playwright.base.config.ts
playwright.component.config.ts
playwright.config.ts              documentation/product-site end-to-end tests
```

Keep scenarios near the documentation application because they are compiled Angular examples. Keep
models and expectations outside the application because consumers must not ship test abstractions.

## Visual, responsive, and accessibility stability

- Capture the canvas or component root, not the full documentation page.
- Own visual baselines in Chromium on one pinned CI operating system. Font files, browser version,
  locale, color scheme, device scale factor, time zone, time, and animation policy must be fixed.
- Use Playwright's retrying web assertions for readiness; never use timeouts to wait for rendering.
- Disable or deterministically advance animations before screenshots. Run separate behavior tests to
  prove transitions and reduced-motion behavior.
- Make the baseline path include component, scenario, theme, and viewport where relevant.
- Run axe against the isolated canvas so unrelated docs chrome does not obscure ownership.
- Assert keyboard sequence and focus movement explicitly; axe cannot verify interaction models.
- Retain the manual screen-reader log required by L2-156. Automated accessibility tools find only a
  subset of defects.
- Treat an approved screenshot update as a reviewed design change, not as routine test repair.

## CI shape

Introduce these explicit commands:

```text
npm test                       # Vitest/TestBed
npm run test:components       # all component contracts, all configured browsers
npm run test:components:update # explicit Chromium baseline update
npm run component:coverage    # public API -> scenario/spec/model/a11y/visual mapping
npm run e2e                   # documentation and site journeys
```

For stable and fast CI:

1. Build the library and documentation application once.
2. Serve the built documentation output with a preview/static server rather than recompiling it per
   Playwright shard.
3. Shard component contracts by browser and, when needed, by component family.
4. Upload HTML reports, traces on retry, and visual diffs on failure.
5. Keep Chromium visual baselines separate from Firefox/WebKit behavioral results.
6. Run the coverage gate before the browser shards so a missing scenario fails quickly.

The full default contract for every public UI component must run on every pull request. A nightly
suite can add expensive stress, locale, direction, and repeated-run checks, but it must not be the
only place a component's basic browser contract runs.

## Rollout

### 1. Prove the architecture

Implement the registry, test canvas, host fixture, and coverage-manifest format with six deliberately
different subjects:

- button directive: native primitive and projected content;
- checkbox: forms integration;
- tabs: composite keyboard interaction;
- dialog: overlay, focus trap, and focus return;
- combobox: complex input and overlay behavior;
- people directory or shell: responsive composite.

Run these in all three browsers and validate that light/dark screenshots are stable in CI before
scaling the pattern.

### 2. Cover primitives and forms

Add contract pages, scenarios, models, and specs for foundations, layout, actions, and form controls.
Establish shared form, overlay, and event-recorder fixtures here.

### 3. Cover navigation, data display, and communication

Add keyboard matrices, async/loading/error states, overlays, live-region assertions, and viewport
transforms. Add composition pages only where multiple components form a reusable public pattern.

### 4. Cover workflows and process components

Use frozen, domain-neutral view models in example components. Assert emitted intents rather than
simulating persistence, authorization, or application navigation.

### 5. Enforce completeness

Turn on the public-API coverage gate only after the existing inventory is represented, then make it
mandatory for every new or changed public UI export. Ratchet coverage by component family during the
migration so the large existing surface does not require an unreviewable one-shot baseline commit.

## Definition of done for one component

A public component is component-tested only when all applicable items are true:

- It has a human-facing contract page and at least one immutable test-canvas scenario.
- Every documented variant and state exists in the typed scenario registry.
- A Component Object Model or purposeful composed-host model exposes its public interactions.
- Specs cover its accessible semantics, primary pointer and keyboard behavior, inputs/outputs or form
  value, disabled/error/loading states, and edge cases at the correct test layer.
- The default browser contract passes in Chromium, Firefox, and WebKit.
- Applicable responsive transformations are asserted at all five published viewport classes.
- Every documented state has an axe result, and the ARIA pattern has the required manual
  screen-reader record.
- Light and dark Chromium baselines exist for every visual variant.
- Specs cite their L2 requirements, and the component coverage gate reports no missing artifact.
- The example consumes `@quinntyne/cornerstone` through its public API and performs no HTTP, authorization,
  persistence, or product-routing work.

## Risks and controls

| Risk                                                  | Control                                                                                                                                                  |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 150 component classes create a slow matrix            | One minimal cross-browser contract per component; exhaustive variants in Chromium; shard by browser/family; use the built static host.                   |
| Documentation examples and tests drift                | One typed scenario registry renders both docs and the test canvas; coverage gate rejects an unregistered public UI export.                               |
| COMs become wrappers around implementation details    | Prefer roles and accessible names, scope to the root, review models as public contracts, prohibit private CSS selectors except a documented last resort. |
| Screenshots are flaky                                 | Pin CI environment and fonts, freeze time/data, disable animation, isolate canvas, and capture component locators.                                       |
| Passing axe is mistaken for accessibility conformance | Explicit keyboard/focus assertions plus manual screen-reader and zoom/reflow verification.                                                               |
| Host behavior masks component defects                 | Keep the host thin, observable, and generic; scenario components only bind typed state and record outputs.                                               |
| Storybook is added later and duplicates examples      | Adopt it only by making stories the scenario source of truth and migrating, not copying, existing scenarios.                                             |

## References

- [Playwright component testing (experimental)](https://playwright.dev/docs/test-components) — the
  official mount workflow currently documents React and Vue integrations, not Angular.
- [Playwright Page Object Models](https://playwright.dev/docs/pom) — selector encapsulation and
  reusable higher-level operations.
- [Playwright fixtures](https://playwright.dev/docs/test-fixtures) — isolated setup and typed test
  dependencies.
- [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots) — screenshot baselines
  and environment-stability warning.
- [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing) — axe
  integration and the need to combine automation with manual assessment.
- [Storybook for Angular with Vite](https://storybook.js.org/docs/get-started/frameworks/angular-vite)
  — preview status, Angular/Vite requirements, and Vitest browser integration.
- [Storybook interaction tests](https://storybook.js.org/docs/writing-tests/interaction-testing) —
  named stories with play functions as browser scenarios.
- [Storybook Vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon) —
  converting stories into browser-based component tests.
