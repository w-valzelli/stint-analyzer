import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';

const fixture = path.resolve('tests/fixtures/garage61-session.xlsx');
const invalidFixture = path.resolve('tests/fixtures/not-garage61.xlsx');

async function waitForImporter(page: Page) {
  await expect(page.locator('.calibration-import-register')).toHaveAttribute(
    'data-hydrated',
    'true',
  );
  await expect(page.getByRole('button', { name: 'Choose files' })).toBeEnabled();
}

test('registers a Garage 61 workbook and shows detected source facts', async ({ page }) => {
  await page.goto('./');
  await waitForImporter(page);
  await page.locator('input[type="file"]').setInputFiles(fixture);

  await expect(page.getByText('Registered', { exact: true })).toBeVisible();
  await expect(page.getByText('Alice · 2 sectors · 2 full timed laps')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Source register ready' })).toBeVisible();
  await expect(page.getByText('Source files required')).not.toBeVisible();
});

test('reports an unrelated workbook without crashing', async ({ page }) => {
  await page.goto('./');
  await waitForImporter(page);
  await page.locator('input[type="file"]').setInputFiles(invalidFixture);

  await expect(page.getByText('Needs attention')).toBeVisible();
  await expect(page.getByText(/not a Garage 61 export/i)).toBeVisible();
});

test('identifies duplicate bytes in one selection', async ({ page }) => {
  await page.goto('./');
  await waitForImporter(page);
  await page.locator('input[type="file"]').setInputFiles([fixture, fixture]);

  await expect(page.getByText('Not imported')).toBeVisible();
  await expect(page.getByText(/same file bytes appear more than once/i)).toBeVisible();
});
