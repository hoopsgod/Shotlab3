import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve(process.cwd(), "artifacts/design-audit/iphone");

async function installRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
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

async function enterPlayerDemo(page) {
  await installRoutes(page);
  await page.goto("/");
  const demoButton = page.getByRole("button", { name: /Player demo/i });
  await expect(demoButton).toBeVisible({ timeout: 20_000 });
  await demoButton.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

async function openSecondaryRoute(page, key) {
  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  await sheet.locator(`[data-nav-key="${key}"]`).click();
  await expect(page.getByTestId("mobile-navigation-sheet")).toHaveCount(0);
}

async function verifyStrengthCommitmentSurface(page) {
  const center = page.getByTestId("player-commitment-center-strength");
  const routeHeader = page.getByTestId("player-commitment-route-header-strength");
  const hero = page.getByTestId("player-commitment-hero-strength");
  const details = page.getByTestId("player-commitment-details-strength");
  const legacy = page.getByTestId("player-strength-operational-panel");

  await expect(center).toBeVisible({ timeout: 20_000 });
  await expect(routeHeader).toBeVisible();
  await expect(routeHeader.getByRole("heading", { name: "Strength & Conditioning", exact: true })).toBeVisible();
  await expect(routeHeader.getByText(/^(?:Schedule clear|\d+ responses? needed)$/, { exact: false })).toBeVisible();
  await expect(hero).toBeVisible();
  await expect(details).not.toHaveAttribute("open", "");
  await expect(legacy).toBeHidden();

  const heroStyle = await hero.evaluate((node) => {
    const style = getComputedStyle(node);
    const titleNode = node.querySelector("h2");
    return { backgroundImage: style.backgroundImage, backgroundColor: style.backgroundColor, borderRadius: style.borderRadius, titleColor: titleNode ? getComputedStyle(titleNode).color : "" };
  });
  expect(heroStyle.backgroundImage).toContain("gradient");
  expect(heroStyle.backgroundColor).toBe("rgb(17, 20, 17)");
  expect(heroStyle.titleColor).toBe("rgb(248, 250, 245)");
  expect(parseFloat(heroStyle.borderRadius)).toBeGreaterThanOrEqual(20);

  await capture(page, "04o-player-strength-commitment");
  const action = hero.getByRole("button").first();
  await expect(action).toBeVisible();
  await action.click();
  await expect(details).toHaveAttribute("open", "");
  await expect(legacy).toBeVisible({ timeout: 10_000 });
  await noOverflow(page);
}

test("Player Events is a premium personal schedule with selected-event private RSVP detail", async ({ page }) => {
  await enterPlayerDemo(page);
  await openSecondaryRoute(page, "program");

  const center = page.getByTestId("player-commitment-center-events");
  const title = page.getByTestId("player-events-title-stage");
  const hero = page.getByTestId("player-events-next-up");
  const week = center.getByTestId("events-week-rail");
  const month = center.getByTestId("events-month-panel");
  const list = page.getByTestId("player-events-upcoming-list");
  const details = page.getByTestId("player-commitment-details-events");

  await expect(center).toBeVisible({ timeout: 20_000 });
  await expect(title.getByText("SCHEDULE", { exact: true })).toBeVisible();
  await expect(title.getByRole("heading", { name: "Events", exact: true })).toBeVisible();
  await expect(hero).toBeVisible();
  await expect(hero.getByText(/^(?:RSVP REQUIRED|✓ GOING)$/, { exact: false })).toBeVisible();
  await expect(week.getByRole("button")).toHaveCount(7);
  await expect(list).toBeVisible();
  await expect(month).toBeVisible();
  await expect(month).not.toHaveAttribute("open", "");
  await expect(details).not.toHaveAttribute("open", "");

  const geometry = await page.evaluate(() => {
    const heroNode = document.querySelector('[data-testid="player-events-next-up"]');
    const weekNode = document.querySelector('[data-testid="player-commitment-center-events"] [data-testid="events-week-rail"]');
    if (!heroNode || !weekNode) throw new Error("Missing Events first-view geometry targets");
    const heroBox = heroNode.getBoundingClientRect();
    const weekBox = weekNode.getBoundingClientRect();
    return { heroY: heroBox.y, weekBottom: weekBox.bottom, viewport: window.innerHeight, overflow: document.documentElement.scrollWidth - window.innerWidth };
  });
  expect(geometry.heroY).toBeLessThan(geometry.viewport * 0.42);
  expect(geometry.weekBottom).toBeLessThan(geometry.viewport * 1.08);
  expect(geometry.overflow).toBeLessThanOrEqual(1);

  const heroStyle = await hero.evaluate((node) => {
    const style = getComputedStyle(node);
    const heading = node.querySelector("h2");
    return { backgroundImage: style.backgroundImage, radius: parseFloat(style.borderRadius), headingColor: heading ? getComputedStyle(heading).color : "" };
  });
  expect(heroStyle.backgroundImage).toContain("gradient");
  expect(heroStyle.radius).toBeGreaterThanOrEqual(18);
  expect(heroStyle.headingColor).toBe("rgb(248, 249, 243)");

  await capture(page, "04n-player-events-commitment");

  const rows = list.locator("button");
  const rowCount = await rows.count();
  expect(rowCount).toBeGreaterThan(0);
  const targetRow = rows.nth(rowCount > 1 ? 1 : 0);
  const selectedTitle = (await targetRow.locator("strong").first().textContent())?.trim();
  expect(selectedTitle).toBeTruthy();
  await targetRow.click();
  await expect(details).toHaveAttribute("open", "");
  const eventDetail = page.getByTestId("player-event-detail");
  await expect(eventDetail).toBeVisible({ timeout: 10_000 });
  await expect(eventDetail.getByRole("heading", { name: selectedTitle, exact: true })).toBeVisible();
  await expect(eventDetail.getByText("MY RESPONSE", { exact: true })).toBeVisible();
  await noOverflow(page);
});

test("Player S&C keeps its specialized commitment hierarchy and operational controls", async ({ page }) => {
  await enterPlayerDemo(page);
  await openSecondaryRoute(page, "sc");
  await verifyStrengthCommitmentSurface(page);
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible();
});