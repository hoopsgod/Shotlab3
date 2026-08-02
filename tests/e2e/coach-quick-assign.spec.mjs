import { test, expect } from "@playwright/test";

const TEAM_ID = "team-quick-assign";
const COACH_EMAIL = "coach.quick.assign@example.com";
const PLAYER_EMAIL = "unassigned.quick@example.test";
const PLAYER_NAME = "Unassigned Quick Player";

const players = [
  { id: "coach", email: COACH_EMAIL, name: "Quick Assign Coach", role: "coach", isCoach: true, teamId: TEAM_ID },
  { id: "unassigned", email: PLAYER_EMAIL, name: PLAYER_NAME, role: "player", teamId: TEAM_ID },
  { id: "assigned", email: "active.assignment@example.test", name: "Active Assignment Player", role: "player", teamId: TEAM_ID },
];

const seed = {
  "sl:session": { email: COACH_EMAIL, role: "coach", teamId: TEAM_ID },
  "sl:teams": [{ id: TEAM_ID, name: "Quick Assign Elite", ownerCoachId: COACH_EMAIL, joinCode: "QUICK" }],
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
  player_identity: "active.assignment@example.test",
  player_name: "Active Assignment Player",
  assignment_text: "Existing assignment must not be overwritten.",
  result_detail: "Existing result context",
  state: "started",
  assigned_by: COACH_EMAIL,
  created_at: new Date(Date.now() - 120 * 60_000).toISOString(),
  updated_at: new Date(Date.now() - 60 * 60_000).toISOString(),
};

async function installRoutes(page, state) {
  await page.route("**/v1/legacy-auth/restore", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      ok: true,
      profile: { email: COACH_EMAIL, name: "Quick Assign Coach", role: "coach", team_id: TEAM_ID },
    }),
  }));
  await page.route("**/v1/player-assignments**", async (route) => {
    const request = route.request();
    if (request.method() === "POST") {
      const payload = request.postDataJSON();
      state.requests.push(payload);
      const draft = payload.assignment || {};
      const assignment = {
        team_id: TEAM_ID,
        player_identity: draft.player_identity,
        player_name: draft.player_name,
        assignment_text: draft.assignment_text,
        result_detail: draft.result_detail || "",
        state: "assigned",
        assigned_by: COACH_EMAIL,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      state.assignments = [
        ...state.assignments.filter((row) => row.player_identity !== assignment.player_identity),
        assignment,
      ];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, storage_mode: "team_remote", assignment }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, storage_mode: "team_remote", team_id: TEAM_ID, assignments: state.assignments }),
    });
  });
  await page.route("**/v1/coach-follow-ups**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, storage_mode: "team_remote", follow_ups: [] }) }));
  await page.route("**/v1/coach/activity/first-results**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, team_id: TEAM_ID, count: 0, results: [] }) }));
  await page.route("**/v1/team-priorities", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, storage_mode: "team_remote", priorities_by_team: {} }) }));
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ team_id: TEAM_ID, scope: "players", count: 0, leaderboard: [] }) }));
  await page.route("**/v1/coach/players/provision**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

test("coach quick assigns an unassigned player without overwriting active work", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state = { assignments: [existingAssignment], requests: [] };
  await installRoutes(page, state);
  await page.addInitScript((payload) => {
    window.localStorage.clear();
    for (const [key, value] of Object.entries(payload)) window.localStorage.setItem(key, JSON.stringify(value));
  }, seed);

  await page.goto("/");
  const panel = page.getByTestId("coach-assignment-accountability");
  await expect(panel).toBeVisible({ timeout: 20_000 });
  await expect(panel).toHaveAttribute("data-unassigned-count", "1");
  await expect(panel).toHaveAttribute("data-started-count", "1");
  await expect(page.getByTestId("coach-quick-assign")).toHaveCount(0);

  await panel.getByRole("button", { name: `Open ${PLAYER_NAME} assignment accountability`, exact: true }).click();
  const composer = page.getByTestId("coach-quick-assign");
  await expect(composer).toBeVisible();
  await expect(composer).toHaveAttribute("data-player-email", PLAYER_EMAIL);
  const input = page.getByTestId("coach-quick-assign-input");
  await expect(input).toBeFocused();

  await composer.getByRole("button", { name: "Deliver assignment", exact: true }).click();
  await expect(composer.getByRole("status")).toContainText("Add an assignment before delivering it.");
  expect(state.requests).toHaveLength(0);

  const assignmentText = "Complete the form shooting ladder and record makes from all five spots.";
  await input.fill(assignmentText);
  await composer.getByRole("button", { name: "Deliver assignment", exact: true }).click();

  await expect(composer).toHaveAttribute("data-delivery-state", "delivered");
  await expect(composer.getByRole("status")).toContainText("Assignment delivered to the player.");
  await expect(input).toBeDisabled();
  await expect(panel).toHaveAttribute("data-unassigned-count", "0");
  await expect(panel).toHaveAttribute("data-assigned-count", "1");
  await expect(panel).toHaveAttribute("data-started-count", "1");
  await expect(panel).toContainText("2/2 assigned");

  expect(state.requests).toHaveLength(1);
  expect(state.requests[0]).toMatchObject({
    team_id: TEAM_ID,
    action: "assign",
    assignment: {
      player_identity: PLAYER_EMAIL,
      player_name: PLAYER_NAME,
      assignment_text: assignmentText,
      result_detail: "",
    },
  });
  expect("note" in state.requests[0].assignment).toBe(false);
  expect("private_note" in state.requests[0].assignment).toBe(false);
  expect(state.assignments.find((row) => row.player_identity === "active.assignment@example.test")?.assignment_text)
    .toBe("Existing assignment must not be overwritten.");

  for (const button of await composer.locator("button").all()) {
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect(box.height).toBeGreaterThanOrEqual(44);
  }

  await composer.getByRole("button", { name: "Open player", exact: true }).click();
  const rail = page.getByTestId("coach-players-filter-rail");
  await expect(rail).toBeVisible({ timeout: 20_000 });
  await expect(rail.locator('input[type="search"]')).toHaveValue(PLAYER_EMAIL);
  await expect(page.locator('#coach-roster-operations [role="button"]')).toHaveCount(1);
  await expect(page.getByRole("dialog", { name: PLAYER_NAME, exact: true })).toBeVisible({ timeout: 20_000 });

  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 2);
});
