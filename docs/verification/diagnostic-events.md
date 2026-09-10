# Query-safe diagnostic events

API request completion now emits structured `CorrelationId`, `Operation`, `Outcome`, `ErrorCategory`, `StatusCode`, and `DurationMs` fields. Operation comes from the controller/action metadata, never the requested URL, query string, or request body. Categories distinguish validation, authorization, missing entries, conflicts, quotas, cancellation, dependency failure, and timeout. Exceptions are classified without logging their messages or stack traces through this event.

Index completion/failure events include `Operation: framework-index`, `WorkId`, `FrameworkId`, `SourceRevision`, `Outcome`, `ErrorCategory`, and `DurationMs`. Metadata text and embedding input are omitted.

ATDD on 2026-09-10: request tests initially found no structured completion events, and the index failure test found no operation field. Both now pass, observing successful and failed HTTP searches plus a durable SQL-backed index failure. The tests assert all required fields and check that submitted private query/description markers do not appear in recorded logs. Events use Microsoft.Extensions logging providers; no public endpoint exposes them.
