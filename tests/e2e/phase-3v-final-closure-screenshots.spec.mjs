import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve(process.cwd(), "artifacts/design-audit/iphone");

async function installRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function enterDemo(page, role) {
  await installRoutes(page);
  await page.goto("/");
  await page.getByRole("button", { name: new RegExp(`${role} demo`, "i") }).click();
  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(dock).toBeVisible({ timeout: 20_000 });
  return dock;
}

async function capture(page, name) {
  fs.mkdirSync(outputDir, { recursive: true });
  await page.screenshot({ path: path.join(outputDir, name), fullPage: false, animations: "disabled" });
}

async function expectNoOverflow(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

async function routeEndGeometry(page, { route, finalSelector }) {
  return page.evaluate(({ route, finalSelector }) => {
    const finalNode = document.querySelector(finalSelector);
    const workspace = document.querySelector(`.performance-shell--player.is-mobile[data-workspace-tab="${route}"] .performance-workspace`);
    const wrapper = document.querySelector(`.performance-shell--player.is-mobile[data-workspace-tab="${route}"] .player-scroll-container > .screen-fade-in`);
    if (!finalNode || !workspace || !wrapper) throw new Error(`Missing ${route} closure geometry target`);
    const rect = finalNode.getBoundingClientRect();
    const contentBottom = rect.bottom + window.scrollY;
    const after = getComputedStyle(wrapper, "::after");
    return {
      tail: document.documentElement.scrollHeight - contentBottom,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      reserve: getComputedStyle(workspace).getPropertyValue("--p3v-route-dock-reserve").trim(),
      spacerHeight: Number.parseFloat(after.height || "0"),
    };
  }, { route, finalSelector });
}

async function expectRouteEndBounded(page, options) {
  const geometry = await routeEndGeometry(page, options);
  expect(geometry.reserve).toBe("112px");
  expect(geometry.spacerHeight).toBeGreaterThanOrEqual(96);
  expect(geometry.overflow).toBeLessThanOrEqual(1);
  expect(geometry.tail).toBeGreaterThanOrEqual(96);
  expect(geometry.tail).toBeLessThanOrEqual(220);
  return geometry;
}

test("Phase 3 closure: Player Home has one dock reserve and no orphaned account band", async ({ page }) => {
  const dock = await enterDemo(page, "Player");
  await expect(page.getByTestId("player-daily-command-center")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(".player-quick-actions")).toHaveCount(0);
  await expect(dock.getByRole("button", { name: "Home", exact: true })).toHaveAttribute("aria-current", "page");

  const support = [
    page.getByTestId("player-upcoming-schedule"),
    page.getByTestId("player-team-standings"),
    page.getByTestId("player-coach-guidance"),
    page.getByTestId("player-secondary-intelligence"),
  ];
  for (const disclosure of support) {
    await expect(disclosure).toBeVisible();
    await expect(disclosure).not.toHaveAttribute("open", "");
  }
  await expectRouteEndBounded(page, { route: "home", finalSelector: '[data-testid="player-secondary-intelligence"]' });
  await expectNoOverflow(page);
  await capture(page, "07a-phase3-final-player-home.png");

  await page.getByTestId("player-secondary-intelligence").scrollIntoViewIfNeeded();
  await capture(page, "07b-phase3-final-player-home-end.png");
});

test("Phase 3 closure: Rankings is secondary, contained, and dock-safe", async ({ page }) => {
  const dock = await enterDemo(page, "Player");
  await dock.getByRole("button", { name: "More", exact: true }).click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  await sheet.locator('[data-nav-key="leaderboards"]').click();

  const hub = page.getByTestId("premium-leaderboards-hub");
  await expect(hub).toBeVisible({ timeout: 20_000 });
  await expect(hub.getByRole("button", { name: "Current / Offseason", exact: true })).toBeVisible();
  await expect(hub.getByRole("button", { name: "All-Time", exact: true })).toBeVisible();
  const participation = hub.getByTestId("leaderboard-participation-categories");
  await expect(participation).toBeVisible();
  await expect(participation).not.toHaveAttribute("open", "");
  await expectRouteEndBounded(page, { route: "leaderboards", finalSelector: '[data-testid="premium-leaderboards-hub"]' });
  await expectNoOverflow(page);
  await capture(page, "07c-phase3-final-player-rankings.png");

  await participation.scrollIntoViewIfNeeded();
  await participation.locator("summary").click();
  await expect(participation).toHaveAttribute("open", "");
  await expect(participation.getByRole("button", { name: "Events Attended", exact: true })).toBeVisible();
  await expect(participation.getByRole("button", { name: "Strength & Conditioning", exact: true })).toBeVisible();
});

test("Phase 3 closure: Progress keeps development first and deep Profile data intentional", async ({ page }) => {
  const dock = await enterDemo(page, "Player");
  await dock.getByRole("button", { name: "Progress", exact: true }).click();
  const story = page.getByTestId("player-progress-story");
  await expect(story).toBeVisible({ timeout: 20_000 });
  await expect(story.getByText("DEVELOPMENT STORY", { exact: true })).toBeVisible();
  await capture(page, "07d-phase3-final-player-progress-story.png");

  await story.getByTestId("player-progress-open-profile").click();
  const drillDevelopment = page.getByTestId("player-profile-drill-development");
  await expect(drillDevelopment).toBeVisible({ timeout: 10_000 });
  await expect(drillDevelopment).not.toHaveAttribute("open", "");
  await drillDevelopment.locator(":scope > summary").click();
  await expect(drillDevelopment).toHaveAttribute("open", "");

  const drillIndex = page.getByTestId("player-profile-drill-index");
  await expect(drillIndex).toBeVisible();
  await expect(drillIndex.getByText("Your drills at a glance", { exact: true })).toBeVisible();
  const fullDetails = page.getByTestId("player-profile-full-drill-details");
  await expect(fullDetails).toBeVisible();
  await expect(fullDetails).not.toHaveAttribute("open", "");
  await drillIndex.scrollIntoViewIfNeeded();
  await expectNoOverflow(page);
  await capture(page, "07e-phase3-final-player-drill-development.png");

  await drillDevelopment.locator(":scope > summary").click();
  await expect(drillDevelopment).not.toHaveAttribute("open", "");
  const privacy = page.getByTestId("player-profile-privacy");
  const accountData = page.getByTestId("player-profile-account-data");
  await expect(privacy).toBeVisible();
  await expect(privacy.getByText("Hide me from leaderboards", { exact: true })).toBeVisible();
  await expect(accountData).toBeVisible();
  await expect(accountData).not.toHaveAttribute("open", "");
  await expect(accountData.getByText("Account & data", { exact: true })).toBeVisible();
  await expect(accountData.getByRole("button", { name: "Delete Account & Data", exact: true })).toBeHidden();
  await expectRouteEndBounded(page, { route: "profile", finalSelector: '[data-testid="player-profile-account-data"]' });

  await accountData.scrollIntoViewIfNeeded();
  await capture(page, "07f-phase3-final-player-account.png");
  await accountData.locator(":scope > summary").click();
  await expect(accountData).toHaveAttribute("open", "");
  await expect(accountData.getByRole("link", { name: "Privacy", exact: true })).toBeVisible();
  await expect(accountData.getByRole("link", { name: "Terms", exact: true })).toBeVisible();
  await expect(accountData.getByRole("link", { name: "Support", exact: true })).toBeVisible();
  await expect(accountData.getByRole("button", { name: "Delete Account & Data", exact: true })).toBeVisible();
  await capture(page, "07g-phase3-final-player-account-expanded.png");
});

test("Phase 3 closure: Coach Mission Control remains intact on the shared native shell", async ({ page }) => {
  const dock = await enterDemo(page, "Coach");
  await expect(dock.getByRole("button", { name: "Home", exact: true })).toHaveAttribute("data-icon-name", "home");
  await expect(dock.getByRole("button", { name: "Players", exact: true })).toHaveAttribute("data-icon-name", "team");
  await expect(dock.getByRole("button", { name: "Schedule", exact: true })).toHaveAttribute("data-icon-name", "calendar");
  const surface = await dock.evaluate((node) => ({
    outer: getComputedStyle(node).backgroundColor,
    inner: getComputedStyle(node.firstElementChild).backgroundColor,
  }));
  expect(surface.outer).toBe("rgba(252, 252, 250, 0.9)");
  expect(surface.inner).toBe("rgba(0, 0, 0, 0)");
  await expectNoOverflow(page);
  await capture(page, "07h-phase3-final-coach-home.png");
});
