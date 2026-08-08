import { test, expect } from "@playwright/test";

async function installRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function enterPlayerProfile(page) {
  await installRoutes(page);
  await page.goto("/");
  const demo = page.getByRole("button", { name: /Player demo/i });
  await expect(demo).toBeVisible({ timeout: 20_000 });
  await demo.click();
  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(dock).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  await sheet.locator('[data-nav-key="profile"]').click();
  await expect(page.getByTestId("player-profile-workspace")).toBeVisible({ timeout: 20_000 });
  return dock;
}

test("Player Profile ends near Account & data while retaining dock-safe access", async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 });
  const dock = await enterPlayerProfile(page);

  const accountData = page.getByTestId("player-profile-account-data");
  await expect(accountData).toBeVisible();
  await expect(accountData).not.toHaveAttribute("open", "");
  await expect(page.getByTestId("player-profile-privacy")).toBeVisible();
  await expect(page.getByRole("button", { name: "Logout", exact: true })).toBeVisible();

  const layout = await page.evaluate(() => {
    const account = document.querySelector('[data-testid="player-profile-account-data"]');
    const workspace = document.querySelector('.performance-shell--player.is-mobile[data-workspace-tab="profile"] .performance-workspace');
    const route = document.querySelector('.performance-shell--player.is-mobile[data-workspace-tab="profile"] .player-scroll-container > .screen-fade-in');
    if (!account || !workspace || !route) throw new Error("Player Profile containment targets missing");
    const rect = account.getBoundingClientRect();
    const contentBottom = rect.bottom + window.scrollY;
    const after = getComputedStyle(route, "::after");
    const read = (selector) => {
      const target = document.querySelector(selector);
      if (!target) return null;
      const box = target.getBoundingClientRect();
      const style = getComputedStyle(target);
      return {
        selector,
        top: box.top + window.scrollY,
        bottom: box.bottom + window.scrollY,
        height: box.height,
        clientHeight: target.clientHeight,
        scrollHeight: target.scrollHeight,
        minHeight: style.minHeight,
        heightStyle: style.height,
        paddingTop: style.paddingTop,
        paddingBottom: style.paddingBottom,
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
        display: style.display,
        flex: style.flex,
      };
    };
    return {
      tail: document.documentElement.scrollHeight - contentBottom,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      viewportHeight: window.innerHeight,
      documentHeight: document.documentElement.scrollHeight,
      bodyHeight: document.body.scrollHeight,
      contentBottom,
      reserve: getComputedStyle(workspace).getPropertyValue("--phase3n-profile-dock-reserve").trim(),
      spacerHeight: Number.parseFloat(after.height || "0"),
      nodes: [
        read('.performance-shell--player'),
        read('.performance-shell--player .shell-main'),
        read('.performance-shell--player .content-wrap'),
        read('.performance-shell--player .performance-workspace'),
        read('.performance-shell--player .player-scroll-container'),
        read('.performance-shell--player .player-scroll-container > .screen-fade-in'),
        read('[data-testid="player-profile-workspace"]'),
        read('[data-testid="player-profile-account-data"]'),
      ],
    };
  });

  console.log("PHASE3N_PROFILE_GEOMETRY", JSON.stringify(layout));
  expect(layout.reserve).toBe("112px");
  expect(layout.spacerHeight, "Profile structural spacer must survive the built CSS cascade").toBeGreaterThanOrEqual(96);
  expect(layout.overflow).toBeLessThanOrEqual(1);
  expect(layout.tail, "Player Profile should retain one deliberate dock-safe end reserve").toBeGreaterThanOrEqual(96);
  expect(layout.tail, "Player Profile should not retain duplicate dock padding").toBeLessThanOrEqual(220);

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const dockClearance = await page.evaluate(() => {
    const summary = document.querySelector('[data-testid="player-profile-account-data"] > summary');
    const mobileDock = document.querySelector('[data-testid="mobile-navigation-dock"]');
    if (!summary || !mobileDock) throw new Error("Profile dock-clearance targets missing");
    return mobileDock.getBoundingClientRect().top - summary.getBoundingClientRect().bottom;
  });
  console.log("PHASE3N_PROFILE_DOCK_CLEARANCE", dockClearance);
  expect(dockClearance, "Account & data must be able to scroll above the fixed mobile dock").toBeGreaterThanOrEqual(8);

  await accountData.locator(":scope > summary").click();
  await expect(accountData).toHaveAttribute("open", "");
  await expect(accountData.getByRole("button", { name: "Delete Account & Data", exact: true })).toBeVisible();
});
