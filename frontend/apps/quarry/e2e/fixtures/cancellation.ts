import type { Page } from "@playwright/test";
import { catalogResponse } from "./catalog";

export async function mockCancelableRequests(page: Page, pending: "search" | "catalog" | "details") {
  const failures: string[] = [];
  let release: () => void = () => {};
  const delayed = new Promise<void>(resolve => { release = resolve; });
  page.on("requestfailed", request => failures.push(new URL(request.url()).pathname));
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/api/framework-searches" && request.method() === "POST") {
      const body = request.postDataJSON();
      if (pending === "search" && body.query === "Slow project" && !body.technology) await delayed;
      await route.fulfill({ json: { items: catalogResponse.items, isIndexIncomplete: false, catalogRevision: "1" } });
      return;
    }
    if (url.pathname === "/api/frameworks" && request.method() === "GET") {
      if (pending === "catalog" && url.searchParams.get("technology") === "React") await delayed;
      await route.fulfill({ json: catalogResponse });
      return;
    }
    if (url.pathname === `/api/frameworks/${catalogResponse.items[0].id}` && request.method() === "GET") {
      if (pending === "details") await delayed;
      await route.fulfill({ json: { summary: catalogResponse.items[0], capabilities: [], useCases: [], components: [] } });
      return;
    }
    throw new Error(`Unexpected API request: ${request.method()} ${url.pathname}`);
  });
  return { failures, release };
}
