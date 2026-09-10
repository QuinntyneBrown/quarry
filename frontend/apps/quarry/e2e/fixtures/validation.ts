import type { Page } from "@playwright/test";
import { catalogResponse } from "./catalog";

export async function mockQueryValidation(page: Page) {
  let attempts = 0;
  await page.route("**/api/frameworks", route => route.fulfill({ json: catalogResponse }));
  await page.route("**/api/framework-searches", async route => {
    attempts++;
    await route.fulfill(attempts === 1 ? { status: 400, json: {
      code: "invalid_search_query", correlationId: "validation-fixture", errors: { query: ["Untrusted server text <script>unsafe</script>"] }
    } } : { json: { items: [], catalogRevision: "1", isIndexIncomplete: false } });
  });
  return { requests: () => attempts };
}
