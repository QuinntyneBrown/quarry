// Acceptance Test
// Traces to: L2-014, L2-015, L2-017, L2-018, L2-035, L2-041
// Description: Overview explanations must match the current submitted search and published revision.
import { expect, test } from "@playwright/test";
import { detailExplanation, mockDetailRevision } from "../fixtures/detailRevisions";
import { DiscoveryPage } from "../pages/DiscoveryPage";
import { DetailsPage } from "../pages/DetailsPage";

test("matching recommendation details include explanation and tags despite unsubmitted draft edits", async ({ page }) => {
  await mockDetailRevision(page);
  const discovery = new DiscoveryPage(page);
  const details = new DetailsPage(page);
  await discovery.goto();
  await discovery.submitProject("Staff tools");
  await expect(page.getByRole("article")).toContainText(detailExplanation);
  await discovery.draftProject("Unsubmitted change");
  await discovery.openFramework("Atlas");
  await expect(details.dialog.getByRole("region", { name: "Why this framework" })).toContainText(detailExplanation);
  await expect(details.dialog.getByLabel("Framework tags")).toContainText("Accessible");
  await details.close();
  await expect(page.getByLabel("What are you building?")).toHaveValue("Unsubmitted change");
  await discovery.expectSubmittedProject("Staff tools");
});

test("newer details identify the revision change and omit the obsolete explanation", async ({ page }) => {
  await mockDetailRevision(page, true);
  const discovery = new DiscoveryPage(page);
  const details = new DetailsPage(page);
  await discovery.goto();
  await discovery.submitProject("Staff tools");
  await expect(page.getByRole("article")).toContainText(detailExplanation);
  await discovery.openFramework("Atlas");
  await expect(details.dialog).toContainText("Framework information was updated.");
  await expect(details.dialog).toContainText("Updated published description");
  await expect(details.dialog).not.toContainText(detailExplanation);
  await details.close();
  await expect(page.getByRole("article")).toContainText(detailExplanation);
  await discovery.expectSubmittedProject("Staff tools");
});

test("browse details do not invent recommendation explanations", async ({ page }) => {
  await mockDetailRevision(page);
  const discovery = new DiscoveryPage(page);
  const details = new DetailsPage(page);
  await discovery.goto();
  await discovery.openFramework("Atlas");
  await expect(details.dialog.getByLabel("Framework tags")).toContainText("Accessible");
  await expect(details.dialog.getByRole("region", { name: "Why this framework" })).toHaveCount(0);
});

test("review after a failed new search does not reuse the previous query explanation", async ({ page }) => {
  await mockDetailRevision(page);
  const discovery = new DiscoveryPage(page);
  const details = new DetailsPage(page);
  await discovery.goto();
  await discovery.submitProject("Staff tools");
  await expect(page.getByRole("article")).toContainText(detailExplanation);
  await discovery.openFramework("Atlas");
  await expect(details.dialog).toContainText(detailExplanation);
  await discovery.selectFramework();
  await discovery.submitProject("Unavailable search");
  await expect(page.getByRole("alert")).toBeVisible();
  await discovery.reviewSelection();
  await expect(details.dialog.getByRole("button", { name: "Selected", exact: true })).toBeVisible();
  await expect(details.dialog.getByRole("region", { name: "Why this framework" })).toHaveCount(0);
});
