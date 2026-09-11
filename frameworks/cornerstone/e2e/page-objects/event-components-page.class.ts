import { expect, Page } from '@playwright/test';

export class EventComponentsPage {
  constructor(readonly page: Page) {}
  get board() {
    return this.page.locator('cs-team-board').first();
  }
  get raffle() {
    return this.page.locator('cs-raffle-stage');
  }
  get dialog() {
    return this.page.getByRole('dialog', { name: 'Review changes' });
  }
  async open(): Promise<void> {
    await this.page.goto('/event-components');
    await expect(
      this.page.getByRole('heading', { name: 'Event component acceptance fixtures' }),
    ).toBeVisible();
  }
}
