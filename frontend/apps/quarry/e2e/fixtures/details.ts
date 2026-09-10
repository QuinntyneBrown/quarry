import type { Page } from "@playwright/test";
import { catalogResponse } from "./catalog";

export async function mockScrollableDetails(page: Page) {
  const items = Array.from({ length: 24 }, (_, index) => ({ ...catalogResponse.items[0],
    id: `10000000-0000-4000-8000-${index.toString().padStart(12, "0")}`, name: `Fixture ${index}` }));
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const url = new URL(route.request().url());
    if (route.request().method() !== "GET") throw new Error(`Unexpected API mutation: ${url.pathname}`);
    if (url.pathname === "/api/frameworks") {
      await route.fulfill({ json: { ...catalogResponse, items, total: items.length } });
      return;
    }
    const summary = items.find(item => url.pathname === `/api/frameworks/${item.id}`);
    if (!summary) throw new Error(`Unexpected detail read: ${url.pathname}`);
    await route.fulfill({ json: { summary, capabilities: Array.from({ length: 30 }, (_, index) => ({ id: `cap-${index}`, description: `Documented capability ${index}` })), useCases: ["Fixture review"], components: [] } });
  });
}
