import { mkdirSync } from "node:fs";
import { test, expect } from "@playwright/test";

const SCREENSHOT_DIR = "artifacts/phase-2-command-hierarchy";

test.use({
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
});

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, archives: [] }),
  }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ leaderboard: [] }),
  }));
  await page.route("**/v1/coach/players/provision**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, invitations: [] }),
  }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: "[]",
  }));
}

async function startClean(page) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}

async function enterDemo(page, role) {
  await page.goto("/");
  const button = page.getByRole("button", { name: role === "coach" ? /Coach demo/i : /Player demo/i });
  await expect(button).toBeVisible({ timeout: 20_000 });
  await button.click();
}

async function disableVisualNoise(page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-delay: 0ms !important;
        transition-duration: 0.01ms !important;
        caret-color: transparent !important;
      }
    `,
  });
}

const colorParts = (value) => (String(value).match(/\d+(?:\.\d+)?/g) || []).map(Number);
const channels = (value) => colorParts(value).slice(0, 3);
const expectDark = (value) => {
  const rgb = channels(value);
  expect(rgb).toHaveLength(3);
  expect(Math.max(...rgb)).toBeLessThan(70);
};
const expectDarkSurface = (value) => {
  const parts = colorParts(value);
  const rgb = parts.slice(0, 3);
  expect(rgb).toHaveLength(3);
  const alpha = parts.length >= 4 ? parts[3] : 1;
  if (alpha < 0.15) {
    expect(alpha).toBeGreaterThanOrEqual(0);
    return;
  }
  expect(Math.max(...rgb)).toBeLessThan(70);
};
const expectLight = (value) => {
  const rgb = channels(value);
  expect(rgb).toHaveLength(3);
  expect(Math.min(...rgb)).toBeGreaterThan(190);
};

test.beforeAll(() => mkdirSync(SCREENSHOT_DIR, { recursive: true }));

test.beforeEach(async ({ page }) => {
  await installSafeRoutes(page);
  await startClean(page);
});

test("Player home presents action, evidence, priority, and disclosure in order", async ({ page }) => {
  await enterDemo(page, "player");
  const root = page.getByTestId("player-daily-command-center");
  const canvas = page.getByTestId("player-performance-canvas");
  const primary = page.getByTestId("player-daily-primary-action");
  const trajectory = page.getByTestId("player-momentum-trajectory");
  const evidence = page.getByTestId("player-canvas-evidence");
  const retiredEvidence = page.getByTestId("player-command-evidence");
  const priority = page.getByTestId("player-coach-priority-signal");
  const disclosure = page.getByTestId("player-progress-disclosure");

  await expect(root).toBeVisible({ timeout: 20_000 });
  await expect(root).toHaveAttribute("data-phase", "phase-2-command-hierarchy");
  await expect(root).toHaveAttribute("data-phase2-composition", "edge-to-edge-performance-story");
  await expect(canvas).toBeVisible();
  await expect(primary).toBeVisible();
  await expect(root.getByRole("heading", { level: 1 })).toContainText("Daily work banked.");
  await expect(trajectory).toBeVisible();
  await expect(evidence).toBeVisible();
  await expect(retiredEvidence).toBeHidden();
  await expect(priority).toBeVisible();
  await expect(disclosure).toBeVisible();

  const presentation = await page.evaluate(() => {
    const style = (selector) => {
      const element = document.querySelector(selector);
      return element ? getComputedStyle(element) : null;
    };
    const top = (selector) => document.querySelector(selector)?.getBoundingClientRect().top ?? -1;
    const rootStyle = style('[data-testid="player-daily-command-center"]');
    const heroStyle = style('[data-command-role="primary"]');
    const titleStyle = style('[data-command-role="primary"] h1');
    const primaryButtonStyle = style('[data-testid="player-daily-primary-action"]');
    const primaryButtonLabel = document.querySelector('[data-testid="player-daily-primary-action"] span');
    const primaryButtonLabelStyle = primaryButtonLabel ? getComputedStyle(primaryButtonLabel) : null;
    const evidenceStyle = style('[data-testid="player-canvas-evidence"] > div');
    const nextStyle = style('[data-command-role="next-actions"]');
    const disclosureStyle = style('[data-command-role="progress-details"]');
    const activationStyle = style('[data-command-role="activation"]');

    const matchedLabelColorRules = [];
    const inspectRules = (rules, source) => {
      for (const rule of rules || []) {
        if (rule.cssRules) {
          inspectRules(rule.cssRules, source);
          continue;
        }
        if (!rule.selectorText || !primaryButtonLabel) continue;
        let matches = false;
        try { matches = primaryButtonLabel.matches(rule.selectorText); } catch { matches = false; }
        if (!matches) continue;
        const color = rule.style?.getPropertyValue("color") || "";
        const fill = rule.style?.getPropertyValue("-webkit-text-fill-color") || "";
        if (color || fill) matchedLabelColorRules.push({
          source,
          selector: rule.selectorText,
          color,
          fill,
          colorPriority: rule.style?.getPropertyPriority("color") || "",
          fillPriority: rule.style?.getPropertyPriority("-webkit-text-fill-color") || "",
        });
      }
    };
    for (const sheet of [...document.styleSheets]) {
      try { inspectRules(sheet.cssRules, sheet.href || sheet.ownerNode?.id || "inline-style"); } catch { /* same-origin sheets only */ }
    }

    return {
      positions: {
        primary: top('[data-command-role="primary"]'),
        trajectory: top('[data-testid="player-momentum-trajectory"]'),
        evidence: top('[data-testid="player-canvas-evidence"]'),
        priority: top('[data-command-role="coach-priority"]'),
        nextActions: top('[data-command-role="next-actions"]'),
        progress: top('[data-command-role="progress-details"]'),
      },
      rootBackground: rootStyle?.backgroundColor || "",
      heroBackground: heroStyle?.backgroundColor || "",
      heroTitle: titleStyle?.color || "",
      primaryButtonColor: primaryButtonStyle?.color || "",
      primaryButtonFill: primaryButtonStyle?.webkitTextFillColor || "",
      primaryButtonLabelColor: primaryButtonLabelStyle?.color || "",
      primaryButtonLabelFill: primaryButtonLabelStyle?.webkitTextFillColor || "",
      matchedLabelColorRules,
      evidenceBackground: evidenceStyle?.backgroundColor || "",
      nextBackground: nextStyle?.backgroundColor || "",
      disclosureBackground: disclosureStyle?.backgroundColor || "",
      activationBackground: activationStyle?.backgroundColor || "",
    };
  });

  expect(presentation.positions.primary).toBeGreaterThanOrEqual(0);
  expect(presentation.positions.trajectory).toBeGreaterThan(presentation.positions.primary);
  expect(presentation.positions.evidence).toBeGreaterThan(presentation.positions.primary);
  expect(presentation.positions.priority).toBeGreaterThan(presentation.positions.evidence);
  if (presentation.positions.nextActions >= 0) expect(presentation.positions.progress).toBeGreaterThan(presentation.positions.nextActions);

  expect(presentation.rootBackground).toBe("rgba(0, 0, 0, 0)");
  expectDark(presentation.heroBackground);
  expectLight(presentation.heroTitle);
  expect(presentation.primaryButtonFill).toBe(presentation.primaryButtonColor);
  expect(presentation.primaryButtonLabelColor, JSON.stringify(presentation.matchedLabelColorRules, null, 2)).toBe(presentation.primaryButtonColor);
  expect(presentation.primaryButtonLabelFill).toBe(presentation.primaryButtonColor);
  expect(presentation.evidenceBackground).toBe("rgba(0, 0, 0, 0)");
  if (presentation.positions.nextActions >= 0) expect(presentation.nextBackground).toBe("rgba(0, 0, 0, 0)");
  expect(presentation.disclosureBackground).toBe("rgba(0, 0, 0, 0)");
  if (presentation.activationBackground) expect(presentation.activationBackground).toBe("rgba(0, 0, 0, 0)");

  await disclosure.scrollIntoViewIfNeeded();
  const progressOpen = await disclosure.evaluate((element) => element.open);
  if (!progressOpen) await disclosure.locator("summary").click();
  await expect(disclosure).toHaveAttribute("open", "");
  await expect(page.getByTestId("player-daily-momentum-signal")).toBeVisible();

  await disableVisualNoise(page);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/player-home-390x844.png`, fullPage: true });
});

test("Coach home keeps the primary decision and evidence compact on iPhone", async ({ page }) => {
  await enterDemo(page, "coach");
  const commandCenter = page.getByTestId("coach-command-center-full");
  const objective = page.getByTestId("coach-primary-objective");
  const metrics = page.getByTestId("coach-primary-metrics");

  await expect(commandCenter).toBeVisible({ timeout: 20_000 });
  await expect(objective).toBeVisible();
  await expect(metrics).toBeVisible();
  await expect(commandCenter).toHaveAttribute("data-home-hierarchy", "decision-first");
  await expect(objective).toHaveAttribute("data-home-role", "primary");

  const onboarding = page.getByTestId("coach-onboarding-state");
  if (await onboarding.count()) {
    await expect(onboarding).toHaveAttribute("data-home-role", "supporting");
    const onboardingTreatment = await onboarding.evaluate((element) => {
      const surface = getComputedStyle(element);
      const accent = getComputedStyle(element, "::before");
      return {
        surfaceBackground: surface.backgroundImage,
        accentWidth: Number.parseFloat(accent.width),
        accentInset: accent.inset,
      };
    });
    expect(onboardingTreatment.surfaceBackground).toContain("linear-gradient");
    expect(onboardingTreatment.accentWidth).toBeLessThanOrEqual(6);
    expect(onboardingTreatment.accentInset).not.toBe("0px");
  }

  const heroBox = await objective.boundingBox();
  expect(heroBox).not.toBeNull();
  expect(heroBox.height).toBeLessThanOrEqual(520);

  await disableVisualNoise(page);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/coach-home-390x844.png`, fullPage: true });
});

test("Player desktop keeps one priority card in the decision rail", async ({ page }) => {
  await page.setViewportSize({ width: 1363, height: 936 });
  await enterDemo(page, "player");

  const rail = page.getByTestId("player-operational-insight-rail");
  await expect(rail).toBeVisible({ timeout: 20_000 });
  await expect(rail).toHaveAttribute("data-density", "decision-first");
  await expect(rail.getByRole("heading", { level: 2 })).toContainText("Daily brief");

  const cards = rail.locator("article");
  await expect(cards).toHaveCount(3);
  await expect(cards.first()).toHaveAttribute("data-rail-role", "primary");
  await expect(cards.nth(1)).toHaveAttribute("data-rail-role", "supporting");
  await expect(cards.nth(2)).toContainText("1 RSVP needs a response");

  const materials = await cards.evaluateAll((elements) => elements.map((element) => ({
    role: element.dataset.railRole,
    background: getComputedStyle(element).backgroundColor,
    color: getComputedStyle(element.querySelector("h3")).color,
  })));
  expect(materials[0].role).toBe("primary");
  expect(Math.max(...colorParts(materials[0].color).slice(0, 3))).toBeGreaterThan(220);
  expect(Math.min(...colorParts(materials[1].background).slice(0, 3))).toBeGreaterThan(220);

  await disableVisualNoise(page);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/player-home-desktop-1363x936.png`, fullPage: false });
});
