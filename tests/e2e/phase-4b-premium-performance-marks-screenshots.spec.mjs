import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve(process.cwd(), "artifacts/design-audit/iphone");

async function installRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route("**/v1/scores", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    const payload = route.request().postDataJSON();
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, storage_mode: "e2e", scores: Array.isArray(payload?.scores) ? payload.scores : [] }) });
  });
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function enterPlayerDemo(page) {
  await installRoutes(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Player demo/i }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

async function capture(page, name) {
  fs.mkdirSync(outputDir, { recursive: true });
  await page.screenshot({ path: path.join(outputDir, name), fullPage: false, animations: "disabled" });
}

async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
}

async function openFormShootingDrill(page) {
  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Train", exact: true }).click();
  await expect(page.getByTestId("player-at-home-workspace")).toBeVisible({ timeout: 20_000 });

  const drillButtons = page.locator("button.ch");
  const count = await drillButtons.count();
  let opened = false;
  for (let i = 0; i < count && !opened; i += 1) {
    const button = drillButtons.nth(i);
    const text = (await button.innerText()).toUpperCase();
    if (!text.includes("FORM SHOOTING")) continue;
    await button.click();
    opened = await page.getByTestId("player-training-session").isVisible().catch(() => false);
  }
  expect(opened).toBe(true);
  await expect(page.getByTestId("player-training-session")).toBeVisible({ timeout: 15_000 });
}

async function seedSevenDayDemoStreak(page) {
  await page.addInitScript(() => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function patchedSetItem(key, value) {
      if (key === "sl:scores") {
        try {
          const rows = JSON.parse(value || "[]");
          if (Array.isArray(rows)) {
            const existingIds = new Set(rows.map((row) => row?.id));
            const today = new Date();
            for (let i = 0; i < 7; i += 1) {
              const id = `phase4b-streak-${i}`;
              if (existingIds.has(id)) continue;
              const date = new Date(today);
              date.setDate(today.getDate() - i);
              const yyyy = date.getFullYear();
              const mm = String(date.getMonth() + 1).padStart(2, "0");
              const dd = String(date.getDate()).padStart(2, "0");
              rows.push({ id, email: "demo@shotlab.app", playerId: "demo@shotlab.app", teamId: "team-demo-titans", name: "Demo Player", drillId: "demo-form-shooting", score: 20 + i, date: `${yyyy}-${mm}-${dd}`, ts: Date.now() - i * 86400000, src: "home" });
            }
            value = JSON.stringify(rows);
          }
        } catch {}
      }
      return originalSetItem.call(this, key, value);
    };
  });
}

test.beforeEach(async ({ page }) => {
  await installRoutes(page);
});

test("Phase 4B development story uses branded performance marks for the core metrics", async ({ page }) => {
  await enterPlayerDemo(page);
  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Progress", exact: true }).click();
  for (const id of ["player-progress-active-days-mark", "player-progress-streak-mark", "player-progress-pb-mark"]) {
    await expect(page.getByTestId(id)).toBeVisible({ timeout: 20_000 });
  }
  await expect(page.getByTestId("player-progress-active-days-mark")).toHaveAttribute("data-performance-kind", "milestone");
  await expect(page.getByTestId("player-progress-streak-mark")).toHaveAttribute("data-performance-kind", "streak");
  await expect(page.getByTestId("player-progress-pb-mark")).toHaveAttribute("data-performance-kind", "pb");
  await noOverflow(page);
  await capture(page, "09a-phase4b-player-progress-performance-marks.png");
});

test("Phase 4B promotes top leaderboard ranks without changing leaderboard hierarchy", async ({ page }) => {
  await enterPlayerDemo(page);
  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  await sheet.locator('[data-nav-key="leaderboards"]').click();
  await expect(page.getByTestId("premium-leaderboards-hub")).toBeVisible({ timeout: 20_000 });
  const rankMark = page.locator('[data-testid^="leaderboard-rank-mark-"]').first();
  await expect(rankMark).toBeVisible();
  await expect(rankMark).toHaveAttribute("data-performance-kind", "rank");
  await expect(page.getByText(/Current \/ Offseason/i).first()).toBeVisible();
  await noOverflow(page);
  await capture(page, "09b-phase4b-player-rank-marks.png");
});

test("Phase 4B turns a new personal best into a premium achievement moment", async ({ page }) => {
  await enterPlayerDemo(page);
  await openFormShootingDrill(page);
  const session = page.getByTestId("player-training-session");
  const scoreInput = session.locator('input[type="number"]').first();
  await scoreInput.fill("24");
  await expect(page.getByTestId("player-training-log-score")).toBeEnabled();
  await page.getByTestId("player-training-log-score").click();
  const reveal = page.getByTestId("player-pb-achievement-reveal");
  await expect(reveal).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("player-pb-achievement-mark")).toHaveAttribute("data-performance-kind", "pb");
  await expect(reveal.getByText("PERSONAL BEST", { exact: true })).toBeVisible();
  await expect(reveal.getByText(/Previous/i)).toBeVisible();
  await expect(reveal.getByRole("button", { name: "Bank this result" })).toBeVisible();
  const card = reveal.locator(".performanceRevealCard");
  const style = await card.evaluate((node) => ({ radius: parseFloat(getComputedStyle(node).borderRadius), background: getComputedStyle(node).backgroundImage }));
  expect(style.radius).toBeGreaterThanOrEqual(24);
  expect(style.background).toContain("gradient");
  await noOverflow(page);
  await capture(page, "09c-phase4b-player-pb-achievement.png");
});

test("Phase 4B renders earned streak milestones as an achievement cabinet", async ({ page }) => {
  await seedSevenDayDemoStreak(page);
  await enterPlayerDemo(page);
  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Progress", exact: true }).click();
  await page.getByTestId("player-progress-open-profile").click();
  const shelf = page.getByTestId("player-achievement-shelf");
  await expect(shelf).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("player-achievement-7")).toBeVisible();
  await shelf.scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  await noOverflow(page);
  await capture(page, "09d-phase4b-player-achievement-cabinet.png");
});

test("Phase 4B leaves Coach Mission Control free of player achievement overlays", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Coach demo/i }).click();
  await expect(page.getByTestId("coach-primary-objective")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("player-pb-achievement-reveal")).toHaveCount(0);
  await expect(page.getByTestId("player-streak-achievement-reveal")).toHaveCount(0);
  await expect(page.getByTestId("player-achievement-shelf")).toHaveCount(0);
  await noOverflow(page);
  await capture(page, "09e-phase4b-coach-regression.png");
});
