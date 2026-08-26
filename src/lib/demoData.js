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

// Demo-only roster. These identities never leave local demo storage or touch Supabase.
// The spread intentionally includes leaders, steady contributors, and a few athletes
// who need attention so populated Coach/Player views tell a believable story.
const demoRoster = [
  { slug: "ava-brooks", email: "ava.brooks@demo.shotlab.app", firstName: "Ava", lastName: "Brooks", jerseyNumber: "3", weeklyMakes: 742, streakDays: 8, attendance: [true, true, true, true, true, true], warmup: 14, form: 24, program: [34, 38] },
  { slug: "jordan-lee", email: "jordan.lee@demo.shotlab.app", firstName: "Jordan", lastName: "Lee", jerseyNumber: "11", weeklyMakes: 681, streakDays: 6, attendance: [true, true, true, true, false, true], warmup: 12, form: 22, program: [31, 35] },
  { slug: "micah-santos", email: "micah.santos@demo.shotlab.app", firstName: "Micah", lastName: "Santos", jerseyNumber: "24", weeklyMakes: 615, streakDays: 5, attendance: [true, true, false, true, true, true], warmup: 11, form: 21, program: [29, 33] },
  { slug: "maya-chen", email: "maya.chen@demo.shotlab.app", firstName: "Maya", lastName: "Chen", jerseyNumber: "5", weeklyMakes: 588, streakDays: 4, attendance: [true, true, true, true, true, false], warmup: 10, form: 20, program: [28, 32] },
  { slug: "riley-carter", email: "riley.carter@demo.shotlab.app", firstName: "Riley", lastName: "Carter", jerseyNumber: "14", weeklyMakes: 544, streakDays: 4, attendance: [true, false, true, true, true, true], warmup: 10, form: 19, program: [27, 31] },
  { slug: "sofia-martinez", email: "sofia.martinez@demo.shotlab.app", firstName: "Sofia", lastName: "Martinez", jerseyNumber: "21", weeklyMakes: 497, streakDays: 3, attendance: [true, true, true, false, true, true], warmup: 9, form: 18, program: [26, 30] },
  { slug: "harper-johnson", email: "harper.johnson@demo.shotlab.app", firstName: "Harper", lastName: "Johnson", jerseyNumber: "32", weeklyMakes: 431, streakDays: 2, attendance: [true, true, false, true, false, true], warmup: 8, form: 17, program: [24, 28] },
  { slug: "nia-williams", email: "nia.williams@demo.shotlab.app", firstName: "Nia", lastName: "Williams", jerseyNumber: "1", weeklyMakes: 362, streakDays: 1, attendance: [true, false, true, false, true, false], warmup: 7, form: 16, program: [23, 26] },
  { slug: "chloe-bennett", email: "chloe.bennett@demo.shotlab.app", firstName: "Chloe", lastName: "Bennett", jerseyNumber: "20", weeklyMakes: 284, streakDays: 0, attendance: [false, true, false, true, false, false], warmup: 6, form: 15, program: [21, 24] },
  { slug: "primary", email: "demo@shotlab.app", firstName: "Taylor", lastName: "Morgan", jerseyNumber: "12", weeklyMakes: 526, streakDays: 4, attendance: [true, true, true, true, false, true], warmup: 10, form: 20, program: [27, 31], primary: true },
];

const playerName = (player) => `${player.firstName} ${player.lastName}`;
const playerId = (player) => player.primary ? "player-demo-primary" : `player-demo-${player.slug}`;

const basePlayers = demoRoster.map((player, index) => ({
  id: playerId(player),
  email: player.email,
  name: playerName(player),
  role: "player",
  teamId: DEMO_TEAM_ID,
  hideFromLeaderboards: false,
  createdAt: DEMO_TIMESTAMP + index,
}));

const basePlayerProfiles = demoRoster.map((player, index) => ({
  id: player.primary ? "profile-demo-primary" : `profile-demo-${player.slug}`,
  userId: player.email,
  teamId: DEMO_TEAM_ID,
  firstName: player.firstName,
  lastName: player.lastName,
  jerseyNumber: player.jerseyNumber,
  createdAt: DEMO_TIMESTAMP + index,
}));

const baseEvents = [
  { id: "event-demo-foundation-shooting", teamId: DEMO_TEAM_ID, title: "Foundation Shooting Block", date: relativeDate(-28), time: "5:30 PM", location: "Main Gym", desc: "Footwork prep, paint finishes, and game-speed catch-and-shoot volume.", type: "workout" },
  { id: "event-demo-advantage-reads", teamId: DEMO_TEAM_ID, title: "Advantage Reads Lab", date: relativeDate(-21), time: "9:00 AM", location: "Aux Gym", desc: "Ball-screen reads, two-dribble counters, and weak-side decision reps.", type: "clinic" },
  { id: "event-demo-recovery-lab", teamId: DEMO_TEAM_ID, title: "Reset + Mobility Session", date: relativeDate(-14), time: "11:15 AM", location: "Training Room", desc: "Hip/ankle mobility and soft-tissue recovery between training blocks.", type: "recovery" },
  { id: "evt-upcoming-1", teamId: DEMO_TEAM_ID, title: "Team Practice", date: relativeDate(1), time: "6:00 PM", location: "Main Gym", desc: "Team shooting standards, transition decisions, and controlled five-on-five.", type: "practice" },
  { id: "event-demo-skill-lab", teamId: DEMO_TEAM_ID, title: "Skill Lab: Rim Pressure Finishes", date: relativeDate(3), time: "6:15 PM", location: "Main Gym Court 2", desc: "Paint touch creation, contact finishes, and late-clock reads.", type: "workout" },
  { id: "event-demo-shooting-club", teamId: DEMO_TEAM_ID, title: "Early Work 300", date: relativeDate(5), time: "6:30 AM", location: "Aux Gym", desc: "High-volume catch-and-shoot and relocation threes before school.", type: "shooting" },
  { id: "event-demo-film-room", teamId: DEMO_TEAM_ID, title: "Film + Recovery Reset", date: relativeDate(8), time: "4:45 PM", location: "Team Room", desc: "Possession review, spacing corrections, and recovery circuit.", type: "recovery" },
];

const baseRsvps = baseEvents.slice(0, 6).flatMap((event, eventIndex) => demoRoster.map((player, playerIndex) => ({
  id: `rsvp-demo-${eventIndex + 1}-${player.slug}`,
  email: player.email,
  playerId: player.email,
  name: playerName(player),
  eventId: event.id,
  teamId: DEMO_TEAM_ID,
  attended: Boolean(player.attendance[eventIndex]),
  status: player.attendance[eventIndex] ? "going" : "not-going",
  ts: relativeTimestamp(eventIndex - 5, 16, playerIndex * 3),
})));

const demoPrimaryScores = demoRoster.flatMap((player, index) => [
  { id: `score-${player.slug}-warmup-current`, email: player.email, name: playerName(player), teamId: DEMO_TEAM_ID, drillId: "demo-home-warm-up-shooting-4-minute", score: player.warmup, date: relativeDate(index % 3 === 0 ? 0 : -1), ts: relativeTimestamp(index % 3 === 0 ? 0 : -1, 18, index * 2), src: "home" },
  { id: `score-${player.slug}-form-current`, email: player.email, name: playerName(player), teamId: DEMO_TEAM_ID, drillId: "demo-form-shooting", score: player.form, date: relativeDate(-2 - (index % 2)), ts: relativeTimestamp(-2 - (index % 2), 18, index * 2 + 1), src: "home" },
  { id: `score-${player.slug}-warmup-prior`, email: player.email, name: playerName(player), teamId: DEMO_TEAM_ID, drillId: "demo-home-warm-up-shooting-4-minute", score: Math.max(4, player.warmup - 2), date: relativeDate(-6 - (index % 3)), ts: relativeTimestamp(-6 - (index % 3), 18, index * 2 + 2), src: "home" },
]);

const demoShotLogs = demoRoster.flatMap((player, index) => {
  const dayOne = Math.round(player.weeklyMakes * 0.42);
  const dayTwo = Math.round(player.weeklyMakes * 0.33);
  const dayThree = player.weeklyMakes - dayOne - dayTwo;
  return [
    { id: `shotlog-${player.slug}-01`, email: player.email, playerId: player.email, teamId: DEMO_TEAM_ID, name: playerName(player), made: dayOne, date: relativeDate(index % 2 === 0 ? 0 : -1), ts: relativeTimestamp(index % 2 === 0 ? 0 : -1, 19, index) },
    { id: `shotlog-${player.slug}-02`, email: player.email, playerId: player.email, teamId: DEMO_TEAM_ID, name: playerName(player), made: dayTwo, date: relativeDate(-3), ts: relativeTimestamp(-3, 19, index + 10) },
    { id: `shotlog-${player.slug}-03`, email: player.email, playerId: player.email, teamId: DEMO_TEAM_ID, name: playerName(player), made: dayThree, date: relativeDate(-6), ts: relativeTimestamp(-6, 19, index + 20) },
  ];
});

const demoProgressSnapshots = demoRoster.flatMap((player, index) => [
  { id: `progress-${player.slug}-makes`, email: player.email, playerId: player.email, teamId: DEMO_TEAM_ID, label: "7-day makes", value: player.weeklyMakes, date: relativeDate(0), ts: relativeTimestamp(0, 20, index) },
  { id: `progress-${player.slug}-streak`, email: player.email, playerId: player.email, teamId: DEMO_TEAM_ID, label: "Training streak", value: player.streakDays, date: relativeDate(0), ts: relativeTimestamp(0, 20, index + 15) },
]);

const demoProgramScores = demoRoster.flatMap((player, index) => [
  { id: `program-${player.slug}-01`, email: player.email, playerId: player.email, name: playerName(player), drillId: "demo-program-230s", drillName: "2:30 Shooting", score: player.program[0], date: relativeDate(-6 - (index % 2)), ts: relativeTimestamp(-6 - (index % 2), 18, 10 + index), src: "program" },
  { id: `program-${player.slug}-02`, email: player.email, playerId: player.email, name: playerName(player), drillId: "demo-program-230s", drillName: "2:30 Shooting", score: player.program[1], date: relativeDate(-2 - (index % 3)), ts: relativeTimestamp(-2 - (index % 3), 18, 25 + index), src: "program" },
]);

const demoChallenges = [
  { id: "challenge-demo-pending", teamId: DEMO_TEAM_ID, playerId: "ava.brooks@demo.shotlab.app", from: "ava.brooks@demo.shotlab.app", fromName: "Ava Brooks", to: "demo@shotlab.app", toName: "Taylor Morgan", drillId: "demo-home-warm-up-shooting-4-minute", score: 14, max: 25, status: "pending", ts: relativeTimestamp(-1, 20, 5) },
  { id: "challenge-demo-complete", teamId: DEMO_TEAM_ID, playerId: "demo@shotlab.app", from: "demo@shotlab.app", fromName: "Taylor Morgan", to: "jordan.lee@demo.shotlab.app", toName: "Jordan Lee", drillId: "demo-home-warm-up-shooting-4-minute", score: 13, respScore: 11, max: 25, status: "won", ts: relativeTimestamp(-5, 19, 10), respTs: relativeTimestamp(-4, 19, 10) },
  { id: "challenge-demo-tight", teamId: DEMO_TEAM_ID, playerId: "maya.chen@demo.shotlab.app", from: "maya.chen@demo.shotlab.app", fromName: "Maya Chen", to: "micah.santos@demo.shotlab.app", toName: "Micah Santos", drillId: "demo-form-shooting", score: 21, respScore: 22, max: 25, status: "lost", ts: relativeTimestamp(-8, 18, 20), respTs: relativeTimestamp(-7, 18, 20) },
];

const demoScSessions = [
  { id: "sc-demo-recovery", title: "Recovery + Mobility", sport: "Recovery", date: relativeDate(-3), time: "6:30 AM", location: "Performance Center", desc: "Ankles, hips, trunk control, and recovery work.", sessionType: "Program" },
  { id: "sc-demo-power", title: "Lower Body Power", sport: "Strength", date: relativeDate(2), time: "6:15 AM", location: "Weight Room", desc: "Trap-bar power, split squat strength, and landing control.", sessionType: "Program" },
  { id: "sc-demo-speed", title: "Acceleration + Change of Direction", sport: "Performance", date: relativeDate(6), time: "7:00 AM", location: "Turf", desc: "First-step acceleration, deceleration, and reactive change of direction.", sessionType: "Program" },
];

const demoScRsvps = demoRoster.slice(0, 8).flatMap((player, index) => [
  { id: `scrsvp-demo-power-${player.slug}`, sessionId: "sc-demo-power", email: player.email, playerId: player.email, name: playerName(player), ts: relativeTimestamp(0, 12, index * 3) },
  ...(index < 6 ? [{ id: `scrsvp-demo-recovery-${player.slug}`, sessionId: "sc-demo-recovery", email: player.email, playerId: player.email, name: playerName(player), ts: relativeTimestamp(-4, 12, index * 3 + 1) }] : []),
]);

const demoScLogs = demoRoster.slice(0, 7).map((player, index) => ({
  id: `sclog-demo-${player.slug}`,
  sessionId: "sc-demo-recovery",
  email: player.email,
  playerId: player.email,
  name: playerName(player),
  sport: "Recovery",
  date: relativeDate(-3),
  duration: 38 + index,
  notes: index < 4 ? "Full session completed." : "Mobility and recovery block completed.",
}));

const demoCoachPriorities = {
  todayFocusText: "Create paint pressure, then finish the day with 150 game-speed makes.",
  focusEmphasis: "Consistency",
  priorityDrillText: "2:30 Shooting",
  challengeText: "Win today's skill block, log your makes, and close with 20 pressure free throws.",
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
        branding: {
          ...(existing.branding || {}),
          ...DEMO_TEAM_BRANDING,
        },
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

export function buildDemoDataBundle({ teamId = DEMO_TEAM_ID, coachEmail = null, team } = {}) {
  const resolvedTeam = buildDemoTeam(teamId, coachEmail, team);
  const playerRows = basePlayers.map((player) => ({ ...player, teamId: resolvedTeam.id }));
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
  const playerProfiles = basePlayerProfiles.map((profile) => ({ ...profile, teamId: resolvedTeam.id }));
  const events = baseEvents.map((event) => ({ ...event, teamId: resolvedTeam.id }));
  const rsvps = baseRsvps.map((rsvp) => ({ ...rsvp, teamId: resolvedTeam.id }));
  const scores = demoPrimaryScores.map((score) => ({ ...score, teamId: resolvedTeam.id, playerId: score.playerId || score.email }));
  const programScores = demoProgramScores.map((score) => ({ ...score, teamId: resolvedTeam.id, playerId: score.playerId || score.email }));
  const shotLogs = demoShotLogs.map((log) => ({ ...log, teamId: resolvedTeam.id }));
  const challenges = demoChallenges.map((challenge) => ({ ...challenge, teamId: resolvedTeam.id }));
  const scSessions = demoScSessions.map((session) => ({ ...session, teamId: resolvedTeam.id, ownerCoachId: coachEmail || "coach.demo@shotlab.app" }));
  const scRsvps = demoScRsvps.map((rsvp) => ({ ...rsvp, teamId: resolvedTeam.id }));
  const scLogs = demoScLogs.map((log) => ({ ...log, teamId: resolvedTeam.id }));
  const coachPriorities = { ...demoCoachPriorities, updatedAt: new Date().toISOString() };
  const progressSnapshots = demoProgressSnapshots.map((snapshot) => ({ ...snapshot, teamId: resolvedTeam.id }));

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
      rosterVersion: 2,
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
  if (window.storage && typeof window.storage.set === "function") {
    await window.storage.set(key, json, true);
  }
}

const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
const rowTeamId = (row) => String(row?.teamId ?? row?.team_id ?? "").trim();

function demoIdentitySet(payload) {
  const identities = new Set();
  for (const row of payload.players || []) {
    for (const value of [row.email, row.playerId, row.player_id, row.userId, row.user_id]) {
      const normalized = normalizeIdentity(value);
      if (normalized) identities.add(normalized);
    }
  }
  for (const row of payload.playerProfiles || []) {
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
    ["sl:teams", payload.teams || [], { teamsOnly: true }],
    ["sl:players", payload.players || []],
    ["sl:player-profiles", payload.playerProfiles || []],
    ["sl:events", payload.events || []],
    ["sl:rsvps", payload.rsvps || []],
    ["sl:scores", payload.scores || []],
    ["sl:program-scores", payload.programScores || []],
    ["sl:shotlogs", payload.shotLogs || []],
    ["sl:challenges", payload.challenges || []],
    ["sl:sc-sessions", payload.scSessions || []],
    ["sl:sc-rsvps", payload.scRsvps || []],
    ["sl:sc-logs", payload.scLogs || []],
    ["sl:progress-snapshots", payload.progressSnapshots || []],
  ];

  for (const [key, incoming, options = {}] of collections) {
    const existing = await readStored(key, []);
    const merged = mergeDemoCollection(existing, incoming, { teamId, managedIdentities, ...options });
    await writeStored(key, merged);
  }
  const existingPriorities = await readStored(STORAGE_KEYS.coachPriorities, {});
  const priorityMap = existingPriorities && typeof existingPriorities === "object" && !Array.isArray(existingPriorities) ? existingPriorities : {};
  await writeStored(STORAGE_KEYS.coachPriorities, { ...priorityMap, [teamId]: payload.coachPriorities || demoCoachPriorities });
  await writeStored("sl:demo-data-meta", payload.demoMeta || {});
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
