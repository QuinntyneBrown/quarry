## Project Overview

Quarry hosts multiple UI component frameworks and provides a visual discovery UI
inspired by [Adobe Color](https://color.adobe.com/). Users can browse framework
types, preview components, and select a framework.

## Application Architecture

- `frontend/` contains the Quarry browsing and selection UI, including search,
  filters, framework previews, and detail pages.
- `backend/` contains the supporting API for the framework catalog, metadata,
  and search/filter queries consumed by the frontend.
- `frameworks/` contains the independently maintained UI component frameworks.

## Technology and Design

- Use .NET for the backend. Apply SOLID principles and Microsoft.Extensions for
  dependency injection, options, configuration, and logging.
- Use Clean Architecture with separate `Quarry.Domain`, `Quarry.Application`,
  `Quarry.Infrastructure`, and `Quarry.Api` projects. Dependencies must point
  inward toward Domain and Application.
- Use ASP.NET Core controllers rather than Minimal API endpoints. Use SignalR
  when real-time features are required.
- Use MediatR pinned to `12.5.0`.
- Use Microsoft SQL Server Express or LocalDB, with persistence implemented in
  `Quarry.Infrastructure`.
- `frontend/` is an npm workspace containing the Quarry browsing app, built with
  React and TypeScript using `.tsx` components. This choice applies to the Quarry
  application; each component framework retains its own technology choices.
- Both `backend/` and `frontend/` must follow a file-per-type pattern: define each
  class, interface, record, struct, enum, or TypeScript type alias in its own file.
  Never define multiple classes or other types in a single file.

## Project Structure

Suggested layout for the multi-framework repository described in `docs/prompt.md`.
Each UI component framework gets its own workspace under `frameworks/`, following
the library, companion apps, and design-system separation used by
[Cornerstone](https://github.com/QuinntyneBrown/Cornerstone).
These are proposed directories; create them as their contents are needed.

```text
quarry/
|-- frontend/
|   |-- package.json             # npm workspace root
|   `-- apps/
|       `-- quarry/
|           |-- package.json
|           |-- src/             # React browsing, previews, selection, and unit tests
|           |-- playwright.config.ts
|           `-- e2e/
|               |-- tests/       # Acceptance scenarios
|               |-- pages/       # Page Object Model
|               `-- fixtures/    # Backend mocks and test data
|-- backend/
|   |-- Quarry.sln
|   |-- src/
|   |   |-- Quarry.Domain/
|   |   |-- Quarry.Application/
|   |   |-- Quarry.Infrastructure/
|   |   `-- Quarry.Api/
|   `-- tests/
|       `-- Quarry.Api.AcceptanceTests/
|-- frameworks/
|   `-- <framework-name>/
|       |-- src/
|       |   |-- <framework-name>/  # Publishable component library
|       |   |   `-- <component>/  # Component source, styles, and unit tests
|       |   |-- docs-app/         # Interactive documentation and examples
|       |   |-- dev-app/          # Manual component development harness
|       |   |-- e2e-app/          # Deterministic acceptance-test harness
|       |   `-- marketing/        # Framework-specific public site
|       |-- design-system/       # Independently buildable tokens and themes
|       |-- e2e/
|       |   |-- page-objects/
|       |   `-- specs/
|       |-- perf/                # Component performance benchmarks
|       |-- docs/
|       |   |-- specs/           # Framework requirements and acceptance criteria
|       |   `-- detailed-designs/
|       |-- tools/               # Framework-specific build and verification tools
|       `-- package.json         # Framework dependencies and scripts
|-- docs/
|   |-- prompt.md                # Original repository description
|   |-- specs/                   # Repository-wide requirements
|   `-- detailed-designs/        # Shared architecture and design decisions
|-- tools/                       # Shared generation and workspace orchestration
|-- .github/
|   `-- workflows/               # CI and release automation
`-- AGENTS.md
```

- Replace `<framework-name>` with the component framework's name; repeat that
  workspace for each framework hosted here.
- Keep each framework's components, tokens, examples, and tests together. Each
  framework should be buildable, testable, and releasable independently.
- Keep component unit tests beside their source and browser tests in the
  framework's `e2e/` directory.
- Put only tooling and documentation that apply across frameworks at the root.
- Keep generated build output, dependency directories, and test reports out of
  source control.

## Testing and Implementation

- Use Playwright and the Page Object Model for frontend acceptance tests. Mock
  all backend interactions, including SignalR when used, so these tests run
  without a live API or database. Keep page interactions in page objects and
  backend mocks and test data in shared fixtures.
- Never write tests that verify architecture through physical file or folder
  placement. Tests must verify behavior, not repository layout.
- Design mocks and mockups are design artifacts; ATDD and incremental
  implementation do not apply to their creation. This exemption does not cover
  test mocks or executable application code.

Code implementation must follow acceptance test-driven development (ATDD) and
incremental implementation:

1. Choose the smallest end-to-end slice of a stated requirement and define its
   acceptance criteria.
2. Write acceptance tests first and confirm they fail for the expected reason.
3. Implement only enough code to pass; refactor for clarity while keeping tests
   green.
4. Run relevant tests and builds, and verify the behavior before proceeding.
5. Commit the verified slice, then repeat. Keep each increment focused, working,
   and independently reversible.

## Boundaries

- Keep Quarry application code in `frontend/` and `backend/`; keep publishable
  component framework code in `frameworks/`.
- Component libraries must remain usable independently of Quarry's backend.
- Software design and implementation must be radically simple. Use the smallest
  clear solution that meets current requirements. Avoid speculative features,
  unnecessary abstractions, layers, and dependencies.
- Speed is vitally important, but fulfilling the requirements is the goal. Work
  very fast without cutting corners. Achieve speed by strictly following the
  stated requirements and core asks, completing necessary validation, and
  avoiding gold plating.
