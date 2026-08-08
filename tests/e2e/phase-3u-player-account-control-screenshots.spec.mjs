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

test("player home removes the orphaned logout band and restores premium vertical rhythm", async ({ page }) => {
  await installRoutes(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Player demo/i }).click();

  const identity = page.getByTestId("player-dashboard-identity-header");
  const commandCenter = page.getByTestId("player-daily-command-center");
  await expect(identity).toBeVisible({ timeout: 20_000 });
  await expect(commandCenter).toBeVisible();
  await expect(page.locator(".player-quick-actions")).toHaveCount(0);

  const spacing = await page.evaluate(() => {
    const header = document.querySelector('[data-testid="player-dashboard-identity-header"]')?.getBoundingClientRect();
    const command = document.querySelector('[data-testid="player-daily-command-center"]')?.getBoundingClientRect();
    if (!header || !command) return null;
    return Math.round(command.top - header.bottom);
  });
  expect(spacing).not.toBeNull();
  expect(spacing).toBeGreaterThanOrEqual(0);
  expect(spacing).toBeLessThanOrEqual(56);
  await expectNoOverflow(page);
  await capture(page, "06a-player-home-account-rhythm.png");
});

test("player More owns the sign-out action without turning it into primary navigation", async ({ page }) => {
  await installRoutes(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Player demo/i }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });

  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  const accountActions = page.getByTestId("mobile-navigation-account-actions");
  await expect(accountActions).toBeVisible();
  await expect(page.getByTestId("mobile-navigation-sign-out")).toHaveText(/Sign out/);
  await expect(page.getByTestId("mobile-navigation-sign-out")).toContainText("Leave this ShotLab session");
  await expect(sheet.locator('[data-nav-key="profile"]')).toHaveCount(0);
  await expectNoOverflow(page);
  await capture(page, "06b-player-more-account-actions.png");

  await page.getByTestId("mobile-navigation-sign-out").click();
  await expect(page.getByRole("button", { name: "Player demo", exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("mobile-navigation-dock")).toHaveCount(0);
});

test("coach navigation does not inherit the player-only More sign-out action", async ({ page }) => {
  await installRoutes(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Coach demo/i }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("mobile-navigation-more").click();
  await expect(page.getByTestId("mobile-navigation-sheet")).toBeVisible();
  await expect(page.getByTestId("mobile-navigation-sign-out")).toHaveCount(0);
  await expectNoOverflow(page);
});
