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

async function cleanupFixture() {
  const encodedTeam = encodeURIComponent(TEAM_ID);
  const emails = [COACH_EMAIL, PLAYER_EMAIL];
  for (const email of emails) await safeDelete("legacy_auth_sessions", `user_email=eq.${encodeURIComponent(email)}`);
  for (const table of ["coach_player_invitations", "player_profiles", "team_priorities", "team_memberships", "team_invites", "players"]) {
    await safeDelete(table, `team_id=eq.${encodedTeam}`);
  }
  for (const email of emails) await safeDelete("legacy_auth_profiles", `email=eq.${encodeURIComponent(email)}`);
  await safeDelete("teams", `id=eq.${encodedTeam}`);
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

  const now = Date.now();
  await rest("players", {
    method: "POST",
    body: [
      { id: `live-coach-${RUN_ID}`, email: COACH_EMAIL, name: "Demo Coach", role: "coach", team_id: TEAM_ID, hide_from_leaderboards: false, created_at: now },
      { id: `live-player-${RUN_ID}`, email: PLAYER_EMAIL, name: "Demo Player", role: "player", team_id: TEAM_ID, hide_from_leaderboards: false, created_at: now + 1 },
      { id: `live-roster-a-${RUN_ID}`, email: `live-roster-a-${RUN_ID}@example.invalid`, name: "Alex Morgan", role: "player", team_id: TEAM_ID, hide_from_leaderboards: false, created_at: now + 2 },
      { id: `live-roster-b-${RUN_ID}`, email: `live-roster-b-${RUN_ID}@example.invalid`, name: "Jordan Lee", role: "player", team_id: TEAM_ID, hide_from_leaderboards: false, created_at: now + 3 },
      { id: `live-roster-c-${RUN_ID}`, email: `live-roster-c-${RUN_ID}@example.invalid`, name: "Taylor Reed", role: "player", team_id: TEAM_ID, hide_from_leaderboards: false, created_at: now + 4 },
    ],
  });

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
  test(`${role} demo matches a genuine registered account presentation on the same build`, async ({ browser }) => {
    const demo = await captureRole(browser, role, "demo");
    const registered = await captureRole(browser, role, "registered");

    expect(registered.navKeys, `${role} must expose the same production navigation in demo and registered sessions`).toEqual(demo.navKeys);
    expect(demo.navKeys.length).toBeGreaterThanOrEqual(5);
    for (const key of demo.navKeys) {
      expect(stableContract(registered.contracts[key]), `${role}/${key} production shell must not change by account type`).toEqual(stableContract(demo.contracts[key]));
    }
  });
}
