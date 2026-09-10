# Local frontend/API integration

The local startup instructions previously ran Vite and ASP.NET on different ports without forwarding `/api`. Because isolated UI tests intercepted those requests in the browser, they did not expose the missing connection. The first routing acceptance test failed with no catalog cards while a separate HTTP mock API was available.

Vite now proxies `/api` to the API's explicit HTTP launch profile at `http://localhost:5137`. `QUARRY_API_PROXY` overrides the target for a different local endpoint. The same configuration supports development and local inspection of the production build; strict ports keep startup addresses predictable. This uses Vite's documented [server proxy](https://vite.dev/config/server-options#server-proxy) and [preview proxy](https://vite.dev/config/preview-options#preview-proxy) configuration. Browser requests retain the frontend origin.

The routing test starts a separate HTTP fixture backend rather than intercepting requests in Playwright. Both development and production-build projects verify catalog JSON, query-string technology filtering, details, POSTed search, propagated HTTP 503, and returning to browsing. All backend behavior is still mocked and requires no database. The test additionally exposed the missing `Browse all frameworks` action after a search-service failure; that required L2-036 recovery action is now present.

Both routing tests passed in 6.1 seconds, and both frontend workspace builds passed. A separate read-only local check started the documented API and Vite commands against SQL Express: direct and proxied catalog requests returned HTTP 200 with identical JSON, catalog revision `0`, and the ordinary empty production catalog. Those temporary processes were stopped afterward. No illustrative data was added to that database.

CI builds before running the routing checks and the ordinary browser matrix. Routing and browser output directories are separate so the later suite cannot erase the earlier reports. Generated reports remain outside source control.

The complete existing matrix passed **384 tests in 5.4 minutes** with `CI=true` and two workers. The additional search-outage recovery scenario then passed at all five viewport bands and actual 200% browser zoom (**six tests**), verifying that browsing makes no second search request and preserves selection. Type checking passed after adding that coverage.
