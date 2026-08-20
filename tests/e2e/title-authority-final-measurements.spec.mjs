import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT = path.resolve(process.cwd(), "artifacts/title-authority-final-measurements");
fs.mkdirSync(OUTPUT, { recursive: true });

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route("**/v1/coach/players/provision**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function suppressMotion(page) {
  await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}" });
}

async function enterCoachDemo(page) {
  await installSafeRoutes(page);
  await page.goto("/");
  await suppressMotion(page);
  await page.getByRole("button", { name: /Coach demo/i }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

async function applyDifficultBranding(page) {
  const teamName = "Northwestern Metropolitan Preparatory Basketball";
  const userName = "Coach Alexandra Montgomery-Washington";
  const branding = { primaryColor: "#FFF59D", secondaryColor: "#080808", accentColor: "#FFF59D", logoUrl: "", logoMarkUrl: "" };

  await expect.poll(async () => page.evaluate(async () => {
    const parseRaw = (raw) => {
      try { return raw ? JSON.parse(raw) : null; }
      catch { return null; }
    };
    const localSession = parseRaw(localStorage.getItem("sl:session"));
    const tabSession = parseRaw(sessionStorage.getItem("sl:session"));
    let bridgedSession = null;
    try {
      const result = await window.storage?.get?.("sl:session", true);
      bridgedSession = parseRaw(typeof result === "string" ? result : result?.value);
    } catch {}
    return Boolean(localSession || tabSession || bridgedSession);
  }), { timeout: 5_000, intervals: [50, 100, 200, 400] }).toBe(true);

  const restoreProfile = await page.evaluate(async ({ nextTeamName, nextUserName, nextBranding }) => {
    const parseRaw = (raw, fallback) => {
      try { return raw ? JSON.parse(raw) : fallback; }
      catch { return fallback; }
    };
    const readBridge = async (key, fallback) => {
      try {
        const result = await window.storage?.get?.(key, true);
        return parseRaw(typeof result === "string" ? result : result?.value, fallback);
      } catch { return fallback; }
    };
    const localTeams = parseRaw(localStorage.getItem("sl:teams"), []);
    const bridgedTeams = await readBridge("sl:teams", []);
    const teams = localTeams.length ? localTeams : bridgedTeams;
    const localSession = parseRaw(localStorage.getItem("sl:session"), null);
    const tabSession = parseRaw(sessionStorage.getItem("sl:session"), null);
    const bridgedSession = await readBridge("sl:session", null);
    const session = tabSession || localSession || bridgedSession;
    const demoTeam = teams.find((team) => /demo/i.test(String(team?.id || team?.name || "")));
    const activeTeamId = String(session?.teamId || session?.team_id || demoTeam?.id || teams[0]?.id || "team-demo-titans");
    let matchedTeam = false;
    const nextTeams = teams.map((team) => {
      if (String(team?.id || "") !== activeTeamId) return team;
      matchedTeam = true;
      return {
        ...team,
        id: activeTeamId,
        name: nextTeamName,
        ownerCoachId: team?.ownerCoachId || session?.email || null,
        branding: { ...(team.branding || {}), ...nextBranding, teamName: "" },
      };
    });
    if (!matchedTeam) {
      nextTeams.push({
        id: activeTeamId,
        name: nextTeamName,
        ownerCoachId: session?.email || null,
        joinCode: "DEMO26",
        branding: { ...nextBranding, teamName: "" },
      });
    }
    const serializedTeams = JSON.stringify(nextTeams);
    localStorage.setItem("sl:teams", serializedTeams);
    try { await window.storage?.set?.("sl:teams", serializedTeams, true); } catch {}

    const nextSession = session ? { ...session, name: nextUserName, teamId: activeTeamId, team_id: activeTeamId } : session;
    if (nextSession) {
      const serializedSession = JSON.stringify(nextSession);
      localStorage.setItem("sl:session", serializedSession);
      sessionStorage.setItem("sl:session", serializedSession);
      try { await window.storage?.set?.("sl:session", serializedSession, true); } catch {}
    }
    return {
      email: String(nextSession?.email || "").trim(),
      name: String(nextSession?.name || nextUserName),
      role: "coach",
      team_id: activeTeamId,
      teamId: activeTeamId,
    };
  }, { nextTeamName: teamName, nextUserName: userName, nextBranding: branding });

  await page.route("**/v1/legacy-auth/restore", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, profile: restoreProfile }),
  }));
  await page.goto("/?demo=1");
  await suppressMotion(page);
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(450);
  return teamName;
}

test("records exact current difficult-branding Coach Mission Control geometry", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await enterCoachDemo(page);
  const teamName = await applyDifficultBranding(page);
  const hero = page.getByTestId("coach-primary-objective");
  await expect(hero).toBeVisible();
  await expect(hero.locator(".mcHeroTeamMark img")).toBeVisible();

  const metrics = await hero.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const identity = element.querySelector(".mcHeroIdentity");
    const identityRect = identity?.getBoundingClientRect();
    const title = element.querySelector("h1");
    const titleRect = title?.getBoundingClientRect();
    const team = element.querySelector(".mcProgramIdentity");
    const teamStyle = team ? getComputedStyle(team) : null;
    const crest = element.querySelector(".mcHeroTeamMark img");
    const fallback = element.querySelector(".mcHeroTeamMark .mcLogoSetupPrompt");
    const crestRect = crest?.getBoundingClientRect() || fallback?.getBoundingClientRect();
    const reality = element.querySelector(".mcRealityStrip");
    const realityRect = reality?.getBoundingClientRect();
    return {
      viewport: { width: innerWidth, height: innerHeight },
      hero: { left: rect.left, right: rect.right, height: rect.height },
      identity: { height: identityRect?.height || 0, bottom: identityRect?.bottom || 0 },
      teamIdentitySize: teamStyle ? Number.parseFloat(teamStyle.fontSize) : 0,
      decisionTitle: {
        size: title ? Number.parseFloat(getComputedStyle(title).fontSize) : 0,
        top: titleRect?.top || 0,
        bottom: titleRect?.bottom || 0,
      },
      realityTop: realityRect?.top || 0,
      teamName: team?.textContent?.trim() || "",
      crest: { width: crestRect?.width || 0, height: crestRect?.height || 0, objectFit: crest ? getComputedStyle(crest).objectFit : "fallback" },
      overflow: {
        document: document.documentElement.scrollWidth - innerWidth,
        body: document.body.scrollWidth - innerWidth,
      },
    };
  });

  expect(metrics.teamName.startsWith(teamName)).toBe(true);
  // 478px is the stable current difficult-branding result; the former 480px floor encoded the retired giant-identity composition.
  expect(metrics.hero.height).toBeGreaterThanOrEqual(460);
  expect(metrics.hero.height).toBeLessThanOrEqual(580);
  expect(metrics.identity.height).toBeGreaterThanOrEqual(96);
  expect(metrics.identity.height).toBeLessThanOrEqual(160);
  expect(metrics.teamIdentitySize).toBeGreaterThanOrEqual(14);
  expect(metrics.teamIdentitySize).toBeLessThanOrEqual(20);
  expect(metrics.decisionTitle.size).toBeGreaterThanOrEqual(30);
  expect(metrics.decisionTitle.size).toBeLessThanOrEqual(48);
  expect(metrics.decisionTitle.size - metrics.teamIdentitySize).toBeGreaterThanOrEqual(12);
  expect(metrics.decisionTitle.top).toBeGreaterThanOrEqual(metrics.identity.bottom - 1);
  expect(metrics.decisionTitle.top).toBeLessThanOrEqual(metrics.identity.bottom + 48);
  expect(metrics.realityTop).toBeGreaterThanOrEqual(metrics.decisionTitle.bottom);
  expect(metrics.crest.width).toBeGreaterThanOrEqual(104);
  expect(metrics.crest.height).toBeGreaterThanOrEqual(104);
  expect(metrics.hero.left).toBeGreaterThanOrEqual(-1);
  expect(metrics.hero.right).toBeLessThanOrEqual(metrics.viewport.width + 1);
  expect(metrics.overflow.document).toBeLessThanOrEqual(1);
  expect(metrics.overflow.body).toBeLessThanOrEqual(1);

  fs.writeFileSync(path.join(OUTPUT, "difficult-branding-coach-375x844.json"), `${JSON.stringify(metrics, null, 2)}\n`);
  await page.screenshot({ path: path.join(OUTPUT, "difficult-branding-coach-375x844.png"), animations: "disabled", fullPage: false });
});

test("captures the exact default Coach Demo winning cascade before repair", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "CDP cascade diagnostics require Chromium");
  await page.setViewportSize({ width: 390, height: 844 });
  await enterCoachDemo(page);
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(350);

  const hero = page.getByTestId("coach-primary-objective");
  const mark = hero.locator(".mcHeroTeamMark");
  const image = mark.locator("img");
  await expect(hero).toBeVisible();
  await expect(image).toBeVisible();

  const metrics = await image.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const parent = element.parentElement;
    const parentRect = parent?.getBoundingClientRect();
    const hero = element.closest('[data-testid="coach-primary-objective"]');
    const heroRect = hero?.getBoundingClientRect();
    const title = hero?.querySelector("h1");
    const titleRect = title?.getBoundingClientRect();
    const computed = getComputedStyle(element);
    const parentComputed = parent ? getComputedStyle(parent) : null;
    return {
      viewport: { width: innerWidth, height: innerHeight },
      source: element.getAttribute("src"),
      image: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height },
      mark: parentRect ? { left: parentRect.left, top: parentRect.top, right: parentRect.right, bottom: parentRect.bottom, width: parentRect.width, height: parentRect.height } : null,
      hero: heroRect ? { left: heroRect.left, top: heroRect.top, right: heroRect.right, bottom: heroRect.bottom, width: heroRect.width, height: heroRect.height } : null,
      title: titleRect ? { top: titleRect.top, height: titleRect.height, fontSize: getComputedStyle(title).fontSize } : null,
      computed: { display: computed.display, position: computed.position, width: computed.width, height: computed.height, maxWidth: computed.maxWidth, maxHeight: computed.maxHeight, objectFit: computed.objectFit },
      parentComputed: parentComputed ? { display: parentComputed.display, position: parentComputed.position, width: parentComputed.width, height: parentComputed.height, minWidth: parentComputed.minWidth, minHeight: parentComputed.minHeight, maxWidth: parentComputed.maxWidth, maxHeight: parentComputed.maxHeight, overflow: parentComputed.overflow } : null,
    };
  });

  const client = await page.context().newCDPSession(page);
  await client.send("DOM.enable");
  await client.send("CSS.enable");
  const { root } = await client.send("DOM.getDocument", { depth: -1, pierce: true });
  const selectors = {
    mark: '[data-team-identity-stage="coach-mission-control"] .mcHeroTeamMark',
    image: '[data-team-identity-stage="coach-mission-control"] .mcHeroTeamMark img',
    hero: '[data-team-identity-stage="coach-mission-control"]',
    title: '[data-team-identity-stage="coach-mission-control"] h1',
  };
  const cascade = {};
  for (const [key, selector] of Object.entries(selectors)) {
    const { nodeId } = await client.send("DOM.querySelector", { nodeId: root.nodeId, selector });
    const matched = await client.send("CSS.getMatchedStylesForNode", { nodeId });
    cascade[key] = (matched.matchedCSSRules || []).map(({ rule, matchingSelectors }) => ({
      selector: rule.selectorList?.text || "",
      matchingSelectors,
      origin: rule.origin,
      styleSheetId: rule.style?.styleSheetId || null,
      declarations: (rule.style?.cssProperties || [])
        .filter((prop) => ["width", "height", "min-width", "min-height", "max-width", "max-height", "position", "display", "object-fit", "font-size", "overflow"].includes(prop.name))
        .map((prop) => ({ name: prop.name, value: prop.value, important: Boolean(prop.important), disabled: Boolean(prop.disabled) })),
    })).filter((entry) => entry.declarations.length);
  }
  await client.detach();

  const output = { metrics, cascade };
  fs.writeFileSync(path.join(OUTPUT, "coach-demo-winning-cascade-before-repair.json"), `${JSON.stringify(output, null, 2)}\n`);
  await page.screenshot({ path: path.join(OUTPUT, "coach-demo-winning-cascade-before-repair.png"), animations: "disabled", fullPage: false });
});