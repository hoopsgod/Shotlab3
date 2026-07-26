import { test, expect } from "@playwright/test";

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/coach/players/provision**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function enterDemo(page, role) {
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.reload();
  await page.getByRole("button", { name: role === "coach" ? "Demo Coach" : "Demo Player", exact: true }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

async function openMoreDestination(page, key) {
  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  await sheet.locator(`[data-nav-key="${key}"]`).click();
  await expect(sheet).toHaveCount(0);
}

async function expectWorkspace(page, role, tab) {
  const shell = page.locator(`.performance-shell--${role}`);
  await expect(shell).toBeVisible({ timeout: 20_000 });
  await expect(shell).toHaveAttribute("data-workspace-tab", tab);
  await expect(page.locator(`.performance-workspace--${role}`)).toBeVisible();

  const metrics = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewport + 2);
  expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewport + 2);
}

async function expectDockTouchTargets(page) {
  const buttons = page.getByTestId("mobile-navigation-dock").getByRole("button");
  const count = await buttons.count();
  expect(count).toBeGreaterThanOrEqual(4);
  for (let index = 0; index < count; index += 1) {
    const box = await buttons.nth(index).boundingBox();
    expect(box, `navigation button ${index} should have a box`).not.toBeNull();
    expect(box.height, `navigation button ${index} height`).toBeGreaterThanOrEqual(44);
  }
}

async function expectPremiumHeader(page) {
  const header = page.locator(".appHeader").first();
  await expect(header).toBeVisible({ timeout: 20_000 });
  const visual = await header.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      radius: Number.parseFloat(style.borderRadius),
      borderStyle: style.borderTopStyle,
      backgroundImage: style.backgroundImage,
      shadow: style.boxShadow,
    };
  });
  expect(visual.radius).toBeGreaterThanOrEqual(18);
  expect(visual.borderStyle).not.toBe("none");
  expect(visual.backgroundImage).not.toBe("none");
  expect(visual.shadow).not.toBe("none");
}

test.beforeEach(async ({ page }) => {
  await installSafeRoutes(page);
});

test("coach secondary workspaces share the Mission Control visual system", async ({ page }) => {
  await enterDemo(page, "coach");
  await expectWorkspace(page, "coach", "feed");
  await expect(page.locator(".mcShellV3")).toBeVisible();
  await expectDockTouchTargets(page);

  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Players", exact: true }).click();
  await expectWorkspace(page, "coach", "players");
  await expectPremiumHeader(page);
  await expect(page.getByText("ROSTER SNAPSHOT", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "PLAYER ROSTER", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /ADD PLAYER & SEND INVITE/i })).toBeVisible();

  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Events", exact: true }).click();
  await expectWorkspace(page, "coach", "events");
  await expect(page.getByRole("heading", { name: "EVENTS", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /CREATE FIRST EVENT|ADD EVENT/i }).first()).toBeVisible();

  await openMoreDestination(page, "drills");
  await expectWorkspace(page, "coach", "drills");
  await expect(page.getByRole("heading", { name: "DRILLS", exact: true })).toBeVisible();

  await openMoreDestination(page, "sc");
  await expectWorkspace(page, "coach", "sc");
  await expect(page.getByRole("heading", { name: /STRENGTH|S&C/i }).first()).toBeVisible();

  await openMoreDestination(page, "leaderboards");
  await expectWorkspace(page, "coach", "leaderboards");
  await expect(page.getByTestId("premium-leaderboards-hub")).toBeVisible({ timeout: 20_000 });

  await openMoreDestination(page, "branding");
  await expect(page.locator(".premium-screen--branding")).toBeVisible({ timeout: 20_000 });
  await expectPremiumHeader(page);
});

test("player workspaces share premium surfaces and preserve mobile geometry", async ({ page }) => {
  await enterDemo(page, "player");
  await expectWorkspace(page, "player", "home");
  await expectDockTouchTargets(page);
  await expect(page.getByTestId("player-primary-objective")).toBeVisible({ timeout: 20_000 });

  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "At Home", exact: true }).click();
  await expectWorkspace(page, "player", "log-drill");

  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Program", exact: true }).click();
  await expectWorkspace(page, "player", "duels");

  await openMoreDestination(page, "program");
  await expectWorkspace(page, "player", "program");

  await openMoreDestination(page, "sc");
  await expectWorkspace(page, "player", "sc");

  await openMoreDestination(page, "leaderboards");
  await expectWorkspace(page, "player", "leaderboards");
  await expect(page.getByTestId("premium-leaderboards-hub")).toBeVisible({ timeout: 20_000 });

  await openMoreDestination(page, "profile");
  await expectWorkspace(page, "player", "profile");
});
