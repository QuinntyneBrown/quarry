// Acceptance Test
// Traces to: L2-001, L2-009, L2-041
// Description: A fresh discovery page loads a mocked published catalog.
import { test } from "@playwright/test";
import { catalogResponse } from "../fixtures/catalog";
import { DiscoveryPage } from "../pages/DiscoveryPage";

test("loads a published catalog before a project description is submitted", async ({ page }) => {
  await page.route("**/api/frameworks**", async (route) => {
    await route.fulfill({ json: catalogResponse });
  });
  const discovery = new DiscoveryPage(page);
  await discovery.goto();
  await discovery.expectCatalog();
});
