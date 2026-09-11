// Acceptance Test
// Traces to: L2-015 (extended for a framework's optional whole-app design-system iframe; no dedicated L2 ID exists yet)
// Description: A framework with a design-system URI shows a Design System tab that iframes it; frameworks without one do not show the tab.
import { expect, test } from "../fixtures/browser";
import { mockDesignSystemDetails } from "../fixtures/designSystem";
import { DiscoveryPage } from "../pages/DiscoveryPage";
import { DetailsPage } from "../pages/DetailsPage";

test("a framework with a design system URI shows a working Design System tab", async ({ page }) => {
  await mockDesignSystemDetails(page);
  const discovery = new DiscoveryPage(page);
  const details = new DetailsPage(page);
  await discovery.goto();
  await discovery.openFramework("Atlas");
  await expect(details.designSystemTab).toBeVisible();
  await details.openDesignSystemTab();
  await expect(details.designSystemIframe).toHaveAttribute("src", "https://example.test/design-systems/cornerstone/");
});

test("a framework without a design system URI does not show the Design System tab", async ({ page }) => {
  await mockDesignSystemDetails(page, null);
  const discovery = new DiscoveryPage(page);
  const details = new DetailsPage(page);
  await discovery.goto();
  await discovery.openFramework("Atlas");
  await expect(details.designSystemTab).toHaveCount(0);
});
