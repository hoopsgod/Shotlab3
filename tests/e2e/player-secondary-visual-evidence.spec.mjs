import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/player-secondary-visual-evidence");
const BASELINE_SHA = "4bb11be8da71989a1d5935185ddeebd75e03ade4";
const BASELINE_ORIGIN = process.env.PLAYER_SECONDARY_BASELINE_ORIGIN || "https://b9c8e0be.shotlab3.pages.dev";
const PROTOTYPE_ORIGIN = process.env.PLAYER_SECONDARY_PROTOTYPE_ORIGIN || "http://127.0.0.1:4173";
const PROTOTYPE_SHA = process.env.PLAYER_SECONDARY_PROTOTYPE_SHA || process.env.GITHUB_SHA || "local-checkout";

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
test.use({ viewport: { width: 390, height: 844 } });

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, async (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function suppressMotion(page) {
  await page.addStyleTag({ content: `
    *,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;caret-color:transparent!important}
    html,body{scrollbar-width:none!important}
    ::-webkit-scrollbar{display:none!important}
  ` });
}

async function enterDemoAt(page, origin) {
  await page.goto(`${origin}/`);
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  await suppressMotion(page);
  await expect(page.getByRole("button", { name: /Player demo/i })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: /Player demo/i }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(180);
  await resetScroll(page);
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
    await expect(sheet).toHaveCount(0);
  }
  await page.waitForTimeout(180);
  await resetScroll(page);
}

async function resetScroll(page) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelector(".player-scroll-container")?.scrollTo(0, 0);
  });
  await page.waitForTimeout(80);
}

async function expectNoHorizontalOverflow(page) {
  const geometry = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(geometry.documentWidth - geometry.viewport).toBeLessThanOrEqual(1);
  expect(geometry.bodyWidth - geometry.viewport).toBeLessThanOrEqual(1);
}

async function capture(page, filename) {
  await expectNoHorizontalOverflow(page);
  const filePath = path.join(OUTPUT_DIR, filename);
  await page.screenshot({ path: filePath, animations: "disabled" });
  expect(fs.statSync(filePath).size).toBeGreaterThan(15_000);
}

async function captureSurfaceSet(page, origin, prefix) {
  await enterDemoAt(page, origin);
  await expect(page.getByTestId("player-dashboard-identity-header")).toHaveAttribute("data-title-stage-family", "identity");
  await capture(page, `${prefix}-player-home-390.png`);

  await navigateByKey(page, "log-drill");
  await expect(page.getByTestId("player-at-home-workspace")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("player-at-home-workspace-title-stage").locator('[data-identity-role="page-title"]')).toHaveText("At Home Training");
  await capture(page, `${prefix}-player-at-home-390.png`);

  await navigateByKey(page, "duels");
  await expect(page.getByTestId("player-program-workspace")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("player-program-workspace-title-stage").locator('[data-identity-role="page-title"]')).toHaveText("Program Training");
  await capture(page, `${prefix}-player-program-390.png`);

  await navigateByKey(page, "profile");
  await expect(page.getByTestId("player-progress-team-title")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("player-progress-team-title").locator('[data-identity-role="page-title"]')).toHaveText("Progress");
  await expect(page.getByTestId("player-progress-story")).toBeVisible();
  await capture(page, `${prefix}-player-progress-390.png`);
}

test("capture immutable production before and exact-checkout prototype after at 390px", async ({ page }) => {
  test.setTimeout(150_000);
  await installSafeRoutes(page);

  await captureSurfaceSet(page, BASELINE_ORIGIN, "before");
  await captureSurfaceSet(page, PROTOTYPE_ORIGIN, "after");

  fs.writeFileSync(path.join(OUTPUT_DIR, "evidence-manifest.json"), JSON.stringify({
    viewport: { width: 390, height: 844 },
    baseline: { sha: BASELINE_SHA, origin: BASELINE_ORIGIN },
    prototype: { sha: PROTOTYPE_SHA, origin: PROTOTYPE_ORIGIN },
    surfaces: ["Player Dashboard/Home", "At Home Training", "Program Training", "Progress"],
  }, null, 2));
});
