import { mkdirSync } from "node:fs";
import { test, expect } from "@playwright/test";

const SCREENSHOT_DIR = "artifacts/native-app-shell";

const ROLE_EXPECTATIONS = {
  coach: {
    demoButton: /Coach demo/i,
    homeReady: "coach-command-center-full",
    identity: "coach-dashboard-identity-header",
    tabs: ["Home", "Players", "Schedule", "More"],
    screenshot: "coach",
  },
  player: {
    demoButton: /Player demo/i,
    homeReady: "player-daily-command-center",
    identity: "player-dashboard-identity-header",
    tabs: ["Home", "Train", "Progress", "More"],
    screenshot: "player",
  },
};

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

async function enterRole(page, role) {
  const expected = ROLE_EXPECTATIONS[role];
  await page.goto("/");
  const demoButton = page.getByRole("button", { name: expected.demoButton });
  await expect(demoButton).toBeVisible({ timeout: 20_000 });
  await demoButton.click();
  await expect(page.getByTestId(expected.homeReady)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId(expected.identity)).toBeVisible();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible();
  await disableVisualNoise(page);
}

async function expectFloatingDock(page, expectedLabels) {
  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(dock).toBeVisible();
  for (const label of expectedLabels) {
    await expect(dock.getByRole("button", { name: label, exact: true })).toBeVisible();
  }

  const geometry = await dock.evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      leftGap: rect.left,
      rightGap: window.innerWidth - rect.right,
      bottomGap: window.innerHeight - rect.bottom,
      radius: Number.parseFloat(style.borderTopLeftRadius),
      position: style.position,
    };
  });
  expect(geometry.position).toBe("fixed");
  expect(geometry.leftGap).toBeGreaterThanOrEqual(7);
  expect(geometry.rightGap).toBeGreaterThanOrEqual(7);
  expect(Math.abs(geometry.leftGap - geometry.rightGap)).toBeLessThanOrEqual(2);
  expect(geometry.bottomGap).toBeGreaterThanOrEqual(8);
  expect(geometry.radius).toBeGreaterThanOrEqual(20);
}

async function openAndVerifyMoreSheet(page, role) {
  const dock = page.getByTestId("mobile-navigation-dock");
  const moreButton = dock.getByRole("button", { name: "More", exact: true });
  await moreButton.click();

  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  await expect(sheet).toHaveAttribute("role", "dialog");
  await expect(sheet).toHaveAttribute("aria-modal", "true");
  await expect(sheet.getByText(role === "coach" ? "Coach workspace" : "Player workspace")).toBeVisible();
  await expect(sheet.getByRole("heading", { name: "Everything else, organized" })).toBeVisible();
  await expect(page.locator('[data-navigation-group="program"]')).toBeVisible();
  await expect(page.locator('[data-navigation-group="team"]')).toBeVisible();

  const sheetGeometry = await sheet.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      leftGap: rect.left,
      rightGap: window.innerWidth - rect.right,
      bottomGap: window.innerHeight - rect.bottom,
      radius: Number.parseFloat(style.borderTopLeftRadius),
    };
  });
  expect(sheetGeometry.leftGap).toBeGreaterThanOrEqual(8);
  expect(sheetGeometry.rightGap).toBeGreaterThanOrEqual(8);
  expect(sheetGeometry.bottomGap).toBeGreaterThanOrEqual(8);
  expect(sheetGeometry.radius).toBeGreaterThanOrEqual(24);
}

test.beforeAll(() => {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  await installSafeRoutes(page);
  await startClean(page);
});

for (const role of ["coach", "player"]) {
  test(`captures the Phase 2 ${role} native shell and More sheet`, async ({ page }) => {
    const expected = ROLE_EXPECTATIONS[role];
    await enterRole(page, role);
    await expectFloatingDock(page, expected.tabs);
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/${expected.screenshot}-shell-390x844.png` });

    await openAndVerifyMoreSheet(page, role);
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/${expected.screenshot}-more-sheet-390x844.png` });
  });
}
