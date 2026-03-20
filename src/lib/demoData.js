const STORAGE_KEYS = Object.freeze({
  teams: "sl:teams",
  players: "sl:players",
  playerProfiles: "sl:player-profiles",
  events: "sl:events",
  scores: "sl:scores",
  shotLogs: "sl:shotlogs",
  progressSnapshots: "sl:progress-snapshots",
  demoMeta: "sl:demo-data-meta",
});

const DEMO_TEAM_ID = "team-demo-titans";
const DEMO_COACH_EMAIL = "coach.demo@shotlab.app";
const DEMO_TIMESTAMP = Date.parse("2026-03-20T12:00:00.000Z");

const basePlayers = [
  {
    id: "player-demo-ava-brooks",
    email: "ava.brooks@demo.shotlab.app",
    name: "Ava Brooks",
    role: "player",
    teamId: DEMO_TEAM_ID,
    hideFromLeaderboards: false,
    createdAt: Date.parse("2026-01-08T15:30:00.000Z"),
  },
  {
    id: "player-demo-jordan-lee",
    email: "jordan.lee@demo.shotlab.app",
    name: "Jordan Lee",
    role: "player",
    teamId: DEMO_TEAM_ID,
    hideFromLeaderboards: false,
    createdAt: Date.parse("2026-01-09T15:30:00.000Z"),
  },
  {
    id: "player-demo-micah-santos",
    email: "micah.santos@demo.shotlab.app",
    name: "Micah Santos",
    role: "player",
    teamId: DEMO_TEAM_ID,
    hideFromLeaderboards: false,
    createdAt: Date.parse("2026-01-10T15:30:00.000Z"),
  },
  {
    id: "player-demo-riley-chen",
    email: "riley.chen@demo.shotlab.app",
    name: "Riley Chen",
    role: "player",
    teamId: DEMO_TEAM_ID,
    hideFromLeaderboards: false,
    createdAt: Date.parse("2026-01-12T15:30:00.000Z"),
  },
  {
    id: "player-demo-noah-bennett",
    email: "noah.bennett@demo.shotlab.app",
    name: "Noah Bennett",
    role: "player",
    teamId: DEMO_TEAM_ID,
    hideFromLeaderboards: false,
    createdAt: Date.parse("2026-01-14T15:30:00.000Z"),
  },
  {
    id: "player-demo-primary",
    email: "demo@shotlab.app",
    name: "Demo Player",
    role: "player",
    teamId: DEMO_TEAM_ID,
    hideFromLeaderboards: false,
    createdAt: Date.parse("2026-01-16T15:30:00.000Z"),
  },
];

const basePlayerProfiles = [
  {
    id: "profile-demo-ava-brooks",
    userId: "ava.brooks@demo.shotlab.app",
    teamId: DEMO_TEAM_ID,
    firstName: "Ava",
    lastName: "Brooks",
    jerseyNumber: "3",
    createdAt: Date.parse("2026-01-08T15:30:00.000Z"),
  },
  {
    id: "profile-demo-jordan-lee",
    userId: "jordan.lee@demo.shotlab.app",
    teamId: DEMO_TEAM_ID,
    firstName: "Jordan",
    lastName: "Lee",
    jerseyNumber: "11",
    createdAt: Date.parse("2026-01-09T15:30:00.000Z"),
  },
  {
    id: "profile-demo-micah-santos",
    userId: "micah.santos@demo.shotlab.app",
    teamId: DEMO_TEAM_ID,
    firstName: "Micah",
    lastName: "Santos",
    jerseyNumber: "24",
    createdAt: Date.parse("2026-01-10T15:30:00.000Z"),
  },
  {
    id: "profile-demo-riley-chen",
    userId: "riley.chen@demo.shotlab.app",
    teamId: DEMO_TEAM_ID,
    firstName: "Riley",
    lastName: "Chen",
    jerseyNumber: "7",
    createdAt: Date.parse("2026-01-12T15:30:00.000Z"),
  },
  {
    id: "profile-demo-noah-bennett",
    userId: "noah.bennett@demo.shotlab.app",
    teamId: DEMO_TEAM_ID,
    firstName: "Noah",
    lastName: "Bennett",
    jerseyNumber: "15",
    createdAt: Date.parse("2026-01-14T15:30:00.000Z"),
  },
  {
    id: "profile-demo-primary",
    userId: "demo@shotlab.app",
    teamId: DEMO_TEAM_ID,
    firstName: "Demo",
    lastName: "Player",
    jerseyNumber: "0",
    createdAt: Date.parse("2026-01-16T15:30:00.000Z"),
  },
];

const baseEvents = [
  {
    id: "event-demo-skill-lab-finish-reads",
    teamId: DEMO_TEAM_ID,
    ownerCoachId: DEMO_COACH_EMAIL,
    title: "Skill Lab: Finishing Reads",
    date: "2026-03-18",
    time: "6:15 PM",
    location: "Main Gym — Court 2",
    desc: "Guard-footwork and rim-finishing session with live decision reads and paint touch constraints.",
    type: "workout",
  },
  {
    id: "event-demo-film-room-recovery",
    teamId: DEMO_TEAM_ID,
    ownerCoachId: DEMO_COACH_EMAIL,
    title: "Film Room + Recovery",
    date: "2026-03-19",
    time: "4:45 PM",
    location: "Team Room",
    desc: "Short scout-film review followed by guided mobility, recovery circuits, and post-practice check-ins.",
    type: "recovery",
  },
  {
    id: "event-demo-morning-shooting-club",
    teamId: DEMO_TEAM_ID,
    ownerCoachId: DEMO_COACH_EMAIL,
    title: "Morning Shooting Club",
    date: "2026-03-22",
    time: "6:30 AM",
    location: "Aux Gym — Gun 1",
    desc: "High-volume catch-and-shoot reps before school with timed racks and partner rebound stations.",
    type: "shooting",
  },
  {
    id: "event-demo-competitive-small-sided",
    teamId: DEMO_TEAM_ID,
    ownerCoachId: DEMO_COACH_EMAIL,
    title: "Competitive Small-Sided Games",
    date: "2026-03-24",
    time: "5:30 PM",
    location: "Main Gym — Court 1",
    desc: "3-on-3 advantage games focused on decision speed, paint finishes, and weak-side spacing.",
    type: "workout",
  },
  {
    id: "event-demo-saturday-skill-series",
    teamId: DEMO_TEAM_ID,
    ownerCoachId: DEMO_COACH_EMAIL,
    title: "Saturday Skill Series",
    date: "2026-03-27",
    time: "9:00 AM",
    location: "Performance Center",
    desc: "Station-based guard and wing development block covering pull-ups, relocation threes, and finishing through contact.",
    type: "clinic",
  },
  {
    id: "event-demo-community-shootaround",
    teamId: DEMO_TEAM_ID,
    ownerCoachId: DEMO_COACH_EMAIL,
    title: "Community Shootaround",
    date: "2026-03-29",
    time: "1:00 PM",
    location: "East Campus Gym",
    desc: "Open gym run with shooting competitions, free throw ladders, and leadership reps with younger players.",
    type: "event",
  },
];

const baseScores = [
  { id: "score-demo-001", email: "ava.brooks@demo.shotlab.app", playerId: "ava.brooks@demo.shotlab.app", name: "Ava Brooks", teamId: DEMO_TEAM_ID, drillId: "demo-home-warm-up-shooting-4-minute", score: 47, date: "2026-03-08", ts: Date.parse("2026-03-08T18:20:00.000Z"), src: "home" },
  { id: "score-demo-002", email: "ava.brooks@demo.shotlab.app", playerId: "ava.brooks@demo.shotlab.app", name: "Ava Brooks", teamId: DEMO_TEAM_ID, drillId: "demo-home-3-minute-shooting", score: 39, date: "2026-03-11", ts: Date.parse("2026-03-11T18:24:00.000Z"), src: "home" },
  { id: "score-demo-003", email: "ava.brooks@demo.shotlab.app", playerId: "ava.brooks@demo.shotlab.app", name: "Ava Brooks", teamId: DEMO_TEAM_ID, drillId: "demo-program-230s", score: 44, date: "2026-03-14", ts: Date.parse("2026-03-14T18:28:00.000Z"), src: "program" },
  { id: "score-demo-004", email: "ava.brooks@demo.shotlab.app", playerId: "ava.brooks@demo.shotlab.app", name: "Ava Brooks", teamId: DEMO_TEAM_ID, drillId: "demo-program-buddy-hield-shooting", score: 61, date: "2026-03-18", ts: Date.parse("2026-03-18T18:36:00.000Z"), src: "program" },
  { id: "score-demo-005", email: "jordan.lee@demo.shotlab.app", playerId: "jordan.lee@demo.shotlab.app", name: "Jordan Lee", teamId: DEMO_TEAM_ID, drillId: "demo-home-calipari-shooting", score: 23, date: "2026-03-09", ts: Date.parse("2026-03-09T19:05:00.000Z"), src: "home" },
  { id: "score-demo-006", email: "jordan.lee@demo.shotlab.app", playerId: "jordan.lee@demo.shotlab.app", name: "Jordan Lee", teamId: DEMO_TEAM_ID, drillId: "demo-home-47-shooting", score: 17, date: "2026-03-12", ts: Date.parse("2026-03-12T19:18:00.000Z"), src: "home" },
  { id: "score-demo-007", email: "jordan.lee@demo.shotlab.app", playerId: "jordan.lee@demo.shotlab.app", name: "Jordan Lee", teamId: DEMO_TEAM_ID, drillId: "demo-program-warm-up-shooting-4-minute", score: 42, date: "2026-03-15", ts: Date.parse("2026-03-15T19:14:00.000Z"), src: "program" },
  { id: "score-demo-008", email: "jordan.lee@demo.shotlab.app", playerId: "jordan.lee@demo.shotlab.app", name: "Jordan Lee", teamId: DEMO_TEAM_ID, drillId: "demo-program-make-20", score: 28, date: "2026-03-19", ts: Date.parse("2026-03-19T19:32:00.000Z"), src: "program" },
  { id: "score-demo-009", email: "micah.santos@demo.shotlab.app", playerId: "micah.santos@demo.shotlab.app", name: "Micah Santos", teamId: DEMO_TEAM_ID, drillId: "demo-home-buddy-hield-shooting", score: 58, date: "2026-03-07", ts: Date.parse("2026-03-07T17:58:00.000Z"), src: "home" },
  { id: "score-demo-010", email: "micah.santos@demo.shotlab.app", playerId: "micah.santos@demo.shotlab.app", name: "Micah Santos", teamId: DEMO_TEAM_ID, drillId: "demo-home-230s", score: 36, date: "2026-03-10", ts: Date.parse("2026-03-10T18:42:00.000Z"), src: "home" },
  { id: "score-demo-011", email: "micah.santos@demo.shotlab.app", playerId: "micah.santos@demo.shotlab.app", name: "Micah Santos", teamId: DEMO_TEAM_ID, drillId: "demo-program-calipari-shooting", score: 25, date: "2026-03-16", ts: Date.parse("2026-03-16T18:08:00.000Z"), src: "program" },
  { id: "score-demo-012", email: "micah.santos@demo.shotlab.app", playerId: "micah.santos@demo.shotlab.app", name: "Micah Santos", teamId: DEMO_TEAM_ID, drillId: "demo-program-3-minute-shooting", score: 35, date: "2026-03-18", ts: Date.parse("2026-03-18T18:18:00.000Z"), src: "program" },
  { id: "score-demo-013", email: "riley.chen@demo.shotlab.app", playerId: "riley.chen@demo.shotlab.app", name: "Riley Chen", teamId: DEMO_TEAM_ID, drillId: "demo-home-warm-up-shooting-4-minute", score: 43, date: "2026-03-09", ts: Date.parse("2026-03-09T17:12:00.000Z"), src: "home" },
  { id: "score-demo-014", email: "riley.chen@demo.shotlab.app", playerId: "riley.chen@demo.shotlab.app", name: "Riley Chen", teamId: DEMO_TEAM_ID, drillId: "demo-home-47-shooting", score: 19, date: "2026-03-13", ts: Date.parse("2026-03-13T17:44:00.000Z"), src: "home" },
  { id: "score-demo-015", email: "riley.chen@demo.shotlab.app", playerId: "riley.chen@demo.shotlab.app", name: "Riley Chen", teamId: DEMO_TEAM_ID, drillId: "demo-program-make-20", score: 31, date: "2026-03-17", ts: Date.parse("2026-03-17T17:58:00.000Z"), src: "program" },
  { id: "score-demo-016", email: "noah.bennett@demo.shotlab.app", playerId: "noah.bennett@demo.shotlab.app", name: "Noah Bennett", teamId: DEMO_TEAM_ID, drillId: "demo-home-calipari-shooting", score: 26, date: "2026-03-08", ts: Date.parse("2026-03-08T16:52:00.000Z"), src: "home" },
  { id: "score-demo-017", email: "noah.bennett@demo.shotlab.app", playerId: "noah.bennett@demo.shotlab.app", name: "Noah Bennett", teamId: DEMO_TEAM_ID, drillId: "demo-home-3-minute-shooting", score: 33, date: "2026-03-12", ts: Date.parse("2026-03-12T16:36:00.000Z"), src: "home" },
  { id: "score-demo-018", email: "noah.bennett@demo.shotlab.app", playerId: "noah.bennett@demo.shotlab.app", name: "Noah Bennett", teamId: DEMO_TEAM_ID, drillId: "demo-program-230s", score: 41, date: "2026-03-19", ts: Date.parse("2026-03-19T16:48:00.000Z"), src: "program" },
  { id: "score-demo-019", email: "demo@shotlab.app", playerId: "demo@shotlab.app", name: "Demo Player", teamId: DEMO_TEAM_ID, drillId: "demo-home-warm-up-shooting-4-minute", score: 41, date: "2026-03-11", ts: Date.parse("2026-03-11T18:12:00.000Z"), src: "home" },
  { id: "score-demo-020", email: "demo@shotlab.app", playerId: "demo@shotlab.app", name: "Demo Player", teamId: DEMO_TEAM_ID, drillId: "demo-home-230s", score: 34, date: "2026-03-15", ts: Date.parse("2026-03-15T18:27:00.000Z"), src: "home" },
  { id: "score-demo-021", email: "demo@shotlab.app", playerId: "demo@shotlab.app", name: "Demo Player", teamId: DEMO_TEAM_ID, drillId: "demo-program-warm-up-shooting-4-minute", score: 45, date: "2026-03-20", ts: Date.parse("2026-03-20T18:44:00.000Z"), src: "program" },
];

const baseShotLogs = [
  { id: "shotlog-demo-ava-1", email: "ava.brooks@demo.shotlab.app", playerId: "ava.brooks@demo.shotlab.app", name: "Ava Brooks", teamId: DEMO_TEAM_ID, made: 182, date: "2026-03-08", ts: Date.parse("2026-03-08T20:00:00.000Z") },
  { id: "shotlog-demo-ava-2", email: "ava.brooks@demo.shotlab.app", playerId: "ava.brooks@demo.shotlab.app", name: "Ava Brooks", teamId: DEMO_TEAM_ID, made: 214, date: "2026-03-14", ts: Date.parse("2026-03-14T20:05:00.000Z") },
  { id: "shotlog-demo-ava-3", email: "ava.brooks@demo.shotlab.app", playerId: "ava.brooks@demo.shotlab.app", name: "Ava Brooks", teamId: DEMO_TEAM_ID, made: 196, date: "2026-03-19", ts: Date.parse("2026-03-19T20:12:00.000Z") },
  { id: "shotlog-demo-jordan-1", email: "jordan.lee@demo.shotlab.app", playerId: "jordan.lee@demo.shotlab.app", name: "Jordan Lee", teamId: DEMO_TEAM_ID, made: 156, date: "2026-03-09", ts: Date.parse("2026-03-09T20:00:00.000Z") },
  { id: "shotlog-demo-jordan-2", email: "jordan.lee@demo.shotlab.app", playerId: "jordan.lee@demo.shotlab.app", name: "Jordan Lee", teamId: DEMO_TEAM_ID, made: 174, date: "2026-03-15", ts: Date.parse("2026-03-15T20:06:00.000Z") },
  { id: "shotlog-demo-jordan-3", email: "jordan.lee@demo.shotlab.app", playerId: "jordan.lee@demo.shotlab.app", name: "Jordan Lee", teamId: DEMO_TEAM_ID, made: 188, date: "2026-03-20", ts: Date.parse("2026-03-20T20:10:00.000Z") },
  { id: "shotlog-demo-micah-1", email: "micah.santos@demo.shotlab.app", playerId: "micah.santos@demo.shotlab.app", name: "Micah Santos", teamId: DEMO_TEAM_ID, made: 204, date: "2026-03-07", ts: Date.parse("2026-03-07T20:00:00.000Z") },
  { id: "shotlog-demo-micah-2", email: "micah.santos@demo.shotlab.app", playerId: "micah.santos@demo.shotlab.app", name: "Micah Santos", teamId: DEMO_TEAM_ID, made: 231, date: "2026-03-13", ts: Date.parse("2026-03-13T20:08:00.000Z") },
  { id: "shotlog-demo-micah-3", email: "micah.santos@demo.shotlab.app", playerId: "micah.santos@demo.shotlab.app", name: "Micah Santos", teamId: DEMO_TEAM_ID, made: 219, date: "2026-03-18", ts: Date.parse("2026-03-18T20:14:00.000Z") },
  { id: "shotlog-demo-riley-1", email: "riley.chen@demo.shotlab.app", playerId: "riley.chen@demo.shotlab.app", name: "Riley Chen", teamId: DEMO_TEAM_ID, made: 163, date: "2026-03-10", ts: Date.parse("2026-03-10T19:48:00.000Z") },
  { id: "shotlog-demo-riley-2", email: "riley.chen@demo.shotlab.app", playerId: "riley.chen@demo.shotlab.app", name: "Riley Chen", teamId: DEMO_TEAM_ID, made: 181, date: "2026-03-16", ts: Date.parse("2026-03-16T19:56:00.000Z") },
  { id: "shotlog-demo-noah-1", email: "noah.bennett@demo.shotlab.app", playerId: "noah.bennett@demo.shotlab.app", name: "Noah Bennett", teamId: DEMO_TEAM_ID, made: 171, date: "2026-03-08", ts: Date.parse("2026-03-08T19:38:00.000Z") },
  { id: "shotlog-demo-noah-2", email: "noah.bennett@demo.shotlab.app", playerId: "noah.bennett@demo.shotlab.app", name: "Noah Bennett", teamId: DEMO_TEAM_ID, made: 193, date: "2026-03-14", ts: Date.parse("2026-03-14T19:50:00.000Z") },
  { id: "shotlog-demo-noah-3", email: "noah.bennett@demo.shotlab.app", playerId: "noah.bennett@demo.shotlab.app", name: "Noah Bennett", teamId: DEMO_TEAM_ID, made: 205, date: "2026-03-19", ts: Date.parse("2026-03-19T19:58:00.000Z") },
  { id: "shotlog-demo-player-1", email: "demo@shotlab.app", playerId: "demo@shotlab.app", name: "Demo Player", teamId: DEMO_TEAM_ID, made: 167, date: "2026-03-12", ts: Date.parse("2026-03-12T20:00:00.000Z") },
  { id: "shotlog-demo-player-2", email: "demo@shotlab.app", playerId: "demo@shotlab.app", name: "Demo Player", teamId: DEMO_TEAM_ID, made: 186, date: "2026-03-17", ts: Date.parse("2026-03-17T20:04:00.000Z") },
  { id: "shotlog-demo-player-3", email: "demo@shotlab.app", playerId: "demo@shotlab.app", name: "Demo Player", teamId: DEMO_TEAM_ID, made: 194, date: "2026-03-20", ts: Date.parse("2026-03-20T20:08:00.000Z") },
];

const baseProgressSnapshots = [
  {
    id: "progress-demo-week-10",
    teamId: DEMO_TEAM_ID,
    capturedAt: "2026-03-10T21:00:00.000Z",
    label: "Week 10 performance snapshot",
    metrics: {
      scoringSessionsLogged: 8,
      averageProgramScore: 39.2,
      weeklyShotVolume: 542,
      attendanceRate: 0.89,
    },
  },
  {
    id: "progress-demo-week-11",
    teamId: DEMO_TEAM_ID,
    capturedAt: "2026-03-17T21:00:00.000Z",
    label: "Week 11 performance snapshot",
    metrics: {
      scoringSessionsLogged: 12,
      averageProgramScore: 42.8,
      weeklyShotVolume: 611,
      attendanceRate: 0.93,
    },
  },
];

export const DEMO_DATA_BUNDLE = Object.freeze({
  teams: [
    {
      id: DEMO_TEAM_ID,
      name: "Demo Titans",
      school: "Shotlab Academy",
      level: "Varsity",
      joinCode: "TITAN23",
      createdBy: DEMO_COACH_EMAIL,
      createdAt: DEMO_TIMESTAMP,
    },
  ],
  players: basePlayers,
  playerProfiles: basePlayerProfiles,
  events: baseEvents,
  scores: baseScores,
  shotLogs: baseShotLogs,
  progressSnapshots: baseProgressSnapshots,
  meta: {
    teamId: DEMO_TEAM_ID,
    seededAt: "2026-03-20T12:00:00.000Z",
    playerCount: basePlayers.length,
    eventCount: baseEvents.length,
    scoreCount: baseScores.length,
    shotLogCount: baseShotLogs.length,
    snapshotCount: baseProgressSnapshots.length,
  },
});

function remapCollectionTeamId(items, nextTeamId) {
  return (items || []).map((item) => ({ ...item, teamId: nextTeamId }));
}

export function buildDemoDataBundle(overrides = {}) {
  const nextTeamId = overrides.teamId || DEMO_TEAM_ID;
  const nextCoachEmail = overrides.coachEmail || DEMO_DATA_BUNDLE.teams?.[0]?.createdBy || "coach.demo@shotlab.app";
  const existingTeam = overrides.team || {};
  const teamSeed = DEMO_DATA_BUNDLE.teams?.[0] || {};

  return clone({
    ...DEMO_DATA_BUNDLE,
    teams: [
      {
        ...teamSeed,
        ...existingTeam,
        id: nextTeamId,
        createdBy: nextCoachEmail,
      },
    ],
    players: remapCollectionTeamId(DEMO_DATA_BUNDLE.players, nextTeamId),
    playerProfiles: remapCollectionTeamId(DEMO_DATA_BUNDLE.playerProfiles, nextTeamId),
    events: remapCollectionTeamId(DEMO_DATA_BUNDLE.events, nextTeamId),
    scores: remapCollectionTeamId(DEMO_DATA_BUNDLE.scores, nextTeamId),
    shotLogs: remapCollectionTeamId(DEMO_DATA_BUNDLE.shotLogs, nextTeamId),
    progressSnapshots: remapCollectionTeamId(DEMO_DATA_BUNDLE.progressSnapshots, nextTeamId),
    meta: {
      ...DEMO_DATA_BUNDLE.meta,
      teamId: nextTeamId,
      seededForCoach: nextCoachEmail,
    },
  });
}
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function writeStorage(key, value) {
  if (typeof window === "undefined" || !window.storage?.set) {
    throw new Error("Persistent storage is unavailable in this environment.");
  }

  await window.storage.set(key, JSON.stringify(value), true);
}

async function readStorage(key) {
  if (typeof window === "undefined" || !window.storage?.get) {
    throw new Error("Persistent storage is unavailable in this environment.");
  }

  const stored = await window.storage.get(key, true);
  return stored?.value ? JSON.parse(stored.value) : null;
}

function mergeById(existingItems = [], nextItems = []) {
  const merged = new Map();

  for (const item of Array.isArray(existingItems) ? existingItems : []) {
    if (item?.id == null) continue;
    merged.set(String(item.id), item);
  }

  for (const item of Array.isArray(nextItems) ? nextItems : []) {
    if (item?.id == null) continue;
    merged.set(String(item.id), item);
  }

  return Array.from(merged.values());
}

export async function applyDemoData(bundle = DEMO_DATA_BUNDLE) {
  const nextBundle = clone(bundle);
  const [
    existingTeams,
    existingPlayers,
    existingPlayerProfiles,
    existingEvents,
    existingScores,
    existingShotLogs,
    existingProgressSnapshots,
  ] = await Promise.all([
    readStorage(STORAGE_KEYS.teams),
    readStorage(STORAGE_KEYS.players),
    readStorage(STORAGE_KEYS.playerProfiles),
    readStorage(STORAGE_KEYS.events),
    readStorage(STORAGE_KEYS.scores),
    readStorage(STORAGE_KEYS.shotLogs),
    readStorage(STORAGE_KEYS.progressSnapshots),
  ]);

  await Promise.all([
    writeStorage(STORAGE_KEYS.teams, mergeById(existingTeams, nextBundle.teams || [])),
    writeStorage(STORAGE_KEYS.players, mergeById(existingPlayers, nextBundle.players || [])),
    writeStorage(STORAGE_KEYS.playerProfiles, mergeById(existingPlayerProfiles, nextBundle.playerProfiles || [])),
    writeStorage(STORAGE_KEYS.events, mergeById(existingEvents, nextBundle.events || [])),
    writeStorage(STORAGE_KEYS.scores, mergeById(existingScores, nextBundle.scores || [])),
    writeStorage(STORAGE_KEYS.shotLogs, mergeById(existingShotLogs, nextBundle.shotLogs || [])),
    writeStorage(STORAGE_KEYS.progressSnapshots, mergeById(existingProgressSnapshots, nextBundle.progressSnapshots || [])),
    writeStorage(STORAGE_KEYS.demoMeta, nextBundle.meta || {}),
  ]);

  return nextBundle;
}

export async function clearDemoData() {
  await Promise.all([
    writeStorage(STORAGE_KEYS.teams, null),
    writeStorage(STORAGE_KEYS.players, null),
    writeStorage(STORAGE_KEYS.playerProfiles, null),
    writeStorage(STORAGE_KEYS.events, null),
    writeStorage(STORAGE_KEYS.scores, null),
    writeStorage(STORAGE_KEYS.shotLogs, null),
    writeStorage(STORAGE_KEYS.progressSnapshots, null),
    writeStorage(STORAGE_KEYS.demoMeta, null),
  ]);
}

export { STORAGE_KEYS };
