// Acceptance Test
// Traces to: L2-016, L2-017, L2-025, L2-030, L2-041
// Description: Revision-bound previews run in an isolated frame with bounded lifecycle and keyboard messages.
import { expect, test } from "@playwright/test";
import { capturePreviewHandshake, failFirstPreviewInitialization, mockPreviewDetails, previewManifest } from "../fixtures/previews";
import { DiscoveryPage } from "../pages/DiscoveryPage";
import { PreviewPage } from "../pages/PreviewPage";

test("illustrative preview controls stay local and reset after reopening", async ({ page }) => {
  const mutations = await mockPreviewDetails(page);
  const discovery = new DiscoveryPage(page);
  const preview = new PreviewPage(page);
  await discovery.goto();
  await discovery.openFramework("Atlas");
  await preview.openComponents();
  await expect(page.getByText("Illustrative preview — not a released framework build.")).toBeVisible();
  await preview.expectDefaults();
  await expect(preview.frame.getByRole("switch", { name: "Email notifications" })).toBeChecked();
  await preview.editAndSave("Alex");
  await expect(preview.frame.getByRole("status")).toHaveText("Saved for Alex in this preview.");
  await preview.reset();
  await preview.expectDefaults();
  await expect(preview.frame.getByRole("status")).toHaveText("Preview reset.");
  await preview.editAndSave("");
  await expect(preview.frame.getByRole("status")).toHaveText("Saved for you in this preview.");
  await preview.escape();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await discovery.openFramework("Atlas");
  await preview.openComponents();
  await preview.expectDefaults();
  expect(mutations).toEqual([]);
});

test("preview keyboard boundaries return to adjacent dialog controls", async ({ page }) => {
  await mockPreviewDetails(page);
  const discovery = new DiscoveryPage(page);
  const preview = new PreviewPage(page);
  await discovery.goto();
  await discovery.openFramework("Atlas");
  await preview.openComponents();
  await preview.expectDefaults();
  await preview.enterWithTab();
  await expect(preview.frame.getByLabel("Display name")).toBeFocused();
  await preview.exitBackward();
  await expect(page.getByRole("tab", { name: "Components" })).toBeFocused();
  await preview.exitForward();
  await expect(page.getByRole("button", { name: "Select Atlas" })).toBeFocused();
  await preview.escape();
  await expect(page.getByRole("button", { name: "Explore Atlas" })).toBeFocused();
});

test("preview cannot read credentials, request maintenance, or navigate its parent", async ({ page, context }) => {
  const mutations = await mockPreviewDetails(page);
  await context.addCookies([{ name: "quarry_test_secret", value: "synthetic-only", url: "http://127.0.0.1:4173", httpOnly: false }]);
  const previewCookies: (string | undefined)[] = [];
  page.on("request", async request => {
    if (new URL(request.url()).origin === "http://localhost:4180") previewCookies.push((await request.allHeaders()).cookie);
  });
  const discovery = new DiscoveryPage(page);
  const preview = new PreviewPage(page);
  await discovery.goto();
  await discovery.openFramework("Atlas");
  await preview.openComponents();
  await preview.expectDefaults();
  expect(await preview.probeIsolation("http://127.0.0.1:4173")).toEqual({
    parentBlocked: true, cookieBlocked: true, storageBlocked: true, networkBlocked: true, navigationBlocked: true
  });
  expect(mutations).toEqual([]);
  expect(previewCookies.length).toBeGreaterThan(0);
  expect(previewCookies.every(value => value === undefined)).toBe(true);
  await expect(page).toHaveURL("http://127.0.0.1:4173/");
});

test("preview timeout keeps review usable and retry creates a fresh frame", async ({ page }) => {
  await mockPreviewDetails(page);
  await failFirstPreviewInitialization(page);
  const discovery = new DiscoveryPage(page);
  const preview = new PreviewPage(page);
  await discovery.goto();
  await discovery.openFramework("Atlas");
  await preview.openComponents();
  await expect(page.getByText("Loading component preview")).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("component preview is unavailable", { timeout: 7000 });
  await expect(page.getByRole("button", { name: "Select Atlas" })).toBeEnabled();
  await expect(page.getByRole("tab", { name: "Overview" })).toBeEnabled();
  await preview.retry();
  await preview.expectDefaults();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("preview host rejects forged schemas, wrong windows and stale sessions", async ({ page }) => {
  await mockPreviewDetails(page);
  await capturePreviewHandshake(page);
  const discovery = new DiscoveryPage(page);
  const preview = new PreviewPage(page);
  await discovery.goto();
  await discovery.openFramework("Atlas");
  await preview.openComponents();
  await preview.expectDefaults();
  const oldToken = await preview.token();
  await preview.sendFromWrongWindow(oldToken);
  await preview.sendMessage({ protocolVersion: 99 });
  await preview.sendMessage({ unexpectedPayload: "not allowed" });
  await preview.sendMessage({ sessionToken: "stale" });
  await preview.sendMessage({ type: "focus-exit", direction: "arbitrary-selector" });
  await preview.expectDefaults();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await preview.sendMessage({});
  await expect(page.getByRole("alert")).toContainText("component preview is unavailable");
  await preview.retry();
  await preview.expectDefaults();
  expect(await preview.token()).not.toBe(oldToken);
  await preview.sendMessage({ sessionToken: oldToken });
  await preview.expectDefaults();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

for (const invalidManifest of [null, { ...previewManifest, revision: "2" }]) {
test(`a ${invalidManifest ? "wrong-revision" : "missing"} manifest never loads a generic preview`, async ({ page }) => {
  await mockPreviewDetails(page, invalidManifest);
  const discovery = new DiscoveryPage(page);
  const preview = new PreviewPage(page);
  await discovery.goto();
  await discovery.openFramework("Atlas");
  await preview.openComponents();
  await expect(page.getByText("Component previews are unavailable for this framework revision.")).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(0);
});
}
