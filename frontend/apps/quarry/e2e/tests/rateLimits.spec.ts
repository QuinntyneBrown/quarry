// Acceptance Test
// Traces to: L2-031, L2-036, L2-041
// Description: Quota errors retain discovery state and permit only explicit retry after Retry-After.
import { expect, test } from "@playwright/test";
import { mockRateLimit } from "../fixtures/rateLimits";
import { DiscoveryPage } from "../pages/DiscoveryPage";

for (const operation of ["search", "catalog", "details"] as const) {
  test(`temporary ${operation} limit preserves state and delays explicit retry`, async ({ page }) => {
    const calls = await mockRateLimit(page, operation);
    const discovery = new DiscoveryPage(page);
    await discovery.goto();
    await discovery.openFramework("Atlas");
    await discovery.selectFramework();
    await discovery.draftProject("Animal Hospital");
    await discovery.filterTechnology("React");
    if (operation === "search") await discovery.submitProject("Animal Hospital");
    if (operation === "details") await discovery.reviewSelection();
    await expect(page.getByRole("alert")).toContainText("temporary request limit");
    await expect(page.getByRole("button", { name: "Retry", exact: true })).toBeDisabled();
    await expect(page.getByLabel("What are you building?")).toHaveValue("Animal Hospital");
    await expect(page.getByLabel("Technology")).toHaveValue("React");
    await expect(page.getByText("Atlas selected")).toBeVisible();
    const before = calls[operation];
    await expect(page.getByRole("button", { name: "Retry", exact: true })).toBeEnabled({ timeout: 4000 });
    expect(calls[operation]).toBe(before);
    await discovery.retry();
    await expect(page.getByRole("alert")).toHaveCount(0);
    expect(calls[operation]).toBe(before + 1);
  });
}
