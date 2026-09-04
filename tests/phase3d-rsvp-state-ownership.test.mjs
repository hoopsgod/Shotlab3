import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { installApiIdentityFetchBridge } from "../src/lib/apiFetchBridge.js";
import {
  hydrateAuthenticatedCollectionsToStorage,
  requestLegacySignedCollection,
} from "../src/lib/legacySignedCollectionPersistence.js";
import { routeEnhancersFor } from "../scripts/run-route-enhancers.mjs";

const EMAIL = "phase3d.player@shotlab.test";
const TEAM_ID = "team-phase3d";
const RSVP_SYNC_PENDING_KEY = "sl:rp";
const rsvpScope = (requester = EMAIL, teamId = TEAM_ID) => `${requester.trim().toLowerCase()}\t${teamId.trim()}`;

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
    ["sl:session", JSON.stringify({ email: EMAIL, rp: rsvpScope(), role: "player" })],
    ["sl:players", JSON.stringify([{ id: "player-phase3d", email: EMAIL, teamId: TEAM_ID, role: "player" }])],
    ["sl:rsvps", JSON.stringify(rsvps)],
  ]);
}

function markPending(storage, requester = EMAIL, teamId = TEAM_ID) {
  storage.setItem(RSVP_SYNC_PENDING_KEY, rsvpScope(requester, teamId));
}

function isPending(storage, requester = EMAIL, teamId = TEAM_ID) {
  return storage.getItem(RSVP_SYNC_PENDING_KEY) === rsvpScope(requester, teamId);
}

function installBridge(storage, fetchImpl) {
  const target = {
    fetch: fetchImpl,
    localStorage: storage,
    location: { origin: "https://shotlab.test" },
    Response,
  };
  installApiIdentityFetchBridge(target);
  return target;
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
  markPending(storage);
  assert.equal(isPending(storage), true);
  assert.equal(isPending(storage, EMAIL, "team-other"), false);
  assert.equal(isPending(storage, "other@shotlab.test", TEAM_ID), false);
});

test("Phase 3D failed RSVP replacement keeps pending truth and signed reads serve the intended local collection", async () => {
  const storage = registeredStorage([LOCAL_RSVP]);
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return response({ error: "offline" }, 503);
  };
  const target = installBridge(storage, fetchImpl);

  const failed = await target.fetch("https://example.supabase.co/rest/v1/rsvps", {
    method: "POST",
    body: JSON.stringify([LOCAL_RSVP]),
  });
  assert.equal(failed.status, 503);
  assert.equal(isPending(storage), true);

  const loaded = await requestLegacySignedCollection({ table: "rsvps", storage, fetchImpl });
  assert.equal(loaded.error, null);
  assert.equal(loaded.storageMode, "local_pending");
  assert.deepEqual(loaded.data, [LOCAL_RSVP]);
  assert.equal(calls, 1, "pending signed RSVP reads must not refetch stale remote truth");
});

test("Phase 3D successful RSVP replacement clears pending truth", async () => {
  const storage = registeredStorage([LOCAL_RSVP]);
  const target = installBridge(storage, async (path, init = {}) => {
    assert.equal(path, "/v1/rsvps");
    assert.equal(init.method, "POST");
    return response({ ok: true, storage_mode: "signed_api", rsvps: [REMOTE_STALE_RSVP] });
  });

  const saved = await target.fetch("https://example.supabase.co/rest/v1/rsvps", {
    method: "POST",
    body: JSON.stringify([LOCAL_RSVP]),
  });
  assert.equal(saved.ok, true);
  assert.equal(isPending(storage), false);
});

test("Phase 3D final RSVP removal reaches the replacement API as an explicit empty collection", async () => {
  const storage = registeredStorage([]);
  let calls = 0;
  const target = installBridge(storage, async (path, init = {}) => {
    calls += 1;
    assert.equal(path, "/v1/rsvps");
    assert.equal(init.method, "POST");
    assert.deepEqual(JSON.parse(init.body), { team_id: TEAM_ID, rsvps: [] });
    return response({ ok: true, storage_mode: "signed_api", rsvps: [], deleted_count: 1 });
  });

  const saved = await target.fetch("https://example.supabase.co/rest/v1/rsvps", {
    method: "POST",
    body: JSON.stringify([]),
  });
  assert.equal(saved.ok, true);
  assert.equal(calls, 1);
  assert.equal(isPending(storage), false);
});

test("Phase 3D legacy signed RSVP reads preserve pending local truth without contacting stale remote state", async () => {
  const storage = registeredStorage([LOCAL_RSVP]);
  markPending(storage);
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
  assert.deepEqual(result.data, [LOCAL_RSVP]);
  assert.equal(calls, 0);
});

test("Phase 3D post-auth hydration preserves pending RSVP additions and pending empty deletion truth without stale RSVP fetches", async () => {
  for (const scenario of [
    { name: "addition", local: [LOCAL_RSVP], remote: [] },
    { name: "delete-final-rsvp", local: [], remote: [REMOTE_STALE_RSVP] },
  ]) {
    const storage = registeredStorage(scenario.local);
    markPending(storage);
    const payloads = hydrationPayloads(scenario.remote);
    const calls = [];

    const result = await hydrateAuthenticatedCollectionsToStorage({
      storage,
      fetchImpl: async (path) => {
        calls.push(path);
        return response(payloads[path]);
      },
      expectedIdentity: EMAIL,
      groupAttempts: 1,
      sessionWaitMs: 20,
      sessionPollMs: 1,
    });

    assert.equal(result.ok, true, `${scenario.name}: ${result.failures.join(" | ")}`);
    assert.ok(result.pending.includes("sl:rsvps"), `${scenario.name}: pending RSVP state must remain explicit`);
    assert.equal(calls.includes("/v1/rsvps"), false, `${scenario.name}: pending hydration must not refetch stale RSVP truth`);
    assert.deepEqual(JSON.parse(storage.getItem("sl:rsvps")), scenario.local, scenario.name);
  }
});

test("Phase 3D post-auth hydration ignores pending RSVP truth from a different team", async () => {
  const storage = registeredStorage([LOCAL_RSVP]);
  markPending(storage);
  const activeTeamId = "team-phase3d-new";
  storage.setItem("sl:session", JSON.stringify({ email: EMAIL, rp: rsvpScope(EMAIL, activeTeamId), role: "player" }));
  const remoteCurrentTeamRsvp = { ...REMOTE_STALE_RSVP, id: "rsvp-current-team", team_id: activeTeamId };
  const payloads = hydrationPayloads([remoteCurrentTeamRsvp]);

  const result = await hydrateAuthenticatedCollectionsToStorage({
    storage,
    fetchImpl: async (path) => response(payloads[path]),
    expectedIdentity: EMAIL,
    groupAttempts: 1,
    sessionWaitMs: 20,
    sessionPollMs: 1,
  });

  assert.equal(result.ok, true, result.failures.join(" | "));
  assert.equal(result.pending.includes("sl:rsvps"), false);
  assert.deepEqual(JSON.parse(storage.getItem("sl:rsvps")), [remoteCurrentTeamRsvp]);
});

test("Phase 3D build authority sends empty RSVP replacements without exposing RSVP scope to shared UI team state", () => {
  const enhancer = readFileSync("scripts/apply-phase3d-rsvp-state-ownership.mjs", "utf8");
  const hydrationEnhancer = readFileSync("scripts/apply-post-auth-persistence-hydration.mjs", "utf8");
  const bridge = readFileSync("src/lib/apiFetchBridge.js", "utf8");
  assert.match(enhancer, /signedReplacementCollection = k === \"sl:rsvps\" \|\| k === \"sl:sc-sessions\"/);
  assert.match(enhancer, /normalizedBody\.length === 0 && table !== \"rsvps\"/);
  assert.match(bridge, /resource === \"events\" \|\| resource === \"rsvps\"/);
  assert.match(bridge, /setItem\?\.\("sl:rp", pending\)/);
  const loginReplacement = hydrationEnhancer.match(/const earlyReplacement = `([\s\S]*?)`/u)?.[1] || "";
  assert.match(loginReplacement, /rp:normalizeEmail\(p\.email\)/);
  assert.doesNotMatch(loginReplacement, /,teamId:p\.teamId/);
  assert.match(hydrationEnhancer, /hydrateAuthenticatedCollectionsToStorage\(\{expectedIdentity:normalizeEmail\(p\.email\)\}\)/);
  for (const mode of ["dev", "build"]) {
    assert.ok(routeEnhancersFor(mode).includes("scripts/apply-phase3d-rsvp-state-ownership.mjs"));
  }
});
