import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/dashboard-showstopper-phase-1");
const DEMO_EMAIL = "demo@shotlab.app";
const DEMO_TEAM_ID = "team-demo-titans";
const DEMO_COACH_EMAIL = "coach.demo@shotlab.app";

async function installRoutes(page) {
  await page.route("**/v1/season-archives", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) });
  });
  await page.route("**/v1/legacy-auth/restore", async (route) => {
    const payload = route.request().postDataJSON?.() || {};
    const email = String(payload?.email || "").trim().toLowerCase();
    if (email !== DEMO_EMAIL) {
      await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "profile_not_found" }) });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        profile: {
          email: DEMO_EMAIL,
          name: "Demo Player",
          role: "player",
          team_id: DEMO_TEAM_ID,
          hide_from_leaderboards: false,
        },
      }),
    });
  });
  await page.route("**/v1/teams/restore-context", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        team: {
          id: DEMO_TEAM_ID,
          name: "ShotLab Team",
          ownerCoachId: DEMO_COACH_EMAIL,
          joinCode: "SHOTLAB",
          createdAt: Date.now() - 86400000,
        },
      }),
    });
  });
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
}

async function settleHome(page, { expectDock = (page.viewportSize()?.width || 390) <= 700 } = {}) {
  await expect(page.getByTestId("player-daily-command-center")).toBeVisible({ timeout: 20_000 });
  if (expectDock) await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    window.scrollTo(0, 0);
    document.querySelector(".player-scroll-container")?.scrollTo(0, 0);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function enterPlayerDemo(page) {
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.reload();
  const button = page.getByRole("button", { name: "Player demo", exact: true });
  await expect(button).toBeVisible({ timeout: 20_000 });
  await button.click();
  await settleHome(page);
}

async function applyDemoPerformanceState(page, { makes, coachCurrent = false, weeklyTarget } = {}) {
  await page.evaluate(({ makes, coachCurrent, weeklyTarget, demoEmail, demoTeamId }) => {
    const date = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    const dateKey = (value) => `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
    const today = dateKey(date);
    const existingLogs = JSON.parse(window.localStorage.getItem("sl:shotlogs") || "[]");
    const otherPlayers = existingLogs.filter((row) => String(row?.email || row?.player_email || "").toLowerCase() !== demoEmail);
    const nextLogs = [...otherPlayers];
    if (Number(makes) > 0) {
      nextLogs.push({
        id: `dashboard-showstopper-state-${makes}`,
        email: demoEmail,
        playerId: demoEmail,
        teamId: demoTeamId,
        name: "Demo Player",
        made: Number(makes),
        date: today,
        ts: Date.now(),
      });
    } else {
      const prior = new Date(date);
      prior.setDate(prior.getDate() - 8);
      nextLogs.push({
        id: "dashboard-showstopper-prior-result",
        email: demoEmail,
        playerId: demoEmail,
        teamId: demoTeamId,
        name: "Demo Player",
        made: 20,
        date: dateKey(prior),
        ts: prior.getTime(),
      });
    }
    window.localStorage.setItem("sl:shotlogs", JSON.stringify(nextLogs));

    const meta = JSON.parse(window.localStorage.getItem("sl:demo-data-meta") || "{}");
    window.localStorage.setItem("sl:demo-data-meta", JSON.stringify({ ...meta, source: "dashboard-showstopper-certification", teamId: demoTeamId }));

    const priorities = JSON.parse(window.localStorage.getItem("sl:coach-priorities") || "{}");
    const current = priorities[demoTeamId] || {};
    priorities[demoTeamId] = {
      ...current,
      ...(weeklyTarget === undefined ? {} : { weeklyMakesTarget: weeklyTarget }),
      ...(coachCurrent ? {
        todayFocusText: "Create paint pressure, then own the next game-speed block.",
        priorityDrillText: "2:30 Shooting",
        challengeText: "Complete 2:30 Shooting with game-speed footwork.",
        updatedAt: new Date().toISOString(),
      } : {}),
    };
    window.localStorage.setItem("sl:coach-priorities", JSON.stringify(priorities));
  }, { makes, coachCurrent, weeklyTarget, demoEmail: DEMO_EMAIL, demoTeamId: DEMO_TEAM_ID });

  await page.goto("/?demo=1");
  await settleHome(page);
}

async function capture(page, name) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  await page.screenshot({ path: path.join(OUTPUT_DIR, `${name}.png`), fullPage: true, animations: "disabled" });
}

async function certifyViewport(page, width, height, name) {
  await page.setViewportSize({ width, height });
  await enterPlayerDemo(page);
  const hero = page.getByTestId("player-daily-command-center");
  const action = page.getByTestId("player-daily-primary-action");
  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(hero).toBeVisible();
  await expect(action).toBeVisible();
  await expect(dock).toBeVisible();

  const layout = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    action: (() => {
      const rect = document.querySelector('[data-testid="player-daily-primary-action"]')?.getBoundingClientRect();
      return rect ? { width: rect.width, height: rect.height, bottom: rect.bottom } : null;
    })(),
    dock: (() => {
      const rect = document.querySelector('[data-testid="mobile-navigation-dock"]')?.getBoundingClientRect();
      return rect ? { top: rect.top, bottom: rect.bottom } : null;
    })(),
  }));
  expect(layout.overflow).toBeLessThanOrEqual(1);
  expect(layout.action).not.toBeNull();
  expect(layout.action.height).toBeGreaterThanOrEqual(44);
  expect(layout.dock).not.toBeNull();

  await capture(page, name);
}

test.beforeEach(async ({ page }) => {
  await installRoutes(page);
});

test("Player Home is stable at 375, 390, and 430 widths", async ({ page }) => {
  await certifyViewport(page, 375, 844, "player-home-375");
  await certifyViewport(page, 390, 844, "player-home-390");
  await certifyViewport(page, 430, 932, "player-home-430");
});

test("390px visual evidence covers zero, partial, near, complete, above-target, and coach-assignment states", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await enterPlayerDemo(page);

  const states = [
    { makes: 0, interpretation: "100 TO TARGET", heading: "Today starts here.", name: "player-home-state-zero-390" },
    { makes: 25, interpretation: "75 TO TARGET", heading: "Stay on today’s standard.", name: "player-home-state-partial-25-390" },
    { makes: 85, interpretation: "15 TO TARGET", heading: "Stay on today’s standard.", name: "player-home-state-near-85-390" },
    { makes: 100, interpretation: "TARGET COMPLETE", heading: "Daily work banked.", name: "player-home-state-complete-100-390" },
    { makes: 125, interpretation: "+25 ABOVE TARGET", heading: "Daily work banked.", name: "player-home-state-above-125-390" },
  ];

  for (const state of states) {
    await applyDemoPerformanceState(page, { makes: state.makes });
    await expect(page.getByTestId("player-today-performance")).toContainText(String(state.makes));
    await expect(page.getByTestId("player-target-interpretation")).toHaveText(state.interpretation);
    await expect(page.getByTestId("player-daily-command-center").getByRole("heading", { level: 1 })).toHaveText(state.heading);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    await capture(page, state.name);
  }

  await applyDemoPerformanceState(page, { makes: 25, coachCurrent: true });
  await expect(page.getByTestId("player-coach-priority-signal")).toContainText("Create paint pressure, then own the next game-speed block.");
  await capture(page, "player-home-state-coach-assignment-390");
});

test("375px athlete credential survives long player and team names without clipping or overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await enterPlayerDemo(page);
  const contract = await page.getByTestId("player-dashboard-identity-header").evaluate((node) => {
    const name = node.querySelector('[data-identity-role="name"]');
    const team = node.querySelector('[data-identity-role="team-name"]');
    if (name) name.textContent = "Alexandria Montgomery-Washington";
    if (team) team.textContent = "Webster Thomas Elite Player Development Program";
    const headerRect = node.getBoundingClientRect();
    const inspect = (element) => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        text: element.textContent,
        display: style.display,
        visibility: style.visibility,
        rect: { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height },
      };
    };
    return {
      documentOverflow: document.documentElement.scrollWidth - window.innerWidth,
      headerRect: { top: headerRect.top, right: headerRect.right, bottom: headerRect.bottom, left: headerRect.left },
      name: inspect(name),
      team: inspect(team),
    };
  });

  expect(contract.documentOverflow).toBeLessThanOrEqual(1);
  for (const [label, item] of [["player name", contract.name], ["team name", contract.team]]) {
    expect(item, `${label} must exist`).not.toBeNull();
    expect(item.display, `${label} must not be hidden`).not.toBe("none");
    expect(item.visibility, `${label} must be visible`).not.toBe("hidden");
    expect(item.rect.left, `${label} must stay inside the credential`).toBeGreaterThanOrEqual(contract.headerRect.left - 1);
    expect(item.rect.right, `${label} must stay inside the credential`).toBeLessThanOrEqual(contract.headerRect.right + 1);
    expect(item.rect.top, `${label} must stay inside the credential`).toBeGreaterThanOrEqual(contract.headerRect.top - 1);
    expect(item.rect.bottom, `${label} must not be vertically clipped`).toBeLessThanOrEqual(contract.headerRect.bottom + 1);
  }
  await capture(page, "player-home-375-long-identity");
});

test("Player Home keeps one dominant action, readable light chapter, and bottom-nav clearance", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterPlayerDemo(page);
  await expect(page.getByTestId("player-daily-primary-action")).toHaveCount(1);

  const progress = page.getByTestId("player-progress-disclosure");
  if (!(await progress.evaluate((node) => node.open))) await progress.locator("summary").click();
  const signal = page.getByTestId("player-daily-momentum-signal");
  await expect(signal).toBeVisible();
  const signalText = [
    signal.getByText("Momentum", { exact: true }),
    signal.getByText("Daily target complete", { exact: true }),
  ];
  const contrastContract = [];
  for (const locator of signalText) {
    await expect(locator).toBeVisible();
    contrastContract.push(await locator.evaluate((element) => ({ text: element.textContent.trim(), color: getComputedStyle(element).color })));
  }
  for (const item of contrastContract) {
    expect(item.color, `${item.text} must not use the former cream-on-cream foreground`).not.toBe("rgb(245, 242, 234)");
    expect(item.color, `${item.text} must not use the dark-hero foreground on cream`).not.toBe("rgb(245, 248, 249)");
  }

  const dock = page.getByTestId("mobile-navigation-dock");
  const lastSupport = page.getByTestId("player-secondary-intelligence");
  await expect(dock).toBeVisible();
  await expect(lastSupport).toBeVisible();
  await page.evaluate(async () => {
    const nested = document.querySelector(".player-scroll-container");
    const scroller = nested && nested.scrollHeight > nested.clientHeight + 1 ? nested : document.scrollingElement;
    scroller?.scrollTo(0, scroller.scrollHeight);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  const dockBox = await dock.boundingBox();
  const lastBox = await lastSupport.boundingBox();
  expect(dockBox).not.toBeNull();
  expect(lastBox).not.toBeNull();
  expect(lastBox.y + lastBox.height).toBeLessThanOrEqual(dockBox.y - 2);
  await capture(page, "player-home-390-scrolled");
});

test("Player Home retains desktop sanity", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await enterPlayerDemo(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await expect(page.getByTestId("player-daily-command-center")).toBeVisible();
  await expect(page.getByTestId("mobile-navigation-dock")).toHaveCount(0);
  await capture(page, "player-home-desktop-1280");
});
