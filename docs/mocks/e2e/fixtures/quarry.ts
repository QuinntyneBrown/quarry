import { test as base, expect } from "@playwright/test";
import { QuarryPage } from "../pages/QuarryPage";

export const test = base.extend<{ quarry: QuarryPage }>({
  quarry: async ({ page }, use) => {
    const errors: string[] = [];
    const backendRequests: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (/\/api\/|\/hub|signalr/i.test(request.url()))
        backendRequests.push(request.url());
    });
    // Verify the static artifact with every nonlocal request blocked (L2-038).
    await page.route("**/*", (route) => {
      const host = new URL(route.request().url()).hostname;
      return host === "127.0.0.1" ? route.continue() : route.abort();
    });
    const quarry = new QuarryPage(page);
    await quarry.visit();
    await use(quarry);
    expect(errors, "No uncaught browser errors").toEqual([]);
    expect(backendRequests, "The static mock never requests a backend").toEqual(
      [],
    );
  },
});
export { expect };
