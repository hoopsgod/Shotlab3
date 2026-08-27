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
  const presentation = await field.evaluate((node) => {
    const [court, ball] = node.querySelectorAll("svg");
    return {
      pointerEvents: getComputedStyle(node).pointerEvents,
      opacity: Number.parseFloat(getComputedStyle(node).opacity),
      position: getComputedStyle(node).position,
      courtVisible: court?.getBoundingClientRect().width > 0,
      ballVisible: ball?.getBoundingClientRect().width > 0,
    };
  });
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

test("Phase 4A Player Home keeps signature court geometry inside the Showstopper performance hierarchy", async ({ page }) => {
  await enterDemo(page, "Player");
  const command = page.getByTestId("player-daily-command-center");
  const field = page.getByTestId("player-home-signature-field");
  await expect(command).toBeVisible({ timeout: 20_000 });
  await expect(field).toBeVisible();
  await expect(field).toHaveAttribute("data-shotlab-signature", "court");
  expect(await field.evaluate((node) => node.parentElement?.getAttribute("data-testid"))).toBe("player-daily-command-center");

  const todayPerformance = page.getByTestId("player-today-performance");
  const interpretation = page.getByTestId("player-target-interpretation");
  const evidence = page.getByTestId("player-command-evidence");
  const primaryAction = page.getByTestId("player-daily-primary-action");
  await expect(todayPerformance).toBeVisible();
  await expect(interpretation).toBeVisible();
  await expect(evidence).toBeVisible();
  await expect(primaryAction).toBeVisible();
  await expect(primaryAction).toHaveCount(1);

  const hierarchy = await page.evaluate(() => {
    const performance = document.querySelector('[data-testid="player-today-performance"]');
    const interpretationNode = document.querySelector('[data-testid="player-target-interpretation"]');
    const evidenceNode = document.querySelector('[data-testid="player-command-evidence"]');
    if (!performance || !interpretationNode || !evidenceNode) throw new Error("Missing Showstopper hierarchy targets");
    const performanceRect = performance.getBoundingClientRect();
    const interpretationRect = interpretationNode.getBoundingClientRect();
    const evidenceRect = evidenceNode.getBoundingClientRect();
    return {
      performanceFont: Number.parseFloat(getComputedStyle(performance).fontSize),
      interpretationFont: Number.parseFloat(getComputedStyle(interpretationNode).fontSize),
      performanceTop: performanceRect.top,
      interpretationTop: interpretationRect.top,
      evidenceTop: evidenceRect.top,
    };
  });
  expect(hierarchy.performanceFont).toBeGreaterThan(hierarchy.interpretationFont);
  expect(hierarchy.performanceTop).toBeLessThan(hierarchy.interpretationTop);
  expect(hierarchy.interpretationTop).toBeLessThan(hierarchy.evidenceTop);
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
  const marks = page.getByTestId("player-progress-metrics").locator("[data-performance-kind]");
  await expect(marks).toHaveCount(3);
  for (const mark of await marks.all()) {
    await expect(mark).toBeVisible();
    const box = await mark.boundingBox();
    expect(box).not.toBeNull();
    expect(Math.round(box.width)).toBeGreaterThanOrEqual(38);
    expect(Math.round(box.height)).toBeGreaterThanOrEqual(38);
  }
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
  const workspace = page.getByTestId("player-leaderboards-workspace");
  const title = workspace.getByRole("heading", { level: 1, name: "Leaderboards", exact: true });
  await expect(title).toBeVisible();
  await expect(hub.locator(":scope > header").getByText("LEADERBOARDS", { exact: true })).toBeHidden();
  const treatment = await title.evaluate((node) => ({
    fontSize: Number.parseFloat(getComputedStyle(node).fontSize),
    color: getComputedStyle(node).color,
  }));
  expect(treatment.fontSize).toBeGreaterThanOrEqual(28);
  expect(treatment.color).not.toBe("rgba(0, 0, 0, 0)");
  await expect(page.getByTestId("leaderboard-status-line")).toBeVisible();
  await expectNoOverflow(page);
  await capture(page, "08d-phase4a-player-rankings-signature.png");
});

test("Phase 4A preserves Coach Mission Control's visible team identity and tactical court signature", async ({ page }) => {
  await page.goto("/");
  await enterDemo(page, "Coach");
  const hero = page.getByTestId("coach-primary-objective");
  await expect(hero).toBeVisible({ timeout: 20_000 });

  // Phase 4 intentionally makes the hero identity authoritative and retires
  // the competing duplicate header mark on mobile.
  const headerMark = page.locator(".mcHeaderTeamMark").first();
  if (await headerMark.count()) await expect(headerMark).toBeHidden();

  const heroMark = hero.locator(".mcHeroTeamMark");
  await expect(heroMark).toBeVisible();
  const heroMarkImage = heroMark.locator("img");
  await expect(heroMarkImage).toBeVisible();
  const markState = await heroMark.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const image = node.querySelector("img");
    const heroNode = node.closest('[data-testid="coach-primary-objective"]');
    const heroRect = heroNode?.getBoundingClientRect();
    const identityCopy = heroNode?.querySelector('.mcHeroIdentityCopy')?.getBoundingClientRect();
    const overlapsCopy = Boolean(identityCopy) && rect.left < identityCopy.right && rect.right > identityCopy.left && rect.top < identityCopy.bottom && rect.bottom > identityCopy.top;
    return {
      complete: image?.complete ?? false,
      naturalWidth: image?.naturalWidth ?? 0,
      naturalHeight: image?.naturalHeight ?? 0,
      objectFit: image ? getComputedStyle(image).objectFit : "",
      rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height },
      hero: heroRect ? { left: heroRect.left, top: heroRect.top, right: heroRect.right, bottom: heroRect.bottom } : null,
      overlapsCopy,
    };
  });
  expect(markState.complete).toBe(true);
  expect(markState.naturalWidth).toBeGreaterThan(0);
  expect(markState.naturalHeight).toBeGreaterThan(0);
  expect(markState.objectFit).toBe("contain");
  expect(markState.rect.width).toBeGreaterThanOrEqual(76);
  expect(markState.rect.height).toBeGreaterThanOrEqual(76);
  expect(markState.hero).not.toBeNull();
  expect(markState.rect.left).toBeGreaterThanOrEqual(markState.hero.left - 1);
  expect(markState.rect.right).toBeLessThanOrEqual(markState.hero.right + 1);
  expect(markState.rect.top).toBeGreaterThanOrEqual(markState.hero.top - 1);
  expect(markState.rect.bottom).toBeLessThanOrEqual(markState.hero.bottom + 1);
  expect(markState.overlapsCopy).toBe(false);

  const courtArtwork = hero.locator(".mcCourtArtwork");
  await expect(courtArtwork).toBeVisible();
  const tacticalCourt = courtArtwork.locator("svg").first();
  await expect(tacticalCourt).toBeVisible();
  const geometry = await tacticalCourt.boundingBox();
  expect(geometry).not.toBeNull();
  expect(geometry.width).toBeGreaterThan(180);
  expect(geometry.height).toBeGreaterThan(120);

  const heroTreatment = await hero.evaluate((node) => ({
    backgroundColor: getComputedStyle(node).backgroundColor,
    backgroundImage: getComputedStyle(node).backgroundImage,
    overflow: getComputedStyle(node).overflow,
  }));
  expect(heroTreatment.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(heroTreatment.backgroundColor).not.toBe("rgb(255, 255, 255)");
  expect(["hidden", "clip"]).toContain(heroTreatment.overflow);

  const heroScrim = hero.locator(".mcHeroScrim");
  if (await heroScrim.isVisible().catch(() => false)) {
    expect(await heroScrim.evaluate((node) => getComputedStyle(node).backgroundImage)).toContain("gradient");
  } else {
    expect(heroTreatment.backgroundImage).toContain("gradient");
  }

  await expect(page.getByTestId("player-home-signature-field")).toHaveCount(0);
  await expect(page.getByTestId("player-progress-signature-field")).toHaveCount(0);
  await expectNoOverflow(page);
  await capture(page, "08e-phase4a-coach-existing-signature.png");
});
