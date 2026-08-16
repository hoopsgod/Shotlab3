import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT = path.resolve(process.cwd(), "artifacts/phase-4-product-reset-interaction");
fs.mkdirSync(OUTPUT, { recursive: true });

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route("**/v1/coach/players/provision**", (route) => {
    if (route.request().method() === "GET") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: [] }) });
    return route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ error: "sandbox_action_blocked" }) });
  });
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function expectNoHorizontalOverflow(page) {
  const geometry = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  expect(geometry.document - geometry.viewport).toBeLessThanOrEqual(2);
  expect(geometry.body - geometry.viewport).toBeLessThanOrEqual(2);
}

async function expectMinimumTouchHeight(locator, minimum = 44) {
  const count = await locator.count();
  expect(count).toBeGreaterThan(0);
  for (let index = 0; index < count; index += 1) {
    const item = locator.nth(index);
    if (!(await item.isVisible())) continue;
    const box = await item.boundingBox();
    expect(box, `touch target ${index} should have measurable geometry`).not.toBeNull();
    expect(box.height, `touch target ${index} is ${box.height}px tall`).toBeGreaterThanOrEqual(minimum - 0.5);
  }
}

async function capture(page, name) {
  await expectNoHorizontalOverflow(page);
  await page.evaluate(() => document.fonts?.ready);
  const file = path.join(OUTPUT, `${name}.png`);
  await page.screenshot({ path: file, animations: "disabled" });
  expect(fs.statSync(file).size).toBeGreaterThan(12_000);
}

async function enterDemo(page, role) {
  await installSafeRoutes(page);
  await page.goto("/");
  const button = page.getByRole("button", { name: role === "coach" ? "Coach demo" : "Player demo", exact: true });
  await expect(button).toBeVisible({ timeout: 20_000 });
  await button.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

test.describe("Phase 4 product-feel certification", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("auth controls are thumb-safe and registration fields use mobile-native semantics", async ({ page }) => {
    await installSafeRoutes(page);
    await page.goto("/");
    const workspace = page.getByTestId("auth-workspace");
    await expect(workspace).toBeVisible({ timeout: 20_000 });

    await expectMinimumTouchHeight(page.getByRole("tab"));
    await expectMinimumTouchHeight(page.getByRole("button", { name: /demo/i }));
    await page.getByRole("tab", { name: "Create account", exact: true }).click();
    await expectMinimumTouchHeight(page.getByRole("radio"));
    await expectMinimumTouchHeight(page.getByRole("button", { name: /Already have an account/i }));

    const email = page.getByPlaceholder("you@example.com");
    await expect(email).toHaveAttribute("type", "email");
    await expect(email).toHaveAttribute("inputmode", "email");
    await expect(email).toHaveAttribute("autocomplete", "email");
    await expectNoHorizontalOverflow(page);
    await capture(page, "01-auth-create-account-390");
  });

  test("Coach player provisioning exposes native fields, deliberate touch targets, and a designed failure state", async ({ page }) => {
    await enterDemo(page, "coach");
    await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Players", exact: true }).click();
    const form = page.getByTestId("coach-player-invite-form");
    await expect(form).toBeVisible({ timeout: 20_000 });

    await expectMinimumTouchHeight(form.locator("input"));
    await expectMinimumTouchHeight(form.getByRole("button", { name: /Add Player/i }));
    await expect(form.getByLabel("Player email")).toHaveAttribute("type", "email");
    await expect(form.getByLabel("Player email")).toHaveAttribute("inputmode", "email");
    await expect(form.getByLabel("Jersey number")).toHaveAttribute("inputmode", "numeric");

    await form.getByLabel("First name").fill("Test");
    await form.getByLabel("Last name").fill("Player");
    await form.getByLabel("Player email").fill("phase4@example.com");
    await form.getByRole("button", { name: /Add Player/i }).click();
    const alert = form.getByRole("alert");
    await expect(alert).toBeVisible();
    await expect(alert).not.toContainText(/supabase|postgres|pgrst|schema|http\s*\d{3}/i);
    await expectNoHorizontalOverflow(page);
    await capture(page, "02-coach-add-player-error-state-390");
  });

  test("navigation drawer keeps focus, closes cleanly, and removes motion when the user requests it", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await enterDemo(page, "player");
    const more = page.getByTestId("mobile-navigation-more");
    await more.click();
    const sheet = page.getByTestId("mobile-navigation-sheet");
    await expect(sheet).toBeVisible();
    await expect(page.getByRole("button", { name: "Close more navigation" })).toBeFocused();

    const motion = await sheet.evaluate((element) => ({ animationName: getComputedStyle(element).animationName, transitionDuration: getComputedStyle(element).transitionDuration }));
    expect(motion.animationName).toBe("none");
    expect(["0s", "0ms"]).toContain(motion.transitionDuration);

    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
    await expect(more).toBeFocused();
    await expectMinimumTouchHeight(page.getByTestId("mobile-navigation-dock").getByRole("button"));
    await capture(page, "03-player-home-reduced-motion-390");
  });

  test("Player Train and Events preserve touch safety, active state, and overflow while moving through real routes", async ({ page }) => {
    await enterDemo(page, "player");
    const dock = page.getByTestId("mobile-navigation-dock");
    await dock.getByRole("button", { name: "Train", exact: true }).click();
    await expect(dock.getByRole("button", { name: "Train", exact: true })).toHaveAttribute("aria-current", "page");
    await expectMinimumTouchHeight(dock.getByRole("button"));
    await expectNoHorizontalOverflow(page);
    await capture(page, "04-player-train-390");

    await page.getByTestId("mobile-navigation-more").click();
    const sheet = page.getByTestId("mobile-navigation-sheet");
    await expect(sheet).toBeVisible();
    await expectMinimumTouchHeight(sheet.getByRole("button"));
    await sheet.locator('[data-nav-key="program"]').click();
    await expect(page).toHaveURL(/\/events$/);
    await expect(page.getByTestId("player-commitment-center-events")).toBeVisible({ timeout: 20_000 });
    await expectNoHorizontalOverflow(page);
    await capture(page, "05-player-events-390");
  });

  test("430px representative Coach and Player routes stay clear of browser edges", async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 932 });
    await enterDemo(page, "coach");
    await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Schedule", exact: true }).click();
    await expectNoHorizontalOverflow(page);
    await capture(page, "06-coach-schedule-430");

    await page.goto("/");
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.reload();
    await enterDemo(page, "player");
    await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Progress", exact: true }).click();
    await expect(page.getByTestId("player-progress-story")).toBeVisible({ timeout: 20_000 });
    await expectNoHorizontalOverflow(page);
    await capture(page, "07-player-progress-430");
  });
});
