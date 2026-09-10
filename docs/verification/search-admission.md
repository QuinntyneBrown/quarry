# Search admission and empty-query behavior

The seventeenth concurrent search now receives HTTP 429 with `Retry-After: 1` before embedding begins. Cancellation propagates to admitted work and releases its slot in `finally`. A whitespace-only direct search request now returns the first filtered catalog page, without embedding or entering semantic-search admission; missing query data and oversized queries remain invalid. Empty-query responses use the normal catalog-page shape, including total, cursor, and revision.

The request deadline returns a safe `search_deadline_exceeded` JSON code and correlation ID with HTTP 504. It uses ASP.NET Core's [documented timeout-response delegate](https://learn.microsoft.com/en-us/aspnet/core/performance/timeouts?view=aspnetcore-10.0).

ATDD on 2026-09-10: the new admission test initially received 503 instead of 429; the empty-query test received 400 instead of a catalog page; the deadline test received an empty body. The focused six-test run now passes. The HTTP test holds sixteen requests, rejects the seventeenth without invoking embeddings, cancels one client, and observes replacement admission within one second. The fixed-window quota regression uses a null query for invalid input now that empty strings correctly browse.

These in-process HTTP tests establish admission and cancellation behavior. Real Kestrel load, memory recovery, and the full performance workload remain separate gates.
