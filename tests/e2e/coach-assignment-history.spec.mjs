import { test, expect } from "@playwright/test";

const TEAM_ID = "team-assignment-history";
const COACH_EMAIL = "coach.history@example.com";
const PLAYER_EMAIL = "player.history@example.com";
const PLAYER_NAME = "History Player";
const OLD_ASSIGNMENT = "Complete the form shooting ladder.";
const NEW_ASSIGNMENT = "Complete the five-spot shooting ladder and record every spot.";

const completedAssignment = {
  team_id: TEAM_ID,
  player_identity: PLAYER_EMAIL,
  player_name: PLAYER_NAME,
  assignment_text: OLD_ASSIGNMENT,
  result_detail: "42 makes",
  due_date: "2026-08-02",
  state: "completed",
  assigned_by: COACH_EMAIL,
  created_at: "2026-08-01T12:00:00.000Z",
  updated_at: "2026-08-02T16:00:00.000Z",
  acknowledged_at: "2026-08-01T13:00:00.000Z",
  started_at: "2026-08-01T14:00:00.000Z",
  completed_at: "2026-08-02T16:00:00.000Z",
};

const seed = {
  "sl:teams": [{ id: TEAM_ID, name: "History Elite", ownerCoachId: COACH_EMAIL, joinCode: "HIST" }],
  "sl:players": [
    { id: "coach", email: COACH_EMAIL, name: "History Coach", role: "coach", isCoach: true, teamId: TEAM_ID },
    { id: "player", email: PLAYER_EMAIL, name: PLAYER_NAME, role: "player", teamId: TEAM_ID },
  ],
  "sl:player-profiles": [],
  "sl:drills": [{ id: "form", name: "Form Shooting" }],
  "sl:program-drills": [],
  "sl:coach-priorities": {},
  "sl:scores": [],
  "sl:program-scores": [],
  "sl:shotlogs": [],
  "sl:sc-logs": [],
  "sl:events": [],
  "sl:rsvps": [],
  "sl:sc-sessions": [],
  "sl:sc-rsvps": [],
  "sl:season-archives": [],
};

const fulfill = (route, body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

async function installRoutes(context, state) {
  await context.route("**/v1/legacy-auth/restore", (route) => fulfill(route, { ok: true, profile: { email: COACH_EMAIL, name: "History Coach", role: "coach", team_id: TEAM_ID } }));
  await context.route("**/v1/player-assignments**", async (route) => {
    if (route.request().method() === "GET") {
      await fulfill(route, { ok: true, storage_mode: "team_remote", team_id: TEAM_ID, assignments: [state.current] });
      return;
    }
    await fulfill(route, { error: "unexpected_assignment_write" }, 500);
  });
  await context.route("**/v1/player-assignment-history**", async (route) => {
    if (route.request().method() === "GET") {
      await fulfill(route, { ok: true, storage_mode: "team_remote", team_id: TEAM_ID, history: state.history });
      return;
    }
    const payload = route.request().postDataJSON();
    state.requests.push(payload);
    const now = new Date().toISOString();
    const archived = { ...state.current, archived_at: now };
    state.history = [archived, ...state.history];
    state.current = {
      team_id: TEAM_ID,
      player_identity: PLAYER_EMAIL,
      player_name: PLAYER_NAME,
      assignment_text: payload.assignment.assignment_text,
      result_detail: "",
      due_date: payload.assignment.due_date || null,
      state: "assigned",
      assigned_by: COACH_EMAIL,
      created_at: now,
      updated_at: now,
      acknowledged_at: null,
      started_at: null,
      completed_at: null,
    };
    await fulfill(route, { ok: true, storage_mode: "team_remote", archived_previous: true, archived_assignment: archived, assignment: state.current });
  });
  await context.route("**/v1/coach-follow-ups**", (route) => fulfill(route, { ok: true, storage_mode: "team_remote", follow_ups: [] }));
  await context.route("**/v1/coach/activity/first-results**", (route) => fulfill(route, { ok: true, team_id: TEAM_ID, count: 0, results: [] }));
  await context.route("**/v1/team-priorities**", (route) => fulfill(route, { ok: true, storage_mode: "team_remote", priorities_by_team: {} }));
  await context.route("**/v1/season-archives**", (route) => fulfill(route, { ok: true, archives: [] }));
  await context.route("**/v1/leaderboards/home-shots**", (route) => fulfill(route, { team_id: TEAM_ID, scope: "players", count: 0, leaderboard: [] }));
  await context.route("**/v1/coach/players/provision**", (route) => fulfill(route, { ok: true, invitations: [] }));
  await context.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => fulfill(route, []));
}

async function seedContext(context) {
  await context.addInitScript(({ payload, session }) => {
    window.localStorage.clear();
    for (const [key, value] of Object.entries(payload)) window.localStorage.setItem(key, JSON.stringify(value));
    window.localStorage.setItem("sl:session", JSON.stringify(session));
  }, { payload: seed, session: { email: COACH_EMAIL, role: "coach", teamId: TEAM_ID } });
}

test("coach assigns next without erasing the completed assignment", async ({ browser }) => {
  const state = { current: { ...completedAssignment }, history: [], requests: [] };
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await installRoutes(context, state);
  await seedContext(context);
  const page = await context.newPage();
  await page.goto("/");

  const panel = page.getByTestId("coach-assignment-accountability");
  await expect(panel).toBeVisible({ timeout: 20_000 });
  const completedRow = panel.locator(`.mcAssignmentAccountabilityRow[data-player-email="${PLAYER_EMAIL}"][data-assignment-state="completed"]`);
  await expect(completedRow).toBeVisible();
  await expect(completedRow.locator("em")).toContainText("Assign next");

  await completedRow.click();
  const sheet = page.getByTestId("coach-assign-next");
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText("never overwrites active work");
  await page.getByTestId("coach-assign-next-input").fill(NEW_ASSIGNMENT);
  await page.getByTestId("coach-assign-next-submit").click();
  await expect(sheet).toHaveAttribute("data-state", "delivered");
  await expect(sheet).toContainText("preserved in history");

  expect(state.requests).toHaveLength(1);
  expect(state.requests[0]).toMatchObject({
    team_id: TEAM_ID,
    assignment: { player_identity: PLAYER_EMAIL, assignment_text: NEW_ASSIGNMENT },
  });
  expect("private_note" in state.requests[0].assignment).toBe(false);
  expect("coach_note" in state.requests[0].assignment).toBe(false);

  await sheet.getByRole("button", { name: "Done", exact: true }).click();
  await expect(panel.locator(`[data-player-email="${PLAYER_EMAIL}"][data-assignment-state="assigned"]`)).toBeVisible();

  const history = page.getByTestId("coach-assignment-history");
  await expect(history).toBeVisible();
  await history.locator("summary").click();
  await expect(history).toContainText(OLD_ASSIGNMENT);
  await expect(history).not.toContainText("private note");
  await expect(history).toHaveAttribute("data-history-count", "1");

  const current = await page.evaluate(({ teamId, player }) => {
    const store = JSON.parse(localStorage.getItem("sl:player-assignments") || "{}");
    return store[`${teamId}::${player}`] || null;
  }, { teamId: TEAM_ID, player: PLAYER_EMAIL });
  expect(current.assignmentText).toBe(NEW_ASSIGNMENT);
  expect(current.state).toBe("assigned");

  for (const button of await sheet.locator("button:visible").all()) {
    const box = await button.boundingBox();
    if (box) expect(box.height).toBeGreaterThanOrEqual(44);
  }
  const widths = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 2);
  await context.close();
});
