import { defineConfig, devices } from '@playwright/test';

const externalBaseURL = String(process.env.PHASE1B_BASE_URL || '').trim();

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'phase1b-state-parity.spec.mjs',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  reporter: [['line'], ['html', { outputFolder: 'artifacts/phase1b/report', open: 'never' }]],
  outputDir: 'artifacts/phase1b/test-results',
  use: {
    baseURL: externalBaseURL || 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    { name: 'mobile-chromium', use: { ...devices['Desktop Chrome'], isMobile: true, hasTouch: true, deviceScaleFactor: 3 } },
    { name: 'mobile-webkit', use: { ...devices['iPhone 14'] } },
  ],
  ...(externalBaseURL ? {} : {
    webServer: {
      command: 'npx vite preview --host 127.0.0.1 --port 4173',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  }),
});
