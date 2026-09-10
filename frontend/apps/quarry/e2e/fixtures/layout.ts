import type { Page } from "@playwright/test";
import { catalogResponse } from "./catalog";

export const viewports = [
  { width: 320, height: 740, columns: 1 }, { width: 375, height: 812, columns: 1 },
  { width: 575, height: 800, columns: 1 }, { width: 576, height: 800, columns: 1 },
  { width: 767, height: 800, columns: 1 }, { width: 768, height: 1024, columns: 2 },
  { width: 991, height: 800, columns: 2 }, { width: 992, height: 800, columns: 3 },
  { width: 1199, height: 800, columns: 3 }, { width: 1200, height: 900, columns: 3 },
  { width: 1440, height: 900, columns: 3 }
];

export async function mockLayoutCatalog(page: Page) {
  const items = ["Atlas", "Coast", "Form", "Mango", "Orbit", "Studio"].map((name, index) => ({
    ...catalogResponse.items[0], id: `10000000-0000-4000-8000-${index.toString().padStart(12, "0")}`, name,
    description: "Accessible controls for everyday product interfaces, with clear navigation and flexible forms.",
    tags: ["Accessible", "Design systems", "Layouts"]
  }));
  let state = "populated";
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/frameworks" || path === "/api/framework-searches") {
      if (state === "error") { await route.fulfill({ status: 503 }); return; }
      const results = state === "empty" ? [] : items;
      await route.fulfill({ json: path === "/api/frameworks"
        ? { ...catalogResponse, items: results, total: results.length }
        : { items: results.slice(0, 3).map((item, index) => ({ ...item, rank: index + 1, explanation: "Supports accessible form layouts.", supportingCapabilityIds: ["forms"] })), catalogRevision: "1", isIndexIncomplete: false }
      });
      return;
    }
    const summary = items.find(item => path === `/api/frameworks/${item.id}`);
    if (!summary) throw new Error(`Unexpected API request: ${path}`);
    await route.fulfill({ json: { summary, capabilities: [{ id: "forms", description: "Accessible form layouts" }],
      useCases: ["Staff tools", "Product interfaces"], components: [{ id: "input", name: "Text input", description: "A labeled text field." }] } });
  });
  return { setState: (next: string) => { state = next; } };
}
