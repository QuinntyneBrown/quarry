import { expect, type Page } from "@playwright/test";

export class LayoutPage {
  public constructor(private readonly page: Page) {}

  public async captureLayout(path: string): Promise<void> {
    await this.page.screenshot({ path, fullPage: await this.page.getByRole("dialog").count() === 0 });
  }

  public async expectNoHorizontalOverflow(): Promise<void> {
    expect(await this.page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    const dialog = this.page.getByRole("dialog");
    if (await dialog.count()) expect(await dialog.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
  }

  public async expectReducedMotion(): Promise<void> {
    const moving = await this.page.evaluate(() => Array.from(document.querySelectorAll("*")).filter(element => {
      const style = getComputedStyle(element);
      return style.animationDuration.split(",").some(value => parseFloat(value) > 0)
        || style.transitionDuration.split(",").some(value => parseFloat(value) > 0)
        || style.scrollBehavior === "smooth";
    }).map(element => element.tagName));
    expect(moving).toEqual([]);
  }

  public async expectDialogActionsReachable(): Promise<void> {
    const buttons = this.page.getByRole("dialog").getByRole("button");
    for (const button of await buttons.all()) {
      await button.scrollIntoViewIfNeeded();
      await button.click({ trial: true });
    }
  }

  public async expectColumns(columns: number, count: number): Promise<void> {
    const cards = this.page.getByRole("article");
    await expect(cards).toHaveCount(count);
    const tops = await cards.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().top));
    expect(tops.filter(top => Math.abs(top - tops[0]) < 2)).toHaveLength(columns);
  }

  public async expectMobileSubmitRow(): Promise<void> {
    const input = (await this.page.getByLabel("What are you building?").boundingBox())!;
    const submit = (await this.page.getByRole("button", { name: "Find frameworks" }).boundingBox())!;
    expect(submit.y).toBeGreaterThanOrEqual(input.y + input.height);
    expect(Math.abs(submit.x - input.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(submit.width - input.width)).toBeLessThanOrEqual(1);
  }

  public async expectControlTargets(): Promise<void> {
    const dialog = this.page.getByRole("dialog");
    const scope = await dialog.count() ? dialog : this.page.locator("body");
    const sizes = await scope.locator("button:visible, input:visible, select:visible").evaluateAll(elements => elements.map(element => {
      const box = element.getBoundingClientRect();
      return { label: element.textContent || element.getAttribute("aria-label") || element.id, width: box.width, height: box.height };
    }));
    for (const size of sizes) {
      expect(size.width, size.label ?? "Control width").toBeGreaterThanOrEqual(24);
      expect(size.height, size.label ?? "Control height").toBeGreaterThanOrEqual(24);
    }
  }

  public async useSkipLink(): Promise<void> {
    await this.page.keyboard.press("Tab");
    const skip = this.page.getByRole("link", { name: "Skip to frameworks" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await skip.press("Enter");
    await expect(this.page.getByRole("heading", { name: "Framework results" })).toBeFocused();
  }

  public async cycleTabs(): Promise<void> {
    const overview = this.page.getByRole("tab", { name: "Overview" });
    const components = this.page.getByRole("tab", { name: "Components" });
    await overview.focus();
    for (const key of ["ArrowRight", "ArrowLeft"]) {
      await overview.press(key);
      await expect(components).toBeFocused();
      await expect(components).toHaveAttribute("aria-selected", "true");
      await components.press(key);
      await expect(overview).toBeFocused();
      await expect(overview).toHaveAttribute("aria-selected", "true");
    }
    await overview.press("End");
    await expect(components).toBeFocused();
    await components.press("Home");
    await expect(overview).toBeFocused();
  }

  public async showComponents(): Promise<void> {
    await this.page.getByRole("tab", { name: "Components" }).click();
  }

  public async activateLastCardAboveSelection(): Promise<void> {
    const button = this.page.getByRole("article").last().getByRole("button");
    await button.scrollIntoViewIfNeeded();
    await button.click({ trial: true });
  }
}
