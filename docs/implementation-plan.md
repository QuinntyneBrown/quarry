# Implement Quarry from the existing specifications and designs

## Summary

Build the complete Quarry application using `docs/specs/` as the behavioral authority, `docs/detailed-designs/` for architecture and contracts, and `docs/mocks/` for visual and interaction guidance.

Delivery targets local Windows with LocalDB, local embeddings, and JWT-protected maintenance. Component-library development is excluded. Preserve the standalone mock and clearly distinguish evaluation fixtures from released frameworks.

## Architecture and interfaces

- Use React, TypeScript, and Vite in the prescribed npm workspace. Adapt the mock’s presentation into focused components, with one declared type per file.
- Use .NET 10 LTS, ASP.NET Core controllers, MediatR **12.5.0**, and the four required Clean Architecture projects. Add the separate indexing worker host specified by the designs. Install the stable SDK; .NET 10 is supported through November 2028. [Microsoft support policy](https://dotnet.microsoft.com/en-us/platform/support/policy)
- Implement EF Core SQL Server persistence, migrations, immutable published revisions, durable indexing work, and transactional audit records. Use separate read, maintenance, and worker database access configurations.
- Implement the designed public contracts:
  - `GET /api/frameworks`: filtered, revision-aware cursor pagination.
  - `GET /api/frameworks/{id}`: published metadata, descriptors, capabilities, and optional preview manifest.
  - `POST /api/framework-searches`: query and technology in the body; ranked recommendations, grounding references, catalog revision, and incomplete-index status.
- Preserve canonical GUID identities, decimal-string revisions, bounded pages, and safe error codes with correlation IDs.
- Provide JWT-protected create/update/publish/withdraw/delete commands under `/api/maintenance/frameworks`, plus `/api/maintenance/search-index/rebuild`. Require a maintenance permission and expected revisions for changes. Supply development-token instructions; production configuration validates issuer, audience, signature, and lifetime.

## Implementation sequence

Each numbered area is divided into the smallest independently working slices. For every executable slice, write requirement-linked acceptance tests, observe the expected failure, implement, run relevant checks, and commit before continuing.

1. **Foundation and catalog browsing**
   - Preserve the existing uncommitted inputs in an initial baseline commit.
   - Establish build/test tooling, SQL migrations, public catalog reads, and the responsive discovery page.
   - Implement alphabetical ordering, technology filters, 24-entry pagination, revision-conflict recovery, and separate loading, empty, and failure states.
   - Provide an explicit development/evaluation seed command. Production starts empty and never silently imports illustrative entries.

2. **Details and selection**
   - Implement Overview/Components dialogs, keyboard navigation, focus and scroll restoration, revision reconciliation, and retryable errors.
   - Implement one in-memory selection, review, replacement, clearing, and unavailable-selection handling.
   - Preserve draft query, submitted query, filters, loaded pages, and selection across detail navigation; reload resets the page session.

3. **Metadata maintenance and durable indexing**
   - Implement validation, authorization, publication evidence, optimistic concurrency, audit, and atomic metadata/index-work transactions.
   - Implement leased work, restart recovery, bounded retries, stale-work rejection, model compatibility checks, and full rebuild.
   - Start with two worker operations concurrently, 30-second leases, and retry delays of 1, 2, 4, 8, 16, then 30 seconds. Verify these settings against freshness and rebuild requirements.

4. **Real semantic search**
   - Use local Ollama’s embedding API with `embeddinggemma:300m`; record the resolved model digest and embedding dimensions. [Ollama embedding API](https://docs.ollama.com/api/embed)
   - Embed descriptions/tags and submitted queries using fixed, versioned input construction. Persist vectors in SQL and perform bounded cosine ranking in-process.
   - Apply technology eligibility before the three-result limit, deterministic ID tie-breaking, and same-revision capability-grounded explanations.
   - Calibrate the threshold using real embeddings and the prescribed synthetic evaluation catalog. Freeze the measured configuration; failed relevance judgments block acceptance rather than trigger hard-coded query mappings.
   - Implement explicit submission, examples, clear/reset behavior, cancellation, stale-response rejection, and distinct incomplete-index, quota, and service-error states.

5. **Isolated previews**
   - Implement revision-bound preview manifests and the designed sandbox/message protocol, including readiness timeout, retry, keyboard exit, and Escape dismissal.
   - Serve preview assets without Quarry credentials and with restrictive network/content policies.
   - Supply labeled illustrative test bundles for the required input, switch, save, and reset interactions. Released-framework preview verification remains dependent on actual framework artifacts.

6. **Operational completion**
   - Enforce input/body limits, independent read/search quotas, 16 concurrent searches, five-second embedding and eight-second request deadlines.
   - Implement coarse public health, protected operator diagnostics, index-freshness metrics, and query-safe logging.
   - Provide Windows setup/startup, JWT development setup, model acquisition, migrations, seed, rebuild, and verification commands.
   - Add Windows CI for builds, isolated frontend acceptance tests, and SQL-backed API tests; provide explicit real-model evaluation and performance jobs.

## Verification and completion criteria

- Trace acceptance tests to every in-scope L2 criterion; retain failing/passing evidence and focused commits.
- Run Playwright with Page Objects and shared fixtures, mocking all backend traffic. Cover all specified viewport bands and boundaries, keyboard flows, accessibility checks, request races, pagination conflicts, and recovery.
- Run real HTTP/LocalDB tests for persistence, publication, rollback, authorization, quotas, indexing recovery, revisions, cancellation, and safe errors.
- Run real-model evaluation for all six specified queries, recording model digest, catalog revision, threshold, results, and order.
- Verify preview isolation, forged/stale messages, blocked network/navigation, timeout recovery, and keyboard boundaries.
- Execute the specified 1,000-framework performance workload, browser measurements, overload recovery, 60-second freshness, and 30-minute rebuild checks. Report measured results and unmet gates explicitly.
- Preserve standalone mock verification. Record L2-020, L2-022, and L2-023 as excluded framework-delivery obligations, not completed application work.

## Confirmed defaults

- Quarry application only; no new publishable component frameworks.
- Local embeddings; no hosted processing or paid API dependency.
- JWT bearer maintenance authentication; no login or administration UI.
- Local Windows delivery; no remote deployment.
- No accounts, persistent query history, cross-device selection, or SignalR.
