const STORAGE_KEYS = Object.freeze({
teams: “sl:teams”,
players: “sl:players”,
playerProfiles: “sl:player-profiles”,
events: “sl:events”,
rsvps: “sl:rsvps”,
scores: “sl:scores”,
shotLogs: “sl:shotlogs”,
progressSnapshots: “sl:progress-snapshots”,
demoMeta: “sl:demo-data-meta”,
});

const DEMO_TEAM_ID = “team-demo-titans”;
const DEMO_TIMESTAMP = Date.parse(“2026-03-20T12:00:00.000Z”);

const basePlayers = [
{
id: “player-demo-ava-brooks”,
email: “ava.brooks@demo.shotlab.app”,
name: “Ava Brooks”,
role: “player”,
teamId: DEMO_TEAM_ID,
hideFromLeaderboards: false,
createdAt: DEMO_TIMESTAMP,
},
{
id: “player-demo-jordan-lee”,
email: “jordan.lee@demo.shotlab.app”,
name: “Jordan Lee”,
role: “player”,
teamId: DEMO_TEAM_ID,
hideFromLeaderboards: false,
createdAt: DEMO_TIMESTAMP + 1,
},
{
id: “player-demo-micah-santos”,
email: “micah.santos@demo.shotlab.app”,
name: “Micah Santos”,
role: “player”,
teamId: DEMO_TEAM_ID,
hideFromLeaderboards: false,
createdAt: DEMO_TIMESTAMP + 2,
},
{
id: “player-demo-primary”,
email: “demo@shotlab.app”,
name: “Demo Player”,
role: “player”,
teamId: DEMO_TEAM_ID,
hideFromLeaderboards: false,
createdAt: DEMO_TIMESTAMP + 3,
},
];

const basePlayerProfiles = [
{
id: “profile-demo-ava-brooks”,
userId: “ava.brooks@demo.shotlab.app”,
teamId: DEMO_TEAM_ID,
firstName: “Ava”,
lastName: “Brooks”,
jerseyNumber: “3”,
createdAt: DEMO_TIMESTAMP,
},
{
id: “profile-demo-jordan-lee”,
userId: “jordan.lee@demo.shotlab.app”,
teamId: DEMO_TEAM_ID,
firstName: “Jordan”,
lastName: “Lee”,
jerseyNumber: “11”,
createdAt: DEMO_TIMESTAMP + 1,
},
{
id: “profile-demo-micah-santos”,
userId: “micah.santos@demo.shotlab.app”,
teamId: DEMO_TEAM_ID,
firstName: “Micah”,
lastName: “Santos”,
jerseyNumber: “24”,
createdAt: DEMO_TIMESTAMP + 2,
},
{
id: “profile-demo-primary”,
userId: “demo@shotlab.app”,
teamId: DEMO_TEAM_ID,
firstName: “Demo”,
lastName: “Player”,
jerseyNumber: “0”,
createdAt: DEMO_TIMESTAMP + 3,
},
];

const baseEvents = [
{
id: “event-demo-january-open-gym”,
teamId: DEMO_TEAM_ID,
title: “January Open Gym”,
date: “2026-01-18”,
time: “5:30 PM”,
location: “Main Gym”,
desc: “Team shooting and finishing reps with light scrimmage segments.”,
type: “workout”,
},
{
id: “event-demo-february-skills-clinic”,
teamId: DEMO_TEAM_ID,
title: “February Skills Clinic”,
date: “2026-02-07”,
time: “9:00 AM”,
location: “Aux Gym”,
desc: “Ball-screen reads, finishing counters, and guided partner work.”,
type: “clinic”,
},
{
id: “event-demo-february-recovery-lab”,
teamId: DEMO_TEAM_ID,
title: “Recovery Lab”,
date: “2026-02-21”,
time: “11:15 AM”,
location: “Training Room”,
desc: “Recovery-focused mobility session with coach-led tissue work stations.”,
type: “recovery”,
},
{
id: “evt-upcoming-1”,
teamId: DEMO_TEAM_ID,
title: “Gym Session”,
date: “2026-03-25”,
time: “10:00 AM”,
location: “Main Gym”,
type: “workout”,
},
{
id: “event-demo-skill-lab”,
teamId: DEMO_TEAM_ID,
title: “Skill Lab: Finishing Reads”,
date: “2026-03-27”,
time: “6:15 PM”,
location: “Main Gym — Court 2”,
desc: “Guard-footwork and rim-finishing session with live decision reads.”,
type: “workout”,
},
{
id: “event-demo-shooting-club”,
teamId: DEMO_TEAM_ID,
title: “Morning Shooting Club”,
date: “2026-03-29”,
time: “6:30 AM”,
location: “Aux Gym — Gun 1”,
desc: “High-volume catch-and-shoot reps before school with tracking stations.”,
type: “shooting”,
},
{
id: “event-demo-film-room”,
teamId: DEMO_TEAM_ID,
title: “Film Room + Recovery”,
date: “2026-04-01”,
time: “4:45 PM”,
location: “Team Room”,
desc: “Short scout-film review followed by guided mobility and recovery work.”,
type: “recovery”,
},
];

// RSVPs: Demo Player attended the first 6 events (all past events)
const baseRsvps = baseEvents.slice(0, 6).map((event, index) => ({
id: `rsvp-demo-${String(index + 1).padStart(3, "0")}`,
email: “demo@shotlab.app”,
playerId: “demo@shotlab.app”,
name: “Demo Player”,
eventId: event.id,
teamId: DEMO_TEAM_ID,
attended: true,
ts: DEMO_TIMESTAMP + index,
}));

// ─── DEMO PLAYER SCORES ───────────────────────────────────────────────────────
//
// STREAK: 14 consecutive daily entries counting BACK from today (2026-03-20).
// ProfilePage derives bestStreak by collecting unique homeScore dates,
// sorting them, and counting consecutive-day runs. So dates must be
// sequential with no gaps, ending on or before today.
//
// Dates: 2026-03-07 → 2026-03-20 = 14 consecutive days ✓

const demoPrimaryScores = [
// ── 14-day consecutive streak (most recent drill, counts backward) ──────────
{ id: “score-dp-streak-01”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-warm-up-shooting-4-minute”, score: 9,  date: “2026-03-20”, ts: Date.parse(“2026-03-20T18:00:00.000Z”), src: “home” },
{ id: “score-dp-streak-02”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-warm-up-shooting-4-minute”, score: 8,  date: “2026-03-19”, ts: Date.parse(“2026-03-19T18:00:00.000Z”), src: “home” },
{ id: “score-dp-streak-03”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-warm-up-shooting-4-minute”, score: 10, date: “2026-03-18”, ts: Date.parse(“2026-03-18T18:00:00.000Z”), src: “home” },
{ id: “score-dp-streak-04”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-warm-up-shooting-4-minute”, score: 9,  date: “2026-03-17”, ts: Date.parse(“2026-03-17T18:00:00.000Z”), src: “home” },
{ id: “score-dp-streak-05”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-warm-up-shooting-4-minute”, score: 8,  date: “2026-03-16”, ts: Date.parse(“2026-03-16T18:00:00.000Z”), src: “home” },
{ id: “score-dp-streak-06”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-warm-up-shooting-4-minute”, score: 9,  date: “2026-03-15”, ts: Date.parse(“2026-03-15T18:00:00.000Z”), src: “home” },
{ id: “score-dp-streak-07”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-warm-up-shooting-4-minute”, score: 7,  date: “2026-03-14”, ts: Date.parse(“2026-03-14T18:00:00.000Z”), src: “home” },
{ id: “score-dp-streak-08”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-warm-up-shooting-4-minute”, score: 9,  date: “2026-03-13”, ts: Date.parse(“2026-03-13T18:00:00.000Z”), src: “home” },
{ id: “score-dp-streak-09”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-warm-up-shooting-4-minute”, score: 8,  date: “2026-03-12”, ts: Date.parse(“2026-03-12T18:00:00.000Z”), src: “home” },
{ id: “score-dp-streak-10”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-warm-up-shooting-4-minute”, score: 10, date: “2026-03-11”, ts: Date.parse(“2026-03-11T18:00:00.000Z”), src: “home” },
{ id: “score-dp-streak-11”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-warm-up-shooting-4-minute”, score: 9,  date: “2026-03-10”, ts: Date.parse(“2026-03-10T18:00:00.000Z”), src: “home” },
{ id: “score-dp-streak-12”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-warm-up-shooting-4-minute”, score: 8,  date: “2026-03-09”, ts: Date.parse(“2026-03-09T18:00:00.000Z”), src: “home” },
{ id: “score-dp-streak-13”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-warm-up-shooting-4-minute”, score: 9,  date: “2026-03-08”, ts: Date.parse(“2026-03-08T18:00:00.000Z”), src: “home” },
{ id: “score-dp-streak-14”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-warm-up-shooting-4-minute”, score: 8,  date: “2026-03-07”, ts: Date.parse(“2026-03-07T18:00:00.000Z”), src: “home” },

// ── Free throws — historical non-consecutive ────────────────────────────────
{ id: “score-dp-ft-01”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-warm-up-shooting-4-minute”, score: 10, date: “2026-03-04”, ts: Date.parse(“2026-03-04T18:00:00.000Z”), src: “home” },
{ id: “score-dp-ft-02”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-warm-up-shooting-4-minute”, score: 9,  date: “2026-02-28”, ts: Date.parse(“2026-02-28T18:00:00.000Z”), src: “home” },
{ id: “score-dp-ft-03”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-warm-up-shooting-4-minute”, score: 10, date: “2026-02-24”, ts: Date.parse(“2026-02-24T18:00:00.000Z”), src: “home” },
{ id: “score-dp-ft-04”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-warm-up-shooting-4-minute”, score: 9,  date: “2026-02-19”, ts: Date.parse(“2026-02-19T18:00:00.000Z”), src: “home” },
{ id: “score-dp-ft-05”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-warm-up-shooting-4-minute”, score: 8,  date: “2026-02-14”, ts: Date.parse(“2026-02-14T18:00:00.000Z”), src: “home” },
{ id: “score-dp-ft-06”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-warm-up-shooting-4-minute”, score: 9,  date: “2026-02-09”, ts: Date.parse(“2026-02-09T18:00:00.000Z”), src: “home” },
{ id: “score-dp-ft-07”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-warm-up-shooting-4-minute”, score: 10, date: “2026-02-03”, ts: Date.parse(“2026-02-03T18:00:00.000Z”), src: “home” },
{ id: “score-dp-ft-08”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-warm-up-shooting-4-minute”, score: 9,  date: “2026-01-27”, ts: Date.parse(“2026-01-27T18:00:00.000Z”), src: “home” },
{ id: “score-dp-ft-09”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-warm-up-shooting-4-minute”, score: 8,  date: “2026-01-21”, ts: Date.parse(“2026-01-21T18:00:00.000Z”), src: “home” },
{ id: “score-dp-ft-10”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-warm-up-shooting-4-minute”, score: 9,  date: “2026-01-14”, ts: Date.parse(“2026-01-14T18:00:00.000Z”), src: “home” },

// ── Additional drill variety ────────────────────────────────────────────────
{ id: “score-dp-cs-01”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-3-minute-shooting”,        score: 8, date: “2026-03-01”, ts: Date.parse(“2026-03-01T18:30:00.000Z”), src: “home” },
{ id: “score-dp-cs-02”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-3-minute-shooting”,        score: 9, date: “2026-02-22”, ts: Date.parse(“2026-02-22T18:30:00.000Z”), src: “home” },
{ id: “score-dp-cs-03”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-3-minute-shooting”,        score: 7, date: “2026-02-15”, ts: Date.parse(“2026-02-15T18:30:00.000Z”), src: “home” },
{ id: “score-dp-mr-01”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-calipari-shooting”,        score: 8, date: “2026-02-26”, ts: Date.parse(“2026-02-26T19:00:00.000Z”), src: “home” },
{ id: “score-dp-mr-02”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-calipari-shooting”,        score: 7, date: “2026-02-11”, ts: Date.parse(“2026-02-11T19:00:00.000Z”), src: “home” },
{ id: “score-dp-fl-01”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-47-shooting”,             score: 7, date: “2026-02-17”, ts: Date.parse(“2026-02-17T19:15:00.000Z”), src: “home” },
{ id: “score-dp-bh-01”, email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, drillId: “demo-home-buddy-hield-shooting”,    score: 8, date: “2026-02-05”, ts: Date.parse(“2026-02-05T19:15:00.000Z”), src: “home” },
];

const baseScores = [
// ── Other players (unchanged) ───────────────────────────────────────────────
{ id: “score-demo-001”, email: “ava.brooks@demo.shotlab.app”,   name: “Ava Brooks”,    teamId: DEMO_TEAM_ID, drillId: “demo-home-warm-up-shooting-4-minute”,    score: 47, date: “2026-03-10”, ts: Date.parse(“2026-03-10T18:20:00.000Z”), src: “home” },
{ id: “score-demo-002”, email: “ava.brooks@demo.shotlab.app”,   name: “Ava Brooks”,    teamId: DEMO_TEAM_ID, drillId: “demo-home-3-minute-shooting”,             score: 39, date: “2026-03-12”, ts: Date.parse(“2026-03-12T18:24:00.000Z”), src: “home” },
{ id: “score-demo-003”, email: “ava.brooks@demo.shotlab.app”,   name: “Ava Brooks”,    teamId: DEMO_TEAM_ID, drillId: “demo-program-230s”,                       score: 44, date: “2026-03-14”, ts: Date.parse(“2026-03-14T18:28:00.000Z”), src: “program” },
{ id: “score-demo-004”, email: “ava.brooks@demo.shotlab.app”,   name: “Ava Brooks”,    teamId: DEMO_TEAM_ID, drillId: “demo-program-buddy-hield-shooting”,       score: 61, date: “2026-03-18”, ts: Date.parse(“2026-03-18T18:36:00.000Z”), src: “program” },
{ id: “score-demo-005”, email: “jordan.lee@demo.shotlab.app”,   name: “Jordan Lee”,    teamId: DEMO_TEAM_ID, drillId: “demo-home-calipari-shooting”,             score: 23, date: “2026-03-11”, ts: Date.parse(“2026-03-11T19:05:00.000Z”), src: “home” },
{ id: “score-demo-006”, email: “jordan.lee@demo.shotlab.app”,   name: “Jordan Lee”,    teamId: DEMO_TEAM_ID, drillId: “demo-home-47-shooting”,                  score: 17, date: “2026-03-13”, ts: Date.parse(“2026-03-13T19:18:00.000Z”), src: “home” },
{ id: “score-demo-007”, email: “jordan.lee@demo.shotlab.app”,   name: “Jordan Lee”,    teamId: DEMO_TEAM_ID, drillId: “demo-program-warm-up-shooting-4-minute”,  score: 42, date: “2026-03-15”, ts: Date.parse(“2026-03-15T19:14:00.000Z”), src: “program” },
{ id: “score-demo-008”, email: “jordan.lee@demo.shotlab.app”,   name: “Jordan Lee”,    teamId: DEMO_TEAM_ID, drillId: “demo-program-make-20”,                   score: 28, date: “2026-03-19”, ts: Date.parse(“2026-03-19T19:32:00.000Z”), src: “program” },
{ id: “score-demo-009”, email: “micah.santos@demo.shotlab.app”, name: “Micah Santos”,  teamId: DEMO_TEAM_ID, drillId: “demo-home-buddy-hield-shooting”,         score: 58, date: “2026-03-09”, ts: Date.parse(“2026-03-09T17:58:00.000Z”), src: “home” },
{ id: “score-demo-010”, email: “micah.santos@demo.shotlab.app”, name: “Micah Santos”,  teamId: DEMO_TEAM_ID, drillId: “demo-home-230s”,                         score: 36, date: “2026-03-12”, ts: Date.parse(“2026-03-12T18:42:00.000Z”), src: “home” },
{ id: “score-demo-011”, email: “micah.santos@demo.shotlab.app”, name: “Micah Santos”,  teamId: DEMO_TEAM_ID, drillId: “demo-program-calipari-shooting”,         score: 25, date: “2026-03-16”, ts: Date.parse(“2026-03-16T18:08:00.000Z”), src: “program” },
{ id: “score-demo-012”, email: “micah.santos@demo.shotlab.app”, name: “Micah Santos”,  teamId: DEMO_TEAM_ID, drillId: “demo-program-3-minute-shooting”,         score: 35, date: “2026-03-18”, ts: Date.parse(“2026-03-18T18:18:00.000Z”), src: “program” },

// ── Demo Player scores (drives totalMakes, bestStreak, drillStats) ──────────
…demoPrimaryScores,
];

const baseShotLogs = [
{ id: “shotlog-demo-ava-week-1”,     email: “ava.brooks@demo.shotlab.app”,   teamId: DEMO_TEAM_ID, made: 182, date: “2026-03-09”, ts: Date.parse(“2026-03-09T20:00:00.000Z”) },
{ id: “shotlog-demo-jordan-week-1”,  email: “jordan.lee@demo.shotlab.app”,   teamId: DEMO_TEAM_ID, made: 156, date: “2026-03-12”, ts: Date.parse(“2026-03-12T20:00:00.000Z”) },
{ id: “shotlog-demo-micah-week-1”,   email: “micah.santos@demo.shotlab.app”, teamId: DEMO_TEAM_ID, made: 204, date: “2026-03-15”, ts: Date.parse(“2026-03-15T20:00:00.000Z”) },
{ id: “shotlog-demo-player-week-1”,  email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, made: 167, date: “2026-03-10”, ts: Date.parse(“2026-03-10T20:00:00.000Z”) },
{ id: “shotlog-demo-player-week-2”,  email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, made: 198, date: “2026-03-17”, ts: Date.parse(“2026-03-17T20:00:00.000Z”) },
{ id: “shotlog-demo-player-today”,   email: “demo@shotlab.app”, name: “Demo Player”, teamId: DEMO_TEAM_ID, made: 143, date: “2026-03-20”, ts: Date.parse(“2026-03-20T20:00:00.000Z”) },
];

const baseProgressSnapshots = [
{
id: “progress-demo-week-10”,
teamId: DEMO_TEAM_ID,
capturedAt: “2026-03-10T21:00:00.000Z”,
label: “Week 10 performance snapshot”,
metrics: {
scoringSessionsLogged: 8,
averageProgramScore: 39.2,
weeklyShotVolume: 542,
attendanceRate: 0.89,
},
},
{
id: “progress-demo-week-11”,
teamId: DEMO_TEAM_ID,
capturedAt: “2026-03-17T21:00:00.000Z”,
label: “Week 11 performance snapshot”,
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
name: “Demo Titans”,
school: “Shotlab Academy”,
level: “Varsity”,
joinCode: “TITAN23”,
createdBy: “coach.demo@shotlab.app”,
createdAt: DEMO_TIMESTAMP,
},
],
players: basePlayers,
playerProfiles: basePlayerProfiles,
events: baseEvents,
rsvps: baseRsvps,
scores: baseScores,
shotLogs: baseShotLogs,
progressSnapshots: baseProgressSnapshots,
meta: {
teamId: DEMO_TEAM_ID,
seededAt: “2026-03-20T12:00:00.000Z”,
playerCount: basePlayers.length,
eventCount: baseEvents.length,
rsvpCount: baseRsvps.length,
scoreCount: baseScores.length,
snapshotCount: baseProgressSnapshots.length,
},
});

function remapCollectionTeamId(items, nextTeamId) {
return (items || []).map((item) => ({ …item, teamId: nextTeamId }));
}

export function buildDemoDataBundle(overrides = {}) {
const nextTeamId = overrides.teamId || DEMO_TEAM_ID;
const nextCoachEmail =
overrides.coachEmail ||
DEMO_DATA_BUNDLE.teams?.[0]?.createdBy ||
“coach.demo@shotlab.app”;
const existingTeam = overrides.team || {};
const teamSeed = DEMO_DATA_BUNDLE.teams?.[0] || {};

return clone({
…DEMO_DATA_BUNDLE,
teams: [
{
…teamSeed,
…existingTeam,
id: nextTeamId,
createdBy: nextCoachEmail,
},
],
players:           remapCollectionTeamId(DEMO_DATA_BUNDLE.players, nextTeamId),
playerProfiles:    remapCollectionTeamId(DEMO_DATA_BUNDLE.playerProfiles, nextTeamId),
events:            remapCollectionTeamId(DEMO_DATA_BUNDLE.events, nextTeamId),
rsvps:             remapCollectionTeamId(DEMO_DATA_BUNDLE.rsvps, nextTeamId),
scores:            remapCollectionTeamId(DEMO_DATA_BUNDLE.scores, nextTeamId),
shotLogs:          remapCollectionTeamId(DEMO_DATA_BUNDLE.shotLogs, nextTeamId),
progressSnapshots: remapCollectionTeamId(DEMO_DATA_BUNDLE.progressSnapshots, nextTeamId),
meta: {
…DEMO_DATA_BUNDLE.meta,
teamId: nextTeamId,
seededForCoach: nextCoachEmail,
},
});
}

function clone(value) {
return JSON.parse(JSON.stringify(value));
}

async function writeStorage(key, value) {
if (typeof window === “undefined” || !window.storage?.set) {
throw new Error(“Persistent storage is unavailable in this environment.”);
}
await window.storage.set(key, JSON.stringify(value), true);
}

async function readStorage(key) {
if (typeof window === “undefined” || !window.storage?.get) {
throw new Error(“Persistent storage is unavailable in this environment.”);
}
const stored = await window.storage.get(key, true);
if (!stored?.value) return null;
try {
const parsed = JSON.parse(stored.value);
// Guard against “null” string written by old clearDemoData
return parsed === null ? null : parsed;
} catch {
return null;
}
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
existingRsvps,
existingScores,
existingShotLogs,
existingProgressSnapshots,
] = await Promise.all([
readStorage(STORAGE_KEYS.teams),
readStorage(STORAGE_KEYS.players),
readStorage(STORAGE_KEYS.playerProfiles),
readStorage(STORAGE_KEYS.events),
readStorage(STORAGE_KEYS.rsvps),
readStorage(STORAGE_KEYS.scores),
readStorage(STORAGE_KEYS.shotLogs),
readStorage(STORAGE_KEYS.progressSnapshots),
]);

await Promise.all([
writeStorage(STORAGE_KEYS.teams,             mergeById(existingTeams,             nextBundle.teams             || [])),
writeStorage(STORAGE_KEYS.players,           mergeById(existingPlayers,           nextBundle.players           || [])),
writeStorage(STORAGE_KEYS.playerProfiles,    mergeById(existingPlayerProfiles,    nextBundle.playerProfiles    || [])),
writeStorage(STORAGE_KEYS.events,            mergeById(existingEvents,            nextBundle.events            || [])),
writeStorage(STORAGE_KEYS.rsvps,             mergeById(existingRsvps,             nextBundle.rsvps             || [])),
writeStorage(STORAGE_KEYS.scores,            mergeById(existingScores,            nextBundle.scores            || [])),
writeStorage(STORAGE_KEYS.shotLogs,          mergeById(existingShotLogs,          nextBundle.shotLogs          || [])),
writeStorage(STORAGE_KEYS.progressSnapshots, mergeById(existingProgressSnapshots, nextBundle.progressSnapshots || [])),
writeStorage(STORAGE_KEYS.demoMeta,          nextBundle.meta || {}),
]);

return nextBundle;
}

// FIX: Write empty arrays (not null) so readStorage + mergeById always
// receive a valid array on the next LOAD DEMO DATA call.
export async function clearDemoData() {
await Promise.all([
writeStorage(STORAGE_KEYS.teams,             []),
writeStorage(STORAGE_KEYS.players,           []),
writeStorage(STORAGE_KEYS.playerProfiles,    []),
writeStorage(STORAGE_KEYS.events,            []),
writeStorage(STORAGE_KEYS.rsvps,             []),
writeStorage(STORAGE_KEYS.scores,            []),
writeStorage(STORAGE_KEYS.shotLogs,          []),
writeStorage(STORAGE_KEYS.progressSnapshots, []),
writeStorage(STORAGE_KEYS.demoMeta,          {}),
]);
}