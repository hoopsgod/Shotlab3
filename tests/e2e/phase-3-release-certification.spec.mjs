import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT = path.resolve(process.cwd(), "artifacts/phase-3-release-certification");
fs.mkdirSync(OUTPUT, { recursive: true });

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route("**/v1/coach/players/provision**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function suppressMotion(page) {
  await page.addStyleTag({ content: `
    *, *::before, *::after { animation-duration:0s!important; animation-delay:0s!important; transition-duration:0s!important; caret-color:transparent!important; }
    html,body { scrollbar-width:none!important; }
    ::-webkit-scrollbar { display:none!important; }
  ` });
}

async function expectNoHorizontalOverflow(page) {
  const geometry = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  expect(geometry.document - geometry.viewport).toBeLessThanOrEqual(2);
  expect(geometry.body - geometry.viewport).toBeLessThanOrEqual(2);
}

async function capture(page, name, locator = null) {
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(250);
  await expectNoHorizontalOverflow(page);
  const target = locator || page;
  const file = path.join(OUTPUT, `${name}.png`);
  await target.screenshot({ path: file, animations: "disabled", ...(locator ? {} : { fullPage: false }) });
  expect(fs.statSync(file).size).toBeGreaterThan(15_000);
}

async function enterDemo(page, role) {
  await installSafeRoutes(page);
  await page.goto("/");
  await suppressMotion(page);
  await page.getByRole("button", { name: new RegExp(`${role} demo`, "i") }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

async function openMore(page) {
  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  return sheet;
}

async function openMoreDestination(page, key) {
  const sheet = await openMore(page);
  const destination = sheet.locator(`[data-nav-key="${key}"]`);
  await expect(destination).toBeVisible();
  await destination.click();
  await expect(sheet).toHaveCount(0);
}

async function closeTeamStore(page) {
  const close = page.locator(".ts-close");
  if (await close.count()) await close.first().click();
}

test.describe("Phase 3 release certification — 390x844", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("Coach secondary matrix includes roster detail, drawer, operations, branding, More, and Team Store", async ({ page }) => {
    await enterDemo(page, "Coach");

    await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Players", exact: true }).click();
    const roster = page.locator("#coach-roster-operations");
    await expect(roster).toBeVisible({ timeout: 20_000 });
    const row = roster.locator('> .fade-up > [role="button"]').first();
    await expect(row).toBeVisible();
    const rowName = (await row.locator("span").first().textContent())?.trim() || "Player";
    await row.click({ position: { x: 18, y: 18 } });
    const playerDrawer = page.getByRole("dialog", { name: rowName });
    await expect(playerDrawer).toBeVisible({ timeout: 10_000 });
    await capture(page, "11-coach-player-drawer");
    await playerDrawer.getByRole("button", { name: "Open Full Profile", exact: true }).click();
    await expect(page.getByTestId("coach-player-detail-workspace")).toBeVisible({ timeout: 10_000 });
    await capture(page, "12-coach-player-detail");

    await enterDemo(page, "Coach");
    const more = await openMore(page);
    await capture(page, "13-coach-more-sheet");
    await more.locator('[data-nav-key="sc"]').click();
    await expect(page.getByTestId("coach-page-dashboard-strength")).toBeVisible({ timeout: 20_000 });
    await capture(page, "14-coach-strength");

    await openMoreDestination(page, "branding");
    await expect(page.getByTestId("coach-branding-workspace")).toBeVisible({ timeout: 20_000 });
    await capture(page, "15-coach-branding");

    await enterDemo(page, "Coach");
    await openMoreDestination(page, "team-store");
    const store = page.locator(".ts-panel");
    await expect(store).toBeVisible({ timeout: 10_000 });
    await capture(page, "16-coach-team-store");
  });

  test("Player secondary matrix includes More, Events, Lifting, account/legal disclosure, and Team Store", async ({ page }) => {
    await enterDemo(page, "Player");

    const more = await openMore(page);
    await capture(page, "17-player-more-sheet");
    await more.locator('[data-nav-key="program"]').click();
    await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible();
    await capture(page, "18-player-events");

    await openMoreDestination(page, "sc");
    await capture(page, "19-player-lifting");

    await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Progress", exact: true }).click();
    const story = page.getByTestId("player-progress-story");
    await expect(story).toBeVisible({ timeout: 20_000 });
    await story.getByTestId("player-progress-open-profile").click();
    const account = page.getByTestId("player-profile-account-data");
    await expect(account).toBeVisible({ timeout: 10_000 });
    await account.scrollIntoViewIfNeeded();
    await capture(page, "20-player-account-collapsed");
    await account.locator(":scope > summary").click();
    await expect(account.getByRole("link", { name: "Privacy", exact: true })).toBeVisible();
    await expect(account.getByRole("link", { name: "Terms", exact: true })).toBeVisible();
    await expect(account.getByRole("link", { name: "Support", exact: true })).toBeVisible();
    await capture(page, "21-player-account-expanded");

    await enterDemo(page, "Player");
    await openMoreDestination(page, "team-store");
    const store = page.locator(".ts-panel");
    await expect(store).toBeVisible({ timeout: 10_000 });
    await capture(page, "22-player-team-store");
    await closeTeamStore(page);
  });
});

test.describe("Phase 3 release certification — responsive spot checks", () => {
  test("430px preserves Coach and Player hierarchy without overflow", async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 932 });
    await enterDemo(page, "Coach");
    await capture(page, "23-coach-home-430");
    await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Players", exact: true }).click();
    await expect(page.getByTestId("coach-players-interactive-dashboard")).toBeVisible({ timeout: 20_000 });
    await capture(page, "24-coach-players-430");

    await enterDemo(page, "Player");
    await capture(page, "25-player-home-430");
    await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Progress", exact: true }).click();
    await expect(page.getByTestId("player-progress-story")).toBeVisible({ timeout: 20_000 });
    await capture(page, "26-player-progress-430");
  });

  test("desktop preserves representative Coach and Player production composition", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await installSafeRoutes(page);
    await page.goto("/");
    await suppressMotion(page);
    await capture(page, "27-auth-desktop");

    await page.getByRole("button", { name: /Coach demo/i }).click();
    await expect(page.getByText(/Coach/i).first()).toBeVisible({ timeout: 20_000 });
    await capture(page, "28-coach-home-desktop");

    await page.goto("/");
    await page.getByRole("button", { name: /Player demo/i }).click();
    await expect(page.getByText(/Player/i).first()).toBeVisible({ timeout: 20_000 });
    await capture(page, "29-player-home-desktop");
  });
});
