import type { Page } from "@playwright/test";
import { catalogResponse } from "./catalog";

export async function mockSearchOutage(page: Page) {
  const calls = { searches: 0, catalogs: 0 };
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() === "POST" && path === "/api/framework-searches") {
      calls.searches++;
      await route.fulfill({ status: 503, json: { code: "embedding_service_unavailable", correlationId: "outage-fixture" } });
    } else if (request.method() === "GET" && path === "/api/frameworks") {
      calls.catalogs++;
      await route.fulfill({ json: catalogResponse });
    } else if (request.method() === "GET" && path === `/api/frameworks/${catalogResponse.items[0].id}`) {
      await route.fulfill({ json: { summary: catalogResponse.items[0], capabilities: [], components: [], useCases: [] } });
    } else throw new Error(`Unexpected backend request: ${request.method()} ${path}`);
  });
  return calls;
}
