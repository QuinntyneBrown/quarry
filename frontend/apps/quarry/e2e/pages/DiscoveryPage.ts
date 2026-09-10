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
}
