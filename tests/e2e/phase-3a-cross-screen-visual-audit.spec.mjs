import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-3a-cross-screen-visual-audit");

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

test.use({ viewport: { width: 390, height: 844 } });

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) });
  });
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
}

async function suppressMotion(page) {
  await page.addStyleTag({ content: `
    *, *::before, *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      caret-color: transparent !important;
    }
    html, body { scrollbar-width: none !important; }
    ::-webkit-scrollbar { display: none !important; }
  ` });
}

async function stabilize(page) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelector(".player-scroll-container")?.scrollTo(0, 0);
    document.querySelector(".coach-scroll-container")?.scrollTo(0, 0);
  });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(300);
}

async function expectNoHorizontalOverflow(page) {
  const geometry = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(geometry.documentWidth - geometry.viewportWidth).toBeLessThanOrEqual(1);
  expect(geometry.bodyWidth - geometry.viewportWidth).toBeLessThanOrEqual(1);
}

async function capture(page, fileName, { authenticated = true } = {}) {
  await stabilize(page);
  await expectNoHorizontalOverflow(page);
  if (authenticated) await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible();
  const outputPath = path.join(OUTPUT_DIR, fileName);
  await page.screenshot({ path: outputPath, animations: "disabled" });
  expect(fs.statSync(outputPath).size).toBeGreaterThan(20_000);
}

async function enterDemo(page, role) {
  await installSafeRoutes(page);
  await page.goto("/");
  await suppressMotion(page);
  const label = role === "coach" ? /Coach demo/i : /Player demo/i;
  const button = page.getByRole("button", { name: label });
  await expect(button).toBeVisible({ timeout: 20_000 });
  await button.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

async function navigateByKey(page, key) {
  const dock = page.getByTestId("mobile-navigation-dock");
  const direct = dock.locator(`[data-nav-key="${key}"]`);
  if (await direct.count()) {
    await direct.click();
  } else {
    await page.getByTestId("mobile-navigation-more").click();
    const sheet = page.getByTestId("mobile-navigation-sheet");
    await expect(sheet).toBeVisible();
    const item = sheet.locator(`[data-nav-key="${key}"]`);
    await expect(item).toBeVisible();
    await item.click();
    await expect(page.getByTestId("mobile-navigation-sheet")).toHaveCount(0);
  }
  await page.waitForTimeout(250);
}

test("Phase 3A captures auth and Coach visual hierarchy at iPhone width", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await installSafeRoutes(page);
  await page.goto("/");
  await suppressMotion(page);
  await expect(page.getByRole("button", { name: /Coach demo/i })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("button", { name: /Player demo/i })).toBeVisible({ timeout: 20_000 });
  await capture(page, "01-auth-entry.png", { authenticated: false });

  await page.getByRole("button", { name: /Coach demo/i }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await capture(page, "02-coach-home.png");

  await navigateByKey(page, "players");
  await capture(page, "03-coach-players.png");

  await navigateByKey(page, "events");
  await capture(page, "04-coach-schedule.png");

  await navigateByKey(page, "leaderboards");
  await capture(page, "05-coach-leaderboards.png");

  expect(pageErrors).toEqual([]);
});

test("Phase 3A captures Player activation and progress hierarchy at iPhone width", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await enterDemo(page, "player");
  await capture(page, "06-player-home.png");

  await navigateByKey(page, "log-drill");
  await capture(page, "07-player-train.png");

  await navigateByKey(page, "profile");
  await capture(page, "08-player-progress.png");

  await navigateByKey(page, "program");
  await capture(page, "09-player-program.png");

  await navigateByKey(page, "leaderboards");
  await capture(page, "10-player-rankings.png");

  expect(pageErrors).toEqual([]);
});
