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
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, storage_mode: "e2e", scores: Array.isArray(payload?.scores) ? payload.scores : [] }),
    });
  });
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function noOverflow(page) {
  const amount = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(amount).toBeLessThanOrEqual(1);
}

async function enterPlayerDemo(page) {
  await installRoutes(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Player demo/i }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

async function openTrainingDrill(page) {
  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Train", exact: true }).click();
  await expect(page.getByTestId("player-at-home-workspace")).toBeVisible({ timeout: 20_000 });

  const preferred = page.getByText(/5[- ]?SPOT CATCH/i).first();
  if (await preferred.count()) {
    await preferred.locator("xpath=ancestor::button[1]").click();
  } else {
    const drills = page.locator("button.ch");
    const count = await drills.count();
    for (let i = 0; i < count; i += 1) {
      await drills.nth(i).click();
      if (await page.getByTestId("player-training-session").isVisible().catch(() => false)) break;
    }
  }
  await expect(page.getByTestId("player-training-session")).toBeVisible({ timeout: 15_000 });
}

async function captureViewport(page, name) {
  fs.mkdirSync(outputDir, { recursive: true });
  await page.screenshot({ path: path.join(outputDir, name), fullPage: false, animations: "disabled" });
}

test("logged training result becomes a momentum-first completion flow", async ({ page }) => {
  await enterPlayerDemo(page);
  await openTrainingDrill(page);

  const session = page.getByTestId("player-training-session");
  const scoreInput = session.locator('input[type="number"]').first();
  await scoreInput.fill("20");
  await expect(page.getByTestId("player-training-log-score")).toBeEnabled();
  await page.getByTestId("player-training-log-score").click();

  const completion = page.getByTestId("player-training-completion");
  const resultHero = completion.getByTestId("player-training-result-hero");
  await expect(completion).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Could not save score to team dashboard/i)).toHaveCount(0);
  await expect(page.getByText("Screenshot your card and share on social media", { exact: true })).toHaveCount(0);
  await expect(completion.getByText("RESULT LOGGED", { exact: true })).toBeVisible();
  await expect(completion.getByText(/DRILL COMPLETE|PERSONAL BEST/, { exact: true })).toBeVisible();
  await expect(resultHero.locator("h2")).toBeVisible();
  await expect(completion.getByTestId("player-training-result").getByText("20", { exact: true })).toBeVisible();
  await expect(completion.getByText("WHAT CHANGED", { exact: true })).toBeVisible();
  await expect(completion.getByText("NEXT MOVE", { exact: true })).toBeVisible();

  const nextAction = completion.getByTestId("player-training-next-action");
  const shareToggle = completion.getByTestId("player-training-share-toggle");
  const challengeAction = completion.getByTestId("player-training-challenge-action");
  await expect(nextAction).toBeVisible();
  await expect(nextAction).toHaveText(/Continue training/i);
  await expect(shareToggle).toBeVisible();
  await expect(challengeAction).toBeVisible();

  const completionStyle = await completion.evaluate((node) => ({
    backgroundColor: getComputedStyle(node).backgroundColor,
    backgroundImage: getComputedStyle(node).backgroundImage,
    borderRadius: getComputedStyle(node).borderRadius,
  }));
  expect(completionStyle.backgroundColor).toBe("rgb(17, 20, 17)");
  expect(completionStyle.backgroundImage).toContain("gradient");
  expect(parseFloat(completionStyle.borderRadius)).toBeGreaterThanOrEqual(24);

  const resultHeroStyle = await resultHero.evaluate((node) => ({
    backgroundColor: getComputedStyle(node).backgroundColor,
    backgroundImage: getComputedStyle(node).backgroundImage,
    titleColor: getComputedStyle(node.querySelector("h2")).color,
  }));
  expect(resultHeroStyle.backgroundColor).toBe("rgba(0, 0, 0, 0)");
  expect(resultHeroStyle.backgroundImage).toBe("none");
  expect(resultHeroStyle.titleColor).toBe("rgb(248, 250, 245)");

  const resultColor = await completion.getByTestId("player-training-result").evaluate((node) => getComputedStyle(node).color);
  expect(resultColor).toBe("rgb(200, 255, 26)");
  const nextStyle = await nextAction.evaluate((node) => ({
    backgroundColor: getComputedStyle(node).backgroundColor,
    color: getComputedStyle(node).color,
  }));
  expect(nextStyle.backgroundColor).toBe("rgb(200, 255, 26)");
  expect(nextStyle.color).toBe("rgb(16, 19, 16)");

  await noOverflow(page);
  await page.getByTestId("player-training-completion-wrap").scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  await captureViewport(page, "04r-player-training-completion.png");

  await shareToggle.click();
  const sharePanel = completion.getByTestId("player-training-share-card");
  await expect(sharePanel).toBeVisible();
  await expect(shareToggle).toHaveAttribute("aria-expanded", "true");
  const shareStyle = await sharePanel.evaluate((node) => ({
    backgroundColor: getComputedStyle(node).backgroundColor,
    backgroundImage: getComputedStyle(node).backgroundImage,
    borderRadius: getComputedStyle(node).borderRadius,
  }));
  expect(shareStyle.backgroundColor).toBe("rgba(0, 0, 0, 0)");
  expect(shareStyle.backgroundImage).toBe("none");
  expect(parseFloat(shareStyle.borderRadius)).toBe(0);
  await sharePanel.scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  await noOverflow(page);
  await captureViewport(page, "04s-player-training-share-secondary.png");

  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, left: 0, behavior: "auto" }));
  await page.waitForTimeout(120);
  const dockBox = await page.getByTestId("mobile-navigation-dock").boundingBox();
  const completionBox = await completion.boundingBox();
  expect(dockBox).not.toBeNull();
  expect(completionBox).not.toBeNull();
  expect(completionBox.y + completionBox.height).toBeLessThanOrEqual(dockBox.y - 6);
});
