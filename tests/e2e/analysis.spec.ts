import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';

const fixture = path.resolve('tests/fixtures/garage61-session.xlsx');

async function waitForImporter(page: Page) {
  await expect(page.locator('.calibration-import-register')).toHaveAttribute(
    'data-hydrated',
    'true',
  );
  await expect(page.getByRole('button', { name: 'Choose files' })).toBeEnabled();
}

test('reviews the M5 analysis views from one canonical report', async ({ page }) => {
  await page.goto('./');
  await waitForImporter(page);
  await page.locator('input[type="file"]').setInputFiles(fixture);

  await page.getByRole('tab', { name: 'Overview' }).click();
  await expect(page.getByRole('heading', { name: 'Run register' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pace progression' })).toBeVisible();

  await page.getByRole('tab', { name: 'Sectors' }).click();
  await expect(page.getByRole('table', { name: 'Sector benchmark matrix' })).toBeVisible();
  await page.getByLabel('Benchmark').selectOption('average');
  await expect(page.getByText('Fastest Average')).toBeVisible();

  await page.getByRole('tab', { name: 'Consistency' }).click();
  await page.getByLabel('Metric').selectOption('mad');
  await expect(page.getByText(/selected MAD across drivers/i)).toBeVisible();

  await page.getByRole('tab', { name: 'Drivers' }).click();
  await expect(page.getByRole('heading', { name: 'Theoretical lap' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Factual observations' })).toBeVisible();

  await page.getByRole('tab', { name: 'Audit' }).click();
  await expect(page.getByRole('table', { name: 'Normalized lap audit' })).toBeVisible();
  await page.getByLabel('Filter rows').fill('Alice');
  await expect(page.getByText(/Showing \d+ of \d+ rows/)).toBeVisible();
  await page.getByRole('button', { name: /Lap time/ }).click();
});
