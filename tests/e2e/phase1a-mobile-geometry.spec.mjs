import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { withParityBranding } from "./parity-branding-fixture.mjs";
import { enterSeededRegisteredCoach, enterSeededRegisteredPlayer } from "./registered-coach-fixture.mjs";
import {
  MOBILE_GEOMETRY_WIDTHS,
  assertMobileGeometry,
  collectMobileGeometry,
  expectMobileGeometry,
} from "./support/mobile-geometry-contract.mjs";

const TEAM_ID = "team-phase1a-mobile-geometry";
const COACH = { id: "a1111111-1111-4111-8111-111111111111", email: "phase1a.coach@shotlab.test", name: "Phase 1A Coach", role: "coach", isCoach: true };
const PLAYER = { id: "a2222222-2222-4222-8222-222222222222", email: "phase1a.player@shotlab.test", name: "Phase 1A Player", role: "player", isCoach: false };
const ARTIFACT_ROOT = path.resolve("artifacts/phase1a/geometry");

const CONTRACTS = {
  auth: {
    targets: {
      workspace: '[data-testid="auth-workspace"]',
      routeShell: '[data-testid="auth-workspace"] > .fade-up',
      contentRail: '[data-testid="auth-workspace"] > .fade-up',
      titleStage: '[data-testid="auth-workspace"] > .fade-up > section',
      primaryRegion: '[data-testid="auth-workspace"] .auth-card-enter',
    },
    centered: ["routeShell", "titleStage", "primaryRegion"],
  },
  coachHome: {
    targets: {
      workspace: ".performance-workspace--coach",
      routeShell: '[data-testid="coach-command-center-full"]',
      contentRail: '[data-testid="coach-command-center-full"] .missionControl',
      titleStage: '[data-team-identity-stage="coach-mission-control"]',
      primaryRegion: '[data-testid="coach-primary-objective"]',
    },
    centered: ["routeShell", "contentRail", "titleStage"],
  },
  coachPlayers: {
    targets: {
      workspace: ".performance-workspace--coach",
      routeShell: '[data-testid="coach-players-interactive-dashboard"]',
      contentRail: '[data-testid="coach-players-interactive-dashboard"]',
      titleStage: '[data-testid="coach-players-command-bar"]',
      // The accepted Players presentation intentionally hides its separate
      // decision brief; the title stage owns the visible status and actions.
      primaryRegion: '[data-testid="coach-players-command-bar"]',
    },
    centered: ["routeShell", "titleStage", "primaryRegion"],
    localScrollSelectors: ['[data-testid="coach-players-filter-rail"] > [role="group"]'],
  },
  coachEvents: {
    targets: {
      workspace: ".performance-workspace--coach",
      routeShell: '[data-testid="coach-events-interactive-dashboard"]',
      contentRail: '[data-testid="coach-events-interactive-dashboard"]',
      titleStage: '[data-testid="coach-events-command-bar"]',
      primaryRegion: '[data-testid="coach-events-decision-brief"]',
    },
    centered: ["routeShell", "titleStage", "primaryRegion"],
  },
  playerHome: {
    targets: {
      workspace: ".player-scroll-container",
      routeShell: '[data-testid="player-daily-command-center"]',
      contentRail: '[data-testid="player-daily-command-center"]',
      titleStage: '[data-testid="player-daily-command-center"] [data-command-role="primary"]',
      primaryRegion: '[data-testid="player-daily-command-center"] [data-layout-role="primary-decision"]',
    },
    centered: ["routeShell", "titleStage", "primaryRegion"],
  },
  playerProgress: {
    targets: {
      workspace: ".player-scroll-container",
      routeShell: '[data-testid="player-profile-workspace"]',
      contentRail: '[data-testid="player-progress-story"]',
      titleStage: '[data-testid="player-progress-team-title"]',
      primaryRegion: '[data-testid="player-progress-story-hero"]',
    },
    centered: ["routeShell", "contentRail", "titleStage"],
  },
};

function heightLabel(viewport) {
  return `${viewport.width}x${viewport.height}`;
}

function registeredStorage(role) {
  const team = withParityBranding({
    id: TEAM_ID,
    name: "Phase 1A Geometry Team",
    ownerCoachId: COACH.email,
    joinCode: "GEO1A",
    createdAt: 1_780_000_000_000,
  });
  return {
    team,
    storage: {
      "sl:teams": [team],
      "sl:players": role === "coach" ? [{ ...COACH, teamId: TEAM_ID, hideFromLeaderboards: true }] : [
        { ...COACH, teamId: TEAM_ID, hideFromLeaderboards: true },
        { ...PLAYER, teamId: TEAM_ID, hideFromLeaderboards: false },
      ],
      "sl:player-profiles": role === "player" ? [{ id: "phase1a-player-profile", userId: PLAYER.email, teamId: TEAM_ID, firstName: "Phase", lastName: "Player", jerseyNumber: "11" }] : [],
      "sl:scores": [],
      "sl:program-scores": [],
      "sl:shotlogs": [],
      "sl:events": [],
      "sl:rsvps": [],
      "sl:sc-sessions": [],
      "sl:sc-rsvps": [],
      "sl:sc-logs": [],
      "sl:challenges": [],
      "sl:season-archives": [],
      "sl:team-stores": [],
    },
  };
}

async function installSafeRoutes(target) {
  await target.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await target.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await target.route("**/v1/coach/players/provision**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: [] }) }));
  await target.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function createContext(browser, viewport) {
  return browser.newContext({ viewport, screen: viewport, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
}

async function enterDemo(browser, role, viewport) {
  const context = await createContext(browser, viewport);
  await installSafeRoutes(context);
  const page = await context.newPage();
  await page.goto("/?demo=1");
  await page.getByRole("button", { name: role === "coach" ? "Coach demo" : "Player demo", exact: true }).click();
  await expect(page.getByTestId(role === "coach" ? "coach-command-center-full" : "player-daily-command-center")).toBeVisible({ timeout: 20_000 });
  return { context, page };
}

async function enterRegistered(browser, role, viewport) {
  const context = await createContext(browser, viewport);
  await installSafeRoutes(context);
  const page = await context.newPage();
  const seed = registeredStorage(role);
  if (role === "coach") {
    await enterSeededRegisteredCoach(page, { storage: seed.storage, coachEmail: COACH.email, coachName: COACH.name, teamId: TEAM_ID, team: seed.team });
  } else {
    await enterSeededRegisteredPlayer(page, { storage: seed.storage, playerEmail: PLAYER.email, playerName: PLAYER.name, teamId: TEAM_ID, team: seed.team, readyTestId: "player-daily-command-center" });
  }
  return { context, page };
}

async function navigate(page, key, readyTestId, browserName = "chromium") {
  const direct = page.getByTestId("mobile-navigation-dock").locator(`[data-nav-key="${key}"]`);
  if (await direct.count()) {
    // A synthetic horizontal drag can leave Playwright WebKit waiting for
    // pointer actionability even though the fixed dock is visible. Force only
    // this post-gesture transition; the real React handler still executes.
    await direct.click({ force: browserName === "webkit" });
  } else {
    await page.getByTestId("mobile-navigation-more").click();
    const sheet = page.getByTestId("mobile-navigation-sheet");
    await expect(sheet).toBeVisible();
    await sheet.locator(`[data-nav-key="${key}"]`).click();
  }
  await expect(page.getByTestId(readyTestId)).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => document.fonts?.ready);
}

function writeEvidence(label, evidence) {
  fs.mkdirSync(ARTIFACT_ROOT, { recursive: true });
  fs.writeFileSync(path.join(ARTIFACT_ROOT, `${label}.json`), JSON.stringify(evidence, null, 2));
}

async function certify(page, contract, label, browserName) {
  await page.evaluate(() => document.fonts?.ready);
  const evidence = await assertMobileGeometry(page, contract, { label, browserName });
  writeEvidence(label.replace(/[^a-z0-9-]+/gi, "-").toLowerCase(), evidence);
}

for (const viewport of MOBILE_GEOMETRY_WIDTHS) {
  test(`authentication sign-in and registration geometry at ${viewport.width}px`, async ({ browser }, testInfo) => {
    const context = await createContext(browser, viewport);
    const page = await context.newPage();
    try {
      await page.goto("/");
      await expect(page.getByTestId("auth-workspace")).toBeVisible({ timeout: 20_000 });
      await certify(page, CONTRACTS.auth, `auth-sign-in-${heightLabel(viewport)}-${testInfo.project.name}`, testInfo.project.name.includes("webkit") ? "webkit" : "chromium");
      await page.getByRole("tab", { name: "Create account", exact: true }).click();
      await certify(page, CONTRACTS.auth, `auth-registration-${heightLabel(viewport)}-${testInfo.project.name}`, testInfo.project.name.includes("webkit") ? "webkit" : "chromium");
    } finally {
      await context.close();
    }
  });

  for (const mode of ["demo", "registered"]) {
    test(`${mode} Coach geometry across primary routes at ${viewport.width}px`, async ({ browser }, testInfo) => {
      const session = mode === "demo" ? await enterDemo(browser, "coach", viewport) : await enterRegistered(browser, "coach", viewport);
      const browserName = testInfo.project.name.includes("webkit") ? "webkit" : "chromium";
      try {
        await certify(session.page, CONTRACTS.coachHome, `${mode}-coach-home-${heightLabel(viewport)}-${testInfo.project.name}`, browserName);
        await navigate(session.page, "players", "coach-players-interactive-dashboard", browserName);
        await certify(session.page, CONTRACTS.coachPlayers, `${mode}-coach-players-${heightLabel(viewport)}-${testInfo.project.name}`, browserName);
        await navigate(session.page, "events", "coach-events-interactive-dashboard", browserName);
        await certify(session.page, CONTRACTS.coachEvents, `${mode}-coach-events-${heightLabel(viewport)}-${testInfo.project.name}`, browserName);
      } finally {
        await session.context.close();
      }
    });

    test(`${mode} Player geometry across Home and Progress at ${viewport.width}px`, async ({ browser }, testInfo) => {
      const session = mode === "demo" ? await enterDemo(browser, "player", viewport) : await enterRegistered(browser, "player", viewport);
      const browserName = testInfo.project.name.includes("webkit") ? "webkit" : "chromium";
      try {
        await certify(session.page, CONTRACTS.playerHome, `${mode}-player-home-${heightLabel(viewport)}-${testInfo.project.name}`, browserName);
        await navigate(session.page, "profile", "player-profile-workspace", browserName);
        await certify(session.page, CONTRACTS.playerProgress, `${mode}-player-progress-${heightLabel(viewport)}-${testInfo.project.name}`, browserName);
      } finally {
        await session.context.close();
      }
    });
  }
}

test("controlled overflow fixture proves the Phase 1A contract fails", async ({ page }) => {
  test.skip(process.env.PHASE1A_ENABLE_NEGATIVE_FIXTURE !== "1", "Run explicitly to prove recurrence detection; disabled in normal certification.");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByTestId("auth-workspace")).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => {
    const fixture = document.createElement("div");
    fixture.dataset.testid = "phase1a-overflow-negative-fixture";
    fixture.setAttribute("aria-hidden", "true");
    Object.assign(fixture.style, { width: "calc(100vw + 48px)", height: "1px", position: "relative" });
    document.body.append(fixture);
  });
  const report = await collectMobileGeometry(page, CONTRACTS.auth);
  expectMobileGeometry(report, "controlled overflow fixture");
});
