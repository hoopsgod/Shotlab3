import test from "node:test";
import assert from "node:assert/strict";
import {
  createPlayerIdentityPersistenceService,
  hasPendingPlayerRows,
  reconcilePendingPlayerRows,
} from "../src/lib/playerIdentityPersistenceService.js";
import {
  hydrateAuthenticatedCollectionsToStorage,
  requestLegacySignedCollection,
} from "../src/lib/legacySignedCollectionPersistence.js";

const COACH = { id: "coach-id", email: "coach@example.com", name: "Coach", role: "coach", team_id: "team-a" };
const PLAYER = { id: "player-id", email: "player@example.com", name: "Player", role: "player", team_id: "team-a" };

function memoryStorage(entries = []) {
  const values = new Map(entries);
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    json(key) { const raw = values.get(key); return raw ? JSON.parse(raw) : null; },
  };
}

function response(payload, status = 200) {
  return Response.json(payload, { status });
}

test("failed coach replacement preserves the same-team local roster snapshot across stale signed reads", async () => {
  const local = [COACH, { ...PLAYER, name: "Pending Name" }];
  const storage = memoryStorage([
    ["sl:session", JSON.stringify({ email: COACH.email, role: "coach", teamId: "team-a" })],
    ["sl:players", JSON.stringify(local)],
  ]);
  let phase = "write";
  const service = createPlayerIdentityPersistenceService({
    storage,
    fetchImpl: async () => phase === "write"
      ? response({ error: "player_sync_failed" }, 500)
      : response({ ok: true, storage_mode: "signed_api", players: [COACH, PLAYER] }),
  });

  await assert.rejects(service.syncPlayers(local), /player_sync_failed/);
  assert.equal(hasPendingPlayerRows(storage), true);

  phase = "read";
  const loaded = await service.loadPlayers();
  assert.equal(loaded.rows.find((row) => row.id === "player-id")?.name, "Pending Name");
  assert.equal(hasPendingPlayerRows(storage), true);
});

test("failed requester deletion stays absent instead of being resurrected by stale remote identity truth", async () => {
  const storage = memoryStorage([
    ["sl:session", JSON.stringify({ email: PLAYER.email, role: "player", teamId: "team-a" })],
    ["sl:players", "[]"],
  ]);
  let phase = "write";
  const service = createPlayerIdentityPersistenceService({
    storage,
    fetchImpl: async () => phase === "write"
      ? response({ error: "player_sync_failed" }, 500)
      : response({ ok: true, storage_mode: "signed_api", players: [PLAYER] }),
  });

  await assert.rejects(service.syncPlayers([]), /player_sync_failed/);
  phase = "read";
  const loaded = await service.loadPlayers();
  assert.deepEqual(loaded.rows, []);
  assert.equal(hasPendingPlayerRows(storage), true);
});

test("successful retry clears pending ownership so subsequent remote truth is authoritative", async () => {
  const pending = [COACH, { ...PLAYER, name: "Pending Name" }];
  const storage = memoryStorage([
    ["sl:session", JSON.stringify({ email: COACH.email, role: "coach", teamId: "team-a" })],
    ["sl:players", JSON.stringify(pending)],
    ["sl:ip", `${COACH.email}\tteam-a`],
  ]);
  let method = "POST";
  const service = createPlayerIdentityPersistenceService({
    storage,
    fetchImpl: async (_input, init = {}) => {
      method = String(init.method || "GET").toUpperCase();
      return method === "POST"
        ? response({ ok: true, storage_mode: "signed_api", players: pending })
        : response({ ok: true, storage_mode: "signed_api", players: [COACH, { ...PLAYER, name: "Confirmed Remote" }] });
    },
  });

  await service.syncPlayers(pending);
  assert.equal(hasPendingPlayerRows(storage), false);
  const loaded = await service.loadPlayers();
  assert.equal(loaded.rows.find((row) => row.id === "player-id")?.name, "Confirmed Remote");
});

test("pending player ownership is requester/team scoped and cannot override another session", () => {
  const storage = memoryStorage([
    ["sl:session", JSON.stringify({ email: "other@example.com", role: "coach", teamId: "team-b" })],
    ["sl:players", JSON.stringify([{ id: "local", email: "other@example.com", role: "coach", team_id: "team-b" }])],
    ["sl:ip", `${COACH.email}\tteam-a`],
  ]);
  const remote = [{ id: "remote", email: "other@example.com", role: "coach", team_id: "team-b" }];
  assert.equal(hasPendingPlayerRows(storage), false);
  assert.deepEqual(reconcilePendingPlayerRows({ storage, remoteRows: remote }), remote);
});

test("legacy signed player reads use the same pending snapshot without contacting stale remote state", async () => {
  const pending = [COACH, { ...PLAYER, name: "Pending Name" }];
  const storage = memoryStorage([
    ["sl:session", JSON.stringify({ email: COACH.email, role: "coach", teamId: "team-a" })],
    ["sl:players", JSON.stringify(pending)],
    ["sl:ip", `${COACH.email}\tteam-a`],
  ]);
  let calls = 0;
  const result = await requestLegacySignedCollection({
    table: "players",
    storage,
    fetchImpl: async () => { calls += 1; return response({ ok: true, players: [COACH, PLAYER] }); },
  });
  assert.equal(calls, 0);
  assert.equal(result.storageMode, "local_pending");
  assert.equal(result.data.find((row) => row.id === "player-id")?.name, "Pending Name");
});

test("post-auth hydration preserves pending requester deletion and reports it as pending rather than broken identity hydration", async () => {
  const storage = memoryStorage([
    ["sl:session", JSON.stringify({ email: PLAYER.email, role: "player", teamId: "team-a" })],
    ["sl:players", "[]"],
    ["sl:ip", `${PLAYER.email}\tteam-a`],
  ]);
  const fetchImpl = async (input) => {
    const path = String(input).split("?")[0];
    if (path === "/v1/teams") return response({ ok: true, teams: [] });
    if (path === "/v1/players") return response({ ok: true, players: [PLAYER] });
    if (path === "/v1/player-profiles") return response({ ok: true, profiles: [] });
    if (path === "/v1/scores") return response({ ok: true, scores: [] });
    if (path === "/v1/program-scores") return response({ ok: true, program_scores: [] });
    if (path === "/v1/shot-logs") return response({ ok: true, shot_logs: [] });
    if (path === "/v1/events") return response({ ok: true, events: [] });
    if (path === "/v1/rsvps") return response({ ok: true, rsvps: [] });
    if (path === "/v1/strength-conditioning") return response({ ok: true, sessions: [], rsvps: [], logs: [] });
    throw new Error(`unexpected_path:${path}`);
  };

  const result = await hydrateAuthenticatedCollectionsToStorage({
    fetchImpl,
    storage,
    expectedIdentity: PLAYER.email,
    groupAttempts: 1,
  });

  assert.equal(result.ok, true);
  assert.equal(result.identityHydrated, false);
  assert.equal(result.pending.includes("sl:players"), true);
  assert.deepEqual(storage.json("sl:players"), []);
  assert.equal(result.failures.includes("sl:players:authenticated_identity_missing"), false);
});
