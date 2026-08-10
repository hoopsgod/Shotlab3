import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-4e4-player-program-rsvp-hit-area");
const MIN_TOUCH_TARGET = 43.5;

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
  if (await direct.count()) {
    await direct.click();
  } else {
    await page.getByTestId("mobile-navigation-more").click();
    const sheet = page.getByTestId("mobile-navigation-sheet");
    await expect(sheet).toBeVisible();
    await sheet.locator('[data-nav-key="program"]').click();
  }
  await settle(page);

  const fullWorkspace = page.locator("details:not([open]) > summary:visible").filter({ hasText: /FULL WORKSPACE|Schedule & attendance details/i }).first();
  await expect(fullWorkspace).toBeVisible({ timeout: 20_000 });
  await fullWorkspace.click();
  await settle(page);

  await page.evaluate(async () => {
    const root = document.querySelector(".player-scroll-container");
    const scrollHeight = root?.scrollHeight || document.documentElement.scrollHeight;
    const viewport = root?.clientHeight || innerHeight;
    const step = Math.max(320, Math.floor(viewport * 0.65));
    for (let top = 0; top <= scrollHeight; top += step) {
      if (root) root.scrollTo(0, top);
      else window.scrollTo(0, top);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    if (root) root.scrollTo(0, 0);
    else window.scrollTo(0, 0);
  });
  await settle(page);
}

test("Phase 4E.4 keeps reachable Program RSVP/status actions touch-safe", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await enterExpandedProgram(page);

  const actions = page.locator('button[data-player-program-rsvp-action]:visible');
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
        boxSizing: style.boxSizing,
        touchAction: style.touchAction,
        display: style.display,
      };
    });

    expect(box?.height || 0, `${presentation.label} physical height`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    expect(box?.width || 0, `${presentation.label} physical width`).toBeGreaterThanOrEqual(44);
    expect(presentation.minHeight, `${presentation.label} CSS minimum`).toBeGreaterThanOrEqual(44);
    expect(presentation.height, `${presentation.label} computed height`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    expect(presentation.fontSize, `${presentation.label} typography`).toBe(12);
    expect(presentation.borderRadius, `${presentation.label} radius`).toBe(12);
    expect(presentation.boxSizing).toBe("border-box");
    expect(presentation.touchAction).toBe("manipulation");
    expect(presentation.display).toBe("flex");
    expect(presentation.label).toMatch(/YOU'RE LOCKED IN|RSVP NOW/);
    evidence.push({ box, presentation });
  }

  const geometry = await actions.evaluateAll((nodes) => nodes.map((node) => {
    const rect = node.getBoundingClientRect();
    return { label: String(node.textContent || "").replace(/\s+/g, " ").trim(), left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
  }));
  for (let i = 0; i < geometry.length; i += 1) {
    for (let j = i + 1; j < geometry.length; j += 1) {
      const a = geometry[i];
      const b = geometry[j];
      const overlapWidth = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const overlapHeight = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      expect(overlapWidth > 2 && overlapHeight > 2, `${a.label} must not overlap ${b.label}`).toBe(false);
    }
  }

  const viewport = await page.evaluate(() => ({
    innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(viewport.documentWidth - viewport.innerWidth, "Program document overflow").toBeLessThanOrEqual(1);
  expect(viewport.bodyWidth - viewport.innerWidth, "Program body overflow").toBeLessThanOrEqual(1);

  const lockedBefore = await actions.filter({ hasText: /YOU'RE LOCKED IN/ }).count();
  const unlocked = actions.filter({ hasText: /RSVP NOW/ }).first();
  await expect(unlocked).toBeVisible();
  await unlocked.click();
  await settle(page);

  const refreshedActions = page.locator('button[data-player-program-rsvp-action]:visible');
  await expect(refreshedActions).toHaveCount(4);
  await expect(refreshedActions.filter({ hasText: /YOU'RE LOCKED IN/ })).toHaveCount(lockedBefore + 1);
  await expect(refreshedActions.filter({ hasText: /RSVP NOW/ })).toHaveCount(0);

  for (let index = 0; index < 4; index += 1) {
    const box = await refreshedActions.nth(index).boundingBox();
    expect(box?.height || 0, `post-RSVP action ${index + 1} physical height`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  }

  await page.screenshot({
    path: path.join(OUTPUT_DIR, "player-program-expanded-44px-rsvp-family.png"),
    fullPage: true,
    animations: "disabled",
  });
  await refreshedActions.last().screenshot({
    path: path.join(OUTPUT_DIR, "player-program-rsvp-control.png"),
    animations: "disabled",
  });
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "player-program-rsvp-family.json"),
    JSON.stringify({ viewport, evidence, lockedBefore, lockedAfter: lockedBefore + 1 }, null, 2),
  );
  expect(pageErrors).toEqual([]);
});
