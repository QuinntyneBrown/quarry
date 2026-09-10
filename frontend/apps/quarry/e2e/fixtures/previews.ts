import type { Page } from "@playwright/test";
import { catalogResponse } from "./catalog";

export const previewManifest = {
  frameworkId: catalogResponse.items[0].id, revision: "1",
  previewUri: "http://localhost:4180/bundles/illustrative-v1/index.html",
  componentIds: ["profile-controls"], buildId: "illustrative-v1", protocolVersion: 1, isIllustrative: true
};

export async function mockPreviewDetails(page: Page, manifest: unknown = previewManifest) {
  const mutations: string[] = [];
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const request = route.request();
    if (request.method() !== "GET") {
      mutations.push(request.url());
      await route.fulfill({ status: 403 });
      return;
    }
    const path = new URL(request.url()).pathname;
    if (path === "/api/frameworks") await route.fulfill({ json: catalogResponse });
    else if (path === `/api/frameworks/${catalogResponse.items[0].id}`)
      await route.fulfill({ json: { summary: catalogResponse.items[0], capabilities: [], useCases: [],
        components: [{ id: "profile-controls", name: "Illustrative profile controls", description: "Text, switch, save and reset." }],
        previewManifest: manifest } });
    else throw new Error(`Unexpected API read: ${path}`);
  });
  return mutations;
}

export async function capturePreviewHandshake(page: Page) {
  await page.addInitScript(() => {
    window.addEventListener("message", event => {
      if (window !== window.top && event.source === parent && event.data?.type === "init")
        (window as Window & { previewTestHandshake?: Record<string, unknown> }).previewTestHandshake = event.data;
    });
  });
}

export async function failFirstPreviewInitialization(page: Page) {
  let scripts = 0;
  await page.route("http://localhost:4180/bundles/illustrative-v1/preview.js", async route => {
    if (++scripts === 1) await route.fulfill({ contentType: "text/javascript", headers: { "Access-Control-Allow-Origin": "*" }, body: "void 0;" });
    else await route.continue();
  });
}
