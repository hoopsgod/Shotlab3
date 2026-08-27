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

function parseCssColor(value) {
  const input = String(value).trim();
  const rgbMatch = input.match(/^rgba?\(\s*([\d.]+)(?:\s*,\s*|\s+)([\d.]+)(?:\s*,\s*|\s+)([\d.]+)(?:\s*(?:,|\/)\s*([\d.]+))?\s*\)$/i);
  if (rgbMatch) {
    return {
      r: Number(rgbMatch[1]),
      g: Number(rgbMatch[2]),
      b: Number(rgbMatch[3]),
      a: rgbMatch[4] === undefined ? 1 : Number(rgbMatch[4]),
    };
  }

  const srgbMatch = input.match(/^color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/i);
  expect(srgbMatch, `Expected an rgb/rgba or color(srgb ...) color, received ${value}`).not.toBeNull();
  return {
    r: Number(srgbMatch[1]) * 255,
    g: Number(srgbMatch[2]) * 255,
    b: Number(srgbMatch[3]) * 255,
    a: srgbMatch[4] === undefined ? 1 : Number(srgbMatch[4]),
  };
}

function relativeLuminance({ r, g, b }) {
  const linear = [r, g, b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(first, second) {
  const bright = Math.max(relativeLuminance(first), relativeLuminance(second));
  const dark = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (bright + 0.05) / (dark + 0.05);
}

test("Coach Leaderboards preserves decision context, competitive signal, and player drill-down", async ({ page }) => {
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
  const decisionBrief = page.getByTestId("coach-page-dashboard-leaderboards-decision-brief");
  await expect(decisionBrief).toBeVisible();
  const performanceRail = decisionBrief.locator('[data-visual-role="performance-evidence"]');
  await expect(performanceRail).toBeVisible();
  await expect(performanceRail.getByRole("button", { name: /^Ranked Players:/ })).toBeVisible();
  await expect(performanceRail.getByRole("button", { name: /^Current Leader:/ })).toBeVisible();
  await expect(performanceRail.getByRole("button", { name: /^Archived Seasons:/ })).toBeVisible();

  const routeKind = await decisionBrief.getAttribute("data-route-kind");
  expect(routeKind).toBe("leaderboards");

  const pulse = page.getByTestId("coach-leaderboard-pulse");
  await expect(pulse).toBeVisible();
  const decisionBox = await decisionBrief.boundingBox();
  const pulseBox = await pulse.boundingBox();
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  expect(decisionBox).not.toBeNull();
  expect(pulseBox).not.toBeNull();
  expect(decisionBox.y).toBeLessThan(viewportHeight);
  expect(pulseBox.y).toBeGreaterThan(decisionBox.y);

  const results = page.getByTestId("coach-leaderboard-operational-results");
  await expect(results).toBeVisible();
  await expect(results.locator(".coachLeaderboardRow").first()).toBeVisible();
  await capture(page, "10-coach-leaderboards");

  await results.locator(".coachLeaderboardRow").first().click();
  const drawer = page.getByTestId("coach-player-intelligence-drawer");
  await expect(drawer).toBeVisible({ timeout: 10_000 });

  const playerTitle = drawer.locator('[role="dialog"] h2').first();
  await expect(playerTitle).toBeVisible();
  const titleColor = await playerTitle.evaluate((node) => getComputedStyle(node).color);
  expect(titleColor).toBe("rgb(244, 247, 242)");

  const firstMetricValue = drawer.getByText("Weekly makes", { exact: true }).locator("xpath=..").locator("strong");
  await expect(firstMetricValue).toBeVisible();
  const metricColor = await firstMetricValue.evaluate((node) => getComputedStyle(node).color);
  expect(metricColor).toBe("rgb(244, 247, 242)");

  const sectionHeading = drawer.getByRole("heading", { name: "Development pulse", exact: true });
  const sectionTitle = sectionHeading;
  const firstSection = sectionHeading.locator("xpath=ancestor::section[1]");
  await expect(firstSection).toBeVisible();
  const sectionBackground = parseCssColor(await firstSection.evaluate((node) => getComputedStyle(node).backgroundColor));
  expect(relativeLuminance(sectionBackground)).toBeLessThanOrEqual(0.12);
  expect(sectionBackground.a).toBeGreaterThanOrEqual(0.9);

  await expect(sectionTitle).toBeVisible();
  const sectionTitleColor = parseCssColor(await sectionTitle.evaluate((node) => getComputedStyle(node).color));
  expect(relativeLuminance(sectionTitleColor)).toBeGreaterThanOrEqual(0.8);
  expect(sectionTitleColor.a).toBeGreaterThanOrEqual(.99);
  expect(contrastRatio(sectionTitleColor, sectionBackground)).toBeGreaterThanOrEqual(7);
  const sectionTitleBackground = await sectionTitle.evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(sectionTitleBackground).toBe("rgba(0, 0, 0, 0)");

  const sectionSummary = firstSection.getByText("A decision-ready summary of volume, attendance, and training compliance.", { exact: true });
  await expect(sectionSummary).toBeVisible();
  const sectionSummaryBackground = await sectionSummary.evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(sectionSummaryBackground).toBe("rgba(0, 0, 0, 0)");

  const followUpHost = drawer.getByTestId("coach-follow-up-ledger-host");
  await expect(followUpHost).toBeAttached({ timeout: 10_000 });
  const drawerDialog = drawer.locator('[role="dialog"]:visible').first();
  await expect(drawerDialog).toBeVisible();
  await expect(drawerDialog.getByRole("heading", { level: 2 }).first()).toHaveText(/\S+/);
  const followUpInsideDialog = await followUpHost.evaluate((node) => Boolean(node.closest('[role="dialog"]')));
  expect(followUpInsideDialog).toBe(true);

  await capture(page, "10b-coach-leaderboard-player-intelligence");
});