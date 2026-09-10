import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

export class QuarryPage {
  constructor(readonly page: Page) {}
  get cards() {
    return this.page.getByRole("button", {
      name: /^Explore (Cornerstone|Form|Pulse|Folio|Orbit|Coast|Mono|Mango)$/,
    });
  }
  get dialog() {
    return this.page.getByRole("dialog");
  }
  get search() {
    return this.page.getByRole("textbox", {
      name: "What do you want to build?",
    });
  }
  get selection() {
    return this.page.getByRole("complementary", { name: "Selected framework" });
  }
  get resultTitle() {
    return this.page.getByRole("heading", { level: 2 }).first();
  }
  async visit() {
    await this.page.goto("/");
    await expect(this.cards).toHaveCount(8);
  }
  async filterTechnology(name: string) {
    await this.page
      .getByLabel("Technology", { exact: true })
      .selectOption(name);
  }
  async searchFor(value: string) {
    await this.search.fill(value);
    await this.page
      .getByRole("button", { name: "Find frameworks", exact: true })
      .click();
  }
  async searchWithEnter(value: string) {
    await this.search.fill(value);
    await this.search.press("Enter");
  }
  async useExample(value: string) {
    await this.page.getByRole("button", { name: value, exact: true }).click();
  }
  async clearSearch() {
    await this.page
      .getByRole("button", { name: "Clear search", exact: true })
      .click();
  }
  async resetResults() {
    await this.page
      .getByRole("button", { name: "Browse all frameworks", exact: true })
      .click();
  }
  async open(name: string) {
    await this.page
      .getByRole("button", { name: `Explore ${name}`, exact: true })
      .click();
    await expect(this.dialog).toBeVisible();
  }
  async close() {
    await this.page
      .getByRole("button", { name: "Close framework details" })
      .click();
    await expect(this.dialog).toHaveCount(0);
  }
  async select(name: string) {
    await this.dialog
      .getByRole("button", { name: `Select ${name}`, exact: true })
      .click();
  }
  async tryComponents() {
    await this.dialog
      .getByRole("tab", { name: "Overview", exact: true })
      .focus();
    await this.page.keyboard.press("ArrowRight");
    await expect(
      this.dialog.getByRole("tab", { name: "Components" }),
    ).toBeFocused();
    await this.dialog
      .getByRole("textbox", { name: "Display name" })
      .fill("Alex");
    await this.dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(this.dialog.getByRole("status")).toContainText(
      "Saved for Alex",
    );
    const toggle = this.dialog.getByRole("switch", {
      name: "Email notifications",
    });
    await toggle.click();
    await expect(toggle).not.toBeChecked();
    await this.dialog
      .getByRole("button", { name: "Reset", exact: true })
      .click();
    await expect(toggle).toBeChecked();
    await expect(
      this.dialog.getByRole("textbox", { name: "Display name" }),
    ).toHaveValue("Jamie");
  }
  async dismissWithEscape() {
    await this.page.keyboard.press("Escape");
    await expect(this.dialog).toHaveCount(0);
  }
  async clearSelection() {
    await this.selection
      .getByRole("button", { name: "Clear selected framework" })
      .click();
  }
  async reviewSelection() {
    await this.selection
      .getByRole("button", { name: "View framework" })
      .click();
  }
  async focusSearchWithShortcut() {
    await this.page.keyboard.press("Control+k");
    await expect(this.search).toBeFocused();
  }
  async checkLayout() {
    const size = await this.page.evaluate(() => ({
      content: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect(size.content).toBeLessThanOrEqual(size.viewport);
  }
}
