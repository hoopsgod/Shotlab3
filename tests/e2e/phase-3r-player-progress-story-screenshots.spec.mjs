import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve(process.cwd(), "artifacts/design-audit/iphone");

async function installRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function captureViewport(page, name) {
  fs.mkdirSync(outputDir, { recursive: true });
  await page.screenshot({ path: path.join(outputDir, name), fullPage: false, animations: "disabled" });
}

async function noOverflow(page) {
  const amount = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(amount).toBeLessThanOrEqual(1);
}

test("player progress profile opens with a factual development story before deep analytics", async ({ page }) => {
  await installRoutes(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Player demo/i }).click();
  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(dock).toBeVisible({ timeout: 20_000 });

  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  await sheet.locator('[data-nav-key="profile"]').click();
  await expect(page).toHaveURL(/\/profile$/);

  const story = page.getByTestId("player-progress-story");
  await expect(story).toBeVisible({ timeout: 20_000 });
  await expect(story.getByText("DEVELOPMENT STORY", { exact: true })).toBeVisible();
  await expect(story.getByTestId("player-progress-trend-chart")).toBeVisible();
  await expect(story.getByTestId("player-progress-metrics")).toBeVisible();
  await expect(story.getByTestId("player-progress-strongest-signal")).toBeVisible();
  await expect(story.getByTestId("player-progress-opportunity")).toBeVisible();
  await expect(story.getByTestId("player-progress-next-focus")).toBeVisible();
  await expect(story.getByTestId("player-progress-start-focus")).toBeVisible();
  await expect(story.getByTestId("player-progress-open-profile")).toBeVisible();
  await expect(page.getByTestId("player-progress-full-profile")).toBeVisible();
  await expect(page.getByTestId("player-profile-readout")).toBeHidden();

  const heroStyle = await story.getByTestId("player-progress-story-hero").evaluate((node) => ({
    backgroundColor: getComputedStyle(node).backgroundColor,
    backgroundImage: getComputedStyle(node).backgroundImage,
    radius: getComputedStyle(node).borderRadius,
    titleColor: getComputedStyle(node.querySelector("h2")).color,
  }));
  expect(heroStyle.backgroundColor).toBe("rgb(15, 20, 18)");
  expect(heroStyle.backgroundImage).toContain("gradient");
  expect(parseFloat(heroStyle.radius)).toBeGreaterThanOrEqual(24);
  expect(heroStyle.titleColor).toBe("rgb(248, 250, 245)");

  const focusStyle = await story.getByTestId("player-progress-start-focus").evaluate((node) => ({
    backgroundColor: getComputedStyle(node).backgroundColor,
    color: getComputedStyle(node).color,
  }));
  expect(focusStyle.backgroundColor).toBe("rgb(200, 255, 26)");
  expect(focusStyle.color).toBe("rgb(16, 19, 16)");
  await noOverflow(page);

  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
  await page.waitForTimeout(120);
  await captureViewport(page, "04v-player-progress-story.png");

  await story.getByTestId("player-progress-open-profile").click();
  const readout = page.getByTestId("player-profile-readout");
  await expect(readout).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("player-profile-performance-intelligence")).toBeVisible();
  await expect(page.getByTestId("player-profile-drill-development")).toBeVisible();
  await readout.scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  await noOverflow(page);
  await captureViewport(page, "04w-player-progress-full-profile.png");
});
