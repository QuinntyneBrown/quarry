# Catalog lifecycle and pagination verification

Verified locally on 2026-09-10 using SQL Server Express at `.\SQLEXPRESS`.

## Withdrawal and deletion

`RetireFrameworkTests` covers HTTP authorization, invalid and stale revisions, concurrent withdrawal/deletion, public browse/details/search exclusion with retained old vectors, rejection of late indexing completion, republishing a withdrawn draft, permanent identity reservation on deletion, and audit-failure rollback. The seven tests initially failed because the routes were absent; all passed after implementation. The complete backend suite then passed 75 tests with no SQL skips.

The deletion migration adds a default-false lifecycle flag to drafts. Published snapshots remain immutable, and deletion preserves historical records. See [maintenance commands](../maintenance.md) for request bodies and response semantics.

## Revision-aware pagination

`CatalogPaginationTests` initially showed incorrect locale ordering, accepted stale revisions, and accepted filter-incompatible cursors. It now verifies 25 entries across two bounded pages, case-insensitive ordinal names, canonical GUID tie-breaking, unchanged totals, stale cursor and expected-revision rejection, and input validation.

The cursor includes the last name/ID key, technology, and catalog revision. Clients treat it as opaque. Subsequent requests can send `expectedRevision` alongside the cursor. A stale revision returns 409 with `catalog_revision_changed`; a malformed or filter-incompatible cursor returns 400. A fresh request omits both cursor and expected revision.

The SQL reader holds a serializable transaction across revision, sort-key, and page reads. It orders the projected name/ID keys using the .NET ordinal comparer, then loads metadata for only the selected page. This avoids database locale ordering. Catalog-size performance remains subject to the implementation plan's benchmark gate.

`pagination.spec.ts` uses shared API fixtures and page objects to verify automatic refresh after 409, rejection of a mismatched successful page, and retry after refresh failure. Each scenario retains the unsubmitted query, technology, and selected framework and replaces the list only after the current first-page request succeeds. These three tests failed before the browser recovery implementation and passed afterward.

## Rerun

```powershell
$env:QUARRY_TEST_SQL = 'Server=.\SQLEXPRESS;Trusted_Connection=True;TrustServerCertificate=True;'
dotnet test backend/tests/Quarry.Api.AcceptanceTests/Quarry.Api.AcceptanceTests.csproj --no-restore
dotnet build backend/Quarry.sln --no-restore
npm --prefix frontend/apps/quarry run test:e2e
npm --prefix frontend/apps/quarry run build
```

These checks establish lifecycle and pagination behavior. They do not establish real-model relevance, preview isolation, performance gates, or completion of the full implementation plan.
