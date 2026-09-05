import test from "node:test";
import assert from "node:assert/strict";
import { hydrateAuthenticatedCollectionsToStorage } from "../src/lib/legacySignedCollectionPersistence.js";

const EMAIL = "registered.coach@shotlab.test";
const TEAM_ID = "team-phase3e";

function memoryStorage(entries = []) {
  const values = new Map(entries);
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
  };
}

function response(payload) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

const payloads = {
  "/v1/teams": { ok: true, teams: [{ id: TEAM_ID, name: "Phase 3E" }] },
  "/v1/players": { ok: true, players: [{ id: "coach-1", email: EMAIL, role: "coach", team_id: TEAM_ID }] },
  "/v1/player-profiles": { ok: true, profiles: [] },
  "/v1/scores": { ok: true, scores: [] },
  "/v1/program-scores": { ok: true, program_scores: [] },
  "/v1/shot-logs": { ok: true, shot_logs: [] },
  "/v1/events": {
    ok: true,
    events: [
      {
        id: "remote-confirmed",
        team_id: TEAM_ID,
        title: "Remote Updated Practice",
        date: "2026-09-06",
        time: "17:30",
        location: "Main Gym",
        description: "Remote authority",
        type: "practice",
      },
    ],
  },
  "/v1/rsvps": { ok: true, rsvps: [] },
  "/v1/strength-conditioning": { ok: true, sessions: [], rsvps: [], logs: [] },
};

test("Phase 3E post-auth hydration preserves local-only events while remote wins matching ids", async () => {
  const storage = memoryStorage([
    ["sl:session", JSON.stringify({ email: EMAIL, teamId: TEAM_ID })],
    ["sl:events", JSON.stringify([
      {
        id: "local-unsynced",
        teamId: TEAM_ID,
        ownerCoachId: EMAIL,
        title: "Offline-added practice",
        date: "2026-09-07",
        time: "16:00",
        location: "Aux Gym",
        desc: "Keep this local event",
        type: "practice",
      },
      {
        id: "remote-confirmed",
        teamId: TEAM_ID,
        ownerCoachId: EMAIL,
        title: "Stale Local Practice",
        date: "2026-09-06",
        time: "16:30",
        location: "Old Gym",
        desc: "Stale local copy",
        type: "practice",
      },
    ])],
  ]);

  const result = await hydrateAuthenticatedCollectionsToStorage({
    storage,
    fetchImpl: async (path) => response(payloads[path]),
    expectedIdentity: EMAIL,
    groupAttempts: 1,
    sessionWaitMs: 20,
    sessionPollMs: 1,
  });

  assert.equal(result.ok, true, result.failures.join(" | "));
  const rows = JSON.parse(storage.getItem("sl:events"));

  assert.deepEqual(rows.map((row) => [row.id, row.title, row.location]), [
    ["local-unsynced", "Offline-added practice", "Aux Gym"],
    ["remote-confirmed", "Remote Updated Practice", "Main Gym"],
  ]);
  assert.equal(rows[0].ownerCoachId, EMAIL);
  assert.equal(rows[1].desc, "Remote authority");
});
