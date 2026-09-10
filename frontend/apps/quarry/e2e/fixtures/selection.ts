import type { Page } from "@playwright/test";
import { catalogResponse } from "./catalog";

export async function mockSelectionReview(page: Page, mode: "updated" | "missing" | "failure" = "updated") {
  let detailReads = 0;
  const other = { ...catalogResponse.items[0], id: "38e3afce-b79d-4dbb-aea9-1615cad67551", name: "Boreal", technology: "Vue" };
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/frameworks") {
      const items = url.searchParams.has("technology") ? [other] : [...catalogResponse.items, other];
      await route.fulfill({ json: { ...catalogResponse, items, total: items.length } });
      return;
    }
    if (url.pathname === `/api/frameworks/${other.id}`) {
      await route.fulfill({ json: { summary: other, capabilities: [], useCases: [], components: [] } });
      return;
    }
    if (url.pathname === `/api/frameworks/${catalogResponse.items[0].id}`) {
      if (++detailReads > 1 && mode !== "updated") {
        await route.fulfill({ status: mode === "missing" ? 404 : 503, json: { code: mode === "missing" ? "framework_not_found" : "catalog_service_unavailable" } });
        return;
      }
      await route.fulfill({ json: { summary: detailReads === 1 ? catalogResponse.items[0] : { ...catalogResponse.items[0], name: "Atlas Next", revision: "2", technology: "Web Components" }, capabilities: [], useCases: [], components: [] } });
      return;
    }
    throw new Error(`Unexpected API request: ${url.pathname}`);
  });
}
