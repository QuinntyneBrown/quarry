# Safe model-binding errors

L2-029/L2-030 require malformed requests to fail safely before database changes or embedding calls. Controller-level validation already handled parsed requests, but ASP.NET's automatic model-binding responses used a different contract and could reflect an invalid query-parameter value.

`InvalidRequestTests` reproduced nine failing cases on 2026-09-10: empty/null/array/truncated JSON bodies, wrong JSON value types, nonnumeric/overflowing page sizes, and malformed maintenance bodies. The nonnumeric page-size response contained the synthetic sensitive marker. Other responses lacked Quarry's stable `code` and `correlationId` fields.

The API now configures [`InvalidModelStateResponseFactory`](https://learn.microsoft.com/en-us/aspnet/core/web-api/?view=aspnetcore-10.0#log-automatic-400-responses) to return HTTP 400 with `invalid_request` and the request correlation ID. It does not return raw model-state keys, values, parser messages, or exceptions. Existing domain validation still supplies its specific safe field-level errors.

All nine focused tests pass over real Kestrel HTTP. Search cases make zero embedding calls and omit the marker from captured routine logs. Page-size cases reject input while configured with an unavailable database. The SQL-backed maintenance scenario verifies that create/update/publish/withdraw/delete binding failures leave the original draft revision, audit count, published records, snapshots, and indexing queue unchanged.

The ordinary backend regression suite passed **130 tests, zero skipped**, using SQL Express. The live-model smoke and relevance classes remain separate opt-in gates and were excluded from this regression run. The complete backend solution built with zero warnings and errors. TRX output is retained under the ignored `test-results/backend` directory.
