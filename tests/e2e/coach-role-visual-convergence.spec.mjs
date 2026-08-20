import { test, expect } from "@playwright/test";

const NAVY_RGB = ["rgb(11, 38, 51)", "rgb(7, 24, 32)"];

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
  expect(metrics.crestWidth).toBeGreaterThanOrEqual(84);
  expect(metrics.crestWidth).toBeLessThanOrEqual(108);
  expect(metrics.titleSize).toBeGreaterThanOrEqual(38);
  expect(metrics.titleSize).toBeLessThanOrEqual(46);
}

async function expectNavyDecision(page, locator = page.locator('[data-visual-role="primary-decision"]:visible').first()) {
  await expect(locator).toBeVisible({ timeout: 10_000 });
  const style = await locator.evaluate((element) => {
    const computed = getComputedStyle(element);
    const action = element.querySelector('button[data-action-role="primary"], button');
    const actionStyle = action ? getComputedStyle(action) : null;
    return {
      backgroundImage: computed.backgroundImage,
      radius: Number.parseFloat(computed.borderRadius) || 0,
      actionHeight: action ? action.getBoundingClientRect().height : 0,
      actionBackground: actionStyle?.backgroundColor || "",
    };
  });
  for (const color of NAVY_RGB) expect(style.backgroundImage).toContain(color);
  expect(style.radius).toBeGreaterThanOrEqual(18);
  if (style.actionHeight) expect(style.actionHeight).toBeGreaterThanOrEqual(44);
}

async function openFirstCoachPlayerDetail(page) {
  const roster = page.locator("#coach-roster-operations");
  await expect(roster).toBeVisible({ timeout: 20_000 });
  const row = roster.locator('> .fade-up > [role="button"]').first();
  await expect(row).toBeVisible();
  const rowName = (await row.locator("span").first().textContent())?.trim() || "Player";
  await row.click({ position: { x: 18, y: 18 } });
  const drawer = page.getByRole("dialog", { name: rowName });
  await expect(drawer).toBeVisible({ timeout: 10_000 });
  await drawer.getByRole("button", { name: "Open Full Profile", exact: true }).click();
  await expect(page.getByTestId("coach-player-detail-workspace")).toBeVisible({ timeout: 10_000 });
}

test("every Coach mobile destination uses the converged navy/cream product grammar", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await enterCoachDemo(page);

  await expect(page.getByTestId("coach-primary-objective")).toBeVisible({ timeout: 20_000 });
  const home = await page.getByTestId("coach-primary-objective").evaluate((element) => ({
    heroBackground: getComputedStyle(element).backgroundColor,
    identityBackground: getComputedStyle(element.querySelector('.mcHeroIdentity')).backgroundImage,
    decisionBackground: getComputedStyle(element.querySelector('h1')).backgroundImage,
  }));
  expect(home.heroBackground).toBe("rgb(244, 241, 233)");
  for (const color of NAVY_RGB) {
    expect(home.identityBackground).toContain(color);
    expect(home.decisionBackground).toContain(color);
  }
  await expectNoHorizontalOverflow(page);

  for (const key of ["players", "events", "drills", "sc", "activity", "leaderboards"]) {
    await navigateByKey(page, key);
    await expectEditorialTitle(page);
    await expectNavyDecision(page);
    await expectNoHorizontalOverflow(page);
  }

  await navigateByKey(page, "players");
  await openFirstCoachPlayerDetail(page);
  await expectEditorialTitle(page);
  const profileHero = page.locator(".coachPlayerProfileHero");
  await expect(profileHero).toBeVisible();
  const profile = await profileHero.evaluate((element) => ({
    backgroundImage: getComputedStyle(element).backgroundImage,
    metricBackground: getComputedStyle(document.querySelector('.coachPlayerProfileMetrics')).backgroundColor,
  }));
  for (const color of NAVY_RGB) expect(profile.backgroundImage).toContain(color);
  expect(profile.metricBackground).toBe("rgb(255, 255, 255)");
  await expectNoHorizontalOverflow(page);

  await navigateByKey(page, "settings");
  await expectEditorialTitle(page);
  const administration = page.locator(".coachAdministrationWorkspace");
  await expect(administration).toBeVisible({ timeout: 10_000 });
  const floatingAdminSurfaces = administration.locator(".coachSeasonArchivePanel, .coachAdministrationCard, .seasonArchiveDetail");
  if (await floatingAdminSurfaces.count()) {
    const shadows = await floatingAdminSurfaces.evaluateAll((elements) => elements.map((element) => getComputedStyle(element).boxShadow));
    for (const shadow of shadows) expect(shadow).toBe("none");
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
      controlsBackground: controls ? getComputedStyle(controls).backgroundColor : "",
      controlsShadow: controls ? getComputedStyle(controls).boxShadow : "missing",
    };
  });
  for (const color of NAVY_RGB) expect(brandingPresentation.previewBackground).toContain(color);
  expect(brandingPresentation.controlsBackground).toBe("rgb(255, 255, 255)");
  expect(brandingPresentation.controlsShadow).toBe("none");
  await expectNoHorizontalOverflow(page);

  expect(pageErrors).toEqual([]);
});
