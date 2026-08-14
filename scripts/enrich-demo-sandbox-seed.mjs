import fs from "node:fs";

function replaceOnce(source, from, to, label) {
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one match, found ${count}`);
  return source.replace(from, to);
}

const path = "src/lib/demoData.js";
let source = fs.readFileSync(path, "utf8");

source = replaceOnce(source,
`  scores: "sl:scores",
  shotLogs: "sl:shotlogs",
  progressSnapshots: "sl:progress-snapshots",
  demoMeta: "sl:demo-data-meta",`,
`  scores: "sl:scores",
  programScores: "sl:program-scores",
  shotLogs: "sl:shotlogs",
  challenges: "sl:challenges",
  scSessions: "sl:sc-sessions",
  scRsvps: "sl:sc-rsvps",
  scLogs: "sl:sc-logs",
  coachPriorities: "sl:coach-priorities",
  progressSnapshots: "sl:progress-snapshots",
  demoMeta: "sl:demo-data-meta",`,
"storage keys");

source = replaceOnce(source,
`function clone(value) {`,
`const demoProgramScores = [
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

function clone(value) {`,
"supplemental demo dataset");

source = replaceOnce(source,
`  const scores = demoPrimaryScores.map((score) => ({ ...score, teamId: resolvedTeam.id, playerId: score.playerId || score.email }));
  const shotLogs = demoShotLogs.map((log) => ({ ...log, teamId: resolvedTeam.id }));
  const progressSnapshots = demoProgressSnapshots.map((snapshot) => ({ ...snapshot, teamId: resolvedTeam.id }));`,
`  const scores = demoPrimaryScores.map((score) => ({ ...score, teamId: resolvedTeam.id, playerId: score.playerId || score.email }));
  const programScores = demoProgramScores.map((score) => ({ ...score, teamId: resolvedTeam.id, playerId: score.playerId || score.email }));
  const shotLogs = demoShotLogs.map((log) => ({ ...log, teamId: resolvedTeam.id }));
  const challenges = demoChallenges.map((challenge) => ({ ...challenge, teamId: resolvedTeam.id }));
  const scSessions = demoScSessions.map((session) => ({ ...session, teamId: resolvedTeam.id, ownerCoachId: coachEmail || "coach.demo@shotlab.app" }));
  const scRsvps = demoScRsvps.map((rsvp) => ({ ...rsvp, teamId: resolvedTeam.id }));
  const scLogs = demoScLogs.map((log) => ({ ...log, teamId: resolvedTeam.id }));
  const coachPriorities = { ...demoCoachPriorities, updatedAt: new Date().toISOString() };
  const progressSnapshots = demoProgressSnapshots.map((snapshot) => ({ ...snapshot, teamId: resolvedTeam.id }));`,
"bundle mappings");

source = replaceOnce(source,
`    scores,
    shotLogs,
    progressSnapshots,`,
`    scores,
    programScores,
    shotLogs,
    challenges,
    scSessions,
    scRsvps,
    scLogs,
    coachPriorities,
    progressSnapshots,`,
"bundle return fields");

source = replaceOnce(source,
`    ["sl:scores", payload.scores || []],
    ["sl:shotlogs", payload.shotLogs || []],
    ["sl:progress-snapshots", payload.progressSnapshots || []],`,
`    ["sl:scores", payload.scores || []],
    ["sl:program-scores", payload.programScores || []],
    ["sl:shotlogs", payload.shotLogs || []],
    ["sl:challenges", payload.challenges || []],
    ["sl:sc-sessions", payload.scSessions || []],
    ["sl:sc-rsvps", payload.scRsvps || []],
    ["sl:sc-logs", payload.scLogs || []],
    ["sl:progress-snapshots", payload.progressSnapshots || []],`,
"apply collections");

source = replaceOnce(source,
`  }
  await writeStored("sl:demo-data-meta", payload.demoMeta || {});
}`,
`  }
  const existingPriorities = await readStored(STORAGE_KEYS.coachPriorities, {});
  const priorityMap = existingPriorities && typeof existingPriorities === "object" && !Array.isArray(existingPriorities) ? existingPriorities : {};
  await writeStored(STORAGE_KEYS.coachPriorities, { ...priorityMap, [teamId]: payload.coachPriorities || demoCoachPriorities });
  await writeStored("sl:demo-data-meta", payload.demoMeta || {});
}`,
"apply priorities");

source = replaceOnce(source,
`    [STORAGE_KEYS.scores],
    [STORAGE_KEYS.shotLogs],
    [STORAGE_KEYS.progressSnapshots],`,
`    [STORAGE_KEYS.scores],
    [STORAGE_KEYS.programScores],
    [STORAGE_KEYS.shotLogs],
    [STORAGE_KEYS.challenges],
    [STORAGE_KEYS.scSessions],
    [STORAGE_KEYS.scRsvps],
    [STORAGE_KEYS.scLogs],
    [STORAGE_KEYS.progressSnapshots],`,
"clear collections");

source = replaceOnce(source,
`  await writeStored(STORAGE_KEYS.demoMeta, {});`,
`  const priorities = await readStored(STORAGE_KEYS.coachPriorities, {});
  if (priorities && typeof priorities === "object" && !Array.isArray(priorities)) {
    const nextPriorities = { ...priorities };
    delete nextPriorities[teamId];
    await writeStored(STORAGE_KEYS.coachPriorities, nextPriorities);
  }
  await writeStored(STORAGE_KEYS.demoMeta, {});`,
"clear priorities");

fs.writeFileSync(path, source);
console.log("Enriched demo sandbox seed with production-visible program, strength, challenge, and priority data.");
