import { test, expect } from "@playwright/test";
import crypto from "node:crypto";
import { hashLegacyPassword } from "../../functions/v1/legacy-auth/_password.js";

const SUPABASE_URL = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "");
const PASSWORD = "ShotLab-Mobile-Hydration-2026!";
const RUN_ID = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
const TEAM_ID = crypto.randomUUID();
const COACH_EMAIL = `mobile-hydration-coach-${RUN_ID}@example.invalid`;
const PLAYER_EMAIL = `mobile-hydration-player-${RUN_ID}@example.invalid`;
const COACH_USER_UUID = emailUuid(COACH_EMAIL);
const SHOT_MARKER = 125;
const EVENT_MARKER = `Hydration Marker Practice ${RUN_ID}`;
const VENUE_MARKER = `Hydration Weight Room ${RUN_ID}`;

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
  if (!response.ok) throw new Error(`Supabase ${method} ${table} failed (${response.status}): ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : null;
}

async function safeDelete(table, query) {
  await rest(table, { method: "DELETE", query, prefer: "return=minimal" }).catch(() => null);
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

async function cleanupFixture() {
  const teamQuery = `team_id=eq.${encodeURIComponent(TEAM_ID)}`;
  for (const email of [COACH_EMAIL, PLAYER_EMAIL]) {
    await safeDelete("legacy_auth_sessions", `user_email=eq.${encodeURIComponent(email)}`);
  }
  for (const table of [
    "sc_logs",
    "sc_rsvps",
    "sc_sessions",
    "program_scores",
    "shot_logs",
    "scores",
    "rsvps",
    "events",
    "player_profiles",
    "team_priorities",
    "team_memberships",
    "team_invites",
    "players",
  ]) {
    await safeDelete(table, teamQuery);
  }
  for (const email of [COACH_EMAIL, PLAYER_EMAIL]) {
    await safeDelete("legacy_auth_profiles", `email=eq.${encodeURIComponent(email)}`);
  }
  await safeDelete("teams", `id=eq.${encodeURIComponent(TEAM_ID)}`);
}

async function seedFixture() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) throw new Error("Registered mobile hydration requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  await cleanupFixture();
  const now = Date.now();
  await rest("teams", {
    method: "POST",
    body: {
      id: TEAM_ID,
      name: "Hydration Titans",
      coach_user_id: COACH_USER_UUID,
      owner_coach_id: COACH_EMAIL,
      join_code: `MH${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
      school: "ShotLab Academy",
      level: "Varsity",
    },
  });
  await rest("legacy_auth_profiles", {
    method: "POST",
    body: [
      await authRow(COACH_EMAIL, "Hydration Coach", "coach"),
      await authRow(PLAYER_EMAIL, "Hydration Player", "player"),
    ],
  });
  await rest("players", {
    method: "POST",
    body: [
      { id: `hydration-coach-${RUN_ID}`, email: COACH_EMAIL, name: "Hydration Coach", role: "coach", team_id: TEAM_ID, hide_from_leaderboards: true, created_at: now },
      { id: `hydration-player-${RUN_ID}`, email: PLAYER_EMAIL, name: "Hydration Player", role: "player", team_id: TEAM_ID, hide_from_leaderboards: false, created_at: now + 1 },
    ],
  });
  await rest("player_profiles", {
    method: "POST",
    body: {
      id: `hydration-profile-${RUN_ID}`,
      user_id: PLAYER_EMAIL,
      team_id: TEAM_ID,
      first_name: "Hydration",
      last_name: "Player",
      invited_email: PLAYER_EMAIL,
      invite_status: "claimed",
      invite_claimed_at: new Date().toISOString(),
      created_at: now,
    },
  }).catch(() => null);
  await rest("shot_logs", {
    method: "POST",
    body: {
      id: `hydration-shot-${RUN_ID}`,
      email: PLAYER_EMAIL,
      name: "Hydration Player",
      player_id: PLAYER_EMAIL,
      team_id: TEAM_ID,
      made: SHOT_MARKER,
      date: localDateKey(0),
      ts: new Date(now).toISOString(),
    },
  });
  await rest("events", {
    method: "POST",
    body: {
      id: `hydration-event-${RUN_ID}`,
      team_id: TEAM_ID,
      title: EVENT_MARKER,
      date: localDateKey(1),
      time: "6:00 PM",
      location: "Hydration Main Gym",
      description: "Unique registered persistence marker.",
      type: "practice",
    },
  });
  await rest("sc_sessions", {
    method: "POST",
    body: {
      id: `hydration-sc-${RUN_ID}`,
      team_id: TEAM_ID,
      sport: "Strength",
      date: localDateKey(2),
      time: "6:15 AM",
      location: VENUE_MARKER,
      session_type: "Program",
      owner_coach_id: COACH_EMAIL,
    },
  });
}

async function navigateToKey(page, key) {
  const dock = page.getByTestId("mobile-navigation-dock");
  const direct = dock.locator(`[data-nav-key="${key}"]`);
  if (await direct.count()) {
    await direct.click();
    return;
  }
  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  const target = sheet.locator(`[data-nav-key="${key}"]`);
  await expect(target).toBeVisible();
  await target.click();
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  await seedFixture();
});

test.afterAll(async () => {
  await cleanupFixture();
});

test("registered Player mobile login hydrates real persisted state before presenting the app", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("tab", { name: /^sign in$/i })).toBeVisible({ timeout: 20_000 });
  await page.locator('input[type="email"]').fill(PLAYER_EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).last().click();

  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 35_000 });
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem("sl:demoMode"))).not.toBe("true");

  await navigateToKey(page, "home");
  await expect.poll(
    () => page.locator("body").innerText(),
    { timeout: 30_000, message: "registered Player Home must render the signed backend shot marker instead of the pre-login empty state" },
  ).toMatch(new RegExp(`${SHOT_MARKER}\\/100`));
  await expect(page.locator("body")).not.toContainText("Log your first shooting result");

  const persistedShotLogs = await page.evaluate(() => JSON.parse(window.localStorage.getItem("sl:shotlogs") || "[]"));
  expect(persistedShotLogs.some((row) => String(row?.email || "").toLowerCase() === PLAYER_EMAIL && Number(row?.made) === SHOT_MARKER)).toBe(true);

  await navigateToKey(page, "program");
  await expect(page.locator("body")).toContainText(EVENT_MARKER, { timeout: 20_000 });

  await navigateToKey(page, "sc");
  await expect(page.locator("body")).toContainText(VENUE_MARKER, { timeout: 20_000 });

  await page.screenshot({
    path: "artifacts/demo-registered-live-parity/registered-mobile-hydration-player.png",
    fullPage: true,
    animations: "disabled",
  });
});
