# Quarry production design

Quarry is a focused UI-component-framework discovery application. Its production design uses the requirements in [`../specs/L1.md`](../specs/L1.md) and [`../specs/L2.md`](../specs/L2.md) as the behavioral authority. The static mock remains a visual reference only.

The [alignment review](../reviews/design-alignment.md) records discrepancies corrected across the specifications, designs, and mock, with requirement coverage and verification evidence.

| Subsystem | Feature designs |
|---|---|
| Discovery | [Browse frameworks](discovery/browse-frameworks/README.md), [submit project search](discovery/submit-project-search/README.md), [filter and reset discovery](discovery/filter-and-reset-discovery/README.md) |
| Catalog | [Maintain framework metadata](catalog/maintain-framework-metadata/README.md), [serve published frameworks](catalog/serve-published-frameworks/README.md) |
| Recommendations | [Rank frameworks](recommendations/rank-frameworks/README.md), [refresh search index](recommendations/refresh-search-index/README.md) |
| Evaluation | [Inspect framework](evaluation/inspect-framework/README.md), [interact with preview](evaluation/interact-with-preview/README.md), [select framework](evaluation/select-framework/README.md) |
| Operations | [Protect public requests](operations/protect-public-requests/README.md), [monitor service health](operations/monitor-service-health/README.md), [verify service performance](operations/verify-service-performance/README.md) |

The production design excludes framework-library delivery and static-mock maintenance, as scoped in [PLAN.md](PLAN.md). `L2-020`, `L2-022`, and `L2-023` remain requirements for future framework delivery; no framework implementation currently proves them. The [mock guide](../mocks/README.md) covers the design artifact for `L2-038` and `L2-039`. `L2-024` through `L2-027` apply to every browser-facing feature. `L2-040` through `L2-042` govern delivery verification across the design tree.

The four backend projects are code layers, not four separately deployed services. `Quarry.Api` hosts controllers and composes Application handlers with Infrastructure implementations. Domain and Application declare the rules and repository/provider interfaces; neither references Infrastructure. Infrastructure owns EF Core persistence in SQL Server Express or LocalDB and the embedding adapter. A separate indexing worker host uses the same Application contracts and Infrastructure implementations with restricted write credentials. Microsoft.Extensions supplies dependency injection, options, configuration, and logging; MediatR is pinned to `12.5.0`. Each declared type has its own file. Selection and query state remain in React memory. No baseline feature uses SignalR.

Catalog and framework revisions are distinct monotonically increasing `long` values in .NET, serialized as decimal strings in JSON to preserve precision in TypeScript. Framework IDs are stable GUIDs serialized in canonical lowercase form; ordinal ID ordering uses that form. `FrameworkSummary` includes its framework revision; `BrowsePageResponse` includes the catalog revision. Public response contracts are defined in [serve published frameworks](catalog/serve-published-frameworks/README.md) and [rank frameworks](recommendations/rank-frameworks/README.md).

Every UI feature inherits the full viewport and accessibility criteria in L2-024 through L2-027, including breakpoint boundaries, contrast, 24 CSS px targets, zoom, reduced motion, modal focus, and live status. Production verification uses the layers in L2-041. Mock checks demonstrate local journeys and cannot establish production persistence, retrieval, isolation, or performance.

`<TO SUPPLY>` identifies evidence that requires an implementation-time provider decision, calibration, or measurement. It is not a completed claim.

Embedding-provider boxes represent a configured model-service boundary. Hosting may be local or external; the diagrams do not establish third-party processing or retention. Only an externally processed query requires the corresponding pre-submission disclosure. Provider placement, model compatibility, and retention evidence are resolved together before production use.
