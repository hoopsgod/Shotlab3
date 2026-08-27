import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve(process.cwd(), "artifacts/design-audit/iphone");

async function installRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function enterCoachDemo(page) {
  await page.goto("/");
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

async function removeInactiveDemoPlayerThroughUi(page) {
  const dock = page.getByTestId("mobile-navigation-dock");
  await dock.getByRole("button", { name: "Players", exact: true }).click();

  await expect(page.locator("#coach-roster-operations")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Micah Santos", { exact: true }).first()).toBeVisible({ timeout: 20_000 });

  const micahRow = page
    .locator("#coach-roster-operations .phase1RosterRow")
    .filter({ hasText: "Micah Santos" })
    .filter({ has: page.getByRole("button", { name: "REMOVE", exact: true }) })
    .first();
  await expect(micahRow).not.toHaveAttribute("role", "button");
  page.once("dialog", async (dialog) => dialog.accept());
  await micahRow.getByRole("button", { name: "REMOVE", exact: true }).click();
  await expect(page.getByText("Micah Santos", { exact: true })).toHaveCount(0);

  await dock.getByRole("button", { name: "Home", exact: true }).click();
  await expect(page.getByTestId("coach-primary-objective")).toBeVisible({ timeout: 20_000 });
}

test.beforeEach(async ({ page }) => {
  await installRoutes(page);
});

test("Phase 5A keeps the accepted Phase 4 Coach visual hierarchy while adding decision intelligence", async ({ page }) => {
  await enterCoachDemo(page);

  const hero = page.getByTestId("coach-primary-objective");
  const metrics = page.getByTestId("coach-primary-metrics");
  await expect(hero).toBeVisible({ timeout: 20_000 });
  await expect(hero.getByText("Demo Titans", { exact: true })).toBeVisible();
  await expect(hero.getByRole("heading", { level: 1 })).toHaveText(/\S+/);
  await expect(hero.locator(".mcPrimary")).toBeVisible();
  await expect(metrics).toContainText("Active");
  await expect(metrics).toContainText("Follow-up");
  await expect(metrics).toContainText(/Set|Next/);

  const buttonHeights = await metrics.getByRole("button").evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().height));
  expect(buttonHeights).toHaveLength(3);
  for (const height of buttonHeights) expect(height).toBeGreaterThanOrEqual(44);

  const heroBox = await hero.boundingBox();
  expect(heroBox).not.toBeNull();
  expect(heroBox.x).toBeGreaterThanOrEqual(-0.5);
  expect(heroBox.x + heroBox.width).toBeLessThanOrEqual(430.5);

  // .mcHeroContent intentionally owns the full-bleed hero box and creates the
  // visible mobile rail with padding. Measure the first semantic content rail,
  // not the padded container border, so this contract detects real clipping.
  const heroIdentityBox = await hero.locator(".mcHeroIdentity").boundingBox();
  expect(heroIdentityBox).not.toBeNull();
  expect(heroIdentityBox.x).toBeGreaterThanOrEqual(12);
  expect(heroIdentityBox.x + heroIdentityBox.width).toBeLessThanOrEqual(418);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  await settleCoachSurface(page);
  const settledOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(settledOverflow).toBeLessThanOrEqual(1);

  fs.mkdirSync(outputDir, { recursive: true });
  await page.screenshot({ path: path.join(outputDir, "13a-phase5a-coach-decision-intelligence.png"), fullPage: false, animations: "disabled" });
});

test("Phase 5A keeps the post-roster-change Coach decision path truthful and actionable", async ({ page }) => {
  await enterCoachDemo(page);
  await removeInactiveDemoPlayerThroughUi(page);

  const hero = page.getByTestId("coach-primary-objective");
  await expect(hero).toBeVisible();
  await expect(hero.getByRole("heading", { level: 1 })).toHaveText(/\S+/);
  const primaryAction = hero.locator(".mcPrimary");
  await expect(primaryAction).toBeVisible();
  expect((await primaryAction.boundingBox())?.height || 0).toBeGreaterThanOrEqual(44);

  await settleCoachSurface(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  fs.mkdirSync(outputDir, { recursive: true });
  await page.screenshot({ path: path.join(outputDir, "13b-phase5a-coach-rsvp-decision.png"), fullPage: false, animations: "disabled" });

  // If the live Demo reconciliation produces an RSVP risk, exercise that route.
  // Otherwise preserve the current practice-ready decision without inventing a
  // stale RSVP count. The dedicated Phase 5 release-hardening suite owns the
  // deterministic seeded RSVP response-loop contract.
  const reviewRsvps = hero.getByRole("button", { name: /Review RSVPs/i });
  if (await reviewRsvps.isVisible().catch(() => false)) {
    await reviewRsvps.click();
    const drawer = page.getByTestId("coach-event-intelligence-drawer");
    await expect(drawer).toBeVisible({ timeout: 10_000 });
    await expect(drawer).toContainText(/Awaiting RSVP/i);
    await expect(drawer).not.toContainText("Unavailable");
  } else {
    await expect(hero).not.toContainText(/RSVP.*Unavailable/i);
    await expect(page.getByTestId("coach-primary-metrics")).toContainText(/Active|Follow-up|Set|Next/);
  }
});