import { expect, test } from '@playwright/test';

test('renders the direct Stint Analyzer shell', async ({ page }) => {
  await page.goto('./');

  await expect(page.getByRole('heading', { name: /Stint Analyzer/i })).toBeVisible();
  await expect(page.getByText('All workbook data stays in your browser.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'View source on GitHub' })).toHaveAttribute(
    'href',
    'https://github.com/w-valzelli/stint-analyzer',
  );
  await expect(page.getByRole('link', { name: 'View source on GitHub' })).toHaveAttribute(
    'target',
    '_blank',
  );
  await expect(page.getByRole('heading', { name: 'Source files', exact: true })).toBeVisible();
  await expect(page.getByText('Clean is not a penalty')).not.toBeVisible();
  await expect(page.getByText('Runtime and pace stay separate')).not.toBeVisible();
  await expect(
    page.locator('.calibration-header').getByRole('button', { name: /Export/ }),
  ).toHaveCount(0);
});

test('cycles the theme control and persists the selected mode', async ({ page }) => {
  await page.goto('./');

  const theme = page.getByRole('button', { name: /Theme: System/ });
  await expect(theme).toHaveAttribute('data-hydrated', 'true');
  await expect(theme).toBeVisible();

  await theme.click();
  await expect(page.getByRole('button', { name: /Theme: Light/ })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await page.getByRole('button', { name: /Theme: Light/ }).click();
  await expect(page.getByRole('button', { name: /Theme: Dark/ })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.reload();
  await expect(page.getByRole('button', { name: /Theme: Dark/ })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
