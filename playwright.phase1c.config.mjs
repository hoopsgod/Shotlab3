import { defineConfig, devices } from '@playwright/test';

const externalBaseURL = String(process.env.PHASE1C_BASE_URL || '').trim();

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'phase1c-focused-visual-runtime.spec.mjs',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  reporter: [['line'], ['html', { outputFolder: 'artifacts/phase1c/report', open: 'never' }]],
  outputDir: 'artifacts/phase1c/test-results',
  use: {
    baseURL: externalBaseURL || 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    { name: 'mobile-chromium', use: { ...devices['Desktop Chrome'] } },
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
