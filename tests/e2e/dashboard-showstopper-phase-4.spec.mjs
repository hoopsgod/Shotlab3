import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve(process.cwd(), "artifacts/dashboard-showstopper-phase-4/screenshots");
const BOUNDED_DRILL = {
  id: "phase-4-target-court-50",
  name: "TARGET COURT 50",
  desc: "Make 50 shots at game pace.",
  max: 50,
  icon: "mr",
  instructions: "Complete the reps and log the result.",
  slug: "phase-4-target-court-50",
  mode: "home",
};

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

async function enterPlayerDemo(page) {
  await installRoutes(page);
  await page.addInitScript((boundedDrill) => {
    const key = "sl:drills";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify([boundedDrill, ...existing.filter((item) => item?.id !== boundedDrill.id)]));
  }, BOUNDED_DRILL);
  await page.goto("/");
  await page.getByRole("button", { name: /Player demo/i }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

async function openBoundedDrill(page) {
  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Train", exact: true }).click();
  await expect(page.getByTestId("player-at-home-workspace")).toBeVisible({ timeout: 20_000 });
  const drill = page.getByRole("button", { name: /TARGET COURT 50/i });
  await expect(drill).toBeVisible();
  await drill.click();
  await expect(page.getByTestId("player-training-session")).toBeVisible({ timeout: 15_000 });
}

async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
}

async function capture(page, name) {
  fs.mkdirSync(outputDir, { recursive: true });
  await page.screenshot({ path: path.join(outputDir, name), fullPage: false, animations: "disabled" });
}

for (const width of [375, 390, 430, 1280]) {
  test(`live training keeps the ShotLab Target Court language at ${width}px`, async ({ page }) => {
    const launchWidth = width === 1280 ? 430 : width;
    await page.setViewportSize({ width: launchWidth, height: 844 });
    await enterPlayerDemo(page);
    await openBoundedDrill(page);
    if (width === 1280) {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.waitForTimeout(120);
    }

    const header = page.getByTestId("player-training-session-header");
    const target = page.getByTestId("player-training-live-target");
    await expect(header).toHaveAttribute("data-performance-language", "shotlab-target-court");
    await expect(target).toBeVisible();
    await expect(target).toHaveAttribute("data-performance-visual", "shotlab-target-court");
    await expect(target).toHaveAttribute("data-performance-state", "zero");
    await expect(target).toHaveAttribute("aria-label", /0 on this drill\. Target 50\. 50 to target\./i);

    const input = page.getByTestId("player-training-session").locator('input[type="number"]').first();
    await input.fill("42");
    await expect(target).toHaveAttribute("data-performance-state", "near");
    await expect(target).toHaveAttribute("data-target-percent", "84");
    await expect(header.getByText("8 TO LOCK", { exact: true })).toBeVisible();
    await expect(header.locator('[class*="progressTrack"], [class*="scoreProgress"]')).toHaveCount(0);

    const backBox = await header.getByRole("button", { name: "Back to training plan" }).boundingBox();
    expect(backBox).not.toBeNull();
    expect(backBox.width).toBeGreaterThanOrEqual(44);
    expect(backBox.height).toBeGreaterThanOrEqual(44);
    await noOverflow(page);
    await header.scrollIntoViewIfNeeded();
    await capture(page, `phase4-live-training-${width}.png`);
  });
}

test("training completion resolves target meaning and closes into performance proof", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterPlayerDemo(page);
  await openBoundedDrill(page);

  const session = page.getByTestId("player-training-session");
  await session.locator('input[type="number"]').first().fill("50");
  await page.getByTestId("player-training-log-score").click();

  const completion = page.getByTestId("player-training-completion");
  const target = completion.getByTestId("player-training-target-visual");
  await expect(completion).toBeVisible({ timeout: 15_000 });
  await expect(completion).toHaveAttribute("data-performance-language", "shotlab-target-court");
  await expect(target).toHaveAttribute("data-performance-state", "complete");
  await expect(target).toHaveAttribute("aria-label", /50 on this drill\. Target 50\. Target complete\./i);
  await expect(completion.getByTestId("player-training-target-interpretation")).toHaveText("TARGET LOCKED");
  await expect(completion.getByText("WHAT CHANGED", { exact: true })).toBeVisible();
  await expect(completion.getByText("NEXT MOVE", { exact: true })).toBeVisible();
  await expect(completion.getByTestId("player-training-next-action")).toBeVisible();
  await noOverflow(page);
  await completion.scrollIntoViewIfNeeded();
  await capture(page, "phase4-session-completion-390.png");

  const finish = completion.getByTestId("player-training-finish-session");
  if (await finish.count()) await finish.click();
  else await completion.getByTestId("player-training-next-action").click();

  const closeout = page.getByTestId("player-session-closeout");
  await expect(closeout).toBeVisible({ timeout: 10_000 });
  await expect(closeout).toHaveAttribute("data-performance-language", "shotlab-target-court");
  await expect(closeout.getByText("PERFORMANCE PROOF", { exact: true })).toBeVisible();
  await expect(closeout.getByText("NEXT COMMITMENT", { exact: true })).toBeVisible();
  await expect(closeout.locator('[class*="planProgress"]')).toHaveCount(0);
  const closeoutTarget = closeout.getByTestId("player-session-closeout-target-visual");
  await expect(closeoutTarget).toHaveAttribute("data-performance-state", "complete");
  await expect(closeoutTarget).toHaveAttribute("aria-label", /50 on this drill\. Target 50\. Target complete\./i);
  await noOverflow(page);
  await closeout.scrollIntoViewIfNeeded();
  await capture(page, "phase4-session-closeout-390.png");
});

test("reduced motion keeps complete semantic performance information", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enterPlayerDemo(page);
  await openBoundedDrill(page);

  const target = page.getByTestId("player-training-live-target");
  await page.getByTestId("player-training-session").locator('input[type="number"]').first().fill("42");
  await expect(target).toHaveAttribute("data-performance-state", "near");
  await expect(target).toHaveAttribute("aria-label", /42 on this drill\. Target 50\. 8 to target\./i);
  await expect(page.getByTestId("player-training-session-header").getByText("8 TO LOCK", { exact: true })).toBeVisible();
  await noOverflow(page);
});
