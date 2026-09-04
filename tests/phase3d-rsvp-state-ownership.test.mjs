import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createSchedulePersistenceService } from "../src/lib/schedulePersistenceService.js";
import {
  hydrateAuthenticatedCollectionsToStorage,
  requestLegacySignedCollection,
} from "../src/lib/legacySignedCollectionPersistence.js";
import {
  clearRsvpSyncPending,
  markRsvpSyncPending,
  readRsvpSyncPending,
  RSVP_SYNC_PENDING_KEY,
} from "../src/lib/rsvpSyncOwnership.js";
import { routeEnhancersFor } from "../scripts/run-route-enhancers.mjs";

const EMAIL = "phase3d.player@shotlab.test";
const TEAM_ID = "team-phase3d";

function memoryStorage(entries = []) {
  const values = new Map(entries);
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
}

function response(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function registeredStorage(rsvps = []) {
  return memoryStorage([
    ["sl:session", JSON.stringify({ email: EMAIL, teamId: TEAM_ID, role: "player" })],
    ["sl:players", JSON.stringify([{ id: "player-phase3d", email: EMAIL, teamId: TEAM_ID, role: "player" }])],
    ["sl:rsvps", JSON.stringify(rsvps)],
  ]);
}

const LOCAL_RSVP = {
  id: "rsvp-local",
  eventId: "event-phase3d",
  teamId: TEAM_ID,
  playerId: EMAIL,
  email: EMAIL,
  name: "Phase 3D Player",
  ts: 1,
};

const REMOTE_STALE_RSVP = {
  id: "rsvp-stale",
  event_id: "event-phase3d",
  team_id: TEAM_ID,
  player_id: EMAIL,
  email: EMAIL,
  name: "Phase 3D Player",
  ts: 2,
};

const hydrationPayloads = (remoteRsvps = []) => ({
  "/v1/teams": { ok: true, teams: [{ id: TEAM_ID, name: "Phase 3D" }] },
  "/v1/players": { ok: true, players: [{ id: "player-phase3d", email: EMAIL, role: "player", team_id: TEAM_ID }] },
  "/v1/player-profiles": { ok: true, profiles: [] },
  "/v1/scores": { ok: true, scores: [] },
  "/v1/program-scores": { ok: true, program_scores: [] },
  "/v1/shot-logs": { ok: true, shot_logs: [] },
  "/v1/events": { ok: true, events: [] },
  "/v1/rsvps": { ok: true, rsvps: remoteRsvps },
  "/v1/strength-conditioning": { ok: true, sessions: [], rsvps: [], logs: [] },
});

test("Phase 3D pending RSVP truth is scoped to the registered identity and team", () => {
  const storage = registeredStorage();
  const marker = markRsvpSyncPending({ storage, requester: EMAIL, teamId: TEAM_ID, now: 123 });

  assert.deepEqual(marker, {
    pending: true,
    requester: EMAIL,
    teamId: TEAM_ID,
    updatedAt: 123,
  });
  assert.equal(readRsvpSyncPending({ storage, requester: EMAIL, teamId: TEAM_ID })?.pending, true);
  assert.equal(readRsvpSyncPending({ storage, requester: EMAIL, teamId: "team-other" }), null);
  assert.equal(readRsvpSyncPending({ storage, requester: "other@shotlab.test", teamId: TEAM_ID }), null);
  assert.equal(clearRsvpSyncPending({ storage, requester: "other@shotlab.test", teamId: TEAM_ID }), false);
  assert.ok(storage.getItem(RSVP_SYNC_PENDING_KEY));
  assert.equal(clearRsvpSyncPending({ storage, requester: EMAIL, teamId: TEAM_ID }), true);
  assert.equal(storage.getItem(RSVP_SYNC_PENDING_KEY), null);
});

test("Phase 3D failed RSVP replacement keeps explicit pending truth and serves the intended local collection", async () => {
  const storage = registeredStorage([LOCAL_RSVP]);
  let calls = 0;
  const service = createSchedulePersistenceService({
    storage,
    fetchImpl: async () => {
      calls += 1;
      return response({ error: "offline" }, 503);
    },
  });

  await assert.rejects(
    () => service.syncRsvps([LOCAL_RSVP], { teamId: TEAM_ID }),
    /offline/,
  );
  assert.equal(readRsvpSyncPending({ storage, requester: EMAIL, teamId: TEAM_ID })?.pending, true);

  const loaded = await service.loadRsvps({ teamId: TEAM_ID });
  assert.equal(loaded.ok, true);
  assert.equal(loaded.storageMode, "local_pending");
  assert.equal(loaded.syncPending, true);
  assert.deepEqual(loaded.rows, [LOCAL_RSVP]);
  assert.equal(calls, 1, "pending local RSVP reads must not refetch stale remote truth through the schedule service");
});

test("Phase 3D successful RSVP replacement clears pending truth", async () => {
  const storage = registeredStorage([LOCAL_RSVP]);
  const service = createSchedulePersistenceService({
    storage,
    fetchImpl: async (path, init = {}) => {
      assert.equal(path, "/v1/rsvps");
      assert.equal(init.method, "POST");
      return response({ ok: true, storage_mode: "signed_api", rsvps: [REMOTE_STALE_RSVP] });
    },
  });

  const saved = await service.syncRsvps([LOCAL_RSVP], { teamId: TEAM_ID });
  assert.equal(saved.ok, true);
  assert.equal(readRsvpSyncPending({ storage, requester: EMAIL, teamId: TEAM_ID }), null);
});

test("Phase 3D final RSVP removal reaches the replacement API as an explicit empty collection", async () => {
  const storage = registeredStorage([]);
  let calls = 0;
  const service = createSchedulePersistenceService({
    storage,
    fetchImpl: async (path, init = {}) => {
      calls += 1;
      assert.equal(path, "/v1/rsvps");
      assert.equal(init.method, "POST");
      assert.deepEqual(JSON.parse(init.body), { team_id: TEAM_ID, rsvps: [] });
      return response({ ok: true, storage_mode: "signed_api", rsvps: [], deleted_count: 1 });
    },
  });

  const saved = await service.syncRsvps([], { teamId: TEAM_ID });
  assert.equal(saved.ok, true);
  assert.equal(saved.deletedCount, 1);
  assert.equal(calls, 1);
  assert.equal(readRsvpSyncPending({ storage, requester: EMAIL, teamId: TEAM_ID }), null);
});

test("Phase 3D legacy signed RSVP reads preserve pending local truth without contacting stale remote state", async () => {
  const storage = registeredStorage([LOCAL_RSVP]);
  markRsvpSyncPending({ storage, requester: EMAIL, teamId: TEAM_ID });
  let calls = 0;

  const result = await requestLegacySignedCollection({
    table: "rsvps",
    storage,
    fetchImpl: async () => {
      calls += 1;
      return response({ ok: true, rsvps: [REMOTE_STALE_RSVP] });
    },
  });

  assert.equal(result.error, null);
  assert.equal(result.storageMode, "local_pending");
  assert.equal(result.syncPending, true);
  assert.deepEqual(result.data, [LOCAL_RSVP]);
  assert.equal(calls, 0);
});

test("Phase 3D post-auth hydration preserves pending RSVP additions and pending empty deletion truth", async () => {
  for (const scenario of [
    { name: "addition", local: [LOCAL_RSVP], remote: [] },
    { name: "delete-final-rsvp", local: [], remote: [REMOTE_STALE_RSVP] },
  ]) {
    const storage = registeredStorage(scenario.local);
    markRsvpSyncPending({ storage, requester: EMAIL, teamId: TEAM_ID });
    const payloads = hydrationPayloads(scenario.remote);

    const result = await hydrateAuthenticatedCollectionsToStorage({
      storage,
      fetchImpl: async (path) => response(payloads[path]),
      expectedIdentity: EMAIL,
      expectedTeamId: TEAM_ID,
      groupAttempts: 1,
      sessionWaitMs: 20,
      sessionPollMs: 1,
    });

    assert.equal(result.ok, true, `${scenario.name}: ${result.failures.join(" | ")}`);
    assert.ok(result.pending.includes("sl:rsvps"), `${scenario.name}: pending RSVP state must remain explicit`);
    assert.deepEqual(JSON.parse(storage.getItem("sl:rsvps")), scenario.local, scenario.name);
  }
});

test("Phase 3D post-auth hydration ignores pending RSVP truth from a different team", async () => {
  const storage = registeredStorage([LOCAL_RSVP]);
  markRsvpSyncPending({ storage, requester: EMAIL, teamId: TEAM_ID });
  const activeTeamId = "team-phase3d-new";
  const remoteCurrentTeamRsvp = { ...REMOTE_STALE_RSVP, id: "rsvp-current-team", team_id: activeTeamId };
  const payloads = hydrationPayloads([remoteCurrentTeamRsvp]);

  const result = await hydrateAuthenticatedCollectionsToStorage({
    storage,
    fetchImpl: async (path) => response(payloads[path]),
    expectedIdentity: EMAIL,
    expectedTeamId: activeTeamId,
    groupAttempts: 1,
    sessionWaitMs: 20,
    sessionPollMs: 1,
  });

  assert.equal(result.ok, true, result.failures.join(" | "));
  assert.equal(result.pending.includes("sl:rsvps"), false);
  assert.deepEqual(JSON.parse(storage.getItem("sl:rsvps")), [remoteCurrentTeamRsvp]);
});

test("Phase 3D build authority sends empty RSVP replacement syncs through both App and the Supabase adapter", () => {
  const enhancer = readFileSync("scripts/apply-phase3d-rsvp-state-ownership.mjs", "utf8");
  const hydrationEnhancer = readFileSync("scripts/apply-post-auth-persistence-hydration.mjs", "utf8");
  assert.match(
    enhancer,
    /signedReplacementCollection = k === \"sl:rsvps\" \|\| k === \"sl:sc-sessions\"/,
  );
  assert.match(
    enhancer,
    /normalizedBody\.length === 0 && table !== \"rsvps\"/,
  );
  assert.match(
    hydrationEnhancer,
    /expectedIdentity:normalizeEmail\(p\.email\),expectedTeamId:p\.teamId\|\|\"\"/,
  );
  for (const mode of ["dev", "build"]) {
    assert.ok(routeEnhancersFor(mode).includes("scripts/apply-phase3d-rsvp-state-ownership.mjs"));
  }
});
