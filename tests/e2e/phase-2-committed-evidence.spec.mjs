import { mkdirSync } from "node:fs";
import { test, expect } from "@playwright/test";

const OUTPUT_DIR = "artifacts/phase-2-committed";

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

async function prepare(page) {
  await installSafeRoutes(page);
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

async function enterDemo(page, role) {
  await page.goto("/");
  const button = page.getByRole("button", { name: role === "coach" ? /Coach demo/i : /Player demo/i });
  await expect(button).toBeVisible({ timeout: 20_000 });
  await button.click();
}

test.beforeAll(() => mkdirSync(OUTPUT_DIR, { recursive: true }));

test.beforeEach(async ({ page }) => prepare(page));

test("commit Coach Home mobile evidence", async ({ page }) => {
  await enterDemo(page, "coach");
  await expect(page.getByTestId("coach-command-center-full")).toBeVisible({ timeout: 20_000 });
  await disableVisualNoise(page);
  await page.screenshot({ path: `${OUTPUT_DIR}/coach-home-390x844.png`, fullPage: true });
});

test("commit Player Home mobile evidence", async ({ page }) => {
  await enterDemo(page, "player");
  await expect(page.getByTestId("player-daily-command-center")).toBeVisible({ timeout: 20_000 });
  await disableVisualNoise(page);
  await page.screenshot({ path: `${OUTPUT_DIR}/player-home-390x844.png`, fullPage: true });
});
