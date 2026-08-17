import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-5-mobile-precision-evidence");
const MOBILE_VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
];
const BOUNDED_DRILL = {
  id: "phase-5-target-court-100",
  name: "TARGET COURT 100",
  desc: "Make 100 shots at game pace.",
  max: 100,
  icon: "mr",
  instructions: "Complete the reps and log the result.",
  slug: "phase-5-target-court-100",
  mode: "home",
};

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

test.use({ viewport: { width: 390, height: 844 } });

async function installRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function installBoundedDrill(page) {
  await page.addInitScript((boundedDrill) => {
    const key = "sl:drills";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify([
      boundedDrill,
      ...existing.filter((item) => item?.id !== boundedDrill.id),
    ]));
  }, BOUNDED_DRILL);
}

async function suppressMotion(page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addStyleTag({ content: `
    html, body { scrollbar-width: none !important; }
    ::-webkit-scrollbar { display: none !important; }
  ` });
}

async function reset(page) {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await suppressMotion(page);
}

async function enterPlayerDemo(page) {
  await installRoutes(page);
  await installBoundedDrill(page);
  await reset(page);
  await expect(page.getByRole("button", { name: /Player demo/i })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: /Player demo/i }).click();
  await expect(page.locator(".player-scroll-container")).toBeVisible({ timeout: 20_000 });
}

async function enterCoachDemo(page) {
  await installRoutes(page);
  await reset(page);
  await expect(page.getByRole("button", { name: /Coach demo/i })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: /Coach demo/i }).click();
  await expect(page.getByRole("complementary", { name: "Coach navigation" })).toBeVisible({ timeout: 20_000 });
}

async function navigateMobile(page, key, label) {
  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(dock).toBeVisible({ timeout: 20_000 });
  const direct = dock.locator(`[data-nav-key="${key}"]`);
  if (await direct.count()) {
    await direct.click();
    return;
  }
  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  const keyed = sheet.locator(`[data-nav-key="${key}"]`);
  if (await keyed.count()) await keyed.click();
  else await sheet.getByRole("button", { name: label, exact: true }).click();
}

async function openBoundedSession(page) {
  await navigateMobile(page, "log-drill", "Train");
  await expect(page.getByTestId("player-at-home-workspace")).toBeVisible({ timeout: 20_000 });
  const drill = page.getByRole("button", { name: /TARGET COURT 100/i });
  await expect(drill).toBeVisible();
  await drill.click();
  await expect(page.getByTestId("player-training-session")).toBeVisible({ timeout: 15_000 });
}

async function noHorizontalOverflow(page) {
  const geometry = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(geometry.document - geometry.viewport).toBeLessThanOrEqual(1);
  expect(geometry.body - geometry.viewport).toBeLessThanOrEqual(1);
}

async function capture(page, name, { fullPage = false } = {}) {
  await page.evaluate(() => document.fonts?.ready);
  await noHorizontalOverflow(page);
  const file = path.join(OUTPUT_DIR, name);
  await page.screenshot({ path: file, fullPage, animations: "disabled" });
  expect(fs.statSync(file).size).toBeGreaterThan(15_000);
}

async function assertTrainingGeometry(page) {
  const input = page.getByTestId("player-training-session").locator('input[type="number"]').first();
  const log = page.getByTestId("player-training-log-score");
  const inputGeometry = await input.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return {
      left: rect.left,
      right: rect.right,
      height: rect.height,
      fontSize: parseFloat(style.fontSize),
      appearance: style.appearance || style.webkitAppearance,
      viewport: window.innerWidth,
    };
  });
  const logGeometry = await log.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return { height: rect.height, left: rect.left, right: rect.right, viewport: window.innerWidth };
  });
  expect(inputGeometry.left).toBeGreaterThanOrEqual(0);
  expect(inputGeometry.right).toBeLessThanOrEqual(inputGeometry.viewport + 0.5);
  expect(inputGeometry.height).toBeGreaterThanOrEqual(44);
  expect(inputGeometry.fontSize).toBeGreaterThanOrEqual(50);
  expect(inputGeometry.appearance).not.toMatch(/auto|number-input/i);
  expect(logGeometry.height).toBeGreaterThanOrEqual(46);
  expect(logGeometry.left).toBeGreaterThanOrEqual(0);
  expect(logGeometry.right).toBeLessThanOrEqual(logGeometry.viewport + 0.5);
}

test("bounded drill entry proves 0, 25, 85, and 100 states without crossing the drill contract", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await enterPlayerDemo(page);
  await openBoundedSession(page);

  const target = page.getByTestId("player-training-live-target");
  const input = page.getByTestId("player-training-session").locator('input[type="number"]').first();
  const log = page.getByTestId("player-training-log-score");

  await expect(target).toHaveAttribute("data-performance-state", "zero");
  await expect(target).toHaveAttribute("aria-label", "0 on this drill. Target 100. 100 to target.");
  await expect(log).toBeDisabled();
  await assertTrainingGeometry(page);
  await capture(page, "390-bounded-00-zero.png");

  await input.fill("25");
  await expect(target).toHaveAttribute("data-performance-state", "partial");
  await expect(target).toHaveAttribute("aria-label", "25 on this drill. Target 100. 75 to target.");
  await expect(log).toBeEnabled();
  await capture(page, "390-bounded-25-partial.png");

  await input.fill("85");
  await expect(target).toHaveAttribute("data-performance-state", "near");
  await expect(target).toHaveAttribute("aria-label", "85 on this drill. Target 100. 15 to target.");
  await capture(page, "390-bounded-85-near.png");

  await input.fill("100");
  await expect(target).toHaveAttribute("data-performance-state", "complete");
  await expect(target).toHaveAttribute("aria-label", "100 on this drill. Target 100. Target locked.");
  await expect(target.getByText("Target locked", { exact: true })).toBeVisible();
  await assertTrainingGeometry(page);
  await capture(page, "390-bounded-100-locked.png");

  expect(pageErrors).toEqual([]);
});

test("three-digit locked entry remains production-safe at 375, 390, and 430px", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  for (const viewport of MOBILE_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await enterPlayerDemo(page);
    await openBoundedSession(page);
    const input = page.getByTestId("player-training-session").locator('input[type="number"]').first();
    await input.fill("100");
    await expect(page.getByTestId("player-training-live-target")).toHaveAttribute("data-performance-state", "complete");
    await assertTrainingGeometry(page);
    await capture(page, `${viewport.width}-bounded-100-locked.png`);
  }

  expect(pageErrors).toEqual([]);
});

test("home daily Target Court preserves a meaningful above-target banked state", async ({ page }) => {
  await enterPlayerDemo(page);
  const court = page.getByTestId("player-daily-performance-court");
  await expect(court).toBeVisible({ timeout: 20_000 });
  await expect(court).toHaveAttribute("data-performance-state", "above");
  await expect(court).toHaveAttribute("data-target-percent", "100");
  await expect(court).toHaveAttribute("data-above-target", "25");
  await expect(court).toHaveAttribute("aria-label", "125 makes today. Target 100. 25 above target.");
  await expect(court.getByText("+25 banked", { exact: true })).toBeVisible();
  await capture(page, "390-home-125-banked.png");
});

test("completion feedback clears the mobile dock and safe action region", async ({ page }) => {
  await enterPlayerDemo(page);
  await openBoundedSession(page);
  const input = page.getByTestId("player-training-session").locator('input[type="number"]').first();
  await input.fill("100");
  await page.getByTestId("player-training-log-score").click();

  const cue = page.getByTestId("player-completion-cue");
  await expect(cue).toBeVisible({ timeout: 10_000 });
  const geometry = await page.evaluate(() => {
    const cue = document.querySelector('[data-testid="player-completion-cue"]')?.getBoundingClientRect();
    const dock = document.querySelector('[data-testid="mobile-navigation-dock"]')?.getBoundingClientRect();
    return cue && dock ? { cueBottom: cue.bottom, dockTop: dock.top } : null;
  });
  expect(geometry).not.toBeNull();
  expect(geometry.cueBottom).toBeLessThanOrEqual(geometry.dockTop - 4);
  await capture(page, "390-completion-feedback-clearance.png");
});

test("1280px Player and Coach representative workspaces remain coherent", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await enterPlayerDemo(page);
  await expect(page.getByTestId("player-daily-performance-court")).toBeVisible({ timeout: 20_000 });
  await capture(page, "1280-player-home.png");

  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.goto("/");
  await suppressMotion(page);
  await expect(page.getByRole("button", { name: /Coach demo/i })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: /Coach demo/i }).click();
  await expect(page.getByRole("complementary", { name: "Coach navigation" })).toBeVisible({ timeout: 20_000 });
  await capture(page, "1280-coach-home.png");

  const playerNav = page.locator('[data-nav-key="players"]').first();
  if (await playerNav.count()) {
    await playerNav.click();
    await page.waitForTimeout(250);
    await capture(page, "1280-coach-players.png");
  }
});
