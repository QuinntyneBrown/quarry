import type { Page } from "@playwright/test";
import { catalogResponse } from "./catalog";

export async function mockRateLimit(page: Page, operation: "search" | "catalog" | "details") {
  const calls = { search: 0, catalog: 0, details: 0 };
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const url = new URL(route.request().url());
    let limited = false;
    if (url.pathname === "/api/framework-searches") {
      limited = ++calls.search === 1 && operation === "search";
      await route.fulfill(limited ? { status: 429, headers: { "Retry-After": "2" }, json: { code: "rate_limit_exceeded" } }
        : { json: { items: [], catalogRevision: "1", isIndexIncomplete: false } });
    } else if (url.pathname === `/api/frameworks/${catalogResponse.items[0].id}`) {
      limited = ++calls.details === 2 && operation === "details";
      await route.fulfill(limited ? { status: 429, headers: { "Retry-After": "2" }, json: { code: "rate_limit_exceeded" } }
        : { json: { summary: catalogResponse.items[0], capabilities: [], useCases: [], components: [] } });
    } else if (url.pathname === "/api/frameworks") {
      if (url.searchParams.has("technology")) limited = ++calls.catalog === 1 && operation === "catalog";
      await route.fulfill(limited ? { status: 429, headers: { "Retry-After": "2" }, json: { code: "rate_limit_exceeded" } }
        : { json: catalogResponse });
    } else throw new Error(`Unexpected API request: ${url.pathname}`);
  });
  return calls;
}
