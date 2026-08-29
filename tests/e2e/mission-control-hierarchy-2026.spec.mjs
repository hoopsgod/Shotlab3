import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

const SCREENSHOT_DIR = "artifacts/mission-control-phase-2";

const rgbChannels = (value = "") => (String(value).match(/\d+(?:\.\d+)?/g) || []).slice(0, 3).map(Number);
const rgbStops = (value = "") => [...String(value).matchAll(/\brgb\((\d+),\s*(\d+),\s*(\d+)\)/g)].map((match) => match.slice(1, 4).map(Number));
const relativeLuminance = ([r, g, b]) => {
  const channels = [r, g, b].map((value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
};
const isTransparent = (value = "") => ["transparent", "rgba(0, 0, 0, 0)"].includes(String(value));

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route("**/v1/coach/players/provision**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function expectNoHorizontalOverflow(page) {
  const widths = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 2);
}

test.use({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
test.beforeAll(() => mkdirSync(SCREENSHOT_DIR, { recursive: true }));
test.beforeEach(async ({ page }) => {
  await installSafeRoutes(page);
  await page.addInitScript(() => { window.localStorage.clear(); window.sessionStorage.clear(); });
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

  await expect(page.locator(".mcHeader")).toBeHidden();
  await expect(page.locator(".mcHeaderTeamMark")).toBeHidden();
  await expect(page.locator(".mcTeamSelect")).toBeHidden();
  await expect(page.locator(".mcBell")).toBeHidden();
  await expect(page.locator(".mcMobileMenu")).toBeHidden();

  await expect(page.locator(".mcHeroTeamMark")).toBeVisible();
  await expect(page.locator(".mcCourtArtwork")).toBeHidden();
  await expect(page.locator(".mcHeroScrim")).toBeHidden();
  await expect(page.locator(".mcPrimary")).toBeVisible();
  await expect(metrics.locator("button")).toHaveCount(3);

  const presentation = await page.evaluate(() => {
    const workspace = document.querySelector(".performance-workspace--coach");
    const hero = document.querySelector(".mcHero");
    const heroContent = document.querySelector(".mcHeroContent");
    const identity = hero?.querySelector(".mcHeroIdentity");
    const programIdentity = hero?.querySelector(".mcProgramIdentity");
    const title = hero?.querySelector("h1");
    const heroMark = document.querySelector(".mcHeroTeamMark");
    const heroLogo = heroMark?.querySelector("img");
    const heroFallback = heroMark?.querySelector(".mcTeamFallback");
    const primary = document.querySelector(".mcPrimary");
    const section = document.querySelector(".mcSection");
    const reality = document.querySelector(".mcRealityStrip");
    const attentionRow = document.querySelector(".mcAttentionRow");
    const attentionTitle = attentionRow?.querySelector(".mcAttentionCopy strong");
    const effectiveBackground = (element) => {
      let current = element;
      while (current) {
        const value = getComputedStyle(current).backgroundColor;
        if (value && value !== "transparent" && value !== "rgba(0, 0, 0, 0)") return value;
        current = current.parentElement;
      }
      return getComputedStyle(document.body).backgroundColor;
    };
    const heroStyle = getComputedStyle(hero);
    const heroContentStyle = getComputedStyle(heroContent);
    const identityStyle = getComputedStyle(identity);
    const heroMarkStyle = getComputedStyle(heroMark);
    const heroMarkRect = heroMark.getBoundingClientRect();
    const identityRect = identity.getBoundingClientRect();
    const titleRect = title.getBoundingClientRect();
    const primaryStyle = getComputedStyle(primary);
    const sectionStyle = section ? getComputedStyle(section) : null;
    const realityStyle = getComputedStyle(reality);
    const metricButtons = [...reality.querySelectorAll(":scope > button")];
    const attentionStyle = attentionRow ? getComputedStyle(attentionRow) : null;
    const attentionTitleStyle = attentionTitle ? getComputedStyle(attentionTitle) : null;
    return {
      workspaceBackground: effectiveBackground(workspace),
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
      programIdentitySize: parseFloat(getComputedStyle(programIdentity).fontSize),
      programIdentityTransform: getComputedStyle(programIdentity).textTransform,
      decisionTitleSize: parseFloat(getComputedStyle(title).fontSize),
      decisionTitleFamily: getComputedStyle(title).fontFamily,
      decisionTitleTop: titleRect.top,
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
      metricBorder: realityStyle.borderBottom,
      metricValues: metricButtons.map((button) => getComputedStyle(button.querySelector("strong")).color),
      metricLabels: metricButtons.map((button) => getComputedStyle(button.querySelector("small")).color),
      metricButtonBackgrounds: metricButtons.map((button) => getComputedStyle(button).backgroundColor),
      attentionPresent: Boolean(attentionRow),
      attentionBackground: attentionStyle?.backgroundColor || "",
      attentionRadius: attentionStyle ? parseFloat(attentionStyle.borderRadius) : 0,
      attentionShadow: attentionStyle?.boxShadow || "",
      attentionTitleColor: attentionTitleStyle?.color || "",
    };
  });

  const workspaceChannels = rgbChannels(presentation.workspaceBackground);
  expect(workspaceChannels).toHaveLength(3);
  expect(Math.min(...workspaceChannels)).toBeGreaterThanOrEqual(235);
  expect(Math.max(...workspaceChannels) - Math.min(...workspaceChannels)).toBeLessThanOrEqual(12);
  expect(relativeLuminance(workspaceChannels)).toBeGreaterThan(0.84);

  const heroStops = rgbStops(presentation.heroBackgroundImage);
  const heroSurfaceStops = heroStops.length ? heroStops : [rgbChannels(presentation.heroBackgroundColor)];
  expect(heroSurfaceStops[0]).toHaveLength(3);
  expect(heroSurfaceStops.every((stop) => relativeLuminance(stop) < 0.18)).toBe(true);
  expect(["none", "0px"]).toContain(presentation.heroMaxHeight);
  expect(presentation.heroHeight).toBeGreaterThanOrEqual(334);
  expect(presentation.heroHeight).toBeLessThanOrEqual(390);
  expect(presentation.heroRadius).toBeLessThanOrEqual(1);
  expect(isTransparent(presentation.heroContentBackground)).toBe(true);

  expect(isTransparent(presentation.identityBackground)).toBe(true);
  expect(presentation.identityBackgroundImage).toBe("none");
  expect(presentation.identityHeight).toBeGreaterThanOrEqual(80);
  expect(presentation.identityHeight).toBeLessThanOrEqual(100);
  expect(presentation.programIdentitySize).toBeGreaterThanOrEqual(10);
  expect(presentation.programIdentitySize).toBeLessThanOrEqual(12);
  expect(presentation.programIdentityTransform).toBe("uppercase");
  // Chromium's effective visual scale for the production shell resolves the
  // 40px source clamp to ~36.7px at 390px. Guard the rendered hierarchy rather
  // than a source-only number while retaining the condensed display family.
  expect(presentation.decisionTitleSize).toBeGreaterThanOrEqual(36);
  expect(presentation.decisionTitleSize).toBeLessThanOrEqual(44);
  expect(presentation.decisionTitleFamily).toMatch(/Barlow Condensed|Arial Narrow/i);
  expect(presentation.decisionTitleTop).toBeGreaterThanOrEqual(presentation.identityBottom - 1);
  expect(presentation.decisionTitleTop).toBeLessThanOrEqual(presentation.identityBottom + 32);

  expect(presentation.heroMarkDisplay).not.toBe("none");
  expect(presentation.heroMarkWidth).toBeGreaterThanOrEqual(80);
  expect(presentation.heroMarkHeight).toBeGreaterThanOrEqual(80);
  expect(presentation.heroMarkWidth).toBeLessThanOrEqual(94);
  expect(presentation.heroMarkHeight).toBeLessThanOrEqual(94);
  if (presentation.heroLogoObjectFit !== "fallback") expect(presentation.heroLogoObjectFit).toBe("contain");

  expect(presentation.primaryHeight).toBeGreaterThanOrEqual(44);
  expect(presentation.primaryBackground).not.toBe("rgb(32, 36, 33)");
  expect(presentation.primaryBackground).not.toBe("rgba(0, 0, 0, 0)");
  const primaryTextChannels = rgbChannels(presentation.primaryColor);
  expect(primaryTextChannels).toHaveLength(3);
  expect(Math.max(...primaryTextChannels)).toBeLessThan(80);
  expect(presentation.primaryBorder).toContain("solid");

  expect(presentation.metricColumns).toBe(3);
  expect(presentation.metricBackgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(presentation.metricBorder).toContain("solid");
  expect(presentation.metricValues.every((color) => {
    const channels = rgbChannels(color);
    return channels.length === 3 && relativeLuminance(channels) > 0.55;
  })).toBe(true);
  expect(presentation.metricLabels.every((color) => {
    const channels = rgbChannels(color);
    return channels.length === 3 && Math.min(...channels) > 120 && Math.max(...channels) < 230;
  })).toBe(true);
  expect(presentation.metricButtonBackgrounds).toEqual(["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)"]);

  const supportingChannels = rgbChannels(presentation.supportingBackground);
  if (!isTransparent(presentation.supportingBackground) && supportingChannels.length === 3) expect(Math.min(...supportingChannels)).toBeGreaterThanOrEqual(230);
  if (presentation.attentionPresent) {
    expect(presentation.attentionRadius).toBeLessThanOrEqual(1);
    expect(presentation.attentionShadow).not.toBe("none");
    expect(presentation.attentionTitleColor).toBe("rgb(17, 26, 33)");
    const attentionChannels = rgbChannels(presentation.attentionBackground);
    if (!isTransparent(presentation.attentionBackground) && attentionChannels.length === 3) expect(Math.min(...attentionChannels)).toBeGreaterThanOrEqual(230);
  }

  await expectNoHorizontalOverflow(page);
  await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}" });
  await page.screenshot({ path: `${SCREENSHOT_DIR}/coach-mission-control-390x844.png` });
});
