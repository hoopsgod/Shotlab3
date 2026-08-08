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

async function installPbHistoryFixture(page) {
  await page.route("**/src/lib/demoData.js*", async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    const anchor = "const demoPrimaryScores = [";
    if (!body.includes(anchor)) throw new Error("Phase 4B PB fixture could not find demo score seed anchor.");
    const fixture = `{ id: "score-phase4b-calipari-history", email: "demo@shotlab.app", name: "Demo Player", teamId: DEMO_TEAM_ID, drillId: "demo-home-calipari-shooting", score: 41, date: relativeDate(-2), ts: relativeTimestamp(-2, 18, 0), src: "home" },`;
    await route.fulfill({ response, body: body.replace(anchor, `${anchor}\n  ${fixture}`) });
  });
}

async function enterPlayerDemo(page) {
  await installRoutes(page);
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
  const session = page.getByTestId("player-training-session");
  await expect(session).toBeVisible({ timeout: 15_000 });
  await expect(session.getByText(/CALIPARI SHOOTING/i)).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await installRoutes(page);
});

test("Phase 4B development story uses branded performance marks for the core metrics", async ({ page }) => {
  await enterPlayerDemo(page);
  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Progress", exact: true }).click();
  for (const id of ["player-progress-active-days-mark", "player-progress-streak-mark", "player-progress-pb-mark"]) {
    await expect(page.getByTestId(id)).toBeVisible({ timeout: 20_000 });
  }
  await expect(page.getByTestId("player-progress-active-days-mark")).toHaveAttribute("data-performance-kind", "milestone");
  await expect(page.getByTestId("player-progress-streak-mark")).toHaveAttribute("data-performance-kind", "streak");
  await expect(page.getByTestId("player-progress-pb-mark")).toHaveAttribute("data-performance-kind", "pb");
  await noOverflow(page);
  await capture(page, "09a-phase4b-player-progress-performance-marks.png");
});

test("Phase 4B promotes top leaderboard ranks without changing leaderboard hierarchy", async ({ page }) => {
  await enterPlayerDemo(page);
  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  await sheet.locator('[data-nav-key="leaderboards"]').click();
  await expect(page.getByTestId("premium-leaderboards-hub")).toBeVisible({ timeout: 20_000 });
  const rankMark = page.locator('[data-testid^="leaderboard-rank-mark-"]').first();
  await expect(rankMark).toBeVisible();
  await expect(rankMark).toHaveAttribute("data-performance-kind", "rank");
  await expect(page.getByText(/Current \/ Offseason/i).first()).toBeVisible();
  await noOverflow(page);
  await capture(page, "09b-phase4b-player-rank-marks.png");
});

test("Phase 4B turns a new personal best into a premium achievement moment", async ({ page }) => {
  await installPbHistoryFixture(page);
  await enterPlayerDemo(page);
  await openCalipariDrill(page);
  const session = page.getByTestId("player-training-session");
  const scoreInput = session.locator('input[type="number"]').first();
  await scoreInput.fill("42");
  await expect(page.getByTestId("player-training-log-score")).toBeEnabled();
  await page.getByTestId("player-training-log-score").click();
  const reveal = page.getByTestId("player-pb-achievement-reveal");
  await expect(reveal).toBeVisible({ timeout: 15_000 });
  const pbMark = page.getByTestId("player-pb-achievement-mark");
  await expect(pbMark).toHaveAttribute("data-performance-kind", "pb");
  await expect(reveal.getByText("PERSONAL BEST", { exact: true })).toBeVisible();
  await expect(reveal.getByText(/Previous/i)).toBeVisible();
  await expect(reveal.getByText("41", { exact: true })).toBeVisible();
  await expect(reveal.getByText("+1", { exact: true })).toBeVisible();
  await expect(reveal.getByRole("button", { name: "Bank this result" })).toBeVisible();
  const card = reveal.locator(".performanceRevealCard");
  const style = await card.evaluate((node) => {
    const computed = getComputedStyle(node);
    return {
      radius: parseFloat(computed.borderRadius),
      background: computed.backgroundImage,
      backgroundColor: computed.backgroundColor,
      paddingTop: parseFloat(computed.paddingTop),
      shadow: computed.boxShadow,
    };
  });
  expect(style.radius).toBeGreaterThanOrEqual(24);
  expect(style.background).toContain("gradient");
  expect(style.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(style.paddingTop).toBeGreaterThanOrEqual(20);
  expect(style.shadow).not.toBe("none");

  const summaryStyle = await reveal.locator(".performanceRevealSummary").evaluate((node) => {
    const computed = getComputedStyle(node);
    return { background: computed.backgroundColor, image: computed.backgroundImage, border: computed.borderTopWidth, shadow: computed.boxShadow, color: computed.color };
  });
  expect(summaryStyle.background).toBe("rgba(0, 0, 0, 0)");
  expect(summaryStyle.image).toBe("none");
  expect(summaryStyle.border).toBe("0px");
  expect(summaryStyle.shadow).toBe("none");
  expect(summaryStyle.color).toBe("rgb(156, 168, 160)");

  const markContrast = await pbMark.evaluate((node) => ({
    value: getComputedStyle(node.querySelector("strong")).color,
    label: getComputedStyle(node.querySelector("span")).color,
    detail: getComputedStyle(node.querySelector("small")).color,
  }));
  expect(markContrast.value).toBe("rgb(247, 250, 245)");
  expect(markContrast.label).toBe("rgb(247, 250, 245)");
  expect(markContrast.detail).toBe("rgb(156, 168, 160)");

  await noOverflow(page);
  await capture(page, "09c-phase4b-player-pb-achievement.png");
});

test("Phase 4B makes the achievement cabinet useful before the first milestone", async ({ page }) => {
  await enterPlayerDemo(page);
  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Progress", exact: true }).click();
  await page.getByTestId("player-progress-open-profile").click();
  const shelf = page.getByTestId("player-achievement-shelf");
  await expect(shelf).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("player-achievement-next")).toBeVisible();
  await expect(page.getByTestId("player-achievement-next-mark")).toHaveAttribute("data-performance-kind", "milestone");
  await expect(shelf.getByText(/0 earned · 2D current/i)).toBeVisible();
  await expect(shelf.getByText(/5 days to unlock/i)).toBeVisible();
  await shelf.scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  await noOverflow(page);
  await capture(page, "09d-phase4b-player-achievement-cabinet.png");
});

test("Phase 4B leaves Coach Mission Control free of player achievement overlays", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Coach demo/i }).click();
  await expect(page.getByTestId("coach-primary-objective")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("player-pb-achievement-reveal")).toHaveCount(0);
  await expect(page.getByTestId("player-streak-achievement-reveal")).toHaveCount(0);
  await expect(page.getByTestId("player-achievement-shelf")).toHaveCount(0);
  await noOverflow(page);
  await capture(page, "09e-phase4b-coach-regression.png");
});
