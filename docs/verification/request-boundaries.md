# API request boundaries

L2-029 requires bodies above 16 KiB to return 413 before processing and rejects page-number pagination. The shared API middleware now enforces the byte limit before MVC binding and dispatch. It rejects oversized Content-Length immediately and reads at most 16,385 bytes for unknown-length bodies. Accepted bodies are replayed from bounded memory. Authentication and quotas still apply before body processing.

Every body-consuming endpoint shares the limit, including create, update, publish, withdraw, delete, search, and index rebuild. Oversized malformed JSON also returns the safe `request_body_too_large` code and a correlation ID. The former maintenance-specific 1 MiB allowance is removed. Catalog parameters `page`, `pageNumber`, and `page-number` (case-insensitive) return 400 `unsupported_pagination`; cursor pagination is unchanged.

ATDD on 2026-09-10: all seven added scenarios failed before implementation. Oversized maintenance creation returned 201, malformed oversized search input returned 400, and page-number reads reached the unavailable catalog and returned 503. After implementation:

- Real Kestrel HTTP accepts exactly 16 KiB and rejects the next byte, including multibyte UTF-8 data, known lengths, chunked bodies, and malformed JSON.
- Authenticated oversized requests to all six maintenance actions return 413. SQL confirms no metadata revision changes, publication, audit additions, or indexing jobs.
- All four page-number variants return 400 without accessing the unavailable database.
- Seven focused tests and all 116 ordinary backend regression tests passed; the solution build had zero warnings/errors. Real-model tests were excluded from this regression run.
