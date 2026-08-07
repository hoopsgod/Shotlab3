import { isDemoPlayerSessionShotLog } from "./demoMode.js";
const STORAGE_KEYS = Object.freeze({
  teams: "sl:teams",
  players: "sl:players",
  playerProfiles: "sl:player-profiles",
  events: "sl:events",
  rsvps: "sl:rsvps",
  scores: "sl:scores",
  shotLogs: "sl:shotlogs",
  progressSnapshots: "sl:progress-snapshots",
  demoMeta: "sl:demo-data-meta",
});

const DEMO_TEAM_ID = "team-demo-titans";
const DEMO_TIMESTAMP = Date.parse("2026-03-20T12:00:00.000Z");

const relativeDate = (days = 0) => {
  const date = new Date();
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const relativeTimestamp = (days = 0, hour = 18, minute = 0) => {
  const date = new Date();
  date.setUTCHours(hour, minute, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
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
  const shotLogs = demoShotLogs.map((log) => ({ ...log, teamId: resolvedTeam.id }));
  const progressSnapshots = demoProgressSnapshots.map((snapshot) => ({ ...snapshot, teamId: resolvedTeam.id }));

  return {
    teams: [resolvedTeam],
    players,
    playerProfiles,
    events,
    rsvps,
    scores,
    shotLogs,
    progressSnapshots,
    demoMeta: {
      seededAt: Date.now(),
      teamId: resolvedTeam.id,
      coachEmail,
      source: "demo-data",
    },
  };
}

export async function applyDemoData(bundle) {
  const payload = bundle || buildDemoDataBundle();
  const keys = [
    ["sl:teams", payload.teams || []],
    ["sl:players", payload.players || []],
    ["sl:player-profiles", payload.playerProfiles || []],
    ["sl:events", payload.events || []],
    ["sl:rsvps", payload.rsvps || []],
    ["sl:scores", payload.scores || []],
    ["sl:shotlogs", payload.shotLogs || []],
    ["sl:progress-snapshots", payload.progressSnapshots || []],
    ["sl:demo-data-meta", payload.demoMeta || {}],
  ];
  for (const [key, value] of keys) {
    const json = JSON.stringify(value);
    if (typeof window !== "undefined") {
      if (window.localStorage) window.localStorage.setItem(key, json);
      if (window.storage && typeof window.storage.set === "function") {
        await window.storage.set(key, json, true);
      }
    }
  }
}

export async function clearDemoData() {
  const keys = Object.values(STORAGE_KEYS);
  for (const key of keys) {
    if (typeof window !== "undefined") {
      if (key === "sl:shotlogs") {
        const stored = window.localStorage?.getItem(key);
        const rows = stored ? JSON.parse(stored) : [];
        const preserved = Array.isArray(rows) ? rows.filter((row) => !isDemoPlayerSessionShotLog(row)) : [];
        const json = JSON.stringify(preserved);
        if (window.localStorage) window.localStorage.setItem(key, json);
        if (window.storage && typeof window.storage.set === "function") {
          await window.storage.set(key, json, true);
        }
        continue;
      }
      if (window.localStorage) window.localStorage.removeItem(key);
      if (window.storage && typeof window.storage.set === "function") {
        await window.storage.set(key, JSON.stringify([]), true);
      }
    }
  }
}
