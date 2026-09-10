import type { Page } from "@playwright/test";

export class SelectionPage {
  public constructor(private readonly page: Page) {}
  public async selectInDetails(name: string) { await this.page.getByRole("button", { name: `Select ${name}`, exact: true }).click(); }
  public async selectAgain() { await this.page.getByRole("button", { name: "Selected", exact: true }).click(); }
  public async closeDetails() { await this.page.getByRole("button", { name: "Close details" }).click(); }
}
