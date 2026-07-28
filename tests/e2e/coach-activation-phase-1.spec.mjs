import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

const TEAM_ID = "team-coach-activation";
const COACH_EMAIL = "coach.demo@shotlab.app";

const seedData = {
  "sl:teams": [{
    id: TEAM_ID,
    name: "Activation Test Team",
    ownerCoachId: COACH_EMAIL,
    joinCode: "ACTIVATE",
    createdAt: Date.now() - 86_400_000,
    branding: {
      name: "Activation Test Team",
      shortName: "ATT",
      wordmark: "ACTIVATION TEST TEAM",
      primaryColor: "#C8FF1A",
      secondaryColor: "#77D7FF",
      accentColor: "#C8FF1A",
      textOnPrimary: "#071007",
      logoUrl: "/branding/titans-exact-logo.png.PNG",
      logoMarkUrl: "/branding/titans-default-mark.svg",
      textScale: "standard",
      version: 1,
    },
  }],
  "sl:players": [{ id: "activation-coach", email: COACH_EMAIL, name: "Demo Coach", role: "coach", isCoach: true, teamId: TEAM_ID }],
  "sl:player-profiles": [],
  "sl:drills": [],
  "sl:program-drills": [],
  "sl:scores": [],
  "sl:program-scores": [],
  "sl:shotlogs": [],
  "sl:events": [],
  "sl:rsvps": [],
  "sl:sc-sessions": [],
  "sl:sc-rsvps": [],
  "sl:sc-logs": [],
  "sl:season-archives": [],
};

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, archives: [] }),
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

async function enterActivationCoach(page) {
  await page.addInitScript((payload) => {
    for (const [key, value] of Object.entries(payload)) window.localStorage.setItem(key, JSON.stringify(value));
    window.sessionStorage.setItem("coach-activation-seeded", "1");
  }, seedData);
  await page.goto("/");
  await page.getByRole("button", { name: "Demo Coach", exact: true }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

test.beforeEach(async ({ page }) => {
  await installSafeRoutes(page);
});

test("new coach receives one next action and lands on the secure player invite form", async ({ page }) => {
  await enterActivationCoach(page);

  const activation = page.getByTestId("coach-onboarding-state");
  await expect(activation).toBeVisible({ timeout: 20_000 });
  await expect(activation.getByText("Invite your first player", { exact: true })).toBeVisible();
  await expect(activation.getByText("2/5", { exact: false })).toBeVisible();

  await activation.getByRole("button", { name: /Invite player/i }).click();

  const inviteForm = page.getByTestId("coach-player-invite-form");
  await expect(inviteForm).toBeVisible({ timeout: 20_000 });
  await expect(inviteForm.getByLabel("First name")).toBeVisible();

  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 2);
});
