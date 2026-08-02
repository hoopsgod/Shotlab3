import { test, expect } from "@playwright/test";

const TEAM_ID = "team-cross-device-result";
const COACH_EMAIL = "coach.cross@example.com";
const PLAYER_EMAIL = "ari.cross@example.com";
const PLAYER_PASSWORD = "SafePassword123!";
const SETUP_TOKEN = "cross-device-single-use-token-1234567890";
const today = new Date().toISOString().slice(0, 10);
const tomorrowDate = new Date(Date.now() + 86400000);
const tomorrow = tomorrowDate.toISOString().slice(0, 10);

const team = {
  id: TEAM_ID,
  name: "Cross Device Elite",
  ownerCoachId: COACH_EMAIL,
  joinCode: "CROSS26",
  createdAt: Date.now() - 86400000,
  branding: {
    name: "Cross Device Elite",
    teamName: "Cross Device Elite",
    shortName: "CDE",
    wordmark: "CROSS DEVICE ELITE",
    primaryColor: "#C8FF1A",
    secondaryColor: "#77D7FF",
    accentColor: "#C8FF1A",
    textOnPrimary: "#071007",
    logoUrl: "/branding/titans-default-mark.svg",
    logoMarkUrl: "/branding/titans-default-mark.svg",
    version: 1,
  },
};

const roster = [
  { id: "coach-cross", email: COACH_EMAIL, name: "Cross Device Coach", role: "coach", isCoach: true, teamId: TEAM_ID },
  { id: "player-cross", playerId: PLAYER_EMAIL, email: PLAYER_EMAIL, name: "Ari Cross", role: "player", teamId: TEAM_ID },
];

const profiles = [{ id: "profile-cross", userId: PLAYER_EMAIL, email: PLAYER_EMAIL, invitedEmail: PLAYER_EMAIL, teamId: TEAM_ID, firstName: "Ari", lastName: "Cross", inviteStatus: "claimed" }];

const commonSeed = {
  "sl:teams": [team],
  "sl:players": roster,
  "sl:player-profiles": profiles,
  "sl:drills": [{ id: "form", name: "Form Shooting", desc: "Clean mechanics", max: 50, icon: "ft" }],
  "sl:program-drills": [],
  "sl:scores": [],
  "sl:program-scores": [],
  "sl:shotlogs": [],
  "sl:events": [{ id: "practice-cross", teamId: TEAM_ID, title: "Team Practice", type: "practice", date: tomorrow, time: "6:00 PM", location: "Main Gym" }],
  "sl:rsvps": [],
  "sl:sc-sessions": [],
  "sl:sc-rsvps": [],
  "sl:sc-logs": [],
  "sl:season-archives": [],
};

const fulfillJson = (route, body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

async function installRoutes(context, state) {
  await context.route("**/v1/player-auth/claim", async (route) => {
    const payload = route.request().postDataJSON();
    if (payload.setup_token !== SETUP_TOKEN || payload.new_password !== PLAYER_PASSWORD || state.claimed) {
      await fulfillJson(route, { error: state.claimed ? "invitation_not_active" : "invalid_request" }, state.claimed ? 409 : 400);
      return;
    }
    state.claimed = true;
    await fulfillJson(route, { ok: true, email: PLAYER_EMAIL, teamId: TEAM_ID, existingAccount: false });
  });

  await context.route("**/v1/legacy-auth/login", async (route) => {
    const payload = route.request().postDataJSON();
    if (!state.claimed || String(payload.email).toLowerCase() !== PLAYER_EMAIL || payload.password !== PLAYER_PASSWORD) {
      await fulfillJson(route, { error: "invalid_credentials" }, 401);
      return;
    }
    await fulfillJson(route, { ok: true, profile: { email: PLAYER_EMAIL, name: "Ari Cross", role: "player", team_id: TEAM_ID } });
  });

  await context.route("**/v1/legacy-auth/restore", async (route) => {
    const payload = route.request().postDataJSON?.() || {};
    const email = String(payload.email || route.request().headers()["x-user-id"] || "").toLowerCase();
    const profile = email === COACH_EMAIL
      ? { email: COACH_EMAIL, name: "Cross Device Coach", role: "coach", team_id: TEAM_ID }
      : { email: PLAYER_EMAIL, name: "Ari Cross", role: "player", team_id: TEAM_ID };
    await fulfillJson(route, { ok: true, profile });
  });

  await context.route("**/v1/home-shots/log", async (route) => {
    const payload = route.request().postDataJSON();
    const result = {
      id: payload.id || `remote-${state.results.length + 1}`,
      team_id: TEAM_ID,
      player_id: PLAYER_EMAIL,
      email: PLAYER_EMAIL,
      name: "Ari Cross",
      made: Number(payload.made),
      date: payload.date || today,
      ts: new Date().toISOString(),
    };
    state.results.unshift(result);
    await fulfillJson(route, { ok: true, shot_log: result, diagnostic: { shot_logs_insert_success: "yes" } });
  });

  await context.route("**/v1/coach/activity/first-results**", async (route) => {
    const results = state.results.map((row) => ({
      id: row.id,
      team_id: row.team_id,
      player_id: row.player_id,
      player_email: row.email,
      player_name: row.name,
      made: row.made,
      date: row.date,
      observed_at: row.ts,
    }));
    await fulfillJson(route, { ok: true, team_id: TEAM_ID, count: results.length, results });
  });

  await context.route("**/v1/leaderboards/home-shots**", async (route) => {
    const total = state.results.reduce((sum, row) => sum + Number(row.made || 0), 0);
    await fulfillJson(route, { team_id: TEAM_ID, scope: "players", count: total ? 1 : 0, leaderboard: total ? [{ rank: 1, player_display_name: "Ari Cross", total_home_shots: total }] : [] });
  });

  await context.route("**/v1/team-priorities**", (route) => fulfillJson(route, { ok: true, priorities_by_team: {} }));
  await context.route("**/v1/season-archives**", (route) => fulfillJson(route, { ok: true, archives: [] }));
  await context.route("**/v1/coach/players/provision**", (route) => fulfillJson(route, { ok: true, invitations: [{ id: "invite-cross", player_name: "Ari Cross", player_email: PLAYER_EMAIL, status: state.claimed ? "claimed" : "sent" }] }));
  await context.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => fulfillJson(route, []));
}

async function seed(context, payload) {
  await context.addInitScript(({ data }) => {
    if (window.location.pathname === "/player-setup.html") return;
    for (const [key, value] of Object.entries(data)) window.localStorage.setItem(key, JSON.stringify(value));
  }, { data: payload });
}

test("player activation and first result become visible in a separate coach session", async ({ browser }) => {
  const state = { claimed: false, results: [] };
  const coachContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const playerContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await installRoutes(coachContext, state);
  await installRoutes(playerContext, state);
  await seed(coachContext, { ...commonSeed, "sl:session": { email: COACH_EMAIL } });
  await seed(playerContext, commonSeed);

  const coachPage = await coachContext.newPage();
  await coachPage.goto("/");
  await expect(coachPage.getByTestId("coach-command-center-full")).toBeVisible({ timeout: 20_000 });
  await expect(coachPage.getByTestId("coach-onboarding-state")).toContainText("Confirm the first player response");
  await expect(coachPage.getByTestId("coach-onboarding-state")).toContainText("4/5");

  const playerPage = await playerContext.newPage();
  await playerPage.goto(`/player-setup.html?token=${SETUP_TOKEN}`);
  await playerPage.getByLabel("NEW PASSWORD").fill(PLAYER_PASSWORD);
  await playerPage.getByLabel("CONFIRM PASSWORD").fill(PLAYER_PASSWORD);
  await playerPage.getByRole("button", { name: "ACTIVATE ACCOUNT" }).click();
  await expect(playerPage.getByRole("status")).toContainText("Your account is active");
  await playerPage.getByRole("link", { name: "GO TO SHOTLAB LOGIN" }).click();

  const authInputs = playerPage.locator("input");
  await authInputs.nth(0).fill(PLAYER_EMAIL);
  await authInputs.nth(1).fill(PLAYER_PASSWORD);
  await playerPage.getByRole("button", { name: /SIGN IN →/ }).click();
  await expect(playerPage.getByTestId("player-daily-command-center")).toBeVisible({ timeout: 20_000 });
  await expect(playerPage.getByTestId("player-daily-primary-action")).toContainText("Log first result");
  await playerPage.getByTestId("player-daily-primary-action").click();
  await playerPage.getByRole("spinbutton").first().fill("33");
  await playerPage.getByRole("button", { name: "LOG SHOTS", exact: true }).first().click();
  await expect(playerPage.getByTestId("player-completion-cue")).toContainText("33 makes added to today’s total");
  await expect.poll(() => state.results.length).toBe(1);

  await coachPage.bringToFront();
  await coachPage.evaluate(() => window.dispatchEvent(new Event("focus")));
  const activity = coachPage.getByTestId("coach-live-activity");
  await expect(activity).toBeVisible({ timeout: 10_000 });
  await expect(activity).toContainText("Ari Cross");
  await expect(activity).toContainText("Home shots · 33 makes");
  await expect(coachPage.getByTestId("coach-primary-metrics")).toContainText("1/1");
  await expect(coachPage.getByTestId("coach-primary-metrics")).toContainText("0Follow-up");
  await expect(coachPage.getByTestId("coach-onboarding-state")).toHaveCount(0);

  const replayPage = await playerContext.newPage();
  await replayPage.goto(`/player-setup.html?token=${SETUP_TOKEN}`);
  await replayPage.getByLabel("NEW PASSWORD").fill(PLAYER_PASSWORD);
  await replayPage.getByLabel("CONFIRM PASSWORD").fill(PLAYER_PASSWORD);
  await replayPage.getByRole("button", { name: "ACTIVATE ACCOUNT" }).click();
  await expect(replayPage.getByRole("status")).toContainText("already used or revoked");

  await coachContext.close();
  await playerContext.close();
});
