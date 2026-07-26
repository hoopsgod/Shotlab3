import { defineConfig, devices } from "@playwright/test";

const remoteBaseURL = String(process.env.ACCEPTANCE_BASE_URL || "").trim();
const useRemoteTarget = Boolean(remoteBaseURL);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [["line"], ["html", { outputFolder: "playwright-report", open: "never" }]]
    : "list",
  outputDir: "test-results",
  use: {
    baseURL: remoteBaseURL || "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "mobile-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  ...(useRemoteTarget
    ? {}
    : {
        webServer: {
          command: "npm run dev",
          url: "http://127.0.0.1:4173",
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }),
});
