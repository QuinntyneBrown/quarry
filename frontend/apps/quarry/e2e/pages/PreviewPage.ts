import { expect, type Page } from "@playwright/test";

export class PreviewPage {
  public constructor(private readonly page: Page) {}
  public get frame() { return this.page.frameLocator('iframe[title="Atlas component preview"]'); }
  public async openComponents() { await this.page.getByRole("tab", { name: "Components" }).click(); }
  public async editAndSave(name: string) {
    await this.frame.getByLabel("Display name").fill(name);
    await this.frame.getByLabel("Email notifications").uncheck();
    await this.frame.getByRole("button", { name: "Save changes" }).click();
  }
  public async reset() { await this.frame.getByRole("button", { name: "Reset", exact: true }).click(); }
  public async expectDefaults() {
    await expect(this.frame.getByLabel("Display name")).toBeEnabled();
    await expect(this.frame.getByLabel("Display name")).toHaveValue("Jamie");
    await expect(this.frame.getByLabel("Email notifications")).toBeChecked();
  }
  public async escape() { await this.frame.getByLabel("Display name").press("Escape"); }
  public async exitBackward() { await this.frame.getByLabel("Display name").press("Shift+Tab"); }
  public async exitForward() { await this.frame.getByRole("button", { name: "Reset", exact: true }).press("Tab"); }
  public async retry() { await this.page.getByRole("button", { name: "Retry preview" }).click(); }
  public async token() {
    return this.frame.locator("body").evaluate(() => String((window as Window & { previewTestHandshake?: Record<string, unknown> }).previewTestHandshake?.sessionToken));
  }
  public async sendMessage(changes: Record<string, unknown>) {
    await this.frame.locator("body").evaluate((_body, values) => {
      const initial = (window as Window & { previewTestHandshake?: Record<string, unknown> }).previewTestHandshake;
      parent.postMessage({ ...initial, type: "failure", ...values }, "*");
    }, changes);
  }
  public async sendFromWrongWindow(token: string) {
    await this.page.evaluate(sessionToken => window.postMessage({ type: "failure", sessionToken, protocolVersion: 1 }, "*"), token);
  }
  public async enterWithTab() {
    await this.page.getByRole("tab", { name: "Components" }).focus();
    await this.page.keyboard.press("Tab");
  }
  public async probeIsolation(parentOrigin: string) {
    return this.frame.locator("body").evaluate(async (_body, origin) => {
      let parentBlocked = false, cookieBlocked = false, storageBlocked = false, networkBlocked = false, navigationBlocked = false;
      try { void parent.document.body; } catch { parentBlocked = true; }
      try { void document.cookie; } catch { cookieBlocked = true; }
      try { void localStorage.length; } catch { storageBlocked = true; }
      try { await fetch(origin + "/api/maintenance/frameworks", { method: "POST", credentials: "include", body: "{}" }); } catch { networkBlocked = true; }
      try { top!.location.href = origin + "/unexpected-preview-navigation"; } catch { navigationBlocked = true; }
      return { parentBlocked, cookieBlocked, storageBlocked, networkBlocked, navigationBlocked };
    }, parentOrigin);
  }
}
