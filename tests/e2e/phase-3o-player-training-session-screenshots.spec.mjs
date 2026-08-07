import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve(process.cwd(), "artifacts/design-audit/iphone");

async function installRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
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

async function captureViewport(page, name) {
  fs.mkdirSync(outputDir, { recursive: true });
  await page.screenshot({ path: path.join(outputDir, name), fullPage: false, animations: "disabled" });
}

test("Player Train opens a focused drill session with live score feedback", async ({ page }) => {
  await enterPlayerDemo(page);
  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Train", exact: true }).click();
  await expect(page.getByTestId("player-at-home-workspace")).toBeVisible({ timeout: 20_000 });

  const preferred = page.getByText(/5[- ]?SPOT CATCH/i).first();
  if (await preferred.count()) {
    await preferred.locator("xpath=ancestor::button[1]").click();
  } else {
    const drillNames = page.locator("button.ch");
    const count = await drillNames.count();
    let opened = false;
    for (let i = 0; i < count && !opened; i += 1) {
      await drillNames.nth(i).click();
      opened = await page.getByTestId("player-training-session").isVisible().catch(() => false);
    }
  }

  const session = page.getByTestId("player-training-session");
  const header = page.getByTestId("player-training-session-header");
  await expect(session).toBeVisible({ timeout: 15_000 });
  await expect(header).toBeVisible();
  await expect(header.getByText("AT HOME SESSION", { exact: true })).toBeVisible();
  await expect(header.getByText("CURRENT WORK", { exact: true })).toBeVisible();
  await expect(header.getByText("SESSION TARGET", { exact: true })).toBeVisible();
  await expect(header.getByText("LIVE SCORE", { exact: true })).toBeVisible();
  await expect(header.getByRole("button", { name: "Back to training plan" })).toBeVisible();

  const heroBox = await header.boundingBox();
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  expect(heroBox).not.toBeNull();
  expect(heroBox.y).toBeLessThan(viewportHeight * 0.62);

  const visualState = await header.evaluate((node) => {
    const style = getComputedStyle(node);
    const identity = node.children[1];
    const title = node.querySelector("h1");
    return {
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      identityBackground: identity ? getComputedStyle(identity).backgroundColor : "",
      identityImage: identity ? getComputedStyle(identity).backgroundImage : "",
      titleColor: title ? getComputedStyle(title).color : "",
    };
  });
  expect(visualState.backgroundColor).toBe("rgb(17, 20, 17)");
  expect(visualState.backgroundImage).toContain("gradient");
  expect(visualState.identityBackground).toBe("rgba(0, 0, 0, 0)");
  expect(visualState.identityImage).toBe("none");
  expect(visualState.titleColor).toBe("rgb(248, 250, 245)");

  const scoreZone = page.getByTestId("player-training-score-zone");
  const scoreInput = session.locator('input[type="number"]').first();
  const logScore = page.getByTestId("player-training-log-score");
  await expect(scoreZone).toBeVisible();
  await expect(scoreZone.getByText("LOG YOUR RESULT", { exact: true })).toBeVisible();
  await expect(scoreInput).toBeVisible();
  await scoreInput.fill("20");
  await expect(header.getByText("20", { exact: true })).toBeVisible();
  await expect(logScore).toBeVisible();
  await expect(logScore).toBeEnabled();

  const inputStyle = await scoreInput.evaluate((node) => ({
    backgroundColor: getComputedStyle(node).backgroundColor,
    color: getComputedStyle(node).color,
  }));
  expect(inputStyle.backgroundColor).toBe("rgb(17, 20, 17)");
  expect(inputStyle.color).toBe("rgb(200, 255, 26)");
  const zoneStyle = await scoreZone.evaluate((node) => ({
    backgroundColor: getComputedStyle(node).backgroundColor,
    borderRadius: getComputedStyle(node).borderRadius,
  }));
  expect(zoneStyle.backgroundColor).toBe("rgba(255, 255, 255, 0.96)");
  expect(parseFloat(zoneStyle.borderRadius)).toBeGreaterThanOrEqual(20);

  const liveProgress = page.getByTestId("player-training-live-progress");
  if (await liveProgress.count()) await expect(liveProgress).toBeVisible();

  await noOverflow(page);
  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
  await page.waitForTimeout(120);
  await captureViewport(page, "04p-player-training-session.png");

  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, left: 0, behavior: "auto" }));
  await page.waitForTimeout(120);
  const logBox = await logScore.boundingBox();
  const dockBox = await page.getByTestId("mobile-navigation-dock").boundingBox();
  expect(logBox).not.toBeNull();
  expect(dockBox).not.toBeNull();
  expect(logBox.y + logBox.height).toBeLessThan(dockBox.y - 6);
  await expect(scoreZone.getByText("LOG YOUR RESULT", { exact: true })).toBeVisible();
  await expect(logScore).toBeVisible();
  await captureViewport(page, "04q-player-training-score-action.png");
});
