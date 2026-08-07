import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const listing = JSON.parse(fs.readFileSync("native/app-store-listing.json", "utf8"));
const outputDir = path.resolve(process.cwd(), "artifacts/app-store/iphone-6.9");
const TEAM_ID = "team-app-store-presentation";
const PLAYER_EMAIL = "demo@shotlab.app";
const COACH_EMAIL = "coach.demo@shotlab.app";

const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const isoOffset = (days) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return localDate(date);
};
const TODAY = isoOffset(0);

const ARCHIVE = {
  id: "archive-app-store-2025-26",
  teamId: TEAM_ID,
  seasonName: "2025-26",
  seasonStartDate: "2025-11-01",
  seasonEndDate: "2026-03-15",
  createdAt: "2026-03-20T12:00:00.000Z",
  archivedBy: { email: COACH_EMAIL, name: "Coach Morgan", role: "coach" },
  summary: {
    rosterCount: 4,
    homeScoreCount: 42,
    shotLogCount: 31,
    eventCount: 18,
    eventRsvpCount: 58,
    scSessionCount: 12,
    scLogCount: 34,
    totalShotLogMakes: 6840,
  },
  playerSeasonSummaries: [],
};

const seedData = {
  "sl:teams": [{
    id: TEAM_ID,
    name: "Northstar Basketball",
    ownerCoachId: COACH_EMAIL,
    joinCode: "NORTH1",
    createdAt: Date.now() - 86_400_000 * 120,
    branding: {
      name: "Northstar Basketball",
      shortName: "NS",
      wordmark: "NORTHSTAR BASKETBALL",
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
    { id: "coach-app-store", email: COACH_EMAIL, name: "Coach Morgan", role: "coach", isCoach: true, teamId: TEAM_ID },
    { id: "player-jordan", playerId: PLAYER_EMAIL, email: PLAYER_EMAIL, name: "Jordan Lee", role: "player", teamId: TEAM_ID },
    { id: "player-maya", playerId: "maya@northstar.test", email: "maya@northstar.test", name: "Maya Carter", role: "player", teamId: TEAM_ID },
    { id: "player-avery", playerId: "avery@northstar.test", email: "avery@northstar.test", name: "Avery Brooks", role: "player", teamId: TEAM_ID },
    { id: "player-sam", playerId: "sam@northstar.test", email: "sam@northstar.test", name: "Sam Rivera", role: "player", teamId: TEAM_ID },
  ],
  "sl:player-profiles": [
    { id: "profile-jordan", userId: PLAYER_EMAIL, email: PLAYER_EMAIL, teamId: TEAM_ID, firstName: "Jordan", lastName: "Lee", jerseyNumber: "12" },
    { id: "profile-maya", userId: "maya@northstar.test", email: "maya@northstar.test", teamId: TEAM_ID, firstName: "Maya", lastName: "Carter", jerseyNumber: "3" },
    { id: "profile-avery", userId: "avery@northstar.test", email: "avery@northstar.test", teamId: TEAM_ID, firstName: "Avery", lastName: "Brooks", jerseyNumber: "21" },
    { id: "profile-sam", userId: "sam@northstar.test", email: "sam@northstar.test", teamId: TEAM_ID, firstName: "Sam", lastName: "Rivera", jerseyNumber: "8" },
  ],
  "sl:drills": [
    { id: "form-shooting", name: "Form Shooting", desc: "Clean mechanics and balanced feet", max: 50, icon: "ft" },
    { id: "corner-threes", name: "Corner Threes", desc: "Build repeatable corner volume", max: 40, icon: "3p" },
    { id: "five-spot", name: "5-Spot Catch & Shoot", desc: "Game-ready footwork from five locations", max: 50, icon: "shoot" },
    { id: "free-throws", name: "Pressure Free Throws", desc: "Finish the workout at the line", max: 20, icon: "ft" },
  ],
  "sl:program-drills": [
    { id: "program-form", name: "Program Form Series", desc: "Team shooting foundation", max: 30, icon: "ft" },
    { id: "program-reads", name: "Game Speed Reads", desc: "Make decisions at pace", max: 24, icon: "shoot" },
    { id: "program-finishing", name: "Contact Finishing", desc: "Finish through controlled contact", max: 30, icon: "layup" },
    { id: "program-transition", name: "Transition Pull-Ups", desc: "Sprint into balanced shot preparation", max: 20, icon: "mr" },
  ],
  "sl:scores": [
    { id: "jordan-today-form", email: PLAYER_EMAIL, playerId: PLAYER_EMAIL, name: "Jordan Lee", teamId: TEAM_ID, drillId: "form-shooting", drillName: "Form Shooting", score: 46, src: "home", date: TODAY, ts: Date.now() - 10_000 },
    { id: "jordan-day-1", email: PLAYER_EMAIL, playerId: PLAYER_EMAIL, name: "Jordan Lee", teamId: TEAM_ID, drillId: "corner-threes", drillName: "Corner Threes", score: 32, src: "home", date: isoOffset(-1), ts: Date.now() - 86_400_000 },
    { id: "jordan-day-2", email: PLAYER_EMAIL, playerId: PLAYER_EMAIL, name: "Jordan Lee", teamId: TEAM_ID, drillId: "five-spot", drillName: "5-Spot Catch & Shoot", score: 41, src: "home", date: isoOffset(-2), ts: Date.now() - 86_400_000 * 2 },
    { id: "jordan-day-3", email: PLAYER_EMAIL, playerId: PLAYER_EMAIL, name: "Jordan Lee", teamId: TEAM_ID, drillId: "free-throws", drillName: "Pressure Free Throws", score: 18, src: "home", date: isoOffset(-3), ts: Date.now() - 86_400_000 * 3 },
    { id: "maya-score", email: "maya@northstar.test", name: "Maya Carter", teamId: TEAM_ID, drillId: "five-spot", drillName: "5-Spot Catch & Shoot", score: 44, src: "home", date: TODAY },
    { id: "avery-score", email: "avery@northstar.test", name: "Avery Brooks", teamId: TEAM_ID, drillId: "corner-threes", drillName: "Corner Threes", score: 29, src: "home", date: isoOffset(-1) },
    { id: "sam-score", email: "sam@northstar.test", name: "Sam Rivera", teamId: TEAM_ID, drillId: "form-shooting", drillName: "Form Shooting", score: 38, src: "home", date: isoOffset(-8) },
  ],
  "sl:program-scores": [
    { id: "jordan-program-form", email: PLAYER_EMAIL, playerId: PLAYER_EMAIL, name: "Jordan Lee", teamId: TEAM_ID, drillId: "program-form", drillName: "Program Form Series", score: 27, src: "program", date: TODAY },
    { id: "maya-program", email: "maya@northstar.test", name: "Maya Carter", teamId: TEAM_ID, drillId: "program-reads", drillName: "Game Speed Reads", score: 21, src: "program", date: TODAY },
    { id: "avery-program", email: "avery@northstar.test", name: "Avery Brooks", teamId: TEAM_ID, drillId: "program-finishing", drillName: "Contact Finishing", score: 25, src: "program", date: isoOffset(-1) },
  ],
  "sl:shotlogs": [
    { id: "jordan-shot-today", playerId: PLAYER_EMAIL, email: PLAYER_EMAIL, name: "Jordan Lee", teamId: TEAM_ID, made: 84, attempted_shots: 120, date: TODAY, sessionId: "jordan-today" },
    { id: "jordan-shot-1", playerId: PLAYER_EMAIL, email: PLAYER_EMAIL, name: "Jordan Lee", teamId: TEAM_ID, made: 96, attempted_shots: 145, date: isoOffset(-1), sessionId: "jordan-1" },
    { id: "jordan-shot-2", playerId: PLAYER_EMAIL, email: PLAYER_EMAIL, name: "Jordan Lee", teamId: TEAM_ID, made: 78, attempted_shots: 115, date: isoOffset(-2), sessionId: "jordan-2" },
    { id: "jordan-shot-3", playerId: PLAYER_EMAIL, email: PLAYER_EMAIL, name: "Jordan Lee", teamId: TEAM_ID, made: 72, attempted_shots: 110, date: isoOffset(-3), sessionId: "jordan-3" },
    { id: "maya-shot", playerId: "maya@northstar.test", email: "maya@northstar.test", name: "Maya Carter", teamId: TEAM_ID, made: 102, attempted_shots: 150, date: TODAY, sessionId: "maya-today" },
    { id: "avery-shot", playerId: "avery@northstar.test", email: "avery@northstar.test", name: "Avery Brooks", teamId: TEAM_ID, made: 68, attempted_shots: 105, date: isoOffset(-1), sessionId: "avery-1" },
    { id: "sam-shot", playerId: "sam@northstar.test", email: "sam@northstar.test", name: "Sam Rivera", teamId: TEAM_ID, made: 35, attempted_shots: 70, date: isoOffset(-8), sessionId: "sam-old" },
  ],
  "sl:events": [
    { id: "event-practice", teamId: TEAM_ID, title: "Team Practice", type: "practice", date: isoOffset(1), time: "6:00 PM", location: "Main Gym", desc: "Team practice and controlled scrimmage" },
    { id: "event-shooting", teamId: TEAM_ID, title: "Shooting Lab", type: "workout", date: isoOffset(3), time: "4:30 PM", location: "Court 2", desc: "High-volume shooting session" },
    { id: "event-summer-game", teamId: TEAM_ID, title: "Summer League Game", type: "game", date: isoOffset(6), time: "7:15 PM", location: "Field House", desc: "Arrive 35 minutes early" },
  ],
  "sl:rsvps": [
    { id: "jordan-rsvp-practice", eventId: "event-practice", email: PLAYER_EMAIL, name: "Jordan Lee", teamId: TEAM_ID, status: "yes" },
    { id: "jordan-rsvp-shooting", eventId: "event-shooting", email: PLAYER_EMAIL, name: "Jordan Lee", teamId: TEAM_ID, status: "yes" },
    { id: "jordan-rsvp-game", eventId: "event-summer-game", email: PLAYER_EMAIL, name: "Jordan Lee", teamId: TEAM_ID, status: "yes" },
    { id: "maya-rsvp-practice", eventId: "event-practice", email: "maya@northstar.test", name: "Maya Carter", teamId: TEAM_ID, status: "yes" },
    { id: "avery-rsvp-practice", eventId: "event-practice", email: "avery@northstar.test", name: "Avery Brooks", teamId: TEAM_ID, status: "yes" },
  ],
  "sl:sc-sessions": [
    { id: "sc-team-lift", teamId: TEAM_ID, sport: "Team Lift", title: "Team Lift", date: isoOffset(2), time: "8:00 AM", location: "Weight Room", sessionType: "School" },
    { id: "sc-recovery", teamId: TEAM_ID, sport: "Recovery + Mobility", title: "Recovery + Mobility", date: isoOffset(5), time: "9:00 AM", location: "Training Room", sessionType: "School" },
  ],
  "sl:sc-rsvps": [
    { id: "jordan-sc-lift", sessionId: "sc-team-lift", email: PLAYER_EMAIL, name: "Jordan Lee", teamId: TEAM_ID },
    { id: "maya-sc-lift", sessionId: "sc-team-lift", email: "maya@northstar.test", name: "Maya Carter", teamId: TEAM_ID },
    { id: "avery-sc-lift", sessionId: "sc-team-lift", email: "avery@northstar.test", name: "Avery Brooks", teamId: TEAM_ID },
  ],
  "sl:sc-logs": [
    { id: "jordan-sc-log", sessionId: "sc-prior", email: PLAYER_EMAIL, name: "Jordan Lee", teamId: TEAM_ID, date: isoOffset(-2), time: "7:30 AM", place: "School", sport: "Basketball Strength" },
    { id: "maya-sc-log", sessionId: "sc-prior", email: "maya@northstar.test", name: "Maya Carter", teamId: TEAM_ID, date: isoOffset(-2), time: "7:30 AM", place: "School", sport: "Basketball Strength" },
  ],
  "sl:season-archives": [ARCHIVE],
  "sl:coach-priorities": {
    [TEAM_ID]: {
      todayFocusText: "Game-speed footwork into every catch",
      focusEmphasis: "Shot preparation",
      priorityDrillText: "Game Speed Reads",
      challengeText: "Win the first five minutes with clean pace and balance.",
      weeklyMakesTarget: 500,
      weeklyCheckinsTarget: 3,
    },
  },
};

const escapeHtml = (value) => String(value || "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [ARCHIVE] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route("**/v1/coach/players/provision**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function enterSeededRole(page, role) {
  await installSafeRoutes(page);
  await page.addInitScript((payload) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    for (const [key, value] of Object.entries(payload)) window.localStorage.setItem(key, JSON.stringify(value));
  }, seedData);
  await page.goto("/");
  await page.getByRole("button", { name: role === "coach" ? "Coach demo" : "Player demo", exact: true }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await page.addStyleTag({ content: `
    *,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;}
    html,body{scrollbar-width:none!important;}
    ::-webkit-scrollbar{display:none!important;}
    button,input,select{cursor:default!important;}
  ` });
}

async function stabilize(page) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelector(".player-scroll-container")?.scrollTo(0, 0);
    document.querySelector(".coach-scroll-container")?.scrollTo(0, 0);
  });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(350);
}

async function captureMarketingAsset(page, item) {
  await stabilize(page);
  const appBuffer = await page.screenshot({ type: "jpeg", quality: 95, animations: "disabled" });
  const appDataUrl = `data:image/jpeg;base64,${appBuffer.toString("base64")}`;
  const composer = await page.context().newPage();
  const roleLabel = item.role === "coach" ? "COACH EXPERIENCE" : "PLAYER EXPERIENCE";
  const accent = item.role === "coach" ? "#C8FF1A" : "#77D7FF";
  await composer.setContent(`<!doctype html>
    <html><head><meta charset="utf-8"><style>
      *{box-sizing:border-box}
      html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#050606}
      body{position:relative;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;color:#fff;background:
        radial-gradient(circle at 82% 4%,${accent}22 0%,transparent 31%),
        radial-gradient(circle at 8% 45%,#C8FF1A12 0%,transparent 34%),
        linear-gradient(155deg,#0B0D0F 0%,#040505 62%,#090B0D 100%)}
      body::before{content:"";position:absolute;inset:0;opacity:.18;background-image:
        linear-gradient(90deg,transparent 49.7%,rgba(255,255,255,.12) 50%,transparent 50.3%),
        radial-gradient(circle at 50% 52%,transparent 0 18%,rgba(255,255,255,.12) 18.2% 18.5%,transparent 18.7%)}
      .top{position:absolute;left:7vw;right:7vw;top:2.4vh;z-index:2}
      .brand{display:flex;align-items:center;gap:2vw;color:#C8FF1A;font-size:2.15vw;font-weight:900;letter-spacing:.22em}
      .mark{width:6vw;height:6vw;border:.45vw solid #C8FF1A;border-radius:1.8vw;display:grid;place-items:center;font-size:2vw;letter-spacing:0;box-shadow:0 0 5vw #C8FF1A26}
      .role{margin-top:1.2vh;color:${accent};font-size:1.9vw;font-weight:900;letter-spacing:.16em}
      h1{margin:.55vh 0 0;max-width:86vw;font-family:Impact,"Arial Black",sans-serif;font-size:7.4vw;line-height:.94;letter-spacing:.018em;text-transform:uppercase;font-weight:900}
      p{margin:.65vh 0 0;max-width:86vw;color:rgba(255,255,255,.70);font-size:2.8vw;font-weight:650;line-height:1.26}
      .device{position:absolute;left:9vw;top:17.4vh;width:82vw;aspect-ratio:430/932;padding:1.1vw;border-radius:8.3vw;background:linear-gradient(145deg,rgba(255,255,255,.30),rgba(255,255,255,.05) 30%,rgba(200,255,26,.18));box-shadow:0 2.6vh 6.4vh rgba(0,0,0,.62),0 0 0 .15vw rgba(255,255,255,.12),0 0 9vw ${accent}18;overflow:hidden}
      .screen{display:block;width:100%;height:100%;object-fit:cover;object-position:top;border-radius:7.2vw;background:#080808}
      .rule{position:absolute;left:0;right:0;bottom:0;height:.35vh;background:linear-gradient(90deg,#C8FF1A,${accent},transparent)}
    </style></head><body>
      <div class="top">
        <div class="brand"><span class="mark">SL</span><span>SHOTLAB</span></div>
        <div class="role">${escapeHtml(roleLabel)}</div>
        <h1>${escapeHtml(item.headline)}</h1>
        <p>${escapeHtml(item.subheadline)}</p>
      </div>
      <div class="device"><img class="screen" alt="ShotLab ${escapeHtml(item.surface)} screen" src="${appDataUrl}"></div>
      <div class="rule"></div>
    </body></html>`, { waitUntil: "load" });
  await composer.evaluate(() => document.fonts?.ready);
  await composer.waitForTimeout(200);
  const outputPath = path.join(outputDir, item.file);
  await composer.screenshot({ path: outputPath, type: "jpeg", quality: 96, animations: "disabled" });
  await composer.close();
  expect(fs.statSync(outputPath).size).toBeGreaterThan(150_000);
}

function itemFor(order) {
  const item = listing.screenshots.items.find((candidate) => candidate.order === order);
  if (!item) throw new Error(`Screenshot plan item ${order} is missing.`);
  return item;
}

async function openNavigation(page, label) {
  const dock = page.getByTestId("mobile-navigation-dock");
  const dockItem = dock.getByRole("button", { name: label, exact: true });
  if (await dockItem.count()) {
    await dockItem.click();
  } else {
    await page.getByTestId("mobile-navigation-more").click();
    const sheet = page.getByTestId("mobile-navigation-sheet");
    await expect(sheet).toBeVisible();
    await sheet.getByRole("button", { name: label, exact: true }).click();
  }
  await page.waitForTimeout(150);
}

test.describe.configure({ mode: "serial" });

test.beforeAll(() => {
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });
});

test("capture Player App Store presentation assets", async ({ page }) => {
  await enterSeededRole(page, "player");
  await expect(page.getByTestId("player-daily-command-center")).toBeVisible({ timeout: 20_000 });
  await captureMarketingAsset(page, itemFor(1));

  await openNavigation(page, "Train");
  await expect(page.getByTestId("player-at-home-workspace")).toBeVisible({ timeout: 20_000 });
  await captureMarketingAsset(page, itemFor(2));

  await openNavigation(page, "Program");
  await expect(page.getByTestId("player-program-workspace")).toBeVisible({ timeout: 20_000 });
  await captureMarketingAsset(page, itemFor(3));
});

test("capture Coach App Store presentation assets", async ({ page }) => {
  await enterSeededRole(page, "coach");
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await captureMarketingAsset(page, itemFor(4));

  await openNavigation(page, "Players");
  await expect(page.locator("#coach-roster-operations")).toBeVisible({ timeout: 20_000 });
  await captureMarketingAsset(page, itemFor(5));

  await openNavigation(page, "Schedule");
  await expect(page.getByText("Team Practice", { exact: true }).first()).toBeVisible({ timeout: 20_000 });
  await captureMarketingAsset(page, itemFor(6));
});
