import { test, expect } from "@playwright/test";

const TEAM_ID = "team-e2e-player-invite";
const COACH_EMAIL = "coach.demo@shotlab.app";

const seedData = {
  "sl:teams": [{ id: TEAM_ID, name: "E2E Invite Team", ownerCoachId: COACH_EMAIL, joinCode: "JOIN26", createdAt: Date.now() }],
  "sl:players": [{ id: "coach-e2e", email: COACH_EMAIL, name: "Demo Coach", role: "coach", teamId: TEAM_ID }],
  "sl:player-profiles": [],
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

async function seedCoach(page) {
  await page.addInitScript(({ payload, email }) => {
    window.localStorage.clear();
    for (const [key, value] of Object.entries(payload)) window.localStorage.setItem(key, JSON.stringify(value));
    window.localStorage.setItem("sl:session", JSON.stringify({ email }));
  }, { payload: seedData, email: COACH_EMAIL });
}

async function enterCoachPlayers(page) {
  await page.goto("/");
  const isMobile = (page.viewportSize()?.width ?? 1280) <= 767;
  const coachDemo = page.getByRole("button", { name: "Coach demo", exact: true });
  const commandCenter = page.getByTestId("coach-command-center-full");

  await expect(commandCenter.or(coachDemo).first()).toBeVisible({ timeout: 15_000 });
  if (await coachDemo.isVisible().catch(() => false)) await coachDemo.click();
  await expect(commandCenter).toBeVisible({ timeout: 15_000 });

  if (isMobile) {
    const navigation = page.getByTestId("mobile-navigation-dock");
    await expect(navigation).toBeVisible({ timeout: 15_000 });
    const players = navigation.getByRole("button", { name: "Players", exact: true });
    await expect(players).toBeVisible();
    await players.click();
    return;
  }

  /* Desktop Mission Control owns the active Coach surface. Use its visible
     in-surface Players action rather than the legacy/overlapped sidebar hit
     target; this test protects invitation delivery, not sidebar hit-testing. */
  const openPlayers = commandCenter.getByRole("button", { name: "Open player workspace", exact: true });
  await openPlayers.scrollIntoViewIfNeeded();
  await expect(openPlayers).toBeVisible();
  await openPlayers.click();
}

test("demo coach blocks real player invitation delivery at the sandbox boundary", async ({ page }) => {
  let provisionRequests = 0;
  await page.route("**/v1/coach/players/provision**", async (route) => {
    provisionRequests += 1;
    await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ ok: false, error: "demo_must_not_reach_provision_api" }) });
  });
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
  await seedCoach(page);
  await enterCoachPlayers(page);

  const form = page.getByTestId("coach-player-invite-form");
  await expect(form).toBeVisible();
  await form.getByLabel("First name").fill("Ari");
  await form.getByLabel("Last name").fill("Player");
  await form.getByLabel("Player email").fill("ARI@example.com");
  await form.getByLabel("Jersey number").fill("22");
  await form.getByRole("button", { name: "ADD PLAYER & SEND INVITE" }).click();

  await expect(form.getByRole("alert")).toContainText("Player invitations are disabled in the demo sandbox.");
  await expect(form.getByRole("button", { name: "COPY SECURE LINK" })).toHaveCount(0);
  await expect(form.getByRole("button", { name: "OPEN EMAIL APP" })).toHaveCount(0);
  expect(provisionRequests).toBe(0);
});

test("player chooses a password on the single-use setup page", async ({ page }) => {
  let claimBody = null;
  await page.route("**/v1/player-auth/claim", async (route) => {
    claimBody = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, email: "ari@example.com", existingAccount: false }) });
  });
  await page.goto("/player-setup.html?token=single-use-token-value-1234567890");
  await page.getByLabel("NEW PASSWORD").fill("SafePassword123!");
  await page.getByLabel("CONFIRM PASSWORD").fill("SafePassword123!");
  await page.getByRole("button", { name: "ACTIVATE ACCOUNT" }).click();
  await expect(page.getByRole("status")).toContainText("Your account is active");
  await expect(page.getByRole("link", { name: "GO TO SHOTLAB LOGIN" })).toBeVisible();
  expect(claimBody.setup_token).toBe("single-use-token-value-1234567890");
  expect(claimBody.new_password).toBe("SafePassword123!");
});
