import { test, expect } from "@playwright/test";

const TEAM_ID = "team-assignment-delivery";
const COACH_EMAIL = "coach.delivery@shotlab.app";
const PLAYER_EMAIL = "ari.delivery@example.com";
const now = Date.now();
const iso = new Date(now).toISOString();

const commonSeed = {
  "sl:teams": [{ id: TEAM_ID, name: "Delivery Team", ownerCoachId: COACH_EMAIL, joinCode: "DELIVERY", createdAt: now }],
  "sl:players": [
    { id: "coach-delivery", email: COACH_EMAIL, name: "Delivery Coach", role: "coach", teamId: TEAM_ID },
    { id: "player-delivery", email: PLAYER_EMAIL, name: "Ari Delivery", role: "player", teamId: TEAM_ID },
  ],
  "sl:player-profiles": [{ id: "player-delivery", email: PLAYER_EMAIL, name: "Ari Delivery", teamId: TEAM_ID, role: "player" }],
  "sl:home-drills": [{ id: "form", name: "Form Shooting", category: "Shooting", scoringType: "makes", target: 50 }],
  "sl:program-drills": [],
  "sl:scores": [],
  "sl:program-scores": [],
  "sl:shotlogs": [{ id: "shot-delivery", email: PLAYER_EMAIL, name: "Ari Delivery", player_id: "player-delivery", team_id: TEAM_ID, drill_id: "form", drill_name: "Form Shooting", made: 33, attempted: 50, date: iso.slice(0, 10), ts: now, src: "home", syncState: "remote_saved" }],
  "sl:events": [],
  "sl:rsvps": [],
  "sl:sc-sessions": [],
  "sl:sc-rsvps": [],
  "sl:sc-logs": [],
  "sl:season-archives": [],
};

const fulfill = (route, body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

async function installRoutes(context, state) {
  await context.route("**/v1/player-assignments**", async (route) => {
    const request = route.request();
    if (request.method() === "GET") {
      const url = new URL(request.url());
      if (url.searchParams.get("scope") === "team") {
        return fulfill(route, { ok: true, storage_mode: "team_remote", team_id: TEAM_ID, assignments: state.assignment ? [state.assignment] : [] });
      }
      return fulfill(route, { ok: true, storage_mode: "team_remote", assignments: state.assignment ? [state.assignment] : [] });
    }
    const payload = request.postDataJSON();
    if (payload.action === "assign") {
      state.assignment = {
        id: "assignment-delivery",
        teamId: TEAM_ID,
        playerIdentity: String(payload.assignment?.player_identity || payload.player_identity || PLAYER_EMAIL).toLowerCase(),
        playerName: payload.assignment?.player_name || "Ari Delivery",
        assignmentText: payload.assignment?.assignment_text || "",
        resultDetail: payload.assignment?.result_detail || "Home shots · 33 makes",
        state: "assigned",
        assignedBy: COACH_EMAIL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return fulfill(route, { ok: true, storage_mode: "team_remote", assignment: state.assignment });
    }
    const nextState = payload.action === "acknowledge" ? "acknowledged" : payload.action === "start" ? "started" : payload.action === "complete" ? "completed" : state.assignment?.state;
    state.assignment = { ...state.assignment, state: nextState, updatedAt: new Date().toISOString(), ...(nextState === "completed" ? { completedAt: new Date().toISOString() } : {}) };
    return fulfill(route, { ok: true, storage_mode: "team_remote", assignment: state.assignment });
  });

  await context.route("**/v1/coach/activity/first-results**", (route) => fulfill(route, {
    ok: true,
    team_id: TEAM_ID,
    count: 1,
    results: [{ id: "activity-delivery", player_email: PLAYER_EMAIL, player_name: "Ari Delivery", detail: "Home shots · 33 makes", meta: "Today", made: 33, date: iso.slice(0, 10), ts: now }],
  }));
  await context.route("**/v1/coach-follow-ups**", async (route) => {
    const request = route.request();
    if (request.method() === "GET") return fulfill(route, { ok: true, storage_mode: "team_remote", follow_ups: state.followUp ? [state.followUp] : [] });
    const payload = request.postDataJSON();
    state.followUp = {
      id: "followup-delivery",
      teamId: TEAM_ID,
      playerIdentity: PLAYER_EMAIL,
      playerName: "Ari Delivery",
      state: payload.follow_up?.state || "open",
      note: payload.follow_up?.note || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return fulfill(route, { ok: true, storage_mode: "team_remote", follow_up: state.followUp });
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
  const coachDock = coachPage.getByTestId("mobile-navigation-dock");
  await expect(coachDock).toBeVisible({ timeout: 20_000 });
  await coachDock.getByRole("button", { name: "Players", exact: true }).click();
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