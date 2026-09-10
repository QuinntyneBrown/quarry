import type { Page } from "@playwright/test";
import { catalogResponse } from "./catalog";

export async function mockCatalogRevisionChange(page: Page, mode: "conflict" | "mismatched-page" | "refresh-failure") {
  let changed = false;
  let failRefresh = mode === "refresh-failure";
  const requests: URL[] = [];
  const original = Array.from({ length: 24 }, (_, index) => ({
    ...catalogResponse.items[0],
    id: index === 0 ? catalogResponse.items[0].id : `10000000-0000-0000-0000-${index.toString().padStart(12, "0")}`,
    name: index === 0 ? "Atlas" : `Fixture ${index}`
  }));
  const refreshed = { ...catalogResponse, items: [{ ...catalogResponse.items[0], id: "38e3afce-b79d-4dbb-aea9-1615cad67551", name: "Boreal" }], catalogRevision: "2" };
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const url = new URL(route.request().url());
    if (url.pathname === `/api/frameworks/${catalogResponse.items[0].id}`) {
      await route.fulfill({ json: { summary: catalogResponse.items[0], capabilities: [], useCases: [], components: [] } });
      return;
    }
    if (url.pathname !== "/api/frameworks" || route.request().method() !== "GET")
      throw new Error(`Unexpected API request: ${route.request().method()} ${url.pathname}`);
    requests.push(url);
    if (url.searchParams.has("cursor")) {
      changed = true;
      await route.fulfill(mode === "mismatched-page"
        ? { json: refreshed }
        : { status: 409, json: { code: "catalog_revision_changed", correlationId: "fixture" } });
      return;
    }
    if (changed && failRefresh) {
      failRefresh = false;
      await route.fulfill({ status: 503, json: { code: "catalog_service_unavailable", correlationId: "fixture" } });
      return;
    }
    await route.fulfill({ json: changed ? refreshed
      : { ...catalogResponse, items: original, total: 25, hasNextPage: true, nextCursor: "page-2" } });
  });
  return requests;
}
