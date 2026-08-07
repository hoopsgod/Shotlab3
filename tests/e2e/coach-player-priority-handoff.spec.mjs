import { test, expect } from "@playwright/test";

const TEAM_ID = "team-priority-handoff";
const COACH_EMAIL = "priority.coach@example.com";
const PLAYER_EMAIL = "priority.player@example.com";
const SECOND_PLAYER_EMAIL = "priority.second@example.com";
const STALE_FOCUS = "Old local focus that must be replaced";
const PUBLISHED_FOCUS = "Win the first three steps on every closeout";
const PUBLISHED_DRILL = "Form Shooting";
const PUBLISHED_CHALLENGE = "Complete Form Shooting before adding volume.";

const INITIAL_PRIORITIES = {
  todayFocusText: "Attack closeouts with balance",
  focusEmphasis: "Technique",
  priorityDrillText: "Two-foot finishing",
  challengeText: "Complete one finishing block today.",
  weeklyMakesTarget: 500,
  weeklyCheckinsTarget: 2,
};

const baseSeed = {
  "sl:teams": [{
    id: TEAM_ID,
    name: "Priority Handoff Team",
    ownerCoachId: COACH_EMAIL,
    joinCode: "HANDOFF",
    createdAt: Date.now() - 86_400_000,
    branding: {
      name: "Priority Handoff Team",
      shortName: "PHT",
      wordmark: "PRIORITY HANDOFF TEAM",
      primaryColor: "#C8FF1A",
      secondaryColor: "#77D7FF",
      accentColor: "#C8FF1A",
      textOnPrimary: "#071007",
      logoUrl: "/branding/titans-exact-logo.png.PNG",
      logoMarkUrl: "/branding/titans-default-mark.svg",
      textScale: "standard",
      version: 1,
    },
  }],
  "sl:players": [
    { id: "handoff-coach", email: COACH_EMAIL, name: "Priority Coach", role: "coach", isCoach: true, teamId: TEAM_ID },
    { id: "handoff-player", playerId: PLAYER_EMAIL, email: PLAYER_EMAIL, name: "Priority Player", role: "player", teamId: TEAM_ID },
    { id: "handoff-player-two", playerId: SECOND_PLAYER_EMAIL, email: SECOND_PLAYER_EMAIL, name: "Second Player", role: "player", teamId: TEAM_ID },
  ],
  "sl:player-profiles": [
    { id: "handoff-profile", userId: PLAYER_EMAIL, email: PLAYER_EMAIL, teamId: TEAM_ID, firstName: "Priority", lastName: "Player" },
    { id: "handoff-profile-two", userId: SECOND_PLAYER_EMAIL, email: SECOND_PLAYER_EMAIL, teamId: TEAM_ID, firstName: "Second", lastName: "Player" },
  ],
  "sl:drills": [
    { id: "form-shooting", name: "Form Shooting", desc: "Clean mechanics and balanced feet", max: 50, icon: "ft" },
    { id: "corner-threes", name: "Corner Threes", desc: "Repeatable corner volume", max: 40, icon: "3p" },
  ],
  "sl:program-drills": [],
  "sl:scores": [],
  "sl:program-scores": [],
  "sl:shotlogs": [],
  "sl:events": [],
  "sl:rsvps": [],
  "sl:sc-sessions": [],
  "sl:sc-rsvps": [],
  "sl:sc-logs": [],
  "sl:season-archives": [],
};

const profileForIdentity = (email) => {
  const row = baseSeed["sl:players"].find((player) => player.email === email);
  return row ? {
    email: row.email,
    name: row.name,
    role: row.role,
    teamId: row.teamId,
    hideFromLeaderboards: false,
  } : null;
};

async function seedPage(page, priorities, sessionEmail) {
  await page.addInitScript(({ seed, teamId, priorityValue, email }) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    for (const [key, value] of Object.entries(seed)) window.localStorage.setItem(key, JSON.stringify(value));
    window.localStorage.setItem("sl:coach-priorities", JSON.stringify({ [teamId]: priorityValue }));
    window.localStorage.setItem("sl:session", JSON.stringify({ email }));
  }, { seed: baseSeed, teamId: TEAM_ID, priorityValue: priorities, email: sessionEmail });
}

async function installRoutes(page, remoteState, telemetry) {
  await page.route("**/v1/legacy-auth/restore", async (route) => {
    const body = JSON.parse(route.request().postData() || "{}");
    const profile = profileForIdentity(String(body?.email || "").trim().toLowerCase());
    await route.fulfill({
      status: profile ? 200 : 404,
      contentType: "application/json",
      body: JSON.stringify(profile ? { ok: true, profile } : { error: "profile_not_found" }),
    });
  });

  await page.route("**/v1/team-priorities", async (route) => {
    const request = route.request();
    const requester = String(request.headers()["x-user-id"] || "").toLowerCase();
    telemetry.push({ method: request.method(), requester });

    if (request.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          storage_mode: "team_remote",
          priorities_by_team: { [TEAM_ID]: remoteState.current },
        }),
      });
      return;
    }

    const body = JSON.parse(request.postData() || "{}");
    remoteState.current = body.priorities;
    telemetry.push({ method: "PUBLISHED", body });
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, storage_mode: "team_remote", team_id: TEAM_ID, priorities: remoteState.current }),
    });
  });

  await page.route("**/v1/season-archives", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, archives: [] }),
  }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ leaderboard: [] }),
  }));
  await page.route("**/v1/coach/players/provision**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, invitations: [] }),
  }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: "[]",
  }));
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

test("registered coach publish hydrates a separate registered player session and appears above the fold", async ({ browser }) => {
  const remoteState = { current: { ...INITIAL_PRIORITIES } };
  const telemetry = [];

  const coachContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const coachPage = await coachContext.newPage();
  await installRoutes(coachPage, remoteState, telemetry);
  await seedPage(coachPage, INITIAL_PRIORITIES, COACH_EMAIL);
  await coachPage.goto("/");
  await expect(coachPage.getByTestId("coach-command-center-full")).toBeVisible({ timeout: 20_000 });

  await coachPage.getByRole("button", { name: "Open navigation", exact: true }).click();
  const coachDrawer = coachPage.locator(".mcMobileDrawer");
  await expect(coachDrawer).toBeVisible();
  await coachDrawer.getByRole("button", { name: "Coach Tools", exact: true }).click();
  const coachActions = coachPage.locator('[aria-label="Coach quick actions"]');
  await expect(coachActions).toBeVisible();
  await coachActions.getByRole("button", { name: "Set Team Focus", exact: true }).click();

  const editor = coachPage.getByTestId("coach-priority-editor");
  await expect(editor).toBeVisible();
  const textInputs = editor.locator('input[type="text"]');
  await textInputs.nth(0).fill(PUBLISHED_FOCUS);
  await textInputs.nth(1).fill(PUBLISHED_DRILL);
  await editor.locator("textarea").fill(PUBLISHED_CHALLENGE);
  await editor.getByRole("button", { name: "SAVE PRIORITIES", exact: true }).click();
  await expect(editor.getByText("Priorities saved", { exact: true })).toBeVisible();
  await expect.poll(() => remoteState.current.todayFocusText).toBe(PUBLISHED_FOCUS);
  expect(remoteState.current.priorityDrillText).toBe(PUBLISHED_DRILL);
  expect(remoteState.current.challengeText).toBe(PUBLISHED_CHALLENGE);

  const playerContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const playerPage = await playerContext.newPage();
  const stalePriorities = { ...INITIAL_PRIORITIES, todayFocusText: STALE_FOCUS };
  await installRoutes(playerPage, remoteState, telemetry);
  await seedPage(playerPage, stalePriorities, PLAYER_EMAIL);
  await playerPage.goto("/");

  const commandCenter = playerPage.getByTestId("player-daily-command-center");
  await expect(commandCenter).toBeVisible({ timeout: 20_000 });
  const coachSignal = playerPage.getByTestId("player-coach-priority-signal");
  await expect(coachSignal).toBeVisible({ timeout: 20_000 });
  await expect(coachSignal).toContainText(PUBLISHED_FOCUS);
  await expect(coachSignal).toContainText(PUBLISHED_DRILL);
  await expect(coachSignal).toContainText(PUBLISHED_CHALLENGE);
  await expect(coachSignal).not.toContainText(STALE_FOCUS);

  await expect.poll(() => playerPage.evaluate(({ teamId }) => {
    const stored = JSON.parse(window.localStorage.getItem("sl:coach-priorities") || "{}");
    return stored?.[teamId]?.todayFocusText || "";
  }, { teamId: TEAM_ID })).toBe(PUBLISHED_FOCUS);

  expect(telemetry.some((entry) => entry.method === "PUBLISHED" && entry.body?.team_id === TEAM_ID)).toBe(true);
  expect(telemetry.some((entry) => entry.method === "POST" && entry.requester === COACH_EMAIL)).toBe(true);
  expect(telemetry.some((entry) => entry.method === "GET" && entry.requester === PLAYER_EMAIL)).toBe(true);
  await expectNoHorizontalOverflow(playerPage);

  await playerContext.close();
  await coachContext.close();
});
