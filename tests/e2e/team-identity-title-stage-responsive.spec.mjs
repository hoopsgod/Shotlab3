import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT = path.resolve(process.cwd(), "artifacts/team-identity-title-stage-responsive");
fs.mkdirSync(OUTPUT, { recursive: true });

const REQUIRED_VIEWPORTS = [
  { width: 375, height: 844 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
];

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function suppressMotion(page) {
  await page.addStyleTag({ content: `
    *,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important;caret-color:transparent!important}
    html,body{scrollbar-width:none!important}
    ::-webkit-scrollbar{display:none!important}
  ` });
}

async function enterDemo(page, role) {
  await installSafeRoutes(page);
  await page.goto("/");
  await suppressMotion(page);
  await page.getByRole("button", { name: new RegExp(`${role} demo`, "i") }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

async function mutateActiveDemoIdentity(page, { teamName, branding = {}, userName }) {
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

  const restoreProfile = await page.evaluate(async ({ teamName: nextTeamName, branding: nextBranding, userName: nextUserName }) => {
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
        name: nextTeamName || team.name || "Demo Titans",
        ownerCoachId: team?.ownerCoachId || session?.email || null,
        branding: {
          ...(team.branding || {}),
          ...nextBranding,
          teamName: nextBranding.teamName ?? "",
        },
      };
    });
    if (!matchedTeam) {
      nextTeams.push({
        id: activeTeamId,
        name: nextTeamName || "Demo Titans",
        ownerCoachId: session?.email || null,
        joinCode: "DEMO26",
        branding: { ...nextBranding, teamName: nextBranding.teamName ?? "" },
      });
    }
    const serializedTeams = JSON.stringify(nextTeams);
    localStorage.setItem("sl:teams", serializedTeams);
    try { await window.storage?.set?.("sl:teams", serializedTeams, true); } catch {}

    const nextSession = session ? {
      ...session,
      ...(nextUserName ? { name: nextUserName } : {}),
      teamId: activeTeamId,
      team_id: activeTeamId,
    } : session;
    if (nextSession) {
      const serializedSession = JSON.stringify(nextSession);
      localStorage.setItem("sl:session", serializedSession);
      sessionStorage.setItem("sl:session", serializedSession);
      try { await window.storage?.set?.("sl:session", serializedSession, true); } catch {}
    }
    const email = String(nextSession?.email || "").trim();
    return {
      email,
      name: String(nextSession?.name || nextUserName || "Demo Coach"),
      role: nextSession?.role === "player" ? "player" : "coach",
      team_id: activeTeamId,
      teamId: activeTeamId,
    };
  }, { teamName, branding, userName });

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
}

async function navigate(page, key) {
  const dock = page.getByTestId("mobile-navigation-dock");
  const direct = dock.locator(`[data-nav-key="${key}"]`);
  if (await direct.count()) await direct.click();
  else {
    await page.getByTestId("mobile-navigation-more").click();
    const sheet = page.getByTestId("mobile-navigation-sheet");
    await expect(sheet).toBeVisible();
    await sheet.locator(`[data-nav-key="${key}"]`).click();
  }
  await page.waitForTimeout(250);
}

async function expectNoHorizontalOverflow(page) {
  const geometry = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  expect(geometry.document - geometry.viewport).toBeLessThanOrEqual(1);
  expect(geometry.body - geometry.viewport).toBeLessThanOrEqual(1);
}

async function expectTitleStageGeometry(page, { variant = "standard", teamName }) {
  const stage = page.locator('[data-team-identity-stage="true"]:visible').first();
  if (!(await stage.count()) && variant === "hero") {
    const coachHero = page.getByTestId("coach-primary-objective");
    await expect(coachHero).toBeVisible();
    const result = await coachHero.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const title = element.querySelector("h1");
      const team = element.querySelector(".mcProgramIdentity");
      const crest = element.querySelector(".mcHeroTeamMark img");
      const fallback = element.querySelector(".mcHeroTeamMark .mcLogoSetupPrompt");
      const crestRect = crest?.getBoundingClientRect() || fallback?.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        height: rect.height,
        viewport: innerWidth,
        titleSize: title ? Number.parseFloat(getComputedStyle(title).fontSize) : 0,
        teamName: team?.textContent?.trim() || "",
        crestWidth: crestRect?.width || 0,
        crestHeight: crestRect?.height || 0,
        objectFit: crest ? getComputedStyle(crest).objectFit : "fallback",
      };
    });
    expect(result.left).toBeGreaterThanOrEqual(-1);
    expect(result.right).toBeLessThanOrEqual(result.viewport + 1);
    expect(result.teamName.startsWith(teamName)).toBe(true);
    expect(result.titleSize).toBeGreaterThanOrEqual(44);
    expect(result.titleSize).toBeLessThanOrEqual(60);
    expect(result.crestWidth).toBeGreaterThanOrEqual(104);
    expect(result.crestHeight).toBeGreaterThanOrEqual(104);
    expect(result.height).toBeGreaterThanOrEqual(360);
    expect(result.height).toBeLessThanOrEqual(500);
    if (result.objectFit !== "fallback") expect(result.objectFit).toBe("contain");
    await expectNoHorizontalOverflow(page);
    return;
  }

  await expect(stage).toBeVisible();
  const result = await stage.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const title = element.querySelector("h1");
    const team = element.querySelector('[data-identity-role="team-name"]');
    const crest = element.querySelector('[data-identity-role="brand-mark"]');
    const fallback = element.querySelector('.teamIdentityTitleStage__fallbackCrest, .teamIdentityTitleStage__logoSetup');
    const crestRect = crest?.getBoundingClientRect() || fallback?.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      height: rect.height,
      viewport: innerWidth,
      titleSize: title ? Number.parseFloat(getComputedStyle(title).fontSize) : 0,
      teamName: team?.textContent?.trim() || "",
      crestWidth: crestRect?.width || 0,
      crestHeight: crestRect?.height || 0,
      objectFit: crest ? getComputedStyle(crest).objectFit : "fallback",
    };
  });
  expect(result.left).toBeGreaterThanOrEqual(-1);
  expect(result.right).toBeLessThanOrEqual(result.viewport + 1);
  expect(result.teamName).toBe(teamName);
  expect(result.titleSize).toBeGreaterThanOrEqual(38);
  expect(result.titleSize).toBeLessThanOrEqual(58);
  if (variant === "hero") {
    expect(result.crestWidth).toBeGreaterThanOrEqual(96);
    expect(result.crestHeight).toBeGreaterThanOrEqual(96);
    expect(result.height).toBeLessThanOrEqual(260);
  } else {
    expect(result.crestWidth).toBeGreaterThanOrEqual(80);
    expect(result.crestHeight).toBeGreaterThanOrEqual(80);
    expect(result.height).toBeLessThanOrEqual(300);
  }
  if (result.objectFit !== "fallback") expect(result.objectFit).toBe("contain");
  await expectNoHorizontalOverflow(page);
}

async function expectReadableTeamIdentity(page) {
  let label = page.locator('[data-team-identity-stage="true"]:visible [data-identity-role="team-name"]').first();
  if (!(await label.count())) label = page.getByTestId("coach-primary-objective").locator(".mcProgramIdentity");
  await expect(label).toBeVisible();
  const ratio = await label.evaluate((element) => {
    const parse = (value) => {
      const nums = (String(value).match(/\d+(?:\.\d+)?/g) || []).map(Number);
      return [nums[0] || 0, nums[1] || 0, nums[2] || 0];
    };
    const luminance = (rgb) => {
      const channel = (value) => {
        const s = value / 255;
        return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4;
      };
      return .2126 * channel(rgb[0]) + .7152 * channel(rgb[1]) + .0722 * channel(rgb[2]);
    };
    const fg = parse(getComputedStyle(element).color);
    let node = element;
    let bg = [255, 255, 255];
    while (node) {
      const raw = getComputedStyle(node).backgroundColor;
      const candidate = parse(raw);
      if (raw && !/rgba\([^)]*,\s*0\s*\)$/.test(raw) && raw !== "transparent") { bg = candidate; break; }
      node = node.parentElement;
    }
    const a = luminance(fg);
    const b = luminance(bg);
    return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  });
  expect(ratio).toBeGreaterThanOrEqual(4.5);
}

async function capture(page, name) {
  await page.screenshot({ path: path.join(OUTPUT, `${name}.png`), animations: "disabled", fullPage: false });
}

const svgDataUrl = (width, height, fill, label) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect x="4" y="4" width="${width - 8}" height="${height - 8}" rx="${Math.max(4, Math.min(width, height) * .08)}" fill="${fill}"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="#071c28" font-size="${Math.max(12, Math.min(width, height) * .28)}" font-family="Arial" font-weight="900">${label}</text></svg>`)}`;

test("team-owned Home and standard title stages satisfy the exact required mobile widths", async ({ page }) => {
  for (const viewport of REQUIRED_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await page.context().clearCookies();
    await page.goto("/");
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await enterDemo(page, "Player");
    await expectTitleStageGeometry(page, { variant: "hero", teamName: "Demo Titans" });
    await navigate(page, "leaderboards");
    await expectTitleStageGeometry(page, { variant: "standard", teamName: "Demo Titans" });
    await capture(page, `required-${viewport.width}x${viewport.height}-player-rankings`);
  }
});

test("long names, Demo logo restoration, hostile colors, and awkward logo shapes remain stable", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await enterDemo(page, "Coach");
  const longTeamName = "Northwestern Metropolitan Preparatory Basketball";
  await mutateActiveDemoIdentity(page, {
    teamName: longTeamName,
    userName: "Coach Alexandra Montgomery-Washington",
    branding: { primaryColor: "#FFF59D", secondaryColor: "#080808", accentColor: "#FFF59D", logoUrl: "", logoMarkUrl: "" },
  });
  await expectTitleStageGeometry(page, { variant: "hero", teamName: longTeamName });
  await expect(page.locator('.mcHeroTeamMark img')).toBeVisible();
  await expectReadableTeamIdentity(page);
  await navigate(page, "players");
  await expectTitleStageGeometry(page, { variant: "standard", teamName: longTeamName });
  await capture(page, "stress-375-long-name-no-logo-pale-color");

  await page.setViewportSize({ width: 390, height: 844 });
  const wideLogo = svgDataUrl(620, 120, "#f5f5f5", "WIDE");
  await mutateActiveDemoIdentity(page, {
    teamName: "Wide Mark Academy",
    branding: { primaryColor: "#F8E71C", secondaryColor: "#171717", logoUrl: wideLogo, logoMarkUrl: "" },
  });
  await navigate(page, "events");
  await expectTitleStageGeometry(page, { variant: "standard", teamName: "Wide Mark Academy" });
  await expectReadableTeamIdentity(page);
  await capture(page, "stress-390-wide-light-logo");

  await page.setViewportSize({ width: 430, height: 932 });
  const tallLogo = svgDataUrl(120, 620, "#161616", "TALL");
  await mutateActiveDemoIdentity(page, {
    teamName: "Tall Crest Basketball Club",
    branding: { primaryColor: "#1B1B1B", secondaryColor: "#F7F7F7", logoUrl: tallLogo, logoMarkUrl: "" },
  });
  await navigate(page, "leaderboards");
  await expectTitleStageGeometry(page, { variant: "standard", teamName: "Tall Crest Basketball Club" });
  await expectReadableTeamIdentity(page);
  await capture(page, "stress-430-tall-dark-logo");
});