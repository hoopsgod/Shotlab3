import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve(process.cwd(), "artifacts/design-audit/iphone");

async function installRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

test.beforeEach(async ({ page }) => {
  await installRoutes(page);
});

test("Phase 5A presents a truthful, touch-safe Coach Daily Brief without duplicate activity chrome", async ({ page }) => {
  await page.goto("/");
  const demo = page.getByRole("button", { name: /Coach demo/i });
  await expect(demo).toBeVisible({ timeout: 20_000 });
  await demo.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });

  const brief = page.getByTestId("coach-primary-metrics");
  await expect(brief).toBeVisible({ timeout: 20_000 });
  await expect(brief).toHaveAttribute("aria-label", "Coach daily brief");
  await expect(brief).toContainText("Today active");
  await expect(brief).toContainText("RSVP ready");
  await expect(brief).toContainText("Follow-up");
  await expect(page.locator(".mcTeamHealth")).toHaveCount(0);

  const buttonHeights = await brief.getByRole("button").evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().height));
  expect(buttonHeights).toHaveLength(3);
  for (const height of buttonHeights) expect(height).toBeGreaterThanOrEqual(44);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  fs.mkdirSync(outputDir, { recursive: true });
  await page.screenshot({ path: path.join(outputDir, "13a-phase5a-coach-daily-intelligence.png"), fullPage: false, animations: "disabled" });
});
