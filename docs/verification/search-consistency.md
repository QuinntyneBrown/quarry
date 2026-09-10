# Search revision consistency

Verified on 2026-09-10 against SQL Server Express using isolated acceptance databases.

Four HTTP acceptance tests initially demonstrated that search returned a framework revision as the catalog revision, paired old vectors with republished metadata, omitted the changed catalog revision after withdrawal, and accepted continual changes without retry.

Search now reads catalog revision, technology eligibility, compatible vectors, public summaries, and supporting capabilities in one serializable SQL transaction. Ranking and explanations use that snapshot rather than fetching later detail revisions. The handler rechecks the catalog revision before returning. A changed revision causes another snapshot and ranking pass using the existing query embedding and original cancellation token. After three changed snapshots, the API returns 503 with safe code `catalog_changing` and a correlation ID.

`SearchConsistencyTests` verifies result and empty-filter revision reporting, republication while an old vector exists, withdrawal between retrieval and response, and bounded retries during continuous changes. The test wrapper changes a real isolated SQL database immediately after retrieval to reproduce these races deterministically.

All four tests pass. The full backend acceptance suite passes 82 tests with no SQL skips; the backend solution builds without warnings.

Run from the repository root:

```powershell
$env:QUARRY_TEST_SQL = 'Server=.\SQLEXPRESS;Trusted_Connection=True;TrustServerCertificate=True;'
dotnet test backend/tests/Quarry.Api.AcceptanceTests/Quarry.Api.AcceptanceTests.csproj --no-restore
dotnet build backend/Quarry.sln --no-restore
```

These tests use a controlled query embedding to isolate consistency behavior. Real-model relevance calibration, model-digest compatibility, and workload performance remain separate implementation-plan gates.
