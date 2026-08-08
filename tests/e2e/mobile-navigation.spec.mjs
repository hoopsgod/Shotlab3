import { test, expect } from "@playwright/test";

async function installRoutes(page) {
  await page.route("**/v1/season-archives", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) });
  });
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
}

async function enterDemo(page, role) {
  await page.goto("/");
  await page.getByRole("button", { name: role === "coach" ? "Coach demo" : "Player demo", exact: true }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

async function openMore(page) {
  await page.getByTestId("mobile-navigation-more").click();
  await expect(page.getByTestId("mobile-navigation-sheet")).toBeVisible();
  return page.getByTestId("mobile-navigation-sheet");
}

async function expectDockIcon(dock, name, icon) {
  await expect(dock.getByRole("button", { name, exact: true })).toHaveAttribute("data-icon-name", icon);
}

test("player mobile dock makes Development Story primary with semantic native iconography", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installRoutes(page);
  await enterDemo(page, "player");

  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(dock).toHaveAttribute("data-navigation-intent", "development-first");
  await expect(dock.getByRole("button")).toHaveCount(4);
  await expectDockIcon(dock, "Home", "home");
  await expectDockIcon(dock, "Train", "target");
  await expectDockIcon(dock, "Progress", "momentum");
  await expectDockIcon(dock, "More", "more");
  await expect(dock.getByRole("button", { name: "Program", exact: true })).toHaveCount(0);
  await expect(dock.getByRole("button", { name: "Rankings", exact: true })).toHaveCount(0);
  await expect(dock.getByRole("button", { name: "Profile", exact: true })).toHaveCount(0);

  await dock.getByRole("button", { name: "Progress", exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByTestId("player-progress-story")).toBeVisible();
  await expect(page.getByTestId("player-progress-story-topline")).toContainText("DEVELOPMENT STORY");
  await expectNoHorizontalOverflow(page);

  let sheet = await openMore(page);
  await expect(sheet.getByRole("heading", { name: "More", exact: true })).toBeVisible();
  await expect(sheet.getByText("Program work, schedule, rankings, and team tools.", { exact: true })).toBeVisible();
  await expect(sheet.getByRole("heading", { name: "Team program", exact: true })).toBeVisible();
  await expect(sheet.getByRole("heading", { name: "Rankings", exact: true })).toBeVisible();
  for (const key of ["duels", "program", "sc", "leaderboards", "team-store"]) {
    await expect(sheet.locator(`[data-nav-key="${key}"]`)).toBeVisible();
  }
  await expect(sheet.locator('[data-nav-key="duels"]')).toHaveAttribute("data-icon-name", "program");
  await expect(sheet.locator('[data-nav-key="program"]')).toHaveAttribute("data-icon-name", "calendar");
  await expect(sheet.locator('[data-nav-key="sc"]')).toHaveAttribute("data-icon-name", "custom");
  await expect(sheet.locator('[data-nav-key="leaderboards"]')).toHaveAttribute("data-icon-name", "chart");
  await expect(sheet.locator('[data-nav-key="team-store"]')).toHaveAttribute("data-icon-name", "store");
  await expect(sheet.locator('[data-nav-key="profile"]')).toHaveCount(0);

  await sheet.locator('[data-nav-key="leaderboards"]').click();
  await expect(page.getByTestId("mobile-navigation-sheet")).toHaveCount(0);
  await expect(page).toHaveURL(/\/leaderboards$/);
  await expect(page.getByTestId("premium-leaderboards-hub")).toBeVisible();

  sheet = await openMore(page);
  await sheet.locator('[data-nav-key="team-store"]').click();
  await expect(page.getByTestId("mobile-navigation-sheet")).toHaveCount(0);
  const teamStoreDialog = page.getByRole("dialog", { name: "Team Store" });
  await expect(teamStoreDialog).toBeVisible();
  await expect(teamStoreDialog.getByTestId("player-team-store-retail")).toBeVisible();
  await expect(teamStoreDialog.getByTestId("player-team-store-hero")).toBeVisible();
  await expect(teamStoreDialog.getByText("Your team. Your gear.", { exact: true })).toBeVisible();
  await expect(teamStoreDialog.getByText("Your team store is not open yet", { exact: true })).toHaveCount(0);
  await expect(teamStoreDialog.getByRole("button", { name: "SHOP TEAM STORE" })).toHaveCount(0);
  await teamStoreDialog.getByRole("button", { name: "Close team store" }).click();

  sheet = await openMore(page);
  await sheet.locator('[data-nav-key="program"]').click();
  await expect(page.getByTestId("mobile-navigation-sheet")).toHaveCount(0);
  await expect(page).toHaveURL(/\/events$/);
  const eventsCommitmentCenter = page.getByTestId("player-commitment-center-events");
  await expect(eventsCommitmentCenter).toBeVisible();
  await expect(eventsCommitmentCenter.getByRole("heading", { name: "Events & Attendance", exact: true })).toBeVisible();
  await expect(page.getByTestId("player-events-operational-list")).toBeHidden();
  await expectNoHorizontalOverflow(page);
});

test("coach mobile dock uses Home, Players, and Schedule icons that match their destinations", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installRoutes(page);
  await enterDemo(page, "coach");

  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(dock.getByRole("button")).toHaveCount(4);
  await expectDockIcon(dock, "Home", "home");
  await expectDockIcon(dock, "Players", "team");
  await expectDockIcon(dock, "Schedule", "calendar");
  await expectDockIcon(dock, "More", "more");
  await expect(dock.getByRole("button", { name: "Drills", exact: true })).toHaveCount(0);
  await expect(dock.getByRole("button", { name: "S&C", exact: true })).toHaveCount(0);

  const sheet = await openMore(page);
  for (const key of ["drills", "sc", "leaderboards", "team-store", "branding"]) {
    await expect(sheet.locator(`[data-nav-key="${key}"]`)).toBeVisible();
  }

  await sheet.locator('[data-nav-key="team-store"]').click();
  await expect(page.getByTestId("mobile-navigation-sheet")).toHaveCount(0);
  const teamStoreDialog = page.getByRole("dialog", { name: "Team Store" });
  await expect(teamStoreDialog).toBeVisible();
  await expect(teamStoreDialog.getByLabel("Provider")).toHaveValue("squadlocker");
  await expect(teamStoreDialog.getByRole("button", { name: "PUBLISH STORE" })).toBeVisible();
  await teamStoreDialog.getByRole("button", { name: "Close team store" }).click();

  const reopenedSheet = await openMore(page);
  await reopenedSheet.locator('[data-nav-key="drills"]').click();
  await expect(page.getByTestId("mobile-navigation-sheet")).toHaveCount(0);
  await expect(page.locator("#coach-drills-management")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
