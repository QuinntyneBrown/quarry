// Acceptance Test
// Traces to: L2-025, L2-026, L2-041
// Description: Keyboard page entry and wrapping detail tabs work in each viewport band.
import { test } from "@playwright/test";
import { mockLayoutCatalog } from "../fixtures/layout";
import { DiscoveryPage } from "../pages/DiscoveryPage";
import { LayoutPage } from "../pages/LayoutPage";

test("keyboard entry skips discovery controls and detail arrows cycle in either direction", async ({ page }) => {
  await mockLayoutCatalog(page);
  const discovery = new DiscoveryPage(page);
  const layout = new LayoutPage(page);
  await discovery.goto();
  await layout.useSkipLink();
  await discovery.openFramework("Atlas");
  await layout.cycleTabs();
});
