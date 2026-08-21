import { expect, test, type Download, type Page } from '@playwright/test';
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
  await page
    .getByRole('img', { name: 'Lap pace progression chart' })
    .locator('circle')
    .first()
    .hover({ force: true });
  await expect(page.locator('.analysis-chart-tooltip')).toBeVisible();
  await expect(page.locator('.analysis-chart-tooltip')).toBeInViewport();
  await expect(page.locator('.analysis-chart-tooltip').locator('..')).toHaveCSS('z-index', '100');

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

  await page.getByRole('tab', { name: 'Driver scorecard' }).click();
  await expect(page.getByRole('heading', { name: 'Field profile' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Theoretical potential' })).toBeVisible();
  await expect(page.getByLabel(/scorecard metrics/)).toBeVisible();
  await expect(page.getByRole('img', { name: /score profile radar chart/ })).toBeVisible();
  await expect(page.getByText('Factual observations')).not.toBeVisible();
});

test('downloads every selected report format from the export popover', async ({ page }) => {
  await page.goto('./');
  await waitForImporter(page);
  await page.locator('input[type="file"]').setInputFiles(fixture);

  await page.getByRole('button', { name: 'Export report' }).click();
  for (const format of ['Excel workbook', 'JSON report', 'Markdown summary', 'Markdown full']) {
    await page.getByRole('checkbox', { name: new RegExp(format) }).check();
  }
  const downloads: Download[] = [];
  page.on('download', (download) => downloads.push(download));
  await page.getByRole('button', { name: 'Download selected' }).click();
  await expect.poll(() => downloads.length).toBe(4);

  expect(downloads.map((download) => download.suggestedFilename()).sort()).toEqual([
    expect.stringMatching(/^garage61-analysis-\d{4}-\d{2}-\d{2}-\d{4}-full\.md$/),
    expect.stringMatching(/^garage61-analysis-\d{4}-\d{2}-\d{2}-\d{4}-summary\.md$/),
    expect.stringMatching(/^garage61-analysis-\d{4}-\d{2}-\d{2}-\d{4}\.json$/),
    expect.stringMatching(/^garage61-analysis-\d{4}-\d{2}-\d{2}-\d{4}\.xlsx$/),
  ]);
});
