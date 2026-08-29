import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-3a-cross-screen-visual-audit");
const MOBILE_VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 393, height: 852 },
  { width: 402, height: 874 },
  { width: 430, height: 932 },
];

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

test.use({ viewport: { width: 390, height: 844 } });

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) });
  });
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
}

async function suppressMotion(page) {
  await page.addStyleTag({ content: `
    *, *::before, *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      caret-color: transparent !important;
    }
    html, body { scrollbar-width: none !important; }
    ::-webkit-scrollbar { display: none !important; }
  ` });
}

async function stabilize(page) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelector(".player-scroll-container")?.scrollTo(0, 0);
    document.querySelector(".coach-scroll-container")?.scrollTo(0, 0);
  });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(300);
}

async function expectNoHorizontalOverflow(page) {
  const geometry = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(geometry.documentWidth - geometry.viewportWidth).toBeLessThanOrEqual(1);
  expect(geometry.bodyWidth - geometry.viewportWidth).toBeLessThanOrEqual(1);
}

async function expectPlayerIdentityInsideViewport(page) {
  const identity = page.locator('[data-team-identity-stage="true"][data-testid="player-dashboard-identity-header"]:visible').first();
  if (!(await identity.count())) return;
  const geometry = await identity.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const title = element.querySelector('[data-identity-role="page-title"]');
    const crest = element.querySelector('[data-identity-role="brand-mark"]');
    const fallback = element.querySelector('[data-identity-role="brand-fallback"]');
    const crestRect = (crest || fallback)?.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      width: rect.width,
      height: rect.height,
      viewportWidth: window.innerWidth,
      titleSize: title ? Number.parseFloat(getComputedStyle(title).fontSize) : 0,
      crestWidth: crestRect?.width || 0,
      crestHeight: crestRect?.height || 0,
      objectFit: crest ? getComputedStyle(crest).objectFit : "fallback",
      variant: element.getAttribute("data-variant"),
    };
  });
  expect(geometry.left).toBeGreaterThanOrEqual(-0.5);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth + 0.5);
  expect(geometry.width).toBeGreaterThan(300);
  if (geometry.variant === "hero") {
    expect(geometry.height).toBeGreaterThanOrEqual(180);
    expect(geometry.height).toBeLessThanOrEqual(300);
    expect(geometry.titleSize).toBeGreaterThanOrEqual(44);
    expect(geometry.titleSize).toBeLessThanOrEqual(60);
    expect(geometry.crestWidth).toBeGreaterThanOrEqual(104);
    expect(geometry.crestHeight).toBeGreaterThanOrEqual(104);
  } else {
    expect(geometry.titleSize).toBeGreaterThanOrEqual(38);
    expect(geometry.titleSize).toBeLessThanOrEqual(46);
    expect(geometry.crestWidth).toBeGreaterThanOrEqual(84);
    expect(geometry.crestWidth).toBeLessThanOrEqual(108);
    expect(geometry.crestHeight).toBeGreaterThanOrEqual(84);
    expect(geometry.crestHeight).toBeLessThanOrEqual(108);
  }
  if (geometry.objectFit !== "fallback") expect(geometry.objectFit).toBe("contain");
}

async function expectCompactFunctionalIntro(page) {
  const titleStage = page.locator('[data-team-identity-stage="true"]:visible').first();
  if (await titleStage.count()) {
    const geometry = await titleStage.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const title = element.querySelector('[data-identity-role="page-title"]');
      const brandPanel = element.querySelector('[data-identity-role="brand-panel"]');
      const brandPanelRect = brandPanel?.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        width: rect.width,
        titleText: title?.textContent?.trim() || "",
        titleSize: title ? Number.parseFloat(getComputedStyle(title).fontSize) : 0,
        brandPanelWidth: brandPanelRect?.width || 0,
        brandPanelHeight: brandPanelRect?.height || 0,
        viewportWidth: window.innerWidth,
        variant: element.getAttribute("data-variant"),
        family: element.getAttribute("data-title-stage-family"),
        brandTreatment: element.getAttribute("data-brand-treatment"),
      };
    });
    expect(geometry.left).toBeGreaterThanOrEqual(-0.5);
    expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth + 0.5);
    expect(geometry.width).toBeGreaterThan(300);
    expect(geometry.variant).not.toBe("hero");
    expect(geometry.family).toBe("editorial");
    expect(geometry.brandTreatment).toBe("compact");
    expect(geometry.titleSize).toBeGreaterThanOrEqual(38);
    expect(geometry.titleSize).toBeLessThanOrEqual(46);
    const maxBrandPanel = geometry.titleText === "Program Branding" ? 108 : 80;
    expect(geometry.brandPanelWidth).toBeGreaterThanOrEqual(56);
    expect(geometry.brandPanelWidth).toBeLessThanOrEqual(maxBrandPanel);
    expect(geometry.brandPanelHeight).toBeGreaterThanOrEqual(56);
    expect(geometry.brandPanelHeight).toBeLessThanOrEqual(maxBrandPanel);
    return;
  }

  const specializedIntro = page.locator('[data-page-hierarchy="editorial"] [data-layout-role="editorial-header"]:visible').first();
  await expect(specializedIntro).toBeVisible();
  const geometry = await specializedIntro.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const title = element.querySelector("h1");
    return {
      titleSize: title ? Number.parseFloat(getComputedStyle(title).fontSize) : 0,
      left: rect.left,
      right: rect.right,
      viewportWidth: window.innerWidth,
    };
  });
  expect(geometry.left).toBeGreaterThanOrEqual(-0.5);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth + 0.5);
  expect(geometry.titleSize).toBeLessThanOrEqual(44);
}

async function expectProgressStoryCommandSurface(page) {
  const story = page.locator('[data-page-hierarchy="command-story"]');
  await expect(story).toBeVisible();
  const hero = story.locator('[data-layout-role="command-story-header"]');
  await expect(hero).toBeVisible();
  const geometry = await hero.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const title = element.querySelector("h2");
    return {
      height: rect.height,
      titleSize: title ? Number.parseFloat(getComputedStyle(title).fontSize) : 0,
      right: rect.right,
      viewportWidth: window.innerWidth,
    };
  });
  expect(geometry.height).toBeLessThanOrEqual(390);
  expect(geometry.titleSize).toBeLessThanOrEqual(42);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth);
  await expect(page.getByTestId("player-progress-metrics")).toBeVisible();
  await expect(page.getByText("What the work says now", { exact: true })).toBeVisible();
}

async function expectReadablePlayerMetrics(page, testId) {
  const workspace = page.getByTestId(testId);
  await expect(workspace).toBeVisible();
  const contrastRatios = await workspace.locator('[data-layout-role="supporting-evidence"]').evaluate((container) => {
    const metricNodes = [...container.querySelectorAll('[data-metric-role="value"], [data-metric-role="label"], [data-metric-role="detail"]')];
    const parse = (value) => {
      const numbers = (value.match(/\d+(?:\.\d+)?/g) || []).map(Number);
      return { rgb: numbers.slice(0, 3), alpha: numbers.length > 3 ? numbers[3] : 1 };
    };
    const visibleBackground = (element) => {
      let node = element;
      while (node) {
        const parsed = parse(getComputedStyle(node).backgroundColor);
        if (parsed.rgb.length === 3 && parsed.alpha > 0.01) return parsed.rgb;
        node = node.parentElement;
      }
      return [255, 255, 255];
    };
    const luminance = (rgb) => {
      const channel = (value) => {
        const s = value / 255;
        return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4;
      };
      return .2126 * channel(rgb[0]) + .7152 * channel(rgb[1]) + .0722 * channel(rgb[2]);
    };
    const contrast = (a, b) => {
      const l1 = luminance(a);
      const l2 = luminance(b);
      return (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);
    };
    return metricNodes.map((element) => {
      const foreground = parse(getComputedStyle(element).color).rgb;
      const background = visibleBackground(element);
      return contrast(foreground, background);
    });
  });
  expect(contrastRatios.length).toBeGreaterThan(0);
  for (const ratio of contrastRatios) expect(ratio).toBeGreaterThanOrEqual(4.5);
}

async function expectPersistentFeedbackRestored(page) {
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent("shotlab:feedback", { detail: {
      key: "phase-5-connectivity",
      tone: "warning",
      title: "Working offline",
      message: "Training data remains safely on this device.",
      persistent: true,
    } }));
    window.dispatchEvent(new CustomEvent("shotlab:feedback", { detail: {
      tone: "success",
      title: "Team identity saved",
      message: "Your branding update is ready.",
      duration: 80,
    } }));
  });
  await expect(page.getByText("Team identity saved", { exact: true })).toBeVisible();
  await expect(page.getByText("Working offline", { exact: true })).toBeVisible({ timeout: 1_000 });
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent("shotlab:feedback", { detail: { action: "clear", key: "phase-5-connectivity" } }));
  });
  await expect(page.getByText("Working offline", { exact: true })).toHaveCount(0);
}

async function capture(page, fileName, { authenticated = true } = {}) {
  await stabilize(page);
  await expectNoHorizontalOverflow(page);
  if (authenticated) await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible();
  if (authenticated) await expectPlayerIdentityInsideViewport(page);
  const outputPath = path.join(OUTPUT_DIR, fileName);
  await page.screenshot({ path: outputPath, animations: "disabled" });
  expect(fs.statSync(outputPath).size).toBeGreaterThan(20_000);
}

async function resetToAuth(page) {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await suppressMotion(page);
  await expect(page.getByRole("button", { name: /Coach demo/i })).toBeVisible({ timeout: 20_000 });
}

async function enterDemo(page, role) {
  await installSafeRoutes(page);
  await page.goto("/");
  await suppressMotion(page);
  const label = role === "coach" ? /Coach demo/i : /Player demo/i;
  const button = page.getByRole("button", { name: label });
  await expect(button).toBeVisible({ timeout: 20_000 });
  await button.click();
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
    await expect(page.getByTestId("mobile-navigation-sheet")).toHaveCount(0);
  }
  await page.waitForTimeout(250);
}

async function openFirstCoachPlayerDetail(page) {
  const roster = page.locator("#coach-roster-operations");
  await expect(roster).toBeVisible({ timeout: 20_000 });
  const rows = roster.locator('> .fade-up > .phase1RosterRow');
  expect(await rows.count()).toBeGreaterThanOrEqual(1);
  const firstRow = rows.first();
  await expect(firstRow).not.toHaveAttribute("role", "button");
  const profileButton = firstRow.locator('[data-phase1-open-profile="true"]');
  await expect(profileButton).toBeVisible();
  const profileLabel = await profileButton.getAttribute("aria-label");
  const rowName = String(profileLabel || "").replace(/^Open\s+/i, "").replace(/\s+profile$/i, "") || "Player";
  await profileButton.click();
  const drawer = page.getByRole("dialog", { name: rowName });
  await expect(drawer).toBeVisible({ timeout: 10_000 });
  await drawer.getByRole("button", { name: "Open Full Profile", exact: true }).click();
  await expect(page.getByTestId("coach-player-detail-workspace")).toBeVisible({ timeout: 10_000 });
}

test("Phase 3A captures auth and the complete Coach mobile hierarchy at iPhone width", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await installSafeRoutes(page);
  await page.goto("/");
  await suppressMotion(page);
  await expect(page.getByRole("button", { name: /Coach demo/i })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("button", { name: /Player demo/i })).toBeVisible({ timeout: 20_000 });
  await expectPersistentFeedbackRestored(page);
  await capture(page, "01-auth-entry.png", { authenticated: false });

  await page.getByRole("button", { name: /Coach demo/i }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await capture(page, "02-coach-home.png");

  await navigateByKey(page, "players");
  await expectCompactFunctionalIntro(page);
  await capture(page, "03-coach-players.png");

  await openFirstCoachPlayerDetail(page);
  await expectCompactFunctionalIntro(page);
  await capture(page, "04-coach-player-detail.png");

  await navigateByKey(page, "events");
  await expectCompactFunctionalIntro(page);
  await capture(page, "05-coach-schedule.png");

  await navigateByKey(page, "drills");
  await expectCompactFunctionalIntro(page);
  await capture(page, "06-coach-drills.png");

  await navigateByKey(page, "sc");
  await expectCompactFunctionalIntro(page);
  await capture(page, "07-coach-strength.png");

  await navigateByKey(page, "activity");
  await expectCompactFunctionalIntro(page);
  await capture(page, "08-coach-activity.png");

  await navigateByKey(page, "leaderboards");
  await expectCompactFunctionalIntro(page);
  await capture(page, "09-coach-leaderboards.png");

  await navigateByKey(page, "settings");
  await expectCompactFunctionalIntro(page);
  await capture(page, "10-coach-team-account.png");

  await navigateByKey(page, "branding");
  await expect(page.getByTestId("coach-branding-workspace")).toBeVisible({ timeout: 10_000 });
  await expectCompactFunctionalIntro(page);
  await capture(page, "11-coach-program-branding.png", { authenticated: false });

  expect(pageErrors).toEqual([]);
});

test("Phase 3A captures the complete Player training and progress hierarchy at iPhone width", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await enterDemo(page, "player");
  await capture(page, "12-player-home.png");

  await navigateByKey(page, "log-drill");
  await expectReadablePlayerMetrics(page, "player-at-home-workspace");
  await expectCompactFunctionalIntro(page);
  await capture(page, "13-player-train.png");

  await navigateByKey(page, "duels");
  await expectCompactFunctionalIntro(page);
  await capture(page, "14-player-program-training.png");

  await navigateByKey(page, "program");
  await expectCompactFunctionalIntro(page);
  await capture(page, "15-player-events.png");

  await navigateByKey(page, "sc");
  await expectCompactFunctionalIntro(page);
  await capture(page, "16-player-lifting.png");

  await navigateByKey(page, "leaderboards");
  await expectReadablePlayerMetrics(page, "player-leaderboards-workspace");
  await expectCompactFunctionalIntro(page);
  await capture(page, "17-player-rankings.png");

  await navigateByKey(page, "profile");
  await expectProgressStoryCommandSurface(page);
  await capture(page, "18-player-progress.png");

  expect(pageErrors).toEqual([]);
});

test("Phase 3A validates first-impression geometry at 375, 390, 393, 402, and 430px", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await installSafeRoutes(page);

  for (const viewport of MOBILE_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await resetToAuth(page);
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: /Coach demo/i }).click();
    await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
    await navigateByKey(page, "players");
    await stabilize(page);
    await expectCompactFunctionalIntro(page);
    await expectNoHorizontalOverflow(page);
    if (viewport.width === 375 || viewport.width === 430) {
      await page.screenshot({ path: path.join(OUTPUT_DIR, `responsive-coach-players-${viewport.width}.png`), animations: "disabled" });
    }

    await resetToAuth(page);
    await page.getByRole("button", { name: /Player demo/i }).click();
    await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
    await stabilize(page);
    await expectPlayerIdentityInsideViewport(page);
    await expectNoHorizontalOverflow(page);
    await navigateByKey(page, "leaderboards");
    await stabilize(page);
    await expectCompactFunctionalIntro(page);
    await expectNoHorizontalOverflow(page);
    if (viewport.width === 375 || viewport.width === 430) {
      await page.screenshot({ path: path.join(OUTPUT_DIR, `responsive-player-rankings-${viewport.width}.png`), animations: "disabled" });
    }
  }

  expect(pageErrors).toEqual([]);
});
