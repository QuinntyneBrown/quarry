// Acceptance Test
// Traces to: L2-017, L2-024, L2-025, L2-026, L2-041
// Description: Details form a modal boundary with backdrop dismissal and scroll/focus restoration.
import { expect, test } from "@playwright/test";
import { mockScrollableDetails } from "../fixtures/details";
import { DetailsPage } from "../pages/DetailsPage";
import { DiscoveryPage } from "../pages/DiscoveryPage";

  test("details prevent background focus and scroll and restore their opener", async ({ page }) => {
    await mockScrollableDetails(page);
    const discovery = new DiscoveryPage(page);
    const details = new DetailsPage(page);
    await discovery.goto();
    await discovery.draftProject("Unsubmitted draft");
    const scroll = await details.scrollDiscoveryToFramework("Fixture 20");
    expect(scroll).toBeGreaterThan(0);
    await discovery.openFramework("Fixture 20");
    await expect(details.dialog).toHaveAccessibleName("Fixture 20 details");
    await details.expectFitsViewport();
    await details.tryFocusingBackground();
    await details.expectFocusInside();
    await details.tryScrollingBackground();
    expect(await details.scrollPosition()).toBe(scroll);
    await details.close();
    await expect(page.getByRole("button", { name: "Explore Fixture 20" })).toBeFocused();
    expect(await details.scrollPosition()).toBe(scroll);
    await expect(page.getByLabel("What are you building?")).toHaveValue("Unsubmitted draft");
  });

test("details dismiss on backdrop click but preserve inside interactions", async ({ page }) => {
  await mockScrollableDetails(page);
  const discovery = new DiscoveryPage(page);
  const details = new DetailsPage(page);
  await discovery.goto();
  await discovery.openFramework("Fixture 0");
  await details.clickContent();
  await expect(details.dialog).toBeVisible();
  await details.clickBackdrop();
  await expect(details.dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Explore Fixture 0" })).toBeFocused();
});
