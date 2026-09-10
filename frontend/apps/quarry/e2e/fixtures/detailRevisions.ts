import type { Page } from "@playwright/test";
import { catalogResponse } from "./catalog";

export const detailExplanation = "Supports staff tools through accessible data entry controls.";

export async function mockDetailRevision(page: Page, updated = false) {
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === "/api/frameworks") await route.fulfill({ json: catalogResponse });
    else if (path === "/api/framework-searches") {
      if (request.postDataJSON().query === "Unavailable search") {
        await route.fulfill({ status: 503, json: { code: "search_service_unavailable" } });
        return;
      }
      await route.fulfill({ json: { items: [{ ...catalogResponse.items[0], rank: 1, explanation: detailExplanation,
        supportingCapabilityIds: ["data-entry"] }], catalogRevision: "1", isIndexIncomplete: false } });
    } else if (path === `/api/frameworks/${catalogResponse.items[0].id}`) {
      await route.fulfill({ json: { summary: { ...catalogResponse.items[0], revision: updated ? "2" : "1",
        description: updated ? "Updated published description" : "Published framework" },
        capabilities: [{ id: "data-entry", description: "Accessible data entry controls" }], useCases: ["Staff tools"], components: [] } });
    } else throw new Error(`Unexpected API request: ${path}`);
  });
}
