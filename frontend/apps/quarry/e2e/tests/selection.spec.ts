// Acceptance Test
// Traces to: L2-015, L2-018, L2-019, L2-025, L2-041
// Description: Selection remains singular, reconciles review metadata, and distinguishes unavailable entries.
import { expect, test } from "../fixtures/browser";
import { mockSelectionReview } from "../fixtures/selection";
import { DiscoveryPage } from "../pages/DiscoveryPage";
import { SelectionPage } from "../pages/SelectionPage";

test("selection stays in details, is idempotent, and updates after reviewing a newer revision", async ({ page }) => {
  await mockSelectionReview(page);
  const discovery = new DiscoveryPage(page);
  const selection = new SelectionPage(page);
  await discovery.goto();
  await discovery.openFramework("Atlas");
  await selection.selectInDetails("Atlas");
  await expect(page.getByRole("button", { name: "Selected", exact: true })).toBeVisible();
  await selection.selectAgain();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await selection.closeDetails();
  await discovery.reviewSelection();
  await expect(page.getByRole("dialog")).toHaveAccessibleName("Atlas Next details");
  await expect(page.getByRole("button", { name: "Selected", exact: true })).toBeVisible();
  await selection.closeDetails();
  await expect(page.getByLabel("Selected framework")).toContainText("Atlas Next selected");
  await expect(page.getByLabel("Selected framework")).toContainText("Web Components");
});

for (const mode of ["missing", "failure"] as const) {
  test(`review distinguishes ${mode} from the other unavailable state`, async ({ page }) => {
    await mockSelectionReview(page, mode);
    const discovery = new DiscoveryPage(page);
    const selection = new SelectionPage(page);
    await discovery.goto();
    await discovery.openFramework("Atlas");
    await selection.selectInDetails("Atlas");
    await selection.closeDetails();
    await discovery.reviewSelection();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Select / })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Retry", exact: true })).toHaveCount(mode === "missing" ? 0 : 1);
    await selection.closeDetails();
    if (mode === "missing") await expect(page.getByLabel("Selected framework")).toContainText("Unavailable");
    else await expect(page.getByLabel("Selected framework")).not.toContainText("Unavailable");
    await expect(page.getByLabel("Selected framework")).toContainText("Atlas selected");
    await discovery.openFramework("Boreal");
    await selection.selectInDetails("Boreal");
    await selection.closeDetails();
    await expect(page.getByLabel("Selected framework")).toContainText("Boreal selected");
    await expect(page.getByLabel("Selected framework")).not.toContainText("Atlas");
    await expect(page.getByRole("article", { name: "Atlas framework" })).not.toContainText("Selected");
  });
}

for (const cardPresent of [true, false]) {
  test(`clearing selection restores focus with card ${cardPresent ? "present" : "absent"}`, async ({ page }) => {
    await mockSelectionReview(page);
    const discovery = new DiscoveryPage(page);
    const selection = new SelectionPage(page);
    await discovery.goto();
    await discovery.openFramework("Atlas");
    await selection.selectInDetails("Atlas");
    await selection.closeDetails();
    await discovery.draftProject("Preserved draft");
    if (!cardPresent) {
      await discovery.filterTechnology("Vue");
      await expect(page.getByRole("button", { name: "Explore Atlas" })).toHaveCount(0);
    }
    await discovery.clearSelection();
    await expect(page.getByLabel("Selected framework")).toHaveCount(0);
    await expect(page.getByRole("status")).toHaveText("No framework selected.");
    await expect(cardPresent ? page.getByRole("button", { name: "Explore Atlas" }) : page.getByRole("heading", { name: "Framework results", exact: true })).toBeFocused();
    await expect(page.getByLabel("What are you building?")).toHaveValue("Preserved draft");
  });
}
