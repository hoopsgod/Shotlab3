import { test, expect } from "@playwright/test";

const TEAM_ID = "team-assignment-deadline";
const COACH_EMAIL = "coach.deadline@example.com";
const PLAYER_EMAIL = "player.deadline@example.com";
const PLAYER_NAME = "Deadline Player";
const EXISTING_EMAIL = "existing.deadline@example.com";

const dateKeyFromOffset = (days) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const players = [
  { id: "coach", email: COACH_EMAIL, name: "Deadline Coach", role: "coach", isCoach: true, teamId: TEAM_ID },
  { id: "target", email: PLAYER_EMAIL, name: PLAYER_NAME, role: "player", teamId: TEAM_ID },
  { id: "existing", email: EXISTING_EMAIL, name: "Existing Deadline Player", role: "player", teamId: TEAM_ID },
];

const seed = {
  "sl:teams": [{ id: TEAM_ID, name: "Deadline Elite", ownerCoachId: COACH_EMAIL, joinCode: "DUE" }],
  "sl:players": players,
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

const existingAssignment = {
  team_id: TEAM_ID,
  player_identity: EXISTING_EMAIL,
  player_name: "Existing Deadline Player",
  assignment_text: "Complete the existing ball-handling assignment.",
  result_detail: "",
  due_date: dateKeyFromOffset(-1),
  state: "started",
  assigned_by: COACH_EMAIL,
  created_at: new Date(Date.now() - 120 * 60_000).toISOString(),
  updated_at: new Date(Date.now() - 60 * 60_000).toISOString(),
};

const fulfill = (route, body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

async function installRoutes(context, state) {
  await context.route("**/v1/legacy-auth/restore", async (route) => {
    const payload = route.request().postDataJSON?.() || {};
    const requester = String(payload.email || route.request().headers()["x-user-id"] || "").toLowerCase();
    const profile = requester === COACH_EMAIL
      ? { email: COACH_EMAIL, name: "Deadline Coach", role: "coach", team_id: TEAM_ID }
      : { email: PLAYER_EMAIL, name: PLAYER_NAME, role: "player", team_id: TEAM_ID };
    await fulfill(route, { ok: true, profile });
  });

  await context.route("**/v1/player-assignments**", async (route) => {
    const request = route.request();
    const requester = String(request.headers()["x-user-id"] || "").toLowerCase();
    if (request.method() === "GET") {
      const assignments = requester === COACH_EMAIL
        ? state.assignments
        : state.assignments.filter((row) => String(row.player_identity || row.playerIdentity).toLowerCase() === requester);
      await fulfill(route, { ok: true, storage_mode: "team_remote", team_id: TEAM_ID, assignments });
      return;
    }

    const payload = request.postDataJSON();
    state.requests.push(payload);
    const now = new Date().toISOString();
    if (payload.action === "assign") {
      const draft = payload.assignment || {};
      const assignment = {
        team_id: TEAM_ID,
        player_identity: draft.player_identity,
        player_name: draft.player_name,
        assignment_text: draft.assignment_text,
        result_detail: draft.result_detail || "",
        due_date: draft.due_date || null,
        state: "assigned",
        assigned_by: COACH_EMAIL,
        created_at: now,
        updated_at: now,
      };
      state.assignments = [...state.assignments.filter((row) => row.player_identity !== assignment.player_identity), assignment];
      await fulfill(route, { ok: true, storage_mode: "team_remote", team_id: TEAM_ID, assignment });
      return;
    }

    const index = state.assignments.findIndex((row) => row.player_identity === requester);
    const current = state.assignments[index];
    const nextState = payload.action === "acknowledge" ? "acknowledged" : payload.action === "start" ? "started" : "completed";
    const assignment = {
      ...current,
      state: nextState,
      updated_at: now,
      ...(nextState === "acknowledged" ? { acknowledged_at: now } : {}),
      ...(nextState === "started" ? { started_at: now } : {}),
      ...(nextState === "completed" ? { completed_at: now } : {}),
    };
    state.assignments[index] = assignment;
    await fulfill(route, { ok: true, storage_mode: "team_remote", team_id: TEAM_ID, assignment });
  });

  await context.route("**/v1/coach-follow-ups**", (route) => fulfill(route, { ok: true, storage_mode: "team_remote", follow_ups: [] }));
  await context.route("**/v1/coach/activity/first-results**", (route) => fulfill(route, { ok: true, team_id: TEAM_ID, count: 0, results: [] }));
  await context.route("**/v1/team-priorities**", (route) => fulfill(route, { ok: true, storage_mode: "team_remote", priorities_by_team: {} }));
  await context.route("**/v1/season-archives**", (route) => fulfill(route, { ok: true, archives: [] }));
  await context.route("**/v1/leaderboards/home-shots**", (route) => fulfill(route, { team_id: TEAM_ID, scope: "players", count: 0, leaderboard: [] }));
  await context.route("**/v1/coach/players/provision**", (route) => fulfill(route, { ok: true, invitations: [] }));
  await context.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => fulfill(route, []));
}

async function seedContext(context, session) {
  await context.addInitScript(({ payload, activeSession }) => {
    window.localStorage.clear();
    for (const [key, value] of Object.entries(payload)) window.localStorage.setItem(key, JSON.stringify(value));
    window.localStorage.setItem("sl:session", JSON.stringify(activeSession));
  }, { payload: seed, activeSession: session });
}

test("coach deadline reaches the exact player and overdue clears on completion", async ({ browser }) => {
  const state = { assignments: [existingAssignment], requests: [] };
  const coachContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const playerContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await installRoutes(coachContext, state);
  await installRoutes(playerContext, state);
  await seedContext(coachContext, { email: COACH_EMAIL, role: "coach", teamId: TEAM_ID });
  await seedContext(playerContext, { email: PLAYER_EMAIL, role: "player", teamId: TEAM_ID });

  const coachPage = await coachContext.newPage();
  await coachPage.goto("/");
  const panel = coachPage.getByTestId("coach-assignment-accountability");
  await expect(panel).toBeVisible({ timeout: 20_000 });
  await expect(panel).toHaveAttribute("data-overdue-count", "1");

  await panel.getByRole("button", { name: `Open ${PLAYER_NAME} assignment accountability`, exact: true }).click();
  const composer = coachPage.getByTestId("coach-quick-assign");
  await expect(composer).toBeVisible();
  const deadline = coachPage.getByTestId("coach-quick-assign-deadline");
  await expect(deadline).toBeVisible();
  await coachPage.getByTestId("coach-quick-assign-due-3").click();
  const dueDate = dateKeyFromOffset(3);
  await expect(coachPage.getByTestId("coach-quick-assign-due-date")).toHaveValue(dueDate);

  for (const control of await deadline.locator("input,button").all()) {
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    expect(box.height).toBeGreaterThanOrEqual(44);
  }

  const assignmentText = "Complete the form shooting ladder and record makes from all five spots.";
  await coachPage.getByTestId("coach-quick-assign-input").fill(assignmentText);
  await composer.getByRole("button", { name: "Deliver assignment", exact: true }).click();
  await expect(composer).toHaveAttribute("data-delivery-state", "delivered");
  expect(state.requests).toHaveLength(1);
  expect(state.requests[0]).toMatchObject({
    team_id: TEAM_ID,
    action: "assign",
    assignment: {
      player_identity: PLAYER_EMAIL,
      assignment_text: assignmentText,
      due_date: dueDate,
    },
  });
  expect("note" in state.requests[0].assignment).toBe(false);
  expect("private_note" in state.requests[0].assignment).toBe(false);
  await expect(panel).toHaveAttribute("data-overdue-count", "1");
  await composer.getByRole("button", { name: "Done", exact: true }).click();

  const playerPage = await playerContext.newPage();
  await playerPage.goto("/");
  const card = playerPage.getByTestId("player-coach-assignment");
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(card).toContainText(assignmentText);
  await expect(card).toHaveAttribute("data-assignment-overdue", "false");
  await expect(playerPage.getByTestId("player-assignment-due-date")).toContainText(/Due/i);

  const delivered = state.assignments.find((row) => row.player_identity === PLAYER_EMAIL);
  delivered.due_date = dateKeyFromOffset(-1);
  await playerPage.reload();
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(card).toHaveAttribute("data-assignment-overdue", "true");
  await expect(playerPage.getByTestId("player-assignment-due-date")).toContainText(/Overdue/i);

  await coachPage.bringToFront();
  await coachPage.evaluate(() => window.dispatchEvent(new Event("focus")));
  const targetRow = panel.locator(`[data-player-email="${PLAYER_EMAIL}"]`);
  await expect(panel).toHaveAttribute("data-overdue-count", "2");
  await expect(targetRow).toHaveAttribute("data-assignment-overdue", "true");

  await playerPage.bringToFront();
  for (const stateName of ["acknowledged", "started", "completed"]) {
    await playerPage.getByTestId("player-assignment-action").click();
    await expect(card).toHaveAttribute("data-assignment-state", stateName);
  }
  await expect(card).toHaveAttribute("data-assignment-overdue", "false");

  await coachPage.bringToFront();
  await coachPage.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(panel).toHaveAttribute("data-overdue-count", "1");

  const widths = await playerPage.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 2);

  await playerContext.close();
  await coachContext.close();
});
