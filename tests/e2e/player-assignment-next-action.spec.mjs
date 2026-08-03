import { test, expect } from "@playwright/test";

const TEAM_ID = "team-player-next-action";
const PLAYER_EMAIL = "player.next.action@example.com";
const COACH_EMAIL = "coach.next.action@example.com";
const yesterday = (() => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - 1);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
})();

const seed = {
  "sl:session": { email: PLAYER_EMAIL, role: "player", teamId: TEAM_ID },
  "sl:teams": [{ id: TEAM_ID, name: "Next Action Elite", ownerCoachId: COACH_EMAIL, joinCode: "NEXT" }],
  "sl:players": [
    { id: "coach-next", email: COACH_EMAIL, name: "Next Action Coach", role: "coach", isCoach: true, teamId: TEAM_ID },
    { id: "player-next", playerId: PLAYER_EMAIL, email: PLAYER_EMAIL, name: "Next Action Player", role: "player", teamId: TEAM_ID },
  ],
  "sl:player-profiles": [{ id: "profile-next", userId: PLAYER_EMAIL, email: PLAYER_EMAIL, teamId: TEAM_ID, firstName: "Next", lastName: "Action" }],
  "sl:drills": [{ id: "form", name: "Form Shooting", desc: "Clean mechanics", max: 50, icon: "ft" }],
  "sl:program-drills": [],
  "sl:coach-priorities": {},
  "sl:scores": [],
  "sl:program-scores": [],
  "sl:shotlogs": [{ id: "baseline", teamId: TEAM_ID, playerId: PLAYER_EMAIL, email: PLAYER_EMAIL, name: "Next Action Player", made: 24, date: new Date().toISOString().slice(0, 10), ts: Date.now() }],
  "sl:events": [],
  "sl:rsvps": [],
  "sl:sc-sessions": [],
  "sl:sc-rsvps": [],
  "sl:sc-logs": [],
  "sl:season-archives": [],
};

const fulfill = (route, body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

async function installRoutes(page, state) {
  await page.route("**/v1/legacy-auth/restore", (route) => fulfill(route, {
    ok: true,
    profile: { email: PLAYER_EMAIL, name: "Next Action Player", role: "player", team_id: TEAM_ID },
  }));

  await page.route("**/v1/player-assignments**", async (route) => {
    const request = route.request();
    if (request.method() === "GET") {
      await fulfill(route, { ok: true, storage_mode: "team_remote", team_id: TEAM_ID, assignments: [state.assignment] });
      return;
    }
    const payload = request.postDataJSON();
    state.requests.push(payload);
    const now = new Date().toISOString();
    const nextState = payload.action === "acknowledge" ? "acknowledged" : payload.action === "start" ? "started" : "completed";
    state.assignment = {
      ...state.assignment,
      state: nextState,
      updated_at: now,
      ...(nextState === "acknowledged" ? { acknowledged_at: now } : {}),
      ...(nextState === "started" ? { started_at: now } : {}),
      ...(nextState === "completed" ? { completed_at: now } : {}),
    };
    await fulfill(route, { ok: true, storage_mode: "team_remote", team_id: TEAM_ID, assignment: state.assignment });
  });

  await page.route("**/v1/team-priorities**", (route) => fulfill(route, { ok: true, storage_mode: "team_remote", priorities_by_team: {} }));
  await page.route("**/v1/season-archives**", (route) => fulfill(route, { ok: true, archives: [] }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => fulfill(route, { team_id: TEAM_ID, scope: "players", count: 1, leaderboard: [{ rank: 1, player_display_name: "Next Action Player", total_home_shots: 24 }] }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => fulfill(route, []));
}

test("coach assignment becomes the player next action and collapses after completion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const now = new Date().toISOString();
  const state = {
    requests: [],
    assignment: {
      team_id: TEAM_ID,
      player_identity: PLAYER_EMAIL,
      player_name: "Next Action Player",
      assignment_text: "Complete the five-spot shooting ladder and record makes at every spot.",
      result_detail: "Coach reviewed today’s 24 makes.",
      due_date: yesterday,
      state: "assigned",
      assigned_by: COACH_EMAIL,
      created_at: now,
      updated_at: now,
      private_note: "This must never reach the player.",
    },
  };

  await installRoutes(page, state);
  await page.addInitScript((payload) => {
    window.localStorage.clear();
    for (const [key, value] of Object.entries(payload)) window.localStorage.setItem(key, JSON.stringify(value));
  }, seed);

  await page.goto("/");
  const commandCenter = page.getByTestId("player-daily-command-center");
  await expect(commandCenter).toBeVisible({ timeout: 20_000 });
  const host = page.getByTestId("player-coach-assignment-host");
  await expect(host).toHaveAttribute("data-assignment-placement", "before-generic-primary");
  const card = page.getByTestId("player-coach-assignment");
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(card).toHaveAttribute("data-assignment-state", "assigned");
  await expect(card).toHaveAttribute("data-assignment-priority", "overdue");
  await expect(card).toHaveAttribute("data-assignment-overdue", "true");
  await expect(card).toContainText("This assignment needs attention");
  await expect(card).toContainText("Complete the five-spot shooting ladder");
  await expect(card).not.toContainText("This must never reach the player");

  const promoted = await page.evaluate(() => {
    const assignment = document.querySelector('[data-testid="player-coach-assignment"]');
    const genericPrimary = document.querySelector('[data-testid="player-daily-primary-action"]');
    return Boolean(assignment && genericPrimary && (assignment.compareDocumentPosition(genericPrimary) & Node.DOCUMENT_POSITION_FOLLOWING));
  });
  expect(promoted).toBe(true);

  await expect(page.getByTestId("player-assignment-step-acknowledge")).toHaveAttribute("data-state", "active");
  await expect(page.getByTestId("player-assignment-step-start")).toHaveAttribute("data-state", "pending");
  await expect(page.getByTestId("player-assignment-step-complete")).toHaveAttribute("data-state", "pending");

  const action = page.getByTestId("player-assignment-action");
  const actionBox = await action.boundingBox();
  expect(actionBox).not.toBeNull();
  expect(actionBox.height).toBeGreaterThanOrEqual(44);

  await action.click();
  await expect(card).toHaveAttribute("data-assignment-state", "acknowledged");
  await expect(page.getByTestId("player-assignment-step-acknowledge")).toHaveAttribute("data-state", "done");
  await expect(page.getByTestId("player-assignment-step-start")).toHaveAttribute("data-state", "active");

  await action.click();
  await expect(card).toHaveAttribute("data-assignment-state", "started");
  await expect(card).toContainText("Finish what you started");
  await expect(page.getByTestId("player-assignment-step-start")).toHaveAttribute("data-state", "done");
  await expect(page.getByTestId("player-assignment-step-complete")).toHaveAttribute("data-state", "active");

  await action.click();
  await expect(card).toHaveAttribute("data-assignment-state", "completed");
  await expect(card).toHaveAttribute("data-assignment-priority", "complete");
  await expect(card).toHaveAttribute("data-assignment-overdue", "false");
  await expect(card).toContainText("Coach assignment complete");
  await expect(card).toContainText("normal training plan is back in focus");
  await expect(page.getByTestId("player-assignment-progress")).toHaveCount(0);
  await expect(action).toBeDisabled();
  await expect(page.getByTestId("player-daily-primary-action")).toBeVisible();

  expect(state.requests.map((request) => request.action)).toEqual(["acknowledge", "start", "complete"]);
  for (const request of state.requests) {
    expect(request.team_id).toBe(TEAM_ID);
    expect(request.player_identity).toBeUndefined();
    expect(request.private_note).toBeUndefined();
  }

  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 2);
});
