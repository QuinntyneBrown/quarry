# Browser quota recovery

Verified on 2026-09-10. Three Playwright acceptance scenarios initially displayed generic service errors for 429 responses. Search, catalog, and detail requests now preserve the rate-limit condition and parse `Retry-After`.

The UI explains the temporary request limit and delay, retains query/filter/selection, and disables Retry until the indicated time. Expiry only enables the button; it does not send another request. An explicit retry sends one request and clears the error after success. Missing or invalid delay headers use a one-second fallback.

`rateLimits.spec.ts` uses shared fixtures with a two-second delay and Page Object interactions. It verifies retained state, a disabled button before expiry, no automatic request at expiry, and successful explicit retry for all three operations. All 34 frontend acceptance tests pass; the production frontend build passes.

```powershell
npm --prefix frontend/apps/quarry run test:e2e
npm --prefix frontend/apps/quarry run build
```

This verification is independent of the [currently failed real-model relevance gate](relevance-evaluation.md).
