# Corrupt stored vectors and rebuild recovery

The SQL recovery acceptance scenario first reproduced HTTP 500 when an otherwise current stored vector contained invalid JSON. Search now validates stored vectors before admitting candidates: values must parse, match the configured dimensions, be finite, and include a nonzero component. Health uses the same validation. Invalid entries are omitted and the response reports incomplete indexing; valid candidates, browsing, and metadata remain available.

The Kestrel/SQL test covers malformed JSON containing a synthetic private marker, `null`, an empty array, a zero vector, too few and too many dimensions, and a nonfinite value produced by numeric overflow. Each case returns the valid recommendation, indicates an incomplete index, and keeps catalog health available while search readiness is degraded. The private stored value is not reflected in the response.

The scenario then invokes the documented authenticated rebuild endpoint, verifies vector invalidation, runs two durable jobs, and confirms that both current revisions become searchable, incomplete status clears, and readiness becomes healthy. This is a correctness/recovery check with controlled embeddings, not the separate 1,000-entry real-model rebuild benchmark.

The recovery test also exposed a second failure: a subsequent claim on the same connection inherited the serializable isolation used to complete the prior job, which SQL Server rejects with `READPAST`. Claiming now explicitly uses a short read-committed transaction. Existing concurrent-claim, expired-lease, retry, and stale-work tests remain green. See Microsoft's [transaction isolation documentation](https://learn.microsoft.com/en-us/sql/t-sql/statements/set-transaction-isolation-level-transact-sql?view=sql-server-ver17).

All 14 focused recovery, lease, processor, and health tests passed against SQL Express on 2026-09-10.

The first full regression run exposed three Kestrel test-host failures binding the default port 5000. The installed testing package's derived factories did not apply the intended `UseKestrel(0)` port selection. The HTTP fixtures now configure `Listen(IPAddress.Loopback, 0)` directly in server options, so the operating system assigns each concurrent test host its own port. Test parallelism remains enabled.

After that correction, all **131 ordinary backend tests passed, zero skipped**, and the solution built with zero warnings and errors. The opt-in live-model smoke and relevance classes were excluded from this controlled regression run.
