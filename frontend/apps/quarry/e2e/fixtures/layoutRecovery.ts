import type { Page } from "@playwright/test";
import { catalogResponse } from "./catalog";
import { previewManifest } from "./previews";

export async function mockLayoutRecovery(page: Page) {
  let releaseCatalog = () => {};
  let releaseDetails = () => {};
  let releasePreview = () => {};
  const catalogGate = new Promise<void>(resolve => { releaseCatalog = resolve; });
  const detailsGate = new Promise<void>(resolve => { releaseDetails = resolve; });
  const previewGate = new Promise<void>(resolve => { releasePreview = resolve; });
  let detailsCalls = 0;
  let previewCalls = 0;
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() !== "GET") throw new Error("Unexpected backend mutation");
    if (path === "/api/frameworks") {
      await catalogGate;
      await route.fulfill({ json: catalogResponse });
    } else if (path === `/api/frameworks/${catalogResponse.items[0].id}`) {
      if (++detailsCalls === 1) {
        await detailsGate;
        await route.fulfill({ status: 503 });
      } else await route.fulfill({ json: { summary: catalogResponse.items[0], capabilities: [], useCases: [],
        components: [{ id: "profile-controls", name: "Illustrative profile controls", description: "Text, switch, save and reset." }], previewManifest } });
    } else throw new Error(`Unexpected API request: ${path}`);
  });
  await page.route("http://localhost:4180/bundles/illustrative-v1/preview.js", async route => {
    if (++previewCalls > 1) { await route.continue(); return; }
    await previewGate;
    await route.fulfill({ contentType: "text/javascript", headers: { "Access-Control-Allow-Origin": "*" }, body:
      'addEventListener("message", event => { if (event.data?.type === "init") parent.postMessage({ type: "failure", protocolVersion: 1, sessionToken: event.data.sessionToken }, "*"); });' });
  });
  return { releaseCatalog, releaseDetails, releasePreview };
}
