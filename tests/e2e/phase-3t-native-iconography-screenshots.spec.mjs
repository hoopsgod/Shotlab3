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

async function expectIcon(dock, name, icon) {
  await expect(dock.getByRole("button", { name, exact: true })).toHaveAttribute("data-icon-name", icon);
}

test("player dock uses destination-true icons and secondary tools stay visually coherent", async ({ page }) => {
  await installRoutes(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Player demo/i }).click();

  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(dock).toBeVisible({ timeout: 20_000 });
  await expectIcon(dock, "Home", "home");
  await expectIcon(dock, "Train", "target");
  await expectIcon(dock, "Progress", "momentum");
  await expectIcon(dock, "More", "more");
  await expectNoOverflow(page);
  await capture(page, "05a-player-native-iconography.png");

  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('[data-nav-key="duels"]')).toHaveAttribute("data-icon-name", "program");
  await expect(sheet.locator('[data-nav-key="program"]')).toHaveAttribute("data-icon-name", "calendar");
  await expect(sheet.locator('[data-nav-key="leaderboards"]')).toHaveAttribute("data-icon-name", "chart");
  await expect(sheet.locator('[data-nav-key="team-store"]')).toHaveAttribute("data-icon-name", "store");
  await expectNoOverflow(page);
  await capture(page, "05b-player-secondary-iconography.png");
});

test("coach dock uses destination-true icons on the shared light native surface", async ({ page }) => {
  await installRoutes(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Coach demo/i }).click();

  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(dock).toBeVisible({ timeout: 20_000 });
  await expectIcon(dock, "Home", "home");
  await expectIcon(dock, "Players", "team");
  await expectIcon(dock, "Schedule", "calendar");
  await expectIcon(dock, "More", "more");
  const surface = await dock.evaluate((node) => ({
    outer: getComputedStyle(node).backgroundColor,
    inner: getComputedStyle(node.firstElementChild).backgroundColor,
  }));
  expect(surface.outer).toBe("rgba(252, 252, 250, 0.9)");
  expect(surface.inner).toBe("rgba(0, 0, 0, 0)");
  await expectNoOverflow(page);
  await capture(page, "05c-coach-native-iconography.png");
});
