import { test, expect } from "@playwright/test";

const TEAM_ID = "team-assignment-training-route";
const PLAYER_EMAIL = "assignment.route.player@shotlab.app";
const OTHER_EMAIL = "assignment.route.other@shotlab.app";
const COACH_EMAIL = "assignment.route.coach@shotlab.app";
const TODAY = new Date().toISOString().slice(0, 10);
const NOW = new Date().toISOString();

const seed = {
  "sl:session": { email: PLAYER_EMAIL, role: "player", teamId: TEAM_ID },
  "sl:teams": [{ id: TEAM_ID, name: "Assignment Route Elite", ownerCoachId: COACH_EMAIL, joinCode: "ROUTE26" }],
  "sl:players": [
    { id: "route-coach", email: COACH_EMAIL, name: "Route Coach", role: "coach", isCoach: true, teamId: TEAM_ID },
    { id: "route-player", playerId: PLAYER_EMAIL, email: PLAYER_EMAIL, name: "Route Player", role: "player", teamId: TEAM_ID },
    { id: "route-other", playerId: OTHER_EMAIL, email: OTHER_EMAIL, name: "Other Player", role: "player", teamId: TEAM_ID },
  ],
  "sl:player-profiles": [{ id: "route-profile", userId: PLAYER_EMAIL, email: PLAYER_EMAIL, teamId: TEAM_ID, firstName: "Route", lastName: "Player" }],
  "sl:drills": [
    { id: "form-shooting", name: "Form Shooting", desc: "Balanced feet", max: 50, icon: "ft" },
    { id: "corner-threes", name: "Corner Threes", desc: "Corner volume", max: 40, icon: "3p" },
  ],
  "sl:program-drills": [],
  "sl:scores": [],
  "sl:program-scores": [],
  "sl:shotlogs": [{ id: "route-baseline", teamId: TEAM_ID, playerId: PLAYER_EMAIL, email: PLAYER_EMAIL, name: "Route Player", made: 20, date: TODAY, ts: Date.now() }],
  "sl:events": [],
  "sl:rsvps": [],
  "sl:sc-sessions": [],
  "sl:sc-rsvps": [],
  "sl:sc-logs": [],
  "sl:season-archives": [],
  "sl:coach-priorities": {
    [TEAM_ID]: {
      todayFocusText: "Balance before speed",
      priorityDrillText: "Form Shooting",
      challengeText: "Finish Form Shooting first.",
      updatedAt: NOW,
    },
  },
};

const fulfill = (route, body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

async function installRoutes(page, state) {
  await page.route("**/v1/legacy-auth/restore", (route) => fulfill(route, {
    ok: true,
    profile: { email: PLAYER_EMAIL, name: "Route Player", role: "player", team_id: TEAM_ID },
  }));
  await page.route("**/v1/team-priorities**", (route) => fulfill(route, {
    ok: true,
    storage_mode: "team_remote",
    priorities_by_team: seed["sl:coach-priorities"],
  }));
  await page.route("**/v1/player-assignments**", async (route) => {
    const request = route.request();
    const requester = String(request.headers()["x-user-id"] || "").toLowerCase();
    state.requesters.push(requester);
    if (request.method() === "GET") {
      const rows = state.assignments.filter((row) => row.player_identity === requester);
      return fulfill(route, { ok: true, storage_mode: "team_remote", team_id: TEAM_ID, assignments: rows });
    }
    const payload = request.postDataJSON();
    state.actions.push(payload.action);
    const row = state.assignments.find((assignment) => assignment.player_identity === requester);
    const nextState = payload.action === "acknowledge" ? "acknowledged" : payload.action === "start" ? "started" : "completed";
    if (row) {
      row.state = nextState;
      row.updated_at = new Date().toISOString();
    }
    return fulfill(route, { ok: true, storage_mode: "team_remote", team_id: TEAM_ID, assignment: row || null });
  });
  await page.route("**/v1/season-archives**", (route) => fulfill(route, { ok: true, archives: [] }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => fulfill(route, { leaderboard: [] }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => fulfill(route, []));
}

async function noOverflow(page) {
  const widths = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 2);
}

test("starting a matching individual Coach assignment lands on the exact coach-priority training control", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state = {
    actions: [],
    requesters: [],
    assignments: [
      {
        team_id: TEAM_ID,
        player_identity: PLAYER_EMAIL,
        player_name: "Route Player",
        assignment_text: "Complete Form Shooting with balanced feet before adding speed.",
        result_detail: "Coach priority",
        state: "assigned",
        assigned_by: COACH_EMAIL,
        created_at: NOW,
        updated_at: NOW,
      },
      {
        team_id: TEAM_ID,
        player_identity: OTHER_EMAIL,
        player_name: "Other Player",
        assignment_text: "THIS ASSIGNMENT BELONGS TO THE OTHER PLAYER",
        result_detail: "Isolation sentinel",
        state: "assigned",
        assigned_by: COACH_EMAIL,
        created_at: NOW,
        updated_at: NOW,
      },
    ],
  };

  await installRoutes(page, state);
  await page.addInitScript((payload) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    for (const [key, value] of Object.entries(payload)) window.localStorage.setItem(key, JSON.stringify(value));
  }, seed);
  await page.goto("/");

  const card = page.getByTestId("player-coach-assignment");
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(card).toContainText("Complete Form Shooting with balanced feet");
  await expect(page.getByText("THIS ASSIGNMENT BELONGS TO THE OTHER PLAYER", { exact: true })).toHaveCount(0);
  await expect(page.getByTestId("player-daily-primary-action")).toHaveText("Start coach priority");

  const assignmentAction = page.getByTestId("player-assignment-action");
  await assignmentAction.click();
  await expect(card).toHaveAttribute("data-assignment-state", "acknowledged");
  await expect(assignmentAction).toHaveText("Start assignment");
  await assignmentAction.click();

  const session = page.getByTestId("player-training-session");
  await expect(session).toBeVisible({ timeout: 20_000 });
  await expect(session.getByRole("heading", { name: "Form Shooting", exact: true })).toBeVisible();
  await expect(session.locator('input[type="number"]').first()).toBeVisible();
  expect(state.actions).toEqual(["acknowledge", "start"]);
  expect(state.requesters.filter(Boolean).length).toBeGreaterThan(0);
  expect(state.requesters.filter(Boolean).every((requester) => requester === PLAYER_EMAIL)).toBe(true);
  await noOverflow(page);
});
