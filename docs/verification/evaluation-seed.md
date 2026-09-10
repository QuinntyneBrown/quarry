# Explicit evaluation catalog import

Verified on 2026-09-10 against SQL Server Express `17.0.1000.7` at `.\SQLEXPRESS` using Windows authentication.

The explicit Development command `--seed-evaluation=true` imports eight labeled illustrative entries into a migrated, dedicated database ending in `_Evaluation`. Production mode and ordinary database names reject the command without writing. Existing unrelated catalogs are not overwritten. The import transaction includes draft and public metadata, immutable fixture snapshots, one audit record, a catalog revision increment, and indexing work. The process exits without starting an HTTP listener or invoking the embedding service.

Acceptance coverage in `EvaluationSeedTests` verifies the eight publications, snapshot evidence label, initial revision, eight pending jobs, absence of vectors, repeat-import idempotency, and rejected production/non-evaluation targets. Both SQL-backed tests passed.

The backend solution build completed with zero warnings and errors. The broader regression run excluding `RealRelevanceEvaluationTests` passed 109 tests, with the opt-in live Ollama test skipped because `QUARRY_TEST_OLLAMA` was not enabled for this run.

The documented commands were also run directly against a newly migrated local `Quarry_Evaluation` database. The first invocation imported the fixtures; the second reported that they were already imported. SQL reads confirmed eight published records, eight snapshots, eight indexing jobs, one audit record, and catalog revision `1`. The ordinary `Quarry` database was not seeded.

This verifies importing fixtures, not semantic relevance, indexing performance, or released-framework evidence. The fixture data is intentionally illustrative. Real-model relevance remains a separate acceptance gate.
