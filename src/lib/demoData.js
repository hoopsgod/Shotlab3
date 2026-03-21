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
  { id: "event-demo-january-open-gym", teamId: DEMO_TEAM_ID, title: "January Open Gym", date: "2026-01-18", time: "5:30 PM", location: "Main Gym", desc: "Team shooting and finishing reps.", type: "workout" },
  { id: "event-demo-february-skills-clinic", teamId: DEMO_TEAM_ID, title: "February Skills Clinic", date: "2026-02-07", time: "9:00 AM", location: "Aux Gym", desc: "Ball-screen reads and finishing counters.", type: "clinic" },
  { id: "event-demo-february-recovery-lab", teamId: DEMO_TEAM_ID, title: "Recovery Lab", date: "2026-02-21", time: "11:15 AM", location: "Training Room", desc: "Recovery-focused mobility session.", type: "recovery" },
  { id: "evt-upcoming-1", teamId: DEMO_TEAM_ID, title: "Gym Session", date: "2026-03-25", time: "10:00 AM", location: "Main Gym", type: "workout" },
  { id: "event-demo-skill-lab", teamId: DEMO_TEAM_ID, title: "Skill Lab: Finishing Reads", date: "2026-03-27", time: "6:15 PM", location: "Main Gym Court 2", desc: "Guard-footwork and rim-finishing session.", type: "workout" },
  { id: "event-demo-shooting-club", teamId: DEMO_TEAM_ID, title: "Morning Shooting Club", date: "2026-03-29", time: "6:30 AM", location: "Aux Gym", desc: "High-volume catch-and-shoot reps.", type: "shooting" },
  { id: "event-demo-film-room", teamId: DEMO_TEAM_ID, title: "Film Room + Recovery", date: "2026-04-01", time: "4:45 PM", location: "Team Room", desc: "Scout-film review and mobility work.", type: "recovery" },
];

const baseRsvps = baseEvents.slice(0, 6).map((event, index) => ({
  id: "rsvp-demo-00" + (index + 1),
  email: "demo@shotlab.app",
  playerId: "demo@shotlab.app",
  name: "Demo Player",
  eventId: event.id,
  teamId: DEMO_TEAM_ID,
  attended: true,
  ts: DEMO_TIMESTAMP + index,
}));

const demoPrimaryScores = [
  { id: "score-dp-s01", email: "demo@shotlab.app", name: "Demo Player", teamId: DEMO_TEAM_ID, drillId: "demo-home-warm-up-shooting-4-minute", score: 9, date: "2026-03-20", ts: Date.parse("2026-03-20T18:00:00.000Z"), src: "home" },
  { id: "score-dp-s02", email: "demo@shotlab.app", name: "Demo Player", teamId: DEMO_TEAM_ID, drillId: "demo-form-shooting", score: 22, date: "2026-03-19", ts: Date.parse("2026-03-19T18:00:00.000Z"), src: "home" },
  { id: "score-dp-s03", email: "ava.brooks@demo.shotlab.app", name: "Ava Brooks", teamId: DEMO_TEAM_ID, drillId: "demo-home-warm-up-shooting-4-minute", score: 11, date: "2026-03-20", ts: Date.parse("2026-03-20T18:05:00.000Z"), src: "home" },
  { id: "score-dp-s04", email: "jordan.lee@demo.shotlab.app", name: "Jordan Lee", teamId: DEMO_TEAM_ID, drillId: "demo-home-warm-up-shooting-4-minute", score: 10, date: "2026-03-20", ts: Date.parse("2026-03-20T18:10:00.000Z"), src: "home" },
];

const demoShotLogs = [
  { id: "shotlog-demo-01", email: "demo@shotlab.app", playerId: "demo@shotlab.app", teamId: DEMO_TEAM_ID, name: "Demo Player", made: 125, date: "2026-03-20", ts: Date.parse("2026-03-20T19:00:00.000Z") },
  { id: "shotlog-demo-02", email: "ava.brooks@demo.shotlab.app", playerId: "ava.brooks@demo.shotlab.app", teamId: DEMO_TEAM_ID, name: "Ava Brooks", made: 160, date: "2026-03-20", ts: Date.parse("2026-03-20T19:05:00.000Z") },
];

const demoProgressSnapshots = [
  { id: "progress-demo-01", email: "demo@shotlab.app", playerId: "demo@shotlab.app", teamId: DEMO_TEAM_ID, label: "Weekly shots", value: 125, date: "2026-03-20", ts: Date.parse("2026-03-20T19:10:00.000Z") },
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
  const players = basePlayers.map((player) => ({ ...player, teamId: resolvedTeam.id }));
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
  if (typeof window === "undefined" || !window.localStorage) return;

  const payload = bundle || buildDemoDataBundle();
  window.localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(payload.teams || []));
  window.localStorage.setItem(STORAGE_KEYS.players, JSON.stringify(payload.players || []));
  window.localStorage.setItem(STORAGE_KEYS.playerProfiles, JSON.stringify(payload.playerProfiles || []));
  window.localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(payload.events || []));
  window.localStorage.setItem(STORAGE_KEYS.rsvps, JSON.stringify(payload.rsvps || []));
  window.localStorage.setItem(STORAGE_KEYS.scores, JSON.stringify(payload.scores || []));
  window.localStorage.setItem(STORAGE_KEYS.shotLogs, JSON.stringify(payload.shotLogs || []));
  window.localStorage.setItem(STORAGE_KEYS.progressSnapshots, JSON.stringify(payload.progressSnapshots || []));
  window.localStorage.setItem(STORAGE_KEYS.demoMeta, JSON.stringify(payload.demoMeta || {}));
}

export async function clearDemoData() {
  if (typeof window === "undefined" || !window.localStorage) return;
  Object.values(STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key));
}
