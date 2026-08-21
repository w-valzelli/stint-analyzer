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

test('reviews driver scope, multi-stint selection, and lap audit reasons', async ({ page }) => {
  await page.goto('./');
  await waitForImporter(page);
  await expect(page.getByLabel('Pace mode')).toBeDisabled();

  await page.locator('input[type="file"]').setInputFiles(fixture);

  const scope = page.locator('.scope-review');
  await expect(scope.getByRole('heading', { name: 'Review scope.' })).toBeVisible();
  await expect(scope.getByRole('heading', { name: 'Alice' })).toBeVisible();
  const stints = scope.getByRole('button', { name: 'Stints for Alice' });
  await expect(stints).toBeVisible();
  await expect(scope.getByLabel('Pace mode')).toBeEnabled();

  await stints.click();
  const allStints = scope.getByRole('option', { name: /All stints/ });
  await expect(allStints).toBeVisible();
  await expect(allStints).toHaveAttribute('aria-selected', 'true');
  await expect(stints).toHaveText('All stints');
  await expect(scope.getByText(/runtime laps/).first()).toBeVisible();
  await expect(scope.getByText('2 completed')).toBeVisible();
  await stints.click();

  const paceMode = scope.getByLabel('Pace mode');
  await paceMode.click();
  await scope.getByRole('option', { name: 'All non-pit' }).click();
  await expect(paceMode).toHaveText('All non-pit');

  const audit = scope.getByText(/Lap audit \(\d+ laps\)/).first();
  await audit.click();
  const excludedStatus = scope.getByRole('button', { name: /Excluded:/ }).first();
  await excludedStatus.hover();
  await expect(page.getByRole('dialog').first()).toBeVisible();
  await excludedStatus.click();
  await page.mouse.move(10, 10);
  await expect(page.getByRole('dialog').first()).toBeVisible();
  await page.mouse.click(10, 10);
  await expect(page.getByRole('dialog').first()).not.toBeVisible();
  await expect(scope.getByText(/pit-in|pit-out/)).not.toBeVisible();

  const leaderboard = page.getByRole('table', { name: 'Leaderboard' });
  await expect(leaderboard).toBeVisible();
  await expect(leaderboard).toContainText('Alice');
  await expect(leaderboard).toContainText('Best pace');
  await expect(leaderboard).toContainText('Median pace');
  await expect(leaderboard).toContainText('0:22.100');
  await expect(page.getByRole('tab', { name: 'Leaderboard' })).not.toBeVisible();

  await page.getByRole('button', { name: `Remove ${path.basename(fixture)}` }).click();
  await expect(
    scope.getByText('Import a workbook to review its runtime and pace scope.'),
  ).toBeVisible();
  await expect(page.getByLabel('Pace mode')).toBeDisabled();
});
