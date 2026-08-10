import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-3b-coach-leaderboards-hierarchy");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

test.use({ viewport: { width: 390, height: 844 } });

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) });
  });
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
}

async function enterCoachDemo(page) {
  await installSafeRoutes(page);
  await page.goto("/");
  const demo = page.getByRole("button", { name: /Coach demo/i });
  await expect(demo).toBeVisible({ timeout: 20_000 });
  await demo.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

async function openLeaderboards(page) {
  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  await sheet.locator('[data-nav-key="leaderboards"]').click();
  await expect(page.getByTestId("coach-page-dashboard-leaderboards")).toBeVisible();
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(300);
}

test("Coach Leaderboards uses the accepted light editorial and dark decision hierarchy", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await enterCoachDemo(page);
  await openLeaderboards(page);

  const shell = page.getByTestId("coach-page-dashboard-leaderboards");
  const pageSurface = shell.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " pageShell ")][1]');
  const title = shell.locator(".secondaryPageIntro__title");
  const summary = shell.locator(".secondaryPageIntro__summary");
  const decision = page.getByTestId("coach-page-dashboard-leaderboards-decision-brief");
  const metricStrip = page.getByTestId("coach-page-dashboard-leaderboards-metric-strip");

  await expect(pageSurface).toHaveCSS("background-color", "rgb(247, 248, 242)");
  await expect(title).toHaveCSS("color", "rgb(23, 26, 24)");
  await expect(summary).toHaveCSS("color", "rgb(93, 102, 95)");
  await expect(summary).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(decision.locator("h2")).toHaveCSS("color", "rgb(245, 247, 244)");
  expect(await decision.evaluate((node) => getComputedStyle(node).backgroundImage)).toContain("linear-gradient");
  await expect(metricStrip.locator("[data-premium-metric-value]").first()).toHaveCSS("color", "rgb(23, 26, 24)");
  await expect(metricStrip.locator("[data-premium-metric-label]").first()).toHaveCSS("color", "rgb(82, 96, 89)");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(pageErrors).toEqual([]);

  const outputPath = path.join(OUTPUT_DIR, "coach-leaderboards-390x844.png");
  await page.screenshot({ path: outputPath, animations: "disabled" });
  expect(fs.statSync(outputPath).size).toBeGreaterThan(20_000);
});
