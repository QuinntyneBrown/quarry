// Acceptance Test
// Traces to: L2-018, L2-024, L2-036, L2-041
// Description: Search dependency failure offers browsing without another embedding request or losing selection.
import { test, expect } from "../fixtures/browser";
import { mockSearchOutage } from "../fixtures/searchOutage";
import { DiscoveryPage } from "../pages/DiscoveryPage";

test("search outage can return to browsing while retaining selection", async ({ page }) => {
  const calls = await mockSearchOutage(page);
  const discovery = new DiscoveryPage(page);
  await discovery.goto();
  await discovery.openFramework("Atlas");
  await discovery.selectFramework();
  await discovery.submitProject("An application project");
  await expect(page.getByRole("alert")).toContainText("search is unavailable");
  const readsBefore = calls.catalogs;
  await discovery.resetBrowse();
  await discovery.expectCatalog();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("status", { name: "Selected framework" })).toContainText("Atlas selected");
  expect(calls.searches).toBe(1);
  expect(calls.catalogs).toBeGreaterThan(readsBefore);
});
