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

async function enableMotion(page) {
  await page.emulateMedia({ reducedMotion: "no-preference" });
}

async function enterPlayerDemo(page) {
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

async function openCalipariDrill(page) {
  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Train", exact: true }).click();
  await expect(page.getByTestId("player-at-home-workspace")).toBeVisible({ timeout: 20_000 });
  const drill = page.getByRole("button", { name: /CALIPARI SHOOTING/i });
  await expect(drill).toBeVisible();
  await drill.click();
  await expect(page.getByTestId("player-training-session")).toBeVisible({ timeout: 15_000 });
}

test.beforeEach(async ({ page }) => {
  await installRoutes(page);
});

test("Phase 4C gives the Player dock a consistent premium selected and press material", async ({ page }) => {
  await enableMotion(page);
  await enterPlayerDemo(page);
  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(dock).toHaveAttribute("data-navigation-role", "player");
  const home = dock.locator('[data-nav-key="home"]');
  await expect(home).toHaveAttribute("data-active", "true");
  const style = await home.evaluate((node) => {
    const computed = getComputedStyle(node);
    return { shadow: computed.boxShadow, transition: computed.transitionDuration, origin: computed.transformOrigin };
  });
  expect(style.shadow).not.toBe("none");
  expect(style.transition).not.toBe("0s");
  expect(style.origin).toBeTruthy();
  await noOverflow(page);
  await capture(page, "10a-phase4c-player-dock-material.png");
});

test("Phase 4C uses restrained translucent material for the Player More sheet", async ({ page }) => {
  await enableMotion(page);
  await enterPlayerDemo(page);
  await page.getByTestId("mobile-navigation-more").click();
  const overlay = page.getByTestId("mobile-navigation-overlay");
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(overlay).toHaveAttribute("data-navigation-role", "player");
  await expect(sheet).toHaveAttribute("data-navigation-role", "player");
  const style = await sheet.evaluate((node) => {
    const computed = getComputedStyle(node);
    return { backgroundImage: computed.backgroundImage, shadow: computed.boxShadow, animationName: computed.animationName };
  });
  const overlayStyle = await overlay.evaluate((node) => getComputedStyle(node).backdropFilter || getComputedStyle(node).webkitBackdropFilter || "");
  expect(style.backgroundImage).toContain("gradient");
  expect(style.shadow).not.toBe("none");
  expect(style.animationName).toContain("phase4cSheetIn");
  expect(overlayStyle).toContain("blur");
  await noOverflow(page);
  await capture(page, "10b-phase4c-player-more-material.png");
});

test("Phase 4C makes active score entry feel deliberate without changing score behavior", async ({ page }) => {
  await enableMotion(page);
  await enterPlayerDemo(page);
  await openCalipariDrill(page);
  const session = page.getByTestId("player-training-session");
  const input = session.locator('input[type="number"]').first();
  await input.focus();
  const zone = page.getByTestId("player-training-score-zone");
  await zone.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy({ top: 90, behavior: "instant" }));
  await page.waitForTimeout(120);
  await expect(input).toBeFocused();
  const style = await zone.evaluate((node) => {
    const computed = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return { transform: computed.transform, shadow: computed.boxShadow, transition: computed.transitionDuration, top: rect.top, bottom: rect.bottom };
  });
  expect(style.transform).not.toBe("none");
  expect(style.shadow).not.toBe("none");
  expect(style.transition).not.toBe("0s");
  expect(style.top).toBeGreaterThanOrEqual(80);
  expect(style.bottom).toBeLessThanOrEqual(790);
  await expect(page.getByTestId("player-training-log-score")).toBeDisabled();
  await noOverflow(page);
  await capture(page, "10c-phase4c-player-score-focus.png");
});

test("Phase 4C gives training completion a restrained arrival and tactile next action", async ({ page }) => {
  await enableMotion(page);
  await enterPlayerDemo(page);
  await openCalipariDrill(page);
  const input = page.getByTestId("player-training-session").locator('input[type="number"]').first();
  await input.fill("37");
  const save = page.getByTestId("player-training-log-score");
  await expect(save).toBeEnabled();
  await save.click();
  const completion = page.getByTestId("player-training-completion");
  await expect(completion).toBeVisible({ timeout: 15_000 });
  const completionStyle = await completion.evaluate((node) => ({ animationName: getComputedStyle(node).animationName }));
  const next = page.getByTestId("player-training-next-action");
  const nextStyle = await next.evaluate((node) => ({ transition: getComputedStyle(node).transitionDuration }));
  expect(completionStyle.animationName).toContain("phase4cCompletionIn");
  expect(nextStyle.transition).not.toBe("0s");
  await noOverflow(page);
  await capture(page, "10d-phase4c-player-training-completion.png");
});

test("Phase 4C leaves Coach navigation on its established material system", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Coach demo/i }).click();
  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(dock).toBeVisible({ timeout: 20_000 });
  await expect(dock).toHaveAttribute("data-navigation-role", "coach");
  await page.getByTestId("mobile-navigation-more").click();
  const overlay = page.getByTestId("mobile-navigation-overlay");
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(overlay).toHaveAttribute("data-navigation-role", "coach");
  await expect(sheet).toHaveAttribute("data-navigation-role", "coach");
  expect(await sheet.evaluate((node) => getComputedStyle(node).backgroundImage)).toBe("none");
  await noOverflow(page);
  await capture(page, "10e-phase4c-coach-material-regression.png");
});
