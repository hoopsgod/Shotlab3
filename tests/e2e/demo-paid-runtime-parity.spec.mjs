import { test, expect } from "@playwright/test";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { installParityBranding } from "./parity-branding-fixture.mjs";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/demo-registered-runtime-parity");
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
const COLOR_SERIALIZATION_FIELDS = new Set(["backgroundColor", "color", "borderTopColor"]);
const INTERACTIVE_FINGERPRINT_TAGS = new Set(["button", "a", "input", "select", "textarea"]);

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

test.describe.configure({ mode: "serial" });

function digest(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function normalizeFingerprintForDigest(value) {
  if (Array.isArray(value)) return value.map((entry) => normalizeFingerprintForDigest(entry));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !COLOR_SERIALIZATION_FIELDS.has(key) && (key !== "box" || INTERACTIVE_FINGERPRINT_TAGS.has(value.tag)))
        .map(([key, entry]) => [key, key === "box" ? entry.slice(2) : normalizeFingerprintForDigest(entry)]),
    );
  }
  return value;
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
    if (key === "sl:session" || key === "sl:demoMode") continue;
    let parsed;
    try {
      parsed = JSON.parse(rawValue);
    } catch {
      next[key] = rawValue;
      continue;
    }
    let registeredValue = replaceIdentity(parsed, demoIdentity.email, registeredIdentity.email);
    // Demo shot logs may be intentionally marked as local/pending because demo
    // persistence never writes remotely. A healthy registered session receives
    // the same basketball rows as remote-saved data; normalize only those
    // transport fields so persistence safety does not masquerade as UI drift.
    if (key === "sl:shotlogs" && Array.isArray(registeredValue)) {
      registeredValue = registeredValue.map((row) => ({
        ...row,
        demo: false,
        syncState: "remote_saved",
        syncSource: "remote",
        syncError: "",
        syncDiagnostic: null,
      }));
    }
    next[key] = JSON.stringify(registeredValue);
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

function readSeedTeam(storage) {
  const teams = readSeedRows(storage, "sl:teams");
  const players = readSeedRows(storage, "sl:players");
  const teamIdOf = (row) => String(row?.teamId || row?.team_id || "");
  const idOf = (row) => String(row?.id || row?.teamId || row?.team_id || "");
  const playerTeamId = teamIdOf(players.find((row) => teamIdOf(row) === TEAM_ID))
    || teamIdOf(players.find((row) => teamIdOf(row)))
    || TEAM_ID;
  const team = teams.find((row) => idOf(row) === playerTeamId)
    || teams.find((row) => idOf(row) === TEAM_ID)
    || {};
  return {
    id: String(team?.id || team?.teamId || team?.team_id || playerTeamId || TEAM_ID),
    name: String(team?.name || team?.teamName || "Demo Titans"),
    joinCode: String(team?.joinCode || team?.join_code || "DEMO26"),
  };
}

async function fulfillJson(route, body, status = 200) {
  await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

async function installSeededPersistenceRoutes(page, storage, activeTeamId) {
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
        team_id: activeTeamId,
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
      team_id: activeTeamId,
      resource: posted?.resource || "",
      rows: Array.isArray(posted?.rows) ? posted.rows : [],
      deleted_count: 0,
    });
  });
}

async function installSafeRoutes(page, role, remoteStorage = null) {
  const registered = REGISTERED_IDENTITIES[role];
  const seededTeam = readSeedTeam(remoteStorage);
  const activeTeamId = seededTeam.id;
  const profile = {
    email: registered.email,
    name: registered.name,
    role: registered.role,
    team_id: activeTeamId,
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
      team: { id: activeTeamId, name: seededTeam.name, joinCode: seededTeam.joinCode },
    });
  });
  await page.route("**/v1/season-archives", async (route) => {
    await fulfillJson(route, { ok: true, archives: [] });
  });
  await page.route("**/v1/coach/players/provision**", async (route) => {
    await fulfillJson(route, { ok: true, invitations: [] });
  });

  await installSeededPersistenceRoutes(page, remoteStorage, activeTeamId);

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
  await page.mouse.move(1, 1);
  await page.evaluate(async () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo(0, 0);
    document.querySelector(".player-scroll-container")?.scrollTo(0, 0);
    document.querySelector(".coach-scroll-container")?.scrollTo(0, 0);
    if (document.fonts?.ready) await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.complete ? image.decode?.().catch(() => {}) : new Promise((resolve) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", resolve, { once: true });
    })));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });

  let previousLayout = "";
  let stableSamples = 0;
  for (let attempt = 0; attempt < 12 && stableSamples < 2; attempt += 1) {
    const layout = await page.evaluate(() => JSON.stringify([...document.body.querySelectorAll("*")].map((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden" || rect.width <= 0 || rect.height <= 0) return null;
      return [
        Math.round(rect.x * 2) / 2,
        Math.round(rect.y * 2) / 2,
        Math.round(rect.width * 2) / 2,
        Math.round(rect.height * 2) / 2,
        style.fontFamily,
        style.borderRadius,
      ];
    }).filter(Boolean)));
    stableSamples = layout === previousLayout ? stableSamples + 1 : 0;
    previousLayout = layout;
    if (stableSamples < 2) await page.waitForTimeout(100);
  }
  expect(stableSamples, "Visual parity capture requires a stable computed layout").toBeGreaterThanOrEqual(2);
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
  await page.goto("/?demo=1");
  await expect(page.getByRole("button", { name: role === "coach" ? "Coach demo" : "Player demo", exact: true })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: role === "coach" ? "Coach demo" : "Player demo", exact: true }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  // Compare equivalent configured-team states. Demo ships with a branded team,
  // while a registered tenant without a custom logo intentionally enters the
  // onboarding state. A shared test-only logo keeps the parity audit focused on
  // presentation instead of treating that real product-state difference as UI drift.
  await installParityBranding(page);
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await page.addStyleTag({ content: MOTION_FREEZE });
  await settle(page);
  await expect(page.locator('[data-feedback-key="release-connectivity"]')).toHaveCount(0);
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

async function expectPlayerHeroContrast(page) {
  const ratio = await page.locator('[data-command-role="primary"] p').first().evaluate((node) => {
    const channels = (value) => {
      const serialized = String(value).trim();
      const values = (serialized.match(/[\d.]+/g) || []).map(Number);
      if (serialized.startsWith("color(srgb")) {
        return [values[0] * 255, values[1] * 255, values[2] * 255, values[3] ?? 1];
      }
      return [values[0], values[1], values[2], values[3] ?? 1];
    };
    const foreground = channels(getComputedStyle(node).color).slice(0, 3);
    const luminance = (rgb) => rgb
      .map((channel) => channel / 255)
      .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
      .reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);
    const backgroundCandidates = [];
    let backgroundNode = node;
    while (backgroundNode && backgroundCandidates.length === 0) {
      const computed = getComputedStyle(backgroundNode);
      const solid = channels(computed.backgroundColor);
      if (solid.length >= 3 && solid[3] > 0) backgroundCandidates.push(solid.slice(0, 3));
      if (computed.backgroundImage !== "none") {
        const paints = computed.backgroundImage.match(/rgba?\([^)]*\)|color\(srgb[^)]*\)/g) || [];
        backgroundCandidates.push(...paints.map(channels).filter((paint) => paint.length >= 3 && paint[3] >= .95).map((paint) => paint.slice(0, 3)));
      }
      backgroundNode = backgroundNode.parentElement;
    }
    if (backgroundCandidates.length === 0) backgroundCandidates.push([255, 255, 255]);
    const foregroundLuminance = luminance(foreground);
    return Math.min(...backgroundCandidates.map((background) => {
      const backgroundLuminance = luminance(background);
      return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
    }));
  });
  expect(ratio, 'Player command hero body copy must meet WCAG AA contrast').toBeGreaterThanOrEqual(4.5);
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

async function canonicalizeAllowedSandboxUtility(page, role, kind, key) {
  if (role !== "coach" || key !== "settings") return;

  const sandboxCards = page.locator(".coachAdministrationCard").filter({
    has: page.getByRole("heading", { name: "DEMO SETTINGS", exact: true }),
  });

  if (kind === "registered") {
    await expect(sandboxCards, "Registered Coach settings must never expose demo reset controls").toHaveCount(0);
    return;
  }

  await expect(sandboxCards, "Demo Coach settings must expose exactly one sandbox reset utility").toHaveCount(1);
  await sandboxCards.evaluate((node) => {
    node.setAttribute("data-parity-excluded-sandbox-utility", "true");
    node.style.setProperty("display", "none", "important");
  });
  await settle(page);
}

async function captureFingerprint(page, role, kind, key) {
  await canonicalizeAllowedSandboxUtility(page, role, kind, key);
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
      // Sandbox reset controls are an intentional capability-only difference:
      // registered tenants must never be able to load or clear demo seed data.
      // Exclude only that tightly identified utility card from product parity.
      .filter((node) => {
        const sandboxCard = node.closest?.(".coachAdministrationCard");
        if (!sandboxCard) return true;
        const isSandboxUtility = [...sandboxCard.querySelectorAll("h3")].some((heading) => normalizeText(heading.textContent) === "DEMO SETTINGS");
        return !isSandboxUtility;
      })
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
  // Prime every viewport-sized paint tile before a full-page capture. Chromium
  // can otherwise omit parts of offscreen clipped cards even when the DOM and
  // computed layout are identical across isolated contexts.
  await page.evaluate(async () => {
    const height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    const step = Math.max(1, window.innerHeight - 80);
    for (let y = 0; y < height; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    window.scrollTo(0, 0);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.screenshot({ path: path.join(roleDir, `${key}.png`), fullPage: true, animations: "disabled" });
  return { digest: digest(normalizeFingerprintForDigest(fingerprint)), count: fingerprint.length };
}

async function captureExperience(browser, role, kind, seedStorage = null) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const pageErrors = [];
  const phaseOneConsoleIssues = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (!["warning", "error"].includes(message.type())) return;
    const text = message.text();
    if (/\[remote-persist\] upsert failed|\[home-shots-leaderboard\] refresh|\[release-readiness\] pending sync/i.test(text)) {
      phaseOneConsoleIssues.push(text);
    }
  });
  await installSafeRoutes(page, role, kind === "registered" ? seedStorage : null);

  if (kind === "demo") await enterDemo(page, role);
  else await enterRegistered(page, role, seedStorage);
  if (role === "player") await expectPlayerHeroContrast(page);

  const storage = kind === "demo" ? await collectDemoStorage(page) : null;
  const navKeys = await getNavigationKeys(page);
  const routes = {};
  for (const key of navKeys) {
    await navigateToKey(page, key);
    routes[key] = await captureFingerprint(page, role, kind, key);
    if (key === "team-store") {
      await page.getByRole("button", { name: "Close team store", exact: true }).click();
      await expect(page.getByRole("dialog", { name: "Team Store", exact: true })).toHaveCount(0);
      await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible();
    }
  }

  expect(pageErrors, `${role} ${kind} must not throw uncaught page errors`).toEqual([]);
  expect(phaseOneConsoleIssues, `${role} ${kind} must not emit Phase 1 persistence or leaderboard errors`).toEqual([]);
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
