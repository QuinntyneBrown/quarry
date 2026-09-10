import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, type TestInfo } from "@playwright/test";
import { writeFile } from "node:fs/promises";

export class AccessibilityPage {
  public constructor(private readonly page: Page) {}

  public async expectAccessible(testInfo: TestInfo, state: string): Promise<void> {
    // Review native-dialog/sticky-layer and decorative-glyph limitations with
    // direct measurements. Other incomplete findings must still fail the audit.
    const manualContrast = [];
    const result = await new AxeBuilder({ page: this.page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    const incompleteContrast = result.incomplete.filter(item => item.id === "color-contrast");
    const unresolved = [];
    for (const finding of incompleteContrast) for (const node of finding.nodes) {
      const selector = node.target.length === 1 && typeof node.target[0] === "string" ? node.target[0] : undefined;
      const graphic = selector && await this.page.locator(selector).evaluate(element => element.matches('.framework-icon[aria-hidden="true"]'));
      const solidLayer = selector && node.any.some(check => check.data?.messageKey === "elmPartiallyObscuring")
        && await this.page.locator(selector).evaluate(element => !!element.closest("dialog[open], .selection-bar"));
      if (selector && (graphic || solidLayer)) {
        const minimum = graphic ? 3 : parseFloat(node.any.find(check => check.data?.expectedContrastRatio)?.data.expectedContrastRatio ?? "4.5");
        manualContrast.push({ element: selector, minimum, ratio: await this.expectBoundaryContrast(selector, "color", "nearest-solid", minimum) });
      } else unresolved.push(node);
    }
    const reportPath = testInfo.outputPath(`accessibility-${state}.json`);
    await writeFile(reportPath, JSON.stringify({
      violations: result.violations, incompleteContrast, manualContrast, unresolved,
      textContrast: result.passes.filter(item => item.id === "color-contrast")
    }, null, 2));
    await testInfo.attach(`accessibility-${state}`, { contentType: "application/json", path: reportPath });
    expect(result.violations, `Accessibility findings in ${state}`).toEqual([]);
    expect(unresolved, `Unresolved contrast in ${state}`).toEqual([]);
  }

  public async expectBoundaryContrast(selector: string, property: string, adjacent: string, minimum = 3): Promise<number> {
    const ratio = await this.page.locator(selector).first().evaluate((element, args) => {
      const luminance = (value: string) => {
        const channels = value.match(/[\d.]+/g)!.map(Number);
        if (channels.length > 3 && channels[3] !== 1) throw new Error("Direct contrast measurement requires an opaque color.");
        const components = channels.slice(0, 3).map(number => {
          const channel = number / 255;
          return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
        });
        return components[0] * .2126 + components[1] * .7152 + components[2] * .0722;
      };
      const color = getComputedStyle(element).getPropertyValue(args.property);
      let adjacentElement = args.adjacent === "nearest-solid" ? element : document.querySelector(args.adjacent)!;
      if (args.adjacent === "nearest-solid") {
        for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) {
          const style = getComputedStyle(ancestor);
          if (style.opacity !== "1" || style.filter !== "none") throw new Error("Direct contrast cannot infer opacity or filter effects.");
        }
        while (getComputedStyle(adjacentElement).backgroundColor === "rgba(0, 0, 0, 0)") {
          if (getComputedStyle(adjacentElement).backgroundImage !== "none" || !adjacentElement.parentElement)
            throw new Error("Direct contrast requires a known solid background.");
          adjacentElement = adjacentElement.parentElement;
        }
      }
      const adjacentStyle = getComputedStyle(adjacentElement);
      if (adjacentStyle.backgroundImage !== "none") throw new Error("Direct contrast measurement requires a solid background.");
      const background = adjacentStyle.backgroundColor;
      const first = luminance(color), second = luminance(background);
      return (Math.max(first, second) + .05) / (Math.min(first, second) + .05);
    }, { property, adjacent });
    expect(ratio, `${selector} ${property}`).toBeGreaterThanOrEqual(minimum);
    return ratio;
  }

  public async focusSearchByKeyboard(): Promise<void> { await this.page.keyboard.press("Control+k"); }
}
