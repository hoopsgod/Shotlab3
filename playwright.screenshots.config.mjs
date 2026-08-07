import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["app-store-screenshots.spec.mjs", "auth-landing-regression.spec.mjs", "design-system-screenshots.spec.mjs", "phase-3k-coach-strength-screenshots.spec.mjs", "phase-3l-coach-leaderboard-screenshots.spec.mjs", "phase-3m-player-team-store-retail-screenshots.spec.mjs", "phase-3n-player-commitments-screenshots.spec.mjs", "phase-3o-player-training-session-screenshots.spec.mjs"],
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [["line"], ["html", { outputFolder: "playwright-report-app-store", open: "never" }]],
  outputDir: "test-results/app-store-screenshots",
  use: {
    baseURL: "http://127.0.0.1:4173",
    browserName: "chromium",
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    colorScheme: "dark",
    locale: "en-US",
    timezoneId: "America/New_York",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    screenshot: "off",
    video: "off",
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});