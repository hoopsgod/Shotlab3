import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-4b-player-micro-action-hit-area");
const MIN_TOUCH_TARGET = 43.5;

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

test.use({ viewport: { width: 390, height: 844 } });

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/coach/players/provision**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ team_id: "demo", limit: 10, scope: "players", count: 0, leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function settle(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    window.scrollTo(0, 0);
    document.querySelector(".player-scroll-container")?.scrollTo(0, 0);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.waitForTimeout(100);
}

async function enterPlayerDemo(page) {
  await installSafeRoutes(page);
  await page.goto("/");
  const demo = page.getByRole("button", { name: /Player demo/i });
  await expect(demo).toBeVisible({ timeout: 20_000 });
  await demo.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await settle(page);
}

async function openTrain(page) {
  const dockTarget = page.getByTestId("mobile-navigation-dock").locator('[data-nav-key="log-drill"]');
  if (await dockTarget.count()) {
    await dockTarget.click();
  } else {
    await page.getByTestId("mobile-navigation-more").click();
    const sheet = page.getByTestId("mobile-navigation-sheet");
    await expect(sheet).toBeVisible();
    await sheet.locator('[data-nav-key="log-drill"]').click();
  }
  await settle(page);
}

test("Player Train SHOT STATS stays visually quiet while becoming touch-safe", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await enterPlayerDemo(page);
  await openTrain(page);

  const action = page.getByRole("button", { name: /SHOT STATS/i });
  await expect(action).toBeVisible();

  const box = await action.boundingBox();
  expect(box?.height || 0, "SHOT STATS touch target height").toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  expect(box?.width || 0, "SHOT STATS remains a broad secondary action").toBeGreaterThan(240);

  const presentation = await action.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      backgroundColor: style.backgroundColor,
      borderTopWidth: style.borderTopWidth,
      borderRightWidth: style.borderRightWidth,
      borderBottomWidth: style.borderBottomWidth,
      borderLeftWidth: style.borderLeftWidth,
      fontSize: Number.parseFloat(style.fontSize),
      fontWeight: style.fontWeight,
      minHeight: Number.parseFloat(style.minHeight),
      paddingTop: Number.parseFloat(style.paddingTop),
      paddingBottom: Number.parseFloat(style.paddingBottom),
    };
  });

  expect(["rgba(0, 0, 0, 0)", "transparent"]).toContain(presentation.backgroundColor);
  expect(presentation.borderTopWidth).toBe("0px");
  expect(presentation.borderRightWidth).toBe("0px");
  expect(presentation.borderBottomWidth).toBe("0px");
  expect(presentation.borderLeftWidth).toBe("0px");
  expect(presentation.fontSize).toBeGreaterThanOrEqual(11);
  expect(presentation.fontSize).toBeLessThanOrEqual(13);
  expect(presentation.minHeight).toBeGreaterThanOrEqual(44);
  expect(presentation.paddingTop).toBeGreaterThanOrEqual(9);
  expect(presentation.paddingBottom).toBeGreaterThanOrEqual(9);

  const viewport = await page.evaluate(() => ({
    innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(viewport.documentWidth - viewport.innerWidth).toBeLessThanOrEqual(1);
  expect(viewport.bodyWidth - viewport.innerWidth).toBeLessThanOrEqual(1);

  fs.writeFileSync(path.join(OUTPUT_DIR, "player-train-shot-stats.json"), JSON.stringify({ box, presentation, viewport }, null, 2));

  await action.scrollIntoViewIfNeeded();
  await page.waitForTimeout(60);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "player-train-shot-stats.png"), animations: "disabled" });
  await action.screenshot({ path: path.join(OUTPUT_DIR, "player-train-shot-stats-control.png"), animations: "disabled" });

  await action.click();
  await expect(page.getByRole("button", { name: /BACK TO DRILLS/i })).toBeVisible();
  await page.screenshot({ path: path.join(OUTPUT_DIR, "player-shot-stats-open.png"), animations: "disabled" });

  expect(pageErrors).toEqual([]);
});
