import { defineConfig } from "@playwright/test";
import screenshotConfig from "./playwright.screenshots.config.mjs";

export default defineConfig({
  ...screenshotConfig,
  testMatch: ["phase-5b-practice-readiness.spec.mjs"],
  reporter: [["line"], ["html", { outputFolder: "playwright-report-phase5b", open: "never" }]],
  outputDir: "test-results/phase5b-practice-readiness",
});
