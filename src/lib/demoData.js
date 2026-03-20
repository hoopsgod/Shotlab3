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
const DEMO_TIMESTAMP = Date.parse("2026-03-20T12:00:00.000Z");

const basePlayers = [
  {
    id: "player-demo-ava-brooks",
    email: "ava.brooks@demo.shotlab.app",
    name: "Ava Brooks",
    role: "player",
    teamId: DEMO_TEAM_ID,
    hideFromLeaderboards: false,
    createdAt: DEMO_TIMESTAMP,
  },
  {
    id: "player-demo-jordan-lee",
    email: "jordan.lee@demo.shotlab.app",
    name: "Jordan Lee",
    role: "player",
    teamId: DEMO_TEAM_ID,
    hideFromLeaderboards: false,
    createdAt: DEMO_TIMESTAMP + 1,
  },
  {
    id: "player-demo-micah-santos",
    email: "micah.santos@demo.shotlab.app",
    name: "Micah Santos",
    role: "player",
    teamId: DEMO_TEAM_ID,
    hideFromLeaderboards: false,
    createdAt: DEMO_TIMESTAMP + 2,
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
    createdAt: DEMO_TIMESTAMP,
  },
  {
    id: "profile-demo-jordan-lee",
    userId: "jordan.lee@demo.shotlab.app",
    teamId: DEMO_TEAM_ID,
    firstName: "Jordan",
    lastName: "Lee",
    jerseyNumber: "11",
    createdAt: DEMO_TIMESTAMP + 1,
  },
  {
    id: "profile-demo-micah-santos",
    userId: "micah.santos@demo.shotlab.app",
    teamId: DEMO_TEAM_ID,
    firstName: "Micah",
    lastName: "Santos",
    jerseyNumber: "24",
    createdAt: DEMO_TIMESTAMP + 2,
  },
];

const baseEvents = [
  {
    id: "event-demo-skill-lab",
    teamId: DEMO_TEAM_ID,
    title: "Skill Lab: Finishing Reads",
    date: "2026-03-23",
    time: "6:15 PM",
    location: "Main Gym — Court 2",
    desc: "Guard-footwork and rim-finishing session with live decision reads.",
    type: "workout",
  },
  {
    id: "event-demo-shooting-club",
    teamId: DEMO_TEAM_ID,
    title: "Morning Shooting Club",
    date: "2026-03-25",
    time: "6:30 AM",
    location: "Aux Gym — Gun 1",
    desc: "High-volume catch-and-shoot reps before school with tracking stations.",
    type: "shooting",
  },
  {
    id: "event-demo-film-room",
    teamId: DEMO_TEAM_ID,
    title: "Film Room + Recovery",
    date: "2026-03-27",
    time: "4:45 PM",
    location: "Team Room",
    desc: "Short scout-film review followed by guided mobility and recovery work.",
    type: "recovery",
  },
];

const baseScores = [
  { id: "score-demo-001", email: "ava.brooks@demo.shotlab.app", name: "Ava Brooks", teamId: DEMO_TEAM_ID, drillId: "demo-home-warm-up-shooting-4-minute", score: 47, date: "2026-03-10", ts: Date.parse("2026-03-10T18:20:00.000Z"), src: "home" },
  { id: "score-demo-002", email: "ava.brooks@demo.shotlab.app", name: "Ava Brooks", teamId: DEMO_TEAM_ID, drillId: "demo-home-3-minute-shooting", score: 39, date: "2026-03-12", ts: Date.parse("2026-03-12T18:24:00.000Z"), src: "home" },
  { id: "score-demo-003", email: "ava.brooks@demo.shotlab.app", name: "Ava Brooks", teamId: DEMO_TEAM_ID, drillId: "demo-program-230s", score: 44, date: "2026-03-14", ts: Date.parse("2026-03-14T18:28:00.000Z"), src: "program" },
  { id: "score-demo-004", email: "ava.brooks@demo.shotlab.app", name: "Ava Brooks", teamId: DEMO_TEAM_ID, drillId: "demo-program-buddy-hield-shooting", score: 61, date: "2026-03-18", ts: Date.parse("2026-03-18T18:36:00.000Z"), src: "program" },
  { id: "score-demo-005", email: "jordan.lee@demo.shotlab.app", name: "Jordan Lee", teamId: DEMO_TEAM_ID, drillId: "demo-home-calipari-shooting", score: 23, date: "2026-03-11", ts: Date.parse("2026-03-11T19:05:00.000Z"), src: "home" },
  { id: "score-demo-006", email: "jordan.lee@demo.shotlab.app", name: "Jordan Lee", teamId: DEMO_TEAM_ID, drillId: "demo-home-47-shooting", score: 17, date: "2026-03-13", ts: Date.parse("2026-03-13T19:18:00.000Z"), src: "home" },
  { id: "score-demo-007", email: "jordan.lee@demo.shotlab.app", name: "Jordan Lee", teamId: DEMO_TEAM_ID, drillId: "demo-program-warm-up-shooting-4-minute", score: 42, date: "2026-03-15", ts: Date.parse("2026-03-15T19:14:00.000Z"), src: "program" },
  { id: "score-demo-008", email: "jordan.lee@demo.shotlab.app", name: "Jordan Lee", teamId: DEMO_TEAM_ID, drillId: "demo-program-make-20", score: 28, date: "2026-03-19", ts: Date.parse("2026-03-19T19:32:00.000Z"), src: "program" },
  { id: "score-demo-009", email: "micah.santos@demo.shotlab.app", name: "Micah Santos", teamId: DEMO_TEAM_ID, drillId: "demo-home-buddy-hield-shooting", score: 58, date: "2026-03-09", ts: Date.parse("2026-03-09T17:58:00.000Z"), src: "home" },
  { id: "score-demo-010", email: "micah.santos@demo.shotlab.app", name: "Micah Santos", teamId: DEMO_TEAM_ID, drillId: "demo-home-230s", score: 36, date: "2026-03-12", ts: Date.parse("2026-03-12T18:42:00.000Z"), src: "home" },
  { id: "score-demo-011", email: "micah.santos@demo.shotlab.app", name: "Micah Santos", teamId: DEMO_TEAM_ID, drillId: "demo-program-calipari-shooting", score: 25, date: "2026-03-16", ts: Date.parse("2026-03-16T18:08:00.000Z"), src: "program" },
  { id: "score-demo-012", email: "micah.santos@demo.shotlab.app", name: "Micah Santos", teamId: DEMO_TEAM_ID, drillId: "demo-program-3-minute-shooting", score: 35, date: "2026-03-18", ts: Date.parse("2026-03-18T18:18:00.000Z"), src: "program" },
];

const baseShotLogs = [
  { id: "shotlog-demo-ava-week-1", email: "ava.brooks@demo.shotlab.app", teamId: DEMO_TEAM_ID, made: 182, date: "2026-03-09", ts: Date.parse("2026-03-09T20:00:00.000Z") },
  { id: "shotlog-demo-jordan-week-1", email: "jordan.lee@demo.shotlab.app", teamId: DEMO_TEAM_ID, made: 156, date: "2026-03-12", ts: Date.parse("2026-03-12T20:00:00.000Z") },
  { id: "shotlog-demo-micah-week-1", email: "micah.santos@demo.shotlab.app", teamId: DEMO_TEAM_ID, made: 204, date: "2026-03-15", ts: Date.parse("2026-03-15T20:00:00.000Z") },
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
      createdBy: "coach.demo@shotlab.app",
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
    snapshotCount: baseProgressSnapshots.length,
  },
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function writeStorage(key, value) {
  if (typeof window === "undefined" || !window.storage?.set) {
    throw new Error("Persistent storage is unavailable in this environment.");
  }

  await window.storage.set(key, JSON.stringify(value), true);
}

export async function applyDemoData(bundle = DEMO_DATA_BUNDLE) {
  const nextBundle = clone(bundle);

  await Promise.all([
    writeStorage(STORAGE_KEYS.teams, nextBundle.teams || []),
    writeStorage(STORAGE_KEYS.players, nextBundle.players || []),
    writeStorage(STORAGE_KEYS.playerProfiles, nextBundle.playerProfiles || []),
    writeStorage(STORAGE_KEYS.events, nextBundle.events || []),
    writeStorage(STORAGE_KEYS.scores, nextBundle.scores || []),
    writeStorage(STORAGE_KEYS.shotLogs, nextBundle.shotLogs || []),
    writeStorage(STORAGE_KEYS.progressSnapshots, nextBundle.progressSnapshots || []),
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
