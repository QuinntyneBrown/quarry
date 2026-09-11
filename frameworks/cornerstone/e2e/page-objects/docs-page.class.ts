import AxeBuilder from '@axe-core/playwright';
import { expect, Page } from '@playwright/test';

export class DocsPage {
  constructor(private readonly page: Page) {}
  async verifyAccessibleCatalog(): Promise<void> {
    await this.page.goto('/');

    await expect(this.page).toHaveURL(/\/components\/categories$/);
    await expect(this.page.locator('html')).toHaveClass(/cs-theme-dark/);
    await expect(this.page.getByRole('heading', { name: 'Components', exact: true })).toBeVisible();
    await expect(this.page.locator('.component-nav nav a')).toHaveCount(148);
    await expect(this.page.locator('.component-grid > a')).toHaveCount(148);

    const results = await new AxeBuilder({ page: this.page }).analyze();
    expect(
      results.violations.filter((violation) =>
        ['critical', 'serious'].includes(violation.impact ?? ''),
      ),
    ).toEqual([]);

    await this.page.getByRole('button', { name: 'Light theme' }).click();
    await expect(this.page.locator('html')).toHaveClass(/cs-theme-light/);
    const lightResults = await new AxeBuilder({ page: this.page }).analyze();
    expect(
      lightResults.violations.filter((violation) =>
        ['critical', 'serious'].includes(violation.impact ?? ''),
      ),
    ).toEqual([]);
  }
  async verifyBadgeControlsAndSource(): Promise<void> {
    await this.page.goto('/components/badge/examples');

    const tone = this.page.getByRole('combobox', { name: /^tone\b/i });
    await expect(tone).toHaveValue('neutral');
    await tone.selectOption('success');
    await expect(this.page.locator('.preview-stage cs-badge')).toHaveClass(/cs-tone--success/);

    await this.page.getByRole('button', { name: 'Source' }).click();
    await expect(this.page.getByRole('tab', { name: 'HTML' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(this.page.locator('.source-view code')).toContainText('<ng-content />');
    await this.page.getByRole('tab', { name: 'TS' }).click();
    await expect(this.page.locator('.source-view code')).toContainText(
      'export class BadgeComponent',
    );

    await this.page.getByRole('link', { name: 'api', exact: true }).click();
    await expect(this.page.getByRole('heading', { name: 'API reference for Badge' })).toBeVisible();
    await expect(this.page.locator('.api-page')).toContainText("Default: 'neutral'");
    await expect(this.page.locator('.api-page')).toContainText(
      "'neutral' | 'success' | 'warning' | 'error' | 'info' | 'lime'",
    );
  }
  async verifyEveryComponentRoute(): Promise<void> {
    await this.page.goto('/components/categories');

    const catalog = (await (await this.page.request.get('/generated/api.json')).json()) as {
      components: { slug: string; label: string; selector: string }[];
    };
    const failures: string[] = [];
    this.page.on('pageerror', (error) => failures.push(error.message));
    this.page.on('console', (message) => {
      if (message.type() === 'error') failures.push(message.text());
    });
    expect(catalog.components).toHaveLength(148);
    for (const component of catalog.components) {
      await this.page
        .locator('.component-nav')
        .getByRole('link', { name: component.label, exact: true })
        .click();
      await expect(this.page.locator('.component-header h1')).toHaveText(component.label);
      await expect(this.page.locator('.preview-stage').locator(component.selector)).toBeAttached();
      await expect(this.page.locator('.render-error')).toHaveCount(0);
    }
    expect(failures).toEqual([]);
  }
  async verifyMobileCatalog(): Promise<void> {
    await this.page.setViewportSize({ width: 390, height: 844 });
    await this.page.goto('/components/categories');
    await expect(this.page.getByLabel('Find a component')).toBeVisible();
    await expect(this.page.locator('body')).toHaveJSProperty('scrollWidth', 390);
    await this.page.getByLabel('Find a component').fill('badge');
    await expect(this.page.locator('.component-nav nav a')).toHaveCount(2);
  }
}
