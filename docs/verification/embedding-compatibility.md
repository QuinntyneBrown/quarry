# Embedding identity verification

Verified on 2026-09-10 against the installed local Ollama service and SQL Server Express.

The configured identity is `embeddinggemma:300m@85462619ee721b466c5927d109d4cb765861907d5417b9109caebc4e614679f1/768/quarry-embedding-v1`. The durable job and vector `Model` columns store this full key. The separate vector `Dimensions` column is also checked during retrieval. Both publication and rebuild use the same key as the worker and query provider.

The integration uses Ollama's [model-list digest](https://docs.ollama.com/api/tags) before and after the [embedding request](https://docs.ollama.com/api/embed). The request sets `truncate: false`. All three calls share a five-second cancellation deadline. Quarry validates the returned model, exactly one vector, expected dimensions, finite values, and a nonzero vector before exposing an embedding.

Acceptance evidence:

- Provider tests initially accepted changed digests, incorrect models/dimensions, and multi-vector responses. These cases now fail with a typed compatibility condition.
- SQL-backed HTTP tests initially returned legacy vectors and stored name-only jobs. They now exclude old model digests and input versions, mark eligible entries incomplete until compatible indexing, and verify identical publication/rebuild keys.
- A public HTTP test verifies 503 `embedding_model_incompatible` with a correlation ID and no query or provider details.
- A model-change lease test initially left old work leased. Scheduling a new identity now supersedes old pending/leased work, prevents its late completion, and schedules the unchanged published revision under the new identity.
- `LiveEmbeddingIndexTests` uses actual local Ollama with a synthetic entry in a temporary migrated SQL database. The real provider completes durable work with the pinned identity, stores a 768-dimensional vector, and makes that entry an eligible candidate. Its temporary database is removed after the test.

Run the full backend suite including the live integration check:

```powershell
$env:QUARRY_TEST_SQL = 'Server=.\SQLEXPRESS;Trusted_Connection=True;TrustServerCertificate=True;'
$env:QUARRY_TEST_OLLAMA = '1'
dotnet test backend/tests/Quarry.Api.AcceptanceTests/Quarry.Api.AcceptanceTests.csproj --no-restore
dotnet build backend/Quarry.sln --no-restore
```

The live check is opt-in so ordinary isolated tests do not require Ollama. It establishes compatible persistence, not semantic relevance or workload latency. The six-query relevance evaluation and performance gates remain outstanding. See [local setup](../local-setup.md) for coordinated model changes; a catalog supports one configured indexing identity at a time.
