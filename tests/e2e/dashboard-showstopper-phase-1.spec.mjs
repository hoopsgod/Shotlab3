import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/dashboard-showstopper-phase-1");

async function installRoutes(page) {
  await page.route("**/v1/season-archives", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) });
  });
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
}

async function enterPlayerDemo(page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/?demo=1");
  const button = page.getByRole("button", { name: "Player demo", exact: true });
  await expect(button).toBeVisible({ timeout: 20_000 });
  await button.click();
  await expect(page.getByTestId("player-daily-command-center")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    window.scrollTo(0, 0);
    document.querySelector(".player-scroll-container")?.scrollTo(0, 0);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function certifyViewport(page, width, height, name) {
  await page.setViewportSize({ width, height });
  await enterPlayerDemo(page);
  const hero = page.getByTestId("player-daily-command-center");
  const action = page.getByTestId("player-daily-primary-action");
  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(hero).toBeVisible();
  await expect(action).toBeVisible();
  await expect(dock).toBeVisible();

  const layout = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    action: (() => {
      const rect = document.querySelector('[data-testid="player-daily-primary-action"]')?.getBoundingClientRect();
      return rect ? { width: rect.width, height: rect.height, bottom: rect.bottom } : null;
    })(),
    dock: (() => {
      const rect = document.querySelector('[data-testid="mobile-navigation-dock"]')?.getBoundingClientRect();
      return rect ? { top: rect.top, bottom: rect.bottom } : null;
    })(),
  }));
  expect(layout.overflow).toBeLessThanOrEqual(1);
  expect(layout.action).not.toBeNull();
  expect(layout.action.height).toBeGreaterThanOrEqual(44);
  expect(layout.dock).not.toBeNull();

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  await page.screenshot({ path: path.join(OUTPUT_DIR, `${name}.png`), fullPage: true, animations: "disabled" });
}

test.beforeEach(async ({ page }) => {
  await installRoutes(page);
});

test("Player Home is stable at 375, 390, and 430 widths", async ({ page }) => {
  await certifyViewport(page, 375, 844, "player-home-375");
  await certifyViewport(page, 390, 844, "player-home-390");
  await certifyViewport(page, 430, 932, "player-home-430");
});

test("375px athlete credential survives long player and team names without clipping or overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await enterPlayerDemo(page);
  await page.evaluate(() => {
    const name = document.querySelector('[data-identity-role="name"]');
    const team = document.querySelector('[data-identity-role="team-name"]');
    if (name) name.textContent = "Alexandria Montgomery-Washington";
    if (team) team.textContent = "Webster Thomas Elite Player Development Program";
  });

  const identity = page.getByTestId("player-dashboard-identity-header");
  await expect(identity).toContainText("Alexandria Montgomery-Washington");
  await expect(identity).toContainText("Webster Thomas Elite Player Development Program");
  const contract = await identity.evaluate((node) => {
    const name = node.querySelector('[data-identity-role="name"]');
    const team = node.querySelector('[data-identity-role="team-name"]');
    const visible = (element) => element && element.scrollWidth <= element.clientWidth + 1 && element.scrollHeight <= element.clientHeight + 1;
    return {
      documentOverflow: document.documentElement.scrollWidth - window.innerWidth,
      nameVisible: visible(name),
      teamVisible: visible(team),
    };
  });
  expect(contract.documentOverflow).toBeLessThanOrEqual(1);
  expect(contract.nameVisible).toBe(true);
  expect(contract.teamVisible).toBe(true);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "player-home-375-long-identity.png"), fullPage: true, animations: "disabled" });
});

test("Player Home keeps one dominant action, readable light chapter, and bottom-nav clearance", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterPlayerDemo(page);
  await expect(page.getByTestId("player-daily-primary-action")).toHaveCount(1);

  const progress = page.getByTestId("player-progress-disclosure");
  if (!(await progress.evaluate((node) => node.open))) await progress.locator("summary").click();
  const signal = page.getByTestId("player-daily-momentum-signal");
  await expect(signal).toBeVisible();
  const contrastContract = await signal.evaluate((node) => {
    const textNodes = [...node.querySelectorAll("small,strong,p")].filter((element) => element.textContent?.trim());
    return textNodes.map((element) => ({ text: element.textContent.trim(), color: getComputedStyle(element).color }));
  });
  expect(contrastContract.length).toBeGreaterThan(0);
  for (const item of contrastContract) {
    expect(item.color, `${item.text} must not use the former cream-on-cream foreground`).not.toBe("rgb(245, 242, 234)");
    expect(item.color, `${item.text} must not use the dark-hero foreground on cream`).not.toBe("rgb(245, 248, 249)");
  }

  const scroll = page.locator(".player-scroll-container");
  if (await scroll.count()) await scroll.evaluate((node) => node.scrollTo(0, node.scrollHeight));
  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(dock).toBeVisible();
  const clearance = await page.evaluate(() => {
    const scroll = document.querySelector(".player-scroll-container");
    const dock = document.querySelector('[data-testid="mobile-navigation-dock"]');
    if (!scroll || !dock) return null;
    const style = getComputedStyle(scroll);
    return { bottomPadding: parseFloat(style.paddingBottom) || 0, dockHeight: dock.getBoundingClientRect().height };
  });
  if (clearance) expect(clearance.bottomPadding).toBeGreaterThanOrEqual(clearance.dockHeight - 1);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "player-home-390-scrolled.png"), fullPage: true, animations: "disabled" });
});

test("Player Home retains desktop sanity", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await enterPlayerDemo(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await expect(page.getByTestId("player-daily-command-center")).toBeVisible();
  await page.screenshot({ path: path.join(OUTPUT_DIR, "player-home-desktop-1280.png"), fullPage: true, animations: "disabled" });
});
