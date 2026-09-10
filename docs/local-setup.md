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

The verified local model on 2026-09-10 was `embeddinggemma:300m` with digest `85462619ee72` and 768 output dimensions. Run the indexing worker after migrations so published framework descriptions and tags receive compatible vectors:

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
