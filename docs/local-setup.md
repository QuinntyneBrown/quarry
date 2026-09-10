# Local Windows setup

Quarry uses the SDK pinned in [`global.json`](../global.json), SQL Server LocalDB, and a local Ollama embedding model.

```powershell
dotnet --version
dotnet restore backend/Quarry.sln
dotnet ef database update --project backend/src/Quarry.Infrastructure --startup-project backend/src/Quarry.Api
```

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

Verify the application code:

```powershell
dotnet test backend/tests/Quarry.Api.AcceptanceTests/Quarry.Api.AcceptanceTests.csproj
dotnet build backend/Quarry.sln --no-restore
Set-Location frontend
npm run typecheck
npm run test:e2e --workspace=@quarry/app
npm run build --workspace=@quarry/app
```
