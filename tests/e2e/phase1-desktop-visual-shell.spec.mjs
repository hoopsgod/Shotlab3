import { test, expect } from "@playwright/test";

async function enter(page, role, width = 1440) {
  await page.setViewportSize({ width, height: width < 1024 ? 844 : 1000 });
  await page.goto("/");
  await page.getByRole("button", { name: `${role} demo`, exact: true }).click();
  await expect(page.getByTestId(role === "Coach" ? "coach-primary-objective" : "player-daily-command-center")).toBeVisible({ timeout: 20000 });
}
async function noPan(page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}
async function capture(page, info, name) {
  await page.screenshot({ path: info.outputPath(`${name}.png`) });
}
async function geometry(page) {
  return page.getByTestId("desktop-workspace-header").boundingBox();
}

test("Coach application frame persists through roster and contextual detail", async ({ page }, info) => {
  const errors = []; page.on("pageerror", error => errors.push(error.message));
  await enter(page, "Coach");
  const rail = page.getByTestId("desktop-workspace-navigation");
  const header = page.getByTestId("desktop-workspace-header");
  await expect(rail).toHaveCount(1);
  await expect(header.getByRole("heading", { level: 1 })).toHaveText("Mission Control");
  const frame = await geometry(page);
  expect(frame.x).toBe(248);
  const hero = await page.getByTestId("coach-primary-objective").boundingBox();
  expect(hero.height).toBeLessThan(330);
  await page.evaluate(() => { window.__shellHeader = document.querySelector('[data-testid="desktop-workspace-header"]'); window.__shellRail = document.querySelector('[data-testid="desktop-workspace-navigation"]'); });
  await noPan(page); await capture(page, info, "coach-home-1440");
  await rail.getByRole("button", { name: "Players", exact: true }).click();
  await expect(page.getByTestId("coach-players-interactive-dashboard")).toBeVisible();
  await expect(header.getByRole("heading", { level: 1 })).toHaveText("Players");
  await expect(rail.getByRole("button", { name: "Players", exact: true })).toHaveAttribute("aria-current", "page");
  expect((await geometry(page)).x).toBe(frame.x);
  expect(await page.evaluate(() => window.__shellHeader === document.querySelector('[data-testid="desktop-workspace-header"]') && window.__shellRail === document.querySelector('[data-testid="desktop-workspace-navigation"]'))).toBe(true);
  const search = page.getByTestId("coach-players-filter-rail").getByRole("searchbox");
  const row = page.locator("#coach-roster-operations").getByRole("button", { name: /Open .+ profile/ }).first();
  await expect(row).toBeVisible();
  await capture(page, info, "coach-players-1440");
  await row.click();
  const detail = page.getByTestId("coach-player-intelligence-drawer");
  await expect(detail).toBeVisible();
  expect(new URL(page.url()).pathname).toMatch(/^\/coach\/players\/.+/);
  await expect(detail.getByRole("button", { name: "Close details", exact: true }).last()).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  expect(await detail.getByRole("dialog").evaluate(node => node.contains(document.activeElement))).toBe(true);
  await capture(page, info, "coach-player-detail-1440");
  await page.keyboard.press("Escape");
  await expect(detail).toHaveCount(0); await expect(row).toBeFocused();
  expect(new URL(page.url()).pathname).toBe("/coach/players");
  await search.fill("Andre"); await expect(search).toHaveValue("Andre");
  await page.locator("#coach-roster-operations").getByRole("button", { name: /Open .+ profile/ }).first().click();
  await page.keyboard.press("Escape"); await expect(search).toHaveValue("Andre");
  await noPan(page); expect(errors).toEqual([]);
});

test("Player application frame persists through primary Training", async ({ page }, info) => {
  const errors = []; page.on("pageerror", error => errors.push(error.message));
  await enter(page, "Player");
  const rail = page.getByTestId("desktop-workspace-navigation");
  const header = page.getByTestId("desktop-workspace-header");
  const before = await geometry(page);
  await expect(header.getByRole("heading", { level: 1 })).toHaveText("Home");
  await expect(page.getByTestId("player-dashboard-identity-header")).toHaveCount(0);
  await capture(page, info, "player-home-1440");
  await rail.getByRole("button", { name: "AT Home Log", exact: true }).click();
  await expect(header.getByRole("heading", { level: 1 })).toHaveText("Training");
  expect((await geometry(page)).x).toBe(before.x);
  await expect(rail.getByRole("button", { name: "AT Home Log", exact: true })).toHaveAttribute("aria-current", "page");
  await noPan(page); await capture(page, info, "player-training-1440");
  expect(errors).toEqual([]);
});

for (const role of ["Coach", "Player"]) {
  test(`${role} 1024px keeps the desktop workspace frame`, async ({ page }, info) => {
    await enter(page, role, 1024);
    await expect(page.getByTestId("desktop-workspace-navigation")).toBeVisible();
    expect((await geometry(page)).x).toBe(248);
    await noPan(page); await capture(page, info, `${role.toLowerCase()}-home-1024`);
  });
  for (const width of [320, 375, 390, 430]) {
    test(`${role} ${width}px retains its mobile frame`, async ({ page }, info) => {
      await enter(page, role, width);
      await expect(page.getByTestId("desktop-workspace-navigation")).toHaveCount(0);
      await expect(page.getByTestId("desktop-workspace-header")).toHaveCount(0);
      await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible();
      await noPan(page); await capture(page, info, `${role.toLowerCase()}-home-${width}`);
    });
  }
}
