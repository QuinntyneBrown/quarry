# Local Windows setup

Quarry uses the SDK pinned in [`global.json`](../global.json), SQL Server Express, and a local Ollama embedding model. The API, worker, and migration factory default to `Server=.\SQLEXPRESS;Database=Quarry;Trusted_Connection=True;TrustServerCertificate=True;` using Windows authentication.

```powershell
dotnet --version
Get-Service 'MSSQL$SQLEXPRESS'
dotnet restore backend/Quarry.sln
dotnet ef database update --project backend/src/Quarry.Infrastructure --startup-project backend/src/Quarry.Api
```

To use a different SQL Server Express or LocalDB instance, set `ConnectionStrings__Quarry` in each terminal used for migrations, the API, and the worker. For example:

```powershell
$env:ConnectionStrings__Quarry = 'Server=(localdb)\MSSQLLocalDB;Database=Quarry;Trusted_Connection=True;TrustServerCertificate=True;'
```

On this Windows ARM64 machine, Express `17.0.1000.7` was verified on 2026-09-10. LocalDB instance-name connections failed to load `SQLUserInstance.dll` with error 193; the running Express service provides a working database connection. The migration chain has been applied to `Quarry`. No illustrative entries are imported by migration.

Install and verify the required local embedding model:

```powershell
ollama pull embeddinggemma:300m
ollama list
Invoke-RestMethod -Uri 'http://localhost:11434/api/embed' -Method Post -ContentType 'application/json' -Body '{"model":"embeddinggemma:300m","input":["quarry-embedding-v1\nQuery: Accessible forms"]}'
```

The pinned model is `embeddinggemma:300m`, digest `85462619ee721b466c5927d109d4cb765861907d5417b9109caebc4e614679f1`, with 768 output dimensions. Both API and worker configuration include `Embeddings:ModelDigest` and `Embeddings:Dimensions`. Inspect the installed digest with:

```powershell
(Invoke-RestMethod -Uri 'http://localhost:11434/api/tags').models | Select-Object name, digest
```

Quarry verifies that digest before and after each embedding call, validates the returned model and vector dimensions, and rejects zero or nonfinite vectors. The combined operation has a five-second deadline and disables silent input truncation. A mismatched installation produces a safe `embedding_model_incompatible` condition; Quarry does not silently accept a changed model under the same tag.

Run the indexing worker after migrations so published framework descriptions and tags receive compatible vectors:

```powershell
dotnet run --project backend/src/Quarry.Indexing.Worker
```

Run the API and frontend in separate terminals:

```powershell
dotnet run --project backend/src/Quarry.Api
Set-Location frontend
npm ci
npm run dev --workspace=@quarry/app
```

Health endpoints are `/health/live` (process), `/health/catalog` or `/health/ready` (catalog), `/health/search` (embeddings plus current index), and `/health/indexing` (stored index only). Anonymous responses expose only coarse status. Search/indexing may return 503 while catalog browsing remains healthy. After obtaining a maintenance token, inspect protected diagnostics with:

```powershell
Invoke-RestMethod -Uri 'https://localhost:7015/api/maintenance/diagnostics' -Headers @{ Authorization = "Bearer $maintenanceToken" }
```

The report includes pending/current revision counts, retry failures, oldest pending age, and a freshness flag above 60 seconds. See [operational health](verification/operational-health.md) for issue codes and their recovery actions.

For component previews, start the isolated static host in another terminal from `frontend`:

```powershell
npm run dev --workspace=@quarry/previews
```

Open Quarry at `http://127.0.0.1:5173`; preview assets use `http://localhost:4180`. Distinct hostnames keep Quarry host cookies off asset requests. The asset host has no credentials or API access. Its default `QUARRY_APP_ORIGINS` allows the local app and Playwright origin (`http://127.0.0.1:4173`). If changing deployment origins, configure that space-separated exact-origin list and rebuild the app with `VITE_PREVIEW_ORIGIN`; use a distinct credential-free hostname. The shipped bundle is explicitly illustrative and only appears for a matching published preview manifest.

Authorized draft create/update metadata can include an optional definition:

```json
"preview": {
  "previewUri": "http://localhost:4180/bundles/illustrative-v1/index.html",
  "componentIds": ["profile-controls"],
  "buildId": "illustrative-v1",
  "protocolVersion": 1,
  "isIllustrative": true
}
```

Each component ID must exist in that draft's descriptors. Publication still requires evidence for every component and capability. The API supplies the published ID/revision in `previewManifest`; operators do not supply those fields. Use `preview: null` to remove a preview in the next published revision. Build IDs contain 1–64 lowercase letters, digits, or hyphens; URLs end in `/bundles/{buildId}/index.html` and contain no credentials, query, or fragment. This illustrative bundle cannot establish released-component evidence.

Maintenance routes require a signed HS256 bearer token with a nonempty operator `sub`, `permission: maintenance`, and a future expiry. The API validates issuer `Quarry`, audience `Quarry.Maintenance`, signature, and lifetime with no clock-skew allowance. No signing key is shipped: without `Jwt__SigningKey`, maintenance rejects all tokens while public discovery remains available. Configure a private key (at least 32 UTF-8 bytes) in the API terminal and the operator terminal. Keep their key, issuer, and audience values identical; do not commit them.

```powershell
$env:Jwt__Issuer = 'Quarry'
$env:Jwt__Audience = 'Quarry.Maintenance'
$env:Jwt__SigningKey = '<a private high-entropy signing key>'
```

For local development, a key can be generated with `[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))`. Store it privately and set the same value in each terminal rather than generating a new key per terminal. Restart the API after changing its configuration.

Start the API with `dotnet run --project backend/src/Quarry.Api --launch-profile https`. In the operator terminal, the provided script issues a 15-minute token (configurable from 1 to 60 minutes). Its `Subject` identifies the operator. Invoke the rebuild using the HTTPS port from the checked-in launch profile:

```powershell
$maintenanceToken = ./tools/New-QuarryMaintenanceToken.ps1 -Subject "$env:USERDOMAIN\$env:USERNAME"
Invoke-RestMethod -Method Post -Uri 'https://localhost:7015/api/maintenance/search-index/rebuild' -Headers @{ Authorization = "Bearer $maintenanceToken" }
```

Rebuild invalidates stored framework vectors and schedules durable `IndexWorkItems` for current published revisions. Scheduling, invalidation, and the audit record commit in one SQL transaction. Repeated requests do not duplicate jobs for the same revision/model. The audit contains the authenticated operator, operation, accepted outcome, request correlation ID, timestamp, and invalidated-vector count. Audit-write failure rolls back all changes and returns a safe 503.

The worker claims two jobs concurrently with 30-second leases, discovers missing compatible vectors every five seconds, and polls idle work every second. Failed embedding attempts persist retry delays of 1, 2, 4, 8, 16, then 30 seconds. Expired leases can be reclaimed after restart; the former owner cannot complete reclaimed work. Completion checks the current publication and source revision inside the vector-write transaction. Completed compatible jobs are not re-embedded by subsequent passes. See [durable indexing verification](verification/durable-indexing.md) for current evidence and remaining release gates.

Stored vectors and durable jobs identify compatibility as `model@digest/dimensions/input-version`, using the existing `Model` columns. Older name-only vectors are excluded and replacement work is discovered automatically. Scheduling a different identity supersedes old pending work and clears old leases so late completions cannot overwrite replacement vectors. No schema migration is needed for this change.

When intentionally changing the model, stop all API and worker instances, calibrate the replacement model, then set the same `Embeddings__Model`, `Embeddings__ModelDigest`, and `Embeddings__Dimensions` in their environments before restarting. Do not run worker instances configured for different identities against one catalog. The input format version is code-owned (`FrameworkEmbeddingInput.Version`); changing it also changes compatibility. Search reports incomplete indexing until replacement vectors are ready.

Run the opt-in real SQL/Ollama smoke test with `QUARRY_TEST_SQL` configured and `QUARRY_TEST_OLLAMA=1`. See [compatibility verification](verification/embedding-compatibility.md). The same operator credentials can [maintain framework metadata](maintenance.md). Draft creation does not make an entry publicly visible.

Verify the application code:

```powershell
$env:QUARRY_TEST_SQL = 'Server=.\SQLEXPRESS;Trusted_Connection=True;TrustServerCertificate=True;'
dotnet test backend/tests/Quarry.Api.AcceptanceTests/Quarry.Api.AcceptanceTests.csproj
dotnet build backend/Quarry.sln --no-restore
Set-Location frontend
npm run typecheck
npm run test:e2e --workspace=@quarry/app
npm run build --workspace=@quarry/app
```

The SQL integration test creates and removes its own uniquely named `Quarry_Acceptance_*` database, applies all migrations, and verifies persisted metadata through the API. It requires database-create permission and skips when `QUARRY_TEST_SQL` is unset. The outage and deadline tests inject their own failure conditions and do not require a broken local database or a running Ollama service.
