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
  await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Leaderboard' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pace progression' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Drivers' })).toHaveText('All drivers');
  await expect(page.getByRole('tab', { name: 'Audit' })).not.toBeVisible();

  await page.getByRole('tab', { name: 'Sectors' }).click();
  const sectorsView = page.locator('.analysis-view');
  await expect(page.getByRole('table', { name: 'Sector benchmark matrix' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sectors' })).toHaveText('All sectors');
  await expect(sectorsView.getByText('Pace mode', { exact: true })).not.toBeVisible();
  await expect(
    sectorsView
      .getByRole('table', { name: 'Sector detail table' })
      .getByRole('columnheader', { name: 'Driver' }),
  ).not.toBeVisible();
  await page.getByRole('button', { name: 'Benchmark' }).click();
  await page.getByRole('option', { name: 'Average' }).click();
  await expect(page.getByRole('columnheader', { name: 'Fastest Average' })).toBeVisible();

  await page.getByRole('tab', { name: 'Consistency' }).click();
  await page.getByRole('button', { name: 'Metric' }).click();
  await page.getByRole('option', { name: 'MAD' }).click();
  await expect(page.getByText(/selected MAD across drivers/i)).toBeVisible();
  await page.getByRole('button', { name: 'Mode', exact: true }).click();
  await page.getByRole('option', { name: 'Laps' }).click();
  await expect(page.getByRole('table', { name: 'Lap consistency summary' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Worst lap' })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Consistency matrix' })).not.toBeVisible();

  await page.getByRole('tab', { name: 'Drivers' }).click();
  await expect(page.getByRole('heading', { name: 'Theoretical lap' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Factual observations' })).toBeVisible();
});
