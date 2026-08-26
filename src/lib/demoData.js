import { isDemoPlayerSessionShotLog } from "./demoMode.js";

const STORAGE_KEYS = Object.freeze({
  teams: "sl:teams",
  players: "sl:players",
  playerProfiles: "sl:player-profiles",
  events: "sl:events",
  rsvps: "sl:rsvps",
  scores: "sl:scores",
  programScores: "sl:program-scores",
  shotLogs: "sl:shotlogs",
  challenges: "sl:challenges",
  scSessions: "sl:sc-sessions",
  scRsvps: "sl:sc-rsvps",
  scLogs: "sl:sc-logs",
  coachPriorities: "sl:coach-priorities",
  progressSnapshots: "sl:progress-snapshots",
  demoMeta: "sl:demo-data-meta",
});

const DEMO_TEAM_ID = "team-demo-titans";
const DEMO_DATA_VERSION = 5;
const DEMO_TIMESTAMP = Date.parse("2026-03-20T12:00:00.000Z");
const DEMO_TEAM_BRANDING = Object.freeze({
  teamName: "Demo Titans",
  logoUrl: "/branding/titans-exact-logo.png.PNG",
  logoMarkUrl: "/branding/titans-default-mark.svg",
});

const padDatePart = (value) => String(value).padStart(2, "0");
export const localDateKey = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
};

const relativeDate = (days = 0) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
};

const relativeTimestamp = (days = 0, hour = 18, minute = 0) => {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  date.setDate(date.getDate() + days);
  return date.getTime();
};

// Compact tuple source keeps the public demo rich without inflating startup JS.
// [slug, first, last, jersey, position, grade, weeklyMakes, streak, attendanceMask, warmup, form, programA, programB, primary]
const rosterRows = [
  ["marcus-reed", "Marcus", "Reed", "3", "PG", "12", 782, 9, 127, 15, 24, 36, 40],
  ["jordan-mitchell", "Jordan", "Mitchell", "11", "SG", "11", 714, 7, 95, 14, 23, 34, 38],
  ["micah-santos", "Micah", "Santos", "24", "SF", "12", 661, 6, 123, 13, 22, 32, 36],
  ["isaiah-brooks", "Isaiah", "Brooks", "5", "PG", "10", 623, 5, 63, 12, 21, 31, 35],
  ["cameron-hayes", "Cameron", "Hayes", "14", "SG", "11", 579, 5, 125, 11, 20, 29, 34],
  ["noah-bennett", "Noah", "Bennett", "21", "PF", "12", 531, 4, 119, 11, 20, 28, 32],
  ["devin-walker", "Devin", "Walker", "32", "C", "11", 486, 3, 91, 10, 19, 27, 31],
  ["miles-thompson", "Miles", "Thompson", "1", "G", "10", 428, 2, 109, 9, 18, 25, 29],
  ["jalen-price", "Jalen", "Price", "20", "F", "10", 371, 2, 51, 8, 17, 24, 27],
  ["caleb-foster", "Caleb", "Foster", "23", "F", "9", 304, 1, 85, 7, 16, 22, 25],
  ["andre-lewis", "Andre", "Lewis", "34", "C", "9", 218, 0, 74, 6, 15, 20, 23],
  ["primary", "Demo", "Player", "12", "G", "11", 552, 4, 111, 11, 20, 29, 33, true],
];

const demoRoster = rosterRows.map(([slug, firstName, lastName, jerseyNumber, position, grade, weeklyMakes, streakDays, attendanceMask, warmup, form, programA, programB, primary = false]) => ({
  slug,
  email: primary ? "demo@shotlab.app" : `${slug.replace("-", ".")}@demo.shotlab.app`,
  firstName,
  lastName,
  jerseyNumber,
  position,
  grade,
  weeklyMakes,
  streakDays,
  attendanceMask,
  warmup,
  form,
  program: [programA, programB],
  primary,
}));

const playerName = (player) => `${player.firstName} ${player.lastName}`;
const playerId = (player) => player.primary ? "player-demo-primary" : `player-demo-${player.slug}`;
const attended = (player, index) => Boolean(player.attendanceMask & (1 << index));

const basePlayers = demoRoster.map((player, index) => ({
  id: playerId(player),
  email: player.email,
  name: playerName(player),
  role: "player",
  hideFromLeaderboards: false,
  createdAt: DEMO_TIMESTAMP + index,
}));

const basePlayerProfiles = demoRoster.map((player, index) => ({
  id: player.primary ? "profile-demo-primary" : `profile-demo-${player.slug}`,
  userId: player.email,
  email: player.email,
  firstName: player.firstName,
  lastName: player.lastName,
  jerseyNumber: player.jerseyNumber,
  position: player.position,
  grade: player.grade,
  createdAt: DEMO_TIMESTAMP + index,
}));

const eventRows = [
  ["event-demo-open-gym", "Open Gym + Competitive Shooting", -24, "5:30 PM", "Main Gym", "Competitive shooting, advantage games, and live five-on-five.", "workout"],
  ["event-demo-advantage-reads", "Advantage Reads Lab", -16, "6:00 PM", "Aux Gym", "Ball-screen reads, two-dribble counters, and weak-side decisions.", "clinic"],
  ["event-demo-team-practice-past", "Team Practice", -9, "6:15 PM", "Main Gym", "Transition standards, half-court execution, and competitive shooting.", "practice"],
  ["event-demo-lift-past", "Team Lift + Recovery", -4, "6:30 AM", "Weight Room", "Lower-body strength, landing quality, and recovery work.", "strength"],
  ["evt-upcoming-1", "Team Practice", 1, "6:00 PM", "Main Gym", "Team shooting standards, transition decisions, and controlled five-on-five.", "practice"],
  ["event-demo-skill-lab", "Skill Lab: Rim Pressure", 3, "6:15 PM", "Main Gym Court 2", "Paint-touch creation, contact finishes, and late-clock reads.", "workout"],
  ["event-demo-shooting-club", "Early Work 300", 5, "6:30 AM", "Aux Gym", "High-volume catch-and-shoot and relocation threes before school.", "shooting"],
  ["event-demo-film-room", "Film + Recovery Reset", 8, "4:45 PM", "Team Room", "Possession review, spacing corrections, and recovery circuit.", "recovery"],
  ["event-demo-scrimmage", "Blue / White Scrimmage", 10, "10:00 AM", "Main Gym", "Controlled scrimmage with shot-quality and transition benchmarks.", "game"],
];

const baseEvents = eventRows.map(([id, title, days, time, location, desc, type]) => ({ id, title, date: relativeDate(days), time, location, desc, type }));

const baseRsvps = baseEvents.slice(0, 7).flatMap((event, eventIndex) => demoRoster.map((player, playerIndex) => ({
  id: `rsvp-demo-${eventIndex + 1}-${player.slug}`,
  email: player.email,
  playerId: player.email,
  name: playerName(player),
  eventId: event.id,
  attended: attended(player, eventIndex),
  status: attended(player, eventIndex) ? "going" : "not-going",
  ts: relativeTimestamp(eventIndex - 6, 16, playerIndex * 2),
})));

const homeScore = (player, index, suffix, drillId, drillName, score, days, minute) => ({
  id: `score-${player.slug}-${suffix}`,
  email: player.email,
  playerId: player.email,
  name: playerName(player),
  drillId,
  drillName,
  score,
  date: relativeDate(days),
  ts: relativeTimestamp(days, 18, minute),
  src: "home",
});

const demoPrimaryScores = demoRoster.flatMap((player, index) => [
  homeScore(player, index, "warmup", "demo-home-warm-up-shooting-4-minute", "4-Minute Warm-Up Shooting", player.warmup, index % 3 === 0 ? 0 : -1, index * 2),
  homeScore(player, index, "form", "demo-form-shooting", "Form Shooting Ladder", player.form, -2 - (index % 2), index * 2 + 1),
  homeScore(player, index, "ft", "demo-free-throws-20", "Pressure Free Throws", Math.min(20, 11 + Math.round(player.form / 3)), -4 - (index % 3), index),
]);

const demoShotLogs = demoRoster.flatMap((player, index) => {
  const first = Math.round(player.weeklyMakes * 0.4);
  const second = Math.round(player.weeklyMakes * 0.33);
  return [first, second, player.weeklyMakes - first - second].map((made, slot) => {
    const days = slot === 0 ? (index % 2 === 0 ? 0 : -1) : slot === 1 ? -3 : -6;
    return { id: `shotlog-${player.slug}-${slot + 1}`, email: player.email, playerId: player.email, name: playerName(player), made, date: relativeDate(days), ts: relativeTimestamp(days, 19, index + slot * 12) };
  });
});

const demoProgressSnapshots = demoRoster.flatMap((player, index) => [
  { id: `progress-${player.slug}-makes`, email: player.email, playerId: player.email, label: "7-day makes", value: player.weeklyMakes, date: relativeDate(0), ts: relativeTimestamp(0, 20, index) },
  { id: `progress-${player.slug}-streak`, email: player.email, playerId: player.email, label: "Training streak", value: player.streakDays, date: relativeDate(0), ts: relativeTimestamp(0, 20, index + 15) },
]);

const demoProgramScores = demoRoster.flatMap((player, index) => player.program.map((score, slot) => {
  const days = slot ? -2 - (index % 3) : -7 - (index % 2);
  return { id: `program-${player.slug}-${slot + 1}`, email: player.email, playerId: player.email, name: playerName(player), drillId: "demo-program-230s", drillName: "2:30 Shooting", score, date: relativeDate(days), ts: relativeTimestamp(days, 18, index + slot * 15), src: "program" };
}));

const demoChallenges = [
  { id: "challenge-demo-pending", playerId: "marcus.reed@demo.shotlab.app", from: "marcus.reed@demo.shotlab.app", fromName: "Marcus Reed", to: "demo@shotlab.app", toName: "Demo Player", drillId: "demo-home-warm-up-shooting-4-minute", score: 15, max: 25, status: "pending", ts: relativeTimestamp(-1, 20, 5) },
  { id: "challenge-demo-complete", playerId: "demo@shotlab.app", from: "demo@shotlab.app", fromName: "Demo Player", to: "jordan.mitchell@demo.shotlab.app", toName: "Jordan Mitchell", drillId: "demo-home-warm-up-shooting-4-minute", score: 14, respScore: 13, max: 25, status: "won", ts: relativeTimestamp(-5, 19, 10), respTs: relativeTimestamp(-4, 19, 10) },
];

const scRows = [
  ["sc-demo-recovery", "Recovery + Mobility", "Recovery", -6, "6:30 AM", "Performance Center", "Ankles, hips, trunk control, and recovery work."],
  ["sc-demo-power", "Total Body Strength", "Strength", 2, "6:15 AM", "Weight Room", "Strength, trunk control, and shoulder durability."],
  ["sc-demo-speed", "Acceleration + Change of Direction", "Performance", 6, "7:00 AM", "Turf", "First-step acceleration, deceleration, and reactive change of direction."],
];
const demoScSessions = scRows.map(([id, title, sport, days, time, location, desc]) => ({ id, title, sport, date: relativeDate(days), time, location, desc, sessionType: "Program" }));
const demoScRsvps = demoScSessions.flatMap((session, sessionIndex) => demoRoster.map((player, playerIndex) => ({
  id: `scrsvp-${sessionIndex}-${player.slug}`,
  sessionId: session.id,
  email: player.email,
  playerId: player.email,
  name: playerName(player),
  status: attended(player, (sessionIndex + 2) % 7) ? "going" : "not-going",
  attended: sessionIndex === 0 ? attended(player, 2) : undefined,
  ts: relativeTimestamp(-7 + sessionIndex * 4, 12, playerIndex),
})));
const demoScLogs = demoRoster.map((player, index) => ({
  id: `sclog-${player.slug}-recovery`,
  sessionId: "sc-demo-recovery",
  email: player.email,
  playerId: player.email,
  name: playerName(player),
  sport: "Recovery",
  date: relativeDate(-6),
  duration: 38 + (index % 4) * 3,
  notes: index < 7 ? "Completed full recovery block." : "Modified recovery block.",
}));

const demoCoachPriorities = {
  todayFocusText: "Win the week: raise team shooting volume and close the RSVP gaps before tomorrow's practice.",
  focusEmphasis: "Consistency",
  priorityDrillText: "2:30 Shooting",
  challengeText: "Get 10 players over 500 weekly makes and bring every active streak into tomorrow's practice.",
  weeklyMakesTarget: 650,
  weeklyCheckinsTarget: 3,
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildDemoTeam(teamId, coachEmail, team) {
  if (team) {
    const existing = clone(team);
    const currentName = String(existing?.name || "").trim();
    const currentBrandingName = String(existing?.branding?.teamName || "").trim();
    const genericName = !currentName || /^(demo team|shotlab team)$/i.test(currentName);
    const genericBranding = !currentBrandingName || /^(demo team|shotlab team)$/i.test(currentBrandingName);
    const shouldSeedDemoIdentity = genericName && genericBranding;
    return {
      ...existing,
      id: teamId || existing.id,
      ...(shouldSeedDemoIdentity ? {
        name: "Demo Titans",
        teamName: DEMO_TEAM_BRANDING.teamName,
        logoUrl: DEMO_TEAM_BRANDING.logoUrl,
        logoMarkUrl: DEMO_TEAM_BRANDING.logoMarkUrl,
        branding: { ...(existing.branding || {}), ...DEMO_TEAM_BRANDING },
      } : {}),
      ownerCoachId: coachEmail || existing.ownerCoachId || existing.coachEmail || null,
      updatedAt: Date.now(),
    };
  }

  return {
    id: teamId || DEMO_TEAM_ID,
    name: "Demo Titans",
    teamName: DEMO_TEAM_BRANDING.teamName,
    logoUrl: DEMO_TEAM_BRANDING.logoUrl,
    logoMarkUrl: DEMO_TEAM_BRANDING.logoMarkUrl,
    branding: { ...DEMO_TEAM_BRANDING },
    ownerCoachId: coachEmail || null,
    createdAt: DEMO_TIMESTAMP,
    joinCode: "DEMO26",
    updatedAt: Date.now(),
  };
}

const withTeam = (rows, teamId) => rows.map((row) => ({ ...row, teamId }));

export function buildDemoDataBundle({ teamId = DEMO_TEAM_ID, coachEmail = null, team } = {}) {
  const resolvedTeam = buildDemoTeam(teamId, coachEmail, team);
  const playerRows = withTeam(basePlayers, resolvedTeam.id);
  const coachRow = coachEmail ? {
    id: "coach-demo-primary",
    email: coachEmail,
    name: "Demo Coach",
    role: "coach",
    isCoach: true,
    teamId: resolvedTeam.id,
    hideFromLeaderboards: true,
    createdAt: DEMO_TIMESTAMP - 1,
  } : null;
  const players = coachRow ? [coachRow, ...playerRows] : playerRows;
  const playerProfiles = withTeam(basePlayerProfiles, resolvedTeam.id);
  const events = withTeam(baseEvents, resolvedTeam.id);
  const rsvps = withTeam(baseRsvps, resolvedTeam.id);
  const scores = withTeam(demoPrimaryScores, resolvedTeam.id);
  const programScores = withTeam(demoProgramScores, resolvedTeam.id);
  const shotLogs = withTeam(demoShotLogs, resolvedTeam.id);
  const challenges = withTeam(demoChallenges, resolvedTeam.id);
  const scSessions = withTeam(demoScSessions, resolvedTeam.id).map((session) => ({ ...session, ownerCoachId: coachEmail || "coach.demo@shotlab.app" }));
  const scRsvps = withTeam(demoScRsvps, resolvedTeam.id);
  const scLogs = withTeam(demoScLogs, resolvedTeam.id);
  const coachPriorities = { ...demoCoachPriorities, updatedAt: new Date().toISOString() };
  const progressSnapshots = withTeam(demoProgressSnapshots, resolvedTeam.id);

  return {
    teams: [resolvedTeam],
    players,
    playerProfiles,
    events,
    rsvps,
    scores,
    programScores,
    shotLogs,
    challenges,
    scSessions,
    scRsvps,
    scLogs,
    coachPriorities,
    progressSnapshots,
    demoMeta: {
      seededAt: Date.now(),
      teamId: resolvedTeam.id,
      coachEmail,
      source: "demo-data",
      version: DEMO_DATA_VERSION,
      rosterSize: demoRoster.length,
    },
  };
}

function parseStored(value, fallback) {
  if (value == null) return fallback;
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return fallback; }
}

export function unwrapManagedStorageValue(result) {
  if (result && typeof result === "object" && Object.prototype.hasOwnProperty.call(result, "value")) return result.value;
  return result;
}

async function readStored(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    if (window.storage && typeof window.storage.get === "function") {
      const result = await window.storage.get(key);
      const parsed = parseStored(unwrapManagedStorageValue(result), null);
      if (parsed != null) return parsed;
    }
  } catch {}
  return parseStored(window.localStorage?.getItem(key), fallback);
}

async function writeStored(key, value) {
  const json = JSON.stringify(value);
  if (typeof window === "undefined") return;
  if (window.localStorage) window.localStorage.setItem(key, json);
  if (window.storage && typeof window.storage.set === "function") await window.storage.set(key, json, true);
}

const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
const rowTeamId = (row) => String(row?.teamId ?? row?.team_id ?? "").trim();

function demoIdentitySet(payload) {
  const identities = new Set();
  for (const row of [...(payload.players || []), ...(payload.playerProfiles || [])]) {
    for (const value of [row.email, row.playerId, row.player_id, row.userId, row.user_id]) {
      const normalized = normalizeIdentity(value);
      if (normalized) identities.add(normalized);
    }
  }
  return identities;
}

function rowUsesManagedDemoIdentity(row, identities) {
  return [row?.email, row?.player_email, row?.playerEmail, row?.playerId, row?.player_id, row?.userId, row?.user_id]
    .map(normalizeIdentity)
    .some((value) => value && identities.has(value));
}

export function mergeDemoCollection(existing, incoming, { teamId = "", managedIdentities = new Set(), teamsOnly = false } = {}) {
  const prior = Array.isArray(existing) ? existing : [];
  const next = Array.isArray(incoming) ? incoming : [];
  const incomingIds = new Set(next.map((row) => String(row?.id || "")).filter(Boolean));
  const preserved = prior.filter((row) => {
    if (incomingIds.has(String(row?.id || ""))) return false;
    if (teamsOnly) return String(row?.id || "") !== String(teamId || "");
    if (teamId && rowTeamId(row) === String(teamId)) return false;
    if (rowUsesManagedDemoIdentity(row, managedIdentities)) return false;
    return true;
  });
  return [...preserved, ...next];
}

export async function applyDemoData(bundle) {
  const payload = bundle || buildDemoDataBundle();
  const teamId = String(payload.demoMeta?.teamId || payload.teams?.[0]?.id || "");
  const managedIdentities = demoIdentitySet(payload);
  const collections = [
    [STORAGE_KEYS.teams, payload.teams || [], { teamsOnly: true }],
    [STORAGE_KEYS.players, payload.players || []],
    [STORAGE_KEYS.playerProfiles, payload.playerProfiles || []],
    [STORAGE_KEYS.events, payload.events || []],
    [STORAGE_KEYS.rsvps, payload.rsvps || []],
    [STORAGE_KEYS.scores, payload.scores || []],
    [STORAGE_KEYS.programScores, payload.programScores || []],
    [STORAGE_KEYS.shotLogs, payload.shotLogs || []],
    [STORAGE_KEYS.challenges, payload.challenges || []],
    [STORAGE_KEYS.scSessions, payload.scSessions || []],
    [STORAGE_KEYS.scRsvps, payload.scRsvps || []],
    [STORAGE_KEYS.scLogs, payload.scLogs || []],
    [STORAGE_KEYS.progressSnapshots, payload.progressSnapshots || []],
  ];

  for (const [key, incoming, options = {}] of collections) {
    const existing = await readStored(key, []);
    await writeStored(key, mergeDemoCollection(existing, incoming, { teamId, managedIdentities, ...options }));
  }

  const existingPriorities = await readStored(STORAGE_KEYS.coachPriorities, {});
  const priorityMap = existingPriorities && typeof existingPriorities === "object" && !Array.isArray(existingPriorities) ? existingPriorities : {};
  await writeStored(STORAGE_KEYS.coachPriorities, { ...priorityMap, [teamId]: payload.coachPriorities || demoCoachPriorities });
  await writeStored(STORAGE_KEYS.demoMeta, payload.demoMeta || {});
}

export async function clearDemoData(bundle) {
  const payload = bundle || buildDemoDataBundle({ coachEmail: "coach.demo@shotlab.app" });
  const storedMeta = await readStored(STORAGE_KEYS.demoMeta, {});
  const teamId = String(storedMeta?.teamId || payload.demoMeta?.teamId || payload.teams?.[0]?.id || DEMO_TEAM_ID);
  const managedIdentities = demoIdentitySet(payload);
  const storedCoachEmail = normalizeIdentity(storedMeta?.coachEmail);
  if (storedCoachEmail) managedIdentities.add(storedCoachEmail);
  managedIdentities.add("coach.demo@shotlab.app");
  managedIdentities.add("demo@shotlab.app");

  const collections = [
    [STORAGE_KEYS.teams, { teamsOnly: true }],
    [STORAGE_KEYS.players],
    [STORAGE_KEYS.playerProfiles],
    [STORAGE_KEYS.events],
    [STORAGE_KEYS.rsvps],
    [STORAGE_KEYS.scores],
    [STORAGE_KEYS.programScores],
    [STORAGE_KEYS.shotLogs],
    [STORAGE_KEYS.challenges],
    [STORAGE_KEYS.scSessions],
    [STORAGE_KEYS.scRsvps],
    [STORAGE_KEYS.scLogs],
    [STORAGE_KEYS.progressSnapshots],
  ];

  for (const [key, options = {}] of collections) {
    const existing = await readStored(key, []);
    const preserved = (Array.isArray(existing) ? existing : []).filter((row) => {
      if (options.teamsOnly) return String(row?.id || "") !== teamId;
      if (rowTeamId(row) === teamId) return false;
      if (rowUsesManagedDemoIdentity(row, managedIdentities)) return false;
      if (key === STORAGE_KEYS.shotLogs && isDemoPlayerSessionShotLog(row, { teamId })) return false;
      return true;
    });
    await writeStored(key, preserved);
  }

  const priorities = await readStored(STORAGE_KEYS.coachPriorities, {});
  if (priorities && typeof priorities === "object" && !Array.isArray(priorities)) {
    const nextPriorities = { ...priorities };
    delete nextPriorities[teamId];
    await writeStored(STORAGE_KEYS.coachPriorities, nextPriorities);
  }
  await writeStored(STORAGE_KEYS.demoMeta, {});
}

function installLegacyDemoMigrationMarker() {
  if (typeof window === "undefined" || typeof window.addEventListener !== "function") return;
  window.addEventListener("shotlab:demo-session-started", (event) => {
    try {
      const accountEmail = normalizeIdentity(event?.detail?.email);
      if (accountEmail !== "coach.demo@shotlab.app" && accountEmail !== "demo@shotlab.app") return;
      const players = parseStored(window.localStorage?.getItem(STORAGE_KEYS.players), []);
      const teams = parseStored(window.localStorage?.getItem(STORAGE_KEYS.teams), []);
      const rows = Array.isArray(players) ? players : [];
      const demoPlayer = rows.find((row) => normalizeIdentity(row?.email) === "demo@shotlab.app" && row?.teamId);
      const demoCoach = rows.find((row) => normalizeIdentity(row?.email) === "coach.demo@shotlab.app" && row?.teamId);
      const ownedTeam = (Array.isArray(teams) ? teams : []).find((row) => normalizeIdentity(row?.ownerCoachId || row?.coachEmail) === "coach.demo@shotlab.app");
      const teamId = String(demoPlayer?.teamId || demoCoach?.teamId || ownedTeam?.id || "").trim();
      if (!teamId) return;
      const json = JSON.stringify({ seededAt: Date.now(), teamId, coachEmail: "coach.demo@shotlab.app", source: "demo-data", version: DEMO_DATA_VERSION, migration: "legacy-demo-session" });
      window.localStorage?.setItem(STORAGE_KEYS.demoMeta, json);
      if (window.storage && typeof window.storage.set === "function") Promise.resolve(window.storage.set(STORAGE_KEYS.demoMeta, json, true)).catch(() => {});
    } catch {}
  });
}

installLegacyDemoMigrationMarker();
