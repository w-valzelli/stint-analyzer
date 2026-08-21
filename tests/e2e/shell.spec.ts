import { expect, test } from '@playwright/test';

test('renders the privacy-first analyzer shell', async ({ page }) => {
  await page.goto('./');

  await expect(page.getByRole('heading', { name: 'Garage 61 Stint Analyzer' })).toBeVisible();
  await expect(
    page.getByText('No account. No upload. Analyze locally and export when done.'),
  ).toBeVisible();
});
