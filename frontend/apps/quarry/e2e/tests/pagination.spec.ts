// Acceptance Test
// Traces to: L2-009, L2-017, L2-035, L2-041
// Description: Changed browse revisions replace accumulated pages and preserve discovery state.
import { expect, test } from "../fixtures/browser";
import { mockCatalogRevisionChange } from "../fixtures/pagination";
import { DiscoveryPage } from "../pages/DiscoveryPage";

for (const mode of ["conflict", "mismatched-page", "refresh-failure"] as const) {
  test(`catalog revision recovery preserves query, filter and selection: ${mode}`, async ({ page }) => {
    const requests = await mockCatalogRevisionChange(page, mode);
    const discovery = new DiscoveryPage(page);
    await discovery.goto();
    await expect(page.getByRole("article")).toHaveCount(24);
    await discovery.openFramework("Atlas");
    await discovery.selectFramework();
    await discovery.filterTechnology("React");
    await discovery.draftProject("Unsubmitted veterinary query");
    await discovery.loadMore();
    if (mode === "refresh-failure") {
      await expect(page.getByRole("alert")).toContainText("catalog");
      await discovery.retry();
    }
    await expect(page.getByRole("article")).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Explore Boreal" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Explore Atlas" })).toHaveCount(0);
    await expect(page.getByText("Catalog updated. Showing the latest frameworks.")).toBeVisible();
    await expect(page.getByLabel("What are you building?")).toHaveValue("Unsubmitted veterinary query");
    await expect(page.getByLabel("Technology")).toHaveValue("React");
    await expect(page.getByText("Atlas selected")).toBeVisible();
    await expect(page.getByRole("button", { name: "Load more" })).toHaveCount(0);
    const next = requests.find(request => request.searchParams.has("cursor"));
    expect(next?.searchParams.get("expectedRevision")).toBe("1");
    expect(requests.at(-1)?.searchParams.has("cursor")).toBe(false);
    expect(requests.at(-1)?.searchParams.has("expectedRevision")).toBe(false);
    expect(requests.at(-1)?.searchParams.get("technology")).toBe("React");
  });
}
