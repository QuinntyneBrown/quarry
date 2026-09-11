import { expect, Page } from '@playwright/test';

export class FixturePage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.clock.setFixedTime(new Date('2026-07-20T12:00:00Z'));
    await this.page.goto('/components/badge');
    await expect(this.page.getByRole('region', { name: 'Component fixture' })).toHaveAttribute(
      'data-ready',
      'true',
    );
  }

  async showComponent(slug: string, label: string): Promise<void> {
    await this.page.goto(`/components/${slug}`);
    await expect(this.page.getByTestId('fixture-heading')).toHaveText(label);
    const fixture = this.page.getByRole('region', { name: 'Component fixture' });
    await expect(fixture).toHaveAttribute('data-slug', slug);
    await expect(fixture).toHaveAttribute('data-ready', 'true');
    await expect(this.page.getByTestId('fixture-error')).toHaveCount(0);
  }

  async expectUnknownComponent(): Promise<void> {
    await this.page.goto('/components/not-a-component');
    await expect(this.page.getByRole('heading', { level: 1 })).toHaveText('Unknown component');
    await expect(this.page.getByTestId('fixture-error')).toHaveText(
      'No fixture exists for not-a-component.',
    );
    await expect(this.page.getByRole('region', { name: 'Component fixture' })).toHaveAttribute(
      'data-ready',
      'false',
    );
  }
}
