import test from "node:test";
import assert from "node:assert/strict";
import { hydrateAuthenticatedCollectionsToStorage } from "../src/lib/legacySignedCollectionPersistence.js";

const EMAIL = "registered.player@shotlab.test";
const TEAM_ID = "team-phase3c";

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
  "/v1/teams": { ok: true, teams: [{ id: TEAM_ID, name: "Phase 3C" }] },
  "/v1/players": { ok: true, players: [{ id: "player-1", email: EMAIL, role: "player", team_id: TEAM_ID }] },
  "/v1/player-profiles": { ok: true, profiles: [] },
  "/v1/scores": { ok: true, scores: [] },
  "/v1/program-scores": { ok: true, program_scores: [] },
  "/v1/shot-logs": {
    ok: true,
    shot_logs: [
      { id: "remote-confirmed", email: EMAIL, player_id: EMAIL, team_id: TEAM_ID, made: 20, date: "2026-09-03" },
    ],
  },
  "/v1/events": { ok: true, events: [] },
  "/v1/rsvps": { ok: true, rsvps: [] },
  "/v1/strength-conditioning": { ok: true, sessions: [], rsvps: [], logs: [] },
};

test("Phase 3C post-auth hydration preserves unsynced local shot truth while remote wins matching ids", async () => {
  const storage = memoryStorage([
    ["sl:session", JSON.stringify({ email: EMAIL, teamId: TEAM_ID })],
    ["sl:shotlogs", JSON.stringify([
      {
        id: "local-retry",
        email: EMAIL,
        playerId: EMAIL,
        teamId: TEAM_ID,
        made: 7,
        date: "2026-09-03",
        syncState: "failed_sync",
        syncError: "offline",
      },
      {
        id: "remote-confirmed",
        email: EMAIL,
        playerId: EMAIL,
        teamId: TEAM_ID,
        made: 3,
        date: "2026-09-03",
        syncState: "failed_sync",
        syncError: "stale-local",
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
  const rows = JSON.parse(storage.getItem("sl:shotlogs"));

  assert.deepEqual(rows.map((row) => [row.id, row.syncState, row.syncSource, row.made]), [
    ["local-retry", "failed_sync", "local", 7],
    ["remote-confirmed", "remote_saved", "remote", 20],
  ]);
  assert.equal(rows[0].syncError, "offline");
  assert.equal(rows[1].syncError || "", "");
});
