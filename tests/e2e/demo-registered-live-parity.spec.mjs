import { test, expect } from "@playwright/test";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { hashLegacyPassword } from "../../functions/v1/legacy-auth/_password.js";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/demo-registered-live-parity");
const SUPABASE_URL = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "");
const PASSWORD = "ShotLab-Live-Parity-2026!";
const RUN_ID = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
const TEAM_ID = crypto.randomUUID();
const COACH_EMAIL = `shotlab-live-parity-coach-${RUN_ID}@example.invalid`;
const PLAYER_EMAIL = `shotlab-live-parity-player-${RUN_ID}@example.invalid`;
const COACH_USER_UUID = emailUuid(COACH_EMAIL);
const REGISTERED_STATES = ["empty", "sparse", "populated"];

const identities = {
  coach: { email: COACH_EMAIL, name: "Demo Coach" },
  player: { email: PLAYER_EMAIL, name: "Demo Player" },
};

const MOTION_FREEZE = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    scroll-behavior: auto !important;
    caret-color: transparent !important;
  }
`;

function emailUuid(email) {
  const hash = crypto.createHash("md5").update(`shotlab-email-user:${String(email).toLowerCase()}`).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

function localDateKey(offsetDays = 0) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

async function rest(table, { method = "GET", query = "", body, prefer = "return=representation" } = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ""}`, {
    method,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: prefer,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(`Supabase ${method} ${table} failed (${response.status}): ${text.slice(0, 500)}`);
  return payload;
}

async function safeDelete(table, query) {
  await rest(table, { method: "DELETE", query, prefer: "return=minimal" }).catch(() => null);
}

async function clearTeamData() {
  const teamQuery = `team_id=eq.${encodeURIComponent(TEAM_ID)}`;
  for (const table of [
    "sc_logs",
    "sc_rsvps",
    "sc_sessions",
    "program_scores",
    "shot_logs",
    "scores",
    "rsvps",
    "events",
    "coach_player_invitations",
    "player_profiles",
    "team_priorities",
    "team_memberships",
    "team_invites",
    "players",
  ]) {
    await safeDelete(table, teamQuery);
  }
}

async function cleanupFixture() {
  for (const email of [COACH_EMAIL, PLAYER_EMAIL]) {
    await safeDelete("legacy_auth_sessions", `user_email=eq.${encodeURIComponent(email)}`);
  }
  await clearTeamData();
  for (const email of [COACH_EMAIL, PLAYER_EMAIL]) {
    await safeDelete("legacy_auth_profiles", `email=eq.${encodeURIComponent(email)}`);
  }
  await safeDelete("teams", `id=eq.${encodeURIComponent(TEAM_ID)}`);
}

async function authRow(email, name, role) {
  const salt = crypto.randomBytes(16).toString("hex");
  return {
    email,
    password_hash: await hashLegacyPassword(PASSWORD, salt),
    password_salt: salt,
    name,
    role,
    team_id: TEAM_ID,
    hide_from_leaderboards: false,
  };
}

function coreRoster(now = Date.now()) {
  return [
    { id: `live-coach-${RUN_ID}`, email: COACH_EMAIL, name: "Demo Coach", role: "coach", team_id: TEAM_ID, hide_from_leaderboards: true, created_at: now },
    { id: `live-player-${RUN_ID}`, email: PLAYER_EMAIL, name: "Demo Player", role: "player", team_id: TEAM_ID, hide_from_leaderboards: false, created_at: now + 1 },
  ];
}

function extraRoster(now = Date.now()) {
  return [
    { id: `live-roster-a-${RUN_ID}`, email: `live-roster-a-${RUN_ID}@example.invalid`, name: "Ava Brooks", role: "player", team_id: TEAM_ID, hide_from_leaderboards: false, created_at: now + 2 },
    { id: `live-roster-b-${RUN_ID}`, email: `live-roster-b-${RUN_ID}@example.invalid`, name: "Jordan Lee", role: "player", team_id: TEAM_ID, hide_from_leaderboards: false, created_at: now + 3 },
    { id: `live-roster-c-${RUN_ID}`, email: `live-roster-c-${RUN_ID}@example.invalid`, name: "Micah Santos", role: "player", team_id: TEAM_ID, hide_from_leaderboards: false, created_at: now + 4 },
  ];
}

async function seedPrimaryProfile(now = Date.now()) {
  await rest("player_profiles", {
    method: "POST",
    body: {
      id: `pp-live-${RUN_ID}`,
      user_id: PLAYER_EMAIL,
      team_id: TEAM_ID,
      first_name: "Demo",
      last_name: "Player",
      jersey_number: "12",
      invited_email: PLAYER_EMAIL,
      invite_status: "claimed",
      invite_claimed_at: new Date().toISOString(),
      created_at: now,
    },
  }).catch(() => null);
}

async function applyRegisteredState(state) {
  if (!REGISTERED_STATES.includes(state)) throw new Error(`Unknown registered state: ${state}`);
  await clearTeamData();
  const now = Date.now();
  const extras = extraRoster(now);
  const roster = state === "empty"
    ? coreRoster(now)
    : state === "sparse"
      ? [...coreRoster(now), extras[0]]
      : [...coreRoster(now), ...extras];
  await rest("players", { method: "POST", body: roster });
  await seedPrimaryProfile(now);

  if (state === "empty") return;

  const events = [
    {
      id: `live-event-practice-${RUN_ID}`,
      team_id: TEAM_ID,
      title: "Team Practice",
      date: localDateKey(1),
      time: "6:00 PM",
      location: "Main Gym",
      description: "Team shooting standards and controlled five-on-five.",
      type: "practice",
    },
  ];
  if (state === "populated") {
    events.push({
      id: `live-event-skill-${RUN_ID}`,
      team_id: TEAM_ID,
      title: "Skill Lab: Rim Pressure",
      date: localDateKey(3),
      time: "6:15 PM",
      location: "Main Gym Court 2",
      description: "Paint touch creation, contact finishes, and late-clock reads.",
      type: "workout",
    });
  }
  await rest("events", { method: "POST", body: events });

  const scoreRows = [
    {
      id: `live-score-primary-${RUN_ID}`,
      email: PLAYER_EMAIL,
      name: "Demo Player",
      player_id: PLAYER_EMAIL,
      team_id: TEAM_ID,
      drill_id: "live-parity-home-shooting",
      score: state === "sparse" ? 8 : 12,
      date: localDateKey(0),
      ts: now,
      src: "home",
    },
  ];
  if (state === "populated") {
    scoreRows.push({
      id: `live-score-ava-${RUN_ID}`,
      email: extras[0].email,
      name: extras[0].name,
      player_id: extras[0].email,
      team_id: TEAM_ID,
      drill_id: "live-parity-home-shooting",
      score: 14,
      date: localDateKey(0),
      ts: now + 1,
      src: "home",
    });
  }
  await rest("scores", { method: "POST", body: scoreRows });

  const shotLogRows = [{
    id: `live-shotlog-primary-${RUN_ID}`,
    email: PLAYER_EMAIL,
    name: "Demo Player",
    player_id: PLAYER_EMAIL,
    team_id: TEAM_ID,
    made: state === "sparse" ? 45 : 125,
    date: localDateKey(0),
    ts: new Date(now + 2).toISOString(),
  }];
  if (state === "populated") {
    shotLogRows.push({
      id: `live-shotlog-ava-${RUN_ID}`,
      email: extras[0].email,
      name: extras[0].name,
      player_id: extras[0].email,
      team_id: TEAM_ID,
      made: 110,
      date: localDateKey(0),
      ts: new Date(now + 3).toISOString(),
    });
  }
  await rest("shot_logs", { method: "POST", body: shotLogRows });

  if (state !== "populated") return;

  await rest("program_scores", {
    method: "POST",
    body: [
      {
        id: `live-program-primary-${RUN_ID}`,
        team_id: TEAM_ID,
        player_id: PLAYER_EMAIL,
        player_email: PLAYER_EMAIL,
        player_name: "Demo Player",
        drill_id: "live-parity-program-230s",
        drill_name: "2:30 Shooting",
        score: 31,
        session_date: localDateKey(-2),
        logged_at: new Date(now - 2 * 86400000).toISOString(),
        recorded_by: COACH_EMAIL,
        recorded_by_role: "coach",
        src: "program",
      },
      {
        id: `live-program-ava-${RUN_ID}`,
        team_id: TEAM_ID,
        player_id: extras[0].email,
        player_email: extras[0].email,
        player_name: extras[0].name,
        drill_id: "live-parity-program-230s",
        drill_name: "2:30 Shooting",
        score: 34,
        session_date: localDateKey(-3),
        logged_at: new Date(now - 3 * 86400000).toISOString(),
        recorded_by: COACH_EMAIL,
        recorded_by_role: "coach",
        src: "program",
      },
    ],
  });

  const scSessionId = `live-sc-power-${RUN_ID}`;
  await rest("sc_sessions", {
    method: "POST",
    body: [
      {
        id: scSessionId,
        team_id: TEAM_ID,
        sport: "Strength",
        date: localDateKey(2),
        time: "6:15 AM",
        location: "Weight Room",
        session_type: "Program",
        owner_coach_id: COACH_EMAIL,
      },
      {
        id: `live-sc-speed-${RUN_ID}`,
        team_id: TEAM_ID,
        sport: "Performance",
        date: localDateKey(6),
        time: "7:00 AM",
        location: "Turf",
        session_type: "Program",
        owner_coach_id: COACH_EMAIL,
      },
    ],
  });
  await rest("sc_logs", {
    method: "POST",
    body: [{
      id: `live-sclog-primary-${RUN_ID}`,
      team_id: TEAM_ID,
      session_id: scSessionId,
      email: PLAYER_EMAIL,
      player_id: PLAYER_EMAIL,
      name: "Demo Player",
      date: localDateKey(-3),
      time: "6:30 AM",
      place: "Performance Center",
      sport: "Recovery",
      ts: now - 3 * 86400000,
    }],
  });
}

async function seedFixture() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) throw new Error("Live parity requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  await cleanupFixture();
  await rest("teams", {
    method: "POST",
    body: {
      id: TEAM_ID,
      name: "Demo Titans",
      coach_user_id: COACH_USER_UUID,
      owner_coach_id: COACH_EMAIL,
      join_code: `LP${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
      school: "ShotLab Academy",
      level: "Varsity",
    },
  });
  await rest("legacy_auth_profiles", {
    method: "POST",
    body: [
      await authRow(COACH_EMAIL, "Demo Coach", "coach"),
      await authRow(PLAYER_EMAIL, "Demo Player", "player"),
    ],
  });
  await applyRegisteredState("empty");
}

async function settle(page) {
  await page.addStyleTag({ content: MOTION_FREEZE });
  await page.evaluate(async () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo(0, 0);
    document.querySelector(".player-scroll-container")?.scrollTo(0, 0);
    document.querySelector(".coach-scroll-container")?.scrollTo(0, 0);
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function enterDemo(page, role) {
  await page.goto("/?demo=1");
  const button = page.getByRole("button", { name: role === "coach" ? "Coach demo" : "Player demo", exact: true });
  await expect(button).toBeVisible({ timeout: 20_000 });
  await button.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await settle(page);
}

async function enterRegistered(page, role) {
  await page.goto("/");
  await expect(page.getByRole("tab", { name: /^sign in$/i })).toBeVisible({ timeout: 20_000 });
  await page.locator('input[type="email"]').fill(identities[role].email);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).last().click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await settle(page);
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem("sl:demoMode"))).not.toBe("true");
}

async function getNavigationKeys(page) {
  const primary = await page.getByTestId("mobile-navigation-dock").locator("[data-nav-key]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-nav-key")).filter(Boolean));
  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  const secondary = await sheet.locator("[data-nav-key]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-nav-key")).filter(Boolean));
  await sheet.getByRole("button", { name: /close more navigation/i }).click();
  return [...new Set([...primary, ...secondary])].filter((key) => key !== "branding");
}

async function navigateToKey(page, key) {
  const dock = page.getByTestId("mobile-navigation-dock");
  const direct = dock.locator(`[data-nav-key="${key}"]`);
  if (await direct.count()) await direct.click();
  else {
    await page.getByTestId("mobile-navigation-more").click();
    const sheet = page.getByTestId("mobile-navigation-sheet");
    await expect(sheet).toBeVisible();
    const target = sheet.locator(`[data-nav-key="${key}"]`);
    await expect(target).toBeVisible();
    await target.click();
  }
  await settle(page);
}

async function assertRegisteredStateHydrated(page, role, state, navKeys) {
  if (state === "empty") return;

  const expectVisibleOn = async (key, pattern, label) => {
    expect(navKeys, `${role}/${state} must expose ${key}`).toContain(key);
    await navigateToKey(page, key);
    await expect.poll(
      () => page.locator("body").innerText(),
      {
        timeout: 25_000,
        message: `${role}/${state} must visibly hydrate ${label} from the real registered persistence path`,
      },
    ).toMatch(pattern);
  };

  if (role === "coach") {
    await expectVisibleOn("events", /Team Practice/i, "the seeded team event");
    if (state === "populated") {
      await expectVisibleOn("players", /Micah Santos/i, "the populated roster");
      await expectVisibleOn("sc", /Weight Room|Turf/i, "the persisted S&C venue");
    }
    return;
  }

  await expectVisibleOn("program", /Team Practice/i, "the seeded team commitment");
  if (state === "populated") {
    await expectVisibleOn("sc", /Weight Room|Turf/i, "the persisted S&C venue");
    await expectVisibleOn("leaderboards", /THIS WEEK[\s\S]*125/i, "the player-scoped populated competitive data");
  }
}

async function presentationContract(page, role) {
  return page.evaluate((activeRole) => {
    const read = (node) => {
      if (!node) return null;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return {
        display: style.display,
        position: style.position,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        borderRadius: style.borderRadius,
        borderTopWidth: style.borderTopWidth,
        borderBottomWidth: style.borderBottomWidth,
        paddingLeft: style.paddingLeft,
        paddingRight: style.paddingRight,
        width: Math.round(rect.width),
      };
    };
    const dock = document.querySelector('[data-testid="mobile-navigation-dock"]');
    const scroll = document.querySelector(activeRole === "coach" ? ".coach-scroll-container" : ".player-scroll-container") || document.querySelector("main");
    const current = dock?.querySelector('[aria-current="page"]') || dock?.querySelector("[data-active=true]");
    return {
      viewportWidth: window.innerWidth,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      body: read(document.body),
      scroll: read(scroll),
      dock: read(dock),
      currentNav: read(current),
    };
  }, role);
}

async function captureRole(browser, role, kind) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  if (kind === "demo") await enterDemo(page, role);
  else await enterRegistered(page, role);

  const navKeys = await getNavigationKeys(page);
  if (kind.startsWith("registered-")) {
    await assertRegisteredStateHydrated(page, role, kind.slice("registered-".length), navKeys);
  }

  const contracts = {};
  for (const key of navKeys) {
    await navigateToKey(page, key);
    contracts[key] = await presentationContract(page, role);
    expect(contracts[key].overflow, `${role}/${kind}/${key} must not overflow horizontally`).toBeLessThanOrEqual(1);
    const dir = path.join(OUTPUT_DIR, role, kind);
    fs.mkdirSync(dir, { recursive: true });
    await page.screenshot({ path: path.join(dir, `${key}.png`), fullPage: true, animations: "disabled" });
    if (key === "team-store" && await page.getByRole("button", { name: "Close team store", exact: true }).count()) {
      await page.getByRole("button", { name: "Close team store", exact: true }).click();
    }
  }
  expect(errors, `${role} ${kind} must not throw uncaught page errors`).toEqual([]);
  await context.close();
  return { navKeys, contracts };
}

function stableContract(contract) {
  return {
    viewportWidth: contract.viewportWidth,
    body: contract.body,
    scroll: contract.scroll,
    dock: contract.dock,
    currentNav: contract.currentNav,
  };
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  await seedFixture();
});

test.afterAll(async () => {
  await cleanupFixture();
});

for (const role of ["coach", "player"]) {
  test(`${role} demo shares the production presentation system with genuine registered states`, async ({ browser }) => {
    const demo = await captureRole(browser, role, "demo");
    expect(demo.navKeys.length).toBeGreaterThanOrEqual(5);

    for (const state of REGISTERED_STATES) {
      await applyRegisteredState(state);
      const kind = `registered-${state}`;
      const registered = await captureRole(browser, role, kind);
      expect(registered.navKeys, `${role}/${state} must expose the same production navigation as demo`).toEqual(demo.navKeys);
      for (const key of demo.navKeys) {
        expect(
          stableContract(registered.contracts[key]),
          `${role}/${state}/${key} production shell must not change by account type or data density`,
        ).toEqual(stableContract(demo.contracts[key]));
      }
    }
  });
}
