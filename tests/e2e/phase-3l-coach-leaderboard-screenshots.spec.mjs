import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve(process.cwd(), "artifacts/design-audit/iphone");

async function installRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function noOverflow(page) {
  const amount = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(amount).toBeLessThanOrEqual(1);
}

async function capture(page, name) {
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(250);
  await noOverflow(page);
  fs.mkdirSync(outputDir, { recursive: true });
  await page.screenshot({ path: path.join(outputDir, `${name}.png`), fullPage: true, animations: "disabled" });
}

test("Coach Leaderboards surfaces competitive signal in the first viewport and preserves player drill-down", async ({ page }) => {
  await installRoutes(page);
  await page.goto("/");
  const demoButton = page.getByRole("button", { name: /Coach demo/i });
  await expect(demoButton).toBeVisible({ timeout: 20_000 });
  await demoButton.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });

  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  await sheet.locator('[data-nav-key="leaderboards"]').click();

  await expect(page.getByTestId("coach-leaderboard-operational-panel")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("coach-page-dashboard-leaderboards-decision-brief")).toBeHidden();
  await expect(page.getByTestId("coach-page-dashboard-leaderboards-evidence")).toBeHidden();

  const pulse = page.getByTestId("coach-leaderboard-pulse");
  await expect(pulse).toBeVisible();
  const pulseBox = await pulse.boundingBox();
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  expect(pulseBox).not.toBeNull();
  expect(pulseBox.y).toBeLessThan(viewportHeight);

  const results = page.getByTestId("coach-leaderboard-operational-results");
  await expect(results).toBeVisible();
  await expect(results.locator(".coachLeaderboardRow").first()).toBeVisible();
  await capture(page, "10-coach-leaderboards");

  await results.locator(".coachLeaderboardRow").first().click();
  await expect(page.getByTestId("coach-player-intelligence-drawer")).toBeVisible({ timeout: 10_000 });
  await capture(page, "10b-coach-leaderboard-player-intelligence");
});
