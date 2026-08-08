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

async function assertNoOverflow(page) {
  const delta = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(delta).toBeLessThanOrEqual(1);
}

async function enterDemo(page, role) {
  await page.goto("/");
  const button = page.getByRole("button", { name: role === "coach" ? /Coach demo/i : /Player demo/i });
  await expect(button).toBeVisible({ timeout: 20_000 });
  await button.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

async function openMoreDestination(page, key) {
  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  await sheet.locator(`[data-nav-key="${key}"]`).click();
  await expect(page.getByTestId("mobile-navigation-sheet")).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  await installRoutes(page);
});

test("Phase 4E keeps Player Home inside premium mobile gutters", async ({ page }) => {
  await enterDemo(page, "player");
  const command = page.getByTestId("player-daily-command-center");
  await expect(command).toBeVisible({ timeout: 20_000 });
  const box = await command.boundingBox();
  expect(box).not.toBeNull();
  expect(box.x).toBeGreaterThanOrEqual(14);
  expect(box.x + box.width).toBeLessThanOrEqual(416);
  await assertNoOverflow(page);
  await capture(page, "12a-phase4e-player-home-polish.png");
});

test("Phase 4E keeps Program first-use content readable and dock-safe", async ({ page }) => {
  await enterDemo(page, "player");
  await openMoreDestination(page, "duels");
  const filters = page.getByTestId("player-program-filter-rail");
  await expect(filters).toBeVisible({ timeout: 20_000 });
  await filters.getByRole("button", { name: /Completed/i }).click();
  const state = page.getByTestId("player-workspace-empty-state");
  await expect(state).toBeVisible();
  await state.evaluate((node) => node.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" }));
  await page.waitForTimeout(100);
  const stateBox = await state.boundingBox();
  const dockBox = await page.getByTestId("mobile-navigation-dock").boundingBox();
  expect(stateBox).not.toBeNull();
  expect(dockBox).not.toBeNull();
  expect(stateBox.x).toBeGreaterThanOrEqual(14);
  expect(stateBox.x + stateBox.width).toBeLessThanOrEqual(416);
  expect(stateBox.y + stateBox.height).toBeLessThan(dockBox.y - 8);
  await assertNoOverflow(page);
  await capture(page, "12b-phase4e-player-program-polish.png");
});

test("Phase 4E keeps Player Profile typography inside the iPhone viewport", async ({ page }) => {
  await enterDemo(page, "player");
  const dock = page.getByTestId("mobile-navigation-dock");
  await dock.getByRole("button", { name: "Progress", exact: true }).click();
  const workspace = page.getByTestId("player-profile-workspace");
  await expect(workspace).toBeVisible({ timeout: 20_000 });
  const header = page.locator(".appHeader").first();
  if (await header.count()) {
    const box = await header.boundingBox();
    expect(box).not.toBeNull();
    expect(box.x).toBeGreaterThanOrEqual(14);
    expect(box.x + box.width).toBeLessThanOrEqual(416);
  }
  await assertNoOverflow(page);
  await capture(page, "12c-phase4e-player-profile-polish.png");
});

test("Phase 4E preserves Coach Mission Control spacing and navigation", async ({ page }) => {
  await enterDemo(page, "coach");
  const missionControl = page.getByTestId("coach-mission-control");
  await expect(missionControl).toBeVisible({ timeout: 20_000 }).catch(async () => {
    await expect(page.locator(".mcShellV3")).toBeVisible({ timeout: 20_000 });
  });
  await expect(page.getByTestId("mobile-navigation-dock")).toHaveAttribute("data-navigation-role", "coach");
  await assertNoOverflow(page);
  await capture(page, "12d-phase4e-coach-home-polish.png");
});
