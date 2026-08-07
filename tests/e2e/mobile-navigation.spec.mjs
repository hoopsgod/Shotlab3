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

test("player mobile dock keeps Home, Train, and Progress direct while grouping secondary areas", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installRoutes(page);
  await enterDemo(page, "player");

  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(dock.getByRole("button")).toHaveCount(4);
  await expect(dock.getByRole("button", { name: "Home", exact: true })).toBeVisible();
  await expect(dock.getByRole("button", { name: "Train", exact: true })).toBeVisible();
  await expect(dock.getByRole("button", { name: "Progress", exact: true })).toBeVisible();
  await expect(dock.getByRole("button", { name: "More", exact: true })).toBeVisible();
  await expect(dock.getByRole("button", { name: "Events", exact: true })).toHaveCount(0);
  await expect(dock.getByRole("button", { name: "Lifting", exact: true })).toHaveCount(0);
  await expect(dock.getByRole("button", { name: "Profile", exact: true })).toHaveCount(0);

  let sheet = await openMore(page);
  for (const key of ["program", "sc", "team-store", "profile"]) {
    await expect(sheet.locator(`[data-nav-key="${key}"]`)).toBeVisible();
  }
  await expect(sheet.locator('[data-nav-key="leaderboards"]')).toHaveCount(0);

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
  await expect(page.getByText("PROGRAM EVENTS", { exact: true }).first()).toBeVisible();

  await dock.getByRole("button", { name: "Progress", exact: true }).click();
  await expect(page).toHaveURL(/\/leaderboards$/);
  await expect(page.getByTestId("premium-leaderboards-hub")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("coach mobile dock keeps Home, Players, and Schedule direct while preserving management areas", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installRoutes(page);
  await enterDemo(page, "coach");

  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(dock.getByRole("button")).toHaveCount(4);
  await expect(dock.getByRole("button", { name: "Home", exact: true })).toBeVisible();
  await expect(dock.getByRole("button", { name: "Players", exact: true })).toBeVisible();
  await expect(dock.getByRole("button", { name: "Schedule", exact: true })).toBeVisible();
  await expect(dock.getByRole("button", { name: "More", exact: true })).toBeVisible();
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
