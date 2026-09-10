# Quarry production application design documents

## Summary

Create a browsable design tree under `docs/detailed-designs/`, using the L1/L2 specifications as behavioral authority and the mock as the interaction and visual reference.

Cover the production frontend and backend. Exclude standalone mock maintenance and framework library delivery designs: `L2-020`, `L2-022`, `L2-023`, `L2-038`, and `L2-039`. Apply `L2-040` through `L2-042` to production delivery.

## Design organization

| Subsystem | Feature folders | Primary L2 coverage |
|---|---|---|
| discovery | `browse-frameworks`, `submit-project-search`, `filter-and-reset-discovery` | `L2-001`–`L2-002`, `L2-009`–`L2-013`, `L2-021`, `L2-035`–`L2-036` |
| catalog | `maintain-framework-metadata`, `serve-published-frameworks` | `L2-003`–`L2-004`, `L2-028`, `L2-034` |
| recommendations | `rank-frameworks`, `refresh-search-index` | `L2-005`–`L2-008`, `L2-014` |
| evaluation | `inspect-framework`, `interact-with-preview`, `select-framework` | `L2-015`–`L2-019` |
| operations | `protect-public-requests`, `monitor-service-health`, `verify-service-performance` | `L2-029`–`L2-034`, `L2-037` |

Apply accessibility requirements `L2-024`–`L2-027` to each affected UI feature. Include production acceptance and architecture review requirements `L2-040`–`L2-042` where applicable. Add a root navigation and coverage index identifying exclusions and shared requirements.

Each feature README uses the four sections `Overview`, `Description`, `Requirements`, and `Diagrams`. Requirements tables retain exact L2 wording, identifiers, and L1 parents.

## Recommended technical design

- Retain React/TypeScript, the four prescribed .NET projects, controllers, MediatR `12.5.0`, SQL persistence in Infrastructure, and one declared type per file.
- Model discovery state in memory, separating draft and submitted queries. Use request cancellation plus request identities to reject stale responses. Preserve modal navigation state and restore keyboard focus.
- Document catalog and detail reads through `GET /api/frameworks` and `GET /api/frameworks/{id}`; semantic search through `POST /api/framework-searches`. Define revision-aware pages, grounded capability references, incomplete-index indicators, and safe error responses.
- Store metadata, compatible vectors, and durable indexing work in SQL. Recommend bounded application-side cosine retrieval for the specified 1,000-entry baseline, with technology filtering before ranking limits and revision checks before returning results.
- Use operator-authorized HTTP maintenance commands through `FrameworkMaintenanceController` and a background indexing worker with transactional work recording, retry, and revision-conditional completion. This chooses the HTTP alternative allowed by L2-028; no administrative UI or separate offline maintenance transport is introduced.
- Integrate framework-specific static preview bundles through sandboxed iframes. Document initialization, failure, retry, and keyboard behavior without granting parent-page or maintenance access.
- Describe embedding integration behind an Application interface. Mark the provider/model, calibrated threshold, retention configuration, and measured performance as `<TO SUPPLY>` pending real evaluation.
- Carry the specified quotas, deadlines, privacy rules, health distinctions, and performance budgets into the relevant designs. Introduce no SignalR feature.

## Diagrams and validation

- Produce C4 context, container, and component diagrams, a typed class diagram, and sequence diagrams covering each feature’s behaviors and significant alternatives.
- Use offline C4 macros, the prescribed sequence styling, and requirement IDs at enforcing steps. Show only architectural participants the feature touches.
- Render every PlantUML source to a sibling PNG using the skill renderer. Check syntax, image links, requirement coverage, mock/spec differences, and house style.
- Describe future behavioral verification: isolated Playwright/Page Object scenarios, SQL-backed API checks, real-model retrieval evaluation, preview isolation, accessibility, failure recovery, and load tests.
- Do not implement application code or tests during this documentation task.
