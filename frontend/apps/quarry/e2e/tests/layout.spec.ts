// Acceptance Test
// Traces to: L2-001, L2-024, L2-025, L2-026, L2-027, L2-041
// Description: Discovery and details remain operable at every viewport band and breakpoint boundary.
import { expect, test } from "@playwright/test";
import { mockLayoutCatalog, viewports } from "../fixtures/layout";
import { DiscoveryPage } from "../pages/DiscoveryPage";
import { LayoutPage } from "../pages/LayoutPage";
import { PreviewPage } from "../pages/PreviewPage";
import { mockLayoutRecovery } from "../fixtures/layoutRecovery";

for (const viewport of viewports) {
  test(`pending, failed and recovered preview states fit ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const reducedMotion = viewport.width === 320 || viewport.width === 1440;
    if (reducedMotion) await page.emulateMedia({ reducedMotion: "reduce" });
    const fixture = await mockLayoutRecovery(page);
    const discovery = new DiscoveryPage(page);
    const layout = new LayoutPage(page);
    const preview = new PreviewPage(page);
    await discovery.goto();
    await expect(page.getByRole("status")).toHaveText("Loading frameworks");
    await layout.expectNoHorizontalOverflow();
    fixture.releaseCatalog();
    await discovery.openFramework("Atlas");
    await expect(page.getByRole("dialog").getByRole("status")).toHaveText("Loading framework details");
    await layout.expectNoHorizontalOverflow();
    await layout.expectDialogActionsReachable();
    fixture.releaseDetails();
    await expect(page.getByRole("alert")).toContainText("Framework details are unavailable");
    await layout.expectNoHorizontalOverflow();
    await layout.expectDialogActionsReachable();
    await discovery.retry();
    await preview.openComponents();
    await expect(page.getByText("Loading component preview", { exact: true })).toBeVisible();
    await layout.expectNoHorizontalOverflow();
    fixture.releasePreview();
    await expect(page.getByRole("alert")).toContainText("The component preview is unavailable");
    await layout.expectDialogActionsReachable();
    await preview.retry();
    await preview.expectDefaults();
    await preview.expectLayout();
    await preview.editAndSave("Alex");
    await expect(preview.frame.getByRole("status")).toHaveText("Saved for Alex in this preview.");
    await preview.reset();
    await preview.expectDefaults();
    await layout.expectNoHorizontalOverflow();
    if (reducedMotion) await layout.expectReducedMotion();
    await discovery.selectFramework();
    await layout.expectNoHorizontalOverflow();
    await discovery.clearSelection();
    if (reducedMotion) await layout.expectReducedMotion();
  });

  test(`discovery, results, details and selection fit ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const fixture = await mockLayoutCatalog(page);
    const discovery = new DiscoveryPage(page);
    const layout = new LayoutPage(page);
    await discovery.goto();
    await layout.expectColumns(viewport.columns, 6);
    await layout.expectNoHorizontalOverflow();
    await layout.expectControlTargets();
    if (viewport.width < 768) await layout.expectMobileSubmitRow();
    if (viewport.width === 320 || viewport.width === 1440) await layout.captureLayout(testInfo.outputPath("catalog.png"));
    await discovery.submitProject("A".repeat(500));
    await layout.expectColumns(viewport.columns, 3);
    await layout.expectNoHorizontalOverflow();
    await discovery.openFramework("Atlas");
    await layout.expectNoHorizontalOverflow();
    await layout.expectControlTargets();
    if (viewport.width === 320 || viewport.width === 1440) await layout.captureLayout(testInfo.outputPath("details.png"));
    await layout.showComponents();
    await layout.expectNoHorizontalOverflow();
    await discovery.selectFramework();
    await layout.activateLastCardAboveSelection();
    await layout.expectNoHorizontalOverflow();
    await discovery.clearSearch();
    fixture.setState("error");
    await discovery.filterTechnology("Vue");
    await expect(page.getByRole("alert")).toBeVisible();
    await layout.expectNoHorizontalOverflow();
    fixture.setState("empty");
    await discovery.retry();
    await expect(page.getByText("No frameworks are available.")).toBeVisible();
    await layout.expectNoHorizontalOverflow();
  });
}
