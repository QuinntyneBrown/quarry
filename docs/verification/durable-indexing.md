# Durable indexing verification — 2026-09-10

The SQL acceptance suite runs with `QUARRY_TEST_SQL` pointing to `.\SQLEXPRESS`; each test creates and removes a uniquely named temporary database. Run it with the command in [local setup](../local-setup.md).

Verified behaviors:

- Rebuild schedules one job per current published revision/model; drafts are excluded and repeated rebuilds do not create duplicate jobs.
- Scheduling, vector invalidation, and operator audit commit together. An injected SQL audit failure rolls them all back.
- Competing connections cannot claim the same job. Leases expire after 30 seconds; a replacement owner receives a new lease ID and the previous owner cannot write a vector.
- Revision changes supersede in-flight completion. A new revision receives new work.
- Provider failures persist retry state. A replacement processor recovers and completes the job.
- Retry delays follow 1, 2, 4, 8, 16, 30, 30 seconds without sleeping in the tests; their due times are advanced explicitly.
- Completed compatible work is not embedded again on a subsequent scheduling/processing pass.

An actual `Quarry.Indexing.Worker` process was also run against a migrated temporary Express database containing one synthetic published entry. It used the live local Ollama service and `embeddinggemma:300m` digest `85462619ee721b466c5927d109d4cb765861907d5417b9109caebc4e614679f1`. SQL inspection showed `State=completed`, `AttemptCount=1`, `LastError=NULL`, and a stored vector with `Dimensions=768`, `SourceRevision=1`. The process was stopped and its temporary database removed.

This single-entry smoke check does not establish relevance, the 1,000-entry workload, the 60-second freshness target under load, or the 30-minute rebuild gate. Those measurements remain outstanding. Subsequent increments added transactional publication scheduling and [digest/input-version compatibility](embedding-compatibility.md), including superseding old leases on an identity change.
