import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-4e2-player-program-rsvp-hit-area");
const MIN_TOUCH_TARGET = 43.5;

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
test.use({ viewport: { width: 390, height: 844 } });

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
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

async function enterPlayerProgram(page) {
  await installSafeRoutes(page);
  await page.goto("/");
  const demo = page.getByRole("button", { name: /Player demo/i });
  await expect(demo).toBeVisible({ timeout: 20_000 });
  await demo.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });

  const direct = page.getByTestId("mobile-navigation-dock").locator('[data-nav-key="program"]');
  if (await direct.count()) {
    await direct.click();
  } else {
    await page.getByTestId("mobile-navigation-more").click();
    const sheet = page.getByTestId("mobile-navigation-sheet");
    await expect(sheet).toBeVisible();
    await sheet.locator('[data-nav-key="program"]').click();
  }
  await settle(page);
}

test("Phase 4E.2 keeps Player Program RSVP actions touch-safe without changing hierarchy", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await enterPlayerProgram(page);

  const actions = page.locator('button[data-player-program-rsvp-action]:visible');
  await expect(actions.first()).toBeVisible();
  await expect(actions).toHaveCount(4);

  const evidence = [];
  for (let index = 0; index < 4; index += 1) {
    const action = actions.nth(index);
    const box = await action.boundingBox();
    const presentation = await action.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        label: String(node.textContent || "").replace(/\s+/g, " ").trim(),
        height: Number.parseFloat(style.height),
        minHeight: Number.parseFloat(style.minHeight),
        fontSize: Number.parseFloat(style.fontSize),
        borderRadius: Number.parseFloat(style.borderRadius),
        display: style.display,
        boxSizing: style.boxSizing,
        touchAction: style.touchAction,
        backgroundColor: style.backgroundColor,
        borderTopWidth: style.borderTopWidth,
      };
    });

    expect(box?.height || 0, `${presentation.label} physical height`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    expect(box?.width || 0, `${presentation.label} physical width`).toBeGreaterThanOrEqual(44);
    expect(presentation.minHeight, `${presentation.label} CSS minimum`).toBeGreaterThanOrEqual(44);
    expect(presentation.height, `${presentation.label} computed height`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    expect(presentation.fontSize, `${presentation.label} typography`).toBe(12);
    expect(presentation.borderRadius, `${presentation.label} card-action radius`).toBe(12);
    expect(presentation.display).toBe("flex");
    expect(presentation.boxSizing).toBe("border-box");
    expect(presentation.touchAction).toBe("manipulation");
    expect(presentation.label).toMatch(/YOU'RE LOCKED IN|RSVP NOW/);
    evidence.push({ box, presentation });
  }

  const viewport = await page.evaluate(() => ({
    innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(viewport.documentWidth - viewport.innerWidth, "Player Program document overflow").toBeLessThanOrEqual(1);
  expect(viewport.bodyWidth - viewport.innerWidth, "Player Program body overflow").toBeLessThanOrEqual(1);

  const unlocked = page.locator('button[data-player-program-rsvp-action]:visible').filter({ hasText: /RSVP NOW/ }).first();
  if (await unlocked.count()) {
    await unlocked.click();
    await expect(unlocked).toContainText(/YOU'RE LOCKED IN/);
    await settle(page);
    const toggledBox = await unlocked.boundingBox();
    expect(toggledBox?.height || 0, "toggled RSVP physical height").toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  }

  await page.screenshot({
    path: path.join(OUTPUT_DIR, "player-program-44px-rsvp-family.png"),
    fullPage: true,
    animations: "disabled",
  });
  await actions.first().screenshot({
    path: path.join(OUTPUT_DIR, "player-program-rsvp-control.png"),
    animations: "disabled",
  });
  fs.writeFileSync(path.join(OUTPUT_DIR, "player-program-rsvp-family.json"), JSON.stringify({ viewport, visibleActions: 4, evidence }, null, 2));
  expect(pageErrors).toEqual([]);
});
