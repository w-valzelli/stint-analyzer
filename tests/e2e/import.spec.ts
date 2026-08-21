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

test('keeps the mobile file controls inside the dropzone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await waitForImporter(page);

  const dropzone = page.locator('.calibration-dropzone');
  const bounds = await dropzone.boundingBox();
  const iconBounds = await dropzone.locator('svg').boundingBox();
  const buttonBounds = await page.getByRole('button', { name: 'Choose files' }).boundingBox();

  expect(bounds).not.toBeNull();
  expect(iconBounds).not.toBeNull();
  expect(buttonBounds).not.toBeNull();
  expect(iconBounds!.x).toBeGreaterThanOrEqual(bounds!.x);
  expect(iconBounds!.x + iconBounds!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width);
  expect(buttonBounds!.x).toBeGreaterThanOrEqual(bounds!.x);
  expect(buttonBounds!.x + buttonBounds!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width);
});

test('registers a Garage 61 workbook and shows detected source facts', async ({ page }) => {
  await page.goto('./');
  await waitForImporter(page);
  await page.locator('input[type="file"]').setInputFiles(fixture);

  await expect(page.getByText('File information')).toBeVisible();
  await expect(page.getByText('Driver name')).not.toBeVisible();
  await expect(page.getByText('Track', { exact: true })).not.toBeVisible();
  await expect(page.getByText('Car', { exact: true })).not.toBeVisible();
  await page.getByText('File information').click();
  await expect(
    page.locator('.calibration-intro .calibration-sheet').getByText('Alice', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Driver name')).toBeVisible();
  await expect(page.getByText('Track', { exact: true })).toBeVisible();
  await expect(page.getByText('Car', { exact: true })).toBeVisible();
  await expect(page.getByText('Ready', { exact: true })).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'Source files', exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: `Remove ${path.basename(fixture)}` }),
  ).toBeVisible();
  await expect(page.getByText('Source files required')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Reset source files' })).not.toBeVisible();

  await page.getByRole('button', { name: `Remove ${path.basename(fixture)}` }).click();
  await expect(page.getByText('Driver name')).not.toBeVisible();
});

test('reports an unrelated workbook without crashing', async ({ page }) => {
  await page.goto('./');
  await waitForImporter(page);
  await page.locator('input[type="file"]').setInputFiles(invalidFixture);

  await expect(page.getByText('Needs attention')).toBeVisible();
  await expect(page.getByText(/not a Garage 61 export/i)).toBeVisible();
});

test('identifies and removes a duplicate row independently', async ({ page }) => {
  await page.goto('./');
  await waitForImporter(page);
  await page.locator('input[type="file"]').setInputFiles([fixture, fixture]);

  await expect(page.getByText('Not imported')).toBeVisible();
  await expect(page.getByText(/same file bytes appear more than once/i)).toBeVisible();
  const removeButtons = page.getByRole('button', {
    name: `Remove ${path.basename(fixture)}`,
  });
  await expect(removeButtons).toHaveCount(2);
  await removeButtons.last().click();
  await expect(page.getByText(/same file bytes appear more than once/i)).not.toBeVisible();
  await expect(removeButtons).toHaveCount(1);
});
