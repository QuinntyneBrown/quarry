import { expect, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";

export class ZoomPage {
  public constructor(private readonly page: Page) {}

  public async capture(path: string): Promise<void> {
    const session = await this.page.context().newCDPSession(this.page);
    try {
      const capture = await session.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      await writeFile(path, Buffer.from(capture.data, "base64"));
    } finally { await session.detach(); }
  }

  public async expectBrowserZoom(): Promise<void> {
    await expect.poll(() => this.page.evaluate(() => ({
      width: outerWidth, height: outerHeight, scale: devicePixelRatio,
      contentWidth: innerWidth, cssZoom: getComputedStyle(document.documentElement).zoom
    }))).toMatchObject({ width: 1280, height: 900, scale: 2, cssZoom: "1" });
    // Browser window borders occupy platform-specific physical pixels.
    expect(await this.page.evaluate(() => innerWidth)).toBeLessThanOrEqual(640);
  }
}
