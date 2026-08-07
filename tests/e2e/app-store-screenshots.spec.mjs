import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve(process.cwd(), "artifacts/app-store/iphone-6.9");
const listing = JSON.parse(fs.readFileSync("native/app-store-listing.json", "utf8"));
const TEAM_ID = "northstar-varsity";
const PLAYER_EMAIL = "jordan@northstar.test";
const today = new Date();
const isoOffset = (days) => {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const ARCHIVE = {
  id: "northstar-2025-26",
  seasonName: "2025-26 Season",
  teamId: TEAM_ID,
  createdAt: new Date().toISOString(),
  playerTotals: [
    { email: PLAYER_EMAIL, name: "Jordan Lee", makes: 1780, attempts: 3260, sessions: 48 },
    { email: "maya@northstar.test", name: "Maya Carter", makes: 1640, attempts: 3100, sessions: 44 },
  ],
};

const seedData = {
  "sl:teams": [
    {
      id: TEAM_ID,
      name: "Northstar Varsity",
      teamName: "Northstar Varsity",
      joinCode: "NORTH26",
      primaryColor: "#C8FF1A",
      secondaryColor: "#11202A",
      logoUrl: "/branding/titans-exact-logo.png.PNG",
    },
  ],
  "sl:activeTeam": TEAM_ID,
  "sl:teamBranding": {
    teamId: TEAM_ID,
    teamName: "Northstar Varsity",
    primaryColor: "#C8FF1A",
    secondaryColor: "#11202A",
    logoUrl: "/branding/titans-exact-logo.png.PNG",
  },
  "sl:roster": [
    { id: "jordan", email: PLAYER_EMAIL, name: "Jordan Lee", teamId: TEAM_ID, position: "Guard", number: "3" },
    { id: "maya", email: "maya@northstar.test", name: "Maya Carter", teamId: TEAM_ID, position: "Wing", number: "12" },
    { id: "avery", email: "avery@northstar.test", name: "Avery Brooks", teamId: TEAM_ID, position: "Forward", number: "21" },
    { id: "riley", email: "riley@northstar.test", name: "Riley Quinn", teamId: TEAM_ID, position: "Guard", number: "5" },
  ],
  "sl:shot-logs": [
    { id: "j1", email: PLAYER_EMAIL, name: "Jordan Lee", teamId: TEAM_ID, makes: 160, attempts: 250, date: isoOffset(0), source: "program", drill: "Game Speed Reads" },
    { id: "j2", email: PLAYER_EMAIL, name: "Jordan Lee", teamId: TEAM_ID, makes: 140, attempts: 220, date: isoOffset(-1), source: "home", drill: "5-Spot Catch & Shoot" },
    { id: "j3", email: PLAYER_EMAIL, name: "Jordan Lee", teamId: TEAM_ID, makes: 120, attempts: 190, date: isoOffset(-2), source: "program", drill: "Corner-to-Corner 3s" },
    { id: "m1", email: "maya@northstar.test", name: "Maya Carter", teamId: TEAM_ID, makes: 145, attempts: 230, date: isoOffset(0), source: "program", drill: "Game Speed Reads" },
    { id: "a1", email: "avery@northstar.test", name: "Avery Brooks", teamId: TEAM_ID, makes: 118, attempts: 205, date: isoOffset(-1), source: "home", drill: "Free Throws" },
    { id: "r1", email: "riley@northstar.test", name: "Riley Quinn", teamId: TEAM_ID, makes: 96, attempts: 180, date: isoOffset(-3), source: "home", drill: "Form Shooting Ladder" },
  ],
  "sl:events": [
    { id: "practice-1", teamId: TEAM_ID, title: "Team Practice", date: isoOffset(1), time: "4:30 PM", place: "Main Gym", type: "practice" },
    { id: "film-1", teamId: TEAM_ID, title: "Film & Scout", date: isoOffset(3), time: "3:45 PM", place: "Team Room", type: "meeting" },
    { id: "game-1", teamId: TEAM_ID, title: "League Game", date: isoOffset(5), time: "7:00 PM", place: "Northstar Gym", type: "game" },
  ],
  "sl:rsvps": [
    { id: "jordan-practice", eventId: "practice-1", email: PLAYER_EMAIL, name: "Jordan Lee", teamId: TEAM_ID, status: "yes" },
    { id: "maya-practice", eventId: "practice-1", email: "maya@northstar.test", name: "Maya Carter", teamId: TEAM_ID, status: "yes" },
    { id: "avery-practice", eventId: "practice-1", email: "avery@northstar.test", name: "Avery Brooks", teamId: TEAM_ID, status: "pending" },
  ],
  "sl:drills": [
    { id: "game-speed", teamId: TEAM_ID, name: "Game Speed Reads", target: 150, category: "Shooting" },
    { id: "free-throws", teamId: TEAM_ID, name: "Pressure Free Throws", target: 50, category: "Shooting" },
  ],
  "sl:assignments": [
    { id: "assignment-1", teamId: TEAM_ID, title: "Game Speed Reads", drillId: "game-speed", dueDate: isoOffset(2), targetMakes: 150, assignedTo: [PLAYER_EMAIL, "maya@northstar.test", "avery@northstar.test"] },
  ],
  "sl:sc-sessions": [
    { id: "sc-team-lift", teamId: TEAM_ID, title: "Team Lift", date: isoOffset(2), time: "3:15 PM", place: "Weight Room", type: "strength" },
    { id: "sc-prior", teamId: TEAM_ID, title: "Power & Mobility", date: isoOffset(-2), time: "7:30 AM", place: "School", type: "strength" },
  ],
  "sl:sc-rsvps": [
    { id: "jordan-sc", sessionId: "sc-team-lift", email: PLAYER_EMAIL, name: "Jordan Lee", teamId: TEAM_ID, status: "yes" },
    { id: "maya-sc", sessionId: "sc-team-lift", email: "maya@northstar.test", name: "Maya Carter", teamId: TEAM_ID, status: "yes" },
    { id: "avery-sc", sessionId: "sc-team-lift", email: "avery@northstar.test", name: "Avery Brooks", teamId: TEAM_ID, status: "pending" },
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
  const demoButton = page.getByRole("button", { name: role === "coach" ? /Coach demo/i : /Player demo/i });
  await expect(demoButton).toBeVisible({ timeout: 20_000 });
  await demoButton.click();
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
  const direct = dock.getByRole("button", { name: label, exact: true });
  if (await direct.count()) {
    await direct.click();
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