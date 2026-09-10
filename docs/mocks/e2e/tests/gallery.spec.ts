// Design artifact verification
// Traces to: L2-038, L2-039
// Description: Offline mock discovery, preview and selection journeys; not production acceptance evidence.
import { test, expect } from "../fixtures/quarry";
import { projectQueries as queries } from "../fixtures/projects";

test("project intent finds ranked frameworks without literal catalog wording", async ({
  quarry,
}) => {
  await quarry.searchWithEnter(queries.practice);
  await expect(quarry.cards).toHaveCount(3);
  await expect(quarry.cards.first()).toHaveAccessibleName(
    "Explore Cornerstone",
  );
  await expect(quarry.resultTitle).toContainText(queries.practice);
  await expect(
    quarry.page.getByRole("article", { name: "Cornerstone framework" }),
  ).toContainText("support practice management");
  const resultNames = await quarry.cards.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("aria-label")),
  );
  await quarry.searchFor(queries.relatedPractice);
  await expect(quarry.cards).toHaveCount(3);
  expect(
    await quarry.cards.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("aria-label")),
    ),
  ).toEqual(resultNames);
});

test("different project examples produce relevant recommendations", async ({
  quarry,
}) => {
  await quarry.useExample(queries.commerce);
  await expect(quarry.cards.first()).toHaveAccessibleName("Explore Mango");
  await expect(
    quarry.page.getByRole("article", { name: "Mango framework" }),
  ).toContainText("checkout");
  await quarry.useExample(queries.analytics);
  await expect(quarry.cards.first()).toHaveAccessibleName("Explore Orbit");
  await expect(
    quarry.page.getByRole("article", { name: "Orbit framework" }),
  ).toContainText("support business intelligence");
});

test("technology filtering keeps relevant matches and discovery state", async ({
  quarry,
}) => {
  await quarry.searchFor(queries.practice);
  await quarry.filterTechnology("React");
  await expect(quarry.cards).toHaveCount(1);
  await expect(quarry.cards.first()).toHaveAccessibleName("Explore Form");
  await quarry.open("Form");
  await expect(
    quarry.dialog.getByRole("list", { name: "Framework tags" }),
  ).toContainText("Intake forms");
  await expect(quarry.dialog).toContainText("Why it fits your project");
  await quarry.close();
  await expect(quarry.search).toHaveValue(queries.practice);
  await expect(quarry.cards).toHaveCount(1);
  await expect(quarry.cards.first()).toBeFocused();
  await quarry.filterTechnology("All technologies");
  await expect(quarry.cards.first()).toHaveAccessibleName(
    "Explore Cornerstone",
  );
});

test("unmatched projects and incompatible filters have honest recovery states", async ({
  quarry,
}) => {
  await quarry.searchFor(queries.unknown);
  await expect(quarry.cards).toHaveCount(0);
  await expect(
    quarry.page.getByRole("heading", {
      name: "No recommendations in this sample catalog",
    }),
  ).toBeVisible();
  await quarry.resetResults();
  await expect(quarry.cards).toHaveCount(8);
  await quarry.useExample(queries.practice);
  await quarry.filterTechnology("Web Components");
  await expect(quarry.cards).toHaveCount(0);
  await quarry.resetResults();
  await expect(quarry.cards).toHaveCount(8);
  await quarry.searchFor("   ");
  await expect(quarry.cards).toHaveCount(8);
  await quarry.searchFor("  ANGULAR  ");
  await expect(quarry.cards.first()).toHaveAccessibleName(
    "Explore Cornerstone",
  );
  await quarry.clearSearch();
  await expect(quarry.cards).toHaveCount(8);
});

test("component controls, keyboard tabs, Escape, and search shortcut work", async ({
  quarry,
}) => {
  await quarry.open("Form");
  await quarry.tryComponents();
  await quarry.dismissWithEscape();
  await expect(
    quarry.page.getByRole("button", { name: "Explore Form", exact: true }),
  ).toBeFocused();
  await quarry.focusSearchWithShortcut();
});

test("selection uses capabilities and can be replaced or cleared without a color step", async ({
  quarry,
}) => {
  await quarry.useExample(queries.practice);
  await quarry.open("Cornerstone");
  await expect(quarry.dialog).toContainText(
    "Every framework can be themed and skinned during implementation.",
  );
  await expect(
    quarry.dialog.getByRole("tab", { name: "Design tokens" }),
  ).toHaveCount(0);
  await quarry.select("Cornerstone");
  await quarry.close();
  await expect(quarry.selection).toContainText("Cornerstone");
  await quarry.useExample(queries.commerce);
  await quarry.open("Mango");
  await quarry.select("Mango");
  await quarry.close();
  await expect(quarry.selection).toContainText("Mango");
  await expect(quarry.selection).not.toContainText("Cornerstone");
  await quarry.reviewSelection();
  await expect(quarry.dialog).toContainText("Mango");
  await quarry.close();
  await quarry.clearSelection();
  await expect(quarry.selection).toHaveCount(0);
});

test("focused search, recommendations, and details fit the viewport", async ({
  quarry,
}, testInfo) => {
  await quarry.checkLayout();
  await quarry.page.screenshot({
    path: testInfo.outputPath("browse.png"),
    fullPage: true,
  });
  await quarry.useExample(queries.practice);
  await quarry.checkLayout();
  await quarry.page.screenshot({
    path: testInfo.outputPath("recommendations.png"),
    fullPage: true,
  });
  await quarry.open("Cornerstone");
  await quarry.checkLayout();
  await quarry.page.screenshot({ path: testInfo.outputPath("details.png") });
});
