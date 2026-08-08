import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve(process.cwd(), "artifacts/design-audit/iphone");

async function installRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function capture(page, name) {
  fs.mkdirSync(outputDir, { recursive: true });
  await page.screenshot({ path: path.join(outputDir, name), fullPage: false, animations: "disabled" });
}

async function expectNoOverflow(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

async function enterDemo(page, role) {
  await page.getByRole("button", { name: new RegExp(`${role} demo`, "i") }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

test.beforeEach(async ({ page }) => {
  await installRoutes(page);
  await page.goto("/");
});

test("Phase 4A entry experience carries the ShotLab basketball signature without blocking auth", async ({ page }) => {
  const field = page.getByTestId("auth-signature-field");
  await expect(field).toBeVisible();
  const presentation = await field.evaluate((node) => ({
    pointerEvents: getComputedStyle(node).pointerEvents,
    opacity: Number.parseFloat(getComputedStyle(node).opacity),
    position: getComputedStyle(node).position,
    courtVisible: node.querySelector('svg[class*="court"]')?.getBoundingClientRect().width > 0,
    ballVisible: node.querySelector('svg[class*="ball"]')?.getBoundingClientRect().width > 0,
  }));
  expect(presentation.pointerEvents).toBe("none");
  expect(presentation.position).toBe("fixed");
  expect(presentation.opacity).toBeGreaterThanOrEqual(.5);
  expect(presentation.courtVisible).toBe(true);
  expect(presentation.ballVisible).toBe(true);
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Player demo", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Coach demo", exact: true })).toBeVisible();
  await expectNoOverflow(page);
  await capture(page, "08a-phase4a-auth-signature.png");
});

test("Phase 4A Player Home uses signature court geometry and branded stat instrumentation", async ({ page }) => {
  await enterDemo(page, "Player");
  const command = page.getByTestId("player-daily-command-center");
  const field = page.getByTestId("player-home-signature-field");
  await expect(command).toBeVisible({ timeout: 20_000 });
  await expect(field).toBeVisible();
  await expect(field).toHaveAttribute("data-shotlab-signature", "court");
  expect(await field.evaluate((node) => node.parentElement?.getAttribute("data-testid"))).toBe("player-daily-command-center");
  const metricAccent = await page.getByTestId("player-command-evidence").locator(":scope > div").first().evaluate((node) => ({
    beforeImage: getComputedStyle(node, "::before").backgroundImage,
    afterWidth: Number.parseFloat(getComputedStyle(node, "::after").width || "0"),
  }));
  expect(metricAccent.beforeImage).toContain("gradient");
  expect(metricAccent.afterWidth).toBeGreaterThanOrEqual(20);
  await expectNoOverflow(page);
  await capture(page, "08b-phase4a-player-home-signature.png");
});

test("Phase 4A Player Progress carries the same visual DNA with a different crop", async ({ page }) => {
  await enterDemo(page, "Player");
  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Progress", exact: true }).click();
  const hero = page.getByTestId("player-progress-story-hero");
  const field = page.getByTestId("player-progress-signature-field");
  await expect(hero).toBeVisible({ timeout: 20_000 });
  await expect(field).toBeVisible();
  await expect(field).toHaveAttribute("data-shotlab-signature", "trajectoryVariant");
  expect(await field.evaluate((node) => node.parentElement?.getAttribute("data-testid"))).toBe("player-progress-story-hero");
  const metricRing = await page.getByTestId("player-progress-metrics").locator(":scope > div").first().evaluate((node) => Number.parseFloat(getComputedStyle(node, "::after").width || "0"));
  expect(metricRing).toBeGreaterThanOrEqual(24);
  await expectNoOverflow(page);
  await capture(page, "08c-phase4a-player-progress-signature.png");
});

test("Phase 4A Rankings gets restrained competitive branding without becoming a dark hero clone", async ({ page }) => {
  await enterDemo(page, "Player");
  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  await sheet.locator('[data-nav-key="leaderboards"]').click();
  const hub = page.getByTestId("premium-leaderboards-hub");
  await expect(hub).toBeVisible({ timeout: 20_000 });
  const header = hub.locator(":scope > header");
  const treatment = await header.evaluate((node) => ({
    background: getComputedStyle(node).backgroundColor,
    ringWidth: Number.parseFloat(getComputedStyle(node, "::after").width || "0"),
    ringBorder: getComputedStyle(node, "::after").borderTopColor,
    dotWidth: Number.parseFloat(getComputedStyle(node, "::before").width || "0"),
  }));
  expect(treatment.ringWidth).toBeGreaterThanOrEqual(100);
  expect(treatment.ringBorder).not.toBe("rgba(0, 0, 0, 0)");
  expect(treatment.dotWidth).toBeGreaterThanOrEqual(6);
  await expectNoOverflow(page);
  await capture(page, "08d-phase4a-player-rankings-signature.png");
});

test("Phase 4A preserves Coach Mission Control's established mobile team-mark identity", async ({ page }) => {
  await page.goto("/");
  await enterDemo(page, "Coach");
  const hero = page.getByTestId("coach-primary-objective");
  await expect(hero).toBeVisible({ timeout: 20_000 });

  const teamMark = hero.locator(".mcHeroTeamMark");
  await expect(teamMark).toBeVisible();
  await expect(teamMark.locator("img")).toBeVisible();
  const coachIdentity = await hero.evaluate((node) => ({
    courtArtworkDisplay: getComputedStyle(node.querySelector(".mcCourtArtwork")).display,
    teamMarkDisplay: getComputedStyle(node.querySelector(".mcHeroTeamMark")).display,
    teamMarkOpacity: Number.parseFloat(getComputedStyle(node.querySelector(".mcHeroTeamMark")).opacity),
    backgroundImage: getComputedStyle(node).backgroundImage,
    shadow: getComputedStyle(node).boxShadow,
  }));
  expect(coachIdentity.courtArtworkDisplay).toBe("none");
  expect(coachIdentity.teamMarkDisplay).not.toBe("none");
  expect(coachIdentity.teamMarkOpacity).toBeGreaterThanOrEqual(.9);
  expect(coachIdentity.backgroundImage).toContain("gradient");
  expect(coachIdentity.shadow).not.toBe("none");

  await expect(page.getByTestId("player-home-signature-field")).toHaveCount(0);
  await expect(page.getByTestId("player-progress-signature-field")).toHaveCount(0);
  await expectNoOverflow(page);
  await capture(page, "08e-phase4a-coach-existing-signature.png");
});
