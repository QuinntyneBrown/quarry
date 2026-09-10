// Acceptance Test
// Traces to: L2-025, L2-026, L2-027, L2-041
// Description: Automated contrast/semantics and measured boundary indicators cover primary UI states.
import { expect, test } from "@playwright/test";
import { mockLayoutCatalog } from "../fixtures/layout";
import { mockPreviewDetails } from "../fixtures/previews";
import { mockQueryValidation } from "../fixtures/validation";
import { DiscoveryPage } from "../pages/DiscoveryPage";
import { PreviewPage } from "../pages/PreviewPage";
import { AccessibilityPage } from "../pages/AccessibilityPage";

test("discovery, recommendations, selection and failures meet contrast and semantic checks", async ({ page }, testInfo) => {
  const fixture = await mockLayoutCatalog(page);
  const discovery = new DiscoveryPage(page);
  const accessibility = new AccessibilityPage(page);
  await discovery.goto();
  await expect(page.getByRole("article")).toHaveCount(6);
  await accessibility.expectAccessible(testInfo, "catalog");
  await accessibility.expectBoundaryContrast(".search-row", "border-top-color", "html");
  await accessibility.expectBoundaryContrast("#technology", "border-top-color", "html");
  await accessibility.expectBoundaryContrast('button[type="submit"]', "background-color", "html");
  await accessibility.focusSearchByKeyboard();
  await accessibility.expectBoundaryContrast("#project-description", "outline-color", ".search-row");
  await discovery.submitProject("Accessible forms");
  await expect(page.getByRole("article")).toHaveCount(3);
  await accessibility.expectAccessible(testInfo, "recommendations");
  await discovery.openFramework("Atlas");
  await accessibility.expectAccessible(testInfo, "overview");
  await accessibility.expectBoundaryContrast('[role="tab"][aria-selected="true"]', "border-bottom-color", "dialog");
  await discovery.selectFramework();
  await accessibility.expectBoundaryContrast(".card-selected", "border-top-color", "html");
  await accessibility.expectAccessible(testInfo, "selection");
  fixture.setState("error");
  await discovery.clearSearch();
  await expect(page.getByRole("alert")).toBeVisible();
  await accessibility.expectAccessible(testInfo, "failure");
  fixture.setState("empty");
  await discovery.retry();
  await expect(page.getByText("No frameworks are available.")).toBeVisible();
  await accessibility.expectAccessible(testInfo, "empty");
});

test("component preview and query validation meet contrast and semantic checks", async ({ page }, testInfo) => {
  await mockPreviewDetails(page);
  const discovery = new DiscoveryPage(page);
  const preview = new PreviewPage(page);
  const accessibility = new AccessibilityPage(page);
  await discovery.goto();
  await discovery.openFramework("Atlas");
  await preview.openComponents();
  await preview.expectDefaults();
  await accessibility.expectAccessible(testInfo, "components");
  await preview.editAndSave("Alex");
  await accessibility.expectAccessible(testInfo, "preview-feedback");
  await discovery.dismissDetailsWithEscape();
  await mockQueryValidation(page);
  await discovery.submitProject("Invalid fixture query");
  await expect(page.getByRole("alert")).toBeVisible();
  await accessibility.expectAccessible(testInfo, "validation");
});
