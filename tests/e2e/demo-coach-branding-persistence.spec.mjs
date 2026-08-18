import { test, expect } from "@playwright/test";

const CUSTOM_LOGO_URL = "https://assets.shotlab.test/demo-coach-custom.svg";
const CUSTOM_LOGO_SVG = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="#6d28d9"/><path d="M28 62 49 83 93 36" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

async function installSafeRoutes(page) {
  await page.route(CUSTOM_LOGO_URL, (route) => route.fulfill({
    status: 200,
    contentType: "image/svg+xml",
    headers: { "access-control-allow-origin": "*", "cache-control": "no-store" },
    body: CUSTOM_LOGO_SVG,
  }));
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route("**/v1/coach/players/provision**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function enterCoachDemo(page) {
  await installSafeRoutes(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Coach demo/i }).click();
  await expect(page.getByTestId("coach-command-center-full")).toBeVisible({ timeout: 20_000 });
}

async function openBranding(page) {
  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  await sheet.locator('[data-nav-key="branding"]').click();
  await expect(page.getByTestId("coach-branding-workspace")).toBeVisible({ timeout: 20_000 });
}

test.use({ viewport: { width: 390, height: 844 } });

test("Coach Demo custom logo remains authoritative on Coach Home after save", async ({ page }) => {
  await enterCoachDemo(page);
  await openBranding(page);

  const fullLogo = page.getByLabel("Full logo URL", { exact: true });
  const markLogo = page.getByLabel("Logo mark URL", { exact: true });
  await fullLogo.fill(CUSTOM_LOGO_URL);
  await markLogo.fill(CUSTOM_LOGO_URL);
  await page.getByRole("button", { name: "Save team branding", exact: true }).click();
  await expect(page.getByText("Team identity saved", { exact: true })).toBeVisible({ timeout: 10_000 });

  const stored = await page.evaluate(() => {
    const raw = localStorage.getItem("sl:demo-team-branding") || sessionStorage.getItem("sl:demo-team-branding");
    return raw ? JSON.parse(raw) : null;
  });
  expect(stored?.logoUrl).toBe(CUSTOM_LOGO_URL);
  expect(stored?.logoMarkUrl).toBe(CUSTOM_LOGO_URL);

  await page.getByRole("button", { name: "Back to Coach", exact: true }).click();
  const header = page.getByTestId("mission-control-team-header");
  await expect(header).toBeVisible({ timeout: 10_000 });
  const headerImage = header.locator("img").first();
  await expect(headerImage).toBeVisible();
  await expect.poll(async () => headerImage.getAttribute("src")).not.toContain("titans-default-mark");
  await expect.poll(async () => headerImage.getAttribute("src")).not.toContain("titans-exact-logo");

  const visibleTeamImages = await page.locator("img, image").evaluateAll((nodes) => nodes
    .map((node) => node.getAttribute("src") || node.getAttribute("href") || "")
    .filter(Boolean));
  expect(visibleTeamImages.some((source) => !source.includes("titans-default-mark") && !source.includes("titans-exact-logo") && (source.includes("assets.shotlab.test") || source.startsWith("data:image/")))).toBe(true);
});
