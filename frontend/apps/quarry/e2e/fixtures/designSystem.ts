import type { Page } from "@playwright/test";
import { catalogResponse } from "./catalog";

export async function mockDesignSystemDetails(page: Page, designSystemUri: string | null = "https://example.test/design-systems/cornerstone/") {
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/frameworks") await route.fulfill({ json: catalogResponse });
    else if (path === `/api/frameworks/${catalogResponse.items[0].id}`)
      await route.fulfill({ json: { summary: catalogResponse.items[0], capabilities: [], useCases: [], components: [],
        designSystemUri } });
    else throw new Error(`Unexpected API read: ${path}`);
  });
}
