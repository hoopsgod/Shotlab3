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
  await page.getByRole("button", { name: role === "coach" ? "Coach demo" : "Player demo", exact: true }).click();
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
  const header = page.locator('.appHeader[data-team-identity-stage="true"]').first();
  await expect(header).toBeVisible({ timeout: 20_000 });
  await expect(header).toHaveAttribute("data-team-identity-stage", "true");
  const visual = await header.evaluate((node) => {
    const style = getComputedStyle(node);
    const crest = node.querySelector('[data-identity-role="brand-panel"]');
    const title = node.querySelector("h1");
    const crestBox = crest?.getBoundingClientRect();
    const titleStyle = title ? getComputedStyle(title) : null;
    return {
      radius: Number.parseFloat(style.borderRadius) || 0,
      borderStyle: style.borderTopStyle,
      shadow: style.boxShadow,
      crestWidth: crestBox?.width || 0,
      crestHeight: crestBox?.height || 0,
      titleSize: Number.parseFloat(titleStyle?.fontSize || "0") || 0,
    };
  });
  expect(visual.radius).toBeLessThanOrEqual(1);
  expect(visual.borderStyle).toBe("none");
  expect(visual.shadow).toBe("none");
  expect(visual.crestWidth).toBeGreaterThanOrEqual(80);
  expect(visual.crestHeight).toBeGreaterThanOrEqual(80);
  expect(visual.titleSize).toBeGreaterThanOrEqual(36);
}

async function expectCoachPerformanceRail(page) {
  const stage = page.locator('[data-visual-role="primary-decision"]').first();
  await expect(stage).toBeVisible({ timeout: 20_000 });
  await expect(stage).toHaveAttribute("data-surface", "dark");
  const rail = stage.locator('[data-visual-role="performance-evidence"]');
  await expect(rail).toBeVisible();
  const controls = rail.getByRole("button");
  expect(await controls.count()).toBeGreaterThanOrEqual(1);
  for (let index = 0; index < await controls.count(); index += 1) {
    const box = await controls.nth(index).boundingBox();
    expect(box?.height || 0, `performance signal ${index + 1} height`).toBeGreaterThanOrEqual(44);
  }
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
  await expect(page.getByTestId("coach-players-command-bar")).toBeVisible();
  await expectCoachPerformanceRail(page);
  await expect(page.getByRole("heading", { name: "PLAYER ROSTER", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /ADD PLAYER & SEND INVITE/i })).toBeVisible();

  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Schedule", exact: true }).click();
  await expectWorkspace(page, "coach", "events");
  await expect(page.getByTestId("coach-events-command-bar")).toBeVisible();
  await expectCoachPerformanceRail(page);
  await expect(page.getByRole("button", { name: /CREATE EVENT/i }).first()).toBeVisible();

  await openMoreDestination(page, "drills");
  await expectWorkspace(page, "coach", "drills");
  await expect(page.getByTestId("coach-page-dashboard-drills")).toBeVisible();

  await openMoreDestination(page, "sc");
  await expectWorkspace(page, "coach", "sc");
  await expect(page.getByTestId("coach-page-dashboard-strength")).toBeVisible();

  await openMoreDestination(page, "leaderboards");
  await expectWorkspace(page, "coach", "leaderboards");
  await expect(page.getByTestId("coach-page-dashboard-leaderboards")).toBeVisible();
  await expect(page.getByTestId("premium-leaderboards-hub")).toBeVisible({ timeout: 20_000 });

  await openMoreDestination(page, "branding");
  await expect(page.locator(".premium-screen--branding")).toBeVisible({ timeout: 20_000 });
  await expectPremiumHeader(page);
});

test("player workspaces share premium surfaces and preserve mobile geometry", async ({ page }) => {
  await enterDemo(page, "player");
  await expectWorkspace(page, "player", "home");
  await expectDockTouchTargets(page);
  const commandCenter = page.getByTestId("player-daily-command-center");
  await expect(commandCenter).toBeVisible({ timeout: 20_000 });
  await expect(commandCenter.getByTestId("player-daily-primary-action")).toBeVisible();

  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Train", exact: true }).click();
  await expectWorkspace(page, "player", "log-drill");

  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Progress", exact: true }).click();
  await expectWorkspace(page, "player", "profile");

  await openMoreDestination(page, "leaderboards");
  await expectWorkspace(page, "player", "leaderboards");
  await expect(page.getByTestId("premium-leaderboards-hub")).toBeVisible({ timeout: 20_000 });

  await openMoreDestination(page, "duels");
  await expectWorkspace(page, "player", "duels");

  await openMoreDestination(page, "program");
  await expectWorkspace(page, "player", "program");

  await openMoreDestination(page, "sc");
  await expectWorkspace(page, "player", "sc");

  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Progress", exact: true }).click();
  await expectWorkspace(page, "player", "profile");
});
