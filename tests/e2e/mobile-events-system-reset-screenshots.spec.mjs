import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/design-audit/mobile-events-reset");
const WIDTHS = [375, 390, 393, 402, 430];
const HEIGHT = 844;

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function installRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/coach/players/provision**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ team_id: "demo", limit: 10, scope: "players", count: 0, leaderboard: [] }) }));
  await page.route("**/v1/leaderboards/participation**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, leaderboards: {} }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function settle(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.waitForTimeout(120);
}

async function noOverflow(page, label) {
  const geometry = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(geometry.documentWidth - geometry.viewport, `${label} document overflow`).toBeLessThanOrEqual(1);
  expect(geometry.bodyWidth - geometry.viewport, `${label} body overflow`).toBeLessThanOrEqual(1);
}

async function capture(page, name) {
  await settle(page);
  await noOverflow(page, name);
  await page.screenshot({ path: path.join(OUTPUT_DIR, `${name}.png`), animations: "disabled" });
}

async function enterDemo(page, role) {
  await installRoutes(page);
  await page.goto("/");
  const button = page.getByRole("button", { name: role === "coach" ? /Coach demo/i : /Player demo/i });
  await expect(button).toBeVisible({ timeout: 20_000 });
  await button.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

async function openRoute(page, key, visibleLabel) {
  const dock = page.getByTestId("mobile-navigation-dock");
  const direct = dock.locator(`[data-nav-key="${key}"]`);
  if (await direct.count()) {
    await direct.click();
  } else if (visibleLabel && await dock.getByRole("button", { name: visibleLabel, exact: true }).count()) {
    await dock.getByRole("button", { name: visibleLabel, exact: true }).click();
  } else {
    await page.getByTestId("mobile-navigation-more").click();
    const sheet = page.getByTestId("mobile-navigation-sheet");
    await expect(sheet).toBeVisible();
    await sheet.locator(`[data-nav-key="${key}"]`).click();
  }
  await settle(page);
}

async function resetScroll(page) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelector(".coach-scroll-container")?.scrollTo(0, 0);
    document.querySelector(".player-scroll-container")?.scrollTo(0, 0);
  });
}

async function auditWidths(page, rootTestId, label) {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: HEIGHT });
    await resetScroll(page);
    await settle(page);
    await expect(page.getByTestId(rootTestId)).toBeVisible();
    await noOverflow(page, `${label}-${width}`);

    const rail = page.getByTestId(rootTestId).getByTestId("events-week-rail");
    await expect(rail.getByRole("button")).toHaveCount(7);
    const railGeometry = await rail.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return { left: rect.left, right: rect.right, viewport: window.innerWidth };
    });
    expect(railGeometry.left, `${label} ${width}px rail left`).toBeGreaterThanOrEqual(-1);
    expect(railGeometry.right, `${label} ${width}px rail right`).toBeLessThanOrEqual(railGeometry.viewport + 1);
  }
  await page.setViewportSize({ width: 390, height: HEIGHT });
  await resetScroll(page);
  await settle(page);
}

test("Coach Events reset renders top, editorial list, secondary month, and management detail", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await enterDemo(page, "coach");
  await openRoute(page, "events", "Schedule");

  const dashboard = page.getByTestId("coach-events-interactive-dashboard");
  const title = page.getByTestId("coach-events-title-stage");
  const hero = page.getByTestId("coach-events-next-team-moment");
  const week = dashboard.getByTestId("events-week-rail");
  const month = dashboard.getByTestId("events-month-panel");

  await expect(dashboard).toBeVisible({ timeout: 20_000 });
  await expect(title).toBeVisible();
  await expect(title.getByRole("heading", { name: "Events", exact: true })).toBeVisible();
  await expect(title.getByRole("button", { name: /\+ New|New/i })).toBeVisible();
  await expect(hero).toBeVisible();
  await expect(week.getByRole("button")).toHaveCount(7);
  await expect(month).not.toHaveAttribute("open", "");
  await auditWidths(page, "coach-events-interactive-dashboard", "coach-events");

  await resetScroll(page);
  await capture(page, "coach-a-top");

  const listPage = page.getByTestId("coach-events-mobile-page");
  await expect(listPage).toBeVisible({ timeout: 20_000 });
  const firstManage = listPage.locator("button.coach-event-manage-action").first();
  await expect(firstManage).toBeVisible();
  await firstManage.scrollIntoViewIfNeeded();
  await capture(page, "coach-b-upcoming-list");

  await month.locator(":scope > summary").scrollIntoViewIfNeeded();
  await month.locator(":scope > summary").click();
  await expect(month).toHaveAttribute("open", "");
  await expect(month.locator("button")).toHaveCount(42);
  await capture(page, "coach-c-month");

  await hero.scrollIntoViewIfNeeded();
  await hero.getByRole("button", { name: /Manage event/i }).click();
  const drawer = page.getByTestId("coach-event-intelligence-drawer");
  await expect(drawer).toBeVisible({ timeout: 10_000 });
  await capture(page, "coach-d-event-detail");
  expect(pageErrors).toEqual([]);
});

test("Player Events reset renders personal RSVP, editorial list, secondary month, and RSVP detail", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await enterDemo(page, "player");
  await openRoute(page, "program");

  const center = page.getByTestId("player-commitment-center-events");
  const title = page.getByTestId("player-events-title-stage");
  const hero = page.getByTestId("player-events-next-up");
  const week = center.getByTestId("events-week-rail");
  const list = page.getByTestId("player-events-upcoming-list");
  const month = center.getByTestId("events-month-panel");
  const details = page.getByTestId("player-commitment-details-events");

  await expect(center).toBeVisible({ timeout: 20_000 });
  await expect(title.getByRole("heading", { name: "Events", exact: true })).toBeVisible();
  await expect(title.getByRole("button", { name: /\+ New|New/i })).toHaveCount(0);
  await expect(hero).toBeVisible();
  await expect(hero.getByText(/^(?:RSVP REQUIRED|✓ GOING)$/, { exact: false })).toBeVisible();
  await expect(week.getByRole("button")).toHaveCount(7);
  await expect(month).not.toHaveAttribute("open", "");
  await auditWidths(page, "player-commitment-center-events", "player-events");

  await resetScroll(page);
  await capture(page, "player-a-top");

  await list.scrollIntoViewIfNeeded();
  await expect(list.locator("button").first()).toBeVisible();
  await capture(page, "player-b-upcoming-list");

  await month.locator(":scope > summary").scrollIntoViewIfNeeded();
  await month.locator(":scope > summary").click();
  await expect(month).toHaveAttribute("open", "");
  await expect(month.locator("button")).toHaveCount(42);
  await capture(page, "player-c-month");

  await hero.scrollIntoViewIfNeeded();
  const responseBefore = await hero.getAttribute("data-state");
  await hero.getByRole("button").click();
  await expect(details).toHaveAttribute("open", "");
  await expect(page.getByTestId("player-events-operational-list")).toBeVisible({ timeout: 10_000 });
  await capture(page, "player-d-event-detail-rsvp");

  if (responseBefore === "action") {
    await resetScroll(page);
    await settle(page);
    await expect(hero).toHaveAttribute("data-state", "calm");
    await expect(hero.getByText("✓ GOING", { exact: true })).toBeVisible();
    await capture(page, "player-e-rsvp-completed");
  }
  expect(pageErrors).toEqual([]);
});
