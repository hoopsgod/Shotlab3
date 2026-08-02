import { test, expect } from "@playwright/test";

const TEAM_ID = "team-assignment-accountability";
const COACH_EMAIL = "coach.accountability@example.com";
const now = new Date().toISOString();

const players = [
  { id: "coach", email: COACH_EMAIL, name: "Accountability Coach", role: "coach", isCoach: true, teamId: TEAM_ID },
  { id: "unassigned", email: "unassigned@example.test", name: "Unassigned Player", role: "player", teamId: TEAM_ID },
  { id: "assigned", email: "assigned@example.test", name: "Assigned Player", role: "player", teamId: TEAM_ID },
  { id: "ack", email: "ack@example.test", name: "Acknowledged Player", role: "player", teamId: TEAM_ID },
  { id: "started", email: "started@example.test", name: "Started Player", role: "player", teamId: TEAM_ID },
  { id: "completed", email: "completed@example.test", name: "Completed Player", role: "player", teamId: TEAM_ID },
];

const seed = {
  "sl:session": { email: COACH_EMAIL, role: "coach", teamId: TEAM_ID },
  "sl:teams": [{ id: TEAM_ID, name: "Accountability Elite", ownerCoachId: COACH_EMAIL, joinCode: "ACCOUNT" }],
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

const makeAssignment = (email, name, state, offsetMinutes) => ({
  team_id: TEAM_ID,
  player_identity: email,
  player_name: name,
  assignment_text: `Complete the ${name} shooting block.`,
  result_detail: "Home shots · 33 makes",
  state,
  assigned_by: COACH_EMAIL,
  created_at: new Date(Date.now() - offsetMinutes * 60_000).toISOString(),
  updated_at: new Date(Date.now() - offsetMinutes * 60_000).toISOString(),
  note: "NEVER DISPLAY THIS PRIVATE COACH NOTE",
  private_note: "NEVER DISPLAY THIS PRIVATE COACH NOTE",
});

async function installRoutes(page, state) {
  await page.route("**/v1/legacy-auth/restore", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      ok: true,
      profile: {
        email: COACH_EMAIL,
        name: "Accountability Coach",
        role: "coach",
        team_id: TEAM_ID,
      },
    }),
  }));
  await page.route("**/v1/player-assignments**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, storage_mode: "team_remote", team_id: TEAM_ID, assignments: state.assignments }),
  }));
  await page.route("**/v1/coach-follow-ups**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, storage_mode: "team_remote", follow_ups: [] }) }));
  await page.route("**/v1/coach/activity/first-results**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, team_id: TEAM_ID, count: 0, results: [] }) }));
  await page.route("**/v1/team-priorities", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, storage_mode: "team_remote", priorities_by_team: {} }) }));
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ team_id: TEAM_ID, scope: "players", count: 0, leaderboard: [] }) }));
  await page.route("**/v1/coach/players/provision**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

test("Mission Control shows team-wide assignment accountability and opens the exact player", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state = {
    assignments: [
      makeAssignment("assigned@example.test", "Assigned Player", "assigned", 240),
      makeAssignment("ack@example.test", "Acknowledged Player", "acknowledged", 180),
      makeAssignment("started@example.test", "Started Player", "started", 120),
      { ...makeAssignment("completed@example.test", "Completed Player", "completed", 60), completed_at: now },
    ],
  };
  await installRoutes(page, state);
  await page.addInitScript((payload) => {
    window.localStorage.clear();
    for (const [key, value] of Object.entries(payload)) window.localStorage.setItem(key, JSON.stringify(value));
  }, seed);

  await page.goto("/");
  await expect(page.getByTestId("coach-command-center-full")).toBeVisible({ timeout: 20_000 });
  const panel = page.getByTestId("coach-assignment-accountability");
  await expect(panel).toBeVisible({ timeout: 20_000 });
  await expect(panel).toHaveAttribute("data-total-count", "5");
  await expect(panel).toHaveAttribute("data-unassigned-count", "1");
  await expect(panel).toHaveAttribute("data-assigned-count", "1");
  await expect(panel).toHaveAttribute("data-acknowledged-count", "1");
  await expect(panel).toHaveAttribute("data-started-count", "1");
  await expect(panel).toHaveAttribute("data-completed-count", "1");
  await expect(panel).toContainText("4 ACTIONS");
  await expect(panel).toContainText("4/5 assigned · 75% responded · 25% completed");
  await expect(panel).not.toContainText("NEVER DISPLAY THIS PRIVATE COACH NOTE");

  const actionRows = panel.locator("button.mcAssignmentAccountabilityRow");
  await expect(actionRows).toHaveCount(4);
  await expect(actionRows.nth(0)).toContainText("Unassigned Player");
  await expect(actionRows.nth(1)).toContainText("Assigned Player");
  await expect(actionRows.nth(2)).toContainText("Acknowledged Player");
  await expect(actionRows.nth(3)).toContainText("Started Player");
  for (let index = 0; index < 4; index += 1) {
    const box = await actionRows.nth(index).boundingBox();
    expect(box).not.toBeNull();
    expect(box.height).toBeGreaterThanOrEqual(44);
  }

  state.assignments = state.assignments.map((row) => row.player_identity === "assigned@example.test"
    ? { ...row, state: "completed", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    : row);
  await page.evaluate(() => window.dispatchEvent(new CustomEvent("shotlab:player-assignment-changed")));
  await expect(panel).toHaveAttribute("data-assigned-count", "0");
  await expect(panel).toHaveAttribute("data-completed-count", "2");
  await expect(panel).toContainText("3 ACTIONS");

  const exactPlayer = panel.getByRole("button", { name: "Open Acknowledged Player assignment accountability", exact: true });
  await exactPlayer.click();
  const rail = page.getByTestId("coach-players-filter-rail");
  await expect(rail).toBeVisible({ timeout: 20_000 });
  await expect(rail.locator('input[type="search"]')).toHaveValue("ack@example.test");
  await expect(page.locator('#coach-roster-operations [role="button"]')).toHaveCount(1);
  await expect(page.getByTestId("coach-player-intelligence-drawer")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("dialog", { name: "Acknowledged Player", exact: true })).toBeVisible();

  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 2);
});
