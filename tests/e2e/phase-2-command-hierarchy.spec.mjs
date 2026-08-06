import { mkdirSync } from "node:fs";
import { test, expect } from "@playwright/test";

const SCREENSHOT_DIR = "artifacts/phase-2-command-hierarchy";

test.use({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route("**/v1/coach/players/provision**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
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
  await page.addStyleTag({ content: `*, *::before, *::after { animation-duration: 0.01ms !important; animation-delay: 0ms !important; transition-duration: 0.01ms !important; caret-color: transparent !important; }` });
}

test.beforeAll(() => mkdirSync(SCREENSHOT_DIR, { recursive: true }));
test.beforeEach(async ({ page }) => { await installSafeRoutes(page); await startClean(page); });

test("Player home presents action, evidence, priority, and disclosure in order", async ({ page }) => {
  await enterDemo(page, "player");
  const root = page.getByTestId("player-daily-command-center");
  const primary = page.getByTestId("player-daily-primary-action");
  const evidence = page.getByTestId("player-command-evidence");
  const priority = page.getByTestId("player-coach-priority-signal");
  const disclosure = page.getByTestId("player-progress-disclosure");

  await expect(root).toBeVisible({ timeout: 20_000 });
  await expect(root).toHaveAttribute("data-phase", "phase-2-command-hierarchy");
  await expect(primary).toBeVisible();
  await expect(evidence).toBeVisible();
  await expect(priority).toBeVisible();
  await expect(disclosure).toBeVisible();

  const positions = await page.evaluate(() => {
    const top = (selector) => document.querySelector(selector)?.getBoundingClientRect().top ?? -1;
    return {
      primary: top('[data-command-role="primary"]'),
      evidence: top('[data-testid="player-command-evidence"]'),
      priority: top('[data-command-role="coach-priority"]'),
      nextActions: top('[data-command-role="next-actions"]'),
      progress: top('[data-command-role="progress-details"]'),
    };
  });

  expect(positions.primary).toBeGreaterThanOrEqual(0);
  expect(positions.evidence).toBeGreaterThan(positions.primary);
  expect(positions.priority).toBeGreaterThan(positions.evidence);
  if (positions.nextActions >= 0) expect(positions.progress).toBeGreaterThan(positions.nextActions);

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

  const heroBox = await objective.boundingBox();
  expect(heroBox).not.toBeNull();
  expect(heroBox.height).toBeLessThanOrEqual(520);

  await disableVisualNoise(page);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/coach-home-390x844.png`, fullPage: true });
});
