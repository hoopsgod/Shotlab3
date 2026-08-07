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
  const demoButton = page.getByRole("button", { name: role === "coach" ? /Coach demo/i : /Player demo/i });
  await expect(demoButton).toBeVisible({ timeout: 20_000 });
  await demoButton.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

async function noOverflow(page) {
  const amount = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(amount).toBeLessThanOrEqual(1);
}

async function capture(page, name) {
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(250);
  await noOverflow(page);
  fs.mkdirSync(outputDir, { recursive: true });
  await page.screenshot({ path: path.join(outputDir, `${name}.png`), fullPage: true, animations: "disabled" });
}

async function more(page) {
  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  return sheet;
}

async function toggleDisclosure(disclosure, open) {
  await disclosure.locator(":scope > summary").click();
  if (open) await expect(disclosure).toHaveAttribute("open", "");
  else await expect(disclosure).not.toHaveAttribute("open", "");
}

test("Player visual system remains integrated across core and secondary pages", async ({ page }) => {
  await enterDemo(page, "player");
  await capture(page, "01-player-home");

  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Progress", exact: true }).click();
  await expect(page.getByTestId("premium-leaderboards-hub")).toBeVisible({ timeout: 20_000 });
  await capture(page, "02-player-leaderboards");

  let sheet = await more(page);
  await sheet.locator('[data-nav-key="profile"]').click();

  const careerDisclosure = page.getByTestId("player-profile-career-disclosure");
  const performanceDisclosure = page.getByTestId("player-profile-performance-details");
  const drillDisclosure = page.getByTestId("player-profile-drill-development");

  await expect(careerDisclosure).toBeVisible({ timeout: 20_000 });
  await expect(performanceDisclosure).toBeVisible({ timeout: 20_000 });
  await expect(drillDisclosure).toBeVisible({ timeout: 20_000 });
  await expect(careerDisclosure).not.toHaveAttribute("open", "");
  await expect(performanceDisclosure).not.toHaveAttribute("open", "");
  await expect(drillDisclosure).not.toHaveAttribute("open", "");
  await expect(page.getByTestId("player-career-history")).toBeHidden();
  await expect(page.getByTestId("player-profile-analytics")).toBeHidden();
  await expect(page.getByTestId("player-profile-drill-detail-body")).toBeHidden();
  await expect(page.getByTestId("player-profile-readout")).toBeVisible();
  await expect(page.getByText("OFFSEASON PLAYER", { exact: true })).toHaveCount(0);
  await expect(page.getByText("OFFSEASON REPORT CARD", { exact: true })).toBeVisible();
  await expect(page.getByText("PLAYER PROGRESS PROFILE", { exact: true })).toBeVisible();
  await capture(page, "03-player-profile-default");

  await toggleDisclosure(performanceDisclosure, true);
  await expect(page.getByTestId("player-profile-analytics")).toBeVisible({ timeout: 20_000 });
  await capture(page, "03b-player-profile-performance-expanded");
  await toggleDisclosure(performanceDisclosure, false);

  await toggleDisclosure(drillDisclosure, true);
  await expect(page.getByTestId("player-profile-drill-detail-body")).toBeVisible({ timeout: 20_000 });
  await capture(page, "03c-player-profile-drills-expanded");
  await toggleDisclosure(drillDisclosure, false);

  await toggleDisclosure(careerDisclosure, true);
  await expect(page.getByTestId("player-career-history")).toBeVisible({ timeout: 20_000 });
  await capture(page, "03d-player-profile-career-expanded");
  await toggleDisclosure(careerDisclosure, false);

  sheet = await more(page);
  await sheet.locator('[data-nav-key="team-store"]').click();
  const store = page.getByRole("dialog", { name: "Team Store" });
  await expect(store).toBeVisible();
  await capture(page, "04-player-team-store");
});

test("Coach visual system remains integrated across command and management pages", async ({ page }) => {
  await enterDemo(page, "coach");
  await capture(page, "05-coach-home");

  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Players", exact: true }).click();
  await capture(page, "06-coach-players");

  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Schedule", exact: true }).click();
  await capture(page, "07-coach-events");

  let sheet = await more(page);
  await sheet.locator('[data-nav-key="drills"]').click();
  await expect(page.locator("#coach-drills-management")).toBeVisible({ timeout: 20_000 });
  await capture(page, "08-coach-drills");

  sheet = await more(page);
  await sheet.locator('[data-nav-key="team-store"]').click();
  await expect(page.getByRole("dialog", { name: "Team Store" })).toBeVisible();
  await capture(page, "09-coach-team-store");
});