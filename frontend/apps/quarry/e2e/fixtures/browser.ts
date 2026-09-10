import { test as base, expect, chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { ZoomPage } from "../pages/ZoomPage";

export { expect } from "@playwright/test";

export const test = base.extend({
  context: async ({ context, baseURL }, use, testInfo) => {
    if (testInfo.project.name !== "browser-zoom") { await use(context); return; }
    const extension = fileURLToPath(new URL("./browserZoom", import.meta.url));
    const zoomContext = await chromium.launchPersistentContext("", {
      channel: "chromium", headless: true, viewport: null, baseURL,
      args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`,
        "--window-size=1280,900", "--force-device-scale-factor=1"]
    });
    try {
      const worker = zoomContext.serviceWorkers()[0] ?? await zoomContext.waitForEvent("serviceworker");
      const setup = await zoomContext.newPage();
      await setup.route("**/__zoom_setup", route => route.fulfill({ contentType: "text/html", body: "<!doctype html><title>Zoom setup</title>" }));
      await setup.goto("/__zoom_setup");
      const before = await setup.evaluate(() => ({ width: outerWidth, height: outerHeight, scale: devicePixelRatio, contentWidth: innerWidth }));
      expect(before).toMatchObject({ width: 1280, height: 900, scale: 1 });
      expect(before.contentWidth).toBeGreaterThanOrEqual(1200);
      // The extension changes Chromium's per-origin browser zoom, not CSS zoom,
      // device emulation, or the page's visual/pinch viewport.
      const zoom = await worker.evaluate(`(async () => {
        const [tab] = await chrome.tabs.query({ url: "http://127.0.0.1:4173/*" });
        await chrome.tabs.setZoom(tab.id, 2);
        return chrome.tabs.getZoom(tab.id);
      })()`);
      expect(zoom).toBe(2);
      await new ZoomPage(setup).expectBrowserZoom();
      expect(await setup.evaluate(() => innerWidth)).toBeCloseTo(before.contentWidth / 2, 0);
      await setup.close();
      await use(zoomContext);
      const active = zoomContext.pages().find(page => page.url().startsWith(baseURL!));
      expect(active, "The application tab remains available for zoom verification").toBeDefined();
      await new ZoomPage(active!).expectBrowserZoom();
      const finalZoom = await worker.evaluate(`(async () => {
        const [tab] = await chrome.tabs.query({ url: "http://127.0.0.1:4173/*" });
        return chrome.tabs.getZoom(tab.id);
      })()`);
      expect(finalZoom).toBe(2);
      await testInfo.attach("browser-zoom", { contentType: "application/json", body: JSON.stringify({ before, zoom, finalZoom,
        after: await active!.evaluate(() => ({ width: outerWidth, height: outerHeight, scale: devicePixelRatio, contentWidth: innerWidth })) }) });
    } finally { await zoomContext.close(); }
  }
});
