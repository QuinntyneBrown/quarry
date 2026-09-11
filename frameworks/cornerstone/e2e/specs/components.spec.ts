// Traces to: L2-001, L2-149, L2-150, L2-151
import { expect, test } from '@playwright/test';
import components from '../../src/e2e-app/generated/components.json';
import { FixturePage } from '../page-objects/fixture-page.class';

test('renders all public components with deterministic application fixtures', async ({ page }) => {
  test.setTimeout(120_000);
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(message.text());
  });
  const fixture = new FixturePage(page);
  await fixture.open();
  expect(components).toHaveLength(148);
  for (const component of components) await fixture.showComponent(component.slug, component.label);
  expect(failures).toEqual([]);
});

test('reports an unknown component without rendering a stale fixture', async ({ page }) => {
  await new FixturePage(page).expectUnknownComponent();
});
