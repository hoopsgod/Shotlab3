import { mkdirSync } from "node:fs";
import { test, expect } from "@playwright/test";

const SCREENSHOT_DIR = "artifacts/visual-foundation";

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

async function expectNoHorizontalOverflow(page) {
  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 2);
}

async function expectLightFoundation(page) {
  const foundation = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const body = getComputedStyle(document.body);
    return {
      bgToken: root.getPropertyValue("--bg-0").trim().toLowerCase(),
      surfaceToken: root.getPropertyValue("--surface-1").trim().toLowerCase(),
      textToken: root.getPropertyValue("--text-1").trim().toLowerCase(),
      bodyBackground: body.backgroundColor,
    };
  });
  expect(foundation.bgToken).toBe("#f3f1ea");
  expect(foundation.surfaceToken).toBe("#ffffff");
  expect(foundation.textToken).toBe("#111a21");
  expect(foundation.bodyBackground).not.toBe("rgb(11, 13, 16)");
}

async function enterDemo(page, role) {
  const buttonName = role === "coach" ? /Coach demo/i : /Player demo/i;
  const button = page.getByRole("button", { name: buttonName });
  await expect(button).toBeVisible({ timeout: 20_000 });
  await button.click();
}

test.beforeAll(() => {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  await installSafeRoutes(page);
  await startClean(page);
});

test("captures the Phase 1 sign-in foundation at iPhone width", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("auth-workspace")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("heading", { name: /Train with intent/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Player demo/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Coach demo/i })).toBeVisible();
  await expectLightFoundation(page);
  await expectNoHorizontalOverflow(page);
  await disableVisualNoise(page);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/sign-in-390x844.png` });
});

test("captures the Phase 1 Coach home foundation at iPhone width", async ({ page }) => {
  await page.goto("/");
  await enterDemo(page, "coach");
  await expect(page.getByTestId("coach-command-center-full")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("coach-primary-objective")).toBeVisible();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible();
  await expectLightFoundation(page);
  await expectNoHorizontalOverflow(page);
  await disableVisualNoise(page);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/coach-home-390x844.png` });
});

test("captures the Phase 1 Player home foundation at iPhone width", async ({ page }) => {
  await page.goto("/");
  await enterDemo(page, "player");
  await expect(page.getByTestId("player-daily-command-center")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("player-daily-primary-action")).toBeVisible();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible();
  await expectLightFoundation(page);
  await expectNoHorizontalOverflow(page);
  await disableVisualNoise(page);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/player-home-390x844.png` });
});
