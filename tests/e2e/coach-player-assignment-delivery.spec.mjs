import { test, expect } from "@playwright/test";

const TEAM_ID = "team-assignment-delivery";
const COACH_EMAIL = "coach.delivery@example.com";
const PLAYER_EMAIL = "ari.delivery@example.com";
const today = new Date().toISOString().slice(0, 10);

const team = {
  id: TEAM_ID,
  name: "Assignment Delivery Elite",
  ownerCoachId: COACH_EMAIL,
  joinCode: "DELIVER",
  branding: {
    name: "Assignment Delivery Elite",
    teamName: "Assignment Delivery Elite",
    primaryColor: "#C8FF1A",
    secondaryColor: "#77D7FF",
    accentColor: "#C8FF1A",
    logoUrl: "/branding/titans-default-mark.svg",
    logoMarkUrl: "/branding/titans-default-mark.svg",
  },
};

const players = [
  { id: "coach-delivery", email: COACH_EMAIL, name: "Delivery Coach", role: "coach", isCoach: true, teamId: TEAM_ID },
  { id: "player-delivery", playerId: PLAYER_EMAIL, email: PLAYER_EMAIL, name: "Ari Delivery", role: "player", teamId: TEAM_ID },
];

const commonSeed = {
  "sl:teams": [team],
  "sl:players": players,
  "sl:player-profiles": [{ id: "profile-delivery", userId: PLAYER_EMAIL, email: PLAYER_EMAIL, teamId: TEAM_ID, firstName: "Ari", lastName: "Delivery" }],
  "sl:drills": [{ id: "form", name: "Form Shooting", desc: "Clean mechanics", max: 50, icon: "ft" }],
  "sl:program-drills": [],
  "sl:scores": [],
  "sl:program-scores": [],
  "sl:shotlogs": [{ id: "result-delivery", teamId: TEAM_ID, playerId: PLAYER_EMAIL, email: PLAYER_EMAIL, name: "Ari Delivery", made: 33, date: today, ts: Date.now() }],
  "sl:events": [],
  "sl:rsvps": [],
  "sl:sc-sessions": [],
  "sl:sc-rsvps": [],
  "sl:sc-logs": [],
  "sl:season-archives": [],
  "sl:coach-priorities": {},
};

const fulfill = (route, body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

async function installRoutes(context, state) {
  await context.route("**/v1/legacy-auth/restore", async (route) => {
    const payload = route.request().postDataJSON?.() || {};
    const requester = String(payload.email || route.request().headers()["x-user-id"] || "").toLowerCase();
    const profile = requester === COACH_EMAIL
      ? { email: COACH_EMAIL, name: "Delivery Coach", role: "coach", team_id: TEAM_ID }
      : { email: PLAYER_EMAIL, name: "Ari Delivery", role: "player", team_id: TEAM_ID };
    await fulfill(route, { ok: true, profile });
  });

  await context.route("**/v1/coach/activity/first-results**", (route) => fulfill(route, {
    ok: true,
    team_id: TEAM_ID,
    count: 1,
    results: [{
      id: "result-delivery",
      team_id: TEAM_ID,
      player_id: PLAYER_EMAIL,
      player_email: PLAYER_EMAIL,
      player_name: "Ari Delivery",
      made: 33,
      date: today,
      observed_at: new Date().toISOString(),
    }],
  }));

  await context.route("**/v1/player-assignments**", async (route) => {
    const request = route.request();
    const requester = String(request.headers()["x-user-id"] || "").toLowerCase();
    if (request.method() === "GET") {
      const visible = state.assignment && (requester === COACH_EMAIL || requester === PLAYER_EMAIL) ? [state.assignment] : [];
      await fulfill(route, { ok: true, storage_mode: "team_remote", team_id: TEAM_ID, assignments: visible });
      return;
    }
    const payload = request.postDataJSON();
    const now = new Date().toISOString();
    if (payload.action === "assign") {
      state.assignment = {
        teamId: TEAM_ID,
        playerIdentity: payload.assignment.player_identity,
        playerName: payload.assignment.player_name,
        assignmentText: payload.assignment.assignment_text,
        resultDetail: payload.assignment.result_detail,
        state: "assigned",
        assignedBy: COACH_EMAIL,
        createdAt: now,
        updatedAt: now,
        acknowledgedAt: "",
        startedAt: "",
        completedAt: "",
      };
    } else {
      const nextState = payload.action === "acknowledge" ? "acknowledged" : payload.action === "start" ? "started" : "completed";
      state.assignment = {
        ...state.assignment,
        state: nextState,
        updatedAt: now,
        ...(nextState === "acknowledged" ? { acknowledgedAt: now } : {}),
        ...(nextState === "started" ? { startedAt: now } : {}),
        ...(nextState === "completed" ? { completedAt: now } : {}),
      };
    }
    await fulfill(route, { ok: true, storage_mode: "team_remote", team_id: TEAM_ID, assignment: state.assignment });
  });

  await context.route("**/v1/coach-follow-ups**", async (route) => {
    if (route.request().method() === "GET") {
      await fulfill(route, { ok: true, storage_mode: "team_remote", follow_ups: state.followUp ? [state.followUp] : [] });
      return;
    }
    const payload = route.request().postDataJSON();
    state.followUp = {
      teamId: payload.team_id,
      playerIdentity: payload.player_identity,
      playerName: payload.player_name,
      state: payload.state,
      note: payload.note,
      createdAt: payload.created_at,
      updatedAt: new Date().toISOString(),
      completedAt: "",
      updatedBy: COACH_EMAIL,
    };
    await fulfill(route, { ok: true, storage_mode: "team_remote", follow_up: state.followUp });
  });

  await context.route("**/v1/team-priorities**", (route) => fulfill(route, { ok: true, storage_mode: "team_remote", priorities_by_team: {} }));
  await context.route("**/v1/season-archives**", (route) => fulfill(route, { ok: true, archives: [] }));
  await context.route("**/v1/leaderboards/home-shots**", (route) => fulfill(route, { team_id: TEAM_ID, scope: "players", count: 1, leaderboard: [{ rank: 1, player_display_name: "Ari Delivery", total_home_shots: 33 }] }));
  await context.route("**/v1/coach/players/provision**", (route) => fulfill(route, { ok: true, invitations: [] }));
  await context.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => fulfill(route, []));
}

async function seed(context, session) {
  await context.addInitScript(({ data, activeSession }) => {
    window.localStorage.clear();
    for (const [key, value] of Object.entries(data)) window.localStorage.setItem(key, JSON.stringify(value));
    window.localStorage.setItem("sl:session", JSON.stringify(activeSession));
  }, { data: commonSeed, activeSession: session });
}

test("coach assignment reaches the exact player and completion returns to the coach", async ({ browser }) => {
  const state = { assignment: null, followUp: null };
  const coachContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const playerContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await installRoutes(coachContext, state);
  await installRoutes(playerContext, state);
  await seed(coachContext, { email: COACH_EMAIL, role: "coach", teamId: TEAM_ID });
  await seed(playerContext, { email: PLAYER_EMAIL, role: "player", teamId: TEAM_ID });

  const coachPage = await coachContext.newPage();
  await coachPage.goto("/");
  await expect(coachPage.getByTestId("coach-command-center-full")).toBeVisible({ timeout: 20_000 });
  const activity = coachPage.getByTestId("coach-live-activity");
  await expect(activity).toContainText("Ari Delivery");
  await activity.getByRole("button", { name: /Review Ari Delivery result and record next assignment/ }).click();

  const drawer = coachPage.getByTestId("coach-player-intelligence-drawer");
  await expect(drawer).toBeVisible({ timeout: 20_000 });
  const assignmentInput = coachPage.getByTestId("coach-next-assignment-input");
  await expect(assignmentInput).toHaveValue(/match or improve 33 makes/i);
  await assignmentInput.fill("Repeat Form Shooting and match or improve 33 makes with balanced footwork.");
  await coachPage.getByRole("button", { name: "Deliver next assignment", exact: true }).click();
  await expect(coachPage.getByTestId("coach-player-assignment-status")).toHaveAttribute("data-assignment-state", "assigned");
  await expect(coachPage.getByRole("status").last()).toContainText("Assignment delivered to the player");
  expect(state.assignment.playerIdentity).toBe(PLAYER_EMAIL);
  expect(state.assignment.assignmentText).toContain("balanced footwork");
  expect(state.assignment).not.toHaveProperty("note");
  await drawer.getByRole("button", { name: "Close details", exact: true }).last().click();

  const playerPage = await playerContext.newPage();
  await playerPage.goto("/");
  await expect(playerPage.getByTestId("player-daily-command-center")).toBeVisible({ timeout: 20_000 });
  const card = playerPage.getByTestId("player-coach-assignment");
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(card).toContainText("Repeat Form Shooting and match or improve 33 makes with balanced footwork.");
  await expect(card).toContainText("Home shots · 33 makes");
  await expect(card).not.toContainText(/private coach note/i);

  await playerPage.getByTestId("player-assignment-action").click();
  await expect(card).toHaveAttribute("data-assignment-state", "acknowledged");
  await playerPage.getByTestId("player-assignment-action").click();
  await expect(card).toHaveAttribute("data-assignment-state", "started");
  await playerPage.getByTestId("player-assignment-action").click();
  await expect(card).toHaveAttribute("data-assignment-state", "completed");
  await expect(card.getByRole("status")).toContainText("Assignment marked complete");

  await coachPage.bringToFront();
  await coachPage.evaluate(() => window.dispatchEvent(new Event("focus")));
  const roster = coachPage.locator("#coach-roster-operations");
  await expect(roster).toBeVisible({ timeout: 20_000 });
  await roster.locator('[role="button"]').filter({ hasText: "Ari Delivery" }).first().click();
  await expect(coachPage.getByTestId("coach-player-intelligence-drawer")).toBeVisible({ timeout: 20_000 });
  await expect(coachPage.getByTestId("coach-player-assignment-status")).toHaveAttribute("data-assignment-state", "completed");
  await expect(coachPage.getByTestId("coach-player-assignment-status")).toContainText("Player completed");

  const widths = await playerPage.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 2);

  await playerContext.close();
  await coachContext.close();
});
