// Acceptance Test
// Traces to: L2-001, L2-009, L2-041
// Description: A fresh discovery page loads a mocked published catalog.
import { expect, test } from "@playwright/test";
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

test("submits a trimmed project description only when requested", async ({ page }) => {
  await page.route("**/api/frameworks**", async (route) => {
    await route.fulfill({ json: catalogResponse });
  });
  await page.route("**/api/framework-searches", async (route) => {
    await route.fulfill({ json: { items: [], catalogRevision: "1", isIndexIncomplete: false } });
  });
  const discovery = new DiscoveryPage(page);
  await discovery.goto();
  await discovery.submitProject("  Animal Hospital  ");
  await discovery.expectSubmittedProject("Animal Hospital");
});

test("examples submit the current project and the shortcut focuses search", async ({ page }) => {
  await page.route("**/api/frameworks**", async (route) => {
    await route.fulfill({ json: catalogResponse });
  });
  await page.route("**/api/framework-searches", async (route) => {
    await route.fulfill({ json: { items: [], catalogRevision: "1", isIndexIncomplete: false } });
  });
  const discovery = new DiscoveryPage(page);
  await discovery.goto();
  await discovery.useExample("Animal Hospital");
  await discovery.expectSubmittedProject("Animal Hospital");
  await discovery.focusSearchWithShortcut();
});

test("clear search returns to browse mode and focuses the project field", async ({ page }) => {
  await page.route("**/api/frameworks**", async (route) => {
    await route.fulfill({ json: catalogResponse });
  });
  await page.route("**/api/framework-searches", async (route) => {
    await route.fulfill({ json: { items: [], catalogRevision: "1", isIndexIncomplete: false } });
  });
  const discovery = new DiscoveryPage(page);
  await discovery.goto();
  await discovery.submitProject("Animal Hospital");
  await discovery.clearSearch();
  await discovery.expectBrowseMode();
  await discovery.focusSearchWithShortcut();
});

test("technology filtering reloads the current browse catalog", async ({ page }) => {
  const requestedTechnologies: string[] = [];
  await page.route("**/api/frameworks**", async (route) => {
    requestedTechnologies.push(new URL(route.request().url()).searchParams.get("technology") ?? "All technologies");
    await route.fulfill({ json: catalogResponse });
  });
  const discovery = new DiscoveryPage(page);
  await discovery.goto();
  await discovery.filterTechnology("React");
  await expect.poll(() => requestedTechnologies).toContain("React");
});

test("empty search results explain recovery and allow a browse reset", async ({ page }) => {
  await page.route("**/api/frameworks**", async (route) => {
    await route.fulfill({ json: catalogResponse });
  });
  await page.route("**/api/framework-searches", async (route) => {
    await route.fulfill({ json: { items: [], catalogRevision: "1", isIndexIncomplete: false } });
  });
  const discovery = new DiscoveryPage(page);
  await discovery.goto();
  await discovery.submitProject("unknown project");
  await expect(page.getByRole("heading", { name: "No matching frameworks" })).toBeVisible();
  await discovery.resetBrowse();
  await discovery.expectBrowseMode();
});
