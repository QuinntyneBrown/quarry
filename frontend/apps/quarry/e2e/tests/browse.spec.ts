// Acceptance Test
// Traces to: L2-001, L2-009, L2-041
// Description: A fresh discovery page loads a mocked published catalog.
import { expect, test } from "@playwright/test";
import { catalogResponse } from "../fixtures/catalog";
import { DiscoveryPage } from "../pages/DiscoveryPage";

test("loads a published catalog before a project description is submitted", async ({ page }) => {
  await page.route("**/api/frameworks**", async (route) => {
    await route.fulfill({ json: catalogResponse });
  });
  const discovery = new DiscoveryPage(page);
  await discovery.goto();
  await discovery.expectCatalog();
});

test("submits a trimmed project description only when requested", async ({ page }) => {
  await page.route("**/api/frameworks**", async (route) => {
    await route.fulfill({ json: catalogResponse });
  });
  await page.route("**/api/framework-searches", async (route) => {
    await route.fulfill({ json: { items: [], catalogRevision: "1", isIndexIncomplete: false } });
  });
  const discovery = new DiscoveryPage(page);
  await discovery.goto();
  await discovery.submitProject("  Animal Hospital  ");
  await discovery.expectSubmittedProject("Animal Hospital");
});

test("examples submit the current project and the shortcut focuses search", async ({ page }) => {
  await page.route("**/api/frameworks**", async (route) => {
    await route.fulfill({ json: catalogResponse });
  });
  await page.route("**/api/framework-searches", async (route) => {
    await route.fulfill({ json: { items: [], catalogRevision: "1", isIndexIncomplete: false } });
  });
  const discovery = new DiscoveryPage(page);
  await discovery.goto();
  await discovery.useExample("Animal Hospital");
  await discovery.expectSubmittedProject("Animal Hospital");
  await discovery.focusSearchWithShortcut();
});

test("clear search returns to browse mode and focuses the project field", async ({ page }) => {
  await page.route("**/api/frameworks**", async (route) => {
    await route.fulfill({ json: catalogResponse });
  });
  await page.route("**/api/framework-searches", async (route) => {
    await route.fulfill({ json: { items: [], catalogRevision: "1", isIndexIncomplete: false } });
  });
  const discovery = new DiscoveryPage(page);
  await discovery.goto();
  await discovery.submitProject("Animal Hospital");
  await discovery.clearSearch();
  await discovery.expectBrowseMode();
  await discovery.focusSearchWithShortcut();
});

test("technology filtering reloads the current browse catalog", async ({ page }) => {
  const requestedTechnologies: string[] = [];
  await page.route("**/api/frameworks**", async (route) => {
    requestedTechnologies.push(new URL(route.request().url()).searchParams.get("technology") ?? "All technologies");
    await route.fulfill({ json: catalogResponse });
  });
  const discovery = new DiscoveryPage(page);
  await discovery.goto();
  await discovery.filterTechnology("React");
  await expect.poll(() => requestedTechnologies).toContain("React");
});

test("a submitted project includes its selected technology", async ({ page }) => {
  let submittedTechnology: string | undefined;
  await page.route("**/api/frameworks**", async (route) => {
    await route.fulfill({ json: catalogResponse });
  });
  await page.route("**/api/framework-searches", async (route) => {
    submittedTechnology = JSON.parse(route.request().postData() ?? "{}").technology;
    await route.fulfill({ json: { items: [], catalogRevision: "1", isIndexIncomplete: false } });
  });
  const discovery = new DiscoveryPage(page);
  await discovery.goto();
  await discovery.filterTechnology("React");
  await discovery.submitProject("Animal Hospital");
  await expect.poll(() => submittedTechnology).toBe("React");
});

test("the project description field limits input to 500 characters", async ({ page }) => {
  await page.route("**/api/frameworks**", async (route) => {
    await route.fulfill({ json: catalogResponse });
  });
  const discovery = new DiscoveryPage(page);
  await discovery.goto();
  await page.getByLabel("What are you building?").fill("a".repeat(501));
  await expect(page.getByLabel("What are you building?")).toHaveValue("a".repeat(500));
});

test("empty search results explain recovery and allow a browse reset", async ({ page }) => {
  await page.route("**/api/frameworks**", async (route) => {
    await route.fulfill({ json: catalogResponse });
  });
  await page.route("**/api/framework-searches", async (route) => {
    await route.fulfill({ json: { items: [], catalogRevision: "1", isIndexIncomplete: false } });
  });
  const discovery = new DiscoveryPage(page);
  await discovery.goto();
  await discovery.submitProject("unknown project");
  await expect(page.getByRole("heading", { name: "No matching frameworks" })).toBeVisible();
  await discovery.resetBrowse();
  await discovery.expectBrowseMode();
});

test("a framework card opens published details in a dialog", async ({ page }) => {
  await page.route("**/api/frameworks?*", async (route) => {
    await route.fulfill({ json: catalogResponse });
  });
  await page.route("**/api/frameworks", async (route) => {
    await route.fulfill({ json: catalogResponse });
  });
  await page.route("**/api/frameworks/3a23bcd2-2b42-492d-a95e-1dd1e3e3cc3f", async (route) => {
    await route.fulfill({ json: { summary: catalogResponse.items[0] } });
  });
  const discovery = new DiscoveryPage(page);
  await discovery.goto();
  await discovery.openFramework("Atlas");
  await expect(page.getByRole("dialog", { name: "Atlas details" })).toContainText("Published framework");
});

test("Escape closes details and restores the opening card focus", async ({ page }) => {
  await page.route("**/api/frameworks", async (route) => {
    await route.fulfill({ json: catalogResponse });
  });
  await page.route("**/api/frameworks/3a23bcd2-2b42-492d-a95e-1dd1e3e3cc3f", async (route) => {
    await route.fulfill({ json: { summary: catalogResponse.items[0] } });
  });
  const discovery = new DiscoveryPage(page);
  await discovery.goto();
  await discovery.openFramework("Atlas");
  await expect(page.getByRole("dialog", { name: "Atlas details" })).toBeVisible();
  await discovery.dismissDetailsWithEscape();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Explore Atlas" })).toBeFocused();
});

test("selecting a framework keeps a visible selection summary", async ({ page }) => {
  await page.route("**/api/frameworks", async (route) => {
    await route.fulfill({ json: catalogResponse });
  });
  await page.route("**/api/frameworks/3a23bcd2-2b42-492d-a95e-1dd1e3e3cc3f", async (route) => {
    await route.fulfill({ json: { summary: catalogResponse.items[0] } });
  });
  const discovery = new DiscoveryPage(page);
  await discovery.goto();
  await discovery.openFramework("Atlas");
  await expect(page.getByRole("dialog", { name: "Atlas details" })).toBeVisible();
  await discovery.selectFramework();
  await expect(page.getByRole("status")).toContainText("Atlas selected");
});

test("a selected framework can be cleared without resetting discovery", async ({ page }) => {
  await page.route("**/api/frameworks", async (route) => {
    await route.fulfill({ json: catalogResponse });
  });
  await page.route("**/api/frameworks/3a23bcd2-2b42-492d-a95e-1dd1e3e3cc3f", async (route) => {
    await route.fulfill({ json: { summary: catalogResponse.items[0] } });
  });
  const discovery = new DiscoveryPage(page);
  await discovery.goto();
  await discovery.openFramework("Atlas");
  await expect(page.getByRole("dialog", { name: "Atlas details" })).toBeVisible();
  await discovery.selectFramework();
  await discovery.clearSelection();
  await expect(page.getByRole("status")).toHaveCount(0);
  await discovery.expectCatalog();
});

test("a catalog failure preserves discovery and offers an explicit retry", async ({ page }) => {
  let attempts = 0;
  await page.route("**/api/frameworks", async (route) => {
    attempts += 1;
    if (attempts <= 2) {
      await route.fulfill({ status: 503 });
      return;
    }
    await route.fulfill({ json: catalogResponse });
  });
  const discovery = new DiscoveryPage(page);
  await discovery.goto();
  await expect(page.getByRole("alert")).toContainText("catalog is unavailable");
  await discovery.retry();
  await discovery.expectCatalog();
});

test("a pending catalog load exposes a loading status", async ({ page }) => {
  await page.route("**/api/frameworks", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    await route.fulfill({ json: catalogResponse });
  });
  await page.goto("/");
  await expect(page.getByRole("status")).toContainText("Loading frameworks");
  await expect(page.getByRole("article")).toHaveCount(1);
});
