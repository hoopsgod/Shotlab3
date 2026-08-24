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
  const drill = page.getByRole("button", { name: /CALIPARI SHOOTING/i });
  await expect(drill).toBeVisible();
  await drill.click();
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
  await expect(page.getByTestId("player-completion-cue")).toBeHidden();
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

  const dockAuthority = await page.evaluate(() => {
    const wrap = document.querySelector('.player-training-completion-wrap:has([data-testid="player-session-closeout"])');
    const scroll = document.querySelector('.player-scroll-container:has([data-testid="player-session-closeout"])');
    const workspace = document.querySelector('.performance-workspace:has([data-testid="player-session-closeout"])');
    if (!wrap || !scroll || !workspace) throw new Error("Missing closeout containment authority");
    return {
      wrapMarginBottom: parseFloat(getComputedStyle(wrap).marginBottom),
      wrapPaddingBottom: parseFloat(getComputedStyle(wrap).paddingBottom),
      scrollPaddingBottom: parseFloat(getComputedStyle(scroll).paddingBottom),
      workspacePaddingBottom: parseFloat(getComputedStyle(workspace).paddingBottom),
    };
  });
  expect(dockAuthority.wrapMarginBottom).toBe(0);
  expect(dockAuthority.wrapPaddingBottom).toBe(0);
  expect(dockAuthority.scrollPaddingBottom).toBe(0);
  expect(dockAuthority.workspacePaddingBottom).toBeGreaterThan(0);

  await noOverflow(page);
  await closeout.scrollIntoViewIfNeeded();
  await captureViewport(page, "04t-player-session-closeout.png");

  const terminalScroller = page.locator('.player-scroll-container:has([data-testid="player-session-closeout"])');
  await terminalScroller.evaluate((node) => {
    node.scrollTop = node.scrollHeight;
  });
  await expect.poll(async () => terminalScroller.evaluate((node) => Math.abs(node.scrollHeight - node.clientHeight - node.scrollTop))).toBeLessThanOrEqual(1);
  const terminalScroll = await terminalScroller.evaluate((node) => ({
    scrollTop: node.scrollTop,
    scrollHeight: node.scrollHeight,
    clientHeight: node.clientHeight,
    distanceFromBottom: Math.abs(node.scrollHeight - node.clientHeight - node.scrollTop),
  }));
  expect(terminalScroll.scrollHeight).toBeGreaterThan(terminalScroll.clientHeight);
  expect(terminalScroll.distanceFromBottom).toBeLessThanOrEqual(1);

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
