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

const basePlayers = [
  { id: "player-demo-ava-brooks", email: "ava.brooks@demo.shotlab.app", name: "Ava Brooks", role: "player", teamId: DEMO_TEAM_ID, hideFromLeaderboards: false, createdAt: DEMO_TIMESTAMP },
  { id: "player-demo-jordan-lee", email: "jordan.lee@demo.shotlab.app", name: "Jordan Lee", role: "player", teamId: DEMO_TEAM_ID, hideFromLeaderboards: false, createdAt: DEMO_TIMESTAMP + 1 },
  { id: "player-demo-micah-santos", email: "micah.santos@demo.shotlab.app", name: "Micah Santos", role: "player", teamId: DEMO_TEAM_ID, hideFromLeaderboards: false, createdAt: DEMO_TIMESTAMP + 2 },
  { id: "player-demo-primary", email: "demo@shotlab.app", name: "Demo Player", role: "player", teamId: DEMO_TEAM_ID, hideFromLeaderboards: false, createdAt: DEMO_TIMESTAMP + 3 },
];

const basePlayerProfiles = [
  { id: "profile-demo-ava-brooks", userId: "ava.brooks@demo.shotlab.app", teamId: DEMO_TEAM_ID, firstName: "Ava", lastName: "Brooks", jerseyNumber: "3", createdAt: DEMO_TIMESTAMP },
  { id: "profile-demo-jordan-lee", userId: "jordan.lee@demo.shotlab.app", teamId: DEMO_TEAM_ID, firstName: "Jordan", lastName: "Lee", jerseyNumber: "11", createdAt: DEMO_TIMESTAMP + 1 },
  { id: "profile-demo-micah-santos", userId: "micah.santos@demo.shotlab.app", teamId: DEMO_TEAM_ID, firstName: "Micah", lastName: "Santos", jerseyNumber: "24", createdAt: DEMO_TIMESTAMP + 2 },
  { id: "profile-demo-primary", userId: "demo@shotlab.app", teamId: DEMO_TEAM_ID, firstName: "Demo", lastName: "Player", jerseyNumber: "0", createdAt: DEMO_TIMESTAMP + 3 },
];

const baseEvents = [
  { id: "event-demo-foundation-shooting", teamId: DEMO_TEAM_ID, title: "Foundation Shooting Block", date: relativeDate(-28), time: "5:30 PM", location: "Main Gym", desc: "Footwork prep, paint finishes, and game-speed catch-and-shoot volume.", type: "workout" },
  { id: "event-demo-advantage-reads", teamId: DEMO_TEAM_ID, title: "Advantage Reads Lab", date: relativeDate(-21), time: "9:00 AM", location: "Aux Gym", desc: "Ball-screen reads, two-dribble counters, and weak-side decision reps.", type: "clinic" },
  { id: "event-demo-recovery-lab", teamId: DEMO_TEAM_ID, title: "Reset + Mobility Session", date: relativeDate(-14), time: "11:15 AM", location: "Training Room", desc: "Hip/ankle mobility and soft-tissue recovery between training blocks.", type: "recovery" },
  { id: "evt-upcoming-1", teamId: DEMO_TEAM_ID, title: "Team Practice", date: relativeDate(1), time: "6:00 PM", location: "Main Gym", desc: "Team shooting standards, transition decisions, and controlled five-on-five.", type: "practice" },
  { id: "event-demo-skill-lab", teamId: DEMO_TEAM_ID, title: "Skill Lab: Rim Pressure Finishes", date: relativeDate(3), time: "6:15 PM", location: "Main Gym Court 2", desc: "Paint touch creation, contact finishes, and late-clock reads.", type: "workout" },
  { id: "event-demo-shooting-club", teamId: DEMO_TEAM_ID, title: "Early Work 300", date: relativeDate(5), time: "6:30 AM", location: "Aux Gym", desc: "High-volume catch-and-shoot and relocation threes before school.", type: "shooting" },
  { id: "event-demo-film-room", teamId: DEMO_TEAM_ID, title: "Film + Recovery Reset", date: relativeDate(8), time: "4:45 PM", location: "Team Room", desc: "Possession review, spacing corrections, and recovery circuit.", type: "recovery" },
];

const baseRsvps = baseEvents.slice(0, 6).map((event, index) => ({
  id: "rsvp-demo-00" + (index + 1),
  email: "demo@shotlab.app",
  playerId: "demo@shotlab.app",
  name: "Demo Player",
  eventId: event.id,
  teamId: DEMO_TEAM_ID,
  attended: true,
  ts: relativeTimestamp(index - 5, 17, 0),
}));

const demoPrimaryScores = [
  { id: "score-dp-s01", email: "demo@shotlab.app", name: "Demo Player", teamId: DEMO_TEAM_ID, drillId: "demo-home-warm-up-shooting-4-minute", score: 9, date: relativeDate(0), ts: relativeTimestamp(0, 18, 0), src: "home" },
  { id: "score-dp-s02", email: "demo@shotlab.app", name: "Demo Player", teamId: DEMO_TEAM_ID, drillId: "demo-form-shooting", score: 22, date: relativeDate(-1), ts: relativeTimestamp(-1, 18, 0), src: "home" },
  { id: "score-dp-s03", email: "ava.brooks@demo.shotlab.app", name: "Ava Brooks", teamId: DEMO_TEAM_ID, drillId: "demo-home-warm-up-shooting-4-minute", score: 11, date: relativeDate(0), ts: relativeTimestamp(0, 18, 5), src: "home" },
  { id: "score-dp-s04", email: "jordan.lee@demo.shotlab.app", name: "Jordan Lee", teamId: DEMO_TEAM_ID, drillId: "demo-home-warm-up-shooting-4-minute", score: 10, date: relativeDate(0), ts: relativeTimestamp(0, 18, 10), src: "home" },
];

const demoShotLogs = [
  { id: "shotlog-demo-01", email: "demo@shotlab.app", playerId: "demo@shotlab.app", teamId: DEMO_TEAM_ID, name: "Demo Player", made: 125, date: relativeDate(0), ts: relativeTimestamp(0, 19, 0) },
  { id: "shotlog-demo-02", email: "ava.brooks@demo.shotlab.app", playerId: "ava.brooks@demo.shotlab.app", teamId: DEMO_TEAM_ID, name: "Ava Brooks", made: 160, date: relativeDate(0), ts: relativeTimestamp(0, 19, 5) },
];

const demoProgressSnapshots = [
  { id: "progress-demo-01", email: "demo@shotlab.app", playerId: "demo@shotlab.app", teamId: DEMO_TEAM_ID, label: "7-day makes", value: 125, date: relativeDate(0), ts: relativeTimestamp(0, 19, 10) },
];

const demoProgramScores = [
  { id: "program-demo-01", email: "demo@shotlab.app", playerId: "demo@shotlab.app", name: "Demo Player", drillId: "demo-program-230s", drillName: "2:30 Shooting", score: 27, date: relativeDate(-6), ts: relativeTimestamp(-6, 18, 10), src: "program" },
  { id: "program-demo-02", email: "demo@shotlab.app", playerId: "demo@shotlab.app", name: "Demo Player", drillId: "demo-program-230s", drillName: "2:30 Shooting", score: 31, date: relativeDate(-2), ts: relativeTimestamp(-2, 18, 15), src: "program" },
  { id: "program-demo-03", email: "ava.brooks@demo.shotlab.app", playerId: "ava.brooks@demo.shotlab.app", name: "Ava Brooks", drillId: "demo-program-230s", drillName: "2:30 Shooting", score: 34, date: relativeDate(-3), ts: relativeTimestamp(-3, 18, 20), src: "program" },
  { id: "program-demo-04", email: "jordan.lee@demo.shotlab.app", playerId: "jordan.lee@demo.shotlab.app", name: "Jordan Lee", drillId: "demo-program-230s", drillName: "2:30 Shooting", score: 29, date: relativeDate(-4), ts: relativeTimestamp(-4, 18, 25), src: "program" },
];

const demoChallenges = [
  { id: "challenge-demo-pending", teamId: DEMO_TEAM_ID, playerId: "ava.brooks@demo.shotlab.app", from: "ava.brooks@demo.shotlab.app", fromName: "Ava Brooks", to: "demo@shotlab.app", toName: "Demo Player", drillId: "demo-home-warm-up-shooting-4-minute", score: 12, max: 25, status: "pending", ts: relativeTimestamp(-1, 20, 5) },
  { id: "challenge-demo-complete", teamId: DEMO_TEAM_ID, playerId: "demo@shotlab.app", from: "demo@shotlab.app", fromName: "Demo Player", to: "jordan.lee@demo.shotlab.app", toName: "Jordan Lee", drillId: "demo-home-warm-up-shooting-4-minute", score: 14, respScore: 11, max: 25, status: "won", ts: relativeTimestamp(-5, 19, 10), respTs: relativeTimestamp(-4, 19, 10) },
];

const demoScSessions = [
  { id: "sc-demo-recovery", title: "Recovery + Mobility", sport: "Recovery", date: relativeDate(-3), time: "6:30 AM", location: "Performance Center", desc: "Ankles, hips, trunk control, and recovery work.", sessionType: "Program" },
  { id: "sc-demo-power", title: "Lower Body Power", sport: "Strength", date: relativeDate(2), time: "6:15 AM", location: "Weight Room", desc: "Trap-bar power, split squat strength, and landing control.", sessionType: "Program" },
  { id: "sc-demo-speed", title: "Acceleration + Change of Direction", sport: "Performance", date: relativeDate(6), time: "7:00 AM", location: "Turf", desc: "First-step acceleration, deceleration, and reactive change of direction.", sessionType: "Program" },
];

const demoScRsvps = [
  { id: "scrsvp-demo-01", sessionId: "sc-demo-recovery", email: "demo@shotlab.app", playerId: "demo@shotlab.app", name: "Demo Player", ts: relativeTimestamp(-4, 12, 0) },
  { id: "scrsvp-demo-02", sessionId: "sc-demo-power", email: "demo@shotlab.app", playerId: "demo@shotlab.app", name: "Demo Player", ts: relativeTimestamp(0, 12, 5) },
  { id: "scrsvp-demo-03", sessionId: "sc-demo-power", email: "ava.brooks@demo.shotlab.app", playerId: "ava.brooks@demo.shotlab.app", name: "Ava Brooks", ts: relativeTimestamp(0, 12, 10) },
  { id: "scrsvp-demo-04", sessionId: "sc-demo-power", email: "jordan.lee@demo.shotlab.app", playerId: "jordan.lee@demo.shotlab.app", name: "Jordan Lee", ts: relativeTimestamp(0, 12, 15) },
];

const demoScLogs = [
  { id: "sclog-demo-01", sessionId: "sc-demo-recovery", email: "demo@shotlab.app", playerId: "demo@shotlab.app", name: "Demo Player", sport: "Recovery", date: relativeDate(-3), duration: 42, notes: "Completed mobility and recovery block." },
  { id: "sclog-demo-02", sessionId: "sc-demo-recovery", email: "ava.brooks@demo.shotlab.app", playerId: "ava.brooks@demo.shotlab.app", name: "Ava Brooks", sport: "Recovery", date: relativeDate(-3), duration: 45, notes: "Full session completed." },
];

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
    return {
      ...clone(team),
      id: teamId || team.id,
      ownerCoachId: coachEmail || team.ownerCoachId || team.coachEmail || null,
      updatedAt: Date.now(),
    };
  }

  return {
    id: teamId || DEMO_TEAM_ID,
    name: "Demo Titans",
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
