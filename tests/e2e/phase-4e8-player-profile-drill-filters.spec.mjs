import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-4e8-player-profile-drill-filters");
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

  const analytics = page.getByTestId("player-analytics-sections");
  await expect(analytics).toBeVisible({ timeout: 20_000 });
  await analytics.locator('button[data-analytics-section="progress"]').click();
  await settle(page);

  const contexts = page.getByTestId("player-analytics-contexts");
  await expect(contexts).toBeVisible({ timeout: 20_000 });
  const home = contexts.locator('button[data-analytics-context-option="home"]');
  if ((await home.getAttribute("aria-pressed")) !== "true") {
    await home.click();
    await settle(page);
  }

  const group = page.getByTestId("player-analytics-drills");
  await expect(group).toBeVisible({ timeout: 20_000 });
  await group.scrollIntoViewIfNeeded();
  await settle(page);
  return { performance, group };
}

function overlapArea(a, b) {
  if (!a || !b) return 0;
  const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return width > 2 && height > 2 ? width * height : 0;
}

test("Phase 4E.8 keeps Player Profile drill filters touch-safe without wrap collisions", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const { performance, group } = await enterPlayerProfile(page);
  const filters = group.locator('button[data-analytics-drill]');
  const count = await filters.count();
  expect(count, "visible demo drill filters").toBeGreaterThan(0);

  const evidence = [];
  const boxes = [];
  for (let index = 0; index < count; index += 1) {
    const button = filters.nth(index);
    await expect(button).toBeVisible();
    const box = await button.boundingBox();
    const style = await button.evaluate((node) => {
      const css = getComputedStyle(node);
      return {
        drillId: node.getAttribute("data-analytics-drill"),
        label: String(node.textContent || "").replace(/\s+/g, " ").trim(),
        ariaPressed: node.getAttribute("aria-pressed"),
        height: parseFloat(css.height),
        minHeight: parseFloat(css.minHeight),
        maxHeight: css.maxHeight,
        fontSize: parseFloat(css.fontSize),
        fontWeight: css.fontWeight,
        borderRadius: css.borderRadius,
        boxSizing: css.boxSizing,
        touchAction: css.touchAction,
        whiteSpace: css.whiteSpace,
      };
    });
    expect(box?.height || 0, `${style.label} physical height`).toBeGreaterThanOrEqual(43.5);
    expect(box?.width || 0, `${style.label} physical width`).toBeGreaterThanOrEqual(44);
    expect(style.minHeight, `${style.label} CSS minimum`).toBeGreaterThanOrEqual(44);
    expect(style.fontSize, `${style.label} typography`).toBe(10);
    expect(Number(style.fontWeight), `${style.label} weight`).toBeGreaterThanOrEqual(600);
    expect(style.boxSizing).toBe("border-box");
    expect(style.touchAction).toBe("manipulation");
    evidence.push({ box, style });
    boxes.push(box);
  }

  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      expect(overlapArea(boxes[i], boxes[j]), `drill filter ${i + 1} must not overlap ${j + 1}`).toBe(0);
    }
  }

  for (let index = 0; index < count; index += 1) {
    await filters.nth(index).click();
    await settle(page);
    await expect(filters.nth(index), `drill filter ${index + 1} selected state`).toHaveAttribute("aria-pressed", "true");
  }

  const horizontal = await page.evaluate(() => ({
    innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(horizontal.documentWidth - horizontal.innerWidth, "Profile document overflow").toBeLessThanOrEqual(1);
  expect(horizontal.bodyWidth - horizontal.innerWidth, "Profile body overflow").toBeLessThanOrEqual(1);

  await group.scrollIntoViewIfNeeded();
  await settle(page);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "player-profile-drill-filters-viewport.png"), animations: "disabled" });
  await group.screenshot({ path: path.join(OUTPUT_DIR, "player-profile-drill-filters-control.png"), animations: "disabled" });
  await performance.screenshot({ path: path.join(OUTPUT_DIR, "player-profile-drill-filters-performance.png"), animations: "disabled" });
  fs.writeFileSync(path.join(OUTPUT_DIR, "player-profile-drill-filters.json"), JSON.stringify({ horizontal, evidence }, null, 2));

  expect(pageErrors).toEqual([]);
});
