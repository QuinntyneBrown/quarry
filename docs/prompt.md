# Quarry: Initial Project Brief

Build Quarry, a repository that hosts multiple independently maintained UI
component frameworks and provides a visual interface for discovering them.
The UI shall be highly focused on helping users find and select a component
framework for the application they intend to build. The primary interaction is
describing that application in natural language and receiving relevant framework
recommendations through vector search.

Adobe Color is an initial reference for visual discovery only. Color palettes
shall not be featured, ranked, filtered, or selected. Every framework shall be
themeable and skinnable to support any colors the user chooses during
implementation. Framework selection is based on capabilities and suitability for
the user's project, independently of the example styling.

Each framework should follow the separation of component library, companion
applications, and design system described in `AGENTS.md`, inspired by
[Cornerstone](https://github.com/QuinntyneBrown/Cornerstone). Each framework must
remain buildable, testable, releasable, and usable independently of Quarry and
its backend.

## Focused Framework Discovery

- Lead with a prominent search field asking what the user wants to build, for
  example, "Animal Hospital". Keep surrounding navigation and secondary controls
  minimal. Offer a few example project queries to make the interaction clear.
- Every framework shall have a meaningful description and descriptive tags
  covering supported component capabilities, workflows, and suitable use cases.
- Implement vector search using semantic embeddings of framework descriptions
  and tags, and of the user's query. Rank recommendations by semantic relevance,
  rather than requiring the query to appear literally in the catalog. Updating a
  framework's searchable metadata shall refresh its indexed representation.
- For "Animal Hospital", recommend frameworks suitable for appointment booking,
  intake forms, patient and client records, and practice operations. Related
  wording such as "veterinary clinic" shall find relevant frameworks even when
  those exact words do not appear in the framework name or description.
- Each recommendation shall display the framework name, description, tags,
  supported frontend technology, and a short explanation grounded in its
  capabilities. Do not infer that a UI framework provides a complete industry
  application, clinical functionality, or domain compliance.
- Keep a secondary technology filter. Filtering shall preserve relevance order.
  An empty query shall allow browsing the catalog; a query with insufficient
  matches shall show an honest empty state with a way to revise or reset search.
- Let users inspect components and select one framework. Preserve the query and
  results when returning from details; allow replacing or clearing the selection.
- Explain briefly that all frameworks support custom themes and skins at the
  implementation step. Do not add palette galleries, swatches, color filters,
  preset-color comparisons, or a color-selection step to discovery.
- Support keyboard use and responsive desktop and mobile layouts.

### Static Interactive Mock

Keep the React + TypeScript design artifact in `docs/mocks/`. It shall demonstrate
the focused search, ranked recommendations, descriptions, tags, details, and
selection flow with a local sample catalog and no live backend dependency.
Clearly label locally simulated recommendations. Hand-authored sample vectors
or example intent mappings in this mock do not fulfill the production requirement
for semantic embeddings and vector search; do not present them as a trained model
or add invented confidence percentages.

Verify the mock with "Animal Hospital", related veterinary wording, and unrelated
examples such as an online store and an analytics dashboard. Check that the
results and explanations change appropriately, technology filtering preserves
relevance, empty searches reset cleanly, and details and selection work on desktop
and mobile. No color choice shall be required to select a framework.

## Application Architecture

Organize the repository around three areas:

- `frontend/`: The Quarry browsing and selection application, including search,
  filters, component previews, and framework detail pages.
- `backend/`: The API that serves the framework catalog, descriptions, tags,
  vector-search recommendations, and technology-filtered queries.
- `frameworks/`: A separate workspace for each UI component framework, keeping
  its library, tokens, themes, examples, documentation, and tests together.

Build the Quarry frontend with React and TypeScript using `.tsx` components.
Use `frontend/` as the npm workspace root and place the application in
`frontend/apps/quarry/`. These technology choices apply to the Quarry application;
each component framework retains its own technology choices.

Build the backend with .NET and ASP.NET Core controllers. Apply SOLID principles
and use Microsoft.Extensions for dependency injection, options, configuration,
and logging. Use Clean Architecture with four projects:

- `Quarry.Domain`: Domain models and rules.
- `Quarry.Application`: Application use cases, using MediatR pinned to `12.5.0`.
- `Quarry.Infrastructure`: Persistence and infrastructure integrations, using
  Microsoft SQL Server Express or LocalDB.
- `Quarry.Api`: ASP.NET Core controllers and application composition.

Keep dependencies directed inward toward Domain and Application. Use SignalR
when a stated requirement needs real-time behavior.

## Framework Workspaces

Give each framework its own workspace under `frameworks/<framework-name>/`.
Within that workspace, separate the publishable library from the documentation
app, manual development app, deterministic acceptance-test app, and marketing
site. Keep tokens and themes in an independently buildable `design-system/`.

Keep component unit tests beside their source, browser acceptance tests in the
framework's `e2e/` directory, and framework-specific requirements, designs,
benchmarks, and tooling within that workspace. Use the proposed layout in
`AGENTS.md`, creating directories only as their contents are needed.

Keep shared requirements in `docs/specs/`, shared architecture and design
decisions in `docs/detailed-designs/`, and shared tooling in `tools/`. Keep
generated build output, dependency directories, and test reports out of source
control.

## Delivery and Validation

Implement code through small, working increments using acceptance test-driven
development (ATDD):

1. Choose the smallest end-to-end slice of a stated requirement and define its
   acceptance criteria.
2. Write acceptance tests first and confirm they fail for the expected reason.
3. Implement only enough to pass, then refactor for clarity while keeping tests
   green.
4. Run the relevant tests and builds and verify the behavior.
5. Commit the verified slice before starting the next increment. Keep each
   increment focused and independently reversible.

Use Playwright and the Page Object Model for frontend acceptance tests. Keep
page interactions in page objects and backend mocks and test data in shared
fixtures. Mock all backend interactions, including SignalR when used, so these
tests run without a live API or database. Test observable behavior rather than
physical file or folder placement.

Design mocks and mockups are design artifacts and do not require ATDD or
incremental implementation. This exemption does not apply to test mocks or
executable application code.

Keep the design and implementation radically simple. Use the smallest clear
solution that meets the stated requirements, avoid speculative features and
unnecessary abstractions or dependencies, and work quickly without skipping
required validation.
