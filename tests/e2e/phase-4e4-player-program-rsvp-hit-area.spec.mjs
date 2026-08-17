import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-4e4-player-program-rsvp-hit-area");
const MIN_TOUCH_TARGET = 45;

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
test.use({ viewport: { width: 390, height: 844 } });

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ team_id: "demo", limit: 10, scope: "players", count: 0, leaderboard: [] }) }));
  await page.route("**/v1/leaderboards/participation**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, leaderboards: {} }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function settle(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.waitForTimeout(100);
}

async function enterExpandedProgram(page) {
  await installSafeRoutes(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Player demo/i }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });

  const dock = page.getByTestId("mobile-navigation-dock");
  const direct = dock.locator('[data-nav-key="program"]');
  if (await direct.count()) await direct.click();
  else {
    await page.getByTestId("mobile-navigation-more").click();
    const sheet = page.getByTestId("mobile-navigation-sheet");
    await expect(sheet).toBeVisible();
    await sheet.locator('[data-nav-key="program"]').click();
  }
  await settle(page);

  const hero = page.getByTestId("player-events-next-up");
  await expect(hero).toBeVisible({ timeout: 20_000 });
  await hero.getByRole("button").click();
  await expect(page.getByTestId("player-commitment-details-events")).toHaveAttribute("open", "");
  await expect(page.getByTestId("player-event-detail")).toBeVisible({ timeout: 10_000 });
  await settle(page);
}

test("Phase 4E.4 keeps the private Player RSVP action touch-safe and stateful", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await enterExpandedProgram(page);

  const action = page.locator('button[data-player-program-rsvp-action]:visible');
  await expect(action).toHaveCount(1);
  const box = await action.boundingBox();
  const presentation = await action.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      label: String(node.textContent || "").replace(/\s+/g, " ").trim(),
      height: Number.parseFloat(style.height),
      minHeight: Number.parseFloat(style.minHeight),
      borderRadius: Number.parseFloat(style.borderRadius),
      boxSizing: style.boxSizing,
      touchAction: style.touchAction,
    };
  });

  expect(box?.height || 0, `${presentation.label} physical height`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  expect(box?.width || 0, `${presentation.label} physical width`).toBeGreaterThanOrEqual(44);
  expect(presentation.minHeight, `${presentation.label} CSS minimum`).toBeGreaterThanOrEqual(46);
  expect(presentation.height, `${presentation.label} computed height`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  expect(presentation.borderRadius, `${presentation.label} radius`).toBeGreaterThanOrEqual(8);
  expect(presentation.boxSizing).toBe("border-box");
  expect(presentation.touchAction).toBe("manipulation");
  expect(presentation.label).toMatch(/Confirm going|Remove RSVP/);

  const viewport = await page.evaluate(() => ({ innerWidth, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth }));
  expect(viewport.documentWidth - viewport.innerWidth, "Program document overflow").toBeLessThanOrEqual(1);
  expect(viewport.bodyWidth - viewport.innerWidth, "Program body overflow").toBeLessThanOrEqual(1);

  const before = presentation.label;
  await action.click();
  await settle(page);
  const refreshed = page.locator('button[data-player-program-rsvp-action]:visible');
  await expect(refreshed).toHaveCount(1);
  await expect(refreshed).toHaveText(before === "Confirm going" ? "Remove RSVP" : "Confirm going");
  const refreshedBox = await refreshed.boundingBox();
  expect(refreshedBox?.height || 0, "post-RSVP physical height").toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);

  await page.screenshot({ path: path.join(OUTPUT_DIR, "player-program-private-rsvp-detail.png"), fullPage: true, animations: "disabled" });
  await refreshed.screenshot({ path: path.join(OUTPUT_DIR, "player-program-rsvp-control.png"), animations: "disabled" });
  fs.writeFileSync(path.join(OUTPUT_DIR, "player-program-rsvp-control.json"), JSON.stringify({ viewport, before, after: before === "Confirm going" ? "Remove RSVP" : "Confirm going", box, presentation }, null, 2));
  expect(pageErrors).toEqual([]);
});