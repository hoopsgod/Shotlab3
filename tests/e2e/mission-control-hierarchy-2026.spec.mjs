import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

const SCREENSHOT_DIR = "artifacts/mission-control-phase-2";

const rgbChannels = (value = "") => (String(value).match(/\d+(?:\.\d+)?/g) || []).slice(0, 3).map(Number);

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route("**/v1/coach/players/provision**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function expectNoHorizontalOverflow(page) {
  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 2);
}

test.use({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });

test.beforeAll(() => mkdirSync(SCREENSHOT_DIR, { recursive: true }));

test.beforeEach(async ({ page }) => {
  await installSafeRoutes(page);
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
});

test("Coach Mission Control presents one premium mobile hierarchy", async ({ page }) => {
  await page.goto("/");
  const demo = page.getByRole("button", { name: /Coach demo/i });
  await expect(demo).toBeVisible({ timeout: 20_000 });
  await demo.click();

  const commandCenter = page.getByTestId("coach-command-center-full");
  const hero = page.getByTestId("coach-primary-objective");
  const metrics = page.getByTestId("coach-primary-metrics");
  await expect(commandCenter).toBeVisible({ timeout: 20_000 });
  await expect(hero).toBeVisible();
  await expect(metrics).toBeVisible();

  await expect(page.locator(".mcHeader")).toBeVisible();
  await expect(page.locator(".mcHeaderTeamMark")).toBeHidden();
  await expect(page.locator(".mcHeroTeamMark")).toBeVisible();
  await expect(page.locator(".mcTeamSelect")).toBeHidden();
  await expect(page.locator(".mcBell")).toBeVisible();
  await expect(page.locator(".mcMobileMenu")).toBeVisible();
  await expect(page.locator(".mcPrimary")).toBeVisible();
  await expect(metrics.locator("button")).toHaveCount(3);

  const presentation = await page.evaluate(() => {
    const workspace = document.querySelector(".performance-workspace--coach");
    const hero = document.querySelector(".mcHero");
    const heroContent = document.querySelector(".mcHeroContent");
    const identity = hero?.querySelector(".mcHeroIdentity");
    const title = hero?.querySelector("h1");
    const headerMark = document.querySelector(".mcHeaderTeamMark");
    const heroMark = document.querySelector(".mcHeroTeamMark");
    const heroLogo = heroMark?.querySelector("img");
    const heroFallback = heroMark?.querySelector(".mcTeamFallback");
    const primary = document.querySelector(".mcPrimary");
    const section = document.querySelector(".mcSection");
    const reality = document.querySelector(".mcRealityStrip");
    const teamSelect = document.querySelector(".mcTeamSelect");
    const attentionRow = document.querySelector(".mcAttentionRow");
    const attentionTitle = attentionRow?.querySelector(".mcAttentionCopy strong");
    const workspaceStyle = workspace ? getComputedStyle(workspace) : null;
    const heroStyle = getComputedStyle(hero);
    const heroContentStyle = getComputedStyle(heroContent);
    const identityStyle = getComputedStyle(identity);
    const identityTitleStyle = getComputedStyle(identity, "::after");
    const headerMarkStyle = getComputedStyle(headerMark);
    const heroMarkStyle = getComputedStyle(heroMark);
    const heroMarkRect = heroMark.getBoundingClientRect();
    const identityRect = identity.getBoundingClientRect();
    const titleRect = title.getBoundingClientRect();
    const primaryStyle = getComputedStyle(primary);
    const sectionStyle = section ? getComputedStyle(section) : null;
    const realityStyle = getComputedStyle(reality);
    const metricButtons = [...reality.querySelectorAll(":scope > button")];
    const teamSelectStyle = getComputedStyle(teamSelect);
    const attentionStyle = attentionRow ? getComputedStyle(attentionRow) : null;
    const attentionTitleStyle = attentionTitle ? getComputedStyle(attentionTitle) : null;
    return {
      workspaceBackground: workspaceStyle?.backgroundColor || "",
      heroBackgroundImage: heroStyle.backgroundImage,
      heroBackgroundColor: heroStyle.backgroundColor,
      heroMaxHeight: heroStyle.maxHeight,
      heroHeight: hero.getBoundingClientRect().height,
      heroRadius: parseFloat(heroStyle.borderRadius),
      heroContentBackground: heroContentStyle.backgroundColor,
      identityBackground: identityStyle.backgroundColor,
      identityBackgroundImage: identityStyle.backgroundImage,
      identityHeight: identityRect.height,
      identityBottom: identityRect.bottom,
      identityTitleSize: parseFloat(identityTitleStyle.fontSize),
      decisionTitleSize: parseFloat(getComputedStyle(title).fontSize),
      decisionTitleTop: titleRect.top,
      headerMarkDisplay: headerMarkStyle.display,
      heroMarkDisplay: heroMarkStyle.display,
      heroMarkWidth: heroMarkRect.width,
      heroMarkHeight: heroMarkRect.height,
      heroLogoObjectFit: heroLogo ? getComputedStyle(heroLogo).objectFit : (heroFallback ? "fallback" : "missing"),
      primaryBackground: primaryStyle.backgroundColor,
      primaryColor: primaryStyle.color,
      primaryBorder: primaryStyle.border,
      primaryHeight: parseFloat(primaryStyle.minHeight),
      supportingBackground: sectionStyle?.backgroundColor || "",
      metricColumns: realityStyle.gridTemplateColumns.split(" ").filter(Boolean).length,
      metricBackgroundColor: realityStyle.backgroundColor,
      metricBackground: realityStyle.background,
      metricBackgroundImage: realityStyle.backgroundImage,
      metricBorder: realityStyle.border,
      metricValues: metricButtons.map((button) => getComputedStyle(button.querySelector("strong")).color),
      metricLabels: metricButtons.map((button) => getComputedStyle(button.querySelector("small")).color),
      metricButtonBackgrounds: metricButtons.map((button) => getComputedStyle(button).backgroundColor),
      teamSelectDisplay: teamSelectStyle.display,
      attentionBackground: attentionStyle?.backgroundColor || "",
      attentionRadius: attentionStyle ? parseFloat(attentionStyle.borderRadius) : 99,
      attentionShadow: attentionStyle?.boxShadow || "",
      attentionTitleColor: attentionTitleStyle?.color || "",
    };
  });

  expect(presentation.workspaceBackground).toBe("rgb(243, 241, 234)");
  const heroChannels = rgbChannels(presentation.heroBackgroundColor);
  expect(heroChannels).toHaveLength(3);
  expect(Math.min(...heroChannels)).toBeGreaterThan(220);
  expect(["none", "0px"]).toContain(presentation.heroMaxHeight);
  expect(presentation.heroHeight).toBeGreaterThanOrEqual(480);
  expect(presentation.heroHeight).toBeLessThanOrEqual(580);
  expect(presentation.heroRadius).toBeLessThanOrEqual(1);
  const heroContentChannels = rgbChannels(presentation.heroContentBackground);
  expect(heroContentChannels).toHaveLength(3);
  expect(Math.min(...heroContentChannels)).toBeGreaterThan(220);

  const identityChannels = rgbChannels(presentation.identityBackground);
  expect(identityChannels).toHaveLength(3);
  expect(Math.max(...identityChannels)).toBeLessThan(55);
  expect(presentation.identityBackgroundImage).toContain("linear-gradient");
  expect(presentation.identityHeight).toBeGreaterThanOrEqual(170);
  expect(presentation.identityHeight).toBeLessThanOrEqual(300);
  expect(presentation.identityTitleSize).toBeGreaterThanOrEqual(44);
  expect(presentation.identityTitleSize).toBeLessThanOrEqual(60);
  expect(presentation.decisionTitleSize).toBeGreaterThanOrEqual(30);
  expect(presentation.decisionTitleSize).toBeLessThanOrEqual(40);
  expect(presentation.decisionTitleTop).toBeGreaterThanOrEqual(presentation.identityBottom - 1);
  expect(presentation.decisionTitleTop).toBeLessThanOrEqual(presentation.identityBottom + 48);

  expect(presentation.headerMarkDisplay).toBe("none");
  expect(presentation.heroMarkDisplay).not.toBe("none");
  expect(presentation.heroMarkWidth).toBeGreaterThanOrEqual(104);
  expect(presentation.heroMarkHeight).toBeGreaterThanOrEqual(104);
  if (presentation.heroLogoObjectFit !== "fallback") expect(presentation.heroLogoObjectFit).toBe("contain");
  expect(presentation.primaryHeight).toBeGreaterThanOrEqual(44);
  expect(presentation.primaryBackground).not.toBe("rgb(32, 36, 33)");
  expect(presentation.primaryBackground).not.toBe("rgba(0, 0, 0, 0)");
  expect(presentation.primaryColor).toBe("rgb(7, 16, 7)");
  expect(presentation.primaryBorder).toContain("solid");
  expect(presentation.metricColumns).toBe(3);
  expect(presentation.metricBackgroundImage).toContain("linear-gradient");
  expect(presentation.metricBackground).not.toContain("rgba(0, 0, 0, 0) none");
  expect(presentation.metricBorder).toContain("solid");
  expect(presentation.metricValues).toEqual(["rgb(245, 248, 249)", "rgb(245, 248, 249)", "rgb(245, 248, 249)"]);
  expect(presentation.metricLabels).toEqual(["rgb(155, 167, 174)", "rgb(155, 167, 174)", "rgb(155, 167, 174)"]);
  expect(presentation.metricButtonBackgrounds).toEqual(["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)"]);
  expect(presentation.teamSelectDisplay).toBe("none");

  const supportingChannels = rgbChannels(presentation.supportingBackground);
  if (supportingChannels.length === 3) expect(Math.min(...supportingChannels)).toBeGreaterThanOrEqual(230);
  expect(presentation.attentionRadius).toBeLessThanOrEqual(1);
  expect(presentation.attentionShadow).toBe("none");
  expect(presentation.attentionTitleColor).toBe("rgb(17, 26, 33)");
  const attentionChannels = rgbChannels(presentation.attentionBackground);
  if (attentionChannels.length === 3) expect(Math.min(...attentionChannels)).toBeGreaterThanOrEqual(230);

  await expectNoHorizontalOverflow(page);
  await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}" });
  await page.screenshot({ path: `${SCREENSHOT_DIR}/coach-mission-control-390x844.png` });
});
