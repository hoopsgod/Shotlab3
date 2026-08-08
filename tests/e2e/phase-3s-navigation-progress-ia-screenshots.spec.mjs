import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve(process.cwd(), "artifacts/design-audit/iphone");

async function installRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function capture(page, name) {
  fs.mkdirSync(outputDir, { recursive: true });
  await page.screenshot({ path: path.join(outputDir, name), fullPage: false, animations: "disabled" });
}

async function expectNoOverflow(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test("Phase 3S presents development-first player navigation at iPhone width", async ({ page }) => {
  await installRoutes(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Player demo/i }).click();

  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(dock).toBeVisible({ timeout: 20_000 });
  await expect(dock).toHaveAttribute("data-navigation-intent", "development-first");
  await expect(dock.getByRole("button")).toHaveCount(4);
  await expect(dock.getByRole("button", { name: "Home", exact: true })).toBeVisible();
  await expect(dock.getByRole("button", { name: "Train", exact: true })).toBeVisible();
  await expect(dock.getByRole("button", { name: "Progress", exact: true })).toBeVisible();
  await expect(dock.getByRole("button", { name: "More", exact: true })).toBeVisible();
  await expectNoOverflow(page);
  await capture(page, "04x-player-development-first-dock.png");

  await dock.getByRole("button", { name: "Progress", exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  const story = page.getByTestId("player-progress-story");
  await expect(story).toBeVisible({ timeout: 20_000 });
  await expect(story.getByText("DEVELOPMENT STORY", { exact: true })).toBeVisible();
  await expect(dock.getByRole("button", { name: "Progress", exact: true })).toHaveAttribute("aria-current", "page");
  await expectNoOverflow(page);
  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
  await page.waitForTimeout(100);
  await capture(page, "04y-player-progress-direct-destination.png");

  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("heading", { name: "More", exact: true })).toBeVisible();
  await expect(sheet.getByText("Program work, schedule, rankings, and team tools.", { exact: true })).toBeVisible();
  await expect(sheet.getByRole("heading", { name: "Team program", exact: true })).toBeVisible();
  await expect(sheet.getByRole("heading", { name: "Rankings", exact: true })).toBeVisible();
  await expect(sheet.locator('[data-nav-key="leaderboards"]')).toBeVisible();
  await expect(sheet.locator('[data-nav-key="profile"]')).toHaveCount(0);
  await expectNoOverflow(page);
  await capture(page, "04z-player-more-rankings-hierarchy.png");
});
