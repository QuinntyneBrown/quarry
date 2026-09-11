// Traces to: L2-190, L2-191, L2-192, L2-193
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { EventComponentsPage } from '../page-objects/event-components-page.class';

test('countdown expires and raffle reveal supports stopping, fallback, and late arrivals', async ({
  page,
}) => {
  const fixture = new EventComponentsPage(page);
  await fixture.open();
  await expect(page.getByRole('timer')).toContainText('01');
  await page.getByRole('button', { name: 'Reveal result' }).click();
  await expect(page.locator('cs-countdown')).toContainText('The countdown is complete.');
  await expect(fixture.raffle.getByRole('heading', { name: 'Ada' })).toBeVisible();
  await expect(fixture.raffle.locator('.particles')).toBeVisible();
  await fixture.raffle.getByRole('button', { name: 'Stop effects' }).click();
  await expect(fixture.raffle.locator('.particles')).toHaveCount(0);
  await page.getByRole('button', { name: 'Load past draw' }).click();
  await expect(fixture.raffle.getByRole('heading', { name: 'Grace' })).toBeVisible();
  await expect(fixture.raffle.locator('.particles')).toHaveCount(0);
});

test('review dialog traps focus, restores focus, and emits one dismissal', async ({ page }) => {
  const fixture = new EventComponentsPage(page);
  await fixture.open();
  const opener = page.getByRole('button', { name: 'Open review' });
  // Open with the keyboard so all engines retain the same focus restoration target.
  await opener.focus();
  await opener.press('Enter');
  await expect(fixture.dialog).toBeVisible();
  await fixture.dialog.getByRole('button', { name: 'Save review' }).focus();
  await page.keyboard.press('Tab');
  await expect(fixture.dialog.getByRole('button', { name: 'Close dialog' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(fixture.dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await expect(page.getByTestId('close-count')).toHaveText('1');
  await opener.click();
  await fixture.dialog.getByRole('button', { name: 'Save review' }).click();
  await expect(fixture.dialog).not.toBeVisible();
  await expect(page.getByTestId('close-count')).toHaveText('1');
});

test('team board provides controlled keyboard alternatives and unique IDs', async ({ page }) => {
  const fixture = new EventComponentsPage(page);
  await fixture.open();
  await fixture.board.getByLabel('Move to', { exact: true }).selectOption('b');
  await expect(page.getByTestId('move-log')).toHaveText('ada:b');
  await expect(fixture.board.getByLabel('Move to', { exact: true })).toHaveValue('a');
  await fixture.board.getByLabel('Team project', { exact: true }).first().selectOption('directory');
  await expect(page.getByTestId('assignment-log')).toHaveText('a:directory');
  await expect(fixture.board.getByLabel('Team project', { exact: true }).first()).toHaveValue('');
  await fixture.board.getByRole('button', { name: 'Create a new team' }).click();
  await expect(page.getByTestId('create-log')).toHaveText('ada');
  const ids = await page
    .locator('[id]')
    .evaluateAll((elements) => elements.map((element) => element.id));
  expect(new Set(ids).size).toBe(ids.length);
  await page.getByRole('button', { name: 'Toggle disabled' }).click();
  await expect(fixture.board.getByLabel('Move to', { exact: true })).toBeDisabled();
  await expect(fixture.board.getByRole('button', { name: 'Create a new team' })).toBeDisabled();
  await page.getByRole('button', { name: 'Toggle editing' }).click();
  await expect(fixture.board.getByRole('combobox')).toHaveCount(0);
});

test('team board drag and drop emits a move without mutating membership', async ({ page }) => {
  const fixture = new EventComponentsPage(page);
  await fixture.open();
  const handle = fixture.board.getByRole('button', { name: 'Drag participant: Ada' });
  await handle.scrollIntoViewIfNeeded();
  const source = await handle.boundingBox();
  const destination = await fixture.board.locator('.members').nth(1).boundingBox();
  expect(source).not.toBeNull();
  expect(destination).not.toBeNull();
  await page.mouse.move(source!.x + source!.width / 2, source!.y + source!.height / 2);
  await page.mouse.down();
  await page.mouse.move(source!.x + source!.width / 2 + 12, source!.y + source!.height / 2, {
    steps: 5,
  });
  await page.mouse.move(
    destination!.x + destination!.width / 2,
    destination!.y + destination!.height / 2,
    { steps: 20 },
  );
  await page.mouse.up();
  await expect(page.getByTestId('move-log')).toHaveText('ada:b');
  await expect(fixture.board.locator('.team').first()).toContainText('Ada');
});

test('reduced motion and narrow layouts remain accessible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 812 });
  const fixture = new EventComponentsPage(page);
  await fixture.open();
  await page.getByRole('button', { name: 'Reveal result' }).click();
  await expect(fixture.raffle.getByRole('heading', { name: 'Ada' })).toBeVisible();
  await expect(fixture.raffle.locator('.particles')).toHaveCount(0);
  await expect(fixture.raffle.getByRole('button', { name: 'Stop effects' })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
