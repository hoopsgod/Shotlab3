import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-4d-shared-return-navigation-hit-area");
const MIN_TOUCH_TARGET = 43.5;

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

test.use({ viewport: { width: 390, height: 844 } });

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/coach/players/provision**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ team_id: "demo", limit: 10, scope: "players", count: 0, leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function settle(page, role) {
  await page.evaluate(async ({ role }) => {
    if (document.fonts?.ready) await document.fonts.ready;
    window.scrollTo(0, 0);
    document.querySelector(role === "coach" ? ".coach-scroll-container" : ".player-scroll-container")?.scrollTo(0, 0);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }, { role });
  await page.waitForTimeout(100);
}

async function enterDemo(page, role) {
  await installSafeRoutes(page);
  await page.goto("/");
  const demo = page.getByRole("button", { name: role === "coach" ? /Coach demo/i : /Player demo/i });
  await expect(demo).toBeVisible({ timeout: 20_000 });
  await demo.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await settle(page, role);
}

async function navigateByKey(page, key, role) {
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
  await settle(page, role);
}

async function verifyReturnControl(page, role, surface) {
  const control = page.locator("button.shotlab-dashboard-return-button").first();
  await expect(control, `${role}/${surface} shared return control`).toBeVisible();
  await expect(control).toContainText(/Dashboard/i);

  const box = await control.boundingBox();
  expect(box?.height || 0, `${role}/${surface} return target height`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  expect(box?.width || 0, `${role}/${surface} return target width`).toBeGreaterThanOrEqual(44);

  const presentation = await control.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      minHeight: Number.parseFloat(style.minHeight),
      height: Number.parseFloat(style.height),
      borderRadius: Number.parseFloat(style.borderRadius),
      fontSize: Number.parseFloat(style.fontSize),
      fontWeight: style.fontWeight,
      touchAction: style.touchAction,
      backgroundColor: style.backgroundColor,
      borderTopWidth: style.borderTopWidth,
    };
  });

  expect(presentation.minHeight).toBeGreaterThanOrEqual(44);
  expect(presentation.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  expect(presentation.borderRadius).toBeGreaterThanOrEqual(12);
  expect(presentation.fontSize).toBeGreaterThanOrEqual(10);
  expect(Number(presentation.fontWeight)).toBeGreaterThanOrEqual(700);
  expect(presentation.touchAction).toBe("manipulation");

  const viewport = await page.evaluate(() => ({
    innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(viewport.documentWidth - viewport.innerWidth, `${role}/${surface} document width`).toBeLessThanOrEqual(1);
  expect(viewport.bodyWidth - viewport.innerWidth, `${role}/${surface} body width`).toBeLessThanOrEqual(1);

  return { role, surface, box, presentation, viewport };
}

for (const roleConfig of [
  { role: "coach", surfaces: ["players", "leaderboards"] },
  { role: "player", surfaces: ["log-drill", "profile", "program", "leaderboards"] },
]) {
  test(`Phase 4D keeps ${roleConfig.role} shared return navigation touch-safe`, async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await enterDemo(page, roleConfig.role);

    const evidence = [];
    for (const surface of roleConfig.surfaces) {
      await navigateByKey(page, surface, roleConfig.role);
      const result = await verifyReturnControl(page, roleConfig.role, surface);
      evidence.push(result);

      if (surface === roleConfig.surfaces[0]) {
        await page.screenshot({
          path: path.join(OUTPUT_DIR, `${roleConfig.role}-${surface}-return-navigation.png`),
          animations: "disabled",
        });
        await page.locator("button.shotlab-dashboard-return-button").first().screenshot({
          path: path.join(OUTPUT_DIR, `${roleConfig.role}-${surface}-return-control.png`),
          animations: "disabled",
        });
      }

      await page.locator("button.shotlab-dashboard-return-button").first().click();
      await settle(page, roleConfig.role);
      await expect(page.locator("button.shotlab-dashboard-return-button")).toHaveCount(0);
      await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible();
    }

    fs.writeFileSync(
      path.join(OUTPUT_DIR, `${roleConfig.role}-shared-return-navigation.json`),
      JSON.stringify(evidence, null, 2),
    );
    expect(pageErrors).toEqual([]);
  });
}
