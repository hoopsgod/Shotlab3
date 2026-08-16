import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve(process.cwd(), "artifacts/design-audit/iphone");
const BOUNDED_DRILL = {
  id: "e2e-target-court-50",
  name: "TARGET COURT 50",
  desc: "Make 50 shots at game pace.",
  max: 50,
  icon: "mr",
  instructions: "Complete the reps and log the result.",
  slug: "e2e-target-court-50",
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

async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
}

async function enterPlayerDemoWithBoundedDrill(page) {
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

async function captureViewport(page, name) {
  fs.mkdirSync(outputDir, { recursive: true });
  await page.screenshot({ path: path.join(outputDir, name), fullPage: false, animations: "disabled" });
}

test("logged bounded training result becomes a ShotLab target-court completion flow", async ({ page }) => {
  await enterPlayerDemoWithBoundedDrill(page);
  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Train", exact: true }).click();
  await expect(page.getByTestId("player-at-home-workspace")).toBeVisible({ timeout: 20_000 });

  const drill = page.getByRole("button", { name: /TARGET COURT 50/i });
  await expect(drill).toBeVisible();
  await drill.click();
  const session = page.getByTestId("player-training-session");
  await expect(session).toBeVisible({ timeout: 15_000 });
  await session.locator('input[type="number"]').first().fill("20");
  await expect(page.getByTestId("player-training-log-score")).toBeEnabled();
  await page.getByTestId("player-training-log-score").click();

  const completion = page.getByTestId("player-training-completion");
  const resultHero = completion.getByTestId("player-training-result-hero");
  await expect(completion).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Could not save score to team dashboard/i)).toHaveCount(0);
  await expect(completion.getByText("RESULT LOGGED", { exact: true })).toBeVisible();
  await expect(completion.getByText(/DRILL COMPLETE|PERSONAL BEST/, { exact: true })).toBeVisible();
  await expect(resultHero.locator("h2")).toBeVisible();
  await expect(completion.getByTestId("player-training-result").getByText("20", { exact: true })).toBeVisible();
  await expect(completion.getByText("WHAT CHANGED", { exact: true })).toBeVisible();
  await expect(completion.getByText("NEXT MOVE", { exact: true })).toBeVisible();

  const targetCourt = completion.getByTestId("player-training-target-court");
  const targetVisual = completion.getByTestId("player-training-target-visual");
  await expect(targetCourt).toBeVisible();
  await expect(targetVisual).toBeVisible();
  await expect(targetVisual).toHaveAttribute("data-performance-visual", "shotlab-target-court");
  await expect(targetVisual).toHaveAttribute("role", "img");
  await expect(targetVisual).toHaveAttribute("aria-label", /20 makes today\. Target 50\. 30 to target\./i);
  await expect(targetVisual).toHaveAttribute("data-target-percent", "40");
  await expect(targetVisual).toHaveAttribute("data-performance-state", "partial");
  await expect(completion.locator('[class*="performanceTrack"], [class*="performanceFill"]')).toHaveCount(0);

  const nextAction = completion.getByTestId("player-training-next-action");
  const shareToggle = completion.getByTestId("player-training-share-toggle");
  await expect(nextAction).toBeVisible();
  await expect(nextAction).toHaveText(/Continue training/i);
  await expect(shareToggle).toBeVisible();
  await expect(completion.getByTestId("player-training-challenge-action")).toBeVisible();

  const completionStyle = await completion.evaluate((node) => ({ backgroundColor: getComputedStyle(node).backgroundColor, backgroundImage: getComputedStyle(node).backgroundImage, borderRadius: getComputedStyle(node).borderRadius }));
  expect(completionStyle.backgroundColor).toBe("rgb(17, 20, 17)");
  expect(completionStyle.backgroundImage).toContain("gradient");
  expect(parseFloat(completionStyle.borderRadius)).toBeGreaterThanOrEqual(24);

  const targetCourtStyle = await targetCourt.evaluate((node) => ({ backgroundColor: getComputedStyle(node).backgroundColor, backgroundImage: getComputedStyle(node).backgroundImage }));
  expect(targetCourtStyle.backgroundColor).toBe("rgba(0, 0, 0, 0)");
  expect(targetCourtStyle.backgroundImage).toBe("none");
  expect(await completion.getByTestId("player-training-result").evaluate((node) => getComputedStyle(node).color)).toBe("rgb(200, 255, 26)");

  const targetBox = await targetVisual.boundingBox();
  const completionBox = await completion.boundingBox();
  expect(targetBox).not.toBeNull();
  expect(completionBox).not.toBeNull();
  expect(targetBox.x).toBeGreaterThanOrEqual(completionBox.x - 1);
  expect(targetBox.x + targetBox.width).toBeLessThanOrEqual(completionBox.x + completionBox.width + 1);
  await noOverflow(page);
  await page.getByTestId("player-training-completion-wrap").scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  await captureViewport(page, "04r-player-training-target-court.png");

  await shareToggle.click();
  const sharePanel = completion.getByTestId("player-training-share-card");
  await expect(sharePanel).toBeVisible();
  await expect(shareToggle).toHaveAttribute("aria-expanded", "true");
  await sharePanel.scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  await noOverflow(page);
  await captureViewport(page, "04s-player-training-share-secondary.png");
});