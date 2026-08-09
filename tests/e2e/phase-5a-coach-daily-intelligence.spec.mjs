import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve(process.cwd(), "artifacts/design-audit/iphone");

async function installRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function enterCoachDemo(page, path = "/") {
  await page.goto(path);
  const demo = page.getByRole("button", { name: /Coach demo/i });
  await expect(demo).toBeVisible({ timeout: 20_000 });
  await demo.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

async function settleCoachSurface(page) {
  await page.waitForFunction(() => document.readyState === "complete" && Boolean(document.querySelector('[data-testid="coach-command-center-full"]')));
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForTimeout(750);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function removeInactiveDemoPlayer(page) {
  const remaining = await page.evaluate(async () => {
    const key = "sl:players";
    const raw = window.localStorage.getItem(key) || "[]";
    const rows = JSON.parse(raw);
    const next = Array.isArray(rows)
      ? rows.filter((row) => String(row?.email || "").trim().toLowerCase() !== "micah.santos@demo.shotlab.app")
      : [];
    const json = JSON.stringify(next);
    window.localStorage.setItem(key, json);
    if (window.storage && typeof window.storage.set === "function") await window.storage.set(key, json, true);
    return next.filter((row) => String(row?.role || "").toLowerCase() !== "coach").length;
  });
  expect(remaining).toBe(3);
}

test.beforeEach(async ({ page }) => {
  await installRoutes(page);
});

test("Phase 5A keeps the accepted Phase 4 Coach visual hierarchy while adding decision intelligence", async ({ page }) => {
  await enterCoachDemo(page);

  const hero = page.getByTestId("coach-primary-objective");
  const metrics = page.getByTestId("coach-primary-metrics");
  await expect(hero).toBeVisible({ timeout: 20_000 });
  await expect(hero).toContainText("Today at a glance");
  await expect(hero).toContainText(/decision.*before practice/i);
  await expect(metrics).toContainText("Active");
  await expect(metrics).toContainText("Follow-up");
  await expect(metrics).toContainText("Next");
  await expect(metrics).not.toContainText("RSVP ready");

  const buttonHeights = await metrics.getByRole("button").evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().height));
  expect(buttonHeights).toHaveLength(3);
  for (const height of buttonHeights) expect(height).toBeGreaterThanOrEqual(44);

  const heroBox = await hero.boundingBox();
  expect(heroBox).not.toBeNull();
  expect(heroBox.x).toBeGreaterThanOrEqual(12);
  expect(heroBox.x + heroBox.width).toBeLessThanOrEqual(418);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  await settleCoachSurface(page);
  const settledOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(settledOverflow).toBeLessThanOrEqual(1);

  fs.mkdirSync(outputDir, { recursive: true });
  await page.screenshot({ path: path.join(outputDir, "13a-phase5a-coach-decision-intelligence.png"), fullPage: false, animations: "disabled" });
});

test("Phase 5A renders the RSVP decision path and routes directly to event intelligence", async ({ page }) => {
  await enterCoachDemo(page, "/?demo=1");
  await removeInactiveDemoPlayer(page);
  await page.reload();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });

  const hero = page.getByTestId("coach-primary-objective");
  await expect(hero).toBeVisible({ timeout: 20_000 });
  await expect(hero).toContainText("Today at a glance");
  await expect(hero).toContainText("1 decision before practice");
  await expect(hero).toContainText(/2 RSVPs still open for Team Practice/i);
  const reviewRsvps = hero.getByRole("button", { name: /Review RSVPs/i });
  await expect(reviewRsvps).toBeVisible();
  expect((await reviewRsvps.boundingBox())?.height || 0).toBeGreaterThanOrEqual(44);

  await settleCoachSurface(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  fs.mkdirSync(outputDir, { recursive: true });
  await page.screenshot({ path: path.join(outputDir, "13b-phase5a-coach-rsvp-decision.png"), fullPage: false, animations: "disabled" });

  await reviewRsvps.click();
  const drawer = page.getByTestId("coach-event-intelligence-drawer");
  await expect(drawer).toBeVisible({ timeout: 10_000 });
  await expect(drawer).toContainText("Team Practice");
  await expect(drawer).toContainText("Missing");
  await expect(drawer).toContainText("2");
});