// Acceptance Test
// Traces to: L2-026, L2-029, L2-041
// Description: Query rejection identifies its field without a service-outage retry or unsafe server text.
import { expect, test } from "@playwright/test";
import { mockQueryValidation } from "../fixtures/validation";
import { DiscoveryPage } from "../pages/DiscoveryPage";

test("query rejection exposes an associated field error and successful correction clears it", async ({ page }) => {
  const fixture = await mockQueryValidation(page);
  const discovery = new DiscoveryPage(page);
  await discovery.goto();
  await discovery.submitProject("Project description rejected by validation");
  const input = page.getByLabel("What are you building?");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(input).toHaveAccessibleDescription("Use a project description of 500 characters or fewer.");
  await expect(page.getByRole("alert")).toHaveText("Use a project description of 500 characters or fewer.");
  await expect(page.getByRole("button", { name: "Find frameworks" })).toBeFocused();
  await expect(page.getByRole("button", { name: "Retry", exact: true })).toHaveCount(0);
  await expect(page.getByText("Untrusted server text", { exact: false })).toHaveCount(0);
  expect(fixture.requests()).toBe(1);
  await discovery.submitProject("Accessible appointment forms");
  await expect(page.getByRole("heading", { name: "No matching frameworks" })).toBeVisible();
  await expect(input).not.toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(fixture.requests()).toBe(2);
});
