import { test, expect } from "@playwright/test";

const TEAM_ID = "team-coach-player-workflow";
const COACH_EMAIL = "workflow.coach@shotlab.app";
const PLAYER_EMAIL = "ari.workflow@example.com";
const SECOND_PLAYER_EMAIL = "bea.workflow@example.com";
const now = Date.now();
const iso = new Date(now).toISOString();

const seedData = {
  "sl:teams": [{ id: TEAM_ID, name: "Workflow Team", ownerCoachId: COACH_EMAIL, joinCode: "FLOW26", createdAt: now }],
  "sl:players": [
    { id: "workflow-coach", email: COACH_EMAIL, name: "Workflow Coach", role: "coach", teamId: TEAM_ID },
    { id: "workflow-ari", email: PLAYER_EMAIL, name: "Ari Workflow", role: "player", teamId: TEAM_ID },
    { id: "workflow-bea", email: SECOND_PLAYER_EMAIL, name: "Bea Workflow", role: "player", teamId: TEAM_ID },
  ],
  "sl:player-profiles": [
    { id: "workflow-profile-ari", userId: PLAYER_EMAIL, email: PLAYER_EMAIL, firstName: "Ari", lastName: "Workflow", teamId: TEAM_ID },
    { id: "workflow-profile-bea", userId: SECOND_PLAYER_EMAIL, email: SECOND_PLAYER_EMAIL, firstName: "Bea", lastName: "Workflow", teamId: TEAM_ID },
  ],
  "sl:home-drills": [{ id: "form", name: "Form Shooting", category: "Shooting", scoringType: "makes", target: 50 }],
  "sl:program-drills": [],
  "sl:scores": [],
  "sl:program-scores": [],
  "sl:shotlogs": [{
    id: "workflow-shot-ari",
    email: PLAYER_EMAIL,
    name: "Ari Workflow",
    player_id: "workflow-ari",
    team_id: TEAM_ID,
    drill_id: "form",
    drill_name: "Form Shooting",
    made: 33,
    attempted: 50,
    date: iso.slice(0, 10),
    ts: now,
    src: "home",
    syncState: "remote_saved",
  }],
  "sl:events": [],
  "sl:rsvps": [],
  "sl:sc-sessions": [],
  "sl:sc-rsvps": [],
  "sl:sc-logs": [],
  "sl:season-archives": [],
};

const fulfill = (route, body, status = 200) => route.fulfill({
  status,
  contentType: "application/json",
  body: JSON.stringify(body),
});

async function installRoutes(context, state) {
  await context.route("**/v1/legacy-auth/restore", async (route) => fulfill(route, {
    ok: true,
    profile: { email: COACH_EMAIL, name: "Workflow Coach", role: "coach", team_id: TEAM_ID },
  }));

  await context.route("**/v1/player-assignments**", async (route) => {
    const request = route.request();
    if (request.method() === "GET") {
      return fulfill(route, {
        ok: true,
        storage_mode: "team_remote",
        team_id: TEAM_ID,
        assignments: state.assignment ? [state.assignment] : [],
      });
    }

    const payload = request.postDataJSON();
    if (payload.action === "assign") {
      state.assignment = {
        id: "workflow-assignment",
        teamId: TEAM_ID,
        playerIdentity: String(payload.assignment?.player_identity || payload.player_identity || "").toLowerCase(),
        playerName: payload.assignment?.player_name || "Ari Workflow",
        assignmentText: payload.assignment?.assignment_text || "",
        resultDetail: payload.assignment?.result_detail || "Home shots · 33 makes",
        state: "assigned",
        assignedBy: COACH_EMAIL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return fulfill(route, { ok: true, storage_mode: "team_remote", assignment: state.assignment });
    }

    return fulfill(route, { ok: true, storage_mode: "team_remote", assignment: state.assignment });
  });

  await context.route("**/v1/coach-follow-ups**", async (route) => {
    const request = route.request();
    if (request.method() === "GET") {
      return fulfill(route, {
        ok: true,
        storage_mode: "team_remote",
        team_id: TEAM_ID,
        follow_ups: state.followUp ? [state.followUp] : [],
      });
    }

    const payload = request.postDataJSON();
    state.followUp = {
      id: "workflow-follow-up",
      teamId: TEAM_ID,
      playerIdentity: PLAYER_EMAIL,
      playerName: "Ari Workflow",
      state: payload.follow_up?.state || "planned",
      note: payload.follow_up?.note || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return fulfill(route, { ok: true, storage_mode: "team_remote", follow_up: state.followUp });
  });

  await context.route("**/v1/coach/activity/first-results**", (route) => fulfill(route, {
    ok: true,
    team_id: TEAM_ID,
    count: 1,
    results: [{
      id: "workflow-activity-ari",
      player_email: PLAYER_EMAIL,
      player_name: "Ari Workflow",
      detail: "Home shots · 33 makes",
      meta: "Today",
      made: 33,
      date: iso.slice(0, 10),
      ts: now,
    }],
  }));
  await context.route("**/v1/team-priorities**", (route) => fulfill(route, { ok: true, storage_mode: "team_remote", priorities_by_team: {} }));
  await context.route("**/v1/season-archives**", (route) => fulfill(route, { ok: true, archives: [] }));
  await context.route("**/v1/leaderboards/home-shots**", (route) => fulfill(route, {
    team_id: TEAM_ID,
    scope: "players",
    count: 1,
    leaderboard: [{ rank: 1, player_display_name: "Ari Workflow", total_home_shots: 33 }],
  }));
  await context.route("**/v1/coach/players/provision**", (route) => fulfill(route, { ok: true, invitations: [] }));
  await context.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => fulfill(route, []));
}

async function seedCoach(context) {
  await context.addInitScript(({ data, session }) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    for (const [key, value] of Object.entries(data)) window.localStorage.setItem(key, JSON.stringify(value));
    window.localStorage.setItem("sl:session", JSON.stringify(session));
  }, {
    data: seedData,
    session: { email: COACH_EMAIL, role: "coach", teamId: TEAM_ID },
  });
}

test("coach dashboard to player workflow preserves roster context after a coaching action", async ({ browser }) => {
  const state = { assignment: null, followUp: null };
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await installRoutes(context, state);
  await seedCoach(context);

  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByTestId("coach-command-center-full")).toBeVisible({ timeout: 20_000 });

  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(dock).toBeVisible({ timeout: 20_000 });
  await dock.getByRole("button", { name: "Players", exact: true }).click();
  await expect(page.getByTestId("coach-players-interactive-dashboard")).toBeVisible({ timeout: 20_000 });

  const filterRail = page.getByTestId("coach-players-filter-rail");
  const search = filterRail.getByPlaceholder("Search player name or email");
  await search.fill("Ari Workflow");
  await expect(search).toHaveValue("Ari Workflow");

  const inviteSection = page.getByTestId("coach-player-invite-dashboard-section");
  await inviteSection.getByRole("button", { name: "View roster", exact: true }).click();

  const roster = page.locator("#coach-roster-operations");
  await expect(roster).toBeVisible({ timeout: 20_000 });
  const ariRow = roster.locator(".phase1RosterRow").filter({ hasText: "Ari Workflow" }).first();
  await expect(ariRow).toBeVisible();
  await expect(roster.locator(".phase1RosterRow").filter({ hasText: "Bea Workflow" })).toHaveCount(0);

  const profileAction = ariRow.locator('[data-phase1-open-profile="true"]');
  await expect(profileAction).toBeVisible();
  await profileAction.click();

  const drawer = page.getByTestId("coach-player-intelligence-drawer");
  await expect(drawer).toBeVisible({ timeout: 20_000 });
  await expect(drawer).toContainText("Weekly makes");
  await expect(drawer).toContainText("33");
  await expect(drawer).toContainText("Development pulse");
  await expect(drawer).toContainText("Activity timeline");

  const assignmentInput = page.getByTestId("coach-next-assignment-input");
  await expect(assignmentInput).toBeVisible({ timeout: 20_000 });
  await assignmentInput.fill("Repeat Form Shooting and match or improve 33 makes with balanced footwork.");
  await page.getByRole("button", { name: "Deliver next assignment", exact: true }).click();
  await expect(page.getByTestId("coach-player-assignment-status")).toHaveAttribute("data-assignment-state", "assigned");
  await expect(page.getByRole("status").last()).toContainText("Assignment delivered to the player");

  expect(state.assignment?.playerIdentity).toBe(PLAYER_EMAIL);
  expect(state.assignment?.assignmentText).toContain("balanced footwork");
  expect(state.assignment?.playerIdentity).not.toBe(SECOND_PLAYER_EMAIL);

  await drawer.getByRole("button", { name: "Close details", exact: true }).last().click();
  await expect(drawer).not.toBeVisible();
  await expect(page.getByTestId("coach-players-interactive-dashboard")).toBeVisible();
  await expect(search).toHaveValue("Ari Workflow");
  await expect(ariRow).toBeVisible();
  await expect(ariRow).toBeInViewport();
  await expect(roster.locator(".phase1RosterRow").filter({ hasText: "Bea Workflow" })).toHaveCount(0);

  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 2);

  await context.close();
});
