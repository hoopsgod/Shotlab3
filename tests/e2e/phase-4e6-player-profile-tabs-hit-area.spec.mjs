import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-4e6-player-profile-tabs-hit-area");
const LABELS = ["Progress", "Skills", "Streaks", "Goals"];
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
test.use({ viewport: { width: 390, height: 844 } });

async function settle(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.waitForTimeout(100);
}

async function enterPlayerProfile(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ team_id: "demo", limit: 10, scope: "players", count: 0, leaderboard: [] }) }));
  await page.route("**/v1/leaderboards/participation**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, leaderboards: {} }) }));
  await page.goto("/");
  await page.getByRole("button", { name: /Player demo/i }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });

  const dock = page.getByTestId("mobile-navigation-dock");
  const direct = dock.locator('[data-nav-key="profile"]');
  if (await direct.count()) await direct.click();
  else {
    await page.getByTestId("mobile-navigation-more").click();
    await page.getByTestId("mobile-navigation-sheet").locator('[data-nav-key="profile"]').click();
  }
  await settle(page);

  await page.getByTestId("player-progress-open-profile").click();
  await settle(page);
  const performance = page.getByTestId("player-profile-performance-intelligence");
  if (!(await performance.evaluate((node) => node.open === true))) {
    await performance.locator("summary").click();
    await settle(page);
  }
  const group = page.getByTestId("player-analytics-sections");
  await expect(group).toBeVisible({ timeout: 20_000 });
  await group.scrollIntoViewIfNeeded();
  await settle(page);
  return { group, performance };
}

test("Phase 4E.6 keeps the four Player Profile analytics tabs touch-safe", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const { group, performance } = await enterPlayerProfile(page);
  const tabs = group.locator('button[data-analytics-section]');
  await expect(tabs).toHaveCount(4);

  const evidence = [];
  for (let index = 0; index < LABELS.length; index += 1) {
    const tab = tabs.nth(index);
    await expect(tab).toHaveText(LABELS[index]);
    const box = await tab.boundingBox();
    const style = await tab.evaluate((node) => {
      const css = getComputedStyle(node);
      return {
        height: parseFloat(css.height),
        minHeight: parseFloat(css.minHeight),
        maxHeight: css.maxHeight,
        fontSize: parseFloat(css.fontSize),
        fontWeight: css.fontWeight,
        display: css.display,
        flexDirection: css.flexDirection,
        boxSizing: css.boxSizing,
        touchAction: css.touchAction,
      };
    });
    expect(box?.height || 0, `${LABELS[index]} physical height`).toBeGreaterThanOrEqual(43.5);
    expect(box?.width || 0, `${LABELS[index]} physical width`).toBeGreaterThanOrEqual(44);
    expect(style.minHeight, `${LABELS[index]} CSS minimum`).toBeGreaterThanOrEqual(44);
    expect(style.fontSize, `${LABELS[index]} final Phase 3D typography`).toBe(10);
    expect(Number(style.fontWeight), `${LABELS[index]} final Phase 3D weight`).toBeGreaterThanOrEqual(700);
    expect(Number(style.fontWeight), `${LABELS[index]} final Phase 3D weight`).toBeLessThanOrEqual(800);
    expect(style.display).toBe("flex");
    expect(style.flexDirection).toBe("row");
    expect(style.boxSizing).toBe("border-box");
    expect(style.touchAction).toBe("manipulation");
    evidence.push({ label: LABELS[index], box, style });
  }

  for (let index = 0; index < LABELS.length; index += 1) {
    await tabs.nth(index).click();
    await settle(page);
    await expect(tabs.nth(index)).toHaveAttribute("aria-pressed", "true");
  }

  const horizontal = await page.evaluate(() => ({ innerWidth, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth }));
  expect(horizontal.documentWidth - horizontal.innerWidth).toBeLessThanOrEqual(1);
  expect(horizontal.bodyWidth - horizontal.innerWidth).toBeLessThanOrEqual(1);

  await tabs.nth(0).click();
  await group.scrollIntoViewIfNeeded();
  await settle(page);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "player-profile-analytics-tabs-viewport.png"), animations: "disabled" });
  await group.screenshot({ path: path.join(OUTPUT_DIR, "player-profile-analytics-tabs-control.png"), animations: "disabled" });
  await performance.screenshot({ path: path.join(OUTPUT_DIR, "player-profile-performance-intelligence.png"), animations: "disabled" });
  fs.writeFileSync(path.join(OUTPUT_DIR, "player-profile-analytics-tabs.json"), JSON.stringify({ horizontal, evidence }, null, 2));
  expect(pageErrors).toEqual([]);
});
