import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route("**/v1/coach/players/provision**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function enterCoachDemo(page) {
  await installSafeRoutes(page);
  await page.goto("/");
  const demo = page.getByRole("button", { name: /Coach demo/i });
  await expect(demo).toBeVisible({ timeout: 20_000 });
  await demo.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

async function openPlayers(page) {
  const dock = page.getByTestId("mobile-navigation-dock");
  const direct = dock.locator('[data-nav-key="players"]');
  if (await direct.count()) await direct.click();
  else {
    await page.getByTestId("mobile-navigation-more").click();
    await page.getByTestId("mobile-navigation-sheet").locator('[data-nav-key="players"]').click();
  }
}

async function openFirstFullProfile(page) {
  const roster = page.locator("#coach-roster-operations");
  await expect(roster).toBeVisible({ timeout: 20_000 });
  const profileButton = roster.locator('[data-phase1-open-profile="true"]').first();
  await expect(profileButton).toBeVisible();
  const label = await profileButton.getAttribute("aria-label");
  const playerName = String(label || "").replace(/^Open\s+/i, "").replace(/\s+profile$/i, "") || "Player";
  await profileButton.click();
  const drawer = page.getByRole("dialog", { name: playerName });
  await expect(drawer).toBeVisible({ timeout: 10_000 });
  await drawer.getByRole("button", { name: "Open Full Profile", exact: true }).click();
  await expect(page.getByTestId("coach-player-detail-workspace")).toBeVisible({ timeout: 10_000 });
  return playerName;
}

test("Coach player detail keeps the player name readable at 390px", async ({ page }) => {
  await enterCoachDemo(page);
  await openPlayers(page);
  const playerName = await openFirstFullProfile(page);
  const hero = page.locator(".coachPlayerProfileHero");
  const heading = hero.locator("h2");
  await expect(hero).toBeVisible();
  await expect(heading).toBeVisible();

  const geometry = await heading.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(element);
    const lineRects = [...range.getClientRects()].filter((item) => item.width > 0 && item.height > 0);
    return {
      width: rect.width,
      lineCount: lineRects.length,
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
    };
  });

  expect(playerName.length).toBeGreaterThan(1);
  expect(geometry.width).toBeGreaterThanOrEqual(140);
  expect(geometry.lineCount).toBeLessThanOrEqual(3);
  expect(geometry.documentWidth - geometry.viewport).toBeLessThanOrEqual(1);
});
