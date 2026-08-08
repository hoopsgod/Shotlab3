import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve(process.cwd(), "artifacts/design-audit/iphone");

async function installRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function enterPlayerProfile(page) {
  await installRoutes(page);
  await page.goto("/");
  const demo = page.getByRole("button", { name: /Player demo/i });
  await expect(demo).toBeVisible({ timeout: 20_000 });
  await demo.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  await sheet.locator('[data-nav-key="profile"]').click();
  await expect(page.getByTestId("player-profile-workspace")).toBeVisible({ timeout: 20_000 });
}

async function documentHeight(page) {
  return page.evaluate(() => document.documentElement.scrollHeight);
}

async function capture(page, name) {
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(200);
  fs.mkdirSync(outputDir, { recursive: true });
  await page.screenshot({ path: path.join(outputDir, name), fullPage: true, animations: "disabled" });
}

test("Player Profile keeps privacy immediate while subordinating infrequent account administration", async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 });
  await enterPlayerProfile(page);

  const privacy = page.getByTestId("player-profile-privacy");
  const accountData = page.getByTestId("player-profile-account-data");
  await expect(privacy).toBeVisible();
  await expect(privacy.getByText("Hide me from leaderboards", { exact: true })).toBeVisible();
  await expect(accountData).toBeVisible();
  await expect(accountData).not.toHaveAttribute("open", "");
  await expect(accountData.getByText("Account & data", { exact: true })).toBeVisible();
  await expect(accountData.getByText("Privacy resources, support, data requests, and account controls", { exact: true })).toBeVisible();

  const requestEntry = page.getByTestId("account-data-request-entry");
  await expect(requestEntry).toBeHidden();
  await expect(accountData.getByRole("button", { name: "Delete Account & Data", exact: true })).toBeHidden();
  await expect(accountData.getByRole("link", { name: "Privacy", exact: true })).toBeHidden();
  await expect(accountData.getByRole("link", { name: "Terms", exact: true })).toBeHidden();
  await expect(accountData.getByRole("link", { name: "Support", exact: true })).toBeHidden();

  const defaultHeight = await documentHeight(page);
  expect(defaultHeight, "Default Player Profile should end before administrative account detail").toBeLessThanOrEqual(2350);

  await accountData.scrollIntoViewIfNeeded();
  await accountData.locator(":scope > summary").click();
  await expect(accountData).toHaveAttribute("open", "");
  await expect(accountData.getByText("LEGAL & SUPPORT", { exact: true })).toBeVisible();
  await expect(accountData.getByRole("link", { name: "Privacy", exact: true })).toBeVisible();
  await expect(accountData.getByRole("link", { name: "Terms", exact: true })).toBeVisible();
  await expect(accountData.getByRole("link", { name: "Support", exact: true })).toBeVisible();
  await expect(accountData.getByRole("link", { name: "Delete Account", exact: true })).toBeVisible();
  await expect(accountData.getByRole("link", { name: "Data Request", exact: true })).toBeVisible();
  await expect(requestEntry).toBeVisible();
  await expect(accountData.getByRole("link", { name: "REQUEST DATA", exact: true })).toBeVisible();
  await expect(accountData.getByRole("button", { name: "Delete Account & Data", exact: true })).toBeVisible();

  const expandedHeight = await documentHeight(page);
  const restoredDetail = expandedHeight - defaultHeight;
  console.log("PHASE3M_PROFILE_HEIGHTS", JSON.stringify({ defaultHeight, expandedHeight, restoredDetail }));
  expect(restoredDetail, "Account disclosure should remove meaningful administrative density from the default Profile").toBeGreaterThanOrEqual(240);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await capture(page, "03e-player-profile-account-data-expanded.png");
});
