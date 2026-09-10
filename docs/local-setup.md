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

To populate a separate evaluation catalog, explicitly migrate and seed a database whose name ends in `_Evaluation`:

```powershell
$env:ConnectionStrings__QuarryMigrations = 'Server=.\SQLEXPRESS;Database=Quarry_Evaluation;Trusted_Connection=True;TrustServerCertificate=True;'
dotnet ef database update --project backend/src/Quarry.Infrastructure --startup-project backend/src/Quarry.Api
$env:ConnectionStrings__QuarryEvaluation = $env:ConnectionStrings__QuarryMigrations
$env:DOTNET_ENVIRONMENT = 'Development'
$env:ASPNETCORE_ENVIRONMENT = 'Development'
dotnet run --project backend/src/Quarry.Api --no-launch-profile -- --seed-evaluation=true
```

The command exits after importing the eight `(evaluation)` entries from `backend/evaluation/catalog.json`. It records immutable snapshots explicitly marked as illustrative fixture evidence, an audit record, and eight durable indexing jobs in one transaction. These fixtures do not establish released-framework publication evidence. Running the same import again leaves records unchanged; an unrelated existing catalog is rejected. Seeding requires Development mode and the dedicated `QuarryEvaluation` connection. Ordinary API startup and production never import this data.

To browse and index this catalog, set the following in both API and worker terminals before running their normal startup commands:

```powershell
$env:ConnectionStrings__Quarry = 'Server=.\SQLEXPRESS;Database=Quarry_Evaluation;Trusted_Connection=True;TrustServerCertificate=True;'
```

If separate `QuarryRead`, `QuarryMaintenance`, or `QuarryWorker` connections are already configured, point those at the evaluation database as well; they take precedence over `Quarry`. Seeding queues indexing but does not call Ollama. Start the configured worker to generate vectors; search remains incomplete until indexing succeeds. See [evaluation seed verification](verification/evaluation-seed.md).

For restricted runtime access, configure separate connections rather than the legacy shared `Quarry` fallback:

| Environment variable | Consumer | Database role |
|---|---|---|
| `ConnectionStrings__QuarryRead` | Public API catalog/search/health reads | `QuarryRead` |
| `ConnectionStrings__QuarryMaintenance` | Authorized API mutations and rebuild | `QuarryMaintenance` |
| `ConnectionStrings__QuarryWorker` | Indexing host | `QuarryWorker` |
| `ConnectionStrings__QuarryMigrations` | EF migration tooling only | Deployment administrator |

Migrations create the roles, not logins or passwords. A database administrator maps separately provisioned login identities to them, for example:

```sql
USE Quarry;
CREATE USER QuarryReadUser FOR LOGIN QuarryReadLogin;
ALTER ROLE QuarryRead ADD MEMBER QuarryReadUser;
CREATE USER QuarryMaintenanceUser FOR LOGIN QuarryMaintenanceLogin;
ALTER ROLE QuarryMaintenance ADD MEMBER QuarryMaintenanceUser;
CREATE USER QuarryWorkerUser FOR LOGIN QuarryWorkerLogin;
ALTER ROLE QuarryWorker ADD MEMBER QuarryWorkerUser;
```

Keep these users out of elevated roles and store their connection strings privately. The API needs distinct credentials for read and maintenance connections. Two integrated-security strings in one process use the same Windows identity and therefore do not enforce that separation. SQL-authenticated logins require a suitably configured instance; see Microsoft's [SQL authentication documentation](https://learn.microsoft.com/en-us/sql/connect/ado-net/sql/authentication-sql-server?view=sql-server-ver17). The current local Express instance uses Windows-only authentication; its mode is unchanged. [Database-access verification](verification/database-access.md) distinguishes tested grants from runtime identity provisioning. Before rolling back the role migration, an administrator must remove any assigned role members.

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
dotnet run --project backend/src/Quarry.Api --launch-profile http
Set-Location frontend
npm ci
npm run dev --workspace=@quarry/app
```

Open `http://127.0.0.1:5173`. Vite forwards `/api` requests to `http://localhost:5137`, matching the API's explicit `http` launch profile. To use a different local API address, set `QUARRY_API_PROXY` in the frontend terminal before starting Vite. This value stays in the local server configuration; browser requests use the frontend origin. Ports are strict so a busy port produces an error instead of silently changing the documented address.

To inspect the production frontend build locally, run `npm run build --workspace=@quarry/app` and `npm run preview --workspace=@quarry/app` from `frontend`, then open `http://127.0.0.1:4173`. The preview server uses the same API proxy. This local delivery setup uses loopback HTTP. A separate HTTPS deployment must configure its certificate and matching proxy target explicitly.

Health endpoints are `/health/live` (process), `/health/catalog` or `/health/ready` (catalog), `/health/search` (embeddings plus current index), and `/health/indexing` (stored index only). Anonymous responses expose only coarse status. Search/indexing may return 503 while catalog browsing remains healthy. After obtaining a maintenance token, inspect protected diagnostics with:

```powershell
Invoke-RestMethod -Uri 'http://localhost:5137/api/maintenance/diagnostics' -Headers @{ Authorization = "Bearer $maintenanceToken" }
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

Restart the API with `dotnet run --project backend/src/Quarry.Api --launch-profile http` after setting its signing configuration. In the operator terminal, the provided script issues a 15-minute token (configurable from 1 to 60 minutes). Its `Subject` identifies the operator. Invoke the rebuild through the same local API address:

```powershell
$maintenanceToken = ./tools/New-QuarryMaintenanceToken.ps1 -Subject "$env:USERDOMAIN\$env:USERNAME"
Invoke-RestMethod -Method Post -Uri 'http://localhost:5137/api/maintenance/search-index/rebuild' -Headers @{ Authorization = "Bearer $maintenanceToken" }
```

Rebuild invalidates stored framework vectors and schedules durable `IndexWorkItems` for current published revisions. Scheduling, invalidation, and the audit record commit in one SQL transaction. Repeated requests do not duplicate jobs for the same revision/model. The audit contains the authenticated operator, operation, accepted outcome, request correlation ID, timestamp, and invalidated-vector count. Audit-write failure rolls back all changes and returns a safe 503.

The worker claims two jobs concurrently with 30-second leases, discovers missing compatible vectors every five seconds, and polls idle work every second. Failed embedding attempts persist retry delays of 1, 2, 4, 8, 16, then 30 seconds. Expired leases can be reclaimed after restart; the former owner cannot complete reclaimed work. Completion checks the current publication and source revision inside the vector-write transaction. Completed compatible jobs are not re-embedded by subsequent passes. See [durable indexing verification](verification/durable-indexing.md) for current evidence and remaining release gates.

Stored vectors and durable jobs identify compatibility as `model@digest/dimensions/input-version`, using the existing `Model` columns. Older name-only vectors are excluded and replacement work is discovered automatically. Scheduling a different identity supersedes old pending work and clears old leases so late completions cannot overwrite replacement vectors. No schema migration is needed for this change.

When intentionally changing the model, stop all API and worker instances, calibrate the replacement model, then set the same `Embeddings__Model`, `Embeddings__ModelDigest`, and `Embeddings__Dimensions` in their environments before restarting. Do not run worker instances configured for different identities against one catalog. The input format version is code-owned (`FrameworkEmbeddingInput.Version`); changing it also changes compatibility. Search reports incomplete indexing until replacement vectors are ready.

Run the opt-in real SQL/Ollama smoke test with `QUARRY_TEST_SQL` configured and `QUARRY_TEST_OLLAMA=1`. See [compatibility verification](verification/embedding-compatibility.md). The same operator credentials can [maintain framework metadata](maintenance.md). Draft creation does not make an entry publicly visible.

Run `./tools/Test-QuarryRelevance.ps1` with SQL test configuration and local Ollama available to execute the six real-model relevance judgments. It creates an isolated temporary database and retains reports under `test-results/relevance/`. The pinned configuration currently fails three required judgments; see [relevance evidence](verification/relevance-evaluation.md). The separate manual GitHub workflow runs the same command. Passing ordinary acceptance tests does not waive this release gate.

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
