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

test("Player Team Store reads as a premium retail destination and restores navigation cleanly", async ({ page }) => {
  await installRoutes(page);
  await page.goto("/");
  const demoButton = page.getByRole("button", { name: /Player demo/i });
  await expect(demoButton).toBeVisible({ timeout: 20_000 });
  await demoButton.click();
  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(dock).toBeVisible({ timeout: 20_000 });

  const activeTeamId = await page.evaluate(() => {
    const parse = (key, fallback) => {
      try { return JSON.parse(window.localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
    };
    const session = parse("sl:session", {});
    const players = parse("sl:players", []);
    const currentEmail = String(session?.email || "").toLowerCase();
    const player = players.find((row) => String(row?.email || row?.player_email || "").toLowerCase() === currentEmail) || players.find((row) => row?.teamId || row?.team_id);
    return String(session?.teamId || session?.team_id || player?.teamId || player?.team_id || "");
  });
  expect(activeTeamId).not.toBe("");

  await page.evaluate((teamId) => {
    window.localStorage.setItem("sl:team-stores", JSON.stringify([{
      id: `team-store-${teamId}`,
      teamId,
      provider: "squadlocker",
      storeName: "Demo Team Store",
      storeUrl: "https://example.com/demo-team-store",
      status: "active",
      createdAt: "2026-08-10T12:00:00.000Z",
      updatedAt: "2026-08-10T12:00:00.000Z",
    }]));
  }, activeTeamId);
  await page.waitForTimeout(2700);

  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  await sheet.locator('[data-nav-key="team-store"]').click();

  await expect(page.locator("html")).toHaveClass(/team-store-portal-open/);
  const panel = page.getByTestId("team-store-portal-panel");
  await expect(panel).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("#root")).toBeHidden();
  await expect(dock).toBeHidden();

  const retail = page.getByTestId("player-team-store-retail");
  const hero = page.getByTestId("player-team-store-hero");
  const card = page.getByTestId("player-team-store-card");
  await expect(retail).toBeVisible();
  await expect(hero).toBeVisible();
  await expect(card).toBeVisible();
  await expect(page.getByText("Rep your program.", { exact: true })).toBeVisible();
  await expect(page.getByText("Partner checkout", { exact: true })).toBeVisible();
  await expect(card.getByText("Demo Team Store", { exact: true }).first()).toBeVisible();
  await expect(card.getByText("Demo Team Team Store", { exact: true })).toHaveCount(0);

  const viewportHeight = await page.evaluate(() => window.innerHeight);
  const heroBox = await hero.boundingBox();
  const cardBox = await card.boundingBox();
  expect(heroBox).not.toBeNull();
  expect(cardBox).not.toBeNull();
  expect(heroBox.y).toBeLessThan(viewportHeight * 0.42);
  expect(cardBox.y).toBeLessThan(viewportHeight);

  const heroStyle = await hero.evaluate((node) => ({
    backgroundImage: getComputedStyle(node).backgroundImage,
    borderRadius: getComputedStyle(node).borderRadius,
  }));
  expect(heroStyle.backgroundImage).toContain("gradient");
  expect(parseFloat(heroStyle.borderRadius)).toBeGreaterThanOrEqual(20);

  const shopButton = retail.getByRole("button", { name: /SHOP TEAM STORE/i });
  await expect(shopButton).toBeVisible();
  await expect(shopButton).toHaveText(/SHOP TEAM STORE/);

  await capture(page, "04m-player-team-store-retail");

  await page.getByRole("button", { name: "Close team store" }).click();
  await expect(page.locator("html")).not.toHaveClass(/team-store-portal-open/);
  await expect(page.locator("#root")).toBeVisible();
  await expect(dock).toBeVisible({ timeout: 10_000 });
});
