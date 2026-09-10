// Acceptance Test
// Traces to: L2-004, L2-009, L2-036, L2-041
// Description: The documented local frontend forwards real HTTP to a separate mock API.
import { test, expect } from "@playwright/test";
import { DiscoveryPage } from "../../pages/DiscoveryPage";

test("local hosting connects browsing, details, submission and failures to the configured API", async ({ page }) => {
  const discovery = new DiscoveryPage(page);
  await discovery.goto();
  await expect(page.getByRole("article")).toHaveCount(1);
  await discovery.openFramework("Local API fixture");
  await expect(page.getByRole("dialog")).toHaveAccessibleName("Local API fixture details");
  await expect(page.getByText("Accessible forms", { exact: true })).toBeVisible();
  await discovery.dismissDetailsWithEscape();
  await discovery.filterTechnology("Vue");
  await expect(page.getByRole("article")).toHaveCount(0);
  await discovery.filterTechnology("React");
  await discovery.submitProject("Local routing fixture");
  await discovery.expectSubmittedProject("Local routing fixture");
  await expect(page.getByRole("article")).toHaveCount(1);
  await discovery.submitProject("Service failure fixture");
  await expect(page.getByRole("alert")).toBeVisible();
  await discovery.resetBrowse();
  await expect(page.getByRole("article")).toHaveCount(1);
});
