import { test, expect } from "@playwright/test";

function rgbStops(background = "") {
  return [...String(background).matchAll(/\brgb\((\d+),\s*(\d+),\s*(\d+)\)/g)]
    .map((match) => match.slice(1, 4).map(Number));
}

function relativeLuminance([r, g, b]) {
  const channels = [r, g, b].map((value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
}

function expectDarkBrandedBackground(backgroundImage, backgroundColor = "") {
  const stops = backgroundImage && backgroundImage !== "none"
    ? rgbStops(backgroundImage)
    : rgbStops(backgroundColor);
  expect(stops.length).toBeGreaterThan(0);
  for (const stop of stops) expect(relativeLuminance(stop)).toBeLessThan(0.18);
}

test.use({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route("**/v1/coach/players/provision**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function enterCoachDemo(page) {
  await installSafeRoutes(page);
  await page.goto("/");
  await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}" });
  const demo = page.getByRole("button", { name: /Coach demo/i });
  await expect(demo).toBeVisible({ timeout: 20_000 });
  await demo.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

async function navigateByKey(page, key) {
  const dock = page.getByTestId("mobile-navigation-dock");
  const direct = dock.locator(`[data-nav-key="${key}"]`);
  if (await direct.count()) {
    await direct.click();
  } else {
    await page.getByTestId("mobile-navigation-more").click();
    const sheet = page.getByTestId("mobile-navigation-sheet");
    await expect(sheet).toBeVisible();
    const item = sheet.locator(`[data-nav-key="${key}"]`);
    await expect(item).toBeVisible();
    await item.click();
  }
  await page.waitForTimeout(180);
}

async function expectNoHorizontalOverflow(page) {
  const geometry = await page.evaluate(() => ({ viewport: innerWidth, doc: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  expect(geometry.doc - geometry.viewport).toBeLessThanOrEqual(1);
  expect(geometry.body - geometry.viewport).toBeLessThanOrEqual(1);
}

async function expectEditorialTitle(page) {
  const title = page.locator('[data-team-identity-stage="true"][data-title-stage-family="editorial"]:visible').first();
  await expect(title).toBeVisible({ timeout: 10_000 });
  const metrics = await title.evaluate((element) => {
    const crest = element.querySelector('[data-identity-role="brand-mark"], [data-identity-role="brand-fallback"]');
    const titleNode = element.querySelector('[data-identity-role="page-title"]');
    const crestRect = crest?.getBoundingClientRect();
    return {
      crestWidth: crestRect?.width || 0,
      titleSize: titleNode ? Number.parseFloat(getComputedStyle(titleNode).fontSize) : 0,
    };
  });
  // Secondary editorial identity is intentionally compact and subordinate to
  // the page title; this matches the current 64–80px mobile authority.
  expect(metrics.crestWidth).toBeGreaterThanOrEqual(64);
  expect(metrics.crestWidth).toBeLessThanOrEqual(80);
  expect(metrics.titleSize).toBeGreaterThanOrEqual(38);
  expect(metrics.titleSize).toBeLessThanOrEqual(46);
}

async function expectDarkDecision(page, locator = page.locator('[data-visual-role="primary-decision"]:visible').first()) {
  await expect(locator).toBeVisible({ timeout: 10_000 });
  const style = await locator.evaluate((element) => {
    const computed = getComputedStyle(element);
    const action = element.querySelector('button[data-action-role="primary"], button');
    const actionStyle = action ? getComputedStyle(action) : null;
    return {
      backgroundImage: computed.backgroundImage,
      backgroundColor: computed.backgroundColor,
      radius: Number.parseFloat(computed.borderRadius) || 0,
      actionHeight: action ? action.getBoundingClientRect().height : 0,
      actionBackground: actionStyle?.backgroundColor || "",
    };
  });
  expectDarkBrandedBackground(style.backgroundImage, style.backgroundColor);
  // Phase 4 supports both integrated full-bleed stages (square) and bounded
  // card-like stages (intentionally rounded). Reject accidental small radii,
  // not the deliberate zero-radius integrated composition.
  expect(style.radius === 0 || style.radius >= 18).toBe(true);
  if (style.actionHeight) expect(style.actionHeight).toBeGreaterThanOrEqual(44);
}

async function openFirstCoachPlayerDetail(page) {
  const roster = page.locator("#coach-roster-operations");
  await expect(roster).toBeVisible({ timeout: 20_000 });
  const row = roster.locator('> .fade-up > .phase1RosterRow').first();
  await expect(row).toBeVisible();
  await expect(row).not.toHaveAttribute("role", "button");
  const profileButton = row.locator('[data-phase1-open-profile="true"]');
  await expect(profileButton).toBeVisible();
  const profileLabel = await profileButton.getAttribute("aria-label");
  const rowName = String(profileLabel || "").replace(/^Open\s+/i, "").replace(/\s+profile$/i, "") || "Player";
  await profileButton.click();
  const drawer = page.getByRole("dialog", { name: rowName });
  await expect(drawer).toBeVisible({ timeout: 10_000 });
  await drawer.getByRole("button", { name: "Open Full Profile", exact: true }).click();
  await expect(page.getByTestId("coach-player-detail-workspace")).toBeVisible({ timeout: 10_000 });
}

test("every Coach mobile destination uses the converged branded-dark/cream product grammar", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await enterCoachDemo(page);

  await expect(page.getByTestId("coach-primary-objective")).toBeVisible({ timeout: 20_000 });
  const home = await page.getByTestId("coach-primary-objective").evaluate((element) => {
    const identity = element.querySelector('.mcHeroIdentity');
    const title = element.querySelector('h1');
    const crest = element.querySelector('.mcHeroTeamMark');
    const computed = getComputedStyle(element);
    return {
      heroBackgroundImage: computed.backgroundImage,
      heroBackgroundColor: computed.backgroundColor,
      identityBackground: identity ? getComputedStyle(identity).backgroundImage : "missing",
      decisionBackground: title ? getComputedStyle(title).backgroundImage : "missing",
      titleColor: title ? getComputedStyle(title).color : "missing",
      crestWidth: crest?.getBoundingClientRect().width || 0,
    };
  });
  expectDarkBrandedBackground(home.heroBackgroundImage, home.heroBackgroundColor);
  expect(home.identityBackground).toBe("none");
  expect(home.decisionBackground).toBe("none");
  expect(home.titleColor).toBe("rgb(245, 248, 249)");
  // Coach Home retains a larger identity mark than secondary pages, but the
  // current compact authority intentionally scales it within 80–96px.
  expect(home.crestWidth).toBeGreaterThanOrEqual(80);
  expect(home.crestWidth).toBeLessThanOrEqual(96);
  await expectNoHorizontalOverflow(page);

  // Phase 4 deliberately retires the stacked Players decision card on mobile.
  // Verify the live editorial/filter/roster hierarchy there; the other
  // operational routes retain a visible branded decision stage.
  await navigateByKey(page, "players");
  await expectEditorialTitle(page);
  await expect(page.getByTestId("coach-players-interactive-dashboard")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("coach-players-filter-rail")).toBeVisible();
  await expect(page.locator("#coach-roster-operations")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  const operationalRoutes = [
    ["events", "coach-events-decision-brief"],
    ["drills", "coach-page-dashboard-drills-decision-brief"],
    ["sc", "coach-page-dashboard-strength-decision-brief"],
    ["leaderboards", "coach-page-dashboard-leaderboards-decision-brief"],
  ];
  for (const [key, decisionTestId] of operationalRoutes) {
    await navigateByKey(page, key);
    await expectEditorialTitle(page);
    const decision = page.getByTestId(decisionTestId);
    await expect(decision).toHaveAttribute("data-visual-role", "primary-decision", { timeout: 10_000 });
    await expectDarkDecision(page, decision);
    await expectNoHorizontalOverflow(page);
  }

  // Activity is an intelligence/evidence destination, not a primary-decision route.
  // It still must preserve the converged editorial title and mobile containment.
  await navigateByKey(page, "activity");
  await expectEditorialTitle(page);
  await expect(page.getByTestId("coach-activity-intelligence-panel")).toBeVisible({ timeout: 10_000 });
  await expectNoHorizontalOverflow(page);

  await navigateByKey(page, "players");
  await openFirstCoachPlayerDetail(page);
  await expectEditorialTitle(page);
  const profileHero = page.locator(".coachPlayerProfileHero");
  await expect(profileHero).toBeVisible();
  const profile = await profileHero.evaluate((element) => ({
    backgroundImage: getComputedStyle(element).backgroundImage,
    backgroundColor: getComputedStyle(element).backgroundColor,
    metricBackground: getComputedStyle(document.querySelector('.coachPlayerProfileMetrics')).backgroundColor,
  }));
  expectDarkBrandedBackground(profile.backgroundImage, profile.backgroundColor);
  expect(profile.metricBackground).toBe("rgb(255, 255, 255)");
  await expectNoHorizontalOverflow(page);

  await navigateByKey(page, "settings");
  await expectEditorialTitle(page);
  const administration = page.locator(".coachAdministrationWorkspace");
  await expect(administration).toBeVisible({ timeout: 10_000 });
  const floatingAdminSurfaces = administration.locator(".coachSeasonArchivePanel, .coachAdministrationCard, .seasonArchiveDetail");
  if (await floatingAdminSurfaces.count()) {
    const shadows = await floatingAdminSurfaces.evaluateAll((elements) => elements.map((element) => getComputedStyle(element).boxShadow));
    for (const shadow of shadows) {
      const alphas = [...shadow.matchAll(/rgba\([^)]*,\s*([\d.]+)\)/g)].map((match) => Number(match[1]));
      expect(Math.max(0, ...alphas)).toBeLessThanOrEqual(.08);
    }
  }
  await expectNoHorizontalOverflow(page);

  await navigateByKey(page, "branding");
  const branding = page.getByTestId("coach-branding-workspace");
  await expect(branding).toBeVisible({ timeout: 10_000 });
  await expectEditorialTitle(page);
  const brandingPresentation = await branding.evaluate((element) => {
    const preview = element.querySelector('[data-visual-role="branding-preview"]');
    const controls = element.querySelector('[data-visual-role="branding-controls"]');
    return {
      previewBackground: preview ? getComputedStyle(preview).backgroundImage : "",
      previewBackgroundColor: preview ? getComputedStyle(preview).backgroundColor : "",
      controlsBackground: controls ? getComputedStyle(controls).backgroundColor : "",
      controlsShadow: controls ? getComputedStyle(controls).boxShadow : "missing",
    };
  });
  expectDarkBrandedBackground(brandingPresentation.previewBackground, brandingPresentation.previewBackgroundColor);
  expect(brandingPresentation.controlsBackground).toBe("rgb(255, 255, 255)");
  expect(brandingPresentation.controlsShadow).toBe("none");
  await expectNoHorizontalOverflow(page);

  expect(pageErrors).toEqual([]);
});