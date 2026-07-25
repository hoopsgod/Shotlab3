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
  const demoCoach = page.getByRole("button", { name: "Demo Coach", exact: true });
  const players = page.getByRole("button", { name: "Players", exact: true });
  await expect(page.getByRole("button", { name: /^(Demo Coach|Players)$/ }).first()).toBeVisible({ timeout: 15_000 });
  if (await demoCoach.isVisible()) await demoCoach.click();
  await expect(players).toBeVisible({ timeout: 15_000 });
  await players.click();
}

test("coach adds a player and receives secure copy and email-app fallbacks", async ({ page }) => {
  let postBody = null;
  const invitation = { id: "invite-1", player_name: "Ari Player", player_email: "ari@example.com", status: "pending" };
  await page.route("**/v1/coach/players/provision**", async (route) => {
    const request = route.request();
    if (request.method() === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: postBody ? [invitation] : [] }) });
      return;
    }
    postBody = request.postDataJSON();
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, status: "pending", email_delivery_status: "not_configured", setup_url: "https://example.test/player-setup.html?token=single-use", expires_at: "2026-07-26T12:00:00.000Z", profile: { id: "pp-1", team_id: TEAM_ID, invited_email: "ari@example.com" } }) });
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

  await expect(form.getByRole("status")).toContainText("Email delivery is not configured");
  await expect(form.getByRole("button", { name: "COPY SECURE LINK" })).toBeVisible();
  await expect(form.getByRole("button", { name: "OPEN EMAIL APP" })).toBeVisible();
  expect(postBody).toEqual({ team_id: TEAM_ID, first_name: "Ari", last_name: "Player", email: "ari@example.com", jersey_number: "22" });
  expect("password" in postBody).toBe(false);
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
