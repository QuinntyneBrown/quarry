import type { Page } from "@playwright/test";

export class BrowserPerformancePage {
  public constructor(private readonly page: Page) {}

  public async measureFreshBrowse(): Promise<number> {
    // The observer starts before application scripts, so runner polling and
    // navigation's load event do not define the measured completion time.
    await this.page.addInitScript(() => {
      const result = new Promise<number>((resolve, reject) => {
        const deadline = setTimeout(() => reject(new Error("Browse did not become usable within 10 seconds.")), 10_000);
        const check = () => {
          const input = document.querySelector<HTMLInputElement>("#project-description");
          const submit = document.querySelector<HTMLButtonElement>('button[type="submit"]');
          const first = document.querySelector<HTMLElement>("article.framework-card");
          if (input && !input.disabled && submit && !submit.disabled && first
              && document.querySelectorAll("article.framework-card").length === 24
              && input.getClientRects().length && submit.getClientRects().length && first.getClientRects().length) {
            // Two animation frames give the newly rendered controls/cards a
            // paint opportunity; this is a conservative upper bound, not just DOM insertion.
            requestAnimationFrame(() => requestAnimationFrame(() => {
              clearTimeout(deadline);
              resolve(performance.now());
            }));
          } else requestAnimationFrame(check);
        };
        requestAnimationFrame(check);
      });
      (window as Window & { quarryBrowseMeasurement?: Promise<number> }).quarryBrowseMeasurement = result;
    });
    await this.page.goto("/", { waitUntil: "commit" });
    return this.page.evaluate(() => (window as Window & { quarryBrowseMeasurement?: Promise<number> }).quarryBrowseMeasurement!);
  }
}
