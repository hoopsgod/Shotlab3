import { test, expect } from "@playwright/test";

const TEAM_ID = "team-player-workflow";
const PLAYER_EMAIL = "player.workflow@shotlab.app";
const SECOND_PLAYER_EMAIL = "second.workflow@shotlab.app";
const COACH_EMAIL = "coach.workflow@shotlab.app";
const TODAY = new Date().toISOString().slice(0, 10);
const NOW = new Date().toISOString();

const baseStorage = {
  "sl:teams": [{ id: TEAM_ID, name: "Player Workflow Elite", ownerCoachId: COACH_EMAIL, joinCode: "PLAYER26", createdAt: Date.now() - 86400000 }],
  "sl:players": [
    { id: "workflow-coach", email: COACH_EMAIL, name: "Workflow Coach", role: "coach", isCoach: true, teamId: TEAM_ID },
    { id: "workflow-player", playerId: PLAYER_EMAIL, email: PLAYER_EMAIL, name: "Ari Workflow", role: "player", teamId: TEAM_ID },
    { id: "workflow-second", playerId: SECOND_PLAYER_EMAIL, email: SECOND_PLAYER_EMAIL, name: "Bea Workflow", role: "player", teamId: TEAM_ID },
  ],
  "sl:player-profiles": [
    { id: "workflow-profile", userId: PLAYER_EMAIL, email: PLAYER_EMAIL, teamId: TEAM_ID, firstName: "Ari", lastName: "Workflow" },
    { id: "workflow-second-profile", userId: SECOND_PLAYER_EMAIL, email: SECOND_PLAYER_EMAIL, teamId: TEAM_ID, firstName: "Bea", lastName: "Workflow" },
  ],
  "sl:drills": [
    { id: "form-shooting", name: "Form Shooting", desc: "Balanced feet and clean mechanics", max: 50, icon: "ft" },
    { id: "corner-threes", name: "Corner Threes", desc: "Game-speed corner volume", max: 40, icon: "3p" },
  ],
  "sl:program-drills": [{ id: "program-finishing", name: "Program Finishing", desc: "Finish through contact", max: 30, icon: "layup" }],
  "sl:scores": [],
  "sl:program-scores": [],
  "sl:shotlogs": [{ id: "workflow-baseline", teamId: TEAM_ID, playerId: PLAYER_EMAIL, email: PLAYER_EMAIL, name: "Ari Workflow", made: 20, date: TODAY, ts: Date.now() - 1000 }],
  "sl:events": [],
  "sl:rsvps": [],
  "sl:sc-sessions": [],
  "sl:sc-rsvps": [],
  "sl:sc-logs": [],
  "sl:season-archives": [],
  "sl:coach-priorities": {
    [TEAM_ID]: {
      todayFocusText: "Own your balance before adding speed",
      priorityDrillText: "Form Shooting",
      challengeText: "Complete Form Shooting and log the result before moving on.",
      weeklyMakesTarget: 500,
      weeklyCheckinsTarget: 2,
      updatedAt: NOW,
    },
  },
};

const fulfill = (route, body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
const requesterFor = (request) => String(request.headers()["x-user-id"] || "").trim().toLowerCase();

function makeState() {
  return {
    scores: [],
    scoreReads: 0,
    scoreWrites: 0,
    scoreRequesters: [],
    assignmentReads: [],
    assignments: [
      {
        team_id: TEAM_ID,
        player_identity: PLAYER_EMAIL,
        player_name: "Ari Workflow",
        assignment_text: "Form Shooting is your priority. Finish it with balanced feet.",
        result_detail: "Coach priority",
        state: "assigned",
        assigned_by: COACH_EMAIL,
        created_at: NOW,
        updated_at: NOW,
      },
      {
        team_id: TEAM_ID,
        player_identity: SECOND_PLAYER_EMAIL,
        player_name: "Bea Workflow",
        assignment_text: "THIS BELONGS ONLY TO BEA",
        result_detail: "Identity isolation sentinel",
        state: "assigned",
        assigned_by: COACH_EMAIL,
        created_at: NOW,
        updated_at: NOW,
      },
    ],
  };
}

async function installRoutes(context, state) {
  await context.route("**/v1/legacy-auth/restore", (route) => fulfill(route, {
    ok: true,
    profile: { email: PLAYER_EMAIL, name: "Ari Workflow", role: "player", team_id: TEAM_ID, hide_from_leaderboards: false },
  }));
  await context.route("**/v1/teams/restore-context", (route) => fulfill(route, { ok: true, team: baseStorage["sl:teams"][0] }));
  await context.route("**/v1/teams**", (route) => fulfill(route, { ok: true, storage_mode: "team_remote", teams: baseStorage["sl:teams"] }));
  await context.route("**/v1/players**", (route) => fulfill(route, { ok: true, storage_mode: "team_remote", players: baseStorage["sl:players"] }));
  await context.route("**/v1/player-profiles**", (route) => fulfill(route, { ok: true, storage_mode: "team_remote", profiles: baseStorage["sl:player-profiles"] }));
  await context.route("**/v1/program-scores**", (route) => fulfill(route, { ok: true, storage_mode: "team_remote", program_scores: [] }));
  await context.route("**/v1/shot-logs**", (route) => fulfill(route, { ok: true, storage_mode: "team_remote", shot_logs: baseStorage["sl:shotlogs"] }));
  await context.route("**/v1/events**", (route) => fulfill(route, { ok: true, storage_mode: "team_remote", events: [] }));
  await context.route("**/v1/rsvps**", (route) => fulfill(route, { ok: true, storage_mode: "team_remote", rsvps: [] }));
  await context.route("**/v1/strength-conditioning**", (route) => fulfill(route, { ok: true, storage_mode: "team_remote", sessions: [], rsvps: [], logs: [] }));
  await context.route("**/v1/team-priorities**", (route) => fulfill(route, {
    ok: true,
    storage_mode: "team_remote",
    priorities_by_team: baseStorage["sl:coach-priorities"],
  }));
  await context.route("**/v1/scores**", async (route) => {
    const request = route.request();
    const requester = requesterFor(request);
    state.scoreRequesters.push(requester);
    if (request.method() === "POST") {
      const payload = request.postDataJSON();
      state.scores = Array.isArray(payload?.scores) ? payload.scores : [];
      state.scoreWrites += 1;
      return fulfill(route, { ok: true, storage_mode: "team_remote", scores: state.scores });
    }
    state.scoreReads += 1;
    return fulfill(route, { ok: true, storage_mode: "team_remote", scores: state.scores });
  });
  await context.route("**/v1/player-assignments**", (route) => {
    const requester = requesterFor(route.request());
    state.assignmentReads.push(requester);
    const assignments = state.assignments.filter((row) => String(row.player_identity).toLowerCase() === requester);
    return fulfill(route, { ok: true, storage_mode: "team_remote", team_id: TEAM_ID, assignments });
  });
  await context.route("**/v1/season-archives**", (route) => fulfill(route, { ok: true, archives: [] }));
  await context.route("**/v1/leaderboards/home-shots**", (route) => fulfill(route, {
    team_id: TEAM_ID,
    scope: "players",
    count: 1,
    leaderboard: [{ rank: 1, player_display_name: "Ari Workflow", total_home_shots: 20 }],
  }));
  await context.route("**/v1/coach/players/provision**", (route) => fulfill(route, { ok: true, invitations: [] }));
  await context.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => fulfill(route, []));
}

async function seedRegisteredPlayer(context) {
  await context.addInitScript(({ storage, playerEmail, teamId }) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    for (const [key, value] of Object.entries(storage)) window.localStorage.setItem(key, JSON.stringify(value));
    window.localStorage.setItem("sl:session", JSON.stringify({ email: playerEmail, role: "player", teamId }));
  }, { storage: baseStorage, playerEmail: PLAYER_EMAIL, teamId: TEAM_ID });
}

function installRuntimeGuards(page, runtime) {
  page.on("console", (message) => {
    if (message.type() === "error") runtime.consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => runtime.pageErrors.push(String(error?.message || error)));
  page.on("requestfailed", (request) => {
    const url = request.url();
    if (request.resourceType() === "document" || url.includes("/v1/")) {
      runtime.networkFailures.push(`${request.method()} ${url} ${request.failure()?.errorText || "failed"}`);
    }
  });
}

async function expectNoHorizontalOverflow(page) {
  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 2);
}

const scoreValue = (row = {}) => Number(row.score ?? row.value ?? row.made ?? row.result ?? NaN);
const scoreDrill = (row = {}) => String(row.drillId || row.drill_id || row.drill || "");
const scoreIdentity = (row = {}) => String(row.email || row.player_email || row.playerId || row.player_id || "").toLowerCase();

test("registered Player completes the coach-priority drill, proves persistence, sees progress update, and returns with context", async ({ browser }) => {
  const state = makeState();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await installRoutes(context, state);
  await seedRegisteredPlayer(context);
  const page = await context.newPage();
  const runtime = { consoleErrors: [], pageErrors: [], networkFailures: [] };
  installRuntimeGuards(page, runtime);

  await page.goto("/");
  const commandCenter = page.getByTestId("player-daily-command-center");
  await expect(commandCenter).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("player-coach-priority-signal")).toContainText("Own your balance before adding speed");
  await expect(page.getByTestId("player-coach-priority-signal")).toContainText("Form Shooting");
  await expect(page.getByTestId("player-coach-priority-signal")).toContainText("Complete Form Shooting and log the result before moving on.");
  await expect(page.getByTestId("player-daily-primary-action")).toHaveText("Start coach priority");
  await expectNoHorizontalOverflow(page);

  await page.getByTestId("player-daily-primary-action").click();
  const session = page.getByTestId("player-training-session");
  await expect(session).toBeVisible({ timeout: 20_000 });
  await expect(session.getByRole("heading", { name: "Form Shooting", exact: true })).toBeVisible();
  const scoreInput = session.locator('input[type="number"]').first();
  await expect(scoreInput).toBeVisible();
  await scoreInput.fill("40");
  await page.getByTestId("player-training-log-score").click();

  const completion = page.getByTestId("player-training-completion");
  await expect(completion).toBeVisible({ timeout: 15_000 });
  await expect(completion.getByText("RESULT LOGGED", { exact: true })).toBeVisible();
  await expect(completion.getByTestId("player-training-result").getByText("40", { exact: true })).toBeVisible();
  await expect(page.getByText(/Could not save score to team dashboard/i)).toHaveCount(0);
  expect(state.scoreWrites).toBe(1);
  expect(state.scores).toHaveLength(1);
  expect(scoreValue(state.scores[0])).toBe(40);
  expect(scoreDrill(state.scores[0])).toBe("form-shooting");
  expect(scoreIdentity(state.scores[0])).toBe(PLAYER_EMAIL);
  expect(state.scoreRequesters.filter(Boolean).every((value) => value === PLAYER_EMAIL)).toBe(true);
  await expectNoHorizontalOverflow(page);

  const finishQuiet = page.getByTestId("player-training-finish-session");
  if (await finishQuiet.count()) await finishQuiet.click();
  else await page.getByTestId("player-training-next-action").click();
  const closeout = page.getByTestId("player-session-closeout");
  await expect(closeout).toBeVisible({ timeout: 10_000 });
  await closeout.getByTestId("player-session-done").click();

  // The drill was launched from Home, so Done for today must return to Home and
  // immediately reflect the completed priority instead of dumping the player elsewhere.
  await expect(commandCenter).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("player-daily-primary-action")).toHaveText("Continue shooting");
  await expectNoHorizontalOverflow(page);

  // Verify the saved result also changed the operational training state.
  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Train", exact: true }).click();
  const workspace = page.getByTestId("player-at-home-workspace");
  await expect(workspace).toBeVisible({ timeout: 10_000 });
  const filterRail = page.getByTestId("player-at-home-filter-rail");
  await filterRail.getByRole("button", { name: /Open/i }).click();
  await expect(page.getByRole("button", { name: /Form Shooting/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Corner Threes/i })).toBeVisible();

  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Home", exact: true }).click();
  await expect(commandCenter).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("player-daily-primary-action")).toHaveText("Continue shooting");

  const readsBeforeRehydrate = state.scoreReads;
  await page.evaluate(() => window.localStorage.setItem("sl:scores", "[]"));
  await page.reload();
  await expect(page.getByTestId("player-daily-command-center")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("player-daily-primary-action")).toHaveText("Continue shooting");
  await expect.poll(() => state.scoreReads).toBeGreaterThan(readsBeforeRehydrate);
  const hydratedScore = await page.evaluate(() => JSON.parse(window.localStorage.getItem("sl:scores") || "[]")[0] || null);
  expect(hydratedScore).not.toBeNull();
  expect(scoreValue(hydratedScore)).toBe(40);
  expect(scoreDrill(hydratedScore)).toBe("form-shooting");
  await expectNoHorizontalOverflow(page);

  expect(runtime.consoleErrors).toEqual([]);
  expect(runtime.pageErrors).toEqual([]);
  expect(runtime.networkFailures).toEqual([]);
  await context.close();
});

test("registered Player assignment reads are identity-isolated", async ({ browser }) => {
  const state = makeState();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await installRoutes(context, state);
  await seedRegisteredPlayer(context);
  const page = await context.newPage();
  await page.goto("/");

  const assignment = page.getByTestId("player-coach-assignment");
  await expect(assignment).toBeVisible({ timeout: 20_000 });
  await expect(assignment).toContainText("Form Shooting is your priority");
  await expect(page.getByText("THIS BELONGS ONLY TO BEA", { exact: true })).toHaveCount(0);
  await expect.poll(() => state.assignmentReads.filter(Boolean).length).toBeGreaterThan(0);
  expect(state.assignmentReads.filter(Boolean).every((value) => value === PLAYER_EMAIL)).toBe(true);
  await context.close();
});

for (const width of [320, 375, 390, 430]) {
  test(`Player Dashboard preserves the mobile containment contract at ${width}px`, async ({ browser }) => {
    const state = makeState();
    const context = await browser.newContext({ viewport: { width, height: 844 } });
    await installRoutes(context, state);
    await seedRegisteredPlayer(context);
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.getByTestId("player-daily-command-center")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("player-daily-primary-action")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    const cta = await page.getByTestId("player-daily-primary-action").boundingBox();
    expect(cta).not.toBeNull();
    expect(cta.x).toBeGreaterThanOrEqual(0);
    expect(cta.x + cta.width).toBeLessThanOrEqual(width + 1);
    await context.close();
  });
}