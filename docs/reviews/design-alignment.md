# Specs, designs, and mock alignment review

Review date: 2026-09-10.

The review compares the [brief](../prompt.md), [repository instructions](../../AGENTS.md), [L1](../specs/L1.md), all 42 [L2 requirements](../specs/L2.md), all 13 [feature designs](../detailed-designs/README.md), their 65 diagram sources/images, and the [interactive mock](../mocks/README.md). Requirements and the brief govern production behavior. The mock remains an illustrative, synchronous design artifact.

## Corrections

| Discrepancy | Resolution |
| --- | --- |
| L1 called the three-result limit illustrative although L2-007 made it binding. | L1 now identifies the explicit L2 baseline decision. |
| Input-validation criteria referred to page numbers while designs used cursors. | L2-029 and catalog design now agree on cursor pagination, page sizes 1–24, invalid cursors, unsupported page-number parameters, and revision conflicts. |
| Ranking prose broke score ties by name, contrary to L2-007. | Production design and mock use ordinal stable-ID ties. Production threshold equality, pre-limit technology filtering, compatibility, and incomplete-index handling are explicit. |
| Catalog/detail/search diagrams omitted required data or used inconsistent revision representations. | Contracts include totals, continuation state, metadata revisions, descriptors, capability evidence, grounding IDs, and incomplete-result state. JSON revisions use decimal strings; .NET revisions use `long`. |
| Maintenance alternated between a controller and an undecided command host. | The design consistently chooses operator-authorized HTTP commands, with atomic metadata/index-work publication and audit. |
| C4 views presented Application as a deployed service, placed the database inside component boundaries, and placed a separate worker inside the API. | Deployment views distinguish code layers, API/worker hosts, and SQL persistence; interfaces keep dependencies inward. |
| Existing class PNGs contained PlantUML syntax-error screens; the indexing component diagram reused its boundary alias. | Class declarations and skins use valid multiline syntax; aliases are unique. Every source is syntax-checked and rendered with failure-sensitive PlantUML commands. |
| Detail and selection designs omitted revision reconciliation, unavailable selections, and focus fallbacks. | Descriptions and sequences now cover current-request checks, updated metadata, 404 versus service failure, stale explanations, clear/replacement, scroll, and focus restoration. |
| The preview sequence placed a browser application in the backend; sandbox origin and keyboard contracts were underspecified. | The preview runs in a browser sandbox. The design defines opaque-origin message validation, per-load identity, bounded readiness, network restrictions, local feedback, and keyboard exit/dismissal. |
| Retry/index recovery designs omitted lease recovery and several failure paths. | Work leases, retries, supersession, model compatibility, freshness/rebuild targets, quota delays, cancellation, and distinct recovery states are described. |
| Performance sequence timed a client request as though it were server receipt-to-completion. | Server timing and client round-trip measurements are separate; the design records all specified workloads and budgets as future evidence. |
| Mock breakpoints, browse ordering, labels, and keyboard behavior differed from the interaction contract. | Breakpoints now match XS/SM, MD, and LG/XL; browsing is alphabetical; simulation and generic previews are clearly labeled; skip and clear-selection focus work. Clear search remains available for an empty draft with an active query; punctuation-only queries return no invented matches. |
| Mock text/control contrast and target sizes were insufficient, including the selected-button hover state. | Muted text, interactive boundaries, selected styles, focus indicators, and minimum 24 CSS px targets were corrected. |
| Mock checks used different viewport sizes and blocked only one external font host. | The documented test projects use 1440 × 900 and 375 × 812 and block all nonlocal requests. |
| The design index implied excluded framework requirements had an implementation. | The index explicitly records future framework evidence and the distinct scope of mock verification. |

## Requirement-by-requirement disposition

Each row records alignment evidence, not a claim that the future production application is implemented. Feature descriptions and sequences were checked against the acceptance criteria, beyond merely matching requirement IDs.

| L2 | Reviewed authority and disposition |
| --- | --- |
| 001 | Submit-search and browse designs separate draft/submitted queries and whitespace browsing; mock journeys verified. |
| 002 | Exact examples, search-only shortcut focus, modal suppression, and wrapping are represented; mock shortcut/examples verified. |
| 003 | Maintenance and public-read contracts include validation, stable identities, derived counts, revisions, and publication evidence. Mock counts remain explicitly illustrative. |
| 004 | Published detail, 404, bounded page fields, and safe 503 are defined in the catalog design. |
| 005 | Ranking/indexing use real compatible embeddings of description/tags; simulation is excluded as production evidence. |
| 006 | Ranking design carries every frozen-catalog semantic judgment and report field; real-model evaluation remains a release gate. |
| 007 | Threshold equality, zero-to-three results, unique ranks, and ordinal ID ties agree. |
| 008 | Index freshness, revision-conditional writes, publication exclusion, retries, and incomplete responses agree. |
| 009 | Browse ordering, total, continuation, and revision-conflict restart agree; mock alphabetical ordering verified. |
| 010 | Technology applies before the limit and preserves relative relevance, submitted query, and selection. Mock filtering verified. |
| 011 | Clear versus full reset semantics, focus, selection preservation, and stale-request rejection agree. Mock blank-draft clearing verified. |
| 012 | Complete empty, empty catalog, incomplete index, and service failure remain distinct; mock unknown/incompatible cases verified. |
| 013 | Cards carry the required metadata, count, rank, explanation, detail action, and selected text; mock display/layout verified. |
| 014 | Same-revision capability references ground explanations; unsupported references fall back to factual metadata. Mock explanations remain illustrative. |
| 015 | Detail tabs, metadata, selection availability, retryable failures, and newer-revision explanation removal agree. |
| 016 | Preview behavior, build evidence, local-only effects, initialization failure/retry, and illustrative-control labeling agree. Mock input, switch, save, blank-name, and reset verified. |
| 017 | Close/Escape/backdrop, discovery/scroll restoration, opener fallback, and fresh preview state are documented; mock focus/reset verified. |
| 018 | One in-memory selected ID, name/technology summary, review, and reload reset agree. Mock selection/review verified. |
| 019 | Replace/idempotent selection, clear focus, and unavailable-ID reconciliation are specified; mock replacement/clear and both focus targets verified. |
| 020 | Framework theme/skin consumer evidence remains a future framework-delivery obligation, outside this production-application design tree. |
| 021 | All artifacts explain implementation-time themes and exclude discovery palette/color-selection controls. |
| 022 | Independent package build, test, release, and consumer evidence remain future framework-delivery obligations; no existing implementation is claimed. |
| 023 | Companion application and framework evidence remain scoped to delivered framework content, as the brief and repository instructions require. |
| 024 | All 11 specified viewport/boundary widths and their specified heights were checked on the static build for card columns, bounds, preview, and selection. |
| 025 | Modal navigation and fallback focus are explicit; mock skip link, keyboard modal boundary, shortcut suppression, tabs, Escape, and clear focus verified. |
| 026 | Labels, dialog/tab/switch semantics, live regions, and field-error associations are represented; mock roles and local feedback verified. |
| 027 | Designs inherit the full contrast/target/zoom/motion criteria. Mock visible text contrast and target sizes were checked across browse, search, Overview, Components, and selected states; reduced motion verified. Formal certification and production zoom evidence are not claimed. |
| 028 | Public reads/local selection remain anonymous; chosen HTTP maintenance requires authentication/authorization and conditional anti-forgery checks. |
| 029 | Trimmed UTF-16 limit, body limit, cursor/page-size errors, inert text, and untrusted query handling agree. |
| 030 | HTTPS, query privacy, provider retention/disclosure, secrets, and preview isolation are explicit; browser-origin rules have primary documentation links in the preview design. |
| 031 | Separate 30-search/120-read windows, trusted identities, rounded Retry-After, and explicit delayed retry agree. |
| 032 | API/browser workload, environment, p95, success-rate, and real-provider requirements are explicit future measurement gates. |
| 033 | Full-search slot lifetime, 16-slot admission, five/eight-second deadlines, cancellation release, and overload memory evidence agree. |
| 034 | SQL durability, transactional publication, expired-lease recovery, and bounded rebuild are specified. |
| 035 | Discovery and detail request identities reject obsolete successes, failures, pages, and conflicts before applying state. |
| 036 | Loading, complete empty, indexing, service error, explicit retry, and browse fallback remain separate. The mock's lack of backend fault states is declared. |
| 037 | Liveness, catalog readiness, search readiness, and indexing health are separate; public diagnostics are coarse and operator detail is protected. |
| 038 | Mock build and browser journeys run with all external traffic blocked; sample/simulation labels are visible before search. |
| 039 | Four representative query families, related veterinary wording, unknown/whitespace queries, filtering, preview, selection, and focus were verified. Sample catalog metadata/identities are preserved. |
| 040 | Production ATDD/commit requirements remain binding. This task changes documentation and the exempt design artifact; it does not implement production slices. |
| 041 | Production Playwright/Page Object fixtures, real SQL integration, real-model evaluation, and built-package checks remain distinct evidence layers. Existing mock checks carry design-verification trace headers. |
| 042 | Shared design records the four projects, inward dependencies, controllers, MediatR 12.5.0, Microsoft.Extensions, SQL persistence, file-per-type, workspace boundaries, and no speculative SignalR feature. |

## Verification

- `npm run build` in `docs/mocks`: TypeScript check and Vite static build pass.
- `npm test` in `docs/mocks`: 14 browser scenarios pass at the specified desktop/mobile sizes with external traffic blocked.
- Additional static-preview browser checks: 320 × 740, 375 × 812, 575 × 800, 576 × 800, 767 × 800, 768 × 1024, 991 × 800, 992 × 800, 1199 × 800, 1200 × 900, and 1440 × 900. Checks cover columns, horizontal bounds, preview content, selection, and focus; all pass.
- Additional browser checks cover draft/query separation, both clear-selection focus destinations, punctuation-only/unknown queries, skip-link focus, modal keyboard containment, shortcut suppression, preview reset/blank feedback, reduced motion, visible text contrast, and target sizes. All pass. These are design-review observations, not production acceptance tests.
- All 42 L2 definitions have valid L1 parents and Given/When/Then criteria. All 126 design requirement-table rows match exact specification text and parents. All local documentation links resolve.
- All 65 PlantUML sources pass syntax validation and render successfully. Rendered views were visually inspected, including full-size catalog contracts and preview sequences. PNG existence alone is not used as validity evidence.

Diagram verification commands, from the repository root:

```powershell
java -jar C:/tools/plantuml.jar -checkonly -charset UTF-8 "docs/detailed-designs/**/diagrams/*.puml"
java -jar C:/tools/plantuml.jar -failfast2 -tpng -charset UTF-8 "docs/detailed-designs/**/diagrams/*.puml"
```

## Deliberate differences and future evidence

The mock uses hand-authored vectors, illustrative counts, and shared controls. Production requires real embeddings, descriptor-derived counts, framework-specific isolated previews, durable metadata, pagination, and backend failure states. These are documented scope differences, not interchangeable implementations.

Model/provider selection, calibrated threshold, retention evidence, evaluated retry/backoff configuration, production performance results, and independently delivered framework packages remain future implementation/release evidence. The alignment review does not replace those gates or invent results for them.
