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

test("Coach S&C keeps session work close while preserving compliance intelligence on demand", async ({ page }) => {
  await installRoutes(page);
  await page.goto("/");
  const demoButton = page.getByRole("button", { name: /Coach demo/i });
  await expect(demoButton).toBeVisible({ timeout: 20_000 });
  await demoButton.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });

  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  await sheet.locator('[data-nav-key="sc"]').click();

  await expect(page.getByTestId("coach-strength-operational-panel")).toBeVisible({ timeout: 20_000 });
  const insights = page.getByTestId("coach-strength-supporting-intelligence");
  await expect(insights).toBeVisible();
  await expect(insights).not.toHaveAttribute("open", "");
  await expect(page.getByTestId("coach-strength-insight-grid")).toBeHidden();
  await expect(page.getByText("S&C SESSIONS", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /ADD SESSION/i }).first()).toBeVisible();
  await capture(page, "08c-coach-strength");

  await insights.locator(":scope > summary").click();
  await expect(insights).toHaveAttribute("open", "");
  await expect(page.getByTestId("coach-strength-insight-grid")).toBeVisible();
  await capture(page, "08d-coach-strength-insights-expanded");
});
