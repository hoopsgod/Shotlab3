import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve(process.cwd(), "artifacts/design-audit/iphone");
const DEMO_PLAYER_EMAIL = "demo@shotlab.app";
const DEMO_COACH_EMAIL = "coach.demo@shotlab.app";
const EMPTY_DEMO_TEAM_ID = "team-phase4d-empty";

const emptyDemoSeed = {
  "sl:teams": [{
    id: EMPTY_DEMO_TEAM_ID,
    name: "ShotLab Team",
    ownerCoachId: DEMO_COACH_EMAIL,
    joinCode: "P4D000",
    createdAt: 1_780_000_000_000,
  }],
  "sl:players": [
    { id: "coach-phase4d-empty", email: DEMO_COACH_EMAIL, name: "Demo Coach", role: "coach", isCoach: true, teamId: EMPTY_DEMO_TEAM_ID, hideFromLeaderboards: true },
    { id: "player-phase4d-empty", email: DEMO_PLAYER_EMAIL, name: "Demo Player", role: "player", teamId: EMPTY_DEMO_TEAM_ID, hideFromLeaderboards: false },
  ],
  "sl:player-profiles": [{ id: "profile-phase4d-empty", userId: DEMO_PLAYER_EMAIL, email: DEMO_PLAYER_EMAIL, teamId: EMPTY_DEMO_TEAM_ID, firstName: "Demo", lastName: "Player" }],
  "sl:scores": [],
  "sl:program-scores": [],
  "sl:shotlogs": [],
};

async function installRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function capture(page, name) {
  fs.mkdirSync(outputDir, { recursive: true });
  await page.screenshot({ path: path.join(outputDir, name), fullPage: false, animations: "disabled" });
}

async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
}

async function seedStorage(page, payload) {
  await page.addInitScript((values) => {
    for (const [key, value] of Object.entries(values)) window.localStorage.setItem(key, JSON.stringify(value));
  }, payload);
}

async function enterPlayerDemo(page) {
  await page.goto("/");
  await page.getByRole("button", { name: /Player demo/i }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

async function openMore(page) {
  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  return sheet;
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

test("Phase 4D turns Auth validation into a compact premium recovery state", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const state = page.getByTestId("auth-error-state");
  await expect(state).toBeVisible();
  await expect(state).toHaveAttribute("data-state", "error");
  await expect(state).toHaveAttribute("data-surface", "light");
  await expect(state.getByText("Enter your email", { exact: true })).toBeVisible();
  const geometry = await state.evaluate((node) => {
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return { radius: parseFloat(style.borderRadius), width: rect.width, right: rect.right };
  });
  expect(geometry.radius).toBeGreaterThanOrEqual(14);
  expect(geometry.width).toBeGreaterThan(280);
  expect(geometry.right).toBeLessThanOrEqual(430);
  await noOverflow(page);
  await capture(page, "11a-phase4d-auth-error-state.png");
});

test("Phase 4D gives an empty Program filter a useful first-action state", async ({ page }) => {
  await enterPlayerDemo(page);
  const dock = page.getByTestId("mobile-navigation-dock");
  const sheet = await openMore(page);
  await sheet.locator('[data-nav-key="duels"]').click();
  await expect(page.getByTestId("mobile-navigation-sheet")).toHaveCount(0);
  await expect(page.getByTestId("player-program-workspace")).toBeVisible({ timeout: 20_000 });
  const filters = page.getByTestId("player-program-filter-rail");
  await filters.getByRole("button", { name: /Completed/i }).click();
  const state = page.getByTestId("player-workspace-empty-state");
  await expect(state).toBeVisible();
  await expect(state).toHaveAttribute("data-state", "first-use");
  await expect(state.getByText(/No completed Program drills yet|Program plan complete/i)).toBeVisible();
  await state.evaluate((node) => node.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" }));
  await page.waitForTimeout(120);
  const dockBox = await dock.boundingBox();
  const stateBox = await state.boundingBox();
  expect(dockBox).not.toBeNull();
  expect(stateBox).not.toBeNull();
  expect(stateBox.y).toBeGreaterThanOrEqual(0);
  expect(stateBox.y + stateBox.height).toBeLessThan(dockBox.y - 8);
  await noOverflow(page);
  await capture(page, "11b-phase4d-player-program-first-use.png");
});

test("Phase 4D makes an empty Player leaderboard intentional instead of blank", async ({ page }) => {
  await seedStorage(page, emptyDemoSeed);
  await enterPlayerDemo(page);
  const disclosure = page.getByTestId("player-team-standings");
  await expect(disclosure).toBeVisible();
  await disclosure.locator(":scope > summary").click();
  await expect(disclosure).toHaveAttribute("open", "");
  const preview = disclosure.getByTestId("compact-leaderboard-preview");
  await expect(preview).toBeVisible();
  const state = preview.getByTestId("leaderboard-empty-state");
  await expect(state).toBeVisible({ timeout: 15_000 });
  await expect(state).toHaveAttribute("data-state", "empty");
  await expect(state.getByText("Your ranking starts with a result", { exact: true })).toBeVisible();
  await state.evaluate((node) => node.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" }));
  await page.waitForTimeout(120);
  await noOverflow(page);
  await capture(page, "11c-phase4d-player-leaderboard-empty.png");
});

test("Phase 4D makes a disabled training action look intentionally unavailable", async ({ page }) => {
  await enterPlayerDemo(page);
  await openCalipariDrill(page);
  const scoreZone = page.getByTestId("player-training-score-zone");
  const save = page.getByTestId("player-training-log-score");
  await expect(save).toBeDisabled();
  await scoreZone.evaluate((node) => node.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" }));
  await page.waitForTimeout(120);
  const treatment = await save.evaluate((node) => {
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    const dock = document.querySelector('[data-testid="mobile-navigation-dock"]');
    const dockRect = dock?.getBoundingClientRect();
    return {
      filter: style.filter,
      shadow: style.boxShadow,
      transform: style.transform,
      cursor: style.cursor,
      bottom: rect.bottom,
      dockTop: dockRect?.top ?? window.innerHeight,
    };
  });
  expect(treatment.filter).toContain("saturate");
  expect(treatment.shadow).toBe("none");
  expect(treatment.transform).toBe("none");
  expect(treatment.cursor).toBe("not-allowed");
  expect(treatment.bottom).toBeLessThanOrEqual(treatment.dockTop - 16);
  await noOverflow(page);
  await capture(page, "11d-phase4d-disabled-training-action.png");
});

test("Phase 4D preserves Coach Mission Control while the shared state system is present", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Coach demo/i }).click();
  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(dock).toBeVisible({ timeout: 20_000 });
  await expect(dock).toHaveAttribute("data-navigation-role", "coach");
  await expect(page.getByTestId("coach-mission-control")).toBeVisible({ timeout: 20_000 }).catch(async () => {
    await expect(page.locator(".mcShellV3")).toBeVisible({ timeout: 20_000 });
  });
  expect(await page.getByTestId("auth-error-state").count()).toBe(0);
  expect(await page.getByTestId("player-workspace-empty-state").count()).toBe(0);
  await noOverflow(page);
  await capture(page, "11e-phase4d-coach-reconciliation.png");
});
