export class QuarryDemoPage {
  constructor(page) { this.page = page; }
  async search(query) {
    await this.page.getByLabel('What are you building?').fill(query);
    await this.page.getByRole('button', { name: 'Find frameworks', exact: true }).click();
  }
  async filter(technology) { await this.page.getByLabel('Technology', { exact: true }).selectOption(technology); }
  async openFirst() { await this.page.getByRole('button', { name: /^Explore / }).first().click(); }
  async select() { await this.page.getByRole('dialog').getByRole('button', { name: /^Select / }).click(); }
  async close() { await this.page.getByRole('button', { name: 'Close details', exact: true }).click(); }
  async review() { await this.page.getByRole('button', { name: 'Review selection', exact: true }).click(); }
  async clearSelection() { await this.page.getByRole('button', { name: 'Clear selected framework', exact: true }).click(); }
  async clearSearch() { await this.page.getByRole('button', { name: 'Clear search', exact: true }).click(); }
}
