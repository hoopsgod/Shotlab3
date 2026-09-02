import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-3a-cross-screen-visual-audit");
const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 393, height: 852 },
  { width: 402, height: 874 },
  { width: 430, height: 932 },
];
const SCREENSHOT_WIDTHS = new Set([375, 390, 430]);
const DEEP_AUDIT_WIDTHS = new Set([390, 430]);

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

async function resetToAuth(page) {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await suppressMotion(page);
  await expect(page.getByRole("button", { name: /Player demo/i })).toBeVisible({ timeout: 20_000 });
}

async function enterDemo(page, role) {
  await resetToAuth(page);
  const label = role === "coach" ? /Coach demo/i : /Player demo/i;
  await page.getByRole("button", { name: label }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(250);
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
    await expect(sheet).toHaveCount(0);
  }
  await page.waitForTimeout(250);
}

async function resetScroll(page) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelector(".player-scroll-container")?.scrollTo(0, 0);
    document.querySelector(".coach-scroll-container")?.scrollTo(0, 0);
  });
  await page.waitForTimeout(100);
}

async function expectNoHorizontalOverflow(page) {
  const geometry = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(geometry.documentWidth - geometry.viewport).toBeLessThanOrEqual(1);
  expect(geometry.bodyWidth - geometry.viewport).toBeLessThanOrEqual(1);
}

async function expectPlayerTwentyPixelPageRail(page) {
  const rail = page.locator(".player-scroll-container");
  await expect(rail).toBeVisible();
  const geometry = await rail.evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const paddingLeft = Number.parseFloat(style.paddingLeft);
    const paddingRight = Number.parseFloat(style.paddingRight);
    const contentLeft = rect.left + paddingLeft;
    const contentRight = rect.right - paddingRight;
    const candidates = [...element.querySelectorAll(':is([data-testid="player-daily-command-center"], [data-team-workspace], [data-testid^="player-commitment-center-"], [data-testid="player-progress-team-title"], [data-testid="player-progress-story"])')]
      .map((node) => node.getBoundingClientRect())
      .filter((box) => box.width > 1 && box.height > 1);
    return {
      paddingLeft,
      paddingRight,
      contentLeft,
      contentRight,
      candidates: candidates.map((box) => ({ left: box.left, right: box.right })),
    };
  });
  expect(geometry.paddingLeft).toBeGreaterThanOrEqual(19.5);
  expect(geometry.paddingLeft).toBeLessThanOrEqual(20.5);
  expect(geometry.paddingRight).toBeGreaterThanOrEqual(19.5);
  expect(geometry.paddingRight).toBeLessThanOrEqual(20.5);
  for (const candidate of geometry.candidates) {
    expect(candidate.left).toBeGreaterThanOrEqual(geometry.contentLeft - 1);
    expect(candidate.right).toBeLessThanOrEqual(geometry.contentRight + 1);
  }
}

async function capture(page, name) {
  await expectNoHorizontalOverflow(page);
  const outputPath = path.join(OUTPUT_DIR, name);
  await page.screenshot({ path: outputPath, animations: "disabled" });
  expect(fs.statSync(outputPath).size).toBeGreaterThan(20_000);
}

async function captureSurface(page, locator, name) {
  await expectNoHorizontalOverflow(page);
  await expect(locator).toBeVisible();
  const outputPath = path.join(OUTPUT_DIR, name);
  await locator.screenshot({ path: outputPath, animations: "disabled" });
  expect(fs.statSync(outputPath).size).toBeGreaterThan(20_000);
}

async function expectPlayerHomeOpticalRails(page) {
  const coach = page.getByTestId("player-coach-priority-signal");
  await expect(coach).toBeVisible();
  const coachGeometry = await coach.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const heading = element.querySelector("h2")?.getBoundingClientRect();
    const accent = getComputedStyle(element, "::before");
    return {
      textInset: heading ? heading.left - rect.left : -1,
      accentLeft: Number.parseFloat(accent.left),
      accentWidth: Number.parseFloat(accent.width),
    };
  });
  expect(coachGeometry.textInset).toBeGreaterThanOrEqual(7);
  expect(coachGeometry.textInset).toBeLessThanOrEqual(10);
  expect(coachGeometry.accentLeft).toBeLessThanOrEqual(0);
  expect(coachGeometry.accentWidth).toBeGreaterThanOrEqual(2.5);

  const disclosure = page.getByTestId("player-progress-disclosure");
  await expect(disclosure).toBeVisible();
  const disclosureGeometry = await disclosure.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const summary = element.querySelector("summary");
    const copy = summary?.querySelector("span:first-child")?.getBoundingClientRect();
    const control = getComputedStyle(summary, "::after");
    return {
      copyInset: copy ? copy.left - rect.left : -1,
      controlRight: Number.parseFloat(control.right),
    };
  });
  expect(disclosureGeometry.copyInset).toBeGreaterThanOrEqual(1);
  expect(disclosureGeometry.copyInset).toBeLessThanOrEqual(4);
  expect(disclosureGeometry.controlRight).toBeGreaterThanOrEqual(1);
  expect(disclosureGeometry.controlRight).toBeLessThanOrEqual(4);

  const rows = page.locator('[data-command-role="next-actions"] [class*="taskRow"]');
  if (await rows.count()) {
    const root = page.getByTestId("player-daily-command-center");
    const grid = await Promise.all([
      root.evaluate((element) => element.getBoundingClientRect().right),
      rows.first().evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const button = element.querySelector("button")?.getBoundingClientRect();
        return { left: rect.left, right: rect.right, buttonRight: button?.right || rect.right };
      }),
    ]);
    expect(grid[1].buttonRight).toBeLessThanOrEqual(grid[0] + 0.5);
  }
}

async function expectTrainOpticalRails(page) {
  const workspace = page.locator('[data-team-workspace="at-home"]');
  await expect(workspace).toBeVisible();
  const relationship = await workspace.evaluate((element) => {
    const title = element.querySelector('[data-team-identity-stage="true"]')?.getBoundingClientRect();
    const metrics = element.querySelector('[data-layout-role="supporting-evidence"]')?.getBoundingClientRect();
    return {
      titleLeft: title?.left || 0,
      titleRight: title?.right || 0,
      metricsLeft: metrics?.left || 0,
      metricsRight: metrics?.right || 0,
    };
  });
  expect(Math.abs(relationship.titleLeft - relationship.metricsLeft)).toBeLessThanOrEqual(1);
  expect(Math.abs(relationship.titleRight - relationship.metricsRight)).toBeLessThanOrEqual(1);

  const tracker = page.locator(".player-primary-logging-region");
  const plan = page.locator(".player-training-plan");
  if (await tracker.count() && await plan.count()) {
    const [trackerRect, planRect] = await Promise.all([
      tracker.evaluate((element) => element.getBoundingClientRect().toJSON()),
      plan.evaluate((element) => element.getBoundingClientRect().toJSON()),
    ]);
    expect(Math.abs(trackerRect.left - planRect.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(trackerRect.right - planRect.right)).toBeLessThanOrEqual(1);

    const shotFields = await tracker.locator(".player-logging-field").evaluateAll((elements) => elements.map((element) => {
      const field = element.getBoundingClientRect();
      const labelElement = element.querySelector("label");
      const inputElement = element.querySelector("input");
      const label = labelElement?.getBoundingClientRect();
      const input = inputElement?.getBoundingClientRect();
      return {
        left: field.left,
        right: field.right,
        width: field.width,
        labelLeft: label?.left || 0,
        labelRight: label?.right || 0,
        labelTextAlign: labelElement ? getComputedStyle(labelElement).textAlign : "",
        inputLeft: input?.left || 0,
        inputRight: input?.right || 0,
        inputWidth: input?.width || 0,
        inputHeight: input?.height || 0,
        inputBottom: input?.bottom || 0,
        fieldBottom: field.bottom,
        inputType: inputElement?.type || "",
        inputTextAlign: inputElement ? getComputedStyle(inputElement).textAlign : "",
      };
    }));
    const submitTop = await tracker.getByRole("button", { name: "LOG SHOTS", exact: true }).evaluate((element) => element.getBoundingClientRect().top);
    expect(shotFields).toHaveLength(2);
    expect(Math.abs(shotFields[0].width - shotFields[1].width)).toBeLessThanOrEqual(1);
    expect(Math.abs(shotFields[0].inputHeight - shotFields[1].inputHeight)).toBeLessThanOrEqual(1);
    for (const field of shotFields) {
      expect(field.inputLeft).toBeGreaterThanOrEqual(field.left - 0.5);
      expect(field.inputRight).toBeLessThanOrEqual(field.right + 0.5);
      expect(Math.abs(field.inputWidth - field.width)).toBeLessThanOrEqual(1);
      expect(field.inputBottom).toBeLessThanOrEqual(field.fieldBottom + 0.5);
      expect(submitTop - field.inputBottom).toBeGreaterThanOrEqual(12);
      expect(Math.abs(((field.labelLeft + field.labelRight) / 2) - ((field.left + field.right) / 2))).toBeLessThanOrEqual(1);
      expect(field.labelTextAlign).toBe("center");
      if (field.inputType === "number") expect(field.inputTextAlign).toBe("center");
    }
    const outerInsets = {
      left: shotFields[0].left - trackerRect.left,
      right: trackerRect.right - shotFields[1].right,
    };
    expect(Math.abs(outerInsets.left - outerInsets.right)).toBeLessThanOrEqual(1);

    const header = plan.locator(".player-training-plan__header");
    const row = plan.locator(".player-drill-row").first();
    if (await header.count() && await row.count()) {
      const [headerRect, rowRect] = await Promise.all([
        header.evaluate((element) => element.getBoundingClientRect().toJSON()),
        row.evaluate((element) => element.getBoundingClientRect().toJSON()),
      ]);
      expect(Math.abs(headerRect.left - rowRect.left)).toBeLessThanOrEqual(1);
    }
  }
}

test("candidate mobile geometry is optically disciplined from 375 through 430", async ({ page }) => {
  test.setTimeout(180_000);
  await installSafeRoutes(page);

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);
    await enterDemo(page, "player");
    await expectPlayerTwentyPixelPageRail(page);
    await expectPlayerHomeOpticalRails(page);
    if (DEEP_AUDIT_WIDTHS.has(viewport.width)) {
      await captureSurface(page, page.getByTestId("player-daily-command-center"), `precision-player-home-full-${viewport.width}.png`);
    }
    await resetScroll(page);
    if (SCREENSHOT_WIDTHS.has(viewport.width)) await capture(page, `precision-player-home-${viewport.width}.png`);

    await navigateByKey(page, "log-drill");
    await expectPlayerTwentyPixelPageRail(page);
    await expectTrainOpticalRails(page);
    if (DEEP_AUDIT_WIDTHS.has(viewport.width)) {
      await captureSurface(page, page.locator('[data-team-workspace="at-home"]'), `precision-player-train-full-${viewport.width}.png`);
    }
    await resetScroll(page);
    if (SCREENSHOT_WIDTHS.has(viewport.width)) await capture(page, `precision-player-train-${viewport.width}.png`);

    if (viewport.width === 390) {
      await navigateByKey(page, "profile");
      await expectPlayerTwentyPixelPageRail(page);
      await resetScroll(page);
      await capture(page, "precision-player-progress-390.png");
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await enterDemo(page, "coach");
  await expectNoHorizontalOverflow(page);
  await resetScroll(page);
  await capture(page, "precision-coach-home-390.png");
  await navigateByKey(page, "players");
  await expectNoHorizontalOverflow(page);
  await resetScroll(page);
  await capture(page, "precision-coach-players-390.png");
});
