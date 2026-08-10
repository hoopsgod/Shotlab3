import { test, expect } from "@playwright/test";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/demo-paid-runtime-parity");
const TEAM_ID = "team-demo-titans";
const DEMO_IDENTITIES = {
  coach: { email: "coach.demo@shotlab.app", name: "Demo Coach", role: "coach" },
  player: { email: "demo@shotlab.app", name: "Demo Player", role: "player" },
};
const REGISTERED_IDENTITIES = {
  coach: { email: "parity.coach@shotlab.test", name: "Demo Coach", role: "coach" },
  player: { email: "parity.player@shotlab.test", name: "Demo Player", role: "player" },
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

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

test.describe.configure({ mode: "serial" });

function digest(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function replaceIdentity(value, fromEmail, toEmail) {
  if (Array.isArray(value)) return value.map((entry) => replaceIdentity(entry, fromEmail, toEmail));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, replaceIdentity(entry, fromEmail, toEmail)]));
  }
  if (typeof value === "string") return value.split(fromEmail).join(toEmail);
  return value;
}

function buildRegisteredStorage(demoStorage, role) {
  const demoIdentity = DEMO_IDENTITIES[role];
  const registeredIdentity = REGISTERED_IDENTITIES[role];
  const next = {};
  for (const [key, rawValue] of Object.entries(demoStorage || {})) {
    if (key === "sl:session" || key === "sl:demoMode" || key === "sl:demo-data-meta") continue;
    let parsed;
    try {
      parsed = JSON.parse(rawValue);
    } catch {
      next[key] = rawValue;
      continue;
    }
    next[key] = JSON.stringify(replaceIdentity(parsed, demoIdentity.email, registeredIdentity.email));
  }
  return next;
}

function readSeedRows(storage, key) {
  try {
    const parsed = JSON.parse(storage?.[key] || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function fulfillJson(route, body, status = 200) {
  await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

async function installSeededPersistenceRoutes(page, storage) {
  if (!storage) return;

  const rows = {
    teams: readSeedRows(storage, "sl:teams"),
    players: readSeedRows(storage, "sl:players"),
    profiles: readSeedRows(storage, "sl:player-profiles"),
    events: readSeedRows(storage, "sl:events"),
    rsvps: readSeedRows(storage, "sl:rsvps"),
    scores: readSeedRows(storage, "sl:scores"),
    programScores: readSeedRows(storage, "sl:program-scores"),
    shotLogs: readSeedRows(storage, "sl:shotlogs"),
    scSessions: readSeedRows(storage, "sl:sc-sessions"),
    scRsvps: readSeedRows(storage, "sl:sc-rsvps"),
    scLogs: readSeedRows(storage, "sl:sc-logs"),
  };

  const collectionRoute = async (route, field, seededRows) => {
    const method = route.request().method().toUpperCase();
    if (method === "GET") {
      await fulfillJson(route, { ok: true, storage_mode: "parity_seed", [field]: seededRows });
      return;
    }
    if (method === "DELETE") {
      await fulfillJson(route, { ok: true, storage_mode: "parity_seed", deleted_count: 0, [field]: seededRows });
      return;
    }
    let posted = {};
    try { posted = route.request().postDataJSON() || {}; } catch {}
    const echoed = Array.isArray(posted?.[field]) ? posted[field] : seededRows;
    await fulfillJson(route, { ok: true, storage_mode: "parity_seed", [field]: echoed });
  };

  await page.route(/\/v1\/teams(?:\?.*)?$/, (route) => collectionRoute(route, "teams", rows.teams));
  await page.route(/\/v1\/players(?:\?.*)?$/, (route) => collectionRoute(route, "players", rows.players));
  await page.route(/\/v1\/player-profiles(?:\?.*)?$/, (route) => collectionRoute(route, "profiles", rows.profiles));
  await page.route(/\/v1\/events(?:\?.*)?$/, (route) => collectionRoute(route, "events", rows.events));
  await page.route(/\/v1\/rsvps(?:\?.*)?$/, (route) => collectionRoute(route, "rsvps", rows.rsvps));
  await page.route(/\/v1\/scores(?:\?.*)?$/, (route) => collectionRoute(route, "scores", rows.scores));
  await page.route(/\/v1\/program-scores(?:\?.*)?$/, (route) => collectionRoute(route, "program_scores", rows.programScores));
  await page.route(/\/v1\/shot-logs(?:\?.*)?$/, (route) => collectionRoute(route, "shot_logs", rows.shotLogs));
  await page.route(/\/v1\/strength-conditioning(?:\?.*)?$/, async (route) => {
    const method = route.request().method().toUpperCase();
    if (method === "GET") {
      await fulfillJson(route, {
        ok: true,
        storage_mode: "parity_seed",
        team_id: TEAM_ID,
        can_write_sessions: true,
        sessions: rows.scSessions,
        rsvps: rows.scRsvps,
        logs: rows.scLogs,
      });
      return;
    }
    let posted = {};
    try { posted = route.request().postDataJSON() || {}; } catch {}
    await fulfillJson(route, {
      ok: true,
      storage_mode: "parity_seed",
      team_id: TEAM_ID,
      resource: posted?.resource || "",
      rows: Array.isArray(posted?.rows) ? posted.rows : [],
      deleted_count: 0,
    });
  });
}

async function installSafeRoutes(page, role, remoteStorage = null) {
  const registered = REGISTERED_IDENTITIES[role];
  const profile = {
    email: registered.email,
    name: registered.name,
    role: registered.role,
    team_id: TEAM_ID,
    hide_from_leaderboards: role === "coach",
  };

  await page.route("**/v1/legacy-auth/login", async (route) => {
    await fulfillJson(route, { ok: true, profile });
  });
  await page.route("**/v1/legacy-auth/restore", async (route) => {
    await fulfillJson(route, { ok: true, profile });
  });
  await page.route("**/v1/teams/restore-context", async (route) => {
    await fulfillJson(route, {
      ok: true,
      team: { id: TEAM_ID, name: "Demo Titans", joinCode: "DEMO26" },
    });
  });
  await page.route("**/v1/season-archives", async (route) => {
    await fulfillJson(route, { ok: true, archives: [] });
  });
  await page.route("**/v1/coach/players/provision**", async (route) => {
    await fulfillJson(route, { ok: true, invitations: [] });
  });

  await installSeededPersistenceRoutes(page, remoteStorage);

  // Any remaining direct Supabase request is made healthy and non-destructive.
  // The app's signed persistence bridge above is the authoritative path exercised
  // for registered users in this test.
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, async (route) => {
    const method = route.request().method().toUpperCase();
    if (method === "GET") {
      await fulfillJson(route, []);
      return;
    }
    let posted = [];
    try { posted = route.request().postDataJSON() || []; } catch {}
    await fulfillJson(route, posted);
  });
}

async function settle(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.waitForTimeout(80);
}

async function collectDemoStorage(page) {
  return page.evaluate(() => {
    const payload = {};
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key || !key.startsWith("sl:")) continue;
      payload[key] = window.localStorage.getItem(key);
    }
    return payload;
  });
}

async function enterDemo(page, role) {
  await page.goto("/");
  await expect(page.getByRole("button", { name: role === "coach" ? "Coach demo" : "Player demo", exact: true })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: role === "coach" ? "Coach demo" : "Player demo", exact: true }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await page.addStyleTag({ content: MOTION_FREEZE });
  await settle(page);
}

async function enterRegistered(page, role, storage) {
  await page.addInitScript((seed) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    for (const [key, value] of Object.entries(seed)) window.localStorage.setItem(key, value);
  }, storage);
  await page.goto("/");
  const identity = REGISTERED_IDENTITIES[role];
  await expect(page.getByRole("tab", { name: /^sign in$/i })).toBeVisible({ timeout: 20_000 });
  await page.locator('input[type="email"]').fill(identity.email);
  await page.locator('input[type="password"]').fill("parity-pass");
  await page.getByRole("button", { name: /^sign in$/i }).last().click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await page.addStyleTag({ content: MOTION_FREEZE });
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
  await expect(sheet).toHaveCount(0);
  const keys = [...new Set([...primary, ...secondary])];
  // Branding intentionally opens the standalone team-branding workspace, which
  // does not render the Coach mobile dock. Audit it last so every route remains
  // covered without requiring a test-only product navigation path.
  return [...keys.filter((key) => key !== "branding"), ...keys.filter((key) => key === "branding")];
}

async function navigateToKey(page, key) {
  const dockTarget = page.getByTestId("mobile-navigation-dock").locator(`[data-nav-key="${key}"]`);
  if (await dockTarget.count()) {
    await dockTarget.click();
  } else {
    await page.getByTestId("mobile-navigation-more").click();
    const sheet = page.getByTestId("mobile-navigation-sheet");
    await expect(sheet).toBeVisible();
    const target = sheet.locator(`[data-nav-key="${key}"]`);
    await expect(target, `Navigation target ${key} must be reachable`).toBeVisible();
    await target.click();
    await expect(sheet).toHaveCount(0);
  }
  await settle(page);
}

async function captureFingerprint(page, role, kind, key) {
  const demoEmail = DEMO_IDENTITIES[role].email;
  const registeredEmail = REGISTERED_IDENTITIES[role].email;
  const fingerprint = await page.evaluate(({ demoEmail, registeredEmail }) => {
    const normalizeText = (value = "") => String(value)
      .replaceAll(demoEmail, "<CURRENT_USER>")
      .replaceAll(registeredEmail, "<CURRENT_USER>")
      .replace(/\s+/g, " ")
      .trim();
    const round = (value) => Math.round(Number(value) * 2) / 2;
    const excludedTags = new Set(["SCRIPT", "STYLE", "LINK", "META", "NOSCRIPT"]);
    const semanticTextTags = new Set(["H1", "H2", "H3", "H4", "P", "BUTTON", "A", "LABEL", "LI", "TH", "TD"]);

    return [...document.body.querySelectorAll("*")]
      .filter((node) => !excludedTags.has(node.tagName))
      .map((node) => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden" || rect.width <= 0 || rect.height <= 0) return null;
        const className = typeof node.className === "string" ? node.className.replace(/\s+/g, " ").trim() : "";
        return {
          tag: node.tagName.toLowerCase(),
          className,
          testId: node.getAttribute("data-testid") || "",
          navKey: node.getAttribute("data-nav-key") || "",
          ariaCurrent: node.getAttribute("aria-current") || "",
          text: semanticTextTags.has(node.tagName) ? normalizeText(node.textContent).slice(0, 220) : "",
          box: [round(rect.x), round(rect.y), round(rect.width), round(rect.height)],
          style: {
            display: style.display,
            position: style.position,
            flexDirection: style.flexDirection,
            justifyContent: style.justifyContent,
            alignItems: style.alignItems,
            gridTemplateColumns: style.gridTemplateColumns,
            gap: style.gap,
            padding: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft],
            margin: [style.marginTop, style.marginRight, style.marginBottom, style.marginLeft],
            overflowX: style.overflowX,
            backgroundColor: style.backgroundColor,
            color: style.color,
            borderRadius: style.borderRadius,
            borderTopColor: style.borderTopColor,
            borderTopWidth: style.borderTopWidth,
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            lineHeight: style.lineHeight,
          },
        };
      })
      .filter(Boolean);
  }, { demoEmail, registeredEmail });

  const roleDir = path.join(OUTPUT_DIR, role, kind);
  fs.mkdirSync(roleDir, { recursive: true });
  fs.writeFileSync(path.join(roleDir, `${key}.json`), JSON.stringify(fingerprint, null, 2));
  await page.screenshot({ path: path.join(roleDir, `${key}.png`), fullPage: true });
  return { digest: digest(fingerprint), count: fingerprint.length };
}

async function captureExperience(browser, role, kind, seedStorage = null) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await installSafeRoutes(page, role, kind === "registered" ? seedStorage : null);

  if (kind === "demo") await enterDemo(page, role);
  else await enterRegistered(page, role, seedStorage);

  const storage = kind === "demo" ? await collectDemoStorage(page) : null;
  const navKeys = await getNavigationKeys(page);
  const routes = {};
  for (const key of navKeys) {
    await navigateToKey(page, key);
    routes[key] = await captureFingerprint(page, role, kind, key);
  }

  expect(pageErrors, `${role} ${kind} must not throw uncaught page errors`).toEqual([]);
  await context.close();
  return { storage, navKeys, routes };
}

for (const role of ["coach", "player"]) {
  test(`${role} demo and registered experiences render the same route matrix and computed UI`, async ({ browser }) => {
    const demo = await captureExperience(browser, role, "demo");
    const registeredStorage = buildRegisteredStorage(demo.storage, role);
    const registered = await captureExperience(browser, role, "registered", registeredStorage);

    expect(registered.navKeys, `${role} demo and registered navigation must expose identical destinations`).toEqual(demo.navKeys);
    expect(demo.navKeys.length, `${role} parity must cover multiple destinations`).toBeGreaterThanOrEqual(5);

    for (const key of demo.navKeys) {
      expect(registered.routes[key]?.count, `${role}/${key} must render the same number of visible UI nodes`).toBe(demo.routes[key]?.count);
      expect(registered.routes[key]?.digest, `${role}/${key} demo and registered computed UI fingerprints must match`).toBe(demo.routes[key]?.digest);
    }
  });
}
