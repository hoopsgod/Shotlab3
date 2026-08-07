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

async function enterPlayerDemo(page) {
  await installRoutes(page);
  await page.goto("/");
  const demoButton = page.getByRole("button", { name: /Player demo/i });
  await expect(demoButton).toBeVisible({ timeout: 20_000 });
  await demoButton.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

async function openSecondaryRoute(page, key) {
  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  await sheet.locator(`[data-nav-key="${key}"]`).click();
  await expect(page.getByTestId("mobile-navigation-sheet")).toHaveCount(0);
}

async function verifyCommitmentSurface(page, { mode, title, legacyTestId, screenshotName }) {
  const center = page.getByTestId(`player-commitment-center-${mode}`);
  const routeHeader = page.getByTestId(`player-commitment-route-header-${mode}`);
  const hero = page.getByTestId(`player-commitment-hero-${mode}`);
  const details = page.getByTestId(`player-commitment-details-${mode}`);
  const legacy = page.getByTestId(legacyTestId);

  await expect(center).toBeVisible({ timeout: 20_000 });
  await expect(routeHeader).toBeVisible();
  await expect(routeHeader.getByRole("heading", { name: title, exact: true })).toBeVisible();
  await expect(hero).toBeVisible();
  await expect(details).not.toHaveAttribute("open", "");
  await expect(legacy).toBeHidden();

  const viewportHeight = await page.evaluate(() => window.innerHeight);
  const heroBox = await hero.boundingBox();
  expect(heroBox).not.toBeNull();
  expect(heroBox.y).toBeLessThan(viewportHeight * 0.62);

  const heroStyle = await hero.evaluate((node) => ({
    backgroundImage: getComputedStyle(node).backgroundImage,
    borderRadius: getComputedStyle(node).borderRadius,
  }));
  expect(heroStyle.backgroundImage).toContain("gradient");
  expect(parseFloat(heroStyle.borderRadius)).toBeGreaterThanOrEqual(20);

  await capture(page, screenshotName);

  const action = hero.getByRole("button").first();
  await expect(action).toBeVisible();
  await action.click();
  await expect(details).toHaveAttribute("open", "");
  await expect(legacy).toBeVisible({ timeout: 10_000 });
  await noOverflow(page);

  await details.locator("summary").click();
  await expect(details).not.toHaveAttribute("open", "");
  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
}

test("Player Events and S&C expose one premium commitment hierarchy while preserving full operational controls", async ({ page }) => {
  await enterPlayerDemo(page);

  await openSecondaryRoute(page, "program");
  await verifyCommitmentSurface(page, {
    mode: "events",
    title: "Events & Attendance",
    legacyTestId: "player-events-operational-list",
    screenshotName: "04n-player-events-commitment",
  });

  await openSecondaryRoute(page, "sc");
  await verifyCommitmentSurface(page, {
    mode: "strength",
    title: "Strength & Conditioning",
    legacyTestId: "player-strength-operational-panel",
    screenshotName: "04o-player-strength-commitment",
  });

  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible();
});
