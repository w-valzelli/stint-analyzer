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
  await expect(scope.getByRole('listbox', { name: 'Stints for Alice' })).toBeVisible();
  await expect(scope.getByRole('option', { name: 'All stints' })).toBeVisible();
  await expect(scope.getByLabel('Pace mode')).toBeEnabled();

  const stints = scope.getByRole('listbox', { name: 'Stints for Alice' });
  await stints.selectOption('__all_stints__');
  await expect(scope.getByText(/runtime laps/).first()).toBeVisible();

  await scope.getByLabel('Pace mode').selectOption('all-non-pit');
  await expect(scope.getByLabel('Pace mode')).toHaveValue('all-non-pit');

  const audit = scope.getByText(/Lap audit \(\d+ laps\)/).first();
  await audit.click();
  await expect(scope.getByText(/Inlap|Outlap|Incomplete lap/).first()).toBeVisible();
  await expect(scope.getByText(/pit-in|pit-out/)).not.toBeVisible();

  await page.getByRole('button', { name: `Remove ${path.basename(fixture)}` }).click();
  await expect(
    scope.getByText('Import a workbook to review its runtime and pace scope.'),
  ).toBeVisible();
  await expect(page.getByLabel('Pace mode')).toBeDisabled();
});
