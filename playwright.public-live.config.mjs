import { defineConfig } from "@playwright/test";

const baseURL = process.env.SHOTLAB_PUBLIC_BASE_URL;
if (!baseURL) throw new Error("SHOTLAB_PUBLIC_BASE_URL is required for live public-route verification.");
if (!baseURL.startsWith("https://")) throw new Error("SHOTLAB_PUBLIC_BASE_URL must use HTTPS.");

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "public-submission-routes.spec.mjs",
  fullyParallel: false,
  forbidOnly: true,
  retries: 1,
  workers: 1,
  reporter: [["line"], ["html", { outputFolder: "playwright-report-public-live", open: "never" }]],
  outputDir: "test-results/public-live-routes",
  use: {
    baseURL: baseURL.replace(/\/$/, ""),
    browserName: "chromium",
    viewport: { width: 430, height: 932 },
    colorScheme: "dark",
    locale: "en-US",
    timezoneId: "America/New_York",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
});
