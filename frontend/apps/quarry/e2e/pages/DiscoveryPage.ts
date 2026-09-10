import { expect, type Page } from "@playwright/test";

export class DiscoveryPage {
  public constructor(private readonly page: Page) {}

  public async goto(): Promise<void> {
    await this.page.goto("/");
  }

  public async expectCatalog(): Promise<void> {
    await expect(this.page.getByRole("heading", { name: "Describe your project" })).toBeVisible();
    await expect(this.page.getByRole("button", { name: "Find frameworks" })).toBeVisible();
    await expect(this.page.getByRole("article")).toHaveCount(1);
  }

  public async submitProject(description: string): Promise<void> {
    await this.page.getByLabel("What are you building?").fill(description);
    await this.page.getByRole("button", { name: "Find frameworks" }).click();
  }

  public async expectSubmittedProject(description: string): Promise<void> {
    await expect(this.page.getByRole("heading", { name: `Frameworks for ${description}` })).toBeVisible();
  }

  public async useExample(description: string): Promise<void> {
    await this.page.getByRole("button", { name: description }).click();
  }

  public async focusSearchWithShortcut(): Promise<void> {
    await this.page.keyboard.press("Control+k");
    await expect(this.page.getByLabel("What are you building?")).toBeFocused();
  }

  public async clearSearch(): Promise<void> {
    await this.page.getByRole("button", { name: "Clear search" }).click();
  }

  public async expectBrowseMode(): Promise<void> {
    await expect(this.page.getByRole("heading", { name: "Describe your project" })).toBeVisible();
  }

  public async resetBrowse(): Promise<void> {
    await this.page.getByRole("button", { name: "Browse all frameworks" }).click();
  }

  public async filterTechnology(technology: string): Promise<void> {
    await this.page.getByLabel("Technology").selectOption(technology);
  }

  public async loadMore(): Promise<void> {
    await this.page.getByRole("button", { name: "Load more" }).click();
  }

  public async draftProject(description: string): Promise<void> {
    await this.page.getByLabel("What are you building?").fill(description);
  }

  public async openFramework(name: string): Promise<void> {
    await this.page.getByRole("button", { name: `Explore ${name}` }).click();
  }

  public async dismissDetailsWithEscape(): Promise<void> {
    await this.page.keyboard.press("Escape");
    await expect(this.page.getByRole("dialog")).toHaveCount(0);
  }

  public async selectFramework(): Promise<void> {
    await this.page.getByRole("dialog").getByRole("button", { name: /^Select / }).click();
    await this.page.getByRole("button", { name: "Close details" }).click();
  }

  public async clearSelection(): Promise<void> {
    await this.page.getByRole("button", { name: "Clear selected framework" }).click();
  }

  public async reviewSelection(): Promise<void> {
    await this.page.getByRole("button", { name: "Review selection" }).click();
  }

  public async retry(): Promise<void> {
    await this.page.getByRole("button", { name: "Retry" }).click();
  }
}
