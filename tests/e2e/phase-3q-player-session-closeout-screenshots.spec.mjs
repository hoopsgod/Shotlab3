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

async function noOverflow(page) {
  const amount = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(amount).toBeLessThanOrEqual(1);
}

test("player can intentionally close the daily training loop after logging a result", async ({ page }) => {
  await enterPlayerDemo(page);
  await openTrainingDrill(page);

  const session = page.getByTestId("player-training-session");
  await session.locator('input[type="number"]').first().fill("20");
  await page.getByTestId("player-training-log-score").click();
  const completion = page.getByTestId("player-training-completion");
  await expect(completion).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Could not save score to team dashboard/i)).toHaveCount(0);
  const liveBodyText = await page.locator("body").innerText();
  const liveStreakMatch = liveBodyText.match(/(\d+)D streak/i);

  const finishQuiet = page.getByTestId("player-training-finish-session");
  if (await finishQuiet.count()) {
    await finishQuiet.click();
  } else {
    await page.getByTestId("player-training-next-action").click();
  }

  const closeout = page.getByTestId("player-session-closeout");
  await expect(closeout).toBeVisible({ timeout: 10_000 });
  await expect(closeout.getByText("SESSION COMPLETE", { exact: true })).toBeVisible();
  await expect(closeout.getByText(/TODAY’S WORK IS BANKED/i)).toBeVisible();
  await expect(closeout.getByTestId("player-session-closeout-metrics")).toBeVisible();
  await expect(closeout.getByText("RESULTS LOGGED", { exact: true })).toBeVisible();
  await expect(closeout.getByText("PLAN STATUS", { exact: true })).toBeVisible();
  await expect(closeout.getByText("MOMENTUM", { exact: true })).toBeVisible();
  await expect(closeout.getByTestId("player-session-best-moment")).toBeVisible();
  await expect(closeout.getByTestId("player-session-next-commitment")).toBeVisible();
  await expect(closeout.getByTestId("player-session-done")).toBeVisible();
  await expect(closeout.getByTestId("player-session-view-progress")).toBeVisible();

  if (liveStreakMatch) {
    const closeoutMomentum = await closeout.getByText(/\d+-day rhythm/i).innerText();
    const closeoutStreakMatch = closeoutMomentum.match(/(\d+)-day rhythm/i);
    expect(closeoutStreakMatch).not.toBeNull();
    expect(Number(closeoutStreakMatch[1])).toBe(Number(liveStreakMatch[1]));
  }

  const rootStyle = await closeout.evaluate((node) => ({
    backgroundColor: getComputedStyle(node).backgroundColor,
    backgroundImage: getComputedStyle(node).backgroundImage,
    borderRadius: getComputedStyle(node).borderRadius,
  }));
  expect(rootStyle.backgroundColor).toBe("rgb(15, 18, 15)");
  expect(rootStyle.backgroundImage).toContain("gradient");
  expect(parseFloat(rootStyle.borderRadius)).toBeGreaterThanOrEqual(24);

  const heroStyle = await closeout.getByTestId("player-session-closeout-hero").evaluate((node) => ({
    backgroundColor: getComputedStyle(node).backgroundColor,
    backgroundImage: getComputedStyle(node).backgroundImage,
    titleColor: getComputedStyle(node.querySelector("h2")).color,
  }));
  expect(heroStyle.backgroundColor).toBe("rgba(0, 0, 0, 0)");
  expect(heroStyle.backgroundImage).toBe("none");
  expect(heroStyle.titleColor).toBe("rgb(248, 250, 245)");

  const doneStyle = await closeout.getByTestId("player-session-done").evaluate((node) => ({
    backgroundColor: getComputedStyle(node).backgroundColor,
    color: getComputedStyle(node).color,
  }));
  expect(doneStyle.backgroundColor).toBe("rgb(200, 255, 26)");
  expect(doneStyle.color).toBe("rgb(16, 19, 16)");

  await noOverflow(page);
  await closeout.scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  await captureViewport(page, "04t-player-session-closeout.png");

  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, left: 0, behavior: "auto" }));
  await page.waitForTimeout(120);
  const dockBox = await page.getByTestId("mobile-navigation-dock").boundingBox();
  const closeoutBox = await closeout.boundingBox();
  expect(dockBox).not.toBeNull();
  expect(closeoutBox).not.toBeNull();
  const dockGap = dockBox.y - (closeoutBox.y + closeoutBox.height);
  expect(dockGap).toBeGreaterThanOrEqual(6);
  expect(dockGap).toBeLessThanOrEqual(96);
  await captureViewport(page, "04u-player-session-closeout-actions.png");

  await closeout.getByTestId("player-session-view-progress").click();
  await expect(page.getByTestId("player-session-closeout")).toHaveCount(0);
});
