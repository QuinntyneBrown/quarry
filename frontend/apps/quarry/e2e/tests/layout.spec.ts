// Acceptance Test
// Traces to: L2-001, L2-024, L2-025, L2-026, L2-027, L2-041
// Description: Discovery and details remain operable at every viewport band and breakpoint boundary.
import { expect, test } from "@playwright/test";
import { mockLayoutCatalog, viewports } from "../fixtures/layout";
import { DiscoveryPage } from "../pages/DiscoveryPage";
import { LayoutPage } from "../pages/LayoutPage";

for (const viewport of viewports) {
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

test("keyboard entry skips discovery controls and detail arrows cycle in either direction", async ({ page }) => {
  await mockLayoutCatalog(page);
  const discovery = new DiscoveryPage(page);
  const layout = new LayoutPage(page);
  await discovery.goto();
  await layout.useSkipLink();
  await discovery.openFramework("Atlas");
  await layout.cycleTabs();
});
