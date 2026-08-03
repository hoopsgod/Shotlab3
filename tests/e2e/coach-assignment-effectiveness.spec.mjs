import { test, expect } from "@playwright/test";

const TEAM_ID = "team-assignment-effectiveness";
const COACH_EMAIL = "coach.effectiveness@example.com";
const ALPHA_EMAIL = "alpha.effectiveness@example.com";
const BETA_EMAIL = "beta.effectiveness@example.com";

const alphaLate = {
  team_id: TEAM_ID,
  player_identity: ALPHA_EMAIL,
  player_name: "Alpha Player",
  assignment_text: "Complete the form shooting ladder.",
  result_detail: "42 makes",
  due_date: "2026-08-01",
  state: "completed",
  assigned_by: COACH_EMAIL,
  created_at: "2026-08-01T12:00:00.000Z",
  updated_at: "2026-08-02T18:00:00.000Z",
  acknowledged_at: "2026-08-01T16:00:00.000Z",
  started_at: "2026-08-01T18:00:00.000Z",
  completed_at: "2026-08-02T18:00:00.000Z",
  archived_at: "2026-08-03T12:00:00.000Z",
};

const betaOnTime = {
  team_id: TEAM_ID,
  player_identity: BETA_EMAIL,
  player_name: "Beta Player",
  assignment_text: "Complete the free-throw ladder.",
  result_detail: "18 of 20",
  due_date: "2026-08-02",
  state: "completed",
  assigned_by: COACH_EMAIL,
  created_at: "2026-08-02T08:00:00.000Z",
  updated_at: "2026-08-02T20:00:00.000Z",
  acknowledged_at: "2026-08-02T09:00:00.000Z",
  started_at: "2026-08-02T10:00:00.000Z",
  completed_at: "2026-08-02T20:00:00.000Z",
  archived_at: "2026-08-03T12:00:00.000Z",
};

const alphaCurrent = {
  team_id: TEAM_ID,
  player_identity: ALPHA_EMAIL,
  player_name: "Alpha Player",
  assignment_text: "Complete five-spot shooting.",
  result_detail: "",
  due_date: "2026-08-04",
  state: "completed",
  assigned_by: COACH_EMAIL,
  created_at: "2026-08-03T12:00:00.000Z",
  updated_at: "2026-08-04T12:00:00.000Z",
  acknowledged_at: "2026-08-03T14:00:00.000Z",
  started_at: "2026-08-03T16:00:00.000Z",
  completed_at: "2026-08-04T12:00:00.000Z",
};

const seed = {
  "sl:teams": [{ id: TEAM_ID, name: "Effectiveness Elite", ownerCoachId: COACH_EMAIL, joinCode: "PACE" }],
  "sl:players": [
    { id: "coach", email: COACH_EMAIL, name: "Effectiveness Coach", role: "coach", isCoach: true, teamId: TEAM_ID },
    { id: "alpha", email: ALPHA_EMAIL, name: "Alpha Player", role: "player", teamId: TEAM_ID },
    { id: "beta", email: BETA_EMAIL, name: "Beta Player", role: "player", teamId: TEAM_ID },
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

async function installRoutes(context) {
  await context.route("**/v1/legacy-auth/restore", (route) => fulfill(route, { ok: true, profile: { email: COACH_EMAIL, name: "Effectiveness Coach", role: "coach", team_id: TEAM_ID } }));
  await context.route("**/v1/player-assignments**", (route) => fulfill(route, { ok: true, storage_mode: "team_remote", team_id: TEAM_ID, assignments: [alphaCurrent] }));
  await context.route("**/v1/player-assignment-history**", (route) => fulfill(route, { ok: true, storage_mode: "team_remote", team_id: TEAM_ID, history: [alphaLate, betaOnTime] }));
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

test("coach sees truthful assignment effectiveness from current and preserved completion evidence", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await installRoutes(context);
  await seedContext(context);
  const page = await context.newPage();
  await page.goto("/");

  const panel = page.getByTestId("coach-assignment-effectiveness");
  await expect(panel).toBeVisible({ timeout: 20_000 });
  await expect(panel).toHaveAttribute("data-cycle-count", "3");
  await expect(panel).toHaveAttribute("data-player-count", "2");
  await expect(panel).toHaveAttribute("data-deadline-count", "3");
  await expect(panel).toHaveAttribute("data-on-time-rate", "67");
  await expect(panel).toHaveAttribute("data-attention-count", "1");
  await expect(panel).toHaveAttribute("data-storage-mode", "team_remote");
  await expect(panel).toContainText("Assignment effectiveness");
  await expect(panel).toContainText("Developing");
  await expect(panel).toContainText("67%");
  await expect(panel).toContainText("2h");
  await expect(panel).toContainText("1d");
  await expect(panel).toContainText("private coach notes excluded");
  await expect(panel).not.toContainText("private note");

  const rows = panel.getByTestId("coach-assignment-effectiveness-player");
  await expect(rows).toHaveCount(2);
  const alpha = rows.filter({ hasText: "Alpha Player" });
  await expect(alpha).toHaveAttribute("data-late-count", "1");
  await expect(alpha).toContainText("2 cycles");
  await expect(alpha).toContainText("1 late");
  await expect(alpha).toContainText("median 1d 3h");
  await expect(alpha).toContainText("Review");
  const beta = rows.filter({ hasText: "Beta Player" });
  await expect(beta).toHaveAttribute("data-late-count", "0");
  await expect(beta).toContainText("all dated work on time");

  for (const row of await rows.all()) {
    const box = await row.boundingBox();
    expect(box).not.toBeNull();
    expect(box.height).toBeGreaterThanOrEqual(44);
  }

  const hostOrder = await page.evaluate(() => {
    const accountability = document.querySelector('[data-testid="coach-assignment-accountability-host"]');
    const effectiveness = document.querySelector('[data-testid="coach-assignment-effectiveness-host"]');
    if (!accountability || !effectiveness) return "missing";
    return accountability.nextElementSibling === effectiveness ? "adjacent" : "misplaced";
  });
  expect(hostOrder).toBe("adjacent");

  const widths = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 2);
  await context.close();
});
