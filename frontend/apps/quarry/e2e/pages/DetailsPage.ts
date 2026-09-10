import { expect, type Page } from "@playwright/test";

export class DetailsPage {
  public constructor(private readonly page: Page) {}
  public get dialog() { return this.page.getByRole("dialog"); }
  public async close() { await this.dialog.getByRole("button", { name: "Close details" }).click(); }
  public async clickContent() { await this.dialog.getByRole("heading", { level: 2 }).click(); }
  public async clickBackdrop() { await this.page.mouse.click(2, 2); }
  public async scrollDiscoveryToFramework(name: string) {
    await this.page.getByRole("button", { name: `Explore ${name}` }).scrollIntoViewIfNeeded();
    return this.scrollPosition();
  }
  public async scrollPosition() { return this.page.evaluate(() => window.scrollY); }
  public async tryScrollingBackground() {
    await this.page.mouse.move(2, 2);
    await this.page.mouse.wheel(0, 600);
    // Observe browser wheel processing rather than an implementation-specific overflow style.
    await this.page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  }
  public async tryFocusingBackground() { await this.page.locator("#project-description").evaluate(element => (element as HTMLInputElement).focus()); }
  public async expectFocusInside() {
    await expect.poll(() => this.dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  }
  public async expectFitsViewport() {
    const bounds = await this.dialog.boundingBox();
    const viewport = await this.page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0); expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
    await expect(this.dialog.getByRole("button", { name: "Close details" })).toBeVisible();
  }
}
