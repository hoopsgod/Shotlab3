import test from "node:test";
import assert from "node:assert/strict";
import { applyDemoData, buildDemoDataBundle, clearDemoData } from "../src/lib/demoData.js";

class MemoryStorage {
  constructor(seed = {}) { this.values = new Map(Object.entries(seed)); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
  clear() { this.values.clear(); }
  key(index) { return [...this.values.keys()][index] ?? null; }
  get length() { return this.values.size; }
}

const stored = (storage, key, fallback = []) => JSON.parse(storage.getItem(key) || JSON.stringify(fallback));
const rows = (storage, key) => stored(storage, key, []);

async function withBrowserStorage(seed, run) {
  const localStorage = new MemoryStorage(Object.fromEntries(Object.entries(seed).map(([key, value]) => [key, JSON.stringify(value)])));
  const managed = new Map();
  const priorWindow = globalThis.window;
  globalThis.window = {
    localStorage,
    storage: {
      async get(key) { return managed.has(key) ? { value: managed.get(key) } : null; },
      async set(key, value) { managed.set(key, value); },
    },
  };
  try {
    await run(localStorage);
  } finally {
    if (priorWindow === undefined) delete globalThis.window;
    else globalThis.window = priorWindow;
  }
}

test("demo bundle populates the real product surfaces with one coherent sandbox team", () => {
  const bundle = buildDemoDataBundle({ coachEmail: "coach.demo@shotlab.app" });
  const teamId = bundle.demoMeta.teamId;
  assert.equal(teamId, "team-demo-titans");
  assert.equal(bundle.players.filter((row) => row.role === "player").length, 12, "full player roster expected");
  assert.equal(bundle.events.length, 9, "dense recent and upcoming schedule expected");
  assert.ok(bundle.rsvps.length >= 60, "team-wide attendance/RSVP data expected");
  assert.ok(bundle.scores.length >= 24, "at-home activity expected across the roster");
  assert.ok(bundle.programScores.length >= 24, "program training results expected across the roster");
  assert.ok(bundle.shotLogs.length >= 36, "shooting activity expected across the roster");
  assert.ok(bundle.challenges.length >= 1, "commitment/duel activity expected");
  assert.ok(bundle.scSessions.length >= 2, "strength and conditioning schedule expected");
  assert.ok(bundle.scRsvps.length >= 12, "strength attendance expected across the roster");
  assert.deepEqual(bundle.scLogs, [], "redundant demo S&C completion logs stay omitted from startup payload");
  assert.ok(bundle.progressSnapshots.length >= 12, "progress snapshots expected across the roster");
  assert.ok(bundle.coachPriorities?.todayFocusText, "coach priorities expected");
  for (const collection of [bundle.players, bundle.events, bundle.rsvps, bundle.scores, bundle.programScores, bundle.shotLogs, bundle.challenges, bundle.scSessions, bundle.scRsvps, bundle.progressSnapshots]) {
    assert.ok(collection.every((row) => row.teamId === teamId), "every seeded row must remain explicitly tenant-scoped");
  }
});

test("demo reset replaces only demo-owned rows and preserves another tenant across every seeded collection", async () => {
  const realTeam = { id: "team-real-1", name: "Real Team" };
  const realPlayer = { id: "player-real-1", email: "real.player@example.com", teamId: realTeam.id };
  const realEvent = { id: "event-real-1", title: "Real Practice", teamId: realTeam.id };
  const realScore = { id: "score-real-1", email: realPlayer.email, teamId: realTeam.id, score: 17 };
  const realProgramScore = { id: "program-real-1", email: realPlayer.email, playerId: realPlayer.email, teamId: realTeam.id, drillId: "program-real", score: 21 };
  const realShot = { id: "shot-real-1", email: realPlayer.email, teamId: realTeam.id, made: 88 };
  const realChallenge = { id: "challenge-real-1", from: realPlayer.email, to: "teammate@example.com", teamId: realTeam.id, status: "pending" };
  const realScSession = { id: "sc-real-1", teamId: realTeam.id, title: "Real Lift" };
  const realScRsvp = { id: "sc-rsvp-real-1", sessionId: realScSession.id, email: realPlayer.email, playerId: realPlayer.email, teamId: realTeam.id };
  const realScLog = { id: "sc-log-real-1", sessionId: realScSession.id, email: realPlayer.email, playerId: realPlayer.email, teamId: realTeam.id };
  const realPriorities = { todayFocusText: "Real team focus", weeklyMakesTarget: 500 };
  const seed = {
    "sl:teams": [realTeam],
    "sl:players": [realPlayer],
    "sl:player-profiles": [],
    "sl:events": [realEvent],
    "sl:rsvps": [],
    "sl:scores": [realScore],
    "sl:program-scores": [realProgramScore],
    "sl:shotlogs": [realShot],
    "sl:challenges": [realChallenge],
    "sl:sc-sessions": [realScSession],
    "sl:sc-rsvps": [realScRsvp],
    "sl:sc-logs": [realScLog],
    "sl:coach-priorities": { [realTeam.id]: realPriorities },
    "sl:progress-snapshots": [],
  };

  await withBrowserStorage(seed, async (storage) => {
    const bundle = buildDemoDataBundle({ coachEmail: "coach.demo@shotlab.app" });
    await applyDemoData(bundle);

    assert.ok(rows(storage, "sl:teams").some((row) => row.id === realTeam.id));
    assert.ok(rows(storage, "sl:teams").some((row) => row.id === "team-demo-titans"));
    assert.ok(rows(storage, "sl:program-scores").some((row) => row.teamId === "team-demo-titans"));
    assert.ok(rows(storage, "sl:sc-sessions").some((row) => row.teamId === "team-demo-titans"));
    assert.equal(stored(storage, "sl:coach-priorities", {})[realTeam.id].todayFocusText, "Real team focus");
    assert.ok(stored(storage, "sl:coach-priorities", {})["team-demo-titans"]?.todayFocusText);

    const mutatedDemoPlayers = rows(storage, "sl:players").map((row) => row.teamId === "team-demo-titans" ? { ...row, name: "Corrupted Demo" } : row);
    storage.setItem("sl:players", JSON.stringify(mutatedDemoPlayers));
    await applyDemoData(bundle);
    assert.ok(rows(storage, "sl:players").some((row) => row.id === realPlayer.id && row.email === realPlayer.email));
    assert.ok(rows(storage, "sl:players").some((row) => row.teamId === "team-demo-titans" && row.name !== "Corrupted Demo"));

    await clearDemoData(bundle);
    assert.deepEqual(rows(storage, "sl:teams"), [realTeam]);
    assert.deepEqual(rows(storage, "sl:players"), [realPlayer]);
    assert.deepEqual(rows(storage, "sl:events"), [realEvent]);
    assert.deepEqual(rows(storage, "sl:scores"), [realScore]);
    assert.deepEqual(rows(storage, "sl:program-scores"), [realProgramScore]);
    assert.deepEqual(rows(storage, "sl:shotlogs"), [realShot]);
    assert.deepEqual(rows(storage, "sl:challenges"), [realChallenge]);
    assert.deepEqual(rows(storage, "sl:sc-sessions"), [realScSession]);
    assert.deepEqual(rows(storage, "sl:sc-rsvps"), [realScRsvp]);
    assert.deepEqual(rows(storage, "sl:sc-logs"), [realScLog]);
    assert.deepEqual(stored(storage, "sl:coach-priorities", {}), { [realTeam.id]: realPriorities });
    assert.deepEqual(stored(storage, "sl:demo-data-meta", {}), {});
  });
});

test("demo cleanup cannot delete a real row even when storage contains both tenants", async () => {
  const realRows = [
    { id: "real-event", teamId: "team-real-2", title: "Keep me" },
    { id: "demo-event", teamId: "team-demo-titans", title: "Remove me" },
  ];
  await withBrowserStorage({ "sl:events": realRows }, async (storage) => {
    const bundle = buildDemoDataBundle({ coachEmail: "coach.demo@shotlab.app" });
    await clearDemoData(bundle);
    assert.deepEqual(rows(storage, "sl:events"), [realRows[0]]);
  });
});