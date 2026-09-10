// Acceptance Test
// Traces to: L2-009, L2-010, L2-011, L2-017, L2-033, L2-035, L2-041
// Description: Superseded browser requests abort without replacing current state or exposing errors.
import { expect, test } from "../fixtures/browser";
import { mockCancelableRequests } from "../fixtures/cancellation";
import { catalogResponse } from "../fixtures/catalog";
import { DiscoveryPage } from "../pages/DiscoveryPage";

for (const transition of ["submit", "clear", "filter"] as const) {
  test(`superseded search aborts on ${transition}`, async ({ page }) => {
    const requests = await mockCancelableRequests(page, "search");
    const discovery = new DiscoveryPage(page);
    try {
      await discovery.goto();
      await discovery.expectCatalog();
      await discovery.submitProject("Slow project");
      await expect(page.getByText("Loading frameworks")).toBeVisible();
      if (transition === "submit") await discovery.submitProject("Current project");
      if (transition === "clear") await discovery.clearSearch();
      if (transition === "filter") await discovery.filterTechnology("React");
      await expect.poll(() => requests.failures).toContain("/api/framework-searches");
      await expect(page.getByRole("button", { name: "Explore Atlas" })).toBeVisible();
      await expect(page.getByRole("alert")).toHaveCount(0);
      if (transition === "clear") await discovery.expectBrowseMode();
      else await discovery.expectSubmittedProject(transition === "submit" ? "Current project" : "Slow project");
    } finally { requests.release(); }
  });
}

test("a newer filter cancels a pending catalog request", async ({ page }) => {
  const requests = await mockCancelableRequests(page, "catalog");
  const discovery = new DiscoveryPage(page);
  try {
    await discovery.goto();
    await discovery.expectCatalog();
    await discovery.filterTechnology("React");
    await expect(page.getByText("Loading frameworks")).toBeVisible();
    await discovery.filterTechnology("Vue");
    await expect.poll(() => requests.failures).toContain("/api/frameworks");
    await expect(page.getByRole("button", { name: "Explore Atlas" })).toBeVisible();
    await expect(page.getByLabel("Technology")).toHaveValue("Vue");
    await expect(page.getByRole("alert")).toHaveCount(0);
  } finally { requests.release(); }
});

test("closing pending details cancels its request and restores discovery", async ({ page }) => {
  const requests = await mockCancelableRequests(page, "details");
  const discovery = new DiscoveryPage(page);
  try {
    await discovery.goto();
    await discovery.openFramework("Atlas");
    await expect(page.getByText("Loading framework details")).toBeVisible();
    await discovery.dismissDetailsWithEscape();
    await expect.poll(() => requests.failures).toContain(`/api/frameworks/${catalogResponse.items[0].id}`);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Explore Atlas" })).toBeFocused();
    await expect(page.getByRole("alert")).toHaveCount(0);
  } finally { requests.release(); }
});
