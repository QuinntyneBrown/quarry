// Traces to: L2-149, L2-150, L2-151, L2-153, L2-155
import { test } from '@playwright/test';
import { DocsPage } from '../page-objects/docs-page.class';

test('lists every public component in an accessible catalog', async ({ page }) => {
  test.setTimeout(60_000);
  await new DocsPage(page).verifyAccessibleCatalog();
});

test('exposes Badge controls, source, and its actual API', async ({ page }) => {
  test.setTimeout(60_000);
  await new DocsPage(page).verifyBadgeControlsAndSource();
});

test('renders all 148 live component routes without runtime errors', async ({ page }) => {
  test.setTimeout(90_000);
  await new DocsPage(page).verifyEveryComponentRoute();
});

test('keeps the catalog usable at a narrow viewport', async ({ page }) => {
  test.setTimeout(60_000);
  await new DocsPage(page).verifyMobileCatalog();
});
