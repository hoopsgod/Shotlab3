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
const DEMO_DATA_VERSION = 4;
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

// A complete boys basketball roster for the public demo. Every athlete has enough
// activity to populate Coach Home, Players, Leaderboards, Events, Progress, and S&C.
// The spread intentionally includes leaders, steady contributors, and athletes who
// need attention so the demo communicates the value of a populated ShotLab program.
const demoRoster = [
  { slug: "marcus-reed", email: "marcus.reed@demo.shotlab.app", firstName: "Marcus", lastName: "Reed", jerseyNumber: "3", position: "PG", grade: "12", weeklyMakes: 782, streakDays: 9, attendance: [true, true, true, true, true, true, true], warmup: 15, form: 24, program: [36, 40] },
  { slug: "jordan-mitchell", email: "jordan.mitchell@demo.shotlab.app", firstName: "Jordan", lastName: "Mitchell", jerseyNumber: "11", position: "SG", grade: "11", weeklyMakes: 714, streakDays: 7, attendance: [true, true, true, true, true, false, true], warmup: 14, form: 23, program: [34, 38] },
  { slug: "micah-santos", email: "micah.santos@demo.shotlab.app", firstName: "Micah", lastName: "Santos", jerseyNumber: "24", position: "SF", grade: "12", weeklyMakes: 661, streakDays: 6, attendance: [true, true, false, true, true, true, true], warmup: 13, form: 22, program: [32, 36] },
  { slug: "isaiah-brooks", email: "isaiah.brooks@demo.shotlab.app", firstName: "Isaiah", lastName: "Brooks", jerseyNumber: "5", position: "PG", grade: "10", weeklyMakes: 623, streakDays: 5, attendance: [true, true, true, true, true, true, false], warmup: 12, form: 21, program: [31, 35] },
  { slug: "cameron-hayes", email: "cameron.hayes@demo.shotlab.app", firstName: "Cameron", lastName: "Hayes", jerseyNumber: "14", position: "SG", grade: "11", weeklyMakes: 579, streakDays: 5, attendance: [true, false, true, true, true, true, true], warmup: 11, form: 20, program: [29, 34] },
  { slug: "noah-bennett", email: "noah.bennett@demo.shotlab.app", firstName: "Noah", lastName: "Bennett", jerseyNumber: "21", position: "PF", grade: "12", weeklyMakes: 531, streakDays: 4, attendance: [true, true, true, false, true, true, true], warmup: 11, form: 20, program: [28, 32] },
  { slug: "devin-walker", email: "devin.walker@demo.shotlab.app", firstName: "Devin", lastName: "Walker", jerseyNumber: "32", position: "C", grade: "11", weeklyMakes: 486, streakDays: 3, attendance: [true, true, false, true, true, false, true], warmup: 10, form: 19, program: [27, 31] },
  { slug: "miles-thompson", email: "miles.thompson@demo.shotlab.app", firstName: "Miles", lastName: "Thompson", jerseyNumber: "1", position: "G", grade: "10", weeklyMakes: 428, streakDays: 2, attendance: [true, false, true, true, false, true, true], warmup: 9, form: 18, program: [25, 29] },
  { slug: "jalen-price", email: "jalen.price@demo.shotlab.app", firstName: "Jalen", lastName: "Price", jerseyNumber: "20", position: "F", grade: "10", weeklyMakes: 371, streakDays: 2, attendance: [true, true, false, false, true, true, false], warmup: 8, form: 17, program: [24, 27] },
  { slug: "caleb-foster", email: "caleb.foster@demo.shotlab.app", firstName: "Caleb", lastName: "Foster", jerseyNumber: "23", position: "F", grade: "9", weeklyMakes: 304, streakDays: 1, attendance: [true, false, true, false, true, false, true], warmup: 7, form: 16, program: [22, 25] },
  { slug: "andre-lewis", email: "andre.lewis@demo.shotlab.app", firstName: "Andre", lastName: "Lewis", jerseyNumber: "34", position: "C", grade: "9", weeklyMakes: 218, streakDays: 0, attendance: [false, true, false, true, false, false, true], warmup: 6, form: 15, program: [20, 23] },
  { slug: "primary", email: "demo@shotlab.app", firstName: "Taylor", lastName: "Morgan", jerseyNumber: "12", position: "G", grade: "11", weeklyMakes: 552, streakDays: 4, attendance: [true, true, true, true, false, true, true], warmup: 11, form: 20, program: [29, 33], primary: true },
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
  email: player.email,
  teamId: DEMO_TEAM_ID,
  firstName: player.firstName,
  lastName: player.lastName,
  jerseyNumber: player.jerseyNumber,
  position: player.position,
  grade: player.grade,
  createdAt: DEMO_TIMESTAMP + index,
}));

const baseEvents = [
  { id: "event-demo-open-gym", teamId: DEMO_TEAM_ID, title: "Open Gym + Competitive Shooting", date: relativeDate(-24), time: "5:30 PM", location: "Main Gym", desc: "Competitive shooting, advantage games, and live five-on-five.", type: "workout" },
  { id: "event-demo-advantage-reads", teamId: DEMO_TEAM_ID, title: "Advantage Reads Lab", date: relativeDate(-16), time: "6:00 PM", location: "Aux Gym", desc: "Ball-screen reads, two-dribble counters, and weak-side decisions.", type: "clinic" },
  { id: "event-demo-team-practice-past", teamId: DEMO_TEAM_ID, title: "Team Practice", date: relativeDate(-9), time: "6:15 PM", location: "Main Gym", desc: "Transition standards, half-court execution, and competitive shooting.", type: "practice" },
  { id: "event-demo-lift-past", teamId: DEMO_TEAM_ID, title: "Team Lift + Recovery", date: relativeDate(-4), time: "6:30 AM", location: "Weight Room", desc: "Lower-body strength, landing quality, and recovery work.", type: "strength" },
  { id: "evt-upcoming-1", teamId: DEMO_TEAM_ID, title: "Team Practice", date: relativeDate(1), time: "6:00 PM", location: "Main Gym", desc: "Team shooting standards, transition decisions, and controlled five-on-five.", type: "practice" },
  { id: "event-demo-skill-lab", teamId: DEMO_TEAM_ID, title: "Skill Lab: Rim Pressure", date: relativeDate(3), time: "6:15 PM", location: "Main Gym Court 2", desc: "Paint-touch creation, contact finishes, and late-clock reads.", type: "workout" },
  { id: "event-demo-shooting-club", teamId: DEMO_TEAM_ID, title: "Early Work 300", date: relativeDate(5), time: "6:30 AM", location: "Aux Gym", desc: "High-volume catch-and-shoot and relocation threes before school.", type: "shooting" },
  { id: "event-demo-film-room", teamId: DEMO_TEAM_ID, title: "Film + Recovery Reset", date: relativeDate(7), time: "4:45 PM", location: "Team Room", desc: "Possession review, spacing corrections, and recovery circuit.", type: "recovery" },
  { id: "event-demo-scrimmage", teamId: DEMO_TEAM_ID, title: "Blue / White Scrimmage", date: relativeDate(10), time: "10:00 AM", location: "Main Gym", desc: "Controlled scrimmage with shot-quality and transition benchmarks.", type: "game" },
];

const baseRsvps = baseEvents.slice(0, 7).flatMap((event, eventIndex) => demoRoster.map((player, playerIndex) => ({
  id: `rsvp-demo-${eventIndex + 1}-${player.slug}`,
  email: player.email,
  playerId: player.email,
  name: playerName(player),
  eventId: event.id,
  teamId: DEMO_TEAM_ID,
  attended: Boolean(player.attendance[eventIndex]),
  status: player.attendance[eventIndex] ? "going" : "not-going",
  ts: relativeTimestamp(eventIndex - 6, 16, playerIndex * 2),
})));

const demoPrimaryScores = demoRoster.flatMap((player, index) => [
  { id: `score-${player.slug}-warmup-current`, email: player.email, playerId: player.email, name: playerName(player), teamId: DEMO_TEAM_ID, drillId: "demo-home-warm-up-shooting-4-minute", drillName: "4-Minute Warm-Up Shooting", score: player.warmup, date: relativeDate(index % 3 === 0 ? 0 : -1), ts: relativeTimestamp(index % 3 === 0 ? 0 : -1, 18, index * 2), src: "home" },
  { id: `score-${player.slug}-form-current`, email: player.email, playerId: player.email, name: playerName(player), teamId: DEMO_TEAM_ID, drillId: "demo-form-shooting", drillName: "Form Shooting Ladder", score: player.form, date: relativeDate(-2 - (index % 2)), ts: relativeTimestamp(-2 - (index % 2), 18, index * 2 + 1), src: "home" },
  { id: `score-${player.slug}-warmup-prior`, email: player.email, playerId: player.email, name: playerName(player), teamId: DEMO_TEAM_ID, drillId: "demo-home-warm-up-shooting-4-minute", drillName: "4-Minute Warm-Up Shooting", score: Math.max(4, player.warmup - 2), date: relativeDate(-6 - (index % 3)), ts: relativeTimestamp(-6 - (index % 3), 18, index * 2 + 2), src: "home" },
  { id: `score-${player.slug}-ft`, email: player.email, playerId: player.email, name: playerName(player), teamId: DEMO_TEAM_ID, drillId: "demo-free-throws-20", drillName: "Pressure Free Throws", score: Math.min(20, 11 + Math.round(player.form / 3)), date: relativeDate(-4 - (index % 3)), ts: relativeTimestamp(-4 - (index % 3), 19, index), src: "home" },
]);

const demoShotLogs = demoRoster.flatMap((player, index) => {
  const dayOne = Math.round(player.weeklyMakes * 0.36);
  const dayTwo = Math.round(player.weeklyMakes * 0.27);
  const dayThree = Math.round(player.weeklyMakes * 0.21);
  const dayFour = player.weeklyMakes - dayOne - dayTwo - dayThree;
  return [
    { id: `shotlog-${player.slug}-01`, email: player.email, playerId: player.email, teamId: DEMO_TEAM_ID, name: playerName(player), made: dayOne, date: relativeDate(index % 2 === 0 ? 0 : -1), ts: relativeTimestamp(index % 2 === 0 ? 0 : -1, 19, index) },
    { id: `shotlog-${player.slug}-02`, email: player.email, playerId: player.email, teamId: DEMO_TEAM_ID, name: playerName(player), made: dayTwo, date: relativeDate(-2), ts: relativeTimestamp(-2, 19, index + 12) },
    { id: `shotlog-${player.slug}-03`, email: player.email, playerId: player.email, teamId: DEMO_TEAM_ID, name: playerName(player), made: dayThree, date: relativeDate(-4), ts: relativeTimestamp(-4, 19, index + 24) },
    { id: `shotlog-${player.slug}-04`, email: player.email, playerId: player.email, teamId: DEMO_TEAM_ID, name: playerName(player), made: dayFour, date: relativeDate(-6), ts: relativeTimestamp(-6, 19, index + 36) },
  ];
});

const demoProgressSnapshots = demoRoster.flatMap((player, index) => [
  { id: `progress-${player.slug}-makes`, email: player.email, playerId: player.email, teamId: DEMO_TEAM_ID, label: "7-day makes", value: player.weeklyMakes, date: relativeDate(0), ts: relativeTimestamp(0, 20, index) },
  { id: `progress-${player.slug}-streak`, email: player.email, playerId: player.email, teamId: DEMO_TEAM_ID, label: "Training streak", value: player.streakDays, date: relativeDate(0), ts: relativeTimestamp(0, 20, index + 15) },
  { id: `progress-${player.slug}-prior`, email: player.email, playerId: player.email, teamId: DEMO_TEAM_ID, label: "Prior 7-day makes", value: Math.max(120, player.weeklyMakes - 72 + index * 3), date: relativeDate(-7), ts: relativeTimestamp(-7, 20, index) },
]);

const demoProgramScores = demoRoster.flatMap((player, index) => [
  { id: `program-${player.slug}-01`, email: player.email, playerId: player.email, name: playerName(player), teamId: DEMO_TEAM_ID, drillId: "demo-program-230s", drillName: "2:30 Shooting", score: player.program[0], date: relativeDate(-7 - (index % 2)), ts: relativeTimestamp(-7 - (index % 2), 18, 10 + index), src: "program" },
  { id: `program-${player.slug}-02`, email: player.email, playerId: player.email, name: playerName(player), teamId: DEMO_TEAM_ID, drillId: "demo-program-230s", drillName: "2:30 Shooting", score: player.program[1], date: relativeDate(-2 - (index % 3)), ts: relativeTimestamp(-2 - (index % 3), 18, 25 + index), src: "program" },
  { id: `program-${player.slug}-03`, email: player.email, playerId: player.email, name: playerName(player), teamId: DEMO_TEAM_ID, drillId: "demo-program-corner-3s", drillName: "Corner-to-Corner 3s", score: Math.max(12, player.program[1] - 8), date: relativeDate(-5 - (index % 2)), ts: relativeTimestamp(-5 - (index % 2), 17, index), src: "program" },
]);

const demoChallenges = [
  { id: "challenge-demo-pending", teamId: DEMO_TEAM_ID, playerId: "marcus.reed@demo.shotlab.app", from: "marcus.reed@demo.shotlab.app", fromName: "Marcus Reed", to: "demo@shotlab.app", toName: "Taylor Morgan", drillId: "demo-home-warm-up-shooting-4-minute", score: 15, max: 25, status: "pending", ts: relativeTimestamp(-1, 20, 5) },
  { id: "challenge-demo-complete", teamId: DEMO_TEAM_ID, playerId: "demo@shotlab.app", from: "demo@shotlab.app", fromName: "Taylor Morgan", to: "jordan.mitchell@demo.shotlab.app", toName: "Jordan Mitchell", drillId: "demo-home-warm-up-shooting-4-minute", score: 14, respScore: 13, max: 25, status: "won", ts: relativeTimestamp(-5, 19, 10), respTs: relativeTimestamp(-4, 19, 10) },
  { id: "challenge-demo-tight", teamId: DEMO_TEAM_ID, playerId: "isaiah.brooks@demo.shotlab.app", from: "isaiah.brooks@demo.shotlab.app", fromName: "Isaiah Brooks", to: "micah.santos@demo.shotlab.app", toName: "Micah Santos", drillId: "demo-form-shooting", score: 21, respScore: 22, max: 25, status: "lost", ts: relativeTimestamp(-8, 18, 20), respTs: relativeTimestamp(-7, 18, 20) },
  { id: "challenge-demo-shootout", teamId: DEMO_TEAM_ID, playerId: "cameron.hayes@demo.shotlab.app", from: "cameron.hayes@demo.shotlab.app", fromName: "Cameron Hayes", to: "miles.thompson@demo.shotlab.app", toName: "Miles Thompson", drillId: "demo-free-throws-20", score: 18, respScore: 16, max: 20, status: "won", ts: relativeTimestamp(-3, 18, 40), respTs: relativeTimestamp(-3, 19, 10) },
];

const demoScSessions = [
  { id: "sc-demo-recovery", teamId: DEMO_TEAM_ID, title: "Recovery + Mobility", sport: "Recovery", date: relativeDate(-6), time: "6:30 AM", location: "Performance Center", desc: "Ankles, hips, trunk control, and recovery work.", sessionType: "Program" },
  { id: "sc-demo-power-past", teamId: DEMO_TEAM_ID, title: "Lower Body Power", sport: "Strength", date: relativeDate(-2), time: "6:15 AM", location: "Weight Room", desc: "Trap-bar power, split squat strength, and landing control.", sessionType: "Program" },
  { id: "sc-demo-power", teamId: DEMO_TEAM_ID, title: "Total Body Strength", sport: "Strength", date: relativeDate(2), time: "6:15 AM", location: "Weight Room", desc: "Strength, trunk control, and shoulder durability.", sessionType: "Program" },
  { id: "sc-demo-speed", teamId: DEMO_TEAM_ID, title: "Acceleration + Change of Direction", sport: "Performance", date: relativeDate(6), time: "7:00 AM", location: "Turf", desc: "First-step acceleration, deceleration, and reactive change of direction.", sessionType: "Program" },
];

const demoScRsvps = demoScSessions.flatMap((session, sessionIndex) => demoRoster.map((player, playerIndex) => ({
  id: `scrsvp-${sessionIndex}-${player.slug}`,
  sessionId: session.id,
  email: player.email,
  playerId: player.email,
  name: playerName(player),
  teamId: DEMO_TEAM_ID,
  status: player.attendance[(sessionIndex + 2) % player.attendance.length] ? "going" : "not-going",
  attended: sessionIndex < 2 ? Boolean(player.attendance[(sessionIndex + 2) % player.attendance.length]) : undefined,
  ts: relativeTimestamp(-7 + sessionIndex * 2, 12, playerIndex),
})));

const demoScLogs = demoRoster.flatMap((player, index) => [
  { id: `sclog-${player.slug}-recovery`, sessionId: "sc-demo-recovery", email: player.email, playerId: player.email, name: playerName(player), teamId: DEMO_TEAM_ID, sport: "Recovery", date: relativeDate(-6), duration: 38 + (index % 4) * 3, notes: index < 7 ? "Completed full recovery block." : "Modified recovery block." },
  ...(index < 9 ? [{ id: `sclog-${player.slug}-power`, sessionId: "sc-demo-power-past", email: player.email, playerId: player.email, name: playerName(player), teamId: DEMO_TEAM_ID, sport: "Strength", date: relativeDate(-2), duration: 46 + (index % 3) * 4, notes: "Completed programmed strength session." }] : []),
]);

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
    const merged = mergeDemoCollection(existing, incoming, { teamId, managedIdentities, ...options });
    await writeStored(key, merged);
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

// Legacy demo sessions created before the richer seed could contain a Demo Team and
// one Demo Player but no managed-data marker. App.jsx intentionally avoids overwriting
// tenant data unless that marker is present. Mark only the hard-coded demo identities
// on the explicit demo-login event, so the existing reconciliation path can safely
// replace stale one-player sandboxes with the current full roster on the same sign-in.
function installLegacyDemoMigrationMarker() {
  if (typeof window === "undefined" || typeof window.addEventListener !== "function") return;
  window.addEventListener("shotlab:demo-session-started", (event) => {
    try {
      const detail = event?.detail || {};
      const accountEmail = normalizeIdentity(detail.email);
      if (accountEmail !== "coach.demo@shotlab.app" && accountEmail !== "demo@shotlab.app") return;

      const players = parseStored(window.localStorage?.getItem(STORAGE_KEYS.players), []);
      const teams = parseStored(window.localStorage?.getItem(STORAGE_KEYS.teams), []);
      const demoPlayer = (Array.isArray(players) ? players : []).find((row) => normalizeIdentity(row?.email) === "demo@shotlab.app" && row?.teamId);
      const demoCoach = (Array.isArray(players) ? players : []).find((row) => normalizeIdentity(row?.email) === "coach.demo@shotlab.app" && row?.teamId);
      const ownedTeam = (Array.isArray(teams) ? teams : []).find((row) => normalizeIdentity(row?.ownerCoachId || row?.coachEmail) === "coach.demo@shotlab.app");
      const teamId = String(demoPlayer?.teamId || demoCoach?.teamId || ownedTeam?.id || "").trim();
      if (!teamId) return;

      const meta = {
        seededAt: Date.now(),
        teamId,
        coachEmail: "coach.demo@shotlab.app",
        source: "demo-data",
        version: DEMO_DATA_VERSION,
        migration: "legacy-demo-session",
      };
      const json = JSON.stringify(meta);
      window.localStorage?.setItem(STORAGE_KEYS.demoMeta, json);
      if (window.storage && typeof window.storage.set === "function") {
        Promise.resolve(window.storage.set(STORAGE_KEYS.demoMeta, json, true)).catch(() => {});
      }
    } catch {}
  });
}

installLegacyDemoMigrationMarker();
