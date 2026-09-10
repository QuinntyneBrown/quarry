import { expect, type Frame, type Locator, type Page } from "@playwright/test";
import type { InteractionFeedback } from "./InteractionFeedback";

export class InteractionPerformancePage {
  public constructor(private readonly page: Page) {}

  public async open(): Promise<void> {
    await this.page.goto("/");
    await expect(this.page.getByRole("article")).toHaveCount(24);
    await this.openDetails();
  }

  private async openDetails(): Promise<void> {
    await this.page.getByRole("button", { name: "Explore Illustrative framework 0001" }).click();
    await expect(this.page.getByRole("tab", { name: "Overview" })).toBeVisible();
  }

  public async measureTabs(): Promise<number[]> {
    const samples: number[] = [];
    for (let index = 0; index < 20; index++) {
      const components = index % 2 === 0;
      samples.push(await this.measure(this.page.getByRole("tab", { name: components ? "Components" : "Overview" }),
        { selector: components ? "#components-panel" : "#overview-panel" }));
      if (components) await expect(this.page.frameLocator("iframe").getByLabel("Display name")).toBeEnabled();
    }
    return samples;
  }

  public async readyPreview(): Promise<Frame> {
    await this.page.getByRole("tab", { name: "Components" }).click();
    await expect(this.page.frameLocator("iframe").getByLabel("Display name")).toBeEnabled();
    const handle = await this.page.locator("iframe").elementHandle();
    const frame = await handle!.contentFrame();
    if (!frame) throw new Error("Preview frame missing.");
    return frame;
  }

  public async measurePreview(frame: Frame): Promise<Record<string, number[]>> {
    const samples: Record<string, number[]> = { input: [], switch: [], save: [], reset: [] };
    for (let index = 0; index < 20; index++) {
      const input = frame.getByLabel("Display name");
      await input.focus();
      await input.press("End");
      samples.input.push(await this.measure(input, { selector: "#display-name", value: "Jamiex" }, frame, "x"));
      samples.switch.push(await this.measure(frame.getByLabel("Email notifications"), { selector: "#notifications", checked: false }, frame));
      samples.save.push(await this.measure(frame.getByRole("button", { name: "Save changes" }),
        { selector: "#feedback", text: "Saved for Jamiex in this preview." }, frame));
      samples.reset.push(await this.measure(frame.getByRole("button", { name: "Reset", exact: true }),
        { selector: "#feedback", text: "Preview reset." }, frame));
      await expect(input).toHaveValue("Jamie");
      await expect(frame.getByLabel("Email notifications")).toBeChecked();
    }
    return samples;
  }

  public async measureSelection(): Promise<number[]> {
    const samples: number[] = [];
    for (let index = 0; index < 10; index++) {
      if (index > 0) await this.openDetails();
      samples.push(await this.measure(this.page.getByRole("button", { name: "Select Illustrative framework 0001", exact: true }),
        { selector: "dialog .primary-button", text: "Selected" }));
      await this.page.getByRole("button", { name: "Close details" }).click();
      samples.push(await this.measure(this.page.getByRole("button", { name: "Clear selected framework" }),
        { selector: "article.framework-card:first-child:not(.card-selected)" }));
    }
    return samples;
  }

  private async measure(target: Locator, feedback: InteractionFeedback, scope: Page | Frame = this.page, key?: string): Promise<number> {
    await target.scrollIntoViewIfNeeded();
    await target.evaluate((element, configuration) => {
      const stateMatches = () => {
        const result = document.querySelector<HTMLInputElement>(configuration.feedback.selector);
        if (!result || !result.checkVisibility()) return false;
        const bounds = result.getBoundingClientRect();
        if (bounds.bottom <= 0 || bounds.top >= innerHeight || bounds.right <= 0 || bounds.left >= innerWidth) return false;
        return (configuration.feedback.text === undefined || result.textContent?.trim() === configuration.feedback.text)
          && (configuration.feedback.value === undefined || result.value === configuration.feedback.value)
          && (configuration.feedback.checked === undefined || result.checked === configuration.feedback.checked);
      };
      if (stateMatches()) throw new Error("Expected feedback already exists before input.");
      const measurement = new Promise<number>((resolve, reject) => {
        element.addEventListener(configuration.eventName, event => {
          if (!event.isTrusted) { reject(new Error("Measurement requires trusted input.")); return; }
          const deadline = setTimeout(() => reject(new Error("Visible feedback missing after two seconds.")), 2000);
          const check = () => {
            if (stateMatches()) requestAnimationFrame(() => {
              clearTimeout(deadline);
              resolve(performance.now() - event.timeStamp);
            });
            else requestAnimationFrame(check);
          };
          requestAnimationFrame(check);
        }, { once: true, capture: true });
      });
      (window as Window & { quarryInteractionMeasurement?: Promise<number> }).quarryInteractionMeasurement = measurement;
    }, { feedback, eventName: key ? "keydown" : "pointerdown" });
    if (key) await target.press(key); else await target.click();
    return scope.evaluate(() => (window as Window & { quarryInteractionMeasurement?: Promise<number> }).quarryInteractionMeasurement!);
  }
}
