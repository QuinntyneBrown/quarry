// Acceptance Test
// Traces to: L2-024, L2-027
// Description: Actual 200% browser zoom preserves discovery and preview layout in a 1280 x 900 window.
import { test, expect } from "../fixtures/browser";
import { mockLayoutCatalog } from "../fixtures/layout";
import { mockLayoutRecovery } from "../fixtures/layoutRecovery";
import { DiscoveryPage } from "../pages/DiscoveryPage";
import { LayoutPage } from "../pages/LayoutPage";
import { PreviewPage } from "../pages/PreviewPage";
import { ZoomPage } from "../pages/ZoomPage";

test("browser zoom preserves catalog, long queries, details, selection and recovery layout", async ({ page }, testInfo) => {
  const fixture = await mockLayoutCatalog(page);
  const discovery = new DiscoveryPage(page);
  const layout = new LayoutPage(page);
  await discovery.goto();
  await new ZoomPage(page).expectBrowserZoom();
  await layout.expectColumns(1, 6);
  await layout.expectMobileSubmitRow();
  await layout.expectNoHorizontalOverflow();
  await layout.expectControlTargets();
  await new ZoomPage(page).capture(testInfo.outputPath("zoom-catalog.png"));
  await discovery.submitProject("A".repeat(500));
  await layout.expectColumns(1, 3);
  await layout.expectNoHorizontalOverflow();
  await discovery.openFramework("Atlas");
  await layout.expectNoHorizontalOverflow();
  await layout.expectDialogActionsReachable();
  await new ZoomPage(page).capture(testInfo.outputPath("zoom-details.png"));
  await discovery.selectFramework();
  await layout.activateLastCardAboveSelection();
  await layout.expectNoHorizontalOverflow();
  fixture.setState("error");
  await discovery.clearSearch();
  await expect(page.getByRole("alert")).toBeVisible();
  await layout.expectNoHorizontalOverflow();
  fixture.setState("empty");
  await discovery.retry();
  await expect(page.getByText("No frameworks are available.")).toBeVisible();
  await layout.expectNoHorizontalOverflow();
});

test("browser zoom preserves pending, failed and recovered real preview controls", async ({ page }, testInfo) => {
  const fixture = await mockLayoutRecovery(page);
  const discovery = new DiscoveryPage(page);
  const layout = new LayoutPage(page);
  const preview = new PreviewPage(page);
  await discovery.goto();
  await new ZoomPage(page).expectBrowserZoom();
  await expect(page.getByRole("status")).toHaveText("Loading frameworks");
  await layout.expectNoHorizontalOverflow();
  fixture.releaseCatalog();
  await discovery.openFramework("Atlas");
  await expect(page.getByRole("dialog").getByRole("status")).toHaveText("Loading framework details");
  await layout.expectNoHorizontalOverflow();
  fixture.releaseDetails();
  await expect(page.getByRole("alert")).toContainText("Framework details are unavailable");
  await layout.expectDialogActionsReachable();
  await discovery.retry();
  await preview.openComponents();
  await expect(page.getByText("Loading component preview", { exact: true })).toBeVisible();
  await layout.expectNoHorizontalOverflow();
  fixture.releasePreview();
  await expect(page.getByRole("alert")).toContainText("The component preview is unavailable");
  await preview.retry();
  await preview.expectDefaults();
  await preview.expectLayout();
  await new ZoomPage(page).capture(testInfo.outputPath("zoom-preview.png"));
  await preview.editAndSave("Alex");
  await expect(preview.frame.getByRole("status")).toHaveText("Saved for Alex in this preview.");
  await preview.reset();
  await preview.expectDefaults();
  await layout.expectNoHorizontalOverflow();
  await layout.expectDialogActionsReachable();
  await discovery.selectFramework();
  await discovery.clearSelection();
});
