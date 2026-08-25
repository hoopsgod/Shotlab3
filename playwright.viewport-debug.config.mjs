import { defineConfig } from '@playwright/test';

const externalBaseUrl = String(process.env.SHOTLAB_VIEWPORT_BASE_URL || '').trim();
const baseURL = externalBaseUrl || 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'viewport-debug.spec.mjs',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: 'line',
  outputDir: 'artifacts/viewport-debug/test-results',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  webServer: externalBaseUrl ? undefined : {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
