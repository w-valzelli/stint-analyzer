import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:4321/stint-analyzer/',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev --host 127.0.0.1',
    // Astro 7 detaches `astro dev` when it detects an AI agent environment, which
    // Playwright reports as an early exit. This marker keeps it in the foreground.
    env: { ASTRO_DEV_BACKGROUND: '1' },
    url: 'http://127.0.0.1:4321/stint-analyzer/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
